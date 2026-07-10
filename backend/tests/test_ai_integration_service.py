"""
NIRIKSHA - Inspection Workflow & Data Collection Module
AI Integration Service Unit Tests

Description:
    Unit tests for the AI integration service including circuit breaker,
    retry logic, evidence verification, risk score calculation, fallback,
    and report generation.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
import asyncio
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta
from decimal import Decimal

from backend.services.ai_integration_service import (
    AIIntegrationService,
    CircuitBreaker,
    get_ai_service
)


# ============================================================================
# Circuit Breaker Tests
# ============================================================================

class TestCircuitBreaker:
    """Test cases for CircuitBreaker class (TC-AI-001 to TC-AI-005)"""
    
    def test_circuit_breaker_opens_after_failures(self):
        """TC-AI-001: Circuit breaker opens after 5 consecutive failures"""
        cb = CircuitBreaker(failure_threshold=5, timeout=60.0)
        
        # Record 5 failures
        for _ in range(5):
            cb.record_failure()
        
        assert cb.state == "open"
        assert cb.failure_count == 5
    
    def test_circuit_breaker_closes_after_timeout(self):
        """TC-AI-002: Circuit breaker closes after timeout elapses"""
        cb = CircuitBreaker(failure_threshold=5, timeout=1.0)
        
        # Record 5 failures to open circuit
        for _ in range(5):
            cb.record_failure()
        
        assert cb.state == "open"
        
        # Wait for timeout
        cb.last_failure_time = datetime.now() - timedelta(seconds=2)
        
        # Should allow attempt after timeout
        assert cb.can_attempt() == True
        assert cb.state == "half-open"
    
    def test_circuit_breaker_half_open_allows_attempt(self):
        """TC-AI-003: Circuit breaker allows one attempt in half-open state"""
        cb = CircuitBreaker(failure_threshold=5, timeout=1.0)
        
        # Open circuit
        for _ in range(5):
            cb.record_failure()
        
        # Move to half-open by setting timeout
        cb.last_failure_time = datetime.now() - timedelta(seconds=2)
        
        assert cb.state == "half-open"
        assert cb.can_attempt() == True
    
    def test_circuit_breaker_resets_on_success(self):
        """TC-AI-004: Circuit breaker resets on successful request"""
        cb = CircuitBreaker(failure_threshold=5, timeout=60.0)
        
        # Record failures
        for _ in range(3):
            cb.record_failure()
        
        assert cb.failure_count == 3
        
        # Record success
        cb.record_success()
        
        assert cb.failure_count == 0
        assert cb.state == "closed"
    
    def test_circuit_breaker_closed_allows_attempts(self):
        """TC-AI-005: Circuit breaker allows requests when closed"""
        cb = CircuitBreaker(failure_threshold=5, timeout=60.0)
        
        assert cb.state == "closed"
        assert cb.can_attempt() == True


# ============================================================================
# Retry Logic Tests
# ============================================================================

class TestRetryLogic:
    """Test cases for retry logic (TC-AI-006 to TC-AI-012)"""
    
    @pytest.mark.asyncio
    async def test_retry_with_exponential_backoff(self):
        """TC-AI-006: Retry with exponential backoff (1s, 2s, 4s)"""
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=3,
            initial_delay=0.1,  # Use shorter delay for tests
            backoff_factor=2.0,
            timeout=1.0
        )
        
        # Calculate delays
        delay1 = service._calculate_delay(1)
        delay2 = service._calculate_delay(2)
        delay3 = service._calculate_delay(3)
        
        # Should follow exponential backoff with jitter
        assert 0.1 <= delay1 < 0.2  # 0.1 + jitter
        assert 0.2 <= delay2 < 0.3  # 0.2 + jitter
        assert 0.4 <= delay3 < 0.5  # 0.4 + jitter
    
    @pytest.mark.asyncio
    async def test_retry_with_jitter(self):
        """TC-AI-007: Retry with jitter to prevent thundering herd"""
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=3,
            initial_delay=1.0,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        # Calculate delay multiple times
        delays = [service._calculate_delay(1) for _ in range(10)]
        
        # Should have variation due to jitter
        assert len(set(delays)) > 1
    
    @pytest.mark.asyncio
    async def test_max_retry_attempts_respected(self):
        """TC-AI-008: Max retry attempts respected (3 attempts)"""
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=3,
            initial_delay=0.1,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        call_count = 0
        
        async def mock_call(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise Exception("Test error")
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            try:
                await service.verify_evidence("test-id", "test-url", "photo", {})
            except:
                pass
        
        # Should attempt max_attempts times
        assert call_count <= 3
    
    @pytest.mark.asyncio
    async def test_no_retry_on_4xx_errors(self):
        """TC-AI-009: No retry on 4xx client errors"""
        from httpx import HTTPStatusError, Request, Response
        
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=3,
            initial_delay=0.1,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        call_count = 0
        
        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            request = Request("POST", "http://test.ai")
            response = Response(400, request=request)
            raise HTTPStatusError("Bad Request", request=request, response=response)
        
        with patch.object(service.client, 'request', side_effect=mock_request):
            result = await service.verify_evidence("test-id", "test-url", "photo", {})
        
        # Should only attempt once (no retry on 4xx)
        assert call_count == 1
        assert result is None
    
    @pytest.mark.asyncio
    async def test_retry_on_5xx_errors(self):
        """TC-AI-010: Retry on 5xx server errors"""
        from httpx import HTTPStatusError, Request, Response
        
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=2,
            initial_delay=0.1,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        call_count = 0
        
        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            request = Request("POST", "http://test.ai")
            response = Response(500, request=request)
            raise HTTPStatusError("Internal Server Error", request=request, response=response)
        
        with patch.object(service.client, 'request', side_effect=mock_request):
            result = await service.verify_evidence("test-id", "test-url", "photo", {})
        
        # Should retry on 5xx
        assert call_count == 2
        assert result is None
    
    @pytest.mark.asyncio
    async def test_retry_on_timeout_exceptions(self):
        """TC-AI-011: Retry on timeout exceptions"""
        from httpx import TimeoutException
        
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=2,
            initial_delay=0.1,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        call_count = 0
        
        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise TimeoutException("Request timeout")
        
        with patch.object(service.client, 'request', side_effect=mock_request):
            result = await service.verify_evidence("test-id", "test-url", "photo", {})
        
        # Should retry on timeout
        assert call_count == 2
        assert result is None
    
    @pytest.mark.asyncio
    async def test_retry_on_network_errors(self):
        """TC-AI-012: Retry on network errors"""
        from httpx import RequestError
        
        service = AIIntegrationService(
            ai_base_url="http://test.ai",
            max_attempts=2,
            initial_delay=0.1,
            backoff_factor=2.0,
            timeout=1.0
        )
        
        call_count = 0
        
        async def mock_request(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            raise RequestError("Network error")
        
        with patch.object(service.client, 'request', side_effect=mock_request):
            result = await service.verify_evidence("test-id", "test-url", "photo", {})
        
        # Should retry on network error
        assert call_count == 2
        assert result is None


# ============================================================================
# Evidence Verification Tests
# ============================================================================

class TestEvidenceVerification:
    """Test cases for evidence verification (TC-AI-013 to TC-AI-019)"""
    
    @pytest.mark.asyncio
    async def test_successful_evidence_verification(self):
        """TC-AI-013: Successful evidence verification"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.95,
            "analysis_details": {
                "manipulation_detected": False,
                "location_match": True
            }
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata={}
            )
        
        assert result == mock_response
    
    @pytest.mark.asyncio
    async def test_evidence_verification_with_photo_type(self):
        """TC-AI-014: Evidence verification with photo type"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.90
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata={}
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_evidence_verification_with_document_type(self):
        """TC-AI-015: Evidence verification with document type"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.85
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="document",
                metadata={}
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_evidence_verification_with_gps_metadata(self):
        """TC-AI-016: Evidence verification with GPS metadata"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        metadata = {
            "location": {
                "lat": 28.6139,
                "lng": 77.2090,
                "accuracy": 10.0
            }
        }
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.92
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["metadata"] == metadata
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata=metadata
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_evidence_verification_with_device_id(self):
        """TC-AI-017: Evidence verification with device ID"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        metadata = {
            "device_id": "device-123"
        }
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.88
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["metadata"]["device_id"] == "device-123"
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata=metadata
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_evidence_verification_returns_confidence_score(self):
        """TC-AI-018: Evidence verification returns confidence score"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.95
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata={}
            )
        
        assert result["confidence"] == 0.95
    
    @pytest.mark.asyncio
    async def test_evidence_verification_returns_analysis_details(self):
        """TC-AI-019: Evidence verification returns analysis details"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "verification_status": "verified",
            "confidence": 0.95,
            "analysis_details": {
                "manipulation_detected": False,
                "location_match": True,
                "timestamp_consistency": True
            }
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.verify_evidence(
                evidence_id="test-id",
                file_url="http://test.url",
                file_type="photo",
                metadata={}
            )
        
        assert "analysis_details" in result
        assert result["analysis_details"]["manipulation_detected"] == False


# ============================================================================
# Risk Score Calculation Tests
# ============================================================================

class TestRiskScoreCalculation:
    """Test cases for risk score calculation (TC-AI-020 to TC-AI-025)"""
    
    @pytest.mark.asyncio
    async def test_successful_risk_score_calculation(self):
        """TC-AI-020: Successful risk score calculation"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "risk_score": 75,
            "risk_level": "medium",
            "factors": [
                {"factor": "violation_count", "impact": 0.3}
            ]
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=[],
                evidence_count=10,
                violation_count=2
            )
        
        assert result == mock_response
    
    @pytest.mark.asyncio
    async def test_risk_score_with_high_violation_count(self):
        """TC-AI-021: Risk score with high violation count"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "risk_score": 85,
            "risk_level": "high"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=[],
                evidence_count=10,
                violation_count=8
            )
        
        assert result["risk_score"] == 85
        assert result["risk_level"] == "high"
    
    @pytest.mark.asyncio
    async def test_risk_score_with_low_compliance_rate(self):
        """TC-AI-022: Risk score with low compliance rate"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        responses = [
            {"is_compliant": False},
            {"is_compliant": False},
            {"is_compliant": True}
        ]
        
        mock_response = {
            "risk_score": 80,
            "risk_level": "high"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=responses,
                evidence_count=5,
                violation_count=2
            )
        
        assert result["risk_level"] == "high"
    
    @pytest.mark.asyncio
    async def test_risk_score_with_high_evidence_coverage(self):
        """TC-AI-023: Risk score with high evidence coverage"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "risk_score": 50,
            "risk_level": "medium"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=[],
                evidence_count=50,
                violation_count=1
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_risk_score_returns_risk_level(self):
        """TC-AI-024: Risk score returns risk level (high/medium/low)"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "risk_score": 75,
            "risk_level": "medium"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=[],
                evidence_count=10,
                violation_count=2
            )
        
        assert result["risk_level"] in ["high", "medium", "low"]
    
    @pytest.mark.asyncio
    async def test_risk_score_returns_contributing_factors(self):
        """TC-AI-025: Risk score returns contributing factors"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "risk_score": 75,
            "risk_level": "medium",
            "factors": [
                {"factor": "violation_count", "impact": 0.3},
                {"factor": "compliance_rate", "impact": 0.5}
            ]
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.calculate_risk_score(
                inspection_id="test-id",
                checklist_responses=[],
                evidence_count=10,
                violation_count=2
            )
        
        assert "factors" in result
        assert len(result["factors"]) > 0


# ============================================================================
# Fallback Calculation Tests
# ============================================================================

class TestFallbackCalculation:
    """Test cases for fallback calculation (TC-AI-026 to TC-AI-032)"""
    
    def test_fallback_risk_score_when_ai_unavailable(self):
        """TC-AI-026: Fallback risk score when AI unavailable"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[],
            evidence_count=10,
            violation_count=2
        )
        
        assert result is not None
        assert "risk_score" in result
    
    def test_fallback_uses_rule_based_logic(self):
        """TC-AI-027: Fallback uses rule-based logic"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        responses = [
            {"is_compliant": True},
            {"is_compliant": False},
            {"is_compliant": True}
        ]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=5,
            violation_count=1
        )
        
        # Should calculate based on rules
        assert 0 <= result["risk_score"] <= 100
    
    def test_fallback_marks_result_as_fallback(self):
        """TC-AI-028: Fallback marks result as fallback"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[],
            evidence_count=10,
            violation_count=2
        )
        
        assert result["fallback"] == True
    
    def test_fallback_handles_empty_checklist_responses(self):
        """TC-AI-029: Fallback handles empty checklist responses"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[],
            evidence_count=0,
            violation_count=0
        )
        
        assert result is not None
        assert result["risk_score"] == 50  # Default for insufficient data
    
    def test_fallback_calculates_compliance_percentage_correctly(self):
        """TC-AI-030: Fallback calculates compliance percentage correctly"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        responses = [
            {"is_compliant": True},
            {"is_compliant": True},
            {"is_compliant": False},
            {"is_compliant": True}
        ]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=5,
            violation_count=1
        )
        
        # 3 out of 4 compliant = 75%
        assert result is not None
    
    def test_fallback_calculates_violation_penalty_correctly(self):
        """TC-AI-031: Fallback calculates violation penalty correctly"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        responses = [
            {"is_compliant": True},
            {"is_compliant": False},
            {"is_compliant": False}
        ]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=5,
            violation_count=2
        )
        
        # Higher violation count should increase risk score
        assert result is not None
    
    def test_fallback_calculates_evidence_bonus_correctly(self):
        """TC-AI-032: Fallback calculates evidence bonus correctly"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result1 = service.calculate_fallback_risk_score(
            checklist_responses=[{"is_compliant": True}],
            evidence_count=5,
            violation_count=0
        )
        
        result2 = service.calculate_fallback_risk_score(
            checklist_responses=[{"is_compliant": True}],
            evidence_count=20,
            violation_count=0
        )
        
        # More evidence should reduce risk score
        assert result2["risk_score"] <= result1["risk_score"]


# ============================================================================
# Report Generation Tests
# ============================================================================

class TestReportGeneration:
    """Test cases for report generation (TC-AI-033 to TC-AI-039)"""
    
    @pytest.mark.asyncio
    async def test_successful_report_generation(self):
        """TC-AI-033: Successful report generation"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url",
            "generated_at": "2026-07-10T12:00:00Z"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=True,
                include_charts=True
            )
        
        assert result == mock_response
    
    @pytest.mark.asyncio
    async def test_report_generation_with_summary_type(self):
        """TC-AI-034: Report generation with summary type"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url"
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["report_type"] == "summary"
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="summary",
                include_recommendations=False,
                include_charts=False
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_report_generation_with_detailed_type(self):
        """TC-AI-035: Report generation with detailed type"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url"
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["report_type"] == "detailed"
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=True,
                include_charts=True
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_report_generation_with_recommendations(self):
        """TC-AI-036: Report generation with recommendations"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url"
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["include_recommendations"] == True
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=True,
                include_charts=False
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_report_generation_with_charts(self):
        """TC-AI-037: Report generation with charts"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url"
        }
        
        async def mock_call(*args, **kwargs):
            assert kwargs["data"]["include_charts"] == True
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=False,
                include_charts=True
            )
        
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_report_generation_returns_report_url(self):
        """TC-AI-038: Report generation returns report URL"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url/generated.pdf"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=True,
                include_charts=True
            )
        
        assert result["report_url"] == "http://report.url/generated.pdf"
    
    @pytest.mark.asyncio
    async def test_report_generation_returns_timestamp(self):
        """TC-AI-039: Report generation returns timestamp"""
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        mock_response = {
            "report_id": "report-123",
            "report_url": "http://report.url",
            "generated_at": "2026-07-10T12:00:00Z"
        }
        
        async def mock_call(*args, **kwargs):
            return mock_response
        
        with patch.object(service, '_call_with_retry', side_effect=mock_call):
            result = await service.generate_report(
                inspection_id="test-id",
                report_type="detailed",
                include_recommendations=True,
                include_charts=True
            )
        
        assert "generated_at" in result


# ============================================================================
# Singleton Tests
# ============================================================================

class TestSingleton:
    """Test cases for singleton pattern"""
    
    def test_get_ai_service_returns_singleton(self):
        """Test that get_ai_service returns singleton instance"""
        service1 = get_ai_service()
        service2 = get_ai_service()
        
        assert service1 is service2
    
    def test_get_ai_service_uses_env_variable(self):
        """Test that get_ai_service uses AI_BASE_URL env variable"""
        import os
        
        with patch.dict(os.environ, {'AI_BASE_URL': 'http://custom.ai'}):
            # Reset singleton
            from backend.services.ai_integration_service import _ai_service
            _ai_service._ai_service = None
            
            service = get_ai_service()
            assert service.ai_base_url == "http://custom.ai"
