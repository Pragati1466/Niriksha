"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Repositories Package

Description:
    This package contains all repository classes for data access operations.
    Repositories abstract database operations and provide specialized queries
    for each domain model.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from .base_repository import BaseRepository

from .inspection_repository import (
    InspectionRepository,
)

from .checklist_repository import (
    ChecklistRepository,
    ChecklistTemplateRepository,
    ChecklistSectionRepository,
    ChecklistItemRepository,
)

from .evidence_repository import (
    EvidenceRepository,
)

__all__ = [
    "BaseRepository",
    "InspectionRepository",
    "ChecklistRepository",
    "ChecklistTemplateRepository",
    "ChecklistSectionRepository",
    "ChecklistItemRepository",
    "EvidenceRepository",
]
