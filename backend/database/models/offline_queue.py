"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Offline Queue Model

Description:
    This module defines the InspectionOfflineQueue model for queuing
    inspection data changes for synchronization when connectivity is restored.
    This is essential for offline-first architecture.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class SyncActionType:
    """
    Enumeration of sync action types.
    
    Different types of actions can be queued for synchronization when
    the device is offline.
    """
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SYNC = "sync"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid action type values."""
        return [cls.CREATE, cls.UPDATE, cls.DELETE, cls.SYNC]


class SyncStatus:
    """
    Enumeration of sync operation statuses.
    
    These statuses track the progress of sync operations for each
    queued item.
    """
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid sync status values."""
        return [cls.PENDING, cls.IN_PROGRESS, cls.COMPLETED, cls.FAILED]
    
    @classmethod
    def is_terminal(cls, status: str) -> bool:
        """
        Check if sync status is terminal (no further processing).
        
        Args:
            status: Sync status
            
        Returns:
            bool: True if terminal, False otherwise
        """
        return status in [cls.COMPLETED, cls.FAILED]
    
    @classmethod
    def can_retry(cls, status: str) -> bool:
        """
        Check if sync operation can be retried.
        
        Args:
            status: Sync status
            
        Returns:
            bool: True if can retry, False otherwise
        """
        return status == cls.FAILED


class InspectionOfflineQueue(BaseModel):
    """
    Model for queuing inspection data changes for offline synchronization.
    
    Inspectors work offline in areas with poor connectivity. This model stores
    pending changes that need to sync with the server when connectivity is
    restored, with retry logic and conflict detection.
    
    Attributes:
        inspection_id: ID of the inspection (null for new inspections)
        action_type: Type of action (create, update, delete, sync)
        entity_type: Type of entity (inspection, checklist, evidence, note)
        entity_id: Local entity identifier
        payload: Complete entity data for sync (JSON)
        sync_status: Status of sync operation
        retry_count: Number of sync retry attempts
        last_error: Last sync error message
        sync_started_at: When sync attempt started
        sync_completed_at: When sync completed
    """
    
    __tablename__ = "inspection_offline_queue"
    
    # Foreign Key (optional - null for new inspections)
    inspection_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the inspection (null for new inspections)"
    )
    
    # Sync Operation Details
    action_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Type of action (create, update, delete, sync)"
    )
    
    entity_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Type of entity (inspection, checklist, evidence, note)"
    )
    
    entity_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="Local entity identifier"
    )
    
    payload: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        doc="Complete entity data for sync"
    )
    
    # Sync Status
    sync_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SyncStatus.PENDING,
        index=True,
        doc="Status of sync operation"
    )
    
    retry_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Number of sync retry attempts"
    )
    
    last_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Last sync error message"
    )
    
    # Timing
    sync_started_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="When sync attempt started"
    )
    
    sync_completed_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="When sync completed"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"action_type IN {tuple(SyncActionType.all())}",
            name="chk_action_type"
        ),
        CheckConstraint(
            f"sync_status IN {tuple(SyncStatus.all())}",
            name="chk_sync_status"
        ),
    )
    
    def is_pending(self) -> bool:
        """
        Check if sync operation is pending.
        
        Returns:
            bool: True if pending, False otherwise
        """
        return self.sync_status == SyncStatus.PENDING
    
    def is_in_progress(self) -> bool:
        """
        Check if sync operation is in progress.
        
        Returns:
            bool: True if in progress, False otherwise
        """
        return self.sync_status == SyncStatus.IN_PROGRESS
    
    def is_completed(self) -> bool:
        """
        Check if sync operation is completed.
        
        Returns:
            bool: True if completed, False otherwise
        """
        return self.sync_status == SyncStatus.COMPLETED
    
    def is_failed(self) -> bool:
        """
        Check if sync operation has failed.
        
        Returns:
            bool: True if failed, False otherwise
        """
        return self.sync_status == SyncStatus.FAILED
    
    def can_retry_sync(self, max_retries: int = 3) -> bool:
        """
        Check if sync operation can be retried.
        
        Args:
            max_retries: Maximum number of retry attempts
            
        Returns:
            bool: True if can retry, False otherwise
        """
        return SyncStatus.can_retry(self.sync_status) and self.retry_count < max_retries
    
    def increment_retry(self) -> None:
        """Increment the retry count."""
        self.retry_count += 1
    
    def mark_in_progress(self) -> None:
        """Mark sync operation as in progress."""
        self.sync_status = SyncStatus.IN_PROGRESS
        self.sync_started_at = self.created_at
    
    def mark_completed(self) -> None:
        """Mark sync operation as completed."""
        self.sync_status = SyncStatus.COMPLETED
        self.sync_completed_at = self.created_at
        self.last_error = None
    
    def mark_failed(self, error: str) -> None:
        """
        Mark sync operation as failed.
        
        Args:
            error: Error message
        """
        self.sync_status = SyncStatus.FAILED
        self.sync_completed_at = self.created_at
        self.last_error = error
        self.increment_retry()
    
    def reset_to_pending(self) -> None:
        """Reset sync operation to pending for retry."""
        self.sync_status = SyncStatus.PENDING
        self.sync_started_at = None
        self.sync_completed_at = None
        self.last_error = None
    
    def get_sync_duration(self) -> Optional[int]:
        """
        Calculate sync duration in seconds.
        
        Returns:
            Optional[int]: Duration in seconds, or None if not completed
        """
        if not self.sync_started_at or not self.sync_completed_at:
            return None
        # This would require actual datetime parsing
        # For now, return None
        return None
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"InspectionOfflineQueue(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"action_type={self.action_type}, "
            f"entity_type={self.entity_type}, "
            f"sync_status={self.sync_status}, "
            f"retry_count={self.retry_count})"
        )
