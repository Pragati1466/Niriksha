"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Evidence Repository

Description:
    This module provides the EvidenceRepository for performing database
    operations specific to the Evidence model, including filtering by
    inspection, type, and verification status.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from .base_repository import BaseRepository
from ..database.models.evidence import Evidence, EvidenceType, VerificationStatus


class EvidenceRepository(BaseRepository[Evidence]):
    """
    Repository for Evidence model with specialized queries.
    
    This repository provides methods for querying evidence by inspection,
    checklist response, type, and verification status. It also includes
    methods for finding evidence by hash and verification status.
    """
    
    def find_by_inspection(self, inspection_id: UUID) -> List[Evidence]:
        """
        Find all evidence for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[Evidence]: List of evidence items
        """
        return self.find_by_field("inspection_id", inspection_id)
    
    def find_by_checklist_response(self, response_id: UUID) -> List[Evidence]:
        """
        Find all evidence linked to a checklist response.
        
        Args:
            response_id: ID of the checklist response
            
        Returns:
            List[Evidence]: List of evidence items
        """
        return self.find_by_field("checklist_response_id", response_id)
    
    def find_by_type(self, evidence_type: str, skip: int = 0, limit: int = 100) -> List[Evidence]:
        """
        Find evidence by type.
        
        Args:
            evidence_type: Type of evidence
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Evidence]: List of evidence items
        """
        return self.get_all(skip=skip, limit=limit, filters={"evidence_type": evidence_type})
    
    def find_photos(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Find all photo evidence, optionally filtered by inspection.
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of photo evidence
        """
        filters = {"evidence_type": EvidenceType.PHOTO}
        if inspection_id:
            filters["inspection_id"] = inspection_id
        
        return self.get_all(filters=filters)
    
    def find_documents(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Find all document evidence, optionally filtered by inspection.
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of document evidence
        """
        filters = {"evidence_type": EvidenceType.DOCUMENT}
        if inspection_id:
            filters["inspection_id"] = inspection_id
        
        return self.get_all(filters=filters)
    
    def find_by_verification_status(
        self,
        status: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[Evidence]:
        """
        Find evidence by verification status.
        
        Args:
            status: Verification status
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List[Evidence]: List of evidence items
        """
        return self.get_all(skip=skip, limit=limit, filters={"verification_status": status})
    
    def find_flagged_evidence(self, inspection_id: Optional[UUID] = None) -> List[Evidence]:
        """
        Find all flagged evidence (requires human review).
        
        Args:
            inspection_id: Optional inspection ID filter
            
        Returns:
            List[Evidence]: List of flagged evidence
        """
        filters = {"verification_status": VerificationStatus.FLAGGED}
        if inspection_id:
            filters["inspection_id"] = inspection_id
        
        return self.get_all(filters=filters)
    
    def find_by_hash(self, file_hash: str) -> Optional[Evidence]:
        """
        Find evidence by file hash (for integrity verification).
        
        Args:
            file_hash: SHA-256 hash of the file
            
        Returns:
            Optional[Evidence]: The evidence if found, None otherwise
        """
        try:
            results = self.find_by_field("file_hash", file_hash)
            return results[0] if results else None
        except Exception as e:
            raise Exception(f"Error finding evidence by hash: {str(e)}")
    
    def find_with_location_data(self, inspection_id: UUID) -> List[Evidence]:
        """
        Find evidence that has GPS location data.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            List[Evidence]: List of evidence with location data
        """
        try:
            all_evidence = self.find_by_inspection(inspection_id)
            return [e for e in all_evidence if e.has_location_data()]
        except Exception as e:
            raise Exception(f"Error finding evidence with location data: {str(e)}")
    
    def get_evidence_count_by_type(self, inspection_id: UUID) -> dict:
        """
        Get count of evidence grouped by type for an inspection.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            dict: Type counts
        """
        try:
            all_evidence = self.find_by_inspection(inspection_id)
            type_counts = {}
            
            for evidence_type in EvidenceType.all():
                type_counts[evidence_type] = len([e for e in all_evidence if e.evidence_type == evidence_type])
            
            return type_counts
        except Exception as e:
            raise Exception(f"Error getting evidence type counts: {str(e)}")
    
    def get_verification_summary(self, inspection_id: UUID) -> dict:
        """
        Get verification status summary for an inspection's evidence.
        
        Args:
            inspection_id: ID of the inspection
            
        Returns:
            dict: Verification summary with counts per status
        """
        try:
            all_evidence = self.find_by_inspection(inspection_id)
            status_counts = {}
            
            for status in VerificationStatus.all():
                status_counts[status] = len([e for e in all_evidence if e.verification_status == status])
            
            # Calculate average confidence for verified evidence
            verified_evidence = [e for e in all_evidence if e.verification_status == VerificationStatus.VERIFIED]
            if verified_evidence:
                avg_confidence = sum(e.verification_confidence or 0 for e in verified_evidence) / len(verified_evidence)
            else:
                avg_confidence = 0.0
            
            return {
                "status_counts": status_counts,
                "total": len(all_evidence),
                "verified_count": len(verified_evidence),
                "average_confidence": avg_confidence,
            }
        except Exception as e:
            raise Exception(f"Error getting verification summary: {str(e)}")
