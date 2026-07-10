"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Schemas

Description:
    This module contains Pydantic schemas for inspection-related API
    requests and responses, including validation for creating, updating,
    and querying inspections.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class InspectionStatus:
    """Valid inspection status values."""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress"
    EVIDENCE_COLLECTION = "evidence_collection"
    REVIEW = "review"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    
    ALL = [DRAFT, IN_PROGRESS, EVIDENCE_COLLECTION, REVIEW, SUBMITTED, UNDER_REVIEW, COMPLETED, CANCELLED]


class InspectionPriority:
    """Valid inspection priority values."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"
    
    ALL = [LOW, MEDIUM, HIGH, URGENT]


# ============================================================================
# Request Schemas
# ============================================================================

class InspectionCreateRequest(BaseModel):
    """Schema for creating a new inspection."""
    
    inspector_id: UUID = Field(..., description="ID of the inspector")
    site_id: UUID = Field(..., description="ID of the site")
    inspection_type_id: UUID = Field(..., description="ID of the inspection type")
    priority: str = Field(default=InspectionPriority.MEDIUM, description="Priority level")
    scheduled_date: datetime = Field(..., description="Scheduled start date")
    scheduled_end_date: Optional[datetime] = Field(None, description="Expected completion time")
    
    @validator('priority')
    def validate_priority(cls, v):
        if v not in InspectionPriority.ALL:
            raise ValueError(f"Priority must be one of {InspectionPriority.ALL}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspector_id": "123e4567-e89b-12d3-a456-426614174000",
                "site_id": "223e4567-e89b-12d3-a456-426614174000",
                "inspection_type_id": "323e4567-e89b-12d3-a456-426614174000",
                "priority": "medium",
                "scheduled_date": "2026-07-15T09:00:00Z",
                "scheduled_end_date": "2026-07-15T11:00:00Z",
            }
        }


class InspectionUpdateRequest(BaseModel):
    """Schema for updating an existing inspection."""
    
    priority: Optional[str] = Field(None, description="Priority level")
    scheduled_date: Optional[datetime] = Field(None, description="Scheduled start date")
    scheduled_end_date: Optional[datetime] = Field(None, description="Expected completion time")
    started_at: Optional[datetime] = Field(None, description="Actual start time")
    completed_at: Optional[datetime] = Field(None, description="Actual completion time")
    location_lat: Optional[Decimal] = Field(None, description="Check-in latitude")
    location_lng: Optional[Decimal] = Field(None, description="Check-in longitude")
    location_accuracy: Optional[Decimal] = Field(None, description="GPS accuracy in meters")
    check_in_time: Optional[datetime] = Field(None, description="Check-in time")
    check_out_time: Optional[datetime] = Field(None, description="Check-out time")
    compliance_score: Optional[int] = Field(None, ge=0, le=100, description="Compliance score (0-100)")
    violation_count: Optional[int] = Field(None, ge=0, description="Number of violations")
    total_checklist_items: Optional[int] = Field(None, ge=0, description="Total checklist items")
    completed_checklist_items: Optional[int] = Field(None, ge=0, description="Completed checklist items")
    
    @validator('priority')
    def validate_priority(cls, v):
        if v is not None and v not in InspectionPriority.ALL:
            raise ValueError(f"Priority must be one of {InspectionPriority.ALL}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "priority": "high",
                "started_at": "2026-07-15T09:05:00Z",
                "location_lat": 28.6139,
                "location_lng": 77.2090,
                "location_accuracy": 5.2,
            }
        }


class InspectionStatusUpdateRequest(BaseModel):
    """Schema for updating inspection status."""
    
    status: str = Field(..., description="New status")
    transition_reason: Optional[str] = Field(None, description="Reason for status change")
    
    @validator('status')
    def validate_status(cls, v):
        if v not in InspectionStatus.ALL:
            raise ValueError(f"Status must be one of {InspectionStatus.ALL}")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "status": "in_progress",
                "transition_reason": "Starting inspection at site",
            }
        }


class InspectionCheckInRequest(BaseModel):
    """Schema for checking in at inspection site."""
    
    latitude: Decimal = Field(..., description="GPS latitude")
    longitude: Decimal = Field(..., description="GPS longitude")
    accuracy: Optional[Decimal] = Field(None, description="GPS accuracy in meters")
    
    class Config:
        json_schema_extra = {
            "example": {
                "latitude": 28.6139,
                "longitude": 77.2090,
                "accuracy": 5.2,
            }
        }


# ============================================================================
# Response Schemas
# ============================================================================

class InspectionResponse(BaseModel):
    """Schema for inspection response."""
    
    id: UUID
    inspector_id: UUID
    site_id: UUID
    inspection_type_id: UUID
    status: str
    priority: str
    scheduled_date: datetime
    scheduled_end_date: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    location_lat: Optional[Decimal]
    location_lng: Optional[Decimal]
    location_accuracy: Optional[Decimal]
    check_in_time: Optional[datetime]
    check_out_time: Optional[datetime]
    compliance_score: Optional[int]
    violation_count: int
    total_checklist_items: int
    completed_checklist_items: int
    created_at: datetime
    updated_at: datetime
    version: int
    
    class Config:
        from_attributes = True


class InspectionListResponse(BaseModel):
    """Schema for inspection list response with pagination."""
    
    inspections: list[InspectionResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspections": [],
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5,
            }
        }


class InspectionDetailResponse(InspectionResponse):
    """Schema for detailed inspection response with related data."""
    
    checklist_responses: Optional[list] = Field(None, description="Checklist responses")
    evidence: Optional[list] = Field(None, description="Evidence items")
    notes: Optional[list] = Field(None, description="Notes")
    state_history: Optional[list] = Field(None, description="State transition history")


class InspectionTimelineResponse(BaseModel):
    """Schema for inspection state timeline response."""
    
    state_history: list
    
    class Config:
        json_schema_extra = {
            "example": {
                "state_history": [
                    {
                        "id": "123e4567-e89b-12d3-a456-426614174000",
                        "from_state": None,
                        "to_state": "draft",
                        "transition_reason": "Inspection created",
                        "changed_at": "2026-07-15T09:00:00Z",
                    }
                ]
            }
        }


class InspectionComplianceStatsResponse(BaseModel):
    """Schema for compliance statistics response."""
    
    total: int
    completed: int
    pending: int
    average_compliance_score: float
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 50,
                "completed": 45,
                "pending": 5,
                "average_compliance_score": 87.5,
            }
        }
