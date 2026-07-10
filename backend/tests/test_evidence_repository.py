"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence Repository Tests

Description:
    This module contains unit tests for the EvidenceRepository class,
    testing specialized queries for evidence.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from uuid import uuid4

from ..repositories.evidence_repository import EvidenceRepository
from ..database.models.evidence import Evidence, EvidenceType, VerificationStatus


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
def evidence_repository(mock_session):
    """Create an EvidenceRepository instance for testing."""
    return EvidenceRepository(Evidence, mock_session)


class TestEvidenceRepository:
    """Test cases for EvidenceRepository."""
    
    def test_find_by_inspection(self, evidence_repository):
        """Test finding evidence by inspection ID."""
        inspection_id = uuid4()
        result = evidence_repository.find_by_inspection(inspection_id)
        
        assert isinstance(result, list)
    
    def test_find_by_checklist_response(self, evidence_repository):
        """Test finding evidence by checklist response ID."""
        response_id = uuid4()
        result = evidence_repository.find_by_checklist_response(response_id)
        
        assert isinstance(result, list)
    
    def test_find_by_type(self, evidence_repository):
        """Test finding evidence by type."""
        result = evidence_repository.find_by_type(EvidenceType.PHOTO)
        
        assert isinstance(result, list)
    
    def test_find_photos(self, evidence_repository):
        """Test finding photo evidence."""
        result = evidence_repository.find_photos()
        
        assert isinstance(result, list)
    
    def test_find_documents(self, evidence_repository):
        """Test finding document evidence."""
        result = evidence_repository.find_documents()
        
        assert isinstance(result, list)
    
    def test_find_by_verification_status(self, evidence_repository):
        """Test finding evidence by verification status."""
        result = evidence_repository.find_by_verification_status(VerificationStatus.PENDING)
        
        assert isinstance(result, list)
    
    def test_find_flagged_evidence(self, evidence_repository):
        """Test finding flagged evidence."""
        result = evidence_repository.find_flagged_evidence()
        
        assert isinstance(result, list)
    
    def test_find_by_hash(self, evidence_repository):
        """Test finding evidence by file hash."""
        result = evidence_repository.find_by_hash("abc123")
        
        assert result is None or isinstance(result, Evidence)
    
    def test_get_evidence_count_by_type(self, evidence_repository):
        """Test getting evidence count by type."""
        inspection_id = uuid4()
        result = evidence_repository.get_evidence_count_by_type(inspection_id)
        
        assert isinstance(result, dict)
    
    def test_get_verification_summary(self, evidence_repository):
        """Test getting verification summary."""
        inspection_id = uuid4()
        result = evidence_repository.get_verification_summary(inspection_id)
        
        assert isinstance(result, dict)
        assert "status_counts" in result
        assert "total" in result
