"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Notes Schemas

Description:
    This module contains Pydantic schemas for notes-related API
    requests and responses.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class NoteType:
    """Valid note types."""
    OBSERVATION = "observation"
    VIOLATION = "violation"
    GENERAL = "general"
    FOLLOW_UP = "follow_up"
    CLARIFICATION = "clarification"
    
    ALL = [OBSERVATION, VIOLATION, GENERAL, FOLLOW_UP, CLARIFICATION]


class NoteCreateRequest(BaseModel):
    """Schema for creating a note."""
    
    inspection_id: UUID = Field(..., description="ID of the inspection")
    checklist_response_id: Optional[UUID] = Field(None, description="Link to checklist response")
    note_type: str = Field(..., description="Type of note")
    content: str = Field(..., min_length=1, description="Note content")
    is_voice_note: bool = Field(default=False, description="Whether this is a voice note")
    audio_file_path: Optional[str] = Field(None, description="Path to audio file")
    severity: Optional[str] = Field(None, description="Severity level")
    requires_action: bool = Field(default=False, description="Whether action is required")
    
    @validator('note_type')
    def validate_note_type(cls, v):
        if v not in NoteType.ALL:
            raise ValueError(f"Note type must be one of {NoteType.ALL}")
        return v
    
    @validator('severity')
    def validate_severity(cls, v):
        if v is not None and v not in ["critical", "major", "minor"]:
            raise ValueError("Severity must be critical, major, or minor")
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "inspection_id": "123e4567-e89b-12d3-a456-426614174000",
                "note_type": "violation",
                "content": "Equipment not properly maintained",
                "severity": "major",
                "requires_action": True,
            }
        }


class NoteUpdateRequest(BaseModel):
    """Schema for updating a note."""
    
    content: Optional[str] = Field(None, min_length=1, description="Note content")
    action_taken: Optional[str] = Field(None, description="Description of action taken")
    requires_action: Optional[bool] = Field(None, description="Whether action is required")
    
    class Config:
        json_schema_extra = {
            "example": {
                "action_taken": "Equipment maintenance scheduled",
                "requires_action": False,
            }
        }


class NoteResponse(BaseModel):
    """Schema for note response."""
    
    id: UUID
    inspection_id: UUID
    checklist_response_id: Optional[UUID]
    created_by: Optional[UUID]
    note_type: str
    content: str
    is_voice_note: bool
    audio_file_path: Optional[str]
    severity: Optional[str]
    requires_action: bool
    action_taken: Optional[str]
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class NoteListResponse(BaseModel):
    """Schema for note list response."""
    
    notes: list[NoteResponse]
    total: int
    page: int
    page_size: int
