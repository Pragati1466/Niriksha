"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Attachment Model

Description:
    This module defines the InspectionAttachment model for storing additional
    attachments not classified as evidence (supporting documents, reference materials).

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, BigInteger, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class AttachmentType:
    """Enumeration of attachment types."""
    SUPPORTING_DOCUMENT = "supporting_document"
    REFERENCE = "reference"
    CORRESPONDENCE = "correspondence"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.SUPPORTING_DOCUMENT, cls.REFERENCE, cls.CORRESPONDENCE]


class InspectionAttachment(BaseModel):
    """
    Model for storing additional attachments not classified as evidence.
    
    Some attachments are supporting documents rather than evidence. This table
    handles those separately.
    """
    
    __tablename__ = "inspection_attachments"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection"
    )
    
    uploaded_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="User who uploaded"
    )
    
    # Attachment Information
    attachment_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Type of attachment"
    )
    
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Original file name"
    )
    
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Storage path or URL"
    )
    
    file_size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
        doc="File size in bytes"
    )
    
    file_mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        doc="MIME type"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Attachment description"
    )
    
    uploaded_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Upload timestamp"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"attachment_type IN {tuple(AttachmentType.all())}",
            name="chk_attachment_type"
        ),
    )
    
    def get_file_size_mb(self) -> float:
        return self.file_size / (1024 * 1024)
    
    def __repr__(self) -> str:
        return (
            f"InspectionAttachment(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"attachment_type={self.attachment_type}, "
            f"file_name={self.file_name})"
        )
