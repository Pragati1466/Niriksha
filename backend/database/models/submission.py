"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Submission Model

Description:
    This module defines the Submission model for tracking inspection report
    submissions to supervisors with metadata, status, and review timeline.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class RecipientType:
    """Enumeration of submission recipient types."""
    SUPERVISOR = "supervisor"
    REVIEWER = "reviewer"
    AUTO = "auto"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.SUPERVISOR, cls.REVIEWER, cls.AUTO]


class SubmissionPriority:
    """Enumeration of submission priority levels."""
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.NORMAL, cls.HIGH, cls.URGENT]


class SubmissionStatus:
    """Enumeration of submission statuses."""
    PENDING = "pending"
    ACKNOWLEDGED = "acknowledged"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.PENDING, cls.ACKNOWLEDGED, cls.UNDER_REVIEW, cls.APPROVED, cls.REJECTED, cls.RETURNED]
    
    @classmethod
    def is_terminal(cls, status: str) -> bool:
        return status in [cls.APPROVED, cls.REJECTED]


class Submission(BaseModel):
    """
    Model for tracking inspection report submissions to supervisors.
    
    Completed inspections are submitted for review. This model manages the
    submission workflow, routing, status tracking, and review timeline.
    """
    
    __tablename__ = "submissions"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        unique=True,
        index=True,
        doc="ID of the inspection (one submission per inspection)"
    )
    
    submitted_by: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="Inspector who submitted"
    )
    
    recipient_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="Supervisor/recipient ID"
    )
    
    report_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="Reference to generated report"
    )
    
    # Submission Details
    recipient_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Type of recipient"
    )
    
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Submission priority"
    )
    
    submission_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=SubmissionStatus.PENDING,
        index=True,
        doc="Status of submission"
    )
    
    # Comments
    inspector_comments: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Comments from inspector"
    )
    
    reviewer_comments: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Comments from reviewer"
    )
    
    # Review Timeline
    acknowledged_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="When submission was acknowledged"
    )
    
    review_started_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="When review began"
    )
    
    review_completed_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="When review completed"
    )
    
    approved_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="Who approved submission"
    )
    
    approved_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Approval timestamp"
    )
    
    # Rejection/Return Reasons
    rejection_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Reason if rejected"
    )
    
    return_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Reason if returned for revision"
    )
    
    # Time Tracking
    estimated_review_time: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Estimated review hours"
    )
    
    actual_review_time: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Actual review hours taken"
    )
    
    submitted_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Submission timestamp"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"recipient_type IN {tuple(RecipientType.all())}",
            name="chk_recipient_type"
        ),
        CheckConstraint(
            f"priority IN {tuple(SubmissionPriority.all())}",
            name="chk_priority"
        ),
        CheckConstraint(
            f"submission_status IN {tuple(SubmissionStatus.all())}",
            name="chk_submission_status"
        ),
    )
    
    def is_approved(self) -> bool:
        return self.submission_status == SubmissionStatus.APPROVED
    
    def is_rejected(self) -> bool:
        return self.submission_status == SubmissionStatus.REJECTED
    
    def is_under_review(self) -> bool:
        return self.submission_status == SubmissionStatus.UNDER_REVIEW
    
    def is_returned(self) -> bool:
        return self.submission_status == SubmissionStatus.RETURNED
    
    def __repr__(self) -> str:
        return (
            f"Submission(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"status={self.submission_status}, "
            f"priority={self.priority})"
        )
