"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Common Schemas

Description:
    This module contains common Pydantic schemas used across multiple
    API endpoints, including pagination, error responses, and success responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, Field


class PaginationParams(BaseModel):
    """Schema for pagination parameters."""
    
    page: int = Field(default=1, ge=1, description="Page number")
    page_size: int = Field(default=20, ge=1, le=100, description="Items per page")
    
    @property
    def skip(self) -> int:
        """Calculate offset for pagination."""
        return (self.page - 1) * self.page_size
    
    class Config:
        json_schema_extra = {
            "example": {
                "page": 1,
                "page_size": 20,
            }
        }


class PaginatedResponse(BaseModel):
    """Schema for paginated response."""
    
    total: int = Field(..., description="Total number of items")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total number of pages")
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 100,
                "page": 1,
                "page_size": 20,
                "total_pages": 5,
            }
        }


class SuccessResponse(BaseModel):
    """Schema for success response."""
    
    message: str = Field(..., description="Success message")
    data: Optional[Any] = Field(None, description="Optional response data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
                "data": {"id": "123e4567-e89b-12d3-a456-426614174000"},
            }
        }


class ErrorResponse(BaseModel):
    """Schema for error response."""
    
    error: dict = Field(..., description="Error details")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Request validation failed",
                    "details": {
                        "field": "email",
                        "reason": "Invalid email format",
                    },
                    "request_id": "req_abc123",
                    "timestamp": "2026-07-15T10:00:00Z",
                }
            }
        }


class FilterParams(BaseModel):
    """Schema for common filter parameters."""
    
    date_from: Optional[str] = Field(None, description="Start date filter (ISO format)")
    date_to: Optional[str] = Field(None, description="End date filter (ISO format)")
    status: Optional[str] = Field(None, description="Status filter")
    search: Optional[str] = Field(None, description="Search query")
    
    class Config:
        json_schema_extra = {
            "example": {
                "date_from": "2026-07-01T00:00:00Z",
                "date_to": "2026-07-31T23:59:59Z",
                "status": "completed",
                "search": "restaurant",
            }
        }


class IdResponse(BaseModel):
    """Schema for ID-only response."""
    
    id: UUID = Field(..., description="Resource ID")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
            }
        }


class BulkDeleteRequest(BaseModel):
    """Schema for bulk 삭제 request."""
    
    ids: List[UUID] = Field(..., description="List of IDs to delete")
    
    class Config:
        json_schema_extra = {
            "example": {
                "ids": [
                    "123e4567-e89b-12d3-a456-426614174000",
                    "223e4567-e89b-12d3-a456-426614174000",
                ],
            }
        }


class BulkDeleteResponse(BaseModel):
    """Schema for bulk delete response."""
    
    deleted_count: int = Field(..., description="Number of items deleted")
    failed_ids: List[UUID] = Field(default_factory=list, description="IDs that failed to delete")
    
    class Config:
        json_schema_extra = {
            "example": {
                "deleted_count": 2,
                "failed_ids": [],
            }
        }
