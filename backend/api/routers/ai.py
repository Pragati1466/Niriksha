"""
NIRIKSHA - Inspection Workflow & Data Collection Module
AI Integration API Router

Description:
    This module provides API endpoints for AI integration including
    evidence verification, risk score calculation, and report generation.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from ...database.session import get_db
from ...services.ai_integration_service import get_ai_service
from ...services.evidence_service import EvidenceService
from ...services.inspection_service import InspectionService
from ...repositories.evidence_repository import EvidenceRepository
from ...repositories.inspection_repository import InspectionRepository
from ...repositories.checklist_repository import ChecklistRepository
from ..middleware.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


# ============================================================================
# Request/Response Schemas
# ============================================================================

class EvidenceVerificationRequest(BaseModel):
    """Request schema for evidence verification."""
    evidence_id: str
    file_url: str
    file_type: str
    metadata: dict


class RiskScoreRequest(BaseModel):
    """Request schema for risk score calculation."""
    inspection_id: str


class ReportGenerationRequest(BaseModel):
    """Request schema for report generation."""
    inspection_id: str
    report_type: str = "detailed"
    include_recommendations: bool = True
    include_charts: bool = True


class AIResponse(BaseModel):
    """Base AI response schema."""
    success: bool
    message: str
    data: Optional[dict] = None
    fallback: bool = False


# ============================================================================
# Evidence Verification Endpoints
# ============================================================================

@router.post("/verify-evidence", response_model=AIResponse)
async def verify_evidence(
    request: EvidenceVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger AI verification for evidence.
    
    This endpoint initiates asynchronous evidence verification using the AI module.
    The verification status can be polled via the evidence endpoint.
    
    Args:
        request: Evidence verification request
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        AIResponse: Response indicating verification initiation
    """
    try:
        # Get evidence repository
        evidence_repo = EvidenceRepository(db)
        
        # Verify evidence exists
        evidence = evidence_repo.get(request.evidence_id)
        if not evidence:
            raise HTTPException(status_code=404, detail="Evidence not found")
        
        # Get AI service
        ai_service = get_ai_service()
        
        # Schedule async verification
        background_tasks.add_task(
            _verify_evidence_async,
            ai_service,
            evidence_repo,
            request.evidence_id,
            request.file_url,
            request.file_type,
            request.metadata
        )
        
        return AIResponse(
            success=True,
            message="Evidence verification initiated",
            data={"evidence_id": request.evidence_id, "status": "verifying"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating evidence verification: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate verification")


async def _verify_evidence_async(
    ai_service,
    evidence_repo,
    evidence_id: str,
    file_url: str,
    file_type: str,
    metadata: dict
):
    """
    Async task for evidence verification.
    
    Args:
        ai_service: AI integration service
        evidence_repo: Evidence repository
        evidence_id: Evidence ID
        file_url: File URL
        file_type: File type
        metadata: Evidence metadata
    """
    try:
        logger.info(f"Starting async evidence verification: {evidence_id}")
        
        # Call AI service
        result = await ai_service.verify_evidence(
            evidence_id=evidence_id,
            file_url=file_url,
            file_type=file_type,
            metadata=metadata
        )
        
        # Update evidence with verification result
        if result:
            evidence = evidence_repo.get(evidence_id)
            if evidence:
                evidence.verification_status = result.get("verification_status", "pending")
                evidence.verification_confidence = result.get("confidence")
                evidence.verification_details = result.get("analysis_details")
                evidence_repo.update(evidence)
                logger.info(f"Evidence verification completed: {evidence_id}")
        else:
            # Mark for manual review if AI failed
            evidence = evidence_repo.get(evidence_id)
            if evidence:
                evidence.verification_status = "manual_review_required"
                evidence_repo.update(evidence)
                logger.warning(f"Evidence verification failed, marked for manual review: {evidence_id}")
                
    except Exception as e:
        logger.error(f"Error in async evidence verification: {str(e)}")


# ============================================================================
# Risk Score Calculation Endpoints
# ============================================================================

@router.post("/risk-score", response_model=AIResponse)
async def calculate_risk_score(
    request: RiskScoreRequest,
    db: Session = Depends(get_db)
):
    """
    Calculate risk score for inspection using AI.
    
    This endpoint calculates the risk score for an inspection using the AI module.
    If AI is unavailable, it falls back to rule-based calculation.
    
    Args:
        request: Risk score calculation request
        db: Database session
        
    Returns:
        AIResponse: Response with risk score data
    """
    try:
        # Get repositories
        inspection_repo = InspectionRepository(db)
        checklist_repo = ChecklistRepository(db)
        
        # Verify inspection exists
        inspection = inspection_repo.get(request.inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")
        
        # Get checklist responses
        responses = checklist_repo.find_by_inspection(request.inspection_id)
        
        # Get evidence count
        evidence_repo = EvidenceRepository(db)
        evidence_list = evidence_repo.find_by_inspection(request.inspection_id)
        
        # Calculate violation count
        violation_count = sum(1 for r in responses if not r.get("is_compliant", False))
        
        # Get AI service
        ai_service = get_ai_service()
        
        # Try AI calculation
        result = await ai_service.calculate_risk_score(
            inspection_id=request.inspection_id,
            checklist_responses=responses,
            evidence_count=len(evidence_list),
            violation_count=violation_count
        )
        
        # Fallback to rule-based calculation
        if result is None:
            logger.warning(f"AI risk score failed, using fallback: {request.inspection_id}")
            result = ai_service.calculate_fallback_risk_score(
                checklist_responses=responses,
                evidence_count=len(evidence_list),
                violation_count=violation_count
            )
            result["fallback"] = True
        
        # Update inspection with risk score
        inspection.risk_score = result.get("risk_score")
        inspection.risk_level = result.get("risk_level")
        inspection_repo.update(inspection)
        
        return AIResponse(
            success=True,
            message="Risk score calculated successfully",
            data=result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating risk score: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate risk score")


# ============================================================================
# Report Generation Endpoints
# ============================================================================

@router.post("/generate-report", response_model=AIResponse)
async def generate_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Generate inspection report using AI.
    
    This endpoint initiates asynchronous report generation using the AI module.
    The report status can be polled via the report endpoint.
    
    Args:
        request: Report generation request
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        AIResponse: Response indicating report generation initiation
    """
    try:
        # Get inspection repository
        inspection_repo = InspectionRepository(db)
        
        # Verify inspection exists
        inspection = inspection_repo.get(request.inspection_id)
        if not inspection:
            raise HTTPException(status_code=404, detail="Inspection not found")
        
        # Get AI service
        ai_service = get_ai_service()
        
        # Schedule async report generation
        background_tasks.add_task(
            _generate_report_async,
            ai_service,
            inspection_repo,
            request.inspection_id,
            request.report_type,
            request.include_recommendations,
            request.include_charts
        )
        
        return AIResponse(
            success=True,
            message="Report generation initiated",
            data={"inspection_id": request.inspection_id, "status": "generating"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initiating report generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initiate report generation")


async def _generate_report_async(
    ai_service,
    inspection_repo,
    inspection_id: str,
    report_type: str,
    include_recommendations: bool,
    include_charts: bool
):
    """
    Async task for report generation.
    
    Args:
        ai_service: AI integration service
        inspection_repo: Inspection repository
        inspection_id: Inspection ID
        report_type: Report type
        include_recommendations: Include AI recommendations
        include_charts: Include charts
    """
    try:
        logger.info(f"Starting async report generation: {inspection_id}")
        
        # Call AI service
        result = await ai_service.generate_report(
            inspection_id=inspection_id,
            report_type=report_type,
            include_recommendations=include_recommendations,
            include_charts=include_charts
        )
        
        # Update inspection with report result
        if result:
            inspection = inspection_repo.get(inspection_id)
            if inspection:
                inspection.report_url = result.get("report_url")
                inspection.report_generated_at = result.get("generated_at")
                inspection_repo.update(inspection)
                logger.info(f"Report generation completed: {inspection_id}")
        else:
            logger.warning(f"Report generation failed: {inspection_id}")
                
    except Exception as e:
        logger.error(f"Error in async report generation: {str(e)}")


# ============================================================================
# Health Check Endpoint
# ============================================================================

@router.get("/health", response_model=AIResponse)
async def ai_health_check():
    """
    Check AI service health.
    
    Returns:
        AIResponse: AI service health status
    """
    try:
        ai_service = get_ai_service()
        
        # Check circuit breaker status
        circuit_status = {
            key: {
                "state": cb.state,
                "failure_count": cb.failure_count,
                "can_attempt": cb.can_attempt()
            }
            for key, cb in ai_service.circuit_breakers.items()
        }
        
        return AIResponse(
            success=True,
            message="AI service health check completed",
            data={
                "ai_base_url": ai_service.ai_base_url,
                "circuit_breakers": circuit_status
            }
        )
        
    except Exception as e:
        logger.error(f"Error in AI health check: {str(e)}")
        return AIResponse(
            success=False,
            message="AI service health check failed",
            data={"error": str(e)}
        )
