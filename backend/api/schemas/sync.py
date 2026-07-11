"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Sync Schemas

Description:
    This module contains Pydantic schemas for sync-related API
    requests and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional, List, Any
from uuid import UUID

from pydantic import BaseModel, Field, validator


class SyncActionType:
    """Valid sync action types."""
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"
    SYNC = "sync"
    
    ALL = (CREATE, UPDATE, DELETE, SYNC)


class SyncStatus:
    """Valid sync statuses."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    
    ALL = (PENDING, IN_PROGRESS, COMPLETED, FAILED)


class SyncPushRequest(BaseModel):
    """Schema for pushing offline changes to server."""
    
    changes: List[dict] = Field(..., description="List of changes to sync")
    last_sync_timestamp: Optional[str] = Field(None, description="Last sync timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "changes": [
                    {
                        "action_type": "create",
                        "entity_type": "inspection_checklist",
                        "entity_id": "123e4567-e89b-12d3-a456-426614174000",
                        "payload": {"key": "value"},
                    }
                ],
                "last_sync_timestamp": "2026-07-15T09:00:00Z",
            }
        }


class SyncPullRequest(BaseModel):
    """Schema for pulling server changes."""
    
    last_sync_timestamp: str = Field(..., description="Last sync timestamp")
    entity_types: Optional[List[str]] = Field(None, description="Entity types to pull")
    
    class Config:
        json_schema_extra = {
            "example": {
                "last_sync_timestamp": "2026-07-15T09:00:00Z",
                "entity_types": ["inspections", "checklists"],
            }
        }


class SyncPushResponse(BaseModel):
    """Schema for sync push response."""
    
    synced_items: List[dict] = Field(..., description="Successfully synced items")
    conflicts: List[dict] = Field(default_factory=list, description="Sync conflicts")
    errors: List[dict] = Field(default_factory=list, description="Sync errors")
    server_timestamp: str = Field(..., description="Current server timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "synced_items": [],
                "conflicts": [],
                "errors": [],
                "server_timestamp": "2026-07-15T10:00:00Z",
            }
        }


class SyncPullResponse(BaseModel):
    """Schema for sync pull response."""
    
    changes: List[dict] = Field(..., description="Server changes")
    server_timestamp: str = Field(..., description="Current server timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "changes": [],
                "server_timestamp": "2026-07-15T10:00:00Z",
            }
        }


class SyncStatusResponse(BaseModel):
    """Schema for sync status response."""
    
    pending_items: int = Field(..., description="Number of pending items")
    in_progress_items: int = Field(default=0, description="Number of in-progress items")
    failed_items: int = Field(default=0, description="Number of failed items")
    last_sync: Optional[str] = Field(None, description="Last successful sync timestamp")
    conflicts: int = Field(default=0, description="Number of conflicts")
    
    class Config:
        json_schema_extra = {
            "example": {
                "pending_items": 5,
                "in_progress_items": 0,
                "failed_items": 2,
                "last_sync": "2026-07-15T09:00:00Z",
                "conflicts": 1,
            }
        }


class ConflictResolutionRequest(BaseModel):
    """Schema for resolving sync conflicts."""
    
    resolution_action: str = Field(..., description="Resolution action: keep_server, keep_local, merge")
    resolution_data: Optional[dict] = Field(None, description="Additional resolution data")
    
    @validator('resolution_action')
    def validate_resolution_action(cls, v):
        if v not in ("keep_server", "keep_local", "merge"):
            raise ValueError("Resolution action must be keep_server, keep_local, or merge")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "resolution_action": "keep_local",
                "resolution_data": {"reason": "Local changes are more recent"},
            }
        }


class ConflictResolutionResponse(BaseModel):
    """Schema for conflict resolution response."""
    
    conflict_id: UUID
    resolution_status: str
    resolved_at: str
    resolution_action: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "conflict_id": "123e4567-e89b-12d3-a456-426614174000",
                "resolution_status": "resolved_local",
                "resolved_at": "2026-07-15T10:00:00Z",
                "resolution_action": "keep_local",
            }
        }
