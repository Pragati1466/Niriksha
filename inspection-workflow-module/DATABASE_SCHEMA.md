# Database Schema - Inspection Workflow & Data Collection Module

## Overview
This document describes the complete database schema for the Inspection Workflow & Data Collection Module with 15 tables, including fields, relationships, indexes, constraints, and SQL schema.

---

## Table 1: inspections

**Purpose:** Core table storing all inspection records with lifecycle state, scheduling, and location data.

**Why it exists:** Central entity for the entire inspection workflow. Every inspection conducted by an inspector is tracked here with its current state, timing, and geospatial data.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique inspection identifier |
| inspector_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspector (from user management) |
| site_id | UUID | FOREIGN KEY, NOT NULL | Reference to site being inspected |
| inspection_type_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection type |
| status | VARCHAR(50) | NOT NULL, CHECK | Current state: draft, in_progress, evidence_collection, review, submitted, under_review, completed, cancelled |
| priority | VARCHAR(20) | NOT NULL, CHECK | Priority level: low, medium, high, urgent |
| scheduled_date | TIMESTAMP | NOT NULL | When inspection is scheduled |
| scheduled_end_date | TIMESTAMP | | Expected completion time |
| started_at | TIMESTAMP | | Actual start time |
| completed_at | TIMESTAMP | | Actual completion time |
| location_lat | DECIMAL(10,8) | | Check-in latitude |
| location_lng | DECIMAL(11,8) | | Check-in longitude |
| location_accuracy | DECIMAL(5,2) | | GPS accuracy in meters |
| check_in_time | TIMESTAMP | | When inspector checked in at site |
| check_out_time | TIMESTAMP | | When inspector checked out |
| compliance_score | INTEGER | CHECK (0-100) | Overall compliance percentage |
| violation_count | INTEGER | DEFAULT 0 | Number of violations found |
| total_checklist_items | INTEGER | DEFAULT 0 | Total items in checklist |
| completed_checklist_items | INTEGER | DEFAULT 0 | Items with responses |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| version | INTEGER | DEFAULT 1 | Optimistic locking version |

**Indexes:**
- `idx_inspections_inspector_status` (inspector_id, status)
- `idx_inspections_site_status` (site_id, status)
- `idx_inspections_scheduled_date` (scheduled_date)
- `idx_inspections_priority_status` (priority, status)

**Constraints:**
- `chk_status`: CHECK status IN valid states
- `chk_priority`: CHECK priority IN ('low', 'medium', 'high', 'urgent')
- `chk_compliance_score`: CHECK compliance_score BETWEEN 0 AND 100
- `chk_dates`: CHECK completed_at >= started_at

---

## Table 2: inspection_checklists

**Purpose:** Stores checklist responses for each inspection, linking checklist templates to actual inspection data.

**Why it exists:** Inspections require structured responses to checklist items. This table captures all responses in a structured format while maintaining flexibility for different checklist templates.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique checklist response identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| checklist_template_id | UUID | FOREIGN KEY, NOT NULL | Reference to checklist template |
| section_id | UUID | FOREIGN KEY | Reference to checklist section |
| item_id | UUID | FOREIGN KEY, NOT NULL | Reference to checklist item |
| response_type | VARCHAR(20) | NOT NULL | Type: yes_no, text, number, dropdown, date, multiple_choice |
| response_value | TEXT | | The actual response value |
| response_text | TEXT | | Textual response (for text/number types) |
| is_compliant | BOOLEAN | | Whether response indicates compliance |
| requires_evidence | BOOLEAN | DEFAULT FALSE | Whether this item requires evidence attachment |
| evidence_attached | BOOLEAN | DEFAULT FALSE | Whether evidence has been attached |
| notes | TEXT | | Inspector notes for this item |
| regulatory_reference | VARCHAR(255) | | Citation of applicable regulation |
| severity | VARCHAR(20) | | Severity if non-compliant: critical, major, minor |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Response timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_checklists_inspection` (inspection_id)
- `idx_checklists_template` (checklist_template_id)
- `idx_checklists_section` (section_id)
- `idx_checklists_item` (item_id)
- `idx_checklists_compliance` (is_compliant)

**Constraints:**
- `chk_response_type`: CHECK response_type IN ('yes_no', 'text', 'number', 'dropdown', 'date', 'multiple_choice')
- `chk_severity`: CHECK severity IN ('critical', 'major', 'minor')

---

## Table 3: evidence

**Purpose:** Stores all evidence files (photos, documents) attached to inspections with metadata and verification status.

**Why it exists:** Evidence is critical for inspection integrity. This table tracks all uploaded files, their association with checklist items, metadata, and AI verification status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique evidence identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| checklist_response_id | UUID | FOREIGN KEY | Reference to specific checklist response |
| evidence_type | VARCHAR(20) | NOT NULL | Type: photo, document, audio, video |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_path | VARCHAR(500) | NOT NULL | Storage path/URL |
| file_size | BIGINT | NOT NULL | File size in bytes |
| file_mime_type | VARCHAR(100) | NOT NULL | MIME type |
| file_hash | VARCHAR(64) | | SHA-256 hash for integrity |
| capture_timestamp | TIMESTAMP | | When evidence was captured |
| capture_location_lat | DECIMAL(10,8) | | GPS latitude at capture |
| capture_location_lng | DECIMAL(11,8) | | GPS longitude at capture |
| capture_location_accuracy | DECIMAL(5,2) | | GPS accuracy in meters |
| device_id | VARCHAR(100) | | Device that captured evidence |
| description | TEXT | | Evidence description |
| tags | TEXT[] | | Searchable tags |
| verification_status | VARCHAR(20) | DEFAULT 'pending' | AI verification: pending, verified, flagged, disputed |
| verification_confidence | DECIMAL(5,2) | | AI confidence score (0-100) |
| verification_notes | TEXT | | AI verification findings |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Record creation timestamp |

**Indexes:**
- `idx_evidence_inspection` (inspection_id)
- `idx_evidence_checklist_response` (checklist_response_id)
- `idx_evidence_type` (evidence_type)
- `idx_evidence_verification` (verification_status)
- `idx_evidence_hash` (file_hash)

**Constraints:**
- `chk_evidence_type`: CHECK evidence_type IN ('photo', 'document', 'audio', 'video')
- `chk_verification_status`: CHECK verification_status IN ('pending', 'verified', 'flagged', 'disputed')
- `chk_verification_confidence`: CHECK verification_confidence BETWEEN 0 AND 100

---

## Table 4: inspection_notes

**Purpose:** Stores text notes, observations, and contextual information added during inspections.

**Why it exists:** Inspectors need to record detailed observations, violation details, and contextual information that doesn't fit into structured checklist responses.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique note identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| checklist_response_id | UUID | FOREIGN KEY | Reference to specific checklist response |
| note_type | VARCHAR(20) | NOT NULL | Type: observation, violation, general, follow_up, clarification |
| content | TEXT | NOT NULL | Note content |
| is_voice_note | BOOLEAN | DEFAULT FALSE | Whether this is a transcribed voice note |
| audio_file_path | VARCHAR(500) | | Path to original audio file |
| severity | VARCHAR(20) | | Severity level if applicable |
| requires_action | BOOLEAN | DEFAULT FALSE | Whether this note requires follow-up action |
| action_taken | TEXT | | Description of action taken |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Note creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |
| created_by | UUID | FOREIGN KEY | Inspector who created note |

**Indexes:**
- `idx_notes_inspection` (inspection_id)
- `idx_notes_checklist_response` (checklist_response_id)
- `idx_notes_type` (note_type)
- `idx_notes_severity` (severity)
- `idx_notes_created_at` (created_at)

**Constraints:**
- `chk_note_type`: CHECK note_type IN ('observation', 'violation', 'general', 'follow_up', 'clarification')
- `chk_severity`: CHECK severity IN ('critical', 'major', 'minor')

---

## Table 5: inspection_state_history

**Purpose:** Tracks all state transitions for inspections for audit trail and compliance.

**Why it exists:** Government inspections require complete audit trails. This table records every state change with timestamps, reasons, and who made the change.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique state history identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| from_state | VARCHAR(50) | | Previous state |
| to_state | VARCHAR(50) | NOT NULL | New state |
| transition_reason | TEXT | | Reason for state change |
| transition_metadata | JSONB | | Additional context for transition |
| changed_by | UUID | FOREIGN KEY | User/system that initiated change |
| changed_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Transition timestamp |
| ip_address | INET | | IP address of requester |
| user_agent | VARCHAR(500) | | Client user agent |

**Indexes:**
- `idx_state_history_inspection` (inspection_id)
- `idx_state_history_to_state` (to_state)
- `idx_state_history_changed_at` (changed_at)

**Constraints:**
- `chk_to_state`: CHECK to_state IN valid inspection states

---

## Table 6: inspection_offline_queue

**Purpose:** Queues inspection data changes for synchronization when connectivity is restored.

**Why it exists:** Inspectors work offline in areas with poor connectivity. This table stores pending changes that need to sync with the server.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique queue item identifier |
| inspection_id | UUID | FOREIGN KEY | Reference to inspection (null for new inspections) |
| action_type | VARCHAR(20) | NOT NULL | Action: create, update, delete, sync |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity: inspection, checklist, evidence, note |
| entity_id | UUID | | Local entity identifier |
| payload | JSONB | NOT NULL | Complete entity data for sync |
| sync_status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: pending, in_progress, completed, failed |
| retry_count | INTEGER | DEFAULT 0 | Number of sync retry attempts |
| last_error | TEXT | | Last sync error message |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Queue entry timestamp |
| sync_started_at | TIMESTAMP | | When sync attempt started |
| sync_completed_at | TIMESTAMP | | When sync completed |

**Indexes:**
- `idx_offline_queue_inspection` (inspection_id)
- `idx_offline_queue_status` (sync_status)
- `idx_offline_queue_action` (action_type)
- `idx_offline_queue_created_at` (created_at)

**Constraints:**
- `chk_action_type`: CHECK action_type IN ('create', 'update', 'delete', 'sync')
- `chk_sync_status`: CHECK sync_status IN ('pending', 'in_progress', 'completed', 'failed')

---

## Table 7: inspection_location_log

**Purpose:** Tracks inspector location updates during inspections for route verification and safety.

**Why it exists:** Safety and compliance require tracking inspector movement. This logs GPS coordinates during inspections for verification and route optimization.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique location log identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| latitude | DECIMAL(10,8) | NOT NULL | GPS latitude |
| longitude | DECIMAL(11,8) | NOT NULL | GPS longitude |
| accuracy | DECIMAL(5,2) | | GPS accuracy in meters |
| altitude | DECIMAL(10,2) | | Altitude in meters |
| speed | DECIMAL(5,2) | | Speed in m/s |
| heading | DECIMAL(5,2) | | Heading in degrees |
| location_source | VARCHAR(20) | NOT NULL | Source: gps, network, passive |
| is_at_site | BOOLEAN | DEFAULT FALSE | Whether location is within site geofence |
| distance_from_site | DECIMAL(10,2) | | Distance from site in meters |
| recorded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | When location was recorded |
| device_id | VARCHAR(100) | | Device that recorded location |

**Indexes:**
- `idx_location_log_inspection` (inspection_id)
- `idx_location_log_recorded_at` (recorded_at)
- `idx_location_log_at_site` (is_at_site)

**Constraints:**
- `chk_location_source`: CHECK location_source IN ('gps', 'network', 'passive')

---

## Table 8: submissions

**Purpose:** Tracks inspection report submissions to supervisors with metadata and status.

**Why it exists:** Completed inspections are submitted for review. This table manages the submission workflow, routing, and tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique submission identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL, UNIQUE | Reference to inspection |
| submitted_by | UUID | FOREIGN KEY, NOT NULL | Inspector who submitted |
| submitted_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Submission timestamp |
| recipient_id | UUID | FOREIGN KEY | Supervisor/recipient ID |
| recipient_type | VARCHAR(20) | NOT NULL | Type: supervisor, reviewer, auto |
| priority | VARCHAR(20) | NOT NULL | Submission priority: normal, high, urgent |
| submission_status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: pending, acknowledged, under_review, approved, rejected, returned |
| report_id | UUID | FOREIGN KEY | Reference to generated report |
| inspector_comments | TEXT | | Comments from inspector |
| reviewer_comments | TEXT | | Comments from reviewer |
| acknowledged_at | TIMESTAMP | | When submission was acknowledged |
| review_started_at | TIMESTAMP | | When review began |
| review_completed_at | TIMESTAMP | | When review completed |
| approved_by | UUID | FOREIGN KEY | Who approved submission |
| approved_at | TIMESTAMP | | Approval timestamp |
| rejection_reason | TEXT | | Reason if rejected |
| return_reason | TEXT | | Reason if returned for revision |
| estimated_review_time | INTEGER | | Estimated review hours |
| actual_review_time | INTEGER | | Actual review hours taken |

**Indexes:**
- `idx_submissions_inspection` (inspection_id)
- `idx_submissions_submitted_by` (submitted_by)
- `idx_submissions_recipient` (recipient_id)
- `idx_submissions_status` (submission_status)
- `idx_submissions_submitted_at` (submitted_at)

**Constraints:**
- `chk_recipient_type`: CHECK recipient_type IN ('supervisor', 'reviewer', 'auto')
- `chk_priority`: CHECK priority IN ('normal', 'high', 'urgent')
- `chk_submission_status`: CHECK submission_status IN ('pending', 'acknowledged', 'under_review', 'approved', 'rejected', 'returned')

---

## Table 9: generated_reports

**Purpose:** Stores generated inspection reports with metadata and file references.

**Why it exists:** Inspections culminate in formal reports. This table stores report metadata, file references, and generation details.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique report identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL, UNIQUE | Reference to inspection |
| report_type | VARCHAR(20) | NOT NULL | Type: inspection, violation, summary |
| template_id | UUID | FOREIGN KEY | Report template used |
| file_name | VARCHAR(255) | NOT NULL | Generated file name |
| file_path | VARCHAR(500) | NOT NULL | Storage path/URL |
| file_format | VARCHAR(20) | NOT NULL | Format: pdf, html, docx |
| file_size | BIGINT | | File size in bytes |
| report_data | JSONB | | Structured report data |
| compliance_score | INTEGER | CHECK (0-100) | Overall compliance score |
| violation_count | INTEGER | | Number of violations |
| recommendation_count | INTEGER | | Number of recommendations |
| generated_by | UUID | FOREIGN KEY | User/system that generated report |
| generated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Generation timestamp |
| version | INTEGER | DEFAULT 1 | Report version |

**Indexes:**
- `idx_reports_inspection` (inspection_id)
- `idx_reports_type` (report_type)
- `idx_reports_generated_at` (generated_at)

**Constraints:**
- `chk_report_type`: CHECK report_type IN ('inspection', 'violation', 'summary')
- `chk_file_format`: CHECK file_format IN ('pdf', 'html', 'docx')
- `chk_compliance_score`: CHECK compliance_score BETWEEN 0 AND 100

---

## Table 10: sync_conflicts

**Purpose:** Stores and tracks data conflicts that occur during offline synchronization.

**Why it exists:** Offline work can create conflicts when syncing. This table manages conflict resolution with diff tracking.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique conflict identifier |
| inspection_id | UUID | FOREIGN KEY | Reference to inspection |
| entity_type | VARCHAR(50) | NOT NULL | Type of entity with conflict |
| entity_id | UUID | NOT NULL | Entity identifier |
| conflict_type | VARCHAR(20) | NOT NULL | Type: update_update, create_create, delete_update |
| server_version | JSONB | NOT NULL | Server entity state |
| local_version | JSONB | NOT NULL | Local entity state |
| conflict_details | JSONB | | Detailed diff of conflicts |
| resolution_status | VARCHAR(20) | NOT NULL, DEFAULT 'pending' | Status: pending, resolved_server, resolved_local, resolved_merge |
| resolved_by | UUID | FOREIGN KEY | User who resolved conflict |
| resolution_action | TEXT | | Description of resolution |
| resolved_at | TIMESTAMP | | Resolution timestamp |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Conflict detection timestamp |

**Indexes:**
- `idx_conflicts_inspection` (inspection_id)
- `idx_conflicts_entity` (entity_type, entity_id)
- `idx_conflicts_status` (resolution_status)

**Constraints:**
- `chk_conflict_type`: CHECK conflict_type IN ('update_update', 'create_create', 'delete_update')
- `chk_resolution_status`: CHECK resolution_status IN ('pending', 'resolved_server', 'resolved_local', 'resolved_merge')

---

## Table 11: audit_logs

**Purpose:** Comprehensive audit logging for all inspection actions for compliance and accountability.

**Why it exists:** Government regulations require complete audit trails. This table logs every action for compliance, security, and accountability.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique audit log identifier |
| inspection_id | UUID | FOREIGN KEY | Reference to inspection (null for system events) |
| user_id | UUID | FOREIGN KEY | User who performed action |
| action_type | VARCHAR(50) | NOT NULL | Type of action performed |
| entity_type | VARCHAR(50) | | Type of entity affected |
| entity_id | UUID | | Identifier of affected entity |
| action_description | TEXT | | Human-readable description |
| old_value | JSONB | | Previous state (for updates) |
| new_value | JSONB | | New state (for updates/creates) |
| ip_address | INET | | IP address of requester |
| user_agent | VARCHAR(500) | | Client user agent |
| session_id | UUID | | Session identifier |
| request_id | VARCHAR(100) | | Request identifier for tracing |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Action timestamp |

**Indexes:**
- `idx_audit_inspection` (inspection_id)
- `idx_audit_user` (user_id)
- `idx_audit_action` (action_type)
- `idx_audit_entity` (entity_type, entity_id)
- `idx_audit_created_at` (created_at)

**Constraints:** None (flexible logging)

---

## Table 12: checklist_templates

**Purpose:** Stores checklist templates for different inspection types and domains.

**Why it exists:** Different inspection types require different checklists. This table defines reusable templates that instantiate for specific inspections.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique template identifier |
| name | VARCHAR(255) | NOT NULL | Template name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Template code |
| inspection_type_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection type |
| domain | VARCHAR(50) | NOT NULL | Domain: food_safety, fire_safety, health, factory |
| version | INTEGER | NOT NULL, DEFAULT 1 | Template version |
| description | TEXT | | Template description |
| total_items | INTEGER | DEFAULT 0 | Total checklist items |
| estimated_duration | INTEGER | | Estimated duration in minutes |
| is_active | BOOLEAN | DEFAULT TRUE | Whether template is active |
| effective_from | TIMESTAMP | NOT NULL | When template becomes effective |
| effective_to | TIMESTAMP | | When template expires |
| created_by | UUID | FOREIGN KEY | User who created template |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_templates_inspection_type` (inspection_type_id)
- `idx_templates_domain` (domain)
- `idx_templates_code` (code)
- `idx_templates_active` (is_active)

**Constraints:**
- `chk_domain`: CHECK domain IN ('food_safety', 'fire_safety', 'health', 'factory', 'pollution', 'construction')

---

## Table 13: checklist_sections

**Purpose:** Defines sections within checklist templates for organization.

**Why it exists:** Large checklists are organized into sections for better usability. This table defines those sections.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique section identifier |
| template_id | UUID | FOREIGN KEY, NOT NULL | Reference to checklist template |
| name | VARCHAR(255) | NOT NULL | Section name |
| code | VARCHAR(50) | NOT NULL | Section code |
| description | TEXT | | Section description |
| display_order | INTEGER | NOT NULL | Display order within template |
| is_required | BOOLEAN | DEFAULT TRUE | Whether section is required |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |

**Indexes:**
- `idx_sections_template` (template_id)
- `idx_sections_order` (template_id, display_order)

---

## Table 14: checklist_items

**Purpose:** Defines individual checklist items within sections.

**Why it exists:** Checklists consist of specific items to be inspected. This table defines those items with their properties.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique item identifier |
| section_id | UUID | FOREIGN KEY, NOT NULL | Reference to section |
| template_id | UUID | FOREIGN KEY, NOT NULL | Reference to template |
| question_text | TEXT | NOT NULL | The question or requirement |
| item_code | VARCHAR(50) | NOT NULL | Item code |
| response_type | VARCHAR(20) | NOT NULL | Type: yes_no, text, number, dropdown, date, multiple_choice |
| is_required | BOOLEAN | DEFAULT TRUE | Whether item is required |
| requires_evidence | BOOLEAN | DEFAULT FALSE | Whether item requires evidence |
| evidence_types | TEXT[] | | Allowed evidence types |
| regulatory_reference | VARCHAR(255) | | Applicable regulation citation |
| guidance_text | TEXT | | Additional guidance for inspectors |
| default_value | TEXT | | Default response value |
| options | JSONB | | Options for dropdown/multiple_choice |
| display_order | INTEGER | NOT NULL | Display order within section |
| severity_on_failure | VARCHAR(20) | | Severity if failed: critical, major, minor |
| is_active | BOOLEAN | DEFAULT TRUE | Whether item is active |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_items_section` (section_id)
- `idx_items_template` (template_id)
- `idx_items_order` (section_id, display_order)
- `idx_items_code` (item_code)

**Constraints:**
- `chk_response_type`: CHECK response_type IN ('yes_no', 'text', 'number', 'dropdown', 'date', 'multiple_choice')
- `chk_severity`: CHECK severity_on_failure IN ('critical', 'major', 'minor')

---

## Table 15: inspection_attachments

**Purpose:** Stores additional attachments not classified as evidence (supporting documents, reference materials).

**Why it exists:** Some attachments are supporting documents rather than evidence. This table handles those separately.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique attachment identifier |
| inspection_id | UUID | FOREIGN KEY, NOT NULL | Reference to inspection |
| attachment_type | VARCHAR(20) | NOT NULL | Type: supporting_document, reference, correspondence |
| file_name | VARCHAR(255) | NOT NULL | Original file name |
| file_path | VARCHAR(500) | NOT NULL | Storage path/URL |
| file_size | BIGINT | NOT NULL | File size in bytes |
| file_mime_type | VARCHAR(100) | NOT NULL | MIME type |
| description | TEXT | | Attachment description |
| uploaded_by | UUID | FOREIGN KEY | User who uploaded |
| uploaded_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Upload timestamp |

**Indexes:**
- `idx_attachments_inspection` (inspection_id)
- `idx_attachments_type` (attachment_type)

**Constraints:**
- `chk_attachment_type`: CHECK attachment_type IN ('supporting_document', 'reference', 'correspondence')

---

## Complete SQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create inspections table
CREATE TABLE inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspector_id UUID NOT NULL,
    site_id UUID NOT NULL,
    inspection_type_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'in_progress', 'evidence_collection', 'review', 'submitted', 'under_review', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_date TIMESTAMP NOT NULL,
    scheduled_end_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    location_accuracy DECIMAL(5,2),
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    violation_count INTEGER DEFAULT 0,
    total_checklist_items INTEGER DEFAULT 0,
    completed_checklist_items INTEGER DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER DEFAULT 1,
    CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

-- Create inspection_checklists table
CREATE TABLE inspection_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    checklist_template_id UUID NOT NULL,
    section_id UUID,
    item_id UUID NOT NULL,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('yes_no', 'text', 'number', 'dropdown', 'date', 'multiple_choice')),
    response_value TEXT,
    response_text TEXT,
    is_compliant BOOLEAN,
    requires_evidence BOOLEAN DEFAULT FALSE,
    evidence_attached BOOLEAN DEFAULT FALSE,
    notes TEXT,
    regulatory_reference VARCHAR(255),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create evidence table
CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    checklist_response_id UUID,
    evidence_type VARCHAR(20) NOT NULL CHECK (evidence_type IN ('photo', 'document', 'audio', 'video')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),
    capture_timestamp TIMESTAMP,
    capture_location_lat DECIMAL(10,8),
    capture_location_lng DECIMAL(11,8),
    capture_location_accuracy DECIMAL(5,2),
    device_id VARCHAR(100),
    description TEXT,
    tags TEXT[],
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'flagged', 'disputed')),
    verification_confidence DECIMAL(5,2) CHECK (verification_confidence BETWEEN 0 AND 100),
    verification_notes TEXT,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create inspection_notes table
CREATE TABLE inspection_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    checklist_response_id UUID,
    note_type VARCHAR(20) NOT NULL CHECK (note_type IN ('observation', 'violation', 'general', 'follow_up', 'clarification')),
    content TEXT NOT NULL,
    is_voice_note BOOLEAN DEFAULT FALSE,
    audio_file_path VARCHAR(500),
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    requires_action BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID
);

-- Create inspection_state_history table
CREATE TABLE inspection_state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    from_state VARCHAR(50),
    to_state VARCHAR(50) NOT NULL CHECK (to_state IN ('draft', 'in_progress', 'evidence_collection', 'review', 'submitted', 'under_review', 'completed', 'cancelled')),
    transition_reason TEXT,
    transition_metadata JSONB,
    changed_by UUID,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    ip_address INET,
    user_agent VARCHAR(500)
);

-- Create inspection_offline_queue table
CREATE TABLE inspection_offline_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'sync')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    payload JSONB NOT NULL,
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sync_started_at TIMESTAMP,
    sync_completed_at TIMESTAMP
);

-- Create inspection_location_log table
CREATE TABLE inspection_location_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(5,2),
    altitude DECIMAL(10,2),
    speed DECIMAL(5,2),
    heading DECIMAL(5,2),
    location_source VARCHAR(20) NOT NULL CHECK (location_source IN ('gps', 'network', 'passive')),
    is_at_site BOOLEAN DEFAULT FALSE,
    distance_from_site DECIMAL(10,2),
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    device_id VARCHAR(100)
);

-- Create submissions table
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL UNIQUE,
    submitted_by UUID NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    recipient_id UUID,
    recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('supervisor', 'reviewer', 'auto')),
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('normal', 'high', 'urgent')),
    submission_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (submission_status IN ('pending', 'acknowledged', 'under_review', 'approved', 'rejected', 'returned')),
    report_id UUID,
    inspector_comments TEXT,
    reviewer_comments TEXT,
    acknowledged_at TIMESTAMP,
    review_started_at TIMESTAMP,
    review_completed_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    return_reason TEXT,
    estimated_review_time INTEGER,
    actual_review_time INTEGER
);

-- Create generated_reports table
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL UNIQUE,
    report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('inspection', 'violation', 'summary')),
    template_id UUID,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_format VARCHAR(20) NOT NULL CHECK (file_format IN ('pdf', 'html', 'docx')),
    file_size BIGINT,
    report_data JSONB,
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    violation_count INTEGER,
    recommendation_count INTEGER,
    generated_by UUID,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER DEFAULT 1
);

-- Create sync_conflicts table
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('update_update', 'create_create', 'delete_update')),
    server_version JSONB NOT NULL,
    local_version JSONB NOT NULL,
    conflict_details JSONB,
    resolution_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved_server', 'resolved_local', 'resolved_merge')),
    resolved_by UUID,
    resolution_action TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID,
    user_id UUID,
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    action_description TEXT,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent VARCHAR(500),
    session_id UUID,
    request_id VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create checklist_templates table
CREATE TABLE checklist_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    inspection_type_id UUID NOT NULL,
    domain VARCHAR(50) NOT NULL CHECK (domain IN ('food_safety', 'fire_safety', 'health', 'factory', 'pollution', 'construction')),
    version INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    total_items INTEGER DEFAULT 0,
    estimated_duration INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create checklist_sections table
CREATE TABLE checklist_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create checklist_items table
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL,
    template_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    response_type VARCHAR(20) NOT NULL CHECK (response_type IN ('yes_no', 'text', 'number', 'dropdown', 'date', 'multiple_choice')),
    is_required BOOLEAN DEFAULT TRUE,
    requires_evidence BOOLEAN DEFAULT FALSE,
    evidence_types TEXT[],
    regulatory_reference VARCHAR(255),
    guidance_text TEXT,
    default_value TEXT,
    options JSONB,
    display_order INTEGER NOT NULL,
    severity_on_failure VARCHAR(20) CHECK (severity_on_failure IN ('critical', 'major', 'minor')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create inspection_attachments table
CREATE TABLE inspection_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID NOT NULL,
    attachment_type VARCHAR(20) NOT NULL CHECK (attachment_type IN ('supporting_document', 'reference', 'correspondence')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    uploaded_by UUID,
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for inspections
CREATE INDEX idx_inspections_inspector_status ON inspections(inspector_id, status);
CREATE INDEX idx_inspections_site_status ON inspections(site_id, status);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_inspections_priority_status ON inspections(priority, status);

-- Create indexes for inspection_checklists
CREATE INDEX idx_checklists_inspection ON inspection_checklists(inspection_id);
CREATE INDEX idx_checklists_template ON inspection_checklists(checklist_template_id);
CREATE INDEX idx_checklists_section ON inspection_checklists(section_id);
CREATE INDEX idx_checklists_item ON inspection_checklists(item_id);
CREATE INDEX idx_checklists_compliance ON inspection_checklists(is_compliant);

-- Create indexes for evidence
CREATE INDEX idx_evidence_inspection ON evidence(inspection_id);
CREATE INDEX idx_evidence_checklist_response ON evidence(checklist_response_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);
CREATE INDEX idx_evidence_verification ON evidence(verification_status);
CREATE INDEX idx_evidence_hash ON evidence(file_hash);

-- Create indexes for inspection_notes
CREATE INDEX idx_notes_inspection ON inspection_notes(inspection_id);
CREATE INDEX idx_notes_checklist_response ON inspection_notes(checklist_response_id);
CREATE INDEX idx_notes_type ON inspection_notes(note_type);
CREATE INDEX idx_notes_severity ON inspection_notes(severity);
CREATE INDEX idx_notes_created_at ON inspection_notes(created_at);

-- Create indexes for inspection_state_history
CREATE INDEX idx_state_history_inspection ON inspection_state_history(inspection_id);
CREATE INDEX idx_state_history_to_state ON inspection_state_history(to_state);
CREATE INDEX idx_state_history_changed_at ON inspection_state_history(changed_at);

-- Create indexes for inspection_offline_queue
CREATE INDEX idx_offline_queue_inspection ON inspection_offline_queue(inspection_id);
CREATE INDEX idx_offline_queue_status ON inspection_offline_queue(sync_status);
CREATE INDEX idx_offline_queue_action ON inspection_offline_queue(action_type);
CREATE INDEX idx_offline_queue_created_at ON inspection_offline_queue(created_at);

-- Create indexes for inspection_location_log
CREATE INDEX idx_location_log_inspection ON inspection_location_log(inspection_id);
CREATE INDEX idx_location_log_recorded_at ON inspection_location_log(recorded_at);
CREATE INDEX idx_location_log_at_site ON inspection_location_log(is_at_site);

-- Create indexes for submissions
CREATE INDEX idx_submissions_inspection ON submissions(inspection_id);
CREATE INDEX idx_submissions_submitted_by ON submissions(submitted_by);
CREATE INDEX idx_submissions_recipient ON submissions(recipient_id);
CREATE INDEX idx_submissions_status ON submissions(submission_status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Create indexes for generated_reports
CREATE INDEX idx_reports_inspection ON generated_reports(inspection_id);
CREATE INDEX idx_reports_type ON generated_reports(report_type);
CREATE INDEX idx_reports_generated_at ON generated_reports(generated_at);

-- Create indexes for sync_conflicts
CREATE INDEX idx_conflicts_inspection ON sync_conflicts(inspection_id);
CREATE INDEX idx_conflicts_entity ON sync_conflicts(entity_type, entity_id);
CREATE INDEX idx_conflicts_status ON sync_conflicts(resolution_status);

-- Create indexes for audit_logs
CREATE INDEX idx_audit_inspection ON audit_logs(inspection_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);

-- Create indexes for checklist_templates
CREATE INDEX idx_templates_inspection_type ON checklist_templates(inspection_type_id);
CREATE INDEX idx_templates_domain ON checklist_templates(domain);
CREATE INDEX idx_templates_code ON checklist_templates(code);
CREATE INDEX idx_templates_active ON checklist_templates(is_active);

-- Create indexes for checklist_sections
CREATE INDEX idx_sections_template ON checklist_sections(template_id);
CREATE INDEX idx_sections_order ON checklist_sections(template_id, display_order);

-- Create indexes for checklist_items
CREATE INDEX idx_items_section ON checklist_items(section_id);
CREATE INDEX idx_items_template ON checklist_items(template_id);
CREATE INDEX idx_items_order ON checklist_items(section_id, display_order);
CREATE INDEX idx_items_code ON checklist_items(item_code);

-- Create indexes for inspection_attachments
CREATE INDEX idx_attachments_inspection ON inspection_attachments(inspection_id);
CREATE INDEX idx_attachments_type ON inspection_attachments(attachment_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_inspections_updated_at BEFORE UPDATE ON inspections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_checklists_updated_at BEFORE UPDATE ON inspection_checklists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_notes_updated_at BEFORE UPDATE ON inspection_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_templates_updated_at BEFORE UPDATE ON checklist_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_items_updated_at BEFORE UPDATE ON checklist_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Summary

**Total Tables:** 15

**Table Categories:**
- Core Inspection: inspections, inspection_checklists, inspection_notes, inspection_state_history
- Evidence & Attachments: evidence, inspection_attachments
- Offline & Sync: inspection_offline_queue, sync_conflicts, inspection_location_log
- Submission & Reporting: submissions, generated_reports
- Checklist Management: checklist_templates, checklist_sections, checklist_items
- Compliance: audit_logs

**Key Design Features:**
- UUID primary keys for distributed system compatibility
- Comprehensive indexes for query performance
- CHECK constraints for data integrity
- JSONB fields for flexible metadata storage
- Automatic updated_at triggers
- Foreign key relationships to AI Engine and Supervisor Dashboard modules
- Full audit trail support for government compliance requirements
- Offline-first architecture support with sync queue and conflict resolution
