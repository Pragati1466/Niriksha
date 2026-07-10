"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist Models

Description:
    This module defines the checklist-related models for storing checklist
    templates, sections, items, and inspection responses. These models support
    the structured checklist workflow used during inspections.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Text, Integer, Boolean, JSON, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel, SoftDeleteModel


class ResponseType:
    """
    Enumeration of checklist item response types.
    
    Different checklist items require different types of responses based
    on the nature of the question or requirement.
    """
    YES_NO = "yes_no"
    TEXT = "text"
    NUMBER = "number"
    DROPDOWN = "dropdown"
    DATE = "date"
    MULTIPLE_CHOICE = "multiple_choice"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid response type values."""
        return [
            cls.YES_NO,
            cls.TEXT,
            cls.NUMBER,
            cls.DROPDOWN,
            cls.DATE,
            cls.MULTIPLE_CHOICE,
        ]


class SeverityLevel:
    """
    Enumeration of severity levels for non-compliant items.
    
    Severity levels indicate the importance and urgency of addressing
    violations or non-compliant findings.
    """
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid severity level values."""
        return [cls.CRITICAL, cls.MAJOR, cls.MINOR]
    
    @classmethod
    def get_weight(cls, severity: str) -> int:
        """
        Get numeric weight for severity for sorting.
        
        Args:
            severity: Severity string value
            
        Returns:
            int: Numeric weight (higher = more severe)
        """
        weights = {
            cls.MINOR: 1,
            cls.MAJOR: 2,
            cls.CRITICAL: 3,
        }
        return weights.get(severity, 0)


class InspectionDomain:
    """
    Enumeration of inspection domains.
    
    Different regulatory domains have different checklist requirements
    and compliance standards.
    """
    FOOD_SAFETY = "food_safety"
    FIRE_SAFETY = "fire_safety"
    HEALTH = "health"
    FACTORY = "factory"
    POLLUTION = "pollution"
    CONSTRUCTION = "construction"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid domain values."""
        return [
            cls.FOOD_SAFETY,
            cls.FIRE_SAFETY,
            cls.HEALTH,
            cls.FACTORY,
            cls.POLLUTION,
            cls.CONSTRUCTION,
        ]


class InspectionChecklist(BaseModel):
    """
    Model for storing checklist responses for an inspection.
    
    This model captures the actual responses given by inspectors during
    an inspection, linking them to the checklist template items. Each
    response can include the value, compliance status, evidence requirements,
    and notes.
    
    Attributes:
        inspection_id: ID of the inspection this response belongs to
        checklist_template_id: ID of the checklist template used
        section_id: ID of the checklist section (optional)
        item_id: ID of the checklist item this response is for
        response_type: Type of response (yes_no, text, number, etc.)
        response_value: The actual response value
        response_text: Textual response for text/number types
        is_compliant: Whether the response indicates compliance
        requires_evidence: Whether this item requires evidence attachment
        evidence_attached: Whether evidence has been attached
        notes: Inspector notes for this item
        regulatory_reference: Citation of applicable regulation
        severity: Severity level if non-compliant
    """
    
    __tablename__ = "inspection_checklists"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection this response belongs to"
    )
    
    checklist_template_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the checklist template used"
    )
    
    section_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the checklist section (optional)"
    )
    
    item_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the checklist item this response is for"
    )
    
    # Response Data
    response_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Type of response (yes_no, text, number, etc.)"
    )
    
    response_value: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="The actual response value"
    )
    
    response_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Textual response for text/number types"
    )
    
    is_compliant: Mapped[Optional[bool]] = mapped_column(
        nullable=True,
        index=True,
        doc="Whether the response indicates compliance"
    )
    
    # Evidence Requirements
    requires_evidence: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="Whether this item requires evidence attachment"
    )
    
    evidence_attached: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="Whether evidence has been attached"
    )
    
    # Additional Information
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Inspector notes for this item"
    )
    
    regulatory_reference: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Citation of applicable regulation"
    )
    
    severity: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Severity level if non-compliant"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"response_type IN {tuple(ResponseType.all())}",
            name="chk_response_type"
        ),
        CheckConstraint(
            f"severity IN {tuple(SeverityLevel.all())}",
            name="chk_severity"
        ),
    )
    
    def is_complete(self) -> bool:
        """
        Check if the checklist response is complete.
        
        A response is considered complete if:
        - It has a response value
        - If evidence is required, evidence is attached
        - Compliance status is determined
        
        Returns:
            bool: True if response is complete, False otherwise
        """
        if not self.response_value:
            return False
        
        if self.requires_evidence and not self.evidence_attached:
            return False
        
        if self.is_compliant is None:
            return False
        
        return True
    
    def is_non_compliant(self) -> bool:
        """
        Check if the response indicates non-compliance.
        
        Returns:
            bool: True if non-compliant, False otherwise
        """
        return self.is_compliant is False
    
    def get_severity_weight(self) -> int:
        """
        Get the severity weight for this response.
        
        Returns:
            int: Numeric severity weight (0 if compliant or no severity)
        """
        if self.is_compliant or not self.severity:
            return 0
        return SeverityLevel.get_weight(self.severity)
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"InspectionChecklist(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"item_id={self.item_id}, "
            f"is_compliant={self.is_compliant})"
        )


class ChecklistTemplate(SoftDeleteModel):
    """
    Model for checklist templates.
    
    Checklist templates define the structure and content of checklists
    for different inspection types and domains. Templates are versioned
    and can be activated/deactivated based on effectiveness dates.
    
    Attributes:
        name: Template name
        code: Unique template code
        inspection_type_id: ID of the inspection type
        domain: Regulatory domain (food_safety, fire_safety, etc.)
        version: Template version number
        description: Template description
        total_items: Total number of checklist items
        estimated_duration: Estimated duration in minutes
        is_active: Whether template is currently active
        effective_from: Date when template becomes effective
        effective_to: Date when template expires
        created_by: ID of the user who created the template
    """
    
    __tablename__ = "checklist_templates"
    
    # Template Information
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Template name"
    )
    
    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        doc="Unique template code"
    )
    
    inspection_type_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection type"
    )
    
    domain: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Regulatory domain"
    )
    
    # Version and Duration
    version: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1,
        doc="Template version number"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Template description"
    )
    
    total_items: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        doc="Total number of checklist items"
    )
    
    estimated_duration: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        doc="Estimated duration in minutes"
    )
    
    # Status and Effectiveness
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        doc="Whether template is currently active"
    )
    
    effective_from: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Date when template becomes effective"
    )
    
    effective_to: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        doc="Date when template expires"
    )
    
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        doc="ID of the user who created the template"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"domain IN {tuple(InspectionDomain.all())}",
            name="chk_domain"
        ),
    )
    
    def is_effective(self) -> bool:
        """
        Check if the template is currently effective.
        
        A template is effective if:
        - It is marked as active
        - Current date is within effective_from and effective_to range
        
        Returns:
            bool: True if template is effective, False otherwise
        """
        if not self.is_active:
            return False
        
        # Add date validation logic here when datetime fields are implemented
        # For now, just check active status
        return True
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"ChecklistTemplate(id={self.id}, "
            f"code={self.code}, "
            f"domain={self.domain}, "
            f"version={self.version}, "
            f"is_active={self.is_active})"
        )


class ChecklistSection(BaseModel):
    """
    Model for checklist sections.
    
    Sections organize checklist items into logical groups for better
    usability during inspections. Each section belongs to a template
    and has a display order.
    
    Attributes:
        template_id: ID of the checklist template
        name: Section name
        code: Section code
        description: Section description
        display_order: Display order within template
        is_required: Whether section is required
    """
    
    __tablename__ = "checklist_sections"
    
    # Foreign Key
    template_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the checklist template"
    )
    
    # Section Information
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        doc="Section name"
    )
    
    code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        doc="Section code"
    )
    
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Section description"
    )
    
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Display order within template"
    )
    
    is_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        doc="Whether section is required"
    )
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"ChecklistSection(id={self.id}, "
            f"template_id={self.template_id}, "
            f"name={self.name}, "
            f"display_order={self.display_order})"
        )


class ChecklistItem(BaseModel):
    """
    Model for individual checklist items.
    
    Checklist items are the specific questions or requirements that
    inspectors respond to during an inspection. Each item belongs to
    a section and template, and has various properties like response type,
    evidence requirements, and regulatory references.
    
    Attributes:
        section_id: ID of the checklist section
        template_id: ID of the checklist template
        question_text: The question or requirement
        item_code: Item code
        response_type: Type of response required
        is_required: Whether item is required
        requires_evidence: Whether item requires evidence
        evidence_types: Allowed evidence types
        regulatory_reference: Applicable regulation citation
        guidance_text: Additional guidance for inspectors
        default_value: Default response value
        options: Options for dropdown/multiple_choice (JSON)
        display_order: Display order within section
        severity_on_failure: Severity if failed
        is_active: Whether item is active
    """
    
    __tablename__ = "checklist_items"
    
    # Foreign Keys
    section_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the checklist section"
    )
    
    template_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the checklist template"
    )
    
    # Item Information
    question_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="The question or requirement"
    )
    
    item_code: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        doc="Item code"
    )
    
    response_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Type of response required"
    )
    
    # Requirements
    is_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        doc="Whether item is required"
    )
    
    requires_evidence: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="Whether item requires evidence"
    )
    
    evidence_types: Mapped[Optional[list[str]]] = mapped_column(
        ARRAY(String),
        nullable=True,
        doc="Allowed evidence types"
    )
    
    # Regulatory Information
    regulatory_reference: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        doc="Applicable regulation citation"
    )
    
    guidance_text: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Additional guidance for inspectors"
    )
    
    # Default Values and Options
    default_value: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Default response value"
    )
    
    options: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True,
        doc="Options for dropdown/multiple_choice"
    )
    
    # Display and Severity
    display_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        doc="Display order within section"
    )
    
    severity_on_failure: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        doc="Severity if failed"
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True,
        doc="Whether item is active"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"response_type IN {tuple(ResponseType.all())}",
            name="chk_item_response_type"
        ),
        CheckConstraint(
            f"severity_on_failure IN {tuple(SeverityLevel.all())}",
            name="chk_item_severity"
        ),
    )
    
    def get_options_list(self) -> list[str]:
        """
        Get options as a list from the JSON field.
        
        Returns:
            list[str]: List of option values
        """
        if not self.options:
            return []
        
        # Handle different JSON structures for options
        if isinstance(self.options, list):
            return self.options
        elif isinstance(self.options, dict):
            return list(self.options.values())
        return []
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"ChecklistItem(id={self.id}, "
            f"item_code={self.item_code}, "
            f"response_type={self.response_type}, "
            f"is_required={self.is_required})"
        )
