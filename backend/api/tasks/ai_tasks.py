"""
Celery tasks for AI-related background processing.
"""
from celery import shared_task
from database.session import get_db
from services.ai_integration_service import AIIntegrationService
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def analyze_inspection_with_ai(self, inspection_id: str):
    """
    Analyze inspection data using AI in background.
    - Risk assessment
    - Compliance scoring
    - Violation detection
    """
    try:
        db = next(get_db())
        ai_service = AIIntegrationService(db)
        
        result = ai_service.analyze_inspection(inspection_id)
        
        logger.info(f"AI analysis completed for inspection: {inspection_id}")
        return {"inspection_id": inspection_id, "analysis_id": result.id}
        
    except Exception as e:
        logger.error(f"Error in AI analysis for inspection {inspection_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True)
def verify_evidence_with_ai(self, evidence_id: str):
    """
    Verify evidence using AI in background.
    - Image analysis
    - Document verification
    - Anomaly detection
    """
    try:
        db = next(get_db())
        ai_service = AIIntegrationService(db)
        
        result = ai_service.verify_evidence(evidence_id)
        
        logger.info(f"AI verification completed for evidence: {evidence_id}")
        return {"evidence_id": evidence_id, "verification_id": result.id}
        
    except Exception as e:
        logger.error(f"Error in AI verification for evidence {evidence_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def batch_risk_assessment(site_ids: list[str]):
    """
    Perform batch risk assessment for multiple sites.
    """
    try:
        db = next(get_db())
        ai_service = AIIntegrationService(db)
        
        results = []
        for site_id in site_ids:
            try:
                result = ai_service.assess_site_risk(site_id)
                results.append({"site_id": site_id, "risk_score": result})
            except Exception as e:
                logger.error(f"Error assessing risk for site {site_id}: {str(e)}")
                results.append({"site_id": site_id, "error": str(e)})
        
        logger.info(f"Batch risk assessment completed for {len(site_ids)} sites")
        return {"results": results}
        
    except Exception as e:
        logger.error(f"Error in batch risk assessment: {str(e)}")
        raise
