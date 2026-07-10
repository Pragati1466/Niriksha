"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Base Service

Description:
    This module provides the base service class with common functionality
    that all other services inherit from. It implements business logic
    orchestration, validation, and error handling patterns.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import TypeVar, Type, Generic, Optional, Any, List
from uuid import UUID
from sqlalchemy.orm import Session

from ..repositories.base_repository import BaseRepository
from ..database.models.base import Base


ModelType = TypeVar("ModelType", bound=Base)
RepositoryType = TypeVar("RepositoryType", bound=BaseRepository)


class BaseService(Generic[ModelType, RepositoryType]):
    """
    Base service class with common business logic functionality.
    
    This class provides a standard interface for business logic operations,
    including validation, orchestration, and error handling. All specific
    services should inherit from this class and extend it as needed.
    
    Attributes:
        repository: The repository instance for data access
        session: The database session
    """
    
    def __init__(self, repository: RepositoryType, session: Session):
        """
        Initialize the service.
        
        Args:
            repository: The repository instance
            session: The database session
        """
        self.repository = repository
        self.session = session
    
    def get_by_id(self, id: UUID) -> Optional[ModelType]:
        """
        Get an entity by ID.
        
        Args:
            id: The UUID of the entity
            
        Returns:
            Optional[ModelType]: The entity if found, None otherwise
            
        Raises:
            Exception: If operation fails
        """
        try:
            return self.repository.get(id)
        except Exception as e:
            self._handle_error(e, f"Error getting entity with id {id}")
    
    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[ModelType]:
        """
        Get all entities with optional filtering and pagination.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Dictionary of field names and values to filter by
            
        Returns:
            List[ModelType]: List of entities
            
        Raises:
            Exception: If operation fails
        """
        try:
            return self.repository.get_all(skip=skip, limit=limit, filters=filters)
        except Exception as e:
            self._handle_error(e, "Error getting all entities")
    
    def create(self, entity: ModelType) -> ModelType:
        """
        Create a new entity with validation.
        
        Args:
            entity: The entity to create
            
        Returns:
            ModelType: The created entity
            
        Raises:
            Exception: If operation fails or validation fails
        """
        try:
            # Validate before creation
            self.validate_before_create(entity)
            
            # Create the entity
            created_entity = self.repository.create(entity)
            
            # Post-create validation
            self.validate_after_create(created_entity)
            
            return created_entity
        except Exception as e:
            self._handle_error(e, "Error creating entity")
    
    def create_bulk(self, entities: List[ModelType]) -> List[ModelType]:
        """
        Create multiple entities with validation.
        
        Args:
            entities: List of entities to create
            
        Returns:
            List[ModelType]: List of created entities
            
        Raises:
            Exception: If operation fails or validation fails
        """
        try:
            # Validate all entities before creation
            for entity in entities:
                self.validate_before_create(entity)
            
            # Create all entities
            created_entities = self.repository.create_bulk(entities)
            
            # Post-create validation
            for entity in created_entities:
                self.validate_after_create(entity)
            
            return created_entities
        except Exception as e:
            self._handle_error(e, "Error creating bulk entities")
    
    def update(self, entity: ModelType) -> ModelType:
        """
        Update an existing entity with validation.
        
        Args:
            entity: The entity with updated values
            
        Returns:
            ModelType: The updated entity
            
        Raises:
            Exception: If operation fails or validation fails
        """
        try:
            # Validate before update
            self.validate_before_update(entity)
            
            # Update the entity
            updated_entity = self.repository.update(entity)
            
            # Post-update validation
            self.validate_after_update(updated_entity)
            
            return updated_entity
        except Exception as e:
            self._handle_error(e, "Error updating entity")
    
    def delete(self, id: UUID) -> bool:
        """
        Delete an entity with validation.
        
        Args:
            id: The UUID of the entity to delete
            
        Returns:
            bool: True if deleted successfully
            
        Raises:
            Exception: If operation fails or validation fails
        """
        try:
            # Get the entity first
            entity = self.get_by_id(id)
            if entity is None:
                raise Exception(f"Entity with id {id} not found")
            
            # Validate before deletion
            self.validate_before_delete(entity)
            
            # Delete the entity
            return self.repository.delete(entity)
        except Exception as e:
            self._handle_error(e, f"Error deleting entity with id {id}")
    
    def exists(self, id: UUID) -> bool:
        """
        Check if an entity exists by ID.
        
        Args:
            id: The UUID of the entity
            
        Returns:
            bool: True if entity exists, False otherwise
        """
        try:
            return self.repository.exists(id)
        except Exception as e:
            self._handle_error(e, f"Error checking existence of entity {id}")
            return False
    
    def count(self, filters: Optional[dict] = None) -> int:
        """
        Count entities with optional filtering.
        
        Args:
            filters: Dictionary of field names and values to filter by
            
        Returns:
            int: Count of entities
            
        Raises:
            Exception: If operation fails
        """
        try:
            return self.repository.count(filters=filters)
        except Exception as e:
            self._handle_error(e, "Error counting entities")
    
    # ============================================================================
    # Validation Hooks (to be overridden in subclasses)
    # ============================================================================
    
    def validate_before_create(self, entity: ModelType) -> None:
        """
        Validate entity before creation.
        
        Override this method in subclasses to implement custom validation.
        
        Args:
            entity: The entity to validate
            
        Raises:
            ValueError: If validation fails
        """
        pass
    
    def validate_after_create(self, entity: ModelType) -> None:
        """
        Validate entity after creation.
        
        Override this method in subclasses to implement custom validation.
        
        Args:
            entity: The created entity
            
        Raises:
            ValueError: If validation fails
        """
        pass
    
    def validate_before_update(self, entity: ModelType) -> None:
        """
        Validate entity before update.
        
        Override this method in subclasses to implement custom validation.
        
        Args:
            entity: The entity to validate
            
        Raises:
            ValueError: If validation fails
        """
        pass
    
    def validate_after_update(self, entity: ModelType) -> None:
        """
        Validate entity after update.
        
        Override this method in subclasses to implement custom validation.
        
        Args:
            entity: The updated entity
            
        Raises:
            ValueError: If validation fails
        """
        pass
    
    def validate_before_delete(self, entity: ModelType) -> None:
        """
        Validate entity before deletion.
        
        Override this method in subclasses to implement custom validation.
        
        Args:
            entity: The entity to validate
            
        Raises:
            ValueError: If validation fails
        """
        pass
    
    # ============================================================================
    # Error Handling
    # ============================================================================
    
    def _handle_error(self, error: Exception, message: str) -> None:
        """
        Handle errors with consistent formatting and logging.
        
        Args:
            error: The exception that occurred
            message: Custom error message
            
        Raises:
            Exception: Formatted exception
        """
        # In production, you would log this error here
        # logger.error(f"{message}: {str(error)}")
        raise Exception(f"{message}: {str(error)}")
    
    # ============================================================================
    # Transaction Management
    # ============================================================================
    
    def begin_transaction(self) -> None:
        """
        Begin a database transaction.
        
        Use this when you need to perform multiple operations atomically.
        Remember to call commit_transaction() or rollback_transaction().
        """
        self.repository.begin_transaction()
    
    def commit_transaction(self) -> None:
        """
        Commit the current transaction.
        """
        self.repository.commit_transaction()
    
    def rollback_transaction(self) -> None:
        """
        Rollback the current transaction.
        """
        self.repository.rollback_transaction()
    
    # ============================================================================
    # Utility Methods
    # ============================================================================
    
    def flush(self) -> None:
        """
        Flush pending changes to the database without committing.
        
        This is useful for getting auto-generated IDs before committing.
        """
        self.repository.flush()
