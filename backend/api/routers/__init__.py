"""
NIRIKSHA - Inspection Workflow & Data Collection Module
API Routers Package

Description:
    This package contains all FastAPI routers for the inspection workflow
    module API endpoints.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from .inspection import router as inspection_router
from .checklist import router as checklist_router
from .evidence import router as evidence_router

__all__ = [
    "inspection_router",
    "checklist_router",
    "evidence_router",
]
