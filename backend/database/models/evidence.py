"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence Model

Description:
    This module defines the Evidence model for storing evidence files
    (photos, documents, audio, video) attached to inspections with
    metadata and AI verification status.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, BigInteger, Numeric, Text, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class EvidenceType:
    """
    Enumeration of evidence types.
    
    Different types of evidence can be attached to inspections depending
    on the nature of the finding and the requirements.
    """
    PHOTO = "photo"
    DOCUMENT = "document"
    AUDIO = "audio"
    VIDEO = "video"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid evidence type values."""
        return [cls.PHOTO, cls.DOCUMENT, cls.AUDIO, cls.VIDEO]
    
    @classmethod
    def is_image(cls, evidence_type: str) -> bool:
        """Check if evidence type is an image."""
        return evidence_type == cls.PHOTO
    
    @classmethod
    def is_document(cls, evidence_type: str) -> bool:
        """Check if evidence type is a document."""
        return evidence_type == cls.DOCUMENT


class VerificationStatus:
    """
    Enumeration of AI verification statuses.
    
    Evidence can be verified by AI to check consistency with
    checklist responses. These statuses track the verification state.
    """
    PENDING = "pending"
    VERIFIED = "verified"
    FLAGGED = "flagged"
    DISPUTED = "disputed"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid verification status values."""
        return [cls.PENDING, cls.VERIFIED, cls.FLAGGED, cls.DISPUTED]
    
    @classmethod
    def requires_review(cls, status: str) -> bool:
        """
        Check if verification status requires human review.
        
        Args:
            status: Verification status
            
        Returns:
            bool: True if requires review, False otherwise
        """
        return status in [cls.FLAGGED, cls.DISPUTED]


class Evidence(BaseModel):
    """
    Model for storing evidence files attached to inspections.
    
    Evidence is critical for inspection integrity. This model tracks all
    uploaded files, their association with checklist items, metadata (GPS,
    device info), and AI verification status for consistency checking.
    
    Attributes:
        inspection_id: ID of the inspection this evidence belongs to
        checklist_response_id: ID of the checklist response (optional)
        evidence_type: Type of evidence (photo, document, audio, video)
        file_name: Original file name
        file_path: Storage path or URL
        file_size: File size in bytes
        file_mime_type: MIME type of the file
        file_hash: SHA-256 hash for integrity verification
        capture_timestamp: When evidence was captured
        capture_location_lat: GPS latitude at capture
        capture_location_lng: GPS longitude at capture
        capture_location_accuracy: GPS accuracy in meters
        device_id: Device that captured the evidence
        description: Evidence description
        tags: Searchable tags
        verification_status: AI verification status
        verification_confidence: AI confidence score (0-100)
        verification_notes: AI verification findings
        uploaded_at: Upload timestamp
    """
    
    __tablename__ = "evidence"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection this evidence belongs to"
    )
    
    checklist_response_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the checklist response (optional)"
    )
    
    # File Information
    evidence_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Type of evidence (photo, document, audio, video)"
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
        doc="MIME type of the file"
    )
    
    file_hash: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
        doc="SHA-256 hash for integrity verification"
    )
    
    # Capture Metadata
    capture_timestamp: Mapped[Optional[datetime]] = mapped_column(
        nullable=True,
        doc="When evidence was captured"
    )
    
    capture_location_lat: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 8),
        nullable=True,
        doc="GPS latitude at capture"
    )
    
    capture_location_lng: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(11, 8),
        nullable=True,
        doc="GPS longitude at capture"
    )
    
    capture_location_accuracy: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="GPS accuracy in meters"
    )
    
    device_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Device that captured the evidence"
    )
    
    # Additional Information
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Evidence description"
    )
    
    tags: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        doc="Searchable tags"
    )
    
    # AI Verification Status
    verification_status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default=VerificationStatus.PENDING,
        index=True,
        doc="AI verification status"
    )
    
    verification_confidence: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="AI confidence score (0-100)"
    )
    
    verification_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="AI verification findings"
    )
    
    uploaded_at: Mapped[datetime] = mapped_column(
        nullable=False,
        index=True,
        doc="Upload timestamp"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"evidence_type IN {tuple(EvidenceType.all())}",
            name="chk_evidence_type"
        ),
        CheckConstraint(
            f"verification_status IN {tuple(VerificationStatus.all())}",
            name="chk_verification_status"
        ),
        CheckConstraint(
            "verification_confidence IS NULL OR (verification_confidence >= 0 AND verification_confidence <= 100)",
            name="chk_verification_confidence"
        ),
    )
    
    def is_photo(self) -> bool:
        """
        Check if this evidence is a photo.
        
        Returns:
            bool: True if photo, False otherwise
        """
        return EvidenceType.is_image(self.evidence_type)
    
    def is_document(self) -> bool:
        """
        Check if this evidence is a document.
        
        Returns:
            bool: True if document, False otherwise
        """
        return EvidenceType.is_document(self.evidence_type)
    
    def has_location_data(self) -> bool:
        """
        Check if evidence has GPS location data.
        
        Returns:
            bool: True if location data is present, False otherwise
        """
        return (
            self.capture_location_lat is not None
            and self.capture_location_lng is not None
        )
    
    def get_file_size_mb(self) -> float:
        """
        Get file size in megabytes.
        
        Returns:
            float: File size in MB
        """
        return self.file_size / (1024 * 1024)
    
    def get_file_size_formatted(self) -> str:
        """
        Get human-readable file size.
        
        Returns:
            str: Formatted file size (e.g., "2.5 MB")
        """
        size_mb = self.get_file_size_mb()
        if size_mb < 1:
            size_kb = self.file_size / 1024
            return f"{size_kb:.2f} KB"
        elif size_mb < 1024:
            return f"{size_mb:.2f} MB"
        else:
            size_gb = size_mb / 1024
            return f"{size_gb:.2f} GB"
    
    def is_verified(self) -> bool:
        """
        Check if evidence has been verified by AI.
        
        Returns:
            bool: True if verified, False otherwise
        """
        return self.verification_status == VerificationStatus.VERIFIED
    
    def requires_review(self) -> bool:
        """
        Check if evidence requires human review based on verification status.
        
        Returns:
            bool: True if requires review, False otherwise
        """
        return VerificationStatus.requires_review(self.verification_status)
    
    def has_high_confidence(self, threshold: float = 80.0) -> bool:
        """
        Check if AI verification has high confidence.
        
        Args:
            threshold: Confidence threshold (default: 80.0)
            
        Returns:
            bool: True if confidence is above threshold, False otherwise
        """
        if self.verification_confidence is None:
            return False
        return float(self.verification_confidence) >= threshold
    
    def add_tag(self, tag: str) -> None:
        """
        Add a tag to the evidence.
        
        Args:
            tag: Tag to add
        """
        if self.tags is None:
            self.tags = []
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """
        Remove a tag from the evidence.
        
        Args:
            tag: Tag to remove
        """
        if self.tags and tag in self.tags:
            self.tags.remove(tag)
    
    def get_verification_summary(self) -> dict:
        """
        Get a summary of verification status.
        
        Returns:
            dict: Verification summary with status, confidence, and review flag
        """
        return {
            "status": self.verification_status,
            "confidence": float(self.verification_confidence) if self.verification_confidence else None,
            "requires_review": self.requires_review(),
            "is_verified": self.is_verified(),
        }
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"Evidence(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"evidence_type={self.evidence_type}, "
            f"file_name={self.file_name}, "
            f"verification_status={self.verification_status})"
        )
