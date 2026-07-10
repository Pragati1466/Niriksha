"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Generated Report Model

Description:
    This module defines the GeneratedReport model for storing generated
    inspection reports with metadata and file references.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Integer, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class ReportType:
    """Enumeration of report types."""
    INSPECTION = "inspection"
    VIOLATION = "violation"
    SUMMARY = "summary"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.INSPECTION, cls.VIOLATION, cls.SUMMARY]


class FileFormat:
    """Enumeration of file formats."""
    PDF = "pdf"
    HTML = "html"
    DOCX = "docx"
    
    @classmethod
    def all(cls) -> list[str]:
        return [cls.PDF, cls.HTML, cls.DOCX]


class GeneratedReport(BaseModel):
    """
    Model for storing generated inspection reports.
    
    Inspections culminate in formal reports. This table stores report
    metadata, file references, and generation details.
    """
    
    __tablename__ = "generated_reports"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        unique=True,
        index=True,
        doc="ID of the inspection (one report per inspection)"
    )
    
    template_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="Report template used"
    )
    
    generated_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="User or system that generated report"
    )
    
    # Report Information
    report_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Type of report"
    )
    
    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Generated file name"
    )
    
    file_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        doc="Storage path or URL"
    )
    
    file_format: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="File format"
    )
    
    file_size: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="File size in bytes"
    )
    
    # Report Data
    report_data: Mapped[Optional[dict]] = mapped_column(
        JSONB,
        nullable=True,
        doc="Structured report data"
    )
    
    # Metrics
    compliance_score: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Overall compliance percentage (0-100)"
    )
    
    violation_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Number of violations"
    )
    
    recommendation_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Number of recommendations"
    )
    
    # Version and Timing
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        doc="Report version"
    )
    
    generated_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Generation timestamp"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"report_type IN {tuple(ReportType.all())}",
            name="chk_report_type"
        ),
        CheckConstraint(
            f"file_format IN {tuple(FileFormat.all())}",
            name="chk_file_format"
        ),
        CheckConstraint(
            "compliance_score IS NULL OR (compliance_score >= 0 AND compliance_score <= 100)",
            name="chk_compliance_score"
        ),
    )
    
    def is_pdf(self) -> bool:
        return self.file_format == FileFormat.PDF
    
    def get_file_size_mb(self) -> float:
        if self.file_size is None:
            return 0.0
        return self.file_size / (1024 * 1024)
    
    def __repr__(self) -> str:
        return (
            f"GeneratedReport(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"report_type={self.report_type}, "
            f"file_format={self.file_format})"
        )
