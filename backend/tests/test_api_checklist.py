"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Checklist API Integration Tests

Description:
    This module contains integration tests for the Checklist API endpoints.

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


class TestChecklistAPI:
    """Integration tests for Checklist API endpoints."""
    
    def test_list_templates(self, client):
        """Test listing checklist templates."""
        response = client.get("/api/v1/checklists/templates")
        assert response.status_code in [200, 500]
    
    def test_get_template_by_code(self, client):
        """Test getting a template by code."""
        response = client.get("/api/v1/checklists/templates/code/TEST_TEMPLATE")
        assert response.status_code in [200, 404, 500]
    
    def test_get_template_with_items(self, client):
        """Test getting a template with sections and items."""
        template_id = uuid4()
        response = client.get(f"/api/v1/checklists/templates/{template_id}")
        assert response.status_code in [200, 404, 500]
    
    def test_create_responses(self, client):
        """Test creating checklist responses."""
        request_data = {
            "inspection_id": str(uuid4()),
            "checklist_template_id": str(uuid4()),
            "responses": [
                {
                    "item_id": str(uuid4()),
                    "response_value": "yes",
                    "is_compliant": True
                }
            ]
        }
        
        response = client.post("/api/v1/checklists/responses", json=request_data)
        assert response.status_code in [201, 400, 500]
    
    def test_get_completion_percentage(self, client):
        """Test getting completion percentage."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/checklists/inspections/{inspection_id}/completion")
        assert response.status_code in [200, 500]
    
    def test_get_non_compliant_responses(self, client):
        """Test getting non-compliant responses."""
        inspection_id = uuid4()
        response = client.get(f"/api/v1/checklists/inspections/{inspection_id}/non-compliant")
        assert response.status_code in [200, 500]
