"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Repository

Description:
    This module provides the InspectionRepository for performing database
    operations specific to the Inspection model, including specialized queries
    for filtering by inspector, site, status, and date ranges.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime

from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from .base_repository import BaseRepository
from ..database.models.inspection import Inspection, InspectionStatus, InspectionPriority


class InspectionRepository(BaseRepository[Inspection]):
    """
    Repository for Inspection model with specialized queries.
    
    This repository provides methods for querying inspections by various
    criteria including inspector, site, status, priority, and date ranges.
    It also includes methods for compliance statistics and active inspections.
    All queries use eager loading to prevent N+1 query problems.
    """
    
    def get_with_relations(self, inspection_id: UUID) -> Optional[Inspection]:
        """
        Get inspection by ID with all related entities loaded.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            Optional[Inspection]: Inspection with relations loaded
        """
        return self.db.execute(
            select(Inspection)
            .options(
                selectinload(Inspection.checklist_responses),
                selectinload(Inspection.evidence),
                selectinload(Inspection.notes),
                selectinload(Inspection.state_history),
                selectinload(Inspection.location_logs),
                joinedload(Inspection.submission),
                joinedload(Inspection.report),
            )
            .where(Inspection.id == inspection_id)
        ).scalar_one_or_none()
    
    def get_all_with_relations(
        self,
        skip: int = 0,
        limit: int = 100,
        filters: Optional[dict] = None
    ) -> List[Inspection]:
        """
        Get all inspections with relations loaded.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            filters: Optional filters
            
        Returns:
            List[Inspection]: List of inspections with relations
        """
        query = select(Inspection).options(
            selectinload(Inspection.checklist_responses),
            selectinload(Inspection.evidence),
            selectinload(Inspection.notes),
            joinedload(Inspection.submission),
        )
        
        if filters:
            for key, value in filters.items():
                if isinstance(value, dict):
                    # Handle range filters
                    if "$gte" in value:
                        query = query.where(getattr(Inspection, key) >= value["$gte"])
                    if "$lte" in value:
                        query = query.where(getattr(Inspection, key) <= value["$lte"])
                else:
                    query = query.where(getattr(Inspection, key) == value)
        
        query = query.offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())
    
    def find_by_inspector(
        self,
        inspector_id: UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find inspections by inspector ID with optional status filter.
        
        Args:
            inspector_id: ID of the inspector
            status: Optional status filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of inspections
        """
        filters = {"inspector_id": inspector_id}
        if status:
            filters["status"] = status
        
        return self.get_all_with_relations(skip=skip, limit=limit, filters=filters)
    
    def find_by_site(
        self,
        site_id: UUID,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find inspections by site ID with optional status filter.
        
        Args:
            site_id: ID of the site
            status: Optional status filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of inspections
        """
        filters = {"site_id": site_id}
        if status:
            filters["status"] = status
        
        return self.get_all_with_relations(skip=skip, limit=limit, filters=filters)
    
    def find_by_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find inspections by status.
        
        Args:
            status: Status to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of inspections
        """
        return self.get_all_with_relations(skip=skip, limit=limit, filters={"status": status})
    
    def find_by_date_range(
        self,
        start_date: datetime,
        end_date: datetime,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find inspections within a date range.
        
        Args:
            start_date: Start of date range
            end_date: End of date range
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of inspections
        """
        filters = {
            "scheduled_date": {"$gte": start_date, "$lte": end_date}
        }
        return self.get_all_with_relations(skip=skip, limit=limit, filters=filters)
    
    def find_active_inspections(
        self,
        inspector_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find active inspections (not completed or cancelled).
        
        Args:
            inspector_id: Optional inspector ID filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of active inspections
        """
        query = select(Inspection).where(
            Inspection.status.in_(InspectionStatus.active())
        ).options(
            selectinload(Inspection.checklist_responses),
            selectinload(Inspection.evidence),
        )
        
        if inspector_id:
            query = query.where(Inspection.inspector_id == inspector_id)
        
        query = query.offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())
    
    def find_overdue_inspections(
        self,
        inspector_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find overdue inspections (scheduled date passed but not completed).
        
        Args:
            inspector_id: Optional inspector ID filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of overdue inspections
        """
        query = select(Inspection).where(
            and_(
                Inspection.scheduled_date < datetime.now(),
                Inspection.status.in_(InspectionStatus.active())
            )
        ).options(
            selectinload(Inspection.checklist_responses),
        )
        
        if inspector_id:
            query = query.where(Inspection.inspector_id == inspector_id)
        
        query = query.offset(skip).limit(limit)
        return list(self.db.execute(query).scalars().all())
    
    def find_by_priority(
        self,
        priority: str,
        status: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Inspection]:
        """
        Find inspections by priority with optional status filter.
        
        Args:
            priority: Priority level
            status: Optional status filter
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Inspection]: List of inspections
        """
        filters = {"priority": priority}
        if status:
            filters["status"] = status
        
        return self.get_all_with_relations(skip=skip, limit=limit, filters=filters)
    
    def get_compliance_stats(self, inspector_id: UUID) -> dict:
        """
        Get compliance statistics for an inspector.
        
        Args:
            inspector_id: ID of the inspector
            
        Returns:
            dict: Compliance statistics including total, completed, average score
        """
        try:
            all_inspections = self.find_by_inspector(inspector_id)
            completed = [i for i in all_inspections if i.status == InspectionStatus.COMPLETED]
            
            total = len(all_inspections)
            completed_count = len(completed)
            
            if completed_count > 0:
                avg_score = sum(i.compliance_score or 0 for i in completed) / completed_count
            else:
                avg_score = 0.0
            
            return {
                "total": total,
                "completed": completed_count,
                "pending": total - completed_count,
                "average_compliance_score": avg_score,
            }
        except Exception as e:
            raise Exception(f"Error getting compliance stats: {str(e)}")
    
    def get_inspection_count_by_status(self) -> dict:
        """
        Get count of inspections grouped by status.
        
        Returns:
            dict: Status counts
        """
        try:
            all_inspections = self.get_all_with_relations(limit=1000)
            status_counts = {}
            
            for status in InspectionStatus.all():
                status_counts[status] = len([i for i in all_inspections if i.status == status])
            
            return status_counts
        except Exception as e:
            raise Exception(f"Error getting status counts: {str(e)}")
