"""
Celery tasks for evidence-related background processing.
"""
from celery import shared_task
from database.session import get_db
from repositories.evidence_repository import EvidenceRepository
from services.evidence_service import EvidenceService
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_evidence_upload(self, evidence_id: str):
    """
    Process evidence upload in background.
    - Verify file integrity
    - Scan for viruses
    - Generate thumbnails
    - Extract metadata
    """
    try:
        db = next(get_db())
        evidence_repo = EvidenceRepository(db)
        evidence_service = EvidenceService(evidence_repo)
        
        result = evidence_service.process_upload(evidence_id)
        
        logger.info(f"Processed evidence upload: {evidence_id}")
        return {"evidence_id": evidence_id, "status": "processed", "result": result}
        
    except Exception as e:
        logger.error(f"Error processing evidence {evidence_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True)
def verify_evidence_integrity(self, evidence_id: str):
    """
    Verify evidence file integrity in background.
    """
    try:
        db = next(get_db())
        evidence_repo = EvidenceRepository(db)
        evidence_service = EvidenceService(evidence_repo)
        
        is_valid = evidence_service.verify_integrity(evidence_id)
        
        logger.info(f"Verified evidence integrity: {evidence_id}, valid: {is_valid}")
        return {"evidence_id": evidence_id, "is_valid": is_valid}
        
    except Exception as e:
        logger.error(f"Error verifying evidence {evidence_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def cleanup_orphaned_evidence():
    """
    Cleanup evidence files without associated records.
    """
    try:
        db = next(get_db())
        evidence_repo = EvidenceRepository(db)
        
        count = evidence_repo.cleanup_orphaned_files()
        
        logger.info(f"Cleaned up {count} orphaned evidence files")
        return {"cleaned_count": count}
        
    except Exception as e:
        logger.error(f"Error cleaning up orphaned evidence: {str(e)}")
        raise
