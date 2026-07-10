"""
NIRIKSHA - Inspection Workflow & Data Collection Module
AI Integration Service

Description:
    This module handles integration with the AI module for evidence verification,
    risk score calculation, and report generation. It implements retry logic with
    exponential backoff, circuit breaker pattern, and graceful degradation.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import time
import random
import logging
import asyncio
import os
from typing import Dict, Any, Optional
from datetime import datetime
import httpx

from ..api.middleware.logging import get_logger

logger = get_logger(__name__)


class CircuitBreaker:
    """
    Circuit breaker pattern to prevent cascading failures.
    
    Opens after consecutive failures and allows requests to fail fast
    during outages instead of waiting for timeouts.
    """
    
    def __init__(self, failure_threshold: int = 5, timeout: float = 60.0):
        """
        Initialize circuit breaker.
        
        Args:
            failure_threshold: Number of consecutive failures before opening
            timeout: Seconds to wait before attempting to close circuit
        """
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"  # closed, open, half-open
    
    def record_failure(self):
        """Record a failure and potentially open the circuit."""
        self.failure_count += 1
        self.last_failure_time = datetime.now()
        
        if self.failure_count >= self.failure_threshold:
            self.state = "open"
            logger.warning(
                f"Circuit breaker opened after {self.failure_count} failures"
            )
    
    def record_success(self):
        """Record a success and reset the circuit."""
        self.failure_count = 0
        self.last_failure_time = None
        self.state = "closed"
    
    def can_attempt(self) -> bool:
        """
        Check if a request can be attempted.
        
        Returns:
            bool: True if circuit is closed or half-open
        """
        if self.state == "closed":
            return True
        
        if self.state == "open":
            # Check if timeout has elapsed
            if self.last_failure_time and \
               (datetime.now() - self.last_failure_time).total_seconds() > self.timeout:
                self.state = "half-open"
                logger.info("Circuit breaker moved to half-open state")
                return True
            return False
        
        return True  # half-open allows one attempt


class AIIntegrationService:
    """
    Service for integrating with AI module APIs.
    
    Handles evidence verification, risk score calculation, and report generation
    with robust retry logic and error handling.
    """
    
    def __init__(
        self,
        ai_base_url: str,
        max_attempts: int = 3,
        initial_delay: float = 1.0,
        backoff_factor: float = 2.0,
        timeout: float = 30.0
    ):
        """
        Initialize AI integration service.
        
        Args:
            ai_base_url: Base URL for AI module APIs
            max_attempts: Maximum retry attempts
            initial_delay: Initial delay in seconds
            backoff_factor: Exponential backoff factor
            timeout: Request timeout in seconds
        """
        self.ai_base_url = ai_base_url.rstrip('/')
        self.max_attempts = max_attempts
        self.initial_delay = initial_delay
        self.backoff_factor = backoff_factor
        self.timeout = timeout
        
        # Circuit breakers for each endpoint
        self.circuit_breakers = {
            "risk_score": CircuitBreaker(),
            "verify_evidence": CircuitBreaker(),
            "generate_report": CircuitBreaker()
        }
        
        # HTTP client (async for better performance)
        self.client = httpx.AsyncClient(timeout=timeout)
    
    def _calculate_delay(self, attempt: int) -> float:
        """
        Calculate delay with exponential backoff and jitter.
        
        Args:
            attempt: Current attempt number
            
        Returns:
            float: Delay in seconds
        """
        delay = self.initial_delay * (self.backoff_factor ** (attempt - 1))
        # Add jitter to prevent thundering herd
        jitter = random.uniform(0, delay * 0.1)
        return delay + jitter
    
    async def _call_with_retry(
        self,
        endpoint: str,
        method: str,
        data: Dict[str, Any],
        circuit_breaker_key: str
    ) -> Optional[Dict[str, Any]]:
        """
        Call AI API with retry logic and circuit breaker.
        
        Args:
            endpoint: API endpoint path
            method: HTTP method
            data: Request data
            circuit_breaker_key: Key for circuit breaker
            
        Returns:
            Optional[Dict]: Response data or None if failed
        """
        circuit_breaker = self.circuit_breakers[circuit_breaker_key]
        
        # Check circuit breaker
        if not circuit_breaker.can_attempt():
            logger.warning(
                f"Circuit breaker is {circuit_breaker.state}, skipping request to {endpoint}"
            )
            return None
        
        url = f"{self.ai_base_url}/{endpoint}"
        
        for attempt in range(1, self.max_attempts + 1):
            try:
                logger.info(
                    f"Calling AI API: {method} {url} (attempt {attempt}/{self.max_attempts})"
                )
                
                response = self.client.request(
                    method=method,
                    url=url,
                    json=data,
                    timeout=self.timeout
                )
                
                response.raise_for_status()
                result = response.json()
                
                # Record success
                circuit_breaker.record_success()
                logger.info(f"AI API call successful: {endpoint}")
                
                return result
                
            except httpx.TimeoutException as e:
                logger.warning(
                    f"AI API timeout on attempt {attempt}: {endpoint} - {str(e)}"
                )
                if attempt == self.max_attempts:
                    circuit_breaker.record_failure()
                    return None
                
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"AI API error on attempt {attempt}: {endpoint} - {e.response.status_code}"
                )
                # Don't retry on 4xx errors (client errors)
                if 400 <= e.response.status_code < 500:
                    circuit_breaker.record_failure()
                    return None
                
                if attempt == self.max_attempts:
                    circuit_breaker.record_failure()
                    return None
                
            except httpx.RequestError as e:
                logger.error(
                    f"AI API request error on attempt {attempt}: {endpoint} - {str(e)}"
                )
                if attempt == self.max_attempts:
                    circuit_breaker.record_failure()
                    return None
            
            except Exception as e:
                logger.error(
                    f"Unexpected error calling AI API on attempt {attempt}: {endpoint} - {str(e)}"
                )
                if attempt == self.max_attempts:
                    circuit_breaker.record_failure()
                    return None
            
            # Wait before retry
            delay = self._calculate_delay(attempt)
            logger.info(f"Retrying in {delay:.2f} seconds...")
            await asyncio.sleep(delay)
        
        return None
    
    async def verify_evidence(
        self,
        evidence_id: str,
        file_url: str,
        file_type: str,
        metadata: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Verify evidence using AI analysis.
        
        Args:
            evidence_id: Evidence ID
            file_url: URL to evidence file
            file_type: Type of file (photo|document)
            metadata: Evidence metadata
            
        Returns:
            Optional[Dict]: Verification result or None if failed
        """
        request_data = {
            "evidence_id": evidence_id,
            "file_url": file_url,
            "file_type": file_type,
            "metadata": metadata
        }
        
        result = await self._call_with_retry(
            endpoint="verify-evidence",
            method="POST",
            data=request_data,
            circuit_breaker_key="verify_evidence"
        )
        
        if result:
            logger.info(
                f"Evidence verification successful: {evidence_id} - "
                f"status={result.get('verification_status')}, "
                f"confidence={result.get('confidence')}"
            )
        else:
            logger.warning(f"Evidence verification failed: {evidence_id}")
        
        return result
    
    async def calculate_risk_score(
        self,
        inspection_id: str,
        checklist_responses: list,
        evidence_count: int,
        violation_count: int
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate risk score for inspection.
        
        Args:
            inspection_id: Inspection ID
            checklist_responses: List of checklist responses
            evidence_count: Number of evidence items
            violation_count: Number of violations
            
        Returns:
            Optional[Dict]: Risk score result or None if failed
        """
        request_data = {
            "inspection_id": inspection_id,
            "checklist_responses": checklist_responses,
            "evidence_count": evidence_count,
            "violation_count": violation_count
        }
        
        result = await self._call_with_retry(
            endpoint="risk-score",
            method="POST",
            data=request_data,
            circuit_breaker_key="risk_score"
        )
        
        if result:
            logger.info(
                f"Risk score calculation successful: {inspection_id} - "
                f"score={result.get('risk_score')}, "
                f"level={result.get('risk_level')}"
            )
        else:
            logger.warning(f"Risk score calculation failed: {inspection_id}")
        
        return result
    
    async def generate_report(
        self,
        inspection_id: str,
        report_type: str = "detailed",
        include_recommendations: bool = True,
        include_charts: bool = True
    ) -> Optional[Dict[str, Any]]:
        """
        Generate inspection report with AI insights.
        
        Args:
            inspection_id: Inspection ID
            report_type: Type of report (summary|detailed)
            include_recommendations: Include AI recommendations
            include_charts: Include charts in report
            
        Returns:
            Optional[Dict]: Report generation result or None if failed
        """
        request_data = {
            "inspection_id": inspection_id,
            "report_type": report_type,
            "include_recommendations": include_recommendations,
            "include_charts": include_charts
        }
        
        result = await self._call_with_retry(
            endpoint="generate-report",
            method="POST",
            data=request_data,
            circuit_breaker_key="generate_report"
        )
        
        if result:
            logger.info(
                f"Report generation successful: {inspection_id} - "
                f"report_id={result.get('report_id')}, "
                f"url={result.get('report_url')}"
            )
        else:
            logger.warning(f"Report generation failed: {inspection_id}")
        
        return result
    
    def calculate_fallback_risk_score(
        self,
        checklist_responses: list,
        evidence_count: int,
        violation_count: int
    ) -> Dict[str, Any]:
        """
        Calculate fallback risk score using rule-based logic.
        
        Used when AI service is unavailable.
        
        Args:
            checklist_responses: List of checklist responses
            evidence_count: Number of evidence items
            violation_count: Number of violations
            
        Returns:
            Dict: Fallback risk score result
        """
        total_items = len(checklist_responses)
        if total_items == 0:
            return {
                "risk_score": 50,
                "risk_level": "medium",
                "factors": [{"factor": "insufficient_data", "impact": 0.0}],
                "fallback": True
            }
        
        # Calculate compliance percentage
        compliant_count = sum(1 for r in checklist_responses if r.get("is_compliant", False))
        compliance_rate = (compliant_count / total_items) * 100
        
        # Calculate risk score based on violations and compliance
        violation_penalty = (violation_count / total_items) * 30
        evidence_bonus = min((evidence_count / total_items) * 10, 10)
        
        risk_score = 100 - compliance_rate + violation_penalty - evidence_bonus
        risk_score = max(0, min(100, risk_score))
        
        # Determine risk level
        if risk_score >= 70:
            risk_level = "high"
        elif risk_score >= 40:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return {
            "risk_score": int(risk_score),
            "risk_level": risk_level,
            "factors": [
                {"factor": "compliance_rate", "impact": compliance_rate / 100},
                {"factor": "violation_count", "impact": violation_penalty / 100},
                {"factor": "evidence_coverage", "impact": evidence_bonus / 100}
            ],
            "fallback": True
        }
    
    def close(self):
        """Close HTTP client."""
        import asyncio
        asyncio.create_task(self.client.aclose())


# Singleton instance
_ai_service: Optional[AIIntegrationService] = None


def get_ai_service() -> AIIntegrationService:
    """
    Get or create AI integration service singleton.
    
    Returns:
        AIIntegrationService: AI service instance
    """
    global _ai_service
    
    if _ai_service is None:
        ai_base_url = os.getenv("AI_BASE_URL", "http://localhost:9000")
        _ai_service = AIIntegrationService(ai_base_url=ai_base_url)
    
    return _ai_service
