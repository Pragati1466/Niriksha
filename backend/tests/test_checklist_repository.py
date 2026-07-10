"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist Repository Tests

Description:
    This module contains unit tests for the ChecklistRepository classes,
    testing specialized queries for checklists.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from uuid import uuid4

from ..repositories.checklist_repository import (
    ChecklistRepository,
    ChecklistTemplateRepository,
    ChecklistSectionRepository,
    ChecklistItemRepository,
)
from ..database.models.checklist import (
    InspectionChecklist,
    ChecklistTemplate,
    ChecklistSection,
    ChecklistItem,
)


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


class TestChecklistRepository:
    """Test cases for ChecklistRepository."""
    
    def test_find_by_inspection(self, mock_session):
        """Test finding checklist responses by inspection ID."""
        repo = ChecklistRepository(InspectionChecklist, mock_session)
        inspection_id = uuid4()
        result = repo.find_by_inspection(inspection_id)
        
        assert isinstance(result, list)
    
    def test_find_by_template(self, mock_session):
        """Test finding checklist responses by template ID."""
        repo = ChecklistRepository(InspectionChecklist, mock_session)
        template_id = uuid4()
        result = repo.find_by_template(template_id)
        
        assert isinstance(result, list)
    
    def test_find_non_compliant(self, mock_session):
        """Test finding non-compliant responses."""
        repo = ChecklistRepository(InspectionChecklist, mock_session)
        inspection_id = uuid4()
        result = repo.find_non_compliant(inspection_id)
        
        assert isinstance(result, list)
    
    def test_get_completion_percentage(self, mock_session):
        """Test getting completion percentage."""
        repo = ChecklistRepository(InspectionChecklist, mock_session)
        inspection_id = uuid4()
        result = repo.get_completion_percentage(inspection_id)
        
        assert isinstance(result, float)
        assert 0 <= result <= 100


class TestChecklistTemplateRepository:
    """Test cases for ChecklistTemplateRepository."""
    
    def test_find_active_templates(self, mock_session):
        """Test finding active templates."""
        repo = ChecklistTemplateRepository(ChecklistTemplate, mock_session)
        result = repo.find_active_templates()
        
        assert isinstance(result, list)
    
    def test_find_by_code(self, mock_session):
        """Test finding template by code."""
        repo = ChecklistTemplateRepository(ChecklistTemplate, mock_session)
        result = repo.find_by_code("TEST_TEMPLATE")
        
        assert result is None or isinstance(result, ChecklistTemplate)
    
    def test_find_by_domain(self, mock_session):
        """Test finding templates by domain."""
        repo = ChecklistTemplateRepository(ChecklistTemplate, mock_session)
        result = repo.find_by_domain("food_safety")
        
        assert isinstance(result, list)


class TestChecklistSectionRepository:
    """Test cases for ChecklistSectionRepository."""
    
    def test_find_by_template(self, mock_session):
        """Test finding sections by template ID."""
        repo = ChecklistSectionRepository(ChecklistSection, mock_session)
        template_id = uuid4()
        result = repo.find_by_template(template_id)
        
        assert isinstance(result, list)


class TestChecklistItemRepository:
    """Test cases for ChecklistItemRepository."""
    
    def test_find_by_section(self, mock_session):
        """Test finding items by section ID."""
        repo = ChecklistItemRepository(ChecklistItem, mock_session)
        section_id = uuid4()
        result = repo.find_by_section(section_id)
        
        assert isinstance(result, list)
    
    def test_find_by_template(self, mock_session):
        """Test finding items by template ID."""
        repo = ChecklistItemRepository(ChecklistItem, mock_session)
        template_id = uuid4()
        result = repo.find_by_template(template_id)
        
        assert isinstance(result, list)
    
    def test_find_required_items(self, mock_session):
        """Test finding required items."""
        repo = ChecklistItemRepository(ChecklistItem, mock_session)
        template_id = uuid4()
        result = repo.find_required_items(template_id)
        
        assert isinstance(result, list)
    
    def test_find_items_requiring_evidence(self, mock_session):
        """Test finding items requiring evidence."""
        repo = ChecklistItemRepository(ChecklistItem, mock_session)
        template_id = uuid4()
        result = repo.find_items_requiring_evidence(template_id)
        
        assert isinstance(result, list)
