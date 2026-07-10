"""
NIRIKSHA - Inspection Workflow & Data Collection Module
API Schemas Package

Description:
    This package contains all Pydantic schemas for API request/response
    validation across the inspection workflow module.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from .inspection import (
    InspectionCreateRequest,
    InspectionUpdateRequest,
    InspectionStatusUpdateRequest,
    InspectionCheckInRequest,
    InspectionResponse,
    InspectionListResponse,
    InspectionDetailResponse,
    InspectionTimelineResponse,
    InspectionComplianceStatsResponse,
    InspectionStatus,
    InspectionPriority,
)

from .checklist import (
    ChecklistResponseCreateRequest,
    ChecklistResponseUpdateRequest,
    ChecklistTemplateResponse,
    ChecklistItemResponse,
    ChecklistSectionResponse,
    ChecklistFullTemplateResponse,
    ResponseType,
    SeverityLevel,
)

from .evidence import (
    EvidenceMetadataRequest,
    PhotoUploadRequest,
    DocumentUploadRequest,
    PresignedUrlRequest,
    PresignedUrlResponse,
    EvidenceResponse,
    EvidenceListResponse,
    VerificationStatusResponse,
    EvidenceType,
    VerificationStatus,
)

from .notes import (
    NoteCreateRequest,
    NoteUpdateRequest,
    NoteResponse,
    NoteListResponse,
    NoteType,
)

from .sync import (
    SyncPushRequest,
    SyncPullRequest,
    SyncPushResponse,
    SyncPullResponse,
    SyncStatusResponse,
    ConflictResolutionRequest,
    ConflictResolutionResponse,
    SyncActionType,
    SyncStatus,
)

from .common import (
    PaginationParams,
    PaginatedResponse,
    SuccessResponse,
    ErrorResponse,
    FilterParams,
    IdResponse,
    BulkDeleteRequest,
    BulkDeleteResponse,
)

__all__ = [
    # Inspection schemas
    "InspectionCreateRequest",
    "InspectionUpdateRequest",
    "InspectionStatusUpdateRequest",
    "InspectionCheckInRequest",
    "InspectionResponse",
    "InspectionListResponse",
    "InspectionDetailResponse",
    "InspectionTimelineResponse",
    "InspectionComplianceStatsResponse",
    "InspectionStatus",
    "InspectionPriority",
    # Checklist schemas
    "ChecklistResponseCreateRequest",
    "ChecklistResponseUpdateRequest",
    "ChecklistTemplateResponse",
    "ChecklistItemResponse",
    "ChecklistSectionResponse",
    "ChecklistFullTemplateResponse",
    "ResponseType",
    "SeverityLevel",
    # Evidence schemas
    "EvidenceMetadataRequest",
    "PhotoUploadRequest",
    "DocumentUploadRequest",
    "PresignedUrlRequest",
    "PresignedUrlResponse",
    "EvidenceResponse",
    "EvidenceListResponse",
    "VerificationStatusResponse",
    "EvidenceType",
    "VerificationStatus",
    # Notes schemas
    "NoteCreateRequest",
    "NoteUpdateRequest",
    "NoteResponse",
    "NoteListResponse",
    "NoteType",
    # Sync schemas
    "SyncPushRequest",
    "SyncPullRequest",
    "SyncPushResponse",
    "SyncPullResponse",
    "SyncStatusResponse",
    "ConflictResolutionRequest",
    "ConflictResolutionResponse",
    "SyncActionType",
    "SyncStatus",
    # Common schemas
    "PaginationParams",
    "PaginatedResponse",
    "SuccessResponse",
    "ErrorResponse",
    "FilterParams",
    "IdResponse",
    "BulkDeleteRequest",
    "BulkDeleteResponse",
]
