"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence API Router

Description:
    This module provides FastAPI router for evidence-related endpoints,
    including upload, metadata management, and verification status.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..schemas.evidence import (
    EvidenceMetadataRequest,
    PhotoUploadRequest,
    DocumentUploadRequest,
    PresignedUrlRequest,
    PresignedUrlResponse,
    EvidenceResponse,
    EvidenceListResponse,
    VerificationStatusResponse,
)
from ..schemas.common import PaginationParams
from ...services.evidence_service import EvidenceService
from ...database.session import get_db


router = APIRouter(prefix="/evidence", tags=["evidence"])


@router.post("/presigned-url", response_model=PresignedUrlResponse)
def get_presigned_upload_url(
    request: PresignedUrlRequest,
    db: Session = Depends(get_db)
):
    """
    Get a presigned URL for direct file upload to storage.
    
    Args:
        request: Presigned URL request
        db: Database session
        
    Returns:
        PresignedUrlResponse: Presigned URL and upload fields
    """
    try:
        # This would integrate with storage service (S3, etc.)
        # For now, return a placeholder
        return PresignedUrlResponse(
            url="https://storage.example.com/upload",
            fields={"key": f"evidence/{request.file_name}"},
            expires_at=(datetime.now()).isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/photos", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def upload_photo(
    request: PhotoUploadRequest,
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Upload photo evidence.
    
    Args:
        request: Photo upload request
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        EvidenceResponse: The created evidence record
    """
    try:
        service = EvidenceService(db)
        evidence = service.create_evidence(
            inspection_id=inspection_id,
            evidence_type="photo",
            file_name=request.file_name,
            file_path=f"evidence/{inspection_id}/{request.file_name}",  # Placeholder path
            file_size=request.file_size,
            file_mime_type=request.file_mime_type,
            capture_timestamp=request.capture_timestamp,
            capture_location_lat=request.capture_location_lat,
            capture_location_lng=request.capture_location_lng,
            capture_location_accuracy=request.capture_location_accuracy,
            device_id=request.device_id,
            description=request.description,
            tags=request.tags,
            checklist_response_id=request.checklist_response_id
        )
        return evidence
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/documents", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
def upload_document(
    request: DocumentUploadRequest,
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Upload document evidence.
    
    Args:
        request: Document upload request
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        EvidenceResponse: The created evidence record
    """
    try:
        service = EvidenceService(db)
        evidence = service.create_evidence(
            inspection_id=inspection_id,
            evidence_type="document",
            file_name=request.file_name,
            file_path=f"evidence/{inspection_id}/{request.file_name}",  # Placeholder path
            file_size=request.file_size,
            file_mime_type=request.file_mime_type,
            description=request.description,
            tags=request.tags
        )
        return evidence
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/inspections/{inspection_id}", response_model=EvidenceListResponse)
def list_evidence(
    inspection_id: UUID,
    evidence_type: Optional[str] = None,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db)
):
    """
    List evidence for an inspection with optional type filter.
    
    Args:
        inspection_id: ID of the inspection
        evidence_type: Optional evidence type filter
        pagination: Pagination parameters
        db: Database session
        
    Returns:
        EvidenceListResponse: Paginated list of evidence
    """
    try:
        service = EvidenceService(db)
        
        if evidence_type == "photo":
            evidence = service.get_photos(inspection_id)
        elif evidence_type == "document":
            evidence = service.get_documents(inspection_id)
        else:
            evidence = service.get_evidence_by_inspection(inspection_id)
        
        # Apply pagination
        paginated_evidence = evidence[pagination.skip:pagination.skip + pagination.page_size]
        
        return EvidenceListResponse(
            evidence=paginated_evidence,
            total=len(evidence),
            page=pagination.page,
            page_size=pagination.page_size
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("/{evidence_id}", response_model=EvidenceResponse)
def get_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get evidence by ID.
    
    Args:
        evidence_id: ID of the evidence
        db: Database session
        
    Returns:
        EvidenceResponse: The evidence
    """
    try:
        service = EvidenceService(db)
        evidence = service.get_by_id(evidence_id)
        if evidence is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
        return evidence
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{evidence_id}/metadata", response_model=EvidenceResponse)
def update_evidence_metadata(
    evidence_id: UUID,
    request: EvidenceMetadataRequest,
    db: Session = Depends(get_db)
):
    """
    Update evidence metadata.
    
    Args:
        evidence_id: ID of the evidence
        request: Metadata update request
        db: Database session
        
    Returns:
        EvidenceResponse: The updated evidence
    """
    try:
        service = EvidenceService(db)
        evidence = service.get_by_id(evidence_id)
        if evidence is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
        
        update_data = request.model_dump(exclude_unset=True)
        updated_evidence = service.repository.update_by_id(evidence_id, update_data)
        
        return updated_evidence
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.patch("/{evidence_id}/verification", response_model=EvidenceResponse)
def update_verification_status(
    evidence_id: UUID,
    verification_status: str,
    verification_confidence: Optional[float] = None,
    verification_notes: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Update verification status for evidence.
    
    Args:
        evidence_id: ID of the evidence
        verification_status: New verification status
        verification_confidence: Confidence score (0-100)
        verification_notes: Verification findings
        db: Database session
        
    Returns:
        EvidenceResponse: The updated evidence
    """
    try:
        service = EvidenceService(db)
        evidence = service.update_verification_status(
            evidence_id=evidence_id,
            verification_status=verification_status,
            verification_confidence=verification_confidence,
            verification_notes=verification_notes
        )
        return evidence
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{evidence_id}/verification", response_model=VerificationStatusResponse)
def get_verification_status(
    evidence_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get verification status for evidence.
    
    Args:
        evidence_id: ID of the evidence
        db: Database session
        
    Returns:
        VerificationStatusResponse: Verification status details
    """
    try:
        service = EvidenceService(db)
        evidence = service.get_by_id(evidence_id)
        if evidence is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evidence not found")
        
        return VerificationStatusResponse(
            evidence_id=evidence.id,
            verification_status=evidence.verification_status,
            verification_confidence=float(evidence.verification_confidence) if evidence.verification_confidence else None,
            verification_notes=evidence.verification_notes,
            discrepancies=[]  # Placeholder for discrepancies
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/{evidence_id}/tags/{tag}", response_model=EvidenceResponse)
def add_tag(
    evidence_id: UUID,
    tag: str,
    db: Session = Depends(get_db)
):
    """
    Add a tag to evidence.
    
    Args:
        evidence_id: ID of the evidence
        tag: Tag to add
        db: Database session
        
    Returns:
        EvidenceResponse: The updated evidence
    """
    try:
        service = EvidenceService(db)
        evidence = service.add_tag(evidence_id, tag)
        return evidence
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{evidence_id}/tags/{tag}", response_model=EvidenceResponse)
def remove_tag(
    evidence_id: UUID,
    tag: str,
    db: Session = Depends(get_db)
):
    """
    Remove a tag from evidence.
    
    Args:
        evidence_id: ID of the evidence
        tag: Tag to remove
        db: Database session
        
    Returns:
        EvidenceResponse: The updated evidence
    """
    try:
        service = EvidenceService(db)
        evidence = service.remove_tag(evidence_id, tag)
        return evidence
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/inspections/{inspection_id}/summary")
def get_evidence_summary(
    inspection_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get evidence summary for an inspection.
    
    Args:
        inspection_id: ID of the inspection
        db: Database session
        
    Returns:
        dict: Evidence summary including type counts and verification status
    """
    try:
        service = EvidenceService(db)
        type_counts = service.get_evidence_count_by_type(inspection_id)
        verification_summary = service.get_verification_summary(inspection_id)
        
        return {
            "inspection_id": str(inspection_id),
            "type_counts": type_counts,
            "verification_summary": verification_summary
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_evidence(
    evidence_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete evidence.
    
    Args:
        evidence_id: ID of the evidence
        db: Database session
    """
    try:
        service = EvidenceService(db)
        service.delete(evidence_id)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
