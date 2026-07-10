"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Repository Tests

Description:
    This module contains unit tests for the InspectionRepository class,
    testing specialized queries for inspections.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from uuid import uuid4
from datetime import datetime

from ..repositories.inspection_repository import InspectionRepository
from ..database.models.inspection import Inspection, InspectionStatus, InspectionPriority


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    class MockSession:
        def __init__(self):
            self.data = {}
        
        def add(self, item):
            self.data[str(item.id)] = item
        
        def commit(self):
            pass
        
        def refresh(self, item):
            pass
        
        def rollback(self):
            pass
        
        def flush(self):
            pass
    
    return MockSession()


@pytest.fixture
def inspection_repository(mock_session):
    """Create an InspectionRepository instance for testing."""
    return InspectionRepository(Inspection, mock_session)


class TestInspectionRepository:
    """Test cases for InspectionRepository."""
    
    def test_find_by_inspector(self, inspection_repository):
        """Test finding inspections by inspector ID."""
        inspector_id = uuid4()
        result = inspection_repository.find_by_inspector(inspector_id)
        
        assert isinstance(result, list)
    
    def test_find_by_site(self, inspection_repository):
        """Test finding inspections by site ID."""
        site_id = uuid4()
        result = inspection_repository.find_by_site(site_id)
        
        assert isinstance(result, list)
    
    def test_find_by_status(self, inspection_repository):
        """Test finding inspections by status."""
        result = inspection_repository.find_by_status(InspectionStatus.IN_PROGRESS)
        
        assert isinstance(result, list)
    
    def test_find_active_inspections(self, inspection_repository):
        """Test finding active inspections."""
        result = inspection_repository.find_active_inspections()
        
        assert isinstance(result, list)
    
    def test_find_overdue_inspections(self, inspection_repository):
        """Test finding overdue inspections."""
        result = inspection_repository.find_overdue_inspections()
        
        assert isinstance(result, list)
    
    def test_find_by_priority(self, inspection_repository):
        """Test finding inspections by priority."""
        result = inspection_repository.find_by_priority(InspectionPriority.HIGH)
        
        assert isinstance(result, list)
    
    def test_get_compliance_stats(self, inspection_repository):
        """Test getting compliance statistics."""
        inspector_id = uuid4()
        result = inspection_repository.get_compliance_stats(inspector_id)
        
        assert isinstance(result, dict)
        assert "total" in result
        assert "completed" in result
        assert "pending" in result
        assert "average_compliance_score" in result
    
    def test_get_inspection_count_by_status(self, inspection_repository):
        """Test getting inspection count by status."""
        result = inspection_repository.get_inspection_count_by_status()
        
        assert isinstance(result, dict)
