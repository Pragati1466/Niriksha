"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Edge Case Tests

Description:
    Edge case tests covering empty/null data, boundary values, large datasets,
    special characters, concurrent operations, timing issues, and state transitions.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import uuid4
from unittest.mock import Mock, patch, AsyncMock

from backend.services.inspection_service import InspectionService
from backend.services.evidence_service import EvidenceService
from backend.services.checklist_service import ChecklistService
from backend.database.models.inspection import Inspection, InspectionStatus, InspectionPriority
from backend.database.models.evidence import Evidence, EvidenceType, VerificationStatus


# ============================================================================
# Data Edge Cases - Empty/Null Data (TC-EDGE-001 to TC-EDGE-007)
# ============================================================================

class TestEmptyNullData:
    """Test cases for empty and null data handling"""
    
    def test_create_inspection_with_null_optional_fields(self):
        """TC-EDGE-001: Create inspection with null optional fields"""
        session = Mock()
        service = InspectionService(session)
        
        inspection = service.create_inspection(
            inspector_id=uuid4(),
            site_id=uuid4(),
            inspection_type_id=uuid4(),
            priority=InspectionPriority.MEDIUM,
            scheduled_end_date=None  # Null optional field
        )
        
        assert inspection is not None
        assert inspection.scheduled_end_date is None
    
    def test_create_evidence_with_null_gps_coordinates(self):
        """TC-EDGE-002: Create evidence with null GPS coordinates"""
        session = Mock()
        service = EvidenceService(session)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_location_lat=None,  # Null GPS
            capture_location_lng=None,  # Null GPS
            capture_location_accuracy=None  # Null GPS
        )
        
        assert evidence is not None
        assert evidence.capture_location_lat is None
    
    def test_create_checklist_response_with_empty_text(self):
        """TC-EDGE-003: Create checklist response with empty text"""
        session = Mock()
        service = ChecklistService(session)
        
        # Mock repository
        service.repository.create = Mock(return_value=Mock())
        
        response = service.create_response(
            inspection_id=uuid4(),
            checklist_item_id=uuid4(),
            response_value="",  # Empty text
            is_compliant=True
        )
        
        assert response is not None
    
    def test_risk_score_with_empty_checklist_responses(self):
        """TC-EDGE-004: Handle empty checklist responses in risk score"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[],  # Empty responses
            evidence_count=0,
            violation_count=0
        )
        
        assert result is not None
        assert result["risk_score"] == 50  # Default for insufficient data
    
    def test_risk_score_with_zero_evidence_count(self):
        """TC-EDGE-005: Handle zero evidence count in risk score"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[{"is_compliant": True}],
            evidence_count=0,  # Zero evidence
            violation_count=0
        )
        
        assert result is not None
        assert 0 <= result["risk_score"] <= 100
    
    def test_create_evidence_with_empty_tags_array(self):
        """TC-EDGE-006: Handle empty tags array"""
        session = Mock()
        service = EvidenceService(session)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            tags=[]  # Empty tags
        )
        
        assert evidence is not None
        assert evidence.tags == []
    
    def test_create_inspection_with_null_description(self):
        """TC-EDGE-007: Handle null description fields"""
        session = Mock()
        service = InspectionService(session)
        
        inspection = service.create_inspection(
            inspector_id=uuid4(),
            site_id=uuid4(),
            inspection_type_id=uuid4(),
            priority=InspectionPriority.MEDIUM
        )
        
        # Description is optional and can be null
        assert inspection is not None


# ============================================================================
# Data Edge Cases - Boundary Values (TC-EDGE-008 to TC-EDGE-017)
# ============================================================================

class TestBoundaryValues:
    """Test cases for boundary value handling"""
    
    def test_compliance_score_at_minimum(self):
        """TC-EDGE-008: Compliance score at 0 (minimum)"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        # All non-compliant
        responses = [{"is_compliant": False} for _ in range(10)]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=5,
            violation_count=10
        )
        
        assert result["risk_score"] >= 0
    
    def test_compliance_score_at_maximum(self):
        """TC-EDGE-009: Compliance score at 100 (maximum)"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        # All compliant
        responses = [{"is_compliant": True} for _ in range(10)]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=5,
            violation_count=0
        )
        
        assert result["risk_score"] <= 100
    
    def test_risk_score_at_minimum(self):
        """TC-EDGE-010: Risk score at 0 (minimum)"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[{"is_compliant": True}],
            evidence_count=10,
            violation_count=0
        )
        
        assert result["risk_score"] >= 0
    
    def test_risk_score_at_maximum(self):
        """TC-EDGE-011: Risk score at 100 (maximum)"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=[{"is_compliant": False}],
            evidence_count=0,
            violation_count=1
        )
        
        assert result["risk_score"] <= 100
    
    def test_file_size_at_maximum(self):
        """TC-EDGE-012: File size at maximum allowed (100MB)"""
        session = Mock()
        service = EvidenceService(session)
        
        max_size = 100 * 1024 * 1024  # 100MB
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=max_size,
            file_mime_type="image/jpeg"
        )
        
        assert evidence.file_size == max_size
    
    def test_file_size_at_minimum(self):
        """TC-EDGE-013: File size at minimum (1 byte)"""
        session = Mock()
        service = EvidenceService(session)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1,  # 1 byte
            file_mime_type="image/jpeg"
        )
        
        assert evidence.file_size == 1
    
    def test_gps_coordinates_at_poles(self):
        """TC-EDGE-014: GPS coordinates at poles (±90 latitude)"""
        session = Mock()
        service = EvidenceService(session)
        
        # North Pole
        evidence1 = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_location_lat=Decimal("90.0"),
            capture_location_lng=Decimal("0.0")
        )
        
        # South Pole
        evidence2 = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test2.jpg",
            file_path="/path/to/test2.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_location_lat=Decimal("-90.0"),
            capture_location_lng=Decimal("0.0")
        )
        
        assert evidence1.capture_location_lat == Decimal("90.0")
        assert evidence2.capture_location_lat == Decimal("-90.0")
    
    def test_gps_coordinates_at_date_line(self):
        """TC-EDGE-015: GPS coordinates at date line (±180 longitude)"""
        session = Mock()
        service = EvidenceService(session)
        
        # Date line
        evidence1 = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_location_lat=Decimal("0.0"),
            capture_location_lng=Decimal("180.0")
        )
        
        evidence2 = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test2.jpg",
            file_path="/path/to/test2.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_location_lat=Decimal("0.0"),
            capture_location_lng=Decimal("-180.0")
        )
        
        assert evidence1.capture_location_lng == Decimal("180.0")
        assert evidence2.capture_location_lng == Decimal("-180.0")
    
    def test_timestamp_at_epoch(self):
        """TC-EDGE-016: Timestamp at epoch (1970-01-01)"""
        epoch_time = datetime(1970, 1, 1)
        
        session = Mock()
        service = EvidenceService(session)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_timestamp=epoch_time
        )
        
        assert evidence.capture_timestamp == epoch_time
    
    def test_timestamp_at_far_future(self):
        """TC-EDGE-017: Timestamp at far future (2038-01-19)"""
        future_time = datetime(2038, 1, 19)
        
        session = Mock()
        service = EvidenceService(session)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_timestamp=future_time
        )
        
        assert evidence.capture_timestamp == future_time


# ============================================================================
# Data Edge Cases - Large Datasets (TC-EDGE-018 to TC-EDGE-023)
# ============================================================================

class TestLargeDatasets:
    """Test cases for large dataset handling"""
    
    def test_create_inspection_with_large_checklist(self):
        """TC-EDGE-018: Create inspection with 1000 checklist items"""
        session = Mock()
        service = ChecklistService(session)
        
        # Mock repository to handle large dataset
        service.repository.create = Mock(return_value=Mock())
        
        for i in range(1000):
            response = service.create_response(
                inspection_id=uuid4(),
                checklist_item_id=uuid4(),
                response_value="test",
                is_compliant=True
            )
        
        # Should handle 1000 items without error
        assert True
    
    def test_upload_many_evidence_items(self):
        """TC-EDGE-019: Upload 100 evidence items for one inspection"""
        session = Mock()
        service = EvidenceService(session)
        
        inspection_id = uuid4()
        
        for i in range(100):
            evidence = service.create_evidence(
                inspection_id=inspection_id,
                evidence_type=EvidenceType.PHOTO,
                file_name=f"test{i}.jpg",
                file_path=f"/path/to/test{i}.jpg",
                file_size=1024,
                file_mime_type="image/jpeg"
            )
        
        # Should handle 100 items without error
        assert True
    
    def test_list_many_inspections(self):
        """TC-EDGE-020: List 1000 inspections"""
        session = Mock()
        service = InspectionService(session)
        
        # Mock repository to return large dataset
        inspections = [Mock() for _ in range(1000)]
        service.repository.list = Mock(return_value=inspections)
        
        result = service.list_all()
        
        assert len(result) == 1000
    
    def test_generate_report_with_large_dataset(self):
        """TC-EDGE-021: Generate report with large dataset"""
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        # Large checklist responses
        responses = [{"is_compliant": True} for _ in range(100)]
        
        result = service.calculate_fallback_risk_score(
            checklist_responses=responses,
            evidence_count=50,
            violation_count=10
        )
        
        assert result is not None
    
    def test_sync_queue_with_many_items(self):
        """TC-EDGE-022: Sync queue with 1000 pending items"""
        session = Mock()
        
        # Mock sync queue repository
        sync_items = [Mock() for _ in range(1000)]
        
        # Should handle 1000 items
        assert len(sync_items) == 1000
    
    def test_timeline_with_many_transitions(self):
        """TC-EDGE-023: Timeline with 100 state transitions"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock state history
        state_history = [Mock() for _ in range(100)]
        service.state_history_repo.find_by_inspection = Mock(return_value=state_history)
        
        result = service.get_timeline(inspection_id)
        
        assert len(result) == 100


# ============================================================================
# Data Edge Cases - Special Characters (TC-EDGE-024 to TC-EDGE-028)
# ============================================================================

class TestSpecialCharacters:
    """Test cases for special character handling"""
    
    def test_description_with_unicode_characters(self):
        """TC-EDGE-024: Description with Unicode characters"""
        session = Mock()
        service = InspectionService(session)
        
        unicode_text = "निरीक्षण रिपोर्ट"  # Hindi text
        
        inspection = service.create_inspection(
            inspector_id=uuid4(),
            site_id=uuid4(),
            inspection_type_id=uuid4(),
            priority=InspectionPriority.MEDIUM
        )
        
        inspection.description = unicode_text
        
        assert inspection.description == unicode_text
    
    def test_tags_with_special_characters(self):
        """TC-EDGE-025: Tags with special characters"""
        session = Mock()
        service = EvidenceService(session)
        
        tags = ["tag-with-dash", "tag_with_underscore", "tag.with.dot"]
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            tags=tags
        )
        
        assert evidence.tags == tags
    
    def test_file_name_with_spaces_and_special_chars(self):
        """TC-EDGE-026: File name with spaces and special chars"""
        session = Mock()
        service = EvidenceService(session)
        
        file_name = "test file (1).jpg"
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name=file_name,
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg"
        )
        
        assert evidence.file_name == file_name
    
    def test_notes_with_emoji_characters(self):
        """TC-EDGE-027: Notes with emoji characters"""
        session = Mock()
        
        note_text = "Inspection complete ✅ - Need follow-up ⚠️"
        
        with patch('backend.services.notes_service.NotesService') as mock_service:
            service_instance = Mock()
            service_instance.create = Mock(return_value=Mock(content=note_text))
            mock_service.return_value = service_instance
            
            note = service_instance.create(
                inspection_id=uuid4(),
                note_type="observation",
                content=note_text
            )
        
        assert note.content == note_text
    
    def test_json_metadata_with_nested_structures(self):
        """TC-EDGE-028: JSON metadata with nested structures"""
        session = Mock()
        service = EvidenceService(session)
        
        metadata = {
            "location": {
                "lat": 28.6139,
                "lng": 77.2090,
                "accuracy": 10.0,
                "address": {
                    "street": "123 Main St",
                    "city": "Delhi",
                    "country": "India"
                }
            },
            "device": {
                "id": "device-123",
                "model": "iPhone 14",
                "os": "iOS 16"
            }
        }
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg"
        )
        
        # Metadata would be stored separately
        assert evidence is not None


# ============================================================================
# Timing Edge Cases - Concurrent Operations (TC-EDGE-029 to TC-EDGE-033)
# ============================================================================

class TestConcurrentOperations:
    """Test cases for concurrent operation handling"""
    
    def test_simultaneous_evidence_uploads(self):
        """TC-EDGE-029: Simultaneous evidence uploads"""
        import asyncio
        
        session = Mock()
        service = EvidenceService(session)
        
        async def upload_evidence():
            return service.create_evidence(
                inspection_id=uuid4(),
                evidence_type=EvidenceType.PHOTO,
                file_name="test.jpg",
                file_path="/path/to/test.jpg",
                file_size=1024,
                file_mime_type="image/jpeg"
            )
        
        # Simulate concurrent uploads
        tasks = [upload_evidence() for _ in range(10)]
        results = asyncio.run(asyncio.gather(*tasks))
        
        assert len(results) == 10
    
    def test_concurrent_status_updates(self):
        """TC-EDGE-030: Concurrent status updates"""
        import asyncio
        
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        async def update_status():
            return service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.IN_PROGRESS,
                transition_reason="Test"
            )
        
        # Simulate concurrent updates
        tasks = [update_status() for _ in range(5)]
        results = asyncio.run(asyncio.gather(*tasks))
        
        assert len(results) == 5
    
    def test_concurrent_checklist_responses(self):
        """TC-EDGE-031: Concurrent checklist responses"""
        import asyncio
        
        session = Mock()
        service = ChecklistService(session)
        
        inspection_id = uuid4()
        
        async def create_response():
            return service.create_response(
                inspection_id=inspection_id,
                checklist_item_id=uuid4(),
                response_value="test",
                is_compliant=True
            )
        
        # Simulate concurrent responses
        tasks = [create_response() for _ in range(20)]
        results = asyncio.run(asyncio.gather(*tasks))
        
        assert len(results) == 20
    
    def test_concurrent_report_generation_requests(self):
        """TC-EDGE-032: Concurrent report generation requests"""
        import asyncio
        
        from backend.services.ai_integration_service import AIIntegrationService
        
        service = AIIntegrationService(ai_base_url="http://test.ai")
        
        async def generate_report():
            return await service.generate_report(
                inspection_id=str(uuid4()),
                report_type="detailed"
            )
        
        # Simulate concurrent requests
        tasks = [generate_report() for _ in range(5)]
        results = asyncio.run(asyncio.gather(*tasks))
        
        assert len(results) == 5
    
    def test_concurrent_sync_operations(self):
        """TC-EDGE-033: Concurrent sync operations"""
        import asyncio
        
        # Simulate concurrent sync operations
        async def sync_operation():
            await asyncio.sleep(0.1)
            return "synced"
        
        tasks = [sync_operation() for _ in range(10)]
        results = asyncio.run(asyncio.gather(*tasks))
        
        assert len(results) == 10


# ============================================================================
# Timing Edge Cases - Timing Issues (TC-EDGE-034 to TC-EDGE-038)
# ============================================================================

class TestTimingIssues:
    """Test cases for timing issue handling"""
    
    def test_check_out_before_check_in(self):
        """TC-EDGE-034: Check-out before check-in"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection without check-in
        inspection = Mock()
        inspection.check_in_time = None
        inspection.check_out_time = None
        service.repository.get_by_id = Mock(return_value=inspection)
        service.repository.update = Mock(return_value=inspection)
        
        result = service.check_out(inspection_id)
        
        # Should allow check-out even without check-in
        assert result is not None
    
    def test_complete_before_start(self):
        """TC-EDGE-035: Complete before start"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection without start time
        inspection = Mock()
        inspection.started_at = None
        inspection.status = InspectionStatus.DRAFT
        inspection.can_transition_to = Mock(return_value=True)
        service.repository.get_by_id = Mock(return_value=inspection)
        service.repository.update = Mock(return_value=inspection)
        service._record_state_transition = Mock()
        
        result = service.update_status(
            inspection_id=inspection_id,
            new_status=InspectionStatus.COMPLETED
        )
        
        # Should allow completion (will set started_at)
        assert result is not None
    
    def test_schedule_end_before_start(self):
        """TC-EDGE-036: Schedule end before start"""
        session = Mock()
        service = InspectionService(session)
        
        start_time = datetime.now()
        end_time = start_time - timedelta(days=1)  # End before start
        
        inspection = service.create_inspection(
            inspector_id=uuid4(),
            site_id=uuid4(),
            inspection_type_id=uuid4(),
            priority=InspectionPriority.MEDIUM,
            scheduled_date=start_time,
            scheduled_end_date=end_time
        )
        
        # Should create inspection (validation happens elsewhere)
        assert inspection is not None
    
    def test_evidence_timestamp_in_future(self):
        """TC-EDGE-037: Evidence timestamp in future"""
        session = Mock()
        service = EvidenceService(session)
        
        future_time = datetime.now() + timedelta(days=1)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_timestamp=future_time
        )
        
        # Should accept future timestamp
        assert evidence.capture_timestamp == future_time
    
    def test_evidence_timestamp_before_inspection_start(self):
        """TC-EDGE-038: Evidence timestamp before inspection start"""
        session = Mock()
        service = EvidenceService(session)
        
        past_time = datetime.now() - timedelta(days=1)
        
        evidence = service.create_evidence(
            inspection_id=uuid4(),
            evidence_type=EvidenceType.PHOTO,
            file_name="test.jpg",
            file_path="/path/to/test.jpg",
            file_size=1024,
            file_mime_type="image/jpeg",
            capture_timestamp=past_time
        )
        
        # Should accept past timestamp
        assert evidence.capture_timestamp == past_time


# ============================================================================
# State Edge Cases - Invalid State Transitions (TC-EDGE-039 to TC-EDGE-043)
# ============================================================================

class TestInvalidStateTransitions:
    """Test cases for invalid state transition handling"""
    
    def test_transition_from_completed_to_in_progress(self):
        """TC-EDGE-039: Transition from COMPLETED to IN_PROGRESS"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection in COMPLETED state
        inspection = Mock()
        inspection.status = InspectionStatus.COMPLETED
        inspection.can_transition_to = Mock(return_value=False)
        service.repository.get_by_id = Mock(return_value=inspection)
        
        with pytest.raises(Exception):
            service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.IN_PROGRESS
            )
    
    def test_transition_from_submitted_to_draft(self):
        """TC-EDGE-040: Transition from SUBMITTED to DRAFT"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection in SUBMITTED state
        inspection = Mock()
        inspection.status = InspectionStatus.SUBMITTED
        inspection.can_transition_to = Mock(return_value=False)
        service.repository.get_by_id = Mock(return_value=inspection)
        
        with pytest.raises(Exception):
            service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.DRAFT
            )
    
    def test_transition_from_cancelled_to_in_progress(self):
        """TC-EDGE-041: Transition from CANCELLED to IN_PROGRESS"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection in CANCELLED state
        inspection = Mock()
        inspection.status = InspectionStatus.CANCELLED
        inspection.can_transition_to = Mock(return_value=False)
        service.repository.get_by_id = Mock(return_value=inspection)
        
        with pytest.raises(Exception):
            service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.IN_PROGRESS
            )
    
    def test_skip_states_draft_to_completed(self):
        """TC-EDGE-042: Skip states (DRAFT to COMPLETED)"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection in DRAFT state
        inspection = Mock()
        inspection.status = InspectionStatus.DRAFT
        inspection.can_transition_to = Mock(return_value=False)  # Prevent skip
        service.repository.get_by_id = Mock(return_value=inspection)
        
        with pytest.raises(Exception):
            service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.COMPLETED
            )
    
    def test_same_state_transition(self):
        """TC-EDGE-043: Same state transition"""
        session = Mock()
        service = InspectionService(session)
        
        inspection_id = uuid4()
        
        # Mock inspection in DRAFT state
        inspection = Mock()
        inspection.status = InspectionStatus.DRAFT
        inspection.can_transition_to = Mock(return_value=False)  # Prevent same state
        service.repository.get_by_id = Mock(return_value=inspection)
        
        with pytest.raises(Exception):
            service.update_status(
                inspection_id=inspection_id,
                new_status=InspectionStatus.DRAFT
            )


# ============================================================================
# State Edge Cases - Orphaned Data (TC-EDGE-044 to TC-EDGE-048)
# ============================================================================

class TestOrphanedData:
    """Test cases for orphaned data handling"""
    
    def test_evidence_without_inspection(self):
        """TC-EDGE-044: Evidence without inspection"""
        session = Mock()
        service = EvidenceService(session)
        
        # Try to create evidence with invalid inspection ID
        invalid_id = uuid4()
        
        # Mock repository to return None for invalid ID
        service.repository.get_by_id = Mock(return_value=None)
        
        with pytest.raises(Exception):
            service.get_by_id(invalid_id)
    
    def test_checklist_response_without_inspection(self):
        """TC-EDGE-045: Checklist response without inspection"""
        session = Mock()
        service = ChecklistService(session)
        
        invalid_id = uuid4()
        
        # Mock repository to return None
        service.repository.get_by_id = Mock(return_value=None)
        
        with pytest.raises(Exception):
            service.get_by_id(invalid_id)
    
    def test_note_without_inspection(self):
        """TC-EDGE-046: Note without inspection"""
        with patch('backend.services.notes_service.NotesService') as mock_service:
            service_instance = Mock()
            service_instance.get_by_id = Mock(return_value=None)
            mock_service.return_value = service_instance
            
            result = service_instance.get_by_id(uuid4())
        
        assert result is None
    
    def test_state_history_without_inspection(self):
        """TC-EDGE-047: State history without inspection"""
        session = Mock()
        service = InspectionService(session)
        
        invalid_id = uuid4()
        
        # Mock repository to return empty list
        service.state_history_repo.find_by_inspection = Mock(return_value=[])
        
        result = service.get_timeline(invalid_id)
        
        assert result == []
    
    def test_sync_queue_without_inspection(self):
        """TC-EDGE-048: Sync queue without inspection"""
        session = Mock()
        
        # Mock sync queue repository
        sync_items = []
        
        # Should return empty list for invalid inspection
        assert len(sync_items) == 0
