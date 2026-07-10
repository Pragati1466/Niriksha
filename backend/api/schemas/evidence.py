"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence Schemas

Description:
    This module contains Pydantic schemas for evidence-related API
    requests and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, Field, validator


class EvidenceType:
    """Valid evidence types."""
    PHOTO = "photo"
    DOCUMENT = "document"
    AUDIO = "audio"
    VIDEO = "video"
    
    ALL = [PHOTO, DOCUMENT, AUDIO, VIDEO]


class VerificationStatus:
    """Valid verification statuses."""
    PENDING = "pending"
    VERIFIED = "verified"
    FLAGGED = "flagged"
    DISPUTED = "disputed"
    
    ALL = [PENDING, VERIFIED, FLAGGED, DISPUTED]


class EvidenceMetadataRequest(BaseModel):
    """Schema for evidence metadata."""
    
    description: Optional[str] = Field(None, description="Evidence description")
    tags: Optional[List[str]] = Field(None, description="Searchable tags")
    checklist_response_id: Optional[UUID] = Field(None, description="Link to checklist response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "description": "Kitchen cleanliness photo",
                "tags": ["kitchen", "hygiene"],
                "checklist_response_id": "123e4567-e89b-12d3-a456-426614174000",
            }
        }


class PhotoUploadRequest(BaseModel):
    """Schema for photo upload request."""
    
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    file_mime_type: str = Field(..., description="MIME type")
    capture_timestamp: Optional[datetime] = Field(None, description="Capture timestamp")
    capture_location_lat: Optional[Decimal] = Field(None, description="GPS latitude")
    capture_location_lng: Optional[Decimal] = Field(None, description="GPS longitude")
    capture_location_accuracy: Optional[Decimal] = Field(None, description="GPS accuracy in meters")
    device_id: Optional[str] = Field(None, description="Device ID")
    description: Optional[str] = Field(None, description="Evidence description")
    tags: Optional[List[str]] = Field(None, description="Searchable tags")
    checklist_response_id: Optional[UUID] = Field(None, description="Link to checklist response")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_name": "kitchen_photo.jpg",
                "file_size": 2048576,
                "file_mime_type": "image/jpeg",
                "capture_location_lat": 28.6139,
                "capture_location_lng": 77.2090,
                "capture_location_accuracy": 5.2,
                "description": "Kitchen cleanliness photo",
                "tags": ["kitchen", "hygiene"],
            }
        }


class DocumentUploadRequest(BaseModel):
    """Schema for document upload request."""
    
    file_name: str = Field(..., description="Original file name")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    file_mime_type: str = Field(..., description="MIME type")
    description: Optional[str] = Field(None, description="Document description")
    tags: Optional[List[str]] = Field(None, description="Searchable tags")
    
    @validator('file_mime_type')
    def validate_document_type(cls, v):
        if not v.startswith('application/pdf'):
            raise ValueError("Only PDF documents are allowed")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_name": "license_certificate.pdf",
                "file_size": 5242880,
                "file_mime_type": "application/pdf",
                "description": "Food safety license certificate",
            }
        }


class PresignedUrlRequest(BaseModel):
    """Schema for presigned URL request."""
    
    file_name: str = Field(..., description="File name")
    file_type: str = Field(..., description="File MIME type")
    file_size: int = Field(..., gt=0, description="File size in bytes")
    
    class Config:
        json_schema_extra = {
            "example": {
                "file_name": "photo.jpg",
                "file_type": "image/jpeg",
                "file_size": 2048576,
            }
        }


class PresignedUrlResponse(BaseModel):
    """Schema for presigned URL response."""
    
    url: str = Field(..., description="Presigned upload URL")
    fields: dict = Field(..., description="Additional fields for upload")
    expires_at: str = Field(..., description="URL expiration timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "url": "https://s3.amazonaws.com/bucket/photo.jpg?signature=...",
                "fields": {
                    "key": "inspections/123/photo.jpg",
                    "AWSAccessKeyId": "AKIAIOSFODNN7EXAMPLE",
                },
                "expires_at": "2026-07-15T10:00:00Z",
            }
        }


class EvidenceResponse(BaseModel):
    """Schema for evidence response."""
    
    id: UUID
    inspection_id: UUID
    checklist_response_id: Optional[UUID]
    evidence_type: str
    file_name: str
    file_path: str
    file_size: int
    file_mime_type: str
    file_hash: Optional[str]
    capture_timestamp: Optional[datetime]
    capture_location_lat: Optional[Decimal]
    capture_location_lng: Optional[Decimal]
    capture_location_accuracy: Optional[Decimal]
    device_id: Optional[str]
    description: Optional[str]
    tags: Optional[List[str]]
    verification_status: str
    verification_confidence: Optional[Decimal]
    verification_notes: Optional[str]
    uploaded_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class EvidenceListResponse(BaseModel):
    """Schema for evidence list response."""
    
    evidence: List[EvidenceResponse]
    total: int
    page: int
    page_size: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "evidence": [],
                "total": 50,
                "page": 1,
                "page_size": 20,
            }
        }


class VerificationStatusResponse(BaseModel):
    """Schema for verification status response."""
    
    evidence_id: UUID
    verification_status: str
    verification_confidence: Optional[Decimal]
    verification_notes: Optional[str]
    discrepancies: Optional[List[dict]]
    
    class Config:
        json_schema_extra = {
            "example": {
                "evidence_id": "123e4567-e89b-12d3-a456-426614174000",
                "verification_status": "verified",
                "verification_confidence": 94.5,
                "verification_notes": "No discrepancies detected",
                "discrepancies": [],
            }
        }
