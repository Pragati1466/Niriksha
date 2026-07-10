"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Base Repository

Description:
    This module provides the base repository class with common CRUD operations
    that all other repositories inherit from. It implements standard database
    operations with filtering, pagination, and error handling.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import TypeVar, Type, Generic, Optional, Any, List
from uuid import UUID

from sqlalchemy import select, update, delete, func, and_, or_
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

from ..database.models.base import Base


ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """
    Base repository class with common CRUD operations.
    
    This class provides a standard interface for database operations including
    create, read, update, delete, and query functionality. All specific
    repositories should inherit from this class and extend it as needed.
    
    Attributes:
        model: The SQLAlchemy model class this repository manages
        session: The database session
    """
    
    def __init__(self, model: Type[ModelType], session: Session):
        """
        Initialize the repository.
        
        Args:
            model: The SQLAlchemy model class
            session: The database session
        """
        self.model = model
        self.session = session
    
    def get(self, id: UUID) -> Optional[ModelType]:
        """
        Get a single entity by ID.
        
        Args:
            id: The UUID of the entity
            
        Returns:
            Optional[ModelType]: The entity if found, None otherwise
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            return self.session.get(self.model, id)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error getting {self.model.__name__} with id {id}")
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[ModelType]:
        """
        Get all entities with optional filtering and pagination.
        
        Args:
            skip: Number of records to skip (offset)
            limit: Maximum number of records to return
            filters: Dictionary of field names and values to filter by
            
        Returns:
            List[ModelType]: List of entities
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            query = select(self.model)
            
            # Apply filters if provided
            if filters:
                query = self._apply_filters(query, filters)
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            result = self.session.execute(query)
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error getting all {self.model.__name__}")
    
    def create(self, entity: ModelType) -> ModelType:
        """
        Create a new entity.
        
        Args:
            entity: The entity to create
            
        Returns:
            ModelType: The created entity with ID assigned
            
        Raises:
            IntegrityError: If constraint violation occurs
            SQLAlchemyError: If database operation fails
        """
        try:
            self.session.add(entity)
            self.session.commit()
            self.session.refresh(entity)
            return entity
        except IntegrityError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Integrity error creating {self.model.__name__}")
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error creating {self.model.__name__}")
    
    def create_bulk(self, entities: List[ModelType]) -> List[ModelType]:
        """
        Create multiple entities in a single transaction.
        
        Args:
            entities: List of entities to create
            
        Returns:
            List[ModelType]: List of created entities with IDs assigned
            
        Raises:
            IntegrityError: If constraint violation occurs
            SQLAlchemyError: If database operation fails
        """
        try:
            self.session.add_all(entities)
            self.session.commit()
            for entity in entities:
                self.session.refresh(entity)
            return entities
        except IntegrityError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Integrity error creating bulk {self.model.__name__}")
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error creating bulk {self.model.__name__}")
    
    def update(self, entity: ModelType) -> ModelType:
        """
        Update an existing entity.
        
        Args:
            entity: The entity with updated values
            
        Returns:
            ModelType: The updated entity
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            self.session.merge(entity)
            self.session.commit()
            self.session.refresh(entity)
            return entity
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error updating {self.model.__name__}")
    
    def update_by_id(self, id: UUID, updates: dict) -> Optional[ModelType]:
        """
        Update an entity by ID with a dictionary of updates.
        
        Args:
            id: The UUID of the entity to update
            updates: Dictionary of field names and new values
            
        Returns:
            Optional[ModelType]: The updated entity if found, None otherwise
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            entity = self.get(id)
            if entity is None:
                return None
            
            for field, value in updates.items():
                if hasattr(entity, field):
                    setattr(entity, field, value)
            
            self.session.commit()
            self.session.refresh(entity)
            return entity
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error updating {self.model.__name__} with id {id}")
    
    def delete(self, entity: ModelType) -> bool:
        """
        Delete an entity.
        
        Args:
            entity: The entity to delete
            
        Returns:
            bool: True if deleted successfully
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            self.session.delete(entity)
            self.session.commit()
            return True
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error deleting {self.model.__name__}")
    
    def delete_by_id(self, id: UUID) -> bool:
        """
        Delete an entity by ID.
        
        Args:
            id: The UUID of the entity to delete
            
        Returns:
            bool: True if deleted successfully, False if not found
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            entity = self.get(id)
            if entity is None:
                return False
            
            return self.delete(entity)
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error deleting {self.model.__name__} with id {id}")
    
    def exists(self, id: UUID) -> bool:
        """
        Check if an entity exists by ID.
        
        Args:
            id: The UUID of the entity
            
        Returns:
            bool: True if entity exists, False otherwise
        """
        try:
            return self.get(id) is not None
        except SQLAlchemyError:
            return False
    
    def count(self, filters: Optional[dict] = None) -> int:
        """
        Count entities with optional filtering.
        
        Args:
            filters: Dictionary of field names and values to filter by
            
        Returns:
            int: Count of entities
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            query = select(func.count()).select_from(self.model)
            
            # Apply filters if provided
            if filters:
                query = self._apply_filters(query, filters)
            
            result = self.session.execute(query)
            return result.scalar()
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error counting {self.model.__name__}")
    
    def find_by_field(self, field_name: str, value: Any) -> List[ModelType]:
        """
        Find entities by a specific field value.
        
        Args:
            field_name: Name of the field to filter by
            value: Value to match
            
        Returns:
            List[ModelType]: List of matching entities
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            query = select(self.model).where(getattr(self.model, field_name) == value)
            result = self.session.execute(query)
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error finding {self.model.__name__} by {field_name}")
    
    def find_by_fields(self, filters: dict) -> List[ModelType]:
        """
        Find entities by multiple field values.
        
        Args:
            filters: Dictionary of field names and values to match
            
        Returns:
            List[ModelType]: List of matching entities
            
        Raises:
            SQLAlchemyError: If database operation fails
        """
        try:
            query = select(self.model)
            query = self._apply_filters(query, filters)
            result = self.session.execute(query)
            return list(result.scalars().all())
        except SQLAlchemyError as e:
            self.session.rollback()
            raise self._handle_error(e, f"Error finding {self.model.__name__} by fields")
    
    def _apply_filters(self, query, filters: dict):
        """
        Apply filters to a SQLAlchemy query.
        
        Args:
            query: The SQLAlchemy query
            filters: Dictionary of field names and values
            
        Returns:
            The filtered query
        """
        conditions = []
        for field_name, value in filters.items():
            if hasattr(self.model, field_name):
                field = getattr(self.model, field_name)
                
                # Handle different value types
                if isinstance(value, list):
                    # IN clause for list values
                    conditions.append(field.in_(value))
                elif isinstance(value, dict) and "$like" in value:
                    # LIKE clause for pattern matching
                    conditions.append(field.like(value["$like"]))
                elif isinstance(value, dict) and "$ilike" in value:
                    # ILIKE clause for case-insensitive matching
                    conditions.append(field.ilike(value["$ilike"]))
                elif isinstance(value, dict) and "$ne" in value:
                    # Not equal clause
                    conditions.append(field != value["$ne"])
                elif isinstance(value, dict) and "$gt" in value:
                    # Greater than clause
                    conditions.append(field > value["$gt"])
                elif isinstance(value, dict) and "$gte" in value:
                    # Greater than or equal clause
                    conditions.append(field >= value["$gte"])
                elif isinstance(value, dict) and "$lt" in value:
                    # Less than clause
                    conditions.append(field < value["$lt"])
                elif isinstance(value, dict) and "$lte" in value:
                    # Less than or equal clause
                    conditions.append(field <= value["$lte"])
                else:
                    # Exact match
                    conditions.append(field == value)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        return query
    
    def _handle_error(self, error: SQLAlchemyError, message: str) -> Exception:
        """
        Handle database errors with consistent formatting.
        
        Args:
            error: The SQLAlchemy error
            message: Custom error message
            
        Returns:
            Exception: Formatted exception
        """
        # In production, you might want to log this error
        # and potentially sanitize the error message
        return Exception(f"{message}: {str(error)}")
    
    def begin_transaction(self):
        """
        Begin a database transaction.
        
        Use this when you need to perform multiple operations atomically.
        Remember to call commit_transaction() or rollback_transaction().
        """
        self.session.begin()
    
    def commit_transaction(self):
        """
        Commit the current transaction.
        """
        self.session.commit()
    
    def rollback_transaction(self):
        """
        Rollback the current transaction.
        """
        self.session.rollback()
    
    def flush(self):
        """
        Flush pending changes to the database without committing.
        
        This is useful for getting auto-generated IDs before committing.
        """
        self.session.flush()
