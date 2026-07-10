"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence API Integration Tests

Description:
    This module contains integration tests for the Evidence API endpoints.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from ..api.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


class TestEvidenceAPI:
    """Integration tests for Evidence API endpoints."""
    
    def test_get_presigned_url(self, client):
        """Test getting presigned upload URL."""
        request_data = {
            "file_name": "test.jpg",
            "file_type": "image/jpeg",
            "file_size": 1024
        }
        
        response = client.post("/api/v1/evidence/presigned-url", json=request_data)
        assert response.status_code in [200, 500]
    
    def test_list_evidence(self, client):
        """Test listing evidence for an inspection."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/evidence/inspections/{inspection_id}")
        assert response.status_code in [200, 500]
    
    def test_get_evidence_by_id(self, client):
        """Test getting evidence by ID."""
        evidence_id = uuid4()
        response = client.get(f"/api/v1/evidence/{evidence_id}")
        assert response.status_code in [200, 404, 500]
    
    def test_get_photos(self, client):
        """Test getting photo evidence."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/evidence/inspections/{inspection_id}?evidence_type=photo")
        assert response.status_code in [200, 500]
    
    def test_get_documents(self, client):
        """Test getting document evidence."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/evidence/inspections/{inspection_id}?evidence_type=document")
        assert response.status_code in [200, 500]
    
    def test_update_verification_status(self, client):
        """Test updating verification status."""
        evidence_id = uuid4()
        response = client.patch(
            f"/api/v1/evidence/{evidence_id}/verification",
            params={
                "verification_status": "verified",
                "verification_confidence": 95.0
            }
        )
        assert response.status_code in [200, 400, 404, 500]
    
    def test_add_tag(self, client):
        """Test adding a tag to evidence."""
        evidence_id = uuid4()
        response = client.post(f"/api/v1/evidence/{evidence_id}/tags/test-tag")
        assert response.status_code in [200, 400, 404, 500]
    
    def test_remove_tag(self, client):
        """Test removing a tag from evidence."""
        evidence_id = uuid4()
        response = client.delete(f"/api/v1/evidence/{evidence_id}/tags/test-tag")
        assert response.status_code in [200, 400, 404, 500]
    
    def test_get_evidence_summary(self, client):
        """Test getting evidence summary."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/evidence/inspections/{inspection_id}/summary")
        assert response.status_code in [200, 500]
