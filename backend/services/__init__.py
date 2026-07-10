"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Services Package

Description:
    This package contains all service classes for business logic operations.
    Services orchestrate repository operations and implement business rules.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from .base_service import BaseService

from .inspection_service import InspectionService
from .checklist_service import ChecklistService
from .evidence_service import EvidenceService
from .ai_integration_service import AIIntegrationService, get_ai_service

__all__ = [
    "BaseService",
    "InspectionService",
    "ChecklistService",
    "EvidenceService",
    "AIIntegrationService",
    "get_ai_service",
]
