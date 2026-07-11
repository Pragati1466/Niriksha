"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Notes API Router

Description:
    This module provides FastAPI router for notes-related endpoints,
    including creating, updating, and querying inspection notes.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.notes import (
    NoteCreateRequest,
    NoteUpdateRequest,
    NoteResponse,
    NoteListResponse,
)
from ..schemas.common import PaginationParams
from ...repositories.base_repository import BaseRepository
from ...database.models.note import InspectionNote
from ...database.session import get_db


router = APIRouter(prefix="/notes", tags=["notes"])


class NoteService:
    """Simple service for notes operations."""
    
    def __init__(self, session: Session):
        self.repository = BaseRepository(InspectionNote, session)
        self.session = session
    
    def create_note(self, request: NoteCreateRequest) -> InspectionNote:
        """Create a new note."""
        note = InspectionNote(
            inspection_id=request.inspection_id,
            checklist_response_id=request.checklist_response_id,
            note_type=request.note_type,
            content=request.content,
            is_voice_note=request.is_voice_note,
            audio_file_path=request.audio_file_path,
            severity=request.severity,
            requires_action=request.requires_action
        )
        return self.repository.create(note)
    
    def get_by_id(self, note_id: UUID) -> Optional[InspectionNote]:
        """Get a note by ID."""
        return self.repository.get(note_id)
    
    def update_note(self, note_id: UUID, request: NoteUpdateRequest) -> InspectionNote:
        """Update a note."""
        update_data = request.model_dump(exclude_unset=True)
        updated_note = self.repository.update_by_id(note_id, update_data)
        if updated_note is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        return updated_note
    
    def delete_note(self, note_id: UUID) -> bool:
        """Delete a note."""
        return self.repository.delete_by_id(note_id)
    
    def get_by_inspection(self, inspection_id: UUID) -> list[InspectionNote]:
        """Get all notes for an inspection."""
        return self.repository.find_by_field("inspection_id", inspection_id)


@router.post("", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_note(
    request: NoteCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new note.
    
    Args:
        request: Note creation request
        db: Database session
        
    Returns:
        NoteResponse: The created note
    """
    try:
        service = NoteService(db)
        note = service.create_note(request)
        return note
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get a note by ID.
    
    Args:
        note_id: ID of the note
        db: Database session
        
    Returns:
        NoteResponse: The note
    """
    try:
        service = NoteService(db)
        note = service.get_by_id(note_id)
        if note is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: UUID,
    request: NoteUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update a note.
    
    Args:
        note_id: ID of the note
        request: Note update request
        db: Database session
        
    Returns:
        NoteResponse: The updated note
    """
    try:
        service = NoteService(db)
        note = service.update_note(note_id, request)
        return note
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(
    note_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete a note.
    
    Args:
        note_id: ID of the note
        db: Database session
    """
    try:
        service = NoteService(db)
        service.delete_note(note_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/inspections/{inspection_id}", response_model=NoteListResponse)
def list_notes(
    inspection_id: UUID,
    note_type: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    List notes for an inspection with optional type filter.
    
    Args:
        inspection_id: ID of the inspection
        note_type: Optional note type filter
        pagination: Pagination parameters
        db: Database session
        
    Returns:
        NoteListResponse: Paginated list of notes
    """
    try:
        service = NoteService(db)
        notes = service.get_by_inspection(inspection_id)
        
        # Filter by type if specified
        if note_type:
            notes = [n for n in notes if n.note_type == note_type]
        
        # Apply pagination
        paginated_notes = notes[pagination.skip:pagination.skip + pagination.page_size]
        
        return NoteListResponse(
            notes=paginated_notes,
            total=len(notes),
            page=pagination.page,
            page_size=pagination.page_size
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
