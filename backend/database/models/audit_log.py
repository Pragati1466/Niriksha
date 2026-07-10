"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Audit Log Model

Description:
    This module defines the AuditLog model for comprehensive audit logging
    of all inspection actions for compliance and accountability.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB, INET
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class AuditLog(BaseModel):
    """
    Model for comprehensive audit logging.
    
    Government regulations require complete audit trails. This table logs
    every action for compliance, security, and accountability.
    """
    
    __tablename__ = "audit_logs"
    
    # Foreign Keys
    inspection_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the inspection (null for system events)"
    )
    
    user_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="User who performed action"
    )
    
    # Action Information
    action_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Type of action performed"
    )
    
    entity_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Type of entity affected"
    )
    
    entity_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="Identifier of affected entity"
    )
    
    action_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Human-readable description"
    )
    
    # State Changes
    old_value: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Previous state (for updates)"
    )
    
    new_value: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="New state (for updates/creates)"
    )
    
    # Request Information
    ip_address: Mapped[Optional[str]] = mapped_column(
        INET,
        nullable=True,
        doc="IP address of requester"
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Client user agent"
    )
    
    session_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="Session identifier"
    )
    
    request_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True,
        doc="Request identifier for tracing"
    )
    
    def __repr__(self) -> str:
        return (
            f"AuditLog(id={self.id}, "
            f"action_type={self.action_type}, "
            f"entity_type={self.entity_type}, "
            f"user_id={self.user_id})"
        )
