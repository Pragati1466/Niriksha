"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Service

Description:
    This module provides the InspectionService for business logic related
    to inspections, including state management, compliance calculation,
    and workflow orchestration.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal
import asyncio

from sqlalchemy.orm import Session

from .base_service import BaseService
from .ai_integration_service import get_ai_service
from ..repositories.inspection_repository import InspectionRepository
from ..repositories.state_history_repository import InspectionStateHistoryRepository
from ..repositories.checklist_repository import ChecklistRepository
from ..repositories.evidence_repository import EvidenceRepository
from ..database.models.inspection import Inspection, InspectionStatus, InspectionPriority
from ..database.models.state_history import InspectionStateHistory


class InspectionService(BaseService[Inspection, InspectionRepository]):
    """
    Service for Inspection business logic.
    
    This service handles inspection lifecycle management, state transitions,
    compliance calculations, and workflow orchestration.
    """
    
    def __init__(self, session: Session):
        """
        Initialize the inspection service.
        
        Args:
            session: The database session
        """
        inspection_repo = InspectionRepository(Inspection, session)
        super().__init__(inspection_repo, session)
        self.state_history_repo = InspectionStateHistoryRepository(InspectionStateHistory, session)
        self.checklist_repo = ChecklistRepository(session)
        self.evidence_repo = EvidenceRepository(session)
    
    def create_inspection(
        self,
        inspector_id: UUID,
        site_id: UUID,
        inspection_type_id: UUID,
        priority: str = InspectionPriority.MEDIUM,
        scheduled_date: Optional[datetime] = None,
        scheduled_end_date: Optional[datetime] = None
    ) -> Inspection:
        """
        Create a new inspection with initial state.
        
        Args:
            inspector_id: ID of the inspector
            site_id: ID of the site
            inspection_type_id: ID of the inspection type
            priority: Priority level
            scheduled_date: Scheduled start date
            scheduled_end_date: Expected completion time
            
        Returns:
            Inspection: The created inspection
        """
        if scheduled_date is None:
            scheduled_date = datetime.now()
        
        inspection = Inspection(
            inspector_id=inspector_id,
            site_id=site_id,
            inspection_type_id=inspection_type_id,
            priority=priority,
            scheduled_date=scheduled_date,
            scheduled_end_date=scheduled_end_date,
            status=InspectionStatus.DRAFT
        )
        
        created_inspection = self.create(inspection)
        
        # Record initial state
        self._record_state_transition(
            inspection_id=created_inspection.id,
            from_state=None,
            to_state=InspectionStatus.DRAFT,
            transition_reason="Inspection created"
        )
        
        return created_inspection
    
    def update_status(
        self,
        inspection_id: UUID,
        new_status: str,
        transition_reason: Optional[str] = None,
        changed_by: Optional[UUID] = None
    ) -> Inspection:
        """
        Update inspection status with state transition validation.
        
        Args:
            inspection_id: ID of the inspection
            new_status: New status
            transition_reason: Reason for status change
            changed_by: User who initiated the change
            
        Returns:
            Inspection: The updated inspection
        """
        inspection = self.get_by_id(inspection_id)
        if inspection is None:
            raise Exception(f"Inspection with id {inspection_id} not found")
        
        # Validate state transition
        if not inspection.can_transition_to(new_status):
            raise Exception(
                f"Cannot transition from {inspection.status} to {new_status}. "
                f"Invalid state transition."
            )
        
        old_status = inspection.status
        inspection.status = new_status
        
        # Update timestamps based on status
        if new_status == InspectionStatus.IN_PROGRESS and inspection.started_at is None:
            inspection.started_at = datetime.now()
        elif new_status == InspectionStatus.COMPLETED and inspection.completed_at is None:
            inspection.completed_at = datetime.now()
        
        updated_inspection = self.update(inspection)
        
        # Record state transition
        self._record_state_transition(
            inspection_id=inspection_id,
            from_state=old_status,
            to_state=new_status,
            transition_reason=transition_reason,
            changed_by=changed_by
        )
        
        # Trigger AI risk score calculation when inspection is completed
        if new_status == InspectionStatus.COMPLETED:
            asyncio.create_task(self._calculate_ai_risk_score(updated_inspection))
            asyncio.create_task(self._generate_ai_report(updated_inspection))
        
        return updated_inspection
    
    def check_in(
        self,
        inspection_id: UUID,
        latitude: Decimal,
        longitude: Decimal,
        accuracy: Optional[Decimal] = None
    ) -> Inspection:
        """
        Check in at inspection site with GPS coordinates.
        
        Args:
            inspection_id: ID of the inspection
            latitude: GPS latitude
            longitude: GPS longitude
            accuracy: GPS accuracy in meters
            
        Returns:
            Inspection: The updated inspection
        """
        inspection = self.get_by_id(inspection_id)
        if inspection is None:
            raise Exception(f"Inspection with id {inspection_id} not found")
        
        inspection.location_lat = latitude
        inspection.location_lng = longitude
        inspection.location_accuracy = accuracy
        inspection.check_in_time = datetime.now()
        
        # Auto-transition to in_progress if still in draft
        if inspection.status == InspectionStatus.DRAFT:
            return self.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.IN_PROGRESS,
                transition_reason="Checked in at site"
            )
        
        return self.update(inspection)
    
    def check_out(self, inspection_id: UUID) -> Inspection:
        """
        Check out from inspection site.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            Inspection: The updated inspection
        """
        inspection = self.get_by_id(inspection_id)
        if inspection is None:
            raise Exception(f"Inspection with id {inspection_id} not found")
        
        inspection.check_out_time = datetime.now()
        return self.update(inspection)
    
    def calculate_compliance_score(self, inspection_id: UUID) -> int:
        """
        Calculate compliance score based on checklist responses.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            int: Compliance score (0-100)
        """
        # This would integrate with checklist service
        # For now, return a placeholder
        inspection = self.get_by_id(inspection_id)
        if inspection is None:
            raise Exception(f"Inspection with id {inspection_id} not found")
        
        # Placeholder calculation
        if inspection.compliance_score is not None:
            return inspection.compliance_score
        
        return 0
    
    def update_compliance_metrics(
        self,
        inspection_id: UUID,
        compliance_score: Optional[int] = None,
        violation_count: Optional[int] = None,
        total_items: Optional[int] = None,
        completed_items: Optional[int] = None
    ) -> Inspection:
        """
        Update compliance metrics for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            compliance_score: Overall compliance percentage
            violation_count: Number of violations
            total_items: Total checklist items
            completed_items: Completed checklist items
            
        Returns:
            Inspection: The updated inspection
        """
        inspection = self.get_by_id(inspection_id)
        if inspection is None:
            raise Exception(f"Inspection with id {inspection_id} not found")
        
        inspection.update_compliance_metrics(
            compliance_score=compliance_score,
            violation_count=violation_count,
            total_items=total_items,
            completed_items=completed_items
        )
        
        return self.update(inspection)
    
    def get_inspection_timeline(self, inspection_id: UUID) -> List[dict]:
        """
        Get the state transition timeline for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[dict]: List of state transitions
        """
        try:
            history = self.state_history_repo.find_by_inspection(inspection_id)
            return [h.to_dict() for h in history]
        except Exception as e:
            raise Exception(f"Error getting inspection timeline: {str(e)}")
    
    def get_active_inspections(self, inspector_id: Optional[UUID] = None) -> List[Inspection]:
        """
        Get all active inspections.
        
        Args:
            inspector_id: Optional inspector ID filter
            
        Returns:
            List[Inspection]: List of active inspections
        """
        return self.repository.find_active_inspections(inspector_id)
    
    def get_overdue_inspections(self, inspector_id: Optional[UUID] = None) -> List[Inspection]:
        """
        Get all overdue inspections.
        
        Args:
            inspector_id: Optional inspector ID filter
            
        Returns:
            List[Inspection]: List of overdue inspections
        """
        return self.repository.find_overdue_inspections(inspector_id)
    
    async def _calculate_ai_risk_score(self, inspection: Inspection):
        """
        Calculate AI risk score for inspection asynchronously.
        
        Args:
            inspection: Inspection to calculate risk score for
        """
        try:
            ai_service = get_ai_service()
            
            # Get checklist responses
            responses = self.checklist_repo.find_by_inspection(inspection.id)
            
            # Get evidence count
            evidence_list = self.evidence_repo.find_by_inspection(inspection.id)
            
            # Calculate violation count
            violation_count = sum(1 for r in responses if not getattr(r, 'is_compliant', False))
            
            # Try AI calculation
            result = await ai_service.calculate_risk_score(
                inspection_id=str(inspection.id),
                checklist_responses=[r.to_dict() for r in responses],
                evidence_count=len(evidence_list),
                violation_count=violation_count
            )
            
            # Fallback to rule-based calculation
            if result is None:
                from ..api.middleware.logging import get_logger
                logger = get_logger(__name__)
                logger.warning(f"AI risk score failed, using fallback: {inspection.id}")
                result = ai_service.calculate_fallback_risk_score(
                    checklist_responses=[r.to_dict() for r in responses],
                    evidence_count=len(evidence_list),
                    violation_count=violation_count
                )
            
            # Update inspection with risk score
            inspection.risk_score = result.get("risk_score")
            inspection.risk_level = result.get("risk_level")
            self.update(inspection)
            
        except Exception as e:
            # Log error but don't fail the inspection completion
            from ..api.middleware.logging import get_logger
            logger = get_logger(__name__)
            logger.error(f"Error calculating AI risk score for inspection {inspection.id}: {str(e)}")
    
    async def _generate_ai_report(self, inspection: Inspection):
        """
        Generate AI report for inspection asynchronously.
        
        Args:
            inspection: Inspection to generate report for
        """
        try:
            ai_service = get_ai_service()
            
            # Call AI report generation
            result = await ai_service.generate_report(
                inspection_id=str(inspection.id),
                report_type="detailed",
                include_recommendations=True,
                include_charts=True
            )
            
            # Update inspection with report result
            if result:
                inspection.report_url = result.get("report_url")
                inspection.report_generated_at = datetime.fromisoformat(result.get("generated_at")) if result.get("generated_at") else datetime.now()
                self.update(inspection)
            else:
                from ..api.middleware.logging import get_logger
                logger = get_logger(__name__)
                logger.warning(f"AI report generation failed: {inspection.id}")
                
        except Exception as e:
            # Log error but don't fail the inspection completion
            from ..api.middleware.logging import get_logger
            logger = get_logger(__name__)
            logger.error(f"Error generating AI report for inspection {inspection.id}: {str(e)}")
    
    def _record_state_transition(
        self,
        inspection_id: UUID,
        from_state: Optional[str],
        to_state: str,
        transition_reason: Optional[str] = None,
        changed_by: Optional[UUID] = None
    ) -> None:
        """
        Record a state transition in the history table.
        
        Args:
            inspection_id: ID of the inspection
            from_state: Previous state
            to_state: New state
            transition_reason: Reason for transition
            changed_by: User who initiated the change
        """
        try:
            state_history = InspectionStateHistory(
                inspection_id=inspection_id,
                from_state=from_state,
                to_state=to_state,
                transition_reason=transition_reason,
                changed_by=changed_by
            )
            self.state_history_repo.create(state_history)
        except Exception as e:
            # Log error but don't fail the main operation
            pass
    
    def validate_before_update(self, entity: Inspection) -> None:
        """
        Validate inspection before update.
        
        Args:
            entity: The inspection to validate
            
        Raises:
            ValueError: If validation fails
        """
        # Validate date consistency
        if entity.completed_at and entity.started_at:
            if entity.completed_at < entity.started_at:
                raise ValueError("Completion time cannot be before start time")
        
        # Validate compliance score range
        if entity.compliance_score is not None and (entity.compliance_score < 0 or entity.compliance_score > 100):
            raise ValueError("Compliance score must be between 0 and 100")
