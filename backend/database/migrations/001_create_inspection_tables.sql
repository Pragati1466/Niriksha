-- ============================================================================
-- NIRIKSHA - Inspection Workflow & Data Collection Module
-- Database Migration: 001_create_inspection_tables
-- Description: Creates all tables required for the inspection workflow module
-- Author: NIRIKSHA Development Team
-- Date: 2026-07-10
-- Version: 1.0.0
-- ============================================================================

-- Enable UUID extension for generating UUID primary keys
-- This extension provides functions to generate universally unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE INSPECTION TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: inspections
-- Purpose: Core table storing all inspection records with lifecycle state, 
--          scheduling, and location data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspections (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys (references to other modules)
    inspector_id UUID NOT NULL,              -- Reference to user management module
    site_id UUID NOT NULL,                   -- Reference to site management module
    inspection_type_id UUID NOT NULL,         -- Reference to inspection type catalog
    
    -- Inspection Status and Priority
    status VARCHAR(50) NOT NULL 
        CHECK (status IN (
            'draft', 
            'in_progress', 
            'evidence_collection', 
            'review', 
            'submitted', 
            'under_review', 
            'completed', 
            'cancelled'
        )),
    priority VARCHAR(20) NOT NULL 
        CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Scheduling Information
    scheduled_date TIMESTAMP NOT NULL,
    scheduled_end_date TIMESTAMP,
    
    -- Execution Timing
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Location Data (Check-in)
    location_lat DECIMAL(10,8),              -- Latitude with 8 decimal places (~1mm precision)
    location_lng DECIMAL(11,8),              -- Longitude with 8 decimal places (~1mm precision)
    location_accuracy DECIMAL(5,2),          -- GPS accuracy in meters
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    
    -- Compliance Metrics
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    violation_count INTEGER DEFAULT 0,
    total_checklist_items INTEGER DEFAULT 0,
    completed_checklist_items INTEGER DEFAULT 0,
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version INTEGER DEFAULT 1,                -- Optimistic locking version
    
    -- Constraints
    CONSTRAINT chk_inspection_dates 
        CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at)
);

-- Create indexes for inspections table
-- These indexes optimize common query patterns
CREATE INDEX idx_inspections_inspector_status ON inspections(inspector_id, status);
CREATE INDEX idx_inspections_site_status ON inspections(site_id, status);
CREATE INDEX idx_inspections_scheduled_date ON inspections(scheduled_date);
CREATE INDEX idx_inspections_priority_status ON inspections(priority, status);
CREATE INDEX idx_inspections_type ON inspections(inspection_type_id);

-- ----------------------------------------------------------------------------
-- Table: inspection_checklists
-- Purpose: Stores checklist responses for each inspection, linking checklist 
--          templates to actual inspection data
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_checklists (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL,
    checklist_template_id UUID NOT NULL,
    section_id UUID,                          -- Optional: for section-level tracking
    item_id UUID NOT NULL,                    -- Reference to checklist item definition
    
    -- Response Data
    response_type VARCHAR(20) NOT NULL 
        CHECK (response_type IN (
            'yes_no', 
            'text', 
            'number', 
            'dropdown', 
            'date', 
            'multiple_choice'
        )),
    response_value TEXT,                      -- The actual response value
    response_text TEXT,                        -- Textual response for text/number types
    is_compliant BOOLEAN,                     -- Whether response indicates compliance
    
    -- Evidence Requirements
    requires_evidence BOOLEAN DEFAULT FALSE,
    evidence_attached BOOLEAN DEFAULT FALSE,
    
    -- Additional Information
    notes TEXT,                               -- Inspector notes for this item
    regulatory_reference VARCHAR(255),       -- Citation of applicable regulation
    severity VARCHAR(20) 
        CHECK (severity IN ('critical', 'major', 'minor')),
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_checklists_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_checklists_template 
        FOREIGN KEY (checklist_template_id) REFERENCES checklist_templates(id),
    CONSTRAINT fk_checklists_section 
        FOREIGN KEY (section_id) REFERENCES checklist_sections(id),
    CONSTRAINT fk_checklists_item 
        FOREIGN KEY (item_id) REFERENCES checklist_items(id)
);

-- Create indexes for inspection_checklists table
CREATE INDEX idx_checklists_inspection ON inspection_checklists(inspection_id);
CREATE INDEX idx_checklists_template ON inspection_checklists(checklist_template_id);
CREATE INDEX idx_checklists_section ON inspection_checklists(section_id);
CREATE INDEX idx_checklists_item ON inspection_checklists(item_id);
CREATE INDEX idx_checklists_compliance ON inspection_checklists(is_compliant);

-- ----------------------------------------------------------------------------
-- Table: evidence
-- Purpose: Stores all evidence files (photos, documents) attached to inspections 
--          with metadata and AI verification status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL,
    checklist_response_id UUID,               -- Optional: link to specific checklist response
    
    -- File Information
    evidence_type VARCHAR(20) NOT NULL 
        CHECK (evidence_type IN ('photo', 'document', 'audio', 'video')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,          -- Storage path or URL
    file_size BIGINT NOT NULL,                -- File size in bytes
    file_mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),                   -- SHA-256 hash for integrity verification
    
    -- Capture Metadata
    capture_timestamp TIMESTAMP,
    capture_location_lat DECIMAL(10,8),
    capture_location_lng DECIMAL(11,8),
    capture_location_accuracy DECIMAL(5,2),
    device_id VARCHAR(100),                   -- Device that captured the evidence
    
    -- Additional Information
    description TEXT,
    tags TEXT[],                              -- Array of searchable tags
    
    -- AI Verification Status
    verification_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (verification_status IN ('pending', 'verified', 'flagged', 'disputed')),
    verification_confidence DECIMAL(5,2) CHECK (verification_confidence BETWEEN 0 AND 100),
    verification_notes TEXT,                  -- AI verification findings
    
    -- Audit Fields
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_evidence_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_evidence_response 
        FOREIGN KEY (checklist_response_id) REFERENCES inspection_checklists(id) ON DELETE SET NULL
);

-- Create indexes for evidence table
CREATE INDEX idx_evidence_inspection ON evidence(inspection_id);
CREATE INDEX idx_evidence_checklist_response ON evidence(checklist_response_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);
CREATE INDEX idx_evidence_verification ON evidence(verification_status);
CREATE INDEX idx_evidence_hash ON evidence(file_hash);
CREATE INDEX idx_evidence_uploaded_at ON evidence(uploaded_at);

-- ----------------------------------------------------------------------------
-- Table: inspection_notes
-- Purpose: Stores text notes, observations, and contextual information added 
--          during inspections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_notes (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL,
    checklist_response_id UUID,               -- Optional: link to specific checklist response
    created_by UUID,                          -- Inspector who created the note
    
    -- Note Content
    note_type VARCHAR(20) NOT NULL 
        CHECK (note_type IN (
            'observation', 
            'violation', 
            'general', 
            'follow_up', 
            'clarification'
        )),
    content TEXT NOT NULL,
    
    -- Voice Note Support
    is_voice_note BOOLEAN DEFAULT FALSE,
    audio_file_path VARCHAR(500),             -- Path to original audio file
    
    -- Severity and Action Tracking
    severity VARCHAR(20) CHECK (severity IN ('critical', 'major', 'minor')),
    requires_action BOOLEAN DEFAULT FALSE,
    action_taken TEXT,                        -- Description of action taken
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_notes_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_notes_response 
        FOREIGN KEY (checklist_response_id) REFERENCES inspection_checklists(id) ON DELETE SET NULL,
    CONSTRAINT fk_notes_created_by 
        FOREIGN KEY (created_by) REFERENCES inspectors(id)
);

-- Create indexes for inspection_notes table
CREATE INDEX idx_notes_inspection ON inspection_notes(inspection_id);
CREATE INDEX idx_notes_checklist_response ON inspection_notes(checklist_response_id);
CREATE INDEX idx_notes_type ON inspection_notes(note_type);
CREATE INDEX idx_notes_severity ON inspection_notes(severity);
CREATE INDEX idx_notes_created_at ON inspection_notes(created_at);
CREATE INDEX idx_notes_created_by ON inspection_notes(created_by);

-- ----------------------------------------------------------------------------
-- Table: inspection_state_history
-- Purpose: Tracks all state transitions for inspections for audit trail 
--          and compliance
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_state_history (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    inspection_id UUID NOT NULL,
    
    -- State Transition Data
    from_state VARCHAR(50),                   -- Previous state (NULL for initial state)
    to_state VARCHAR(50) NOT NULL 
        CHECK (to_state IN (
            'draft', 
            'in_progress', 
            'evidence_collection', 
            'review', 
            'submitted', 
            'under_review', 
            'completed', 
            'cancelled'
        )),
    transition_reason TEXT,
    transition_metadata JSONB,                -- Additional context for transition
    
    -- Who made the change
    changed_by UUID,                          -- User or system that initiated change
    changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Request Information
    ip_address INET,
    user_agent VARCHAR(500),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_state_history_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_state_history_changed_by 
        FOREIGN KEY (changed_by) REFERENCES inspectors(id)
);

-- Create indexes for inspection_state_history table
CREATE INDEX idx_state_history_inspection ON inspection_state_history(inspection_id);
CREATE INDEX idx_state_history_to_state ON inspection_state_history(to_state);
CREATE INDEX idx_state_history_changed_at ON inspection_state_history(changed_at);
CREATE INDEX idx_state_history_changed_by ON inspection_state_history(changed_by);

-- ============================================================================
-- OFFLINE & SYNC TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: inspection_offline_queue
-- Purpose: Queues inspection data changes for synchronization when 
--          connectivity is restored
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_offline_queue (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key (optional - null for new inspections)
    inspection_id UUID,
    
    -- Sync Operation Details
    action_type VARCHAR(20) NOT NULL 
        CHECK (action_type IN ('create', 'update', 'delete', 'sync')),
    entity_type VARCHAR(50) NOT NULL,         -- Type of entity: inspection, checklist, evidence, note
    entity_id UUID,                           -- Local entity identifier
    payload JSONB NOT NULL,                    -- Complete entity data for sync
    
    -- Sync Status
    sync_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (sync_status IN ('pending', 'in_progress', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    last_error TEXT,
    
    -- Timing
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sync_started_at TIMESTAMP,
    sync_completed_at TIMESTAMP,
    
    -- Foreign Key Constraints
    CONSTRAINT fk_offline_queue_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

-- Create indexes for inspection_offline_queue table
CREATE INDEX idx_offline_queue_inspection ON inspection_offline_queue(inspection_id);
CREATE INDEX idx_offline_queue_status ON inspection_offline_queue(sync_status);
CREATE INDEX idx_offline_queue_action ON inspection_offline_queue(action_type);
CREATE INDEX idx_offline_queue_created_at ON inspection_offline_queue(created_at);

-- ----------------------------------------------------------------------------
-- Table: inspection_location_log
-- Purpose: Tracks inspector location updates during inspections for route 
--          verification and safety
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_location_log (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    inspection_id UUID NOT NULL,
    
    -- GPS Data
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    accuracy DECIMAL(5,2),                    -- GPS accuracy in meters
    altitude DECIMAL(10,2),                   -- Altitude in meters
    speed DECIMAL(5,2),                      -- Speed in m/s
    heading DECIMAL(5,2),                     -- Heading in degrees
    
    -- Location Source
    location_source VARCHAR(20) NOT NULL 
        CHECK (location_source IN ('gps', 'network', 'passive')),
    
    -- Geofence Status
    is_at_site BOOLEAN DEFAULT FALSE,
    distance_from_site DECIMAL(10,2),         -- Distance from site in meters
    
    -- Device and Timing
    device_id VARCHAR(100),
    recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_location_log_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
);

-- Create indexes for inspection_location_log table
CREATE INDEX idx_location_log_inspection ON inspection_location_log(inspection_id);
CREATE INDEX idx_location_log_recorded_at ON inspection_location_log(recorded_at);
CREATE INDEX idx_location_log_at_site ON inspection_location_log(is_at_site);

-- ============================================================================
-- SUBMISSION & REPORTING TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: submissions
-- Purpose: Tracks inspection report submissions to supervisors with metadata 
--          and status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS submissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL UNIQUE,       -- One submission per inspection
    submitted_by UUID NOT NULL,
    recipient_id UUID,                         -- Supervisor/recipient ID
    report_id UUID,                           -- Reference to generated report
    
    -- Submission Details
    recipient_type VARCHAR(20) NOT NULL 
        CHECK (recipient_type IN ('supervisor', 'reviewer', 'auto')),
    priority VARCHAR(20) NOT NULL 
        CHECK (priority IN ('normal', 'high', 'urgent')),
    submission_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (submission_status IN (
            'pending', 
            'acknowledged', 
            'under_review', 
            'approved', 
            'rejected', 
            'returned'
        )),
    
    -- Comments
    inspector_comments TEXT,
    reviewer_comments TEXT,
    
    -- Review Timeline
    acknowledged_at TIMESTAMP,
    review_started_at TIMESTAMP,
    review_completed_at TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP,
    
    -- Rejection/Return Reasons
    rejection_reason TEXT,
    return_reason TEXT,
    
    -- Time Tracking
    estimated_review_time INTEGER,            -- Estimated review hours
    actual_review_time INTEGER,               -- Actual review hours taken
    
    -- Submission Timestamp
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_submissions_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_submissions_submitted_by 
        FOREIGN KEY (submitted_by) REFERENCES inspectors(id),
    CONSTRAINT fk_submissions_recipient 
        FOREIGN KEY (recipient_id) REFERENCES inspectors(id),
    CONSTRAINT fk_submissions_report 
        FOREIGN KEY (report_id) REFERENCES generated_reports(id),
    CONSTRAINT fk_submissions_approved_by 
        FOREIGN KEY (approved_by) REFERENCES inspectors(id)
);

-- Create indexes for submissions table
CREATE INDEX idx_submissions_inspection ON submissions(inspection_id);
CREATE INDEX idx_submissions_submitted_by ON submissions(submitted_by);
CREATE INDEX idx_submissions_recipient ON submissions(recipient_id);
CREATE INDEX idx_submissions_status ON submissions(submission_status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX idx_submissions_priority ON submissions(priority);

-- ----------------------------------------------------------------------------
-- Table: generated_reports
-- Purpose: Stores generated inspection reports with metadata and file references
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generated_reports (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL UNIQUE,       -- One report per inspection
    template_id UUID,                         -- Report template used
    generated_by UUID,                       -- User or system that generated report
    
    -- Report Information
    report_type VARCHAR(20) NOT NULL 
        CHECK (report_type IN ('inspection', 'violation', 'summary')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,          -- Storage path or URL
    file_format VARCHAR(20) NOT NULL 
        CHECK (file_format IN ('pdf', 'html', 'docx')),
    file_size BIGINT,
    
    -- Report Data
    report_data JSONB,                        -- Structured report data
    
    -- Metrics
    compliance_score INTEGER CHECK (compliance_score BETWEEN 0 AND 100),
    violation_count INTEGER,
    recommendation_count INTEGER,
    
    -- Version and Timing
    version INTEGER DEFAULT 1,
    generated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_reports_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_template 
        FOREIGN KEY (template_id) REFERENCES report_templates(id),
    CONSTRAINT fk_reports_generated_by 
        FOREIGN KEY (generated_by) REFERENCES inspectors(id)
);

-- Create indexes for generated_reports table
CREATE INDEX idx_reports_inspection ON generated_reports(inspection_id);
CREATE INDEX idx_reports_type ON generated_reports(report_type);
CREATE INDEX idx_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX idx_reports_template ON generated_reports(template_id);

-- ----------------------------------------------------------------------------
-- Table: sync_conflicts
-- Purpose: Stores and tracks data conflicts that occur during offline 
--          synchronization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sync_conflicts (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    inspection_id UUID,
    
    -- Conflict Details
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    conflict_type VARCHAR(20) NOT NULL 
        CHECK (conflict_type IN ('update_update', 'create_create', 'delete_update')),
    
    -- Version Data
    server_version JSONB NOT NULL,
    local_version JSONB NOT NULL,
    conflict_details JSONB,                    -- Detailed diff of conflicts
    
    -- Resolution
    resolution_status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (resolution_status IN ('pending', 'resolved_server', 'resolved_local', 'resolved_merge')),
    resolved_by UUID,
    resolution_action TEXT,
    resolved_at TIMESTAMP,
    
    -- Detection Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_conflicts_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_conflicts_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES inspectors(id)
);

-- Create indexes for sync_conflicts table
CREATE INDEX idx_conflicts_inspection ON sync_conflicts(inspection_id);
CREATE INDEX idx_conflicts_entity ON sync_conflicts(entity_type, entity_id);
CREATE INDEX idx_conflicts_status ON sync_conflicts(resolution_status);
CREATE INDEX idx_conflicts_created_at ON sync_conflicts(created_at);

-- ============================================================================
-- CHECKLIST MANAGEMENT TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: checklist_templates
-- Purpose: Stores checklist templates for different inspection types and domains
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_templates (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template Information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    inspection_type_id UUID NOT NULL,
    domain VARCHAR(50) NOT NULL 
        CHECK (domain IN (
            'food_safety', 
            'fire_safety', 
            'health', 
            'factory', 
            'pollution', 
            'construction'
        )),
    
    -- Version and Duration
    version INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    total_items INTEGER DEFAULT 0,
    estimated_duration INTEGER,                 -- Estimated duration in minutes
    
    -- Status and Effectiveness
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP,
    
    -- Audit Fields
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_templates_inspection_type 
        FOREIGN KEY (inspection_type_id) REFERENCES inspection_types(id),
    CONSTRAINT fk_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES inspectors(id)
);

-- Create indexes for checklist_templates table
CREATE INDEX idx_templates_inspection_type ON checklist_templates(inspection_type_id);
CREATE INDEX idx_templates_domain ON checklist_templates(domain);
CREATE INDEX idx_templates_code ON checklist_templates(code);
CREATE INDEX idx_templates_active ON checklist_templates(is_active);
CREATE INDEX idx_templates_effective ON checklist_templates(effective_from, effective_to);

-- ----------------------------------------------------------------------------
-- Table: checklist_sections
-- Purpose: Defines sections within checklist templates for organization
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_sections (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Key
    template_id UUID NOT NULL,
    
    -- Section Information
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    display_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_sections_template 
        FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
);

-- Create indexes for checklist_sections table
CREATE INDEX idx_sections_template ON checklist_sections(template_id);
CREATE INDEX idx_sections_order ON checklist_sections(template_id, display_order);

-- ----------------------------------------------------------------------------
-- Table: checklist_items
-- Purpose: Defines individual checklist items within sections
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS checklist_items (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    section_id UUID NOT NULL,
    template_id UUID NOT NULL,
    
    -- Item Information
    question_text TEXT NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    response_type VARCHAR(20) NOT NULL 
        CHECK (response_type IN (
            'yes_no', 
            'text', 
            'number', 
            'dropdown', 
            'date', 
            'multiple_choice'
        )),
    
    -- Requirements
    is_required BOOLEAN DEFAULT TRUE,
    requires_evidence BOOLEAN DEFAULT FALSE,
    evidence_types TEXT[],                     -- Allowed evidence types
    
    -- Regulatory Information
    regulatory_reference VARCHAR(255),       -- Applicable regulation citation
    guidance_text TEXT,                       -- Additional guidance for inspectors
    
    -- Default Values and Options
    default_value TEXT,
    options JSONB,                            -- Options for dropdown/multiple_choice
    
    -- Display and Severity
    display_order INTEGER NOT NULL,
    severity_on_failure VARCHAR(20) 
        CHECK (severity_on_failure IN ('critical', 'major', 'minor')),
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_items_section 
        FOREIGN KEY (section_id) REFERENCES checklist_sections(id) ON DELETE CASCADE,
    CONSTRAINT fk_items_template 
        FOREIGN KEY (template_id) REFERENCES checklist_templates(id) ON DELETE CASCADE
);

-- Create indexes for checklist_items table
CREATE INDEX idx_items_section ON checklist_items(section_id);
CREATE INDEX idx_items_template ON checklist_items(template_id);
CREATE INDEX idx_items_order ON checklist_items(section_id, display_order);
CREATE INDEX idx_items_code ON checklist_items(item_code);
CREATE INDEX idx_items_active ON checklist_items(is_active);

-- ============================================================================
-- ATTACHMENTS TABLE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: inspection_attachments
-- Purpose: Stores additional attachments not classified as evidence 
--          (supporting documents, reference materials)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inspection_attachments (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID NOT NULL,
    uploaded_by UUID,
    
    -- Attachment Information
    attachment_type VARCHAR(20) NOT NULL 
        CHECK (attachment_type IN ('supporting_document', 'reference', 'correspondence')),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_mime_type VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Upload Timestamp
    uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_attachments_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    CONSTRAINT fk_attachments_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES inspectors(id)
);

-- Create indexes for inspection_attachments table
CREATE INDEX idx_attachments_inspection ON inspection_attachments(inspection_id);
CREATE INDEX idx_attachments_type ON inspection_attachments(attachment_type);
CREATE INDEX idx_attachments_uploaded_at ON inspection_attachments(uploaded_at);

-- ============================================================================
-- AUDIT LOGGING TABLE
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: audit_logs
-- Purpose: Comprehensive audit logging for all inspection actions for 
--          compliance and accountability
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Foreign Keys
    inspection_id UUID,                       -- Null for system events
    user_id UUID,
    
    -- Action Information
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    action_description TEXT,
    
    -- State Changes
    old_value JSONB,                          -- Previous state (for updates)
    new_value JSONB,                          -- New state (for updates/creates)
    
    -- Request Information
    ip_address INET,
    user_agent VARCHAR(500),
    session_id UUID,
    request_id VARCHAR(100),                   -- Request identifier for tracing
    
    -- Audit Timestamp
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Foreign Key Constraints
    CONSTRAINT fk_audit_inspection 
        FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) REFERENCES inspectors(id) ON DELETE SET NULL
);

-- Create indexes for audit_logs table
CREATE INDEX idx_audit_inspection ON audit_logs(inspection_id);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action_type);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_request_id ON audit_logs(request_id);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically update the updated_at timestamp before row updates
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ----------------------------------------------------------------------------
-- Trigger: update_inspections_updated_at
-- Purpose: Apply updated_at trigger to inspections table
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_inspections_updated_at 
    BEFORE UPDATE ON inspections
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: update_inspection_checklists_updated_at
-- Purpose: Apply updated_at trigger to inspection_checklists table
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_inspection_checklists_updated_at 
    BEFORE UPDATE ON inspection_checklists
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: update_inspection_notes_updated_at
-- Purpose: Apply updated_at trigger to inspection_notes table
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_inspection_notes_updated_at 
    BEFORE UPDATE ON inspection_notes
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: update_checklist_templates_updated_at
-- Purpose: Apply updated_at trigger to checklist_templates table
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_checklist_templates_updated_at 
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- Trigger: update_checklist_items_updated_at
-- Purpose: Apply updated_at trigger to checklist_items table
-- ----------------------------------------------------------------------------
CREATE TRIGGER update_checklist_items_updated_at 
    BEFORE UPDATE ON checklist_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- This migration creates all tables required for the Inspection Workflow 
-- & Data Collection Module. The schema is designed for:
-- - Government-scale deployments
-- - Full audit trail compliance
-- - Offline-first architecture support
-- - AI integration capabilities
-- - Multi-tenant readiness
-- ============================================================================
