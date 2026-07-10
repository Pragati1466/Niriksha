"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Database Models Package

Description:
    This package contains all SQLAlchemy ORM models for the inspection
    workflow module. Models are organized by domain and include
    comprehensive documentation and helper methods.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from .base import (
    Base,
    TimestampMixin,
    UUIDMixin,
    SoftDeleteMixin,
    VersionMixin,
    AuditMixin,
    BaseModel,
    AuditedModel,
    VersionedModel,
    SoftDeleteModel,
    FullModel,
)

from .inspection import (
    Inspection,
    InspectionStatus,
    InspectionPriority,
)

from .checklist import (
    InspectionChecklist,
    ChecklistTemplate,
    ChecklistSection,
    ChecklistItem,
    ResponseType,
    SeverityLevel,
    InspectionDomain,
)

from .evidence import (
    Evidence,
    EvidenceType,
    VerificationStatus,
)

from .note import (
    InspectionNote,
    NoteType,
)

from .state_history import (
    InspectionStateHistory,
)

from .offline_queue import (
    InspectionOfflineQueue,
    SyncActionType,
    SyncStatus,
)

from .location_log import (
    InspectionLocationLog,
    LocationSource,
)

from .submission import (
    Submission,
    RecipientType,
    SubmissionPriority,
    SubmissionStatus,
)

from .report import (
    GeneratedReport,
    ReportType,
    FileFormat,
)

from .sync_conflict import (
    SyncConflict,
    ConflictType,
    ResolutionStatus,
)

from .audit_log import (
    AuditLog,
)

from .attachment import (
    InspectionAttachment,
    AttachmentType,
)

__all__ = [
    # Base classes
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    "SoftDeleteMixin",
    "VersionMixin",
    "AuditMixin",
    "BaseModel",
    "AuditedModel",
    "VersionedModel",
    "SoftDeleteModel",
    "FullModel",
    # Inspection models
    "Inspection",
    "InspectionStatus",
    "InspectionPriority",
    # Checklist models
    "InspectionChecklist",
    "ChecklistTemplate",
    "ChecklistSection",
    "ChecklistItem",
    "ResponseType",
    "SeverityLevel",
    "InspectionDomain",
    # Evidence models
    "Evidence",
    "EvidenceType",
    "VerificationStatus",
    # Note models
    "InspectionNote",
    "NoteType",
    # State history models
    "InspectionStateHistory",
    # Offline sync models
    "InspectionOfflineQueue",
    "SyncActionType",
    "SyncStatus",
    # Location models
    "InspectionLocationLog",
    "LocationSource",
    # Submission models
    "Submission",
    "RecipientType",
    "SubmissionPriority",
    "SubmissionStatus",
    # Report models
    "GeneratedReport",
    "ReportType",
    "FileFormat",
    # Sync conflict models
    "SyncConflict",
    "ConflictType",
    "ResolutionStatus",
    # Audit models
    "AuditLog",
    # Attachment models
    "InspectionAttachment",
    "AttachmentType",
]
