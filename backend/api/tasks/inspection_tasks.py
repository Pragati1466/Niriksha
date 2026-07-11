"""
Celery tasks for inspection-related background processing.
"""
from celery import shared_task
from database.session import get_db
from repositories.inspection_repository import InspectionRepository
from services.inspection_service import InspectionService
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def process_inspection_completion(self, inspection_id: str):
    """
    Process inspection completion in background.
    - Calculate compliance score
    - Generate reports
    - Update status
    """
    try:
        db = next(get_db())
        inspection_repo = InspectionRepository(db)
        inspection_service = InspectionService(inspection_repo)
        
        # Process inspection
        result = inspection_service.process_completion(inspection_id)
        
        logger.info(f"Processed inspection completion: {inspection_id}")
        return {"inspection_id": inspection_id, "status": "completed", "result": result}
        
    except Exception as e:
        logger.error(f"Error processing inspection {inspection_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True)
def generate_inspection_report(self, inspection_id: str):
    """
    Generate inspection report in background.
    """
    try:
        db = next(get_db())
        inspection_repo = InspectionRepository(db)
        inspection_service = InspectionService(inspection_repo)
        
        report = inspection_service.generate_report(inspection_id)
        
        logger.info(f"Generated report for inspection: {inspection_id}")
        return {"inspection_id": inspection_id, "report_id": report.id}
        
    except Exception as e:
        logger.error(f"Error generating report for inspection {inspection_id}: {str(e)}")
        raise self.retry(exc=e, countdown=60)


@shared_task
def cleanup_old_inspections(days: int = 90):
    """
    Cleanup completed inspections older than specified days.
    """
    try:
        db = next(get_db())
        inspection_repo = InspectionRepository(db)
        
        count = inspection_repo.cleanup_old_inspections(days)
        
        logger.info(f"Cleaned up {count} old inspections")
        return {"cleaned_count": count}
        
    except Exception as e:
        logger.error(f"Error cleaning up old inspections: {str(e)}")
        raise
