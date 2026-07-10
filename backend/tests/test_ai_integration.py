"""
NIRIKSHA - Inspection Workflow & Data Collection Module
AI Integration API Tests

Description:
    Integration tests for AI API endpoints including evidence verification,
    risk score calculation, report generation, and health checks.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from uuid import uuid4

from backend.api.main import app


client = TestClient(app)


# ============================================================================
# Evidence Verification API Tests (TC-API-024)
# ============================================================================

class TestEvidenceVerificationAPI:
    """Test cases for evidence verification API endpoint"""
    
    def test_verify_evidence_success(self):
        """TC-API-024: POST /ai/verify-evidence - Trigger verification"""
        evidence_id = str(uuid4())
        
        request_data = {
            "evidence_id": evidence_id,
            "file_url": "http://s3.bucket/evidence.jpg",
            "file_type": "photo",
            "metadata": {
                "capture_timestamp": "2026-07-10T12:00:00Z",
                "location": {
                    "lat": 28.6139,
                    "lng": 77.2090,
                    "accuracy": 10.0
                },
                "device_id": "device-123"
            }
        }
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service:
            mock_service = Mock()
            mock_service.verify_evidence = AsyncMock(return_value={
                "verification_status": "verified",
                "confidence": 0.95
            })
            mock_ai_service.return_value = mock_service
            
            response = client.post("/api/v1/ai/verify-evidence", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Evidence verification initiated"
        assert data["data"]["evidence_id"] == evidence_id
        assert data["data"]["status"] == "verifying"
    
    def test_verify_evidence_not_found(self):
        """Test evidence verification with non-existent evidence"""
        evidence_id = str(uuid4())
        
        request_data = {
            "evidence_id": evidence_id,
            "file_url": "http://s3.bucket/evidence.jpg",
            "file_type": "photo",
            "metadata": {}
        }
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service:
            mock_service = Mock()
            mock_service.verify_evidence = AsyncMock(return_value={
                "verification_status": "verified",
                "confidence": 0.95
            })
            mock_ai_service.return_value = mock_service
            
            response = client.post("/api/v1/ai/verify-evidence", json=request_data)
        
        # Should still accept the request even if evidence doesn't exist
        # (async task will handle the check)
        assert response.status_code == 200
    
    def test_verify_evidence_invalid_file_type(self):
        """Test evidence verification with invalid file type"""
        evidence_id = str(uuid4())
        
        request_data = {
            "evidence_id": evidence_id,
            "file_url": "http://s3.bucket/evidence.jpg",
            "file_type": "invalid_type",
            "metadata": {}
        }
        
        response = client.post("/api/v1/ai/verify-evidence", json=request_data)
        
        # Should still accept (validation happens in AI service)
        assert response.status_code == 200


# ============================================================================
# Risk Score API Tests (TC-API-025)
# ============================================================================

class TestRiskScoreAPI:
    """Test cases for risk score calculation API endpoint"""
    
    def test_calculate_risk_score_success(self):
        """TC-API-025: POST /ai/risk-score - Calculate risk score"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        mock_inspection.risk_score = None
        mock_inspection.risk_level = None
        
        mock_responses = [
            Mock(to_dict=lambda: {"is_compliant": True}),
            Mock(to_dict=lambda: {"is_compliant": False}),
            Mock(to_dict=lambda: {"is_compliant": True})
        ]
        
        mock_evidence = [Mock(), Mock(), Mock()]
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo, \
             patch('backend.api.routers.ai.ChecklistRepository') as mock_checklist_repo, \
             patch('backend.api.routers.ai.EvidenceRepository') as mock_evidence_repo:
            
            mock_service = Mock()
            mock_service.calculate_risk_score = AsyncMock(return_value={
                "risk_score": 75,
                "risk_level": "medium",
                "factors": [{"factor": "violation_count", "impact": 0.3}]
            })
            mock_ai_service.return_value = mock_service
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo_instance.update = Mock()
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            mock_checklist_repo_instance = Mock()
            mock_checklist_repo_instance.find_by_inspection = Mock(return_value=mock_responses)
            mock_checklist_repo.return_value = mock_checklist_repo_instance
            
            mock_evidence_repo_instance = Mock()
            mock_evidence_repo_instance.find_by_inspection = Mock(return_value=mock_evidence)
            mock_evidence_repo.return_value = mock_evidence_repo_instance
            
            response = client.post("/api/v1/ai/risk-score", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Risk score calculated successfully"
        assert data["data"]["risk_score"] == 75
        assert data["data"]["risk_level"] == "medium"
    
    def test_calculate_risk_score_inspection_not_found(self):
        """Test risk score calculation with non-existent inspection"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id
        }
        
        with patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=None)
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/risk-score", json=request_data)
        
        assert response.status_code == 404
    
    def test_calculate_risk_score_with_fallback(self):
        """Test risk score calculation with fallback when AI fails"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        mock_inspection.risk_score = None
        mock_inspection.risk_level = None
        
        mock_responses = [
            Mock(to_dict=lambda: {"is_compliant": True}),
            Mock(to_dict=lambda: {"is_compliant": False})
        ]
        
        mock_evidence = [Mock(), Mock()]
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo, \
             patch('backend.api.routers.ai.ChecklistRepository') as mock_checklist_repo, \
             patch('backend.api.routers.ai.EvidenceRepository') as mock_evidence_repo:
            
            mock_service = Mock()
            mock_service.calculate_risk_score = AsyncMock(return_value=None)  # AI fails
            mock_service.calculate_fallback_risk_score = Mock(return_value={
                "risk_score": 50,
                "risk_level": "medium",
                "fallback": True
            })
            mock_ai_service.return_value = mock_service
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo_instance.update = Mock()
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            mock_checklist_repo_instance = Mock()
            mock_checklist_repo_instance.find_by_inspection = Mock(return_value=mock_responses)
            mock_checklist_repo.return_value = mock_checklist_repo_instance
            
            mock_evidence_repo_instance = Mock()
            mock_evidence_repo_instance.find_by_inspection = Mock(return_value=mock_evidence)
            mock_evidence_repo.return_value = mock_evidence_repo_instance
            
            response = client.post("/api/v1/ai/risk-score", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["data"]["fallback"] == True


# ============================================================================
# Report Generation API Tests (TC-API-026)
# ============================================================================

class TestReportGenerationAPI:
    """Test cases for report generation API endpoint"""
    
    def test_generate_report_success(self):
        """TC-API-026: POST /ai/generate-report - Generate report"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id,
            "report_type": "detailed",
            "include_recommendations": True,
            "include_charts": True
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        mock_inspection.report_url = None
        mock_inspection.report_generated_at = None
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            
            mock_service = Mock()
            mock_service.generate_report = AsyncMock(return_value={
                "report_id": "report-123",
                "report_url": "http://report.url/generated.pdf",
                "generated_at": "2026-07-10T12:00:00Z"
            })
            mock_ai_service.return_value = mock_service
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo_instance.update = Mock()
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "Report generation initiated"
        assert data["data"]["inspection_id"] == inspection_id
        assert data["data"]["status"] == "generating"
    
    def test_generate_report_with_summary_type(self):
        """Test report generation with summary type"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id,
            "report_type": "summary",
            "include_recommendations": False,
            "include_charts": False
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            
            mock_service = Mock()
            mock_service.generate_report = AsyncMock(return_value={
                "report_id": "report-123",
                "report_url": "http://report.url/summary.pdf",
                "generated_at": "2026-07-10T12:00:00Z"
            })
            mock_ai_service.return_value = mock_service
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        assert response.status_code == 200
    
    def test_generate_report_inspection_not_found(self):
        """Test report generation with non-existent inspection"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id,
            "report_type": "detailed"
        }
        
        with patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=None)
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        assert response.status_code == 404
    
    def test_generate_report_ai_failure(self):
        """Test report generation when AI fails"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id,
            "report_type": "detailed"
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            
            mock_service = Mock()
            mock_service.generate_report = AsyncMock(return_value=None)  # AI fails
            mock_ai_service.return_value = mock_service
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        # Task is initiated even if AI might fail later


# ============================================================================
# Health Check API Tests (TC-API-027)
# ============================================================================

class TestHealthCheckAPI:
    """Test cases for AI health check endpoint"""
    
    def test_health_check_success(self):
        """TC-API-027: GET /ai/health - Check AI service health"""
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service:
            mock_service = Mock()
            mock_service.ai_base_url = "http://localhost:9000"
            mock_service.circuit_breakers = {
                "risk_score": Mock(state="closed", failure_count=0, can_attempt=Mock(return_value=True)),
                "verify_evidence": Mock(state="closed", failure_count=0, can_attempt=Mock(return_value=True)),
                "generate_report": Mock(state="closed", failure_count=0, can_attempt=Mock(return_value=True))
            }
            mock_ai_service.return_value = mock_service
            
            response = client.get("/api/v1/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["message"] == "AI service health check completed"
        assert data["data"]["ai_base_url"] == "http://localhost:9000"
        assert "circuit_breakers" in data["data"]
    
    def test_health_check_with_open_circuit(self):
        """Test health check with open circuit breaker"""
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service:
            mock_service = Mock()
            mock_service.ai_base_url = "http://localhost:9000"
            mock_service.circuit_breakers = {
                "risk_score": Mock(state="open", failure_count=5, can_attempt=Mock(return_value=False)),
                "verify_evidence": Mock(state="closed", failure_count=0, can_attempt=Mock(return_value=True)),
                "generate_report": Mock(state="closed", failure_count=0, can_attempt=Mock(return_value=True))
            }
            mock_ai_service.return_value = mock_service
            
            response = client.get("/api/v1/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["data"]["circuit_breakers"]["risk_score"]["state"] == "open"
        assert data["data"]["circuit_breakers"]["risk_score"]["failure_count"] == 5
    
    def test_health_check_service_error(self):
        """Test health check when service has error"""
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service:
            mock_ai_service.side_effect = Exception("Service error")
            
            response = client.get("/api/v1/ai/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == False
        assert "error" in data["data"]


# ============================================================================
# Request Validation Tests
# ============================================================================

class TestRequestValidation:
    """Test cases for request validation"""
    
    def test_verify_evidence_missing_required_field(self):
        """Test evidence verification with missing required field"""
        request_data = {
            "file_url": "http://s3.bucket/evidence.jpg",
            "file_type": "photo",
            "metadata": {}
            # Missing evidence_id
        }
        
        response = client.post("/api/v1/ai/verify-evidence", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_risk_score_missing_required_field(self):
        """Test risk score with missing required field"""
        request_data = {}
        # Missing inspection_id
        
        response = client.post("/api/v1/ai/risk-score", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_generate_report_missing_required_field(self):
        """Test report generation with missing required field"""
        request_data = {
            "report_type": "detailed"
            # Missing inspection_id
        }
        
        response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_report_type(self):
        """Test report generation with invalid report type"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id,
            "report_type": "invalid_type"
        }
        
        # Pydantic should handle this
        response = client.post("/api/v1/ai/generate-report", json=request_data)
        
        # May pass validation but AI service will handle
        assert response.status_code in [200, 422]


# ============================================================================
# Error Handling Tests
# ============================================================================

class TestErrorHandling:
    """Test cases for error handling"""
    
    def test_verify_evidence_database_error(self):
        """Test evidence verification with database error"""
        evidence_id = str(uuid4())
        
        request_data = {
            "evidence_id": evidence_id,
            "file_url": "http://s3.bucket/evidence.jpg",
            "file_type": "photo",
            "metadata": {}
        }
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.EvidenceRepository') as mock_evidence_repo:
            
            mock_service = Mock()
            mock_service.verify_evidence = AsyncMock(return_value={
                "verification_status": "verified",
                "confidence": 0.95
            })
            mock_ai_service.return_value = mock_service
            
            mock_evidence_repo_instance = Mock()
            mock_evidence_repo_instance.get = Mock(side_effect=Exception("Database error"))
            mock_evidence_repo.return_value = mock_evidence_repo_instance
            
            response = client.post("/api/v1/ai/verify-evidence", json=request_data)
        
        # Should return 500 for database errors
        assert response.status_code == 500
    
    def test_risk_score_service_error(self):
        """Test risk score with service error"""
        inspection_id = str(uuid4())
        
        request_data = {
            "inspection_id": inspection_id
        }
        
        mock_inspection = Mock()
        mock_inspection.id = inspection_id
        
        with patch('backend.api.routers.ai.get_ai_service') as mock_ai_service, \
             patch('backend.api.routers.ai.InspectionRepository') as mock_inspection_repo:
            
            mock_ai_service.side_effect = Exception("Service error")
            
            mock_inspection_repo_instance = Mock()
            mock_inspection_repo_instance.get = Mock(return_value=mock_inspection)
            mock_inspection_repo.return_value = mock_inspection_repo_instance
            
            response = client.post("/api/v1/ai/risk-score", json=request_data)
        
        assert response.status_code == 500
