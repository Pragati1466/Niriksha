"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence Service

Description:
    This module provides the EvidenceService for business logic related
    to evidence management, including upload, verification, and metadata handling.

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
from ..repositories.evidence_repository import EvidenceRepository
from ..database.models.evidence import Evidence, EvidenceType, VerificationStatus


class EvidenceService(BaseService[Evidence, EvidenceRepository]):
    """
    Service for Evidence business logic.
    
    This service handles evidence upload, metadata management, verification
    status tracking, and file integrity verification.
    """
    
    def __init__(self, session: Session):
        """
        Initialize the evidence service.
        
        Args:
            session: The database session
        """
        evidence_repo = EvidenceRepository(Evidence, session)
        super().__init__(evidence_repo, session)
    
    def create_evidence(
        self,
        inspection_id: UUID,
        evidence_type: str,
        file_name: str,
        file_path: str,
        file_size: int,
        file_mime_type: str,
        file_hash: Optional[str] = None,
        capture_timestamp: Optional[datetime] = None,
        capture_location_lat: Optional[Decimal] = None,
        capture_location_lng: Optional[Decimal] = None,
        capture_location_accuracy: Optional[Decimal] = None,
        device_id: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None,
        checklist_response_id: Optional[UUID] = None
    ) -> Evidence:
        """
        Create new evidence record.
        
        Args:
            inspection_id: ID of the inspection
            evidence_type: Type of evidence
            file_name: Original file name
            file_path: Storage path or URL
            file_size: File size in bytes
            file_mime_type: MIME type
            file_hash: SHA-256 hash for integrity
            capture_timestamp: Capture timestamp
            capture_location_lat: GPS latitude
            capture_location_lng: GPS longitude
            capture_location_accuracy: GPS accuracy
            device_id: Device ID
            description: Evidence description
            tags: Searchable tags
            checklist_response_id: Link to checklist response
            
        Returns:
            Evidence: The created evidence
        """
        if evidence_type not in EvidenceType.all():
            raise ValueError(f"Evidence type must be one of {EvidenceType.all()}")
        
        evidence = Evidence(
            inspection_id=inspection_id,
            checklist_response_id=checklist_response_id,
            evidence_type=evidence_type,
            file_name=file_name,
            file_path=file_path,
            file_size=file_size,
            file_mime_type=file_mime_type,
            file_hash=file_hash,
            capture_timestamp=capture_timestamp,
            capture_location_lat=capture_location_lat,
            capture_location_lng=capture_location_lng,
            capture_location_accuracy=capture_location_accuracy,
            device_id=device_id,
            description=description,
            tags=tags,
            verification_status=VerificationStatus.PENDING
        )
        
        created_evidence = self.create(evidence)
        
        # Trigger AI verification asynchronously
        asyncio.create_task(self._trigger_ai_verification(created_evidence))
        
        return created_evidence
    
    async def _trigger_ai_verification(self, evidence: Evidence):
        """
        Trigger AI verification for evidence asynchronously.
        
        Args:
            evidence: Evidence to verify
        """
        try:
            ai_service = get_ai_service()
            
            # Prepare metadata for AI verification
            metadata = {
                "capture_timestamp": evidence.capture_timestamp.isoformat() if evidence.capture_timestamp else None,
                "location": {
                    "lat": float(evidence.capture_location_lat) if evidence.capture_location_lat else None,
                    "lng": float(evidence.capture_location_lng) if evidence.capture_location_lng else None,
                    "accuracy": float(evidence.capture_location_accuracy) if evidence.capture_location_accuracy else None
                } if evidence.capture_location_lat else None,
                "device_id": evidence.device_id
            }
            
            # Call AI verification
            result = await ai_service.verify_evidence(
                evidence_id=str(evidence.id),
                file_url=evidence.file_path,
                file_type=evidence.evidence_type,
                metadata=metadata
            )
            
            # Update evidence with verification result
            if result:
                evidence.verification_status = result.get("verification_status", "manual_review_required")
                evidence.verification_confidence = Decimal(str(result.get("confidence", 0))) if result.get("confidence") else None
                evidence.verification_details = result.get("analysis_details")
                self.update(evidence)
            else:
                # Mark for manual review if AI failed
                evidence.verification_status = "manual_review_required"
                self.update(evidence)
                
        except Exception as e:
            # Log error but don't fail the evidence creation
            from ..api.middleware.logging import get_logger
            logger = get_logger(__name__)
            logger.error(f"Error triggering AI verification for evidence {evidence.id}: {str(e)}")
            evidence.verification_status = "manual_review_required"
            self.update(evidence)
    
    def update_verification_status(
        self,
        evidence_id: UUID,
        verification_status: str,
        verification_confidence: Optional[float] = None,
        verification_notes: Optional[str] = None
    ) -> Evidence:
        """
        Update verification status for evidence.
        
        Args:
            evidence_id: ID of the evidence
            verification_status: New verification status
            verification_confidence: Confidence score (0-100)
            verification_notes: Verification findings
            
        Returns:
            Evidence: The updated evidence
        """
        if verification_status not in VerificationStatus.all():
            raise ValueError(f"Verification status must be one of {VerificationStatus.all()}")
        
        evidence = self.get_by_id(evidence_id)
        if evidence is None:
            raise Exception(f"Evidence with id {evidence_id} not found")
        
        evidence.verification_status = verification_status
        if verification_confidence is not None:
            evidence.verification_confidence = Decimal(str(verification_confidence))
        if verification_notes is not None:
            evidence.verification_notes = verification_notes
        
        return self.update(evidence)
    
    def get_evidence_by_inspection(self, inspection_id: UUID) -> List[Evidence]:
        """
        Get all evidence for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[Evidence]: List of evidence items
        """
        return self.repository.find_by_inspection(inspection_id)
    
    def get_photos(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Get all photo evidence.
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of photo evidence
        """
        return self.repository.find_photos(inspection_id)
    
    def get_documents(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Get all document evidence.
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of document evidence
        """
        return self.repository.find_documents(inspection_id)
    
    def get_flagged_evidence(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Get all flagged evidence requiring review.
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of flagged evidence
        """
        return self.repository.find_flagged_evidence(inspection_id)
    
    def verify_integrity(self, evidence_id: UUID, file_hash: str) -> bool:
        """
        Verify evidence file integrity using hash comparison.
        
        Args:
            evidence_id: ID of the evidence
            file_hash: Hash to verify against
            
        Returns:
            bool: True if hash matches, False otherwise
        """
        evidence = self.get_by_id(evidence_id)
        if evidence is None:
            raise Exception(f"Evidence with id {evidence_id} not found")
        
        if evidence.file_hash is None:
            return False
        
        return evidence.file_hash == file_hash
    
    def add_tag(self, evidence_id: UUID, tag: str) -> Evidence:
        """
        Add a tag to evidence.
        
        Args:
            evidence_id: ID of the evidence
            tag: Tag to add
            
        Returns:
            Evidence: The updated evidence
        """
        evidence = self.get_by_id(evidence_id)
        if evidence is None:
            raise Exception(f"Evidence with id {evidence_id} not found")
        
        evidence.add_tag(tag)
        return self.update(evidence)
    
    def remove_tag(self, evidence_id: UUID, tag: str) -> Evidence:
        """
        Remove a tag from evidence.
        
        Args:
            evidence_id: ID of the evidence
            tag: Tag to remove
            
        Returns:
            Evidence: The updated evidence
        """
        evidence = self.get_by_id(evidence_id)
        if evidence is None:
            raise Exception(f"Evidence with id {evidence_id} not found")
        
        evidence.remove_tag(tag)
        return self.update(evidence)
    
    def get_verification_summary(self, inspection_id: UUID) -> dict:
        """
        Get verification status summary for an inspection's evidence.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            dict: Verification summary
        """
        return self.repository.get_verification_summary(inspection_id)
    
    def get_evidence_count_by_type(self, inspection_id: UUID) -> dict:
        """
        Get count of evidence grouped by type for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            dict: Type counts
        """
        return self.repository.get_evidence_count_by_type(inspection_id)
    
    def validate_before_create(self, entity: Evidence) -> None:
        """
        Validate evidence before creation.
        
        Args:
            entity: The evidence to validate
            
        Raises:
            ValueError: If validation fails
        """
        # Validate file size
        if entity.file_size <= 0:
            raise ValueError("File size must be greater than 0")
        
        # Validate file size limit (100MB)
        if entity.file_size > 100 * 1024 * 1024:
            raise ValueError("File size cannot exceed 100MB")
        
        # Validate evidence type
        if entity.evidence_type not in EvidenceType.all():
            raise ValueError(f"Evidence type must be one of {EvidenceType.all()}")
