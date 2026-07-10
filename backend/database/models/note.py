"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Note Model

Description:
    This module defines the InspectionNote model for storing text notes,
    observations, and contextual information added during inspections,
    including support for voice notes.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID

from sqlalchemy import String, Text, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class NoteType:
    """
    Enumeration of note types.
    
    Different types of notes serve different purposes during inspections,
    from general observations to violation documentation.
    """
    OBSERVATION = "observation"
    VIOLATION = "violation"
    GENERAL = "general"
    FOLLOW_UP = "follow_up"
    CLARIFICATION = "clarification"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid note type values."""
        return [
            cls.OBSERVATION,
            cls.VIOLATION,
            cls.GENERAL,
            cls.FOLLOW_UP,
            cls.CLARIFICATION,
        ]
    
    @classmethod
    def is_critical(cls, note_type: str) -> bool:
        """
        Check if note type is critical (requires immediate attention).
        
        Args:
            note_type: Note type string
            
        Returns:
            bool: True if critical, False otherwise
        """
        return note_type in [cls.VIOLATION, cls.FOLLOW_UP]
    
    @classmethod
    def requires_action(cls, note_type: str) -> bool:
        """
        Check if note type requires follow-up action.
        
        Args:
            note_type: Note type string
            
        Returns:
            bool: True if requires action, False otherwise
        """
        return note_type in [cls.VIOLATION, cls.FOLLOW_UP]


class InspectionNote(BaseModel):
    """
    Model for storing notes and observations during inspections.
    
    Inspectors need to record detailed observations, violation details, and
    contextual information that doesn't fit into structured checklist responses.
    This model supports text notes and voice notes with transcription.
    
    Attributes:
        inspection_id: ID of the inspection this note belongs to
        checklist_response_id: ID of the checklist response (optional)
        created_by: ID of the inspector who created the note
        note_type: Type of note (observation, violation, general, etc.)
        content: Note content
        is_voice_note: Whether this is a transcribed voice note
        audio_file_path: Path to original audio file
        severity: Severity level if applicable
        requires_action: Whether this note requires follow-up action
        action_taken: Description of action taken
    """
    
    __tablename__ = "inspection_notes"
    
    # Foreign Keys
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection this note belongs to"
    )
    
    checklist_response_id: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the checklist response (optional)"
    )
    
    created_by: Mapped[Optional[UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=True,
        index=True,
        doc="ID of the inspector who created the note"
    )
    
    # Note Content
    note_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        doc="Type of note (observation, violation, general, etc.)"
    )
    
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        doc="Note content"
    )
    
    # Voice Note Support
    is_voice_note: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        doc="Whether this is a transcribed voice note"
    )
    
    audio_file_path: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True,
        doc="Path to original audio file"
    )
    
    # Severity and Action Tracking
    severity: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        index=True,
        doc="Severity level if applicable"
    )
    
    requires_action: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        doc="Whether this note requires follow-up action"
    )
    
    action_taken: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True,
        doc="Description of action taken"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"note_type IN {tuple(NoteType.all())}",
            name="chk_note_type"
        ),
        CheckConstraint(
            "severity IN ('critical', 'major', 'minor')",
            name="chk_severity"
        ),
    )
    
    def is_violation(self) -> bool:
        """
        Check if this note is a violation note.
        
        Returns:
            bool: True if violation, False otherwise
        """
        return self.note_type == NoteType.VIOLATION
    
    def is_critical(self) -> bool:
        """
        Check if this note is critical (requires immediate attention).
        
        Returns:
            bool: True if critical, False otherwise
        """
        return NoteType.is_critical(self.note_type)
    
    def needs_action(self) -> bool:
        """
        Check if this note requires follow-up action.
        
        Returns:
            bool: True if action required, False otherwise
        """
        return self.requires_action or NoteType.requires_action(self.note_type)
    
    def has_audio(self) -> bool:
        """
        Check if this note has an associated audio file.
        
        Returns:
            bool: True if audio file exists, False otherwise
        """
        return self.is_voice_note and self.audio_file_path is not None
    
    def is_actioned_upon(self) -> bool:
        """
        Check if action has been taken for this note.
        
        Returns:
            bool: True if action taken, False otherwise
        """
        return self.action_taken is not None and len(self.action_taken.strip()) > 0
    
    def mark_action_taken(self, action: str) -> None:
        """
        Mark that action has been taken for this note.
        
        Args:
            action: Description of action taken
        """
        self.action_taken = action
        self.requires_action = False
    
    def get_content_preview(self, max_length: int = 100) -> str:
        """
        Get a preview of the note content.
        
        Args:
            max_length: Maximum length of preview
            
        Returns:
            str: Content preview truncated to max_length
        """
        if len(self.content) <= max_length:
            return self.content
        return self.content[:max_length] + "..."
    
    def get_word_count(self) -> int:
        """
        Get the word count of the note content.
        
        Returns:
            int: Number of words in the content
        """
        return len(self.content.split())
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"InspectionNote(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"note_type={self.note_type}, "
            f"requires_action={self.requires_action})"
        )
