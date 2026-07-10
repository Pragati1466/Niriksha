"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Sync Conflict Model

Description:
    This module defines the SyncConflict model for storing and tracking
    data conflicts that occur during offline synchronization.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class ConflictType:
    """Enumeration of conflict types."""
    UPDATE_UPDATE = "update_update"
    CREATE_CREATE = "create_create"
    DELETE_UPDATE = "delete_update"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.UPDATE_UPDATE, cls.CREATE_CREATE, cls.DELETE_UPDATE]


class ResolutionStatus:
    """Enumeration of conflict resolution statuses."""
    PENDING = "pending"
    RESOLVED_SERVER = "resolved_server"
    RESOLVED_LOCAL = "resolved_local"
    RESOLVED_MERGE = "resolved_merge"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.PENDING, cls.RESOLVED_SERVER, cls.RESOLVED_LOCAL, cls.RESOLVED_MERGE]
    
    @classmethod
    def is_resolved(cls, status: str) -> bool:
        return status != cls.PENDING


class SyncConflict(BaseModel):
    """
    Model for storing and tracking sync conflicts.
    
    Offline work can create conflicts when syncing. This table manages
    conflict resolution with diff tracking.
    """
    
    __tablename__ = "sync_conflicts"
    
    # Foreign Key
    inspection_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the inspection"
    )
    
    # Conflict Details
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Type of entity with conflict"
    )
    
    entity_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        doc="Entity identifier"
    )
    
    conflict_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Type of conflict"
    )
    
    # Version Data
    server_version: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        doc="Server entity state"
    )
    
    local_version: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        doc="Local entity state"
    )
    
    conflict_details: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Detailed diff of conflicts"
    )
    
    # Resolution
    resolution_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=ResolutionStatus.PENDING,
        index=True,
        doc="Status of resolution"
    )
    
    resolved_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="User who resolved conflict"
    )
    
    resolution_action: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Description of resolution"
    )
    
    resolved_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Resolution timestamp"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"conflict_type IN {tuple(ConflictType.all())}",
            name="chk_conflict_type"
        ),
        CheckConstraint(
            f"resolution_status IN {tuple(ResolutionStatus.all())}",
            name="chk_resolution_status"
        ),
    )
    
    def is_pending(self) -> bool:
        return self.resolution_status == ResolutionStatus.PENDING
    
    def is_resolved(self) -> bool:
        return ResolutionStatus.is_resolved(self.resolution_status)
    
    def __repr__(self) -> str:
        return (
            f"SyncConflict(id={self.id}, "
            f"entity_type={self.entity_type}, "
            f"conflict_type={self.conflict_type}, "
            f"resolution_status={self.resolution_status})"
        )
