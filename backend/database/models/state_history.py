"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection State History Model

Description:
    This module defines the InspectionStateHistory model for tracking all
    state transitions for inspections, providing a complete audit trail
    for compliance and accountability.

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
from .inspection import InspectionStatus


class InspectionStateHistory(BaseModel):
    """
    Model for tracking inspection state transitions.
    
    Government inspections require complete audit trails. This model records
    every state change with timestamps, reasons, and who made the change,
    ensuring full traceability and compliance.
    
    Attributes:
        inspection_id: ID of the inspection
        from_state: Previous state (NULL for initial state)
        to_state: New state
        transition_reason: Reason for state change
        transition_metadata: Additional context for transition (JSON)
        changed_by: User or system that initiated change
        changed_at: Transition timestamp
        ip_address: IP address of requester
        user_agent: Client user agent
    """
    
    __tablename__ = "inspection_state_history"
    
    # Foreign Key
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection"
    )
    
    # State Transition Data
    from_state: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Previous state (NULL for initial state)"
    )
    
    to_state: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="New state"
    )
    
    transition_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Reason for state change"
    )
    
    transition_metadata: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Additional context for transition"
    )
    
    # Who made the change
    changed_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="User or system that initiated change"
    )
    
    changed_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Transition timestamp"
    )
    
    # Request Information
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),
        nullable=True,
        doc="IP address of requester (supports IPv6)"
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Client user agent"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"to_state IN {tuple(InspectionStatus.all())}",
            name="chk_to_state"
        ),
    )
    
    def is_initial_state(self) -> bool:
        """
        Check if this is the initial state entry.
        
        Returns:
            bool: True if this is the initial state (from_state is NULL)
        """
        return self.from_state is None
    
    def is_terminal_transition(self) -> bool:
        """
        Check if this transition leads to a terminal state.
        
        Terminal states are 'completed' and 'cancelled' from which
        no further transitions are allowed.
        
        Returns:
            bool: True if transition to terminal state, False otherwise
        """
        return self.to_state in [InspectionStatus.COMPLETED, InspectionStatus.CANCELLED]
    
    def get_transition_summary(self) -> str:
        """
        Get a human-readable summary of the transition.
        
        Returns:
            str: Summary string describing the transition
        """
        if self.is_initial_state():
            return f"Inspection created with status: {self.to_state}"
        return f"State changed from {self.from_state} to {self.to_state}"
    
    def add_metadata(self, key: str, value: any) -> None:
        """
        Add metadata to the transition.
        
        Args:
            key: Metadata key
            value: Metadata value
        """
        if self.transition_metadata is None:
            self.transition_metadata = {}
        self.transition_metadata[key] = value
    
    def get_metadata(self, key: str, default: any = None) -> any:
        """
        Get metadata value by key.
        
        Args:
            key: Metadata key
            default: Default value if key not found
            
        Returns:
            any: Metadata value or default
        """
        if self.transition_metadata is None:
            return default
        return self.transition_metadata.get(key, default)
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"InspectionStateHistory(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"from_state={self.from_state}, "
            f"to_state={self.to_state}, "
            f"changed_at={self.changed_at})"
        )
