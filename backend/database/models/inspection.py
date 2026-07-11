"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Model

Description:
    This module defines the Inspection model, which is the core entity
    for the inspection workflow module. It represents a complete inspection
    record with its lifecycle state, scheduling information, location data,
    and compliance metrics.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Numeric, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import VersionedModel


class InspectionStatus:
    """
    Enumeration of possible inspection statuses.
    
    These statuses represent the lifecycle of an inspection from creation
    to completion. The workflow follows a defined state machine with
    specific allowed transitions between states.
    """
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    EVIDENCE_COLLECTION = "evidence_collection"
    REVIEW = "review"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid status values."""
        return [
            cls.DRAFT,
            cls.IN_PROGRESS,
            cls.EVIDENCE_COLLECTION,
            cls.REVIEW,
            cls.SUBMITTED,
            cls.UNDER_REVIEW,
            cls.COMPLETED,
            cls.CANCELLED,
        ]
    
    @classmethod
    def active(cls) -> list[str]:
        """Return statuses for active inspections (not completed or cancelled)."""
        return [
            cls.DRAFT,
            cls.IN_PROGRESS,
            cls.EVIDENCE_COLLECTION,
            cls.REVIEW,
        ]


class InspectionPriority:
    """
    Enumeration of inspection priority levels.
    
    Priority levels determine the urgency and order in which inspections
    should be conducted. Higher priority inspections should be
    completed first.
    """
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid priority values."""
        return [cls.LOW, cls.MEDIUM, cls.HIGH, cls.URGENT]
    
    @classmethod
    def get_weight(cls, priority: str) -> int:
        """
        Get numeric weight for priority for sorting.
        
        Args:
            priority: Priority string value
            
        Returns:
            int: Numeric weight (higher = more urgent)
        """
        weights = {
            cls.LOW: 1,
            cls.MEDIUM: 2,
            cls.HIGH: 3,
            cls.URGENT: 4,
        }
        return weights.get(priority, 0)


class Inspection(VersionedModel):
    """
    Inspection model representing a complete inspection record.
    
    This is the core entity of the inspection workflow module. It tracks
    the entire lifecycle of an inspection from assignment to completion,
    including scheduling, execution, location data, and compliance metrics.
    
    Attributes:
        inspector_id: ID of the inspector assigned to this inspection
        site_id: ID of the site being inspected
        inspection_type_id: ID of the inspection type
        status: Current status in the inspection lifecycle
        priority: Priority level for scheduling
        scheduled_date: When the inspection is scheduled to start
        scheduled_end_date: Expected completion time
        started_at: Actual start time
        completed_at: Actual completion time
        location_lat: Check-in latitude
        location_lng: Check-in longitude
        location_accuracy: GPS accuracy in meters
        check_in_time: When inspector checked in at site
        check_out_time: When inspector checked out from site
        compliance_score: Overall compliance percentage (0-100)
        violation_count: Number of violations found
        total_checklist_items: Total items in checklist
        completed_checklist_items: Items with responses
    """
    
    __tablename__ = "inspections"
    
    # Foreign Keys (references to other modules)
    inspector_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspector assigned to this inspection"
    )
    
    site_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the site being inspected"
    )
    
    inspection_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection type"
    )
    
    # Inspection Status and Priority
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default=InspectionStatus.DRAFT,
        index=True,
        doc="Current status in the inspection lifecycle"
    )
    
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=InspectionPriority.MEDIUM,
        index=True,
        doc="Priority level for scheduling"
    )
    
    # Scheduling Information
    scheduled_date: Mapped[datetime] = mapped_column(
        nullable=False,
        index=True,
        doc="When the inspection is scheduled to start"
    )
    
    scheduled_end_date: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Expected completion time"
    )
    
    # Execution Timing
    started_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Actual start time"
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="Actual completion time"
    )
    
    # Location Data (Check-in)
    location_lat: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 8),
        nullable=True,
        doc="Check-in latitude (8 decimal places ~1mm precision)"
    )
    
    location_lng: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(11, 8),
        nullable=True,
        doc="Check-in longitude (8 decimal places ~1mm precision)"
    )
    
    location_accuracy: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="GPS accuracy in meters"
    )
    
    check_in_time: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="When inspector checked in at site"
    )
    
    check_out_time: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="When inspector checked out from site"
    )
    
    # Compliance Metrics
    compliance_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Overall compliance percentage (0-100)"
    )
    
    violation_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Number of violations found"
    )
    
    total_checklist_items: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Total items in checklist"
    )
    
    completed_checklist_items: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Items with responses"
    )
    
    # Relationships
    checklist_responses: Mapped[list["InspectionChecklist"]] = relationship(
        "InspectionChecklist",
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    evidence: Mapped[list["Evidence"]] = relationship(
        "Evidence",
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    notes: Mapped[list["InspectionNote"]] = relationship(
        "InspectionNote",
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    state_history: Mapped[list["InspectionStateHistory"]] = relationship(
        "InspectionStateHistory",
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    location_logs: Mapped[list["InspectionLocationLog"]] = relationship(
        "InspectionLocationLog",
        back_populates="inspection",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    submission: Mapped[Optional["Submission"]] = relationship(
        "Submission",
        back_populates="inspection",
        uselist=False,
        lazy="joined"
    )
    report: Mapped[Optional["GeneratedReport"]] = relationship(
        "GeneratedReport",
        back_populates="inspection",
        uselist=False,
        lazy="joined"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            "completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at",
            name="chk_inspection_dates"
        ),
        CheckConstraint(
            f"status IN {tuple(InspectionStatus.all())}",
            name="chk_inspection_status"
        ),
        CheckConstraint(
            f"priority IN {tuple(InspectionPriority.all())}",
            name="chk_inspection_priority"
        ),
        CheckConstraint(
            "compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100)",
            name="chk_compliance_score"
        ),
    )
    
    def is_active(self) -> bool:
        """
        Check if the inspection is currently active.
        
        An inspection is considered active if it has a status that
        allows further work (not completed or cancelled).
        
        Returns:
            bool: True if inspection is active, False otherwise
        """
        return self.status in InspectionStatus.active()
    
    def is_overdue(self) -> bool:
        """
        Check if the inspection is overdue.
        
        An inspection is overdue if the scheduled date has passed
        and the inspection has not been completed.
        
        Returns:
            bool: True if inspection is overdue, False otherwise
        """
        if self.completed_at:
            return False
        return datetime.now() > self.scheduled_date
    
    def get_duration(self) -> Optional[int]:
        """
        Calculate the duration of the inspection in minutes.
        
        Returns:
            Optional[int]: Duration in minutes, or None if inspection
                         has not been started or completed
        """
        if not self.started_at or not self.completed_at:
            return None
        duration = self.completed_at - self.started_at
        return int(duration.total_seconds() / 60)
    
    def get_completion_percentage(self) -> float:
        """
        Calculate the completion percentage based on checklist items.
        
        Returns:
            float: Completion percentage (0-100)
        """
        if self.total_checklist_items == 0:
            return 0.0
        return (self.completed_checklist_items / self.total_checklist_items) * 100
    
    def can_transition_to(self, new_status: str) -> bool:
        """
        Check if a state transition is valid.
        
        This method implements the state machine rules for inspection
        status transitions. Not all transitions are allowed.
        
        Args:
            new_status: The target status to transition to
            
        Returns:
            bool: True if transition is valid, False otherwise
        """
        # Define valid transitions
        valid_transitions = {
            InspectionStatus.DRAFT: [
                InspectionStatus.IN_PROGRESS,
                InspectionStatus.CANCELLED,
            ],
            InspectionStatus.IN_PROGRESS: [
                InspectionStatus.EVIDENCE_COLLECTION,
                InspectionStatus.CANCELLED,
            ],
            InspectionStatus.EVIDENCE_COLLECTION: [
                InspectionStatus.REVIEW,
                InspectionStatus.IN_PROGRESS,
                InspectionStatus.CANCELLED,
            ],
            InspectionStatus.REVIEW: [
                InspectionStatus.SUBMITTED,
                InspectionStatus.EVIDENCE_COLLECTION,
                InspectionStatus.CANCELLED,
            ],
            InspectionStatus.SUBMITTED: [
                InspectionStatus.UNDER_REVIEW,
            ],
            InspectionStatus.UNDER_REVIEW: [
                InspectionStatus.COMPLETED,
                InspectionStatus.REVIEW,  # Returned for revision
            ],
            InspectionStatus.COMPLETED: [],  # Terminal state
            InspectionStatus.CANCELLED: [],  # Terminal state
        }
        
        allowed_transitions = valid_transitions.get(self.status, [])
        return new_status in allowed_transitions
    
    def has_location_data(self) -> bool:
        """
        Check if the inspection has location check-in data.
        
        Returns:
            bool: True if location data is present, False otherwise
        """
        return (
            self.location_lat is not None
            and self.location_lng is not None
            and self.check_in_time is not None
        )
    
    def is_within_geofence(
        self,
        site_lat: Decimal,
        site_lng: Decimal,
        radius_meters: float = 100.0
    ) -> bool:
        """
        Check if the inspection location is within a geofence radius.
        
        Args:
            site_lat: Site latitude
            site_lng: Site longitude
            radius_meters: Geofence radius in meters
            
        Returns:
            bool: True if within geofence, False otherwise
        """
        if not self.has_location_data():
            return False
        
        # Simple distance calculation (Haversine formula would be more accurate)
        # For now, use a simplified calculation
        lat_diff = float(self.location_lat - site_lat)
        lng_diff = float(self.location_lng - site_lng)
        
        # Approximate distance (1 degree ≈ 111km)
        distance_km = ((lat_diff ** 2 + lng_diff ** 2) ** 0.5) * 111
        distance_meters = distance_km * 1000
        
        return distance_meters <= radius_meters
    
    def update_compliance_metrics(
        self,
        compliance_score: Optional[int] = None,
        violation_count: Optional[int] = None,
        total_items: Optional[int] = None,
        completed_items: Optional[int] = None
    ) -> None:
        """
        Update compliance metrics for the inspection.
        
        Args:
            compliance_score: Overall compliance percentage (0-100)
            violation_count: Number of violations found
            total_items: Total checklist items
            completed_items: Completed checklist items
        """
        if compliance_score is not None:
            self.compliance_score = compliance_score
        if violation_count is not None:
            self.violation_count = violation_count
        if total_items is not None:
            self.total_checklist_items = total_items
        if completed_items is not None:
            self.completed_checklist_items = completed_items
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"Inspection(id={self.id}, status={self.status}, "
            f"priority={self.priority}, site_id={self.site_id})"
        )
