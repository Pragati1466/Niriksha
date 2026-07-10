"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist Schemas

Description:
    This module contains Pydantic schemas for checklist-related API
    requests and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, validator


class ResponseType:
    """Valid response types."""
    YES_NO = "yes_no"
    TEXT = "text"
    NUMBER = "number"
    DROPDOWN = "dropdown"
    DATE = "date"
    MULTIPLE_CHOICE = "multiple_choice"
    
    ALL = [YES_NO, TEXT, NUMBER, DROPDOWN, DATE, MULTIPLE_CHOICE]


class SeverityLevel:
    """Valid severity levels."""
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"
    
    ALL = [CRITICAL, MAJOR, MINOR]


class ChecklistResponseCreateRequest(BaseModel):
    """Schema for creating checklist responses."""
    
    inspection_id: UUID = Field(..., description="ID of the inspection")
    checklist_template_id: UUID = Field(..., description="ID of the checklist template")
    responses: List[dict] = Field(..., description="List of response items")
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspection_id": "123e4567-e89b-12d3-a456-426614174000",
                "checklist_template_id": "223e4567-e89b-12d3-a456-426614174000",
                "responses": [
                    {
                        "item_id": "323e4567-e89b-12d3-a456-426614174000",
                        "response_value": "yes",
                        "is_compliant": True,
                    }
                ],
            }
        }


class ChecklistResponseUpdateRequest(BaseModel):
    """Schema for updating a checklist response."""
    
    response_value: Optional[str] = Field(None, description="Response value")
    response_text: Optional[str] = Field(None, description="Textual response")
    is_compliant: Optional[bool] = Field(None, description="Compliance status")
    notes: Optional[str] = Field(None, description="Inspector notes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "response_value": "no",
                "is_compliant": False,
                "notes": "Issue observed with equipment",
            }
        }


class ChecklistTemplateResponse(BaseModel):
    """Schema for checklist template response."""
    
    id: UUID
    name: str
    code: str
    inspection_type_id: UUID
    domain: str
    version: int
    description: Optional[str]
    total_items: int
    estimated_duration: Optional[int]
    is_active: bool
    effective_from: Optional[str]
    effective_to: Optional[str]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class ChecklistItemResponse(BaseModel):
    """Schema for checklist item response."""
    
    id: UUID
    section_id: UUID
    template_id: UUID
    question_text: str
    item_code: str
    response_type: str
    is_required: bool
    requires_evidence: bool
    evidence_types: Optional[List[str]]
    regulatory_reference: Optional[str]
    guidance_text: Optional[str]
    default_value: Optional[str]
    options: Optional[dict]
    display_order: int
    severity_on_failure: Optional[str]
    is_active: bool
    
    class Config:
        from_attributes = True


class ChecklistSectionResponse(BaseModel):
    """Schema for checklist section response."""
    
    id: UUID
    template_id: UUID
    name: str
    code: str
    description: Optional[str]
    display_order: int
    is_required: bool
    
    class Config:
        from_attributes = True


class ChecklistFullTemplateResponse(ChecklistTemplateResponse):
    """Schema for full checklist template with sections and items."""
    
    sections: List[ChecklistSectionResponse]
    items: List[ChecklistItemResponse]
