"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Base Model Module

Description:
    This module provides the base SQLAlchemy model class that all other models
    inherit from. It includes common fields, methods, and functionality that are
    shared across all database models in the inspection workflow module.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column


class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy models in the inspection workflow module.
    
    This class provides common functionality and attributes that are shared
    across all models, including:
    - Automatic table name generation
    - Common audit fields (created_at, updated_at)
    - UUID primary key generation
    - String representation methods
    
    Attributes:
        __tablename__: Automatically generated from class name (lowercase, plural)
        __table_args__: Additional table arguments (can be overridden)
    """
    
    @declared_attr.directive
    def __tablename__(cls) -> str:
        """
        Automatically generate table name from class name.
        
        Converts CamelCase class names to snake_case table names.
        Example: InspectionModel -> inspection_models
        
        Returns:
            str: Generated table name
        """
        # Convert CamelCase to snake_case and make plural
        name = cls.__name__
        # Simple conversion: add 's' for plural
        # For more complex pluralization, use inflection library
        return name.lower() + 's'
    
    __table_args__ = {'schema': 'public'}
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert model instance to dictionary.
        
        This method provides a convenient way to serialize model instances
        to dictionaries, useful for API responses and JSON serialization.
        
        Returns:
            dict: Dictionary representation of the model instance
        """
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            # Convert UUID to string for JSON serialization
            if isinstance(value, UUID):
                value = str(value)
            # Convert datetime to ISO format string
            elif isinstance(value, datetime):
                value = value.isoformat()
            result[column.name] = value
        return result
    
    def __repr__(self) -> str:
        """
        String representation of the model instance.
        
        Provides a human-readable representation of the model,
        showing the class name and primary key.
        
        Returns:
            str: String representation
        """
        class_name = self.__class__.__name__
        # Try to get primary key value
        pk = getattr(self, 'id', None)
        if pk is not None:
            return f"{class_name}(id={pk})"
        return f"{class_name}()"


class TimestampMixin:
    """
    Mixin class providing timestamp fields for models.
    
    This mixin adds created_at and updated_at timestamp fields
    to any model that inherits from it. These fields are essential
    for audit trails and data freshness tracking.
    
    Attributes:
        created_at: Timestamp when the record was created
        updated_at: Timestamp when the record was last updated
    """
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        doc="Timestamp when the record was created"
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        doc="Timestamp when the record was last updated"
    )


class UUIDMixin:
    """
    Mixin class providing UUID primary key for models.
    
    This mixin adds a UUID primary key field to any model that inherits
    from it. UUIDs are preferred over auto-increment integers for:
    - Distributed systems
    - Security (non-guessable IDs)
    - Multi-tenant architectures
    - Offline-first applications
    
    Attributes:
        id: UUID primary key with auto-generation
    """
    
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        nullable=False,
        doc="Unique identifier for the record"
    )


class SoftDeleteMixin:
    """
    Mixin class providing soft delete functionality.
    
    This mixin adds fields for soft delete functionality, allowing
    records to be marked as deleted without actually removing them
    from the database. This is useful for:
    - Audit trail preservation
    - Data recovery
    - Referential integrity
    
    Attributes:
        deleted_at: Timestamp when the record was soft deleted (null if not deleted)
        is_deleted: Boolean flag indicating if the record is deleted
    """
    
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
        doc="Timestamp when the record was soft deleted"
    )
    
    is_deleted: Mapped[bool] = mapped_column(
        default=False,
        nullable=False,
        index=True,
        doc="Flag indicating if the record is deleted"
    )
    
    def soft_delete(self) -> None:
        """
        Mark the record as deleted without removing it from the database.
        
        This method sets the deleted_at timestamp and is_deleted flag.
        The record remains in the database but is excluded from queries
        that filter out deleted records.
        """
        from datetime import timezone
        self.deleted_at = datetime.now(timezone.utc)
        self.is_deleted = True
    
    def restore(self) -> None:
        """
        Restore a soft-deleted record.
        
        This method clears the deleted_at timestamp and resets the
        is_deleted flag, making the record active again.
        """
        self.deleted_at = None
        self.is_deleted = False


class VersionMixin:
    """
    Mixin class providing optimistic locking version field.
    
    This mixin adds a version field for optimistic locking, which helps
    prevent concurrent modification conflicts. The version is incremented
    on each update and checked during updates to detect conflicts.
    
    Attributes:
        version: Integer version number for optimistic locking
    """
    
    version: Mapped[int] = mapped_column(
        default=1,
        nullable=False,
        doc="Version number for optimistic locking"
    )


class AuditMixin:
    """
    Mixin class providing audit trail fields.
    
    This mixin adds fields for tracking who created and last modified
    a record, which is essential for compliance and accountability.
    
    Attributes:
        created_by: ID of the user who created the record
        updated_by: ID of the user who last updated the record
    """
    
    created_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the user who created the record"
    )
    
    updated_by: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the user who last updated the record"
    )


class BaseModel(Base, UUIDMixin, TimestampMixin):
    """
    Base model class combining common mixins.
    
    This is the recommended base class for most models in the
    inspection workflow module. It combines:
    - Base SQLAlchemy functionality
    - UUID primary key
    - Timestamp fields (created_at, updated_at)
    
    Example:
        class Inspection(BaseModel):
            __tablename__ = 'inspections'
            status: Mapped[str] = mapped_column(String(50))
            priority: Mapped[str] = mapped_column(String(20))
    """
    
    pass


class AuditedModel(BaseModel, AuditMixin):
    """
    Base model class with audit trail fields.
    
    This class extends BaseModel with audit fields, suitable for
    models that require tracking of who created and modified records.
    
    Example:
        class InspectionNote(AuditedModel):
            __tablename__ = 'inspection_notes'
            content: Mapped[str] = mapped_column(Text)
    """
    
    pass


class VersionedModel(BaseModel, VersionMixin):
    """
    Base model class with optimistic locking.
    
    This class extends BaseModel with version field, suitable for
    models that require optimistic locking to prevent concurrent
    modification conflicts.
    
    Example:
        class Inspection(VersionedModel):
            __tablename__ = 'inspections'
            status: Mapped[str] = mapped_column(String(50))
    """
    
    pass


class SoftDeleteModel(BaseModel, SoftDeleteMixin):
    """
    Base model class with soft delete functionality.
    
    This class extends BaseModel with soft delete fields, suitable
    for models that should not be physically deleted from the database.
    
    Example:
        class ChecklistTemplate(SoftDeleteModel):
            __tablename__ = 'checklist_templates'
            name: Mapped[str] = mapped_column(String(255))
    """
    
    pass


class FullModel(BaseModel, AuditMixin, VersionMixin, SoftDeleteMixin):
    """
    Base model class with all mixins.
    
    This class combines all mixins for models that require the full
    set of features: audit trail, optimistic locking, and soft delete.
    
    Example:
        class Inspection(FullModel):
            __tablename__ = 'inspections'
            status: Mapped[str] = mapped_column(String(50))
    """
    
    pass
