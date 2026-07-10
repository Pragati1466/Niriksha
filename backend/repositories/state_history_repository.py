"""
NIRIKSHA - Inspection Workflow & Data Collection Module
State History Repository

Description:
    This module provides the InspectionStateHistoryRepository for performing
    database operations specific to the InspectionStateHistory model.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from .base_repository import BaseRepository
from ..database.models.state_history import InspectionStateHistory


class InspectionStateHistoryRepository(BaseRepository[InspectionStateHistory]):
    """
    Repository for InspectionStateHistory model with specialized queries.
    
    This repository provides methods for querying state history by inspection
    and status.
    """
    
    def find_by_inspection(self, inspection_id: UUID) -> List[InspectionStateHistory]:
        """
        Find all state history entries for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[InspectionStateHistory]: List of state history entries
        """
        return self.find_by_field("inspection_id", inspection_id)
    
    def find_by_status(self, status: str) -> List[InspectionStateHistory]:
        """
        Find all state history entries with a specific status.
        
        Args:
            status: Status to filter by
            
        Returns:
            List[InspectionStateHistory]: List of state history entries
        """
        return self.find_by_field("to_state", status)
    
    def find_by_changed_by(self, user_id: UUID) -> List[InspectionStateHistory]:
        """
        Find all state history entries changed by a specific user.
        
        Args:
            user_id: ID of the user
            
        Returns:
            List[InspectionStateHistory]: List of state history entries
        """
        return self.find_by_field("changed_by", user_id)
