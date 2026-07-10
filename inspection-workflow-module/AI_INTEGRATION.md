# NIRIKSHA - AI Integration Design Document

## Overview

This document describes the integration between the Inspection Workflow module and the AI module for the NIRIKSHA platform.

## AI Module APIs

The AI team exposes the following endpoints:

### 1. POST /risk-score
Calculates risk score for an inspection based on checklist responses and evidence.

**Request:**
```json
{
  "inspection_id": "uuid",
  "checklist_responses": [
    {
      "item_id": "uuid",
      "response_value": "string",
      "is_compliant": boolean,
      "severity": "string"
    }
  ],
  "evidence_count": 10,
  "violation_count": 2
}
```

**Response:**
```json
{
  "risk_score": 75,
  "risk_level": "medium",
  "factors": [
    {
      "factor": "high_violation_count",
      "impact": 0.3
    }
  ]
}
```

### 2. POST /verify-evidence
Verifies evidence authenticity using AI analysis.

**Request:**
```json
{
  "evidence_id": "uuid",
  "file_url": "string",
  "file_type": "photo|document",
  "metadata": {
    "capture_timestamp": "ISO-8601",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    }
  }
}
```

**Response:**
```json
{
  "verification_status": "verified|flagged|pending",
  "confidence": 0.95,
  "discrepancies": [],
  "analysis_details": {
    "manipulation_detected": false,
    "location_match": true,
    "timestamp_consistency": true
  }
}
```

### 3. POST /generate-report
Generates an inspection report with AI-powered insights.

**Request:**
```json
{
  "inspection_id": "uuid",
  "report_type": "summary|detailed",
  "include_recommendations": true,
  "include_charts": true
}
```

**Response:**
```json
{
  "report_id": "uuid",
  "report_url": "string",
  "generated_at": "ISO-8601",
  "summary": {
    "compliance_score": 85,
    "total_violations": 3,
    "key_findings": []
  }
}
```

## Integration Architecture

### Service Layer Design

```
Inspection Service
    ↓ calls
AI Integration Service
    ↓ calls
AI Module APIs (with retry logic)
```

### Key Design Principles

1. **Circuit Breaker**: Prevent cascading failures
2. **Retry with Exponential Backoff**: Handle transient failures
3. **Timeout Protection**: Prevent hanging requests
4. **Fallback Values**: Graceful degradation
5. **Async Processing**: Non-blocking for user experience
6. **Audit Logging**: Track all AI interactions
7. **Error Isolation**: AI failures don't break core workflow

## Integration Flows

### Flow 1: Evidence Verification

**Trigger:** Evidence upload completion

**Flow:**
1. User uploads evidence
2. Evidence stored in S3
3. Evidence record created in database (status: pending)
4. Async task triggered to call AI verify-evidence API
5. AI service called with retry logic (max 3 attempts)
6. On success: Update evidence verification status
7. On failure: Mark as manual review required, log error
8. Frontend polls for status updates

**Error Handling:**
- AI service unavailable: Queue for retry, notify user
- Timeout: Mark as manual review, continue workflow
- Invalid response: Log error, mark as manual review

### Flow 2: Risk Score Calculation

**Trigger:** Inspection completion or checklist update

**Flow:**
1. Checklist responses updated
2. Inspection service aggregates data
3. Call AI risk-score API synchronously (with timeout)
4. On success: Update inspection risk_score field
5. On failure: Use fallback calculation (rule-based)
6. Cache result for 5 minutes

**Error Handling:**
- AI service unavailable: Use fallback calculation
- Timeout: Use fallback calculation, log warning
- Invalid response: Use fallback calculation, log error

### Flow 3: Report Generation

**Trigger:** User requests report or inspection completion

**Flow:**
1. User requests report generation
2. Create report record (status: generating)
3. Async task triggered to call AI generate-report API
4. AI service called with retry logic (max 5 attempts)
5. On success: Update report with URL and summary
6. On failure: Mark as failed, allow manual retry
7. Frontend shows loading state, polls for completion

**Error Handling:**
- AI service unavailable: Queue for retry, show error to user
- Timeout: Mark as failed, allow manual retry
- Invalid response: Log error, mark as failed

## Retry Strategy

### Configuration

```python
RETRY_CONFIG = {
    "max_attempts": 3,
    "initial_delay": 1.0,  # seconds
    "backoff_factor": 2.0,  # exponential
    "timeout": 30.0,  # seconds per request
    "circuit_breaker_threshold": 5,  # consecutive failures
    "circuit_breaker_timeout": 60.0  # seconds
}
```

### Retry Logic

1. **Exponential Backoff**: 1s, 2s, 4s, 8s...
2. **Jitter**: Add random delay to prevent thundering herd
3. **Circuit Breaker**: Open after 5 consecutive failures
4. **Timeout**: 30 seconds per request
5. **Max Attempts**: 3 for evidence, 5 for reports

## Loading States

### Frontend Loading States

1. **Evidence Upload**: Show progress bar, then "Verifying..."
2. **Risk Score**: Show "Calculating risk score..." indicator
3. **Report Generation**: Show spinner with "Generating report..."
4. **Polling**: Periodic status checks every 2 seconds

### Backend Loading States

1. **Async Tasks**: Use Celery for background processing
2. **Status Tracking**: Update database with processing status
3. **Progress Updates**: Emit WebSocket events for real-time updates

## Failure Handling

### Graceful Degradation

1. **Evidence Verification**: If AI fails, mark for manual review
2. **Risk Score**: If AI fails, use rule-based calculation
3. **Report Generation**: If AI fails, allow manual report creation

### User Communication

1. **Transparent Errors**: Show clear error messages
2. **Retry Options**: Allow users to retry failed operations
3. **Fallback Actions**: Suggest alternative workflows

## Security Considerations

1. **API Authentication**: Use service-to-service tokens
2. **Data Privacy**: Sanitize data before sending to AI
3. **Rate Limiting**: Respect AI module rate limits
4. **Audit Trail**: Log all AI interactions for compliance

## Monitoring

1. **Success Rate**: Track AI API success rates
2. **Latency**: Monitor AI API response times
3. **Error Rate**: Track error types and frequencies
4. **Circuit Breaker Status**: Monitor circuit breaker state

## Implementation Plan

1. Create AI integration service with retry logic ✓
2. Add AI service configuration to environment variables
3. Update evidence service to call verify-evidence API
4. Update inspection service to call risk-score API
5. Create report service for generate-report API
6. Add AI endpoints to backend routers
7. Add Celery tasks for async AI calls
8. Update frontend with loading states
9. Add polling for async operations
10. Add error handling and fallback logic
