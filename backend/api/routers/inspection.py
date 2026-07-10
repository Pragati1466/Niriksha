"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection API Router

Description:
    This module provides FastAPI router for inspection-related endpoints,
    including CRUD operations, status management, and compliance tracking.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.inspection import (
    InspectionCreateRequest,
    InspectionUpdateRequest,
    InspectionStatusUpdateRequest,
    InspectionCheckInRequest,
    InspectionResponse,
    InspectionListResponse,
    InspectionDetailResponse,
    InspectionTimelineResponse,
    InspectionComplianceStatsResponse,
)
from ..schemas.common import PaginationParams, FilterParams
from ..services.inspection_service import InspectionService
from ..database.session import get_db


router = APIRouter(prefix="/inspections", tags=["inspections"])


@router.post("", response_model=InspectionResponse, status_code=status.HTTP_201_CREATED)
def create_inspection(
    request: InspectionCreateRequest,
    db: Session = Depends(get_db)
):
    """
    Create a new inspection.
    
    Args:
        request: Inspection creation request
        db: Database session
        
    Returns:
        InspectionResponse: The created inspection
    """
    try:
        service = InspectionService(db)
        inspection = service.create_inspection(
            inspector_id=request.inspector_id,
            site_id=request.site_id,
            inspection_type_id=request.inspection_type_id,
            priority=request.priority,
            scheduled_date=request.scheduled_date,
            scheduled_end_date=request.scheduled_end_date
        )
        return inspection
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{inspection_id}", response_model=InspectionDetailResponse)
def get_inspection(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get an inspection by ID with full details.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        InspectionDetailResponse: The inspection with related data
    """
    try:
        service = InspectionService(db)
        inspection = service.get_by_id(inspection_id)
        if inspection is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found")
        return inspection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=InspectionListResponse)
def list_inspections(
    pagination: PaginationParams = Depends(),
    filters: FilterParams = Depends(),
    inspector_id: Optional[UUID] = None,
    site_id: Optional[UUID] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List inspections with pagination and filtering.
    
    Args:
        pagination: Pagination parameters
        filters: Common filter parameters
        inspector_id: Optional inspector ID filter
        site_id: Optional site ID filter
        status: Optional status filter
        db: Database session
        
    Returns:
        InspectionListResponse: Paginated list of inspections
    """
    try:
        service = InspectionService(db)
        
        # Build filters
        filter_dict = {}
        if inspector_id:
            filter_dict["inspector_id"] = inspector_id
        if site_id:
            filter_dict["site_id"] = site_id
        if status:
            filter_dict["status"] = status
        if filters.status:
            filter_dict["status"] = filters.status
        
        inspections = service.get_all(
            skip=pagination.skip,
            limit=pagination.page_size,
            filters=filter_dict if filter_dict else None
        )
        total = service.count(filters=filter_dict if filter_dict else None)
        
        return InspectionListResponse(
            inspections=inspections,
            total=total,
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(total + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{inspection_id}", response_model=InspectionResponse)
def update_inspection(
    inspection_id: UUID,
    request: InspectionUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update an inspection.
    
    Args:
        inspection_id: ID of the inspection
        request: Inspection update request
        db: Database session
        
    Returns:
        InspectionResponse: The updated inspection
    """
    try:
        service = InspectionService(db)
        inspection = service.get_by_id(inspection_id)
        if inspection is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inspection not found")
        
        # Update fields
        update_data = request.model_dump(exclude_unset=True)
        updated_inspection = service.repository.update_by_id(inspection_id, update_data)
        
        return updated_inspection
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{inspection_id}/status", response_model=InspectionResponse)
def update_inspection_status(
    inspection_id: UUID,
    request: InspectionStatusUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Update inspection status with state transition validation.
    
    Args:
        inspection_id: ID of the inspection
        request: Status update request
        db: Database session
        
    Returns:
        InspectionResponse: The updated inspection
    """
    try:
        service = InspectionService(db)
        inspection = service.update_status(
            inspection_id=inspection_id,
            new_status=request.status,
            transition_reason=request.transition_reason
        )
        return inspection
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{inspection_id}/check-in", response_model=InspectionResponse)
def check_in_inspection(
    inspection_id: UUID,
    request: InspectionCheckInRequest,
    db: Session = Depends(get_db)
):
    """
    Check in at inspection site with GPS coordinates.
    
    Args:
        inspection_id: ID of the inspection
        request: Check-in request with GPS data
        db: Database session
        
    Returns:
        InspectionResponse: The updated inspection
    """
    try:
        service = InspectionService(db)
        inspection = service.check_in(
            inspection_id=inspection_id,
            latitude=request.latitude,
            longitude=request.longitude,
            accuracy=request.accuracy
        )
        return inspection
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/{inspection_id}/check-out", response_model=InspectionResponse)
def check_out_inspection(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Check out from inspection site.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        InspectionResponse: The updated inspection
    """
    try:
        service = InspectionService(db)
        inspection = service.check_out(inspection_id=inspection_id)
        return inspection
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{inspection_id}/timeline", response_model=InspectionTimelineResponse)
def get_inspection_timeline(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get the state transition timeline for an inspection.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        InspectionTimelineResponse: State transition history
    """
    try:
        service = InspectionService(db)
        timeline = service.get_inspection_timeline(inspection_id)
        return InspectionTimelineResponse(state_history=timeline)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/stats/compliance/{inspector_id}", response_model=InspectionComplianceStatsResponse)
def get_compliance_stats(
    inspector_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get compliance statistics for an inspector.
    
    Args:
        inspector_id: ID of the inspector
        db: Database session
        
    Returns:
        InspectionComplianceStatsResponse: Compliance statistics
    """
    try:
        service = InspectionService(db)
        stats = service.repository.get_compliance_stats(inspector_id)
        return InspectionComplianceStatsResponse(**stats)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/active", response_model=InspectionListResponse)
def get_active_inspections(
    inspector_id: Optional[UUID] = None,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    Get all active inspections.
    
    Args:
        inspector_id: Optional inspector ID filter
        pagination: Pagination parameters
        db: Database session
        
    Returns:
        InspectionListResponse: List of active inspections
    """
    try:
        service = InspectionService(db)
        inspections = service.get_active_inspections(inspector_id)
        
        # Apply pagination
        paginated_inspections = inspections[pagination.skip:pagination.skip + pagination.page_size]
        
        return InspectionListResponse(
            inspections=paginated_inspections,
            total=len(inspections),
            page=pagination.page,
            page_size=pagination.page_size,
            total_pages=(len(inspections) + pagination.page_size - 1) // pagination.page_size
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{inspection_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inspection(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete an inspection.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
    """
    try:
        service = InspectionService(db)
        service.delete(inspection_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
