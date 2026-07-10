# NIRIKSHA Inspection Workflow API - Backend

Government inspection intelligence platform - Inspection Workflow & Data Collection Module backend API.

## Overview

This is the FastAPI backend for the NIRIKSHA Inspection Workflow & Data Collection Module. It provides RESTful APIs for managing inspections, checklists, evidence, notes, and offline synchronization for government inspection systems.

## Features

- **Inspection Management**: Create, update, and manage inspections with status tracking
- **Checklist System**: Template-based checklists with sections, items, and responses
- **Evidence Collection**: Photo and document evidence upload with AI verification
- **Notes & Observations**: Rich text and voice notes for inspection observations
- **Offline Sync**: First-class offline support with conflict resolution
- **Audit Logging**: Comprehensive audit trail for compliance
- **Structured Logging**: JSON logging for observability
- **Error Handling**: Custom exception handling with detailed error responses

## Technology Stack

- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL with SQLAlchemy 2.0.23
- **ORM**: SQLAlchemy with UUID primary keys
- **Validation**: Pydantic 2.5.0
- **Authentication**: python-jose, passlib
- **Logging**: python-json-logger, structlog
- **Task Queue**: Celery with Redis
- **Storage**: AWS S3 (via boto3)

## Project Structure

```
backend/
├── api/
│   ├── main.py                 # FastAPI application entry point
│   ├── middleware/             # Custom middleware
│   │   ├── error_handler.py   # Exception handling
│   │   └── logging.py         # Logging configuration
│   ├── routers/               # API route handlers
│   │   ├── inspection.py      # Inspection endpoints
│   │   ├── checklist.py       # Checklist endpoints
│   │   ├── evidence.py        # Evidence endpoints
│   │   ├── notes.py           # Notes endpoints
│   │   └── sync.py            # Sync endpoints
│   └── schemas/               # Pydantic schemas
│       ├── inspection.py      # Inspection schemas
│       ├── checklist.py       # Checklist schemas
│       ├── evidence.py        # Evidence schemas
│       ├── notes.py           # Notes schemas
│       ├── sync.py            # Sync schemas
│       └── common.py          # Common schemas
├── database/
│   ├── models/                # SQLAlchemy ORM models
│   │   ├── base.py           # Base model with mixins
│   │   ├── inspection.py     # Inspection model
│   │   ├── checklist.py      # Checklist models
│   │   ├── evidence.py       # Evidence model
│   │   ├── note.py           # Note model
│   │   ├── state_history.py  # State history model
│   │   ├── offline_queue.py  # Offline sync model
│   │   ├── location_log.py   # Location tracking model
│   │   ├── submission.py     # Submission model
│   │   ├── report.py         # Report model
│   │   ├── sync_conflict.py   # Sync conflict model
│   │   ├── audit_log.py      # Audit log model
│   │   └── attachment.py     # Attachment model
│   ├── migrations/            # Database migrations
│   │   └── 001_create_inspection_tables.sql
│   └── session.py            # Database session management
├── repositories/             # Data access layer
│   ├── base_repository.py    # Base repository with CRUD
│   ├── inspection_repository.py
│   ├── checklist_repository.py
│   ├── evidence_repository.py
│   └── state_history_repository.py
├── services/                 # Business logic layer
│   ├── base_service.py       # Base service with validation
│   ├── inspection_service.py
│   ├── checklist_service.py
│   └── evidence_service.py
└── requirements.txt          # Python dependencies
```

## Prerequisites

- Python 3.11 or higher
- PostgreSQL 14 or higher
- Redis (for Celery task queue)
- AWS S3 account (for file storage)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pragati1466/Niriksha.git
   cd Niriksha/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/niriksha
   REDIS_URL=redis://localhost:6379/0
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_S3_BUCKET=your_bucket_name
   SECRET_KEY=your_secret_key
   LOG_LEVEL=INFO
   ```

5. **Run database migrations**
   ```bash
   # Using psql
   psql -U user -d niriksha -f database/migrations/001_create_inspection_tables.sql
   ```

6. **Start the development server**
   ```bash
   uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, access the interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## API Endpoints

### Health Check
- `GET /health` - Health check endpoint
- `GET /health/ready` - Readiness check endpoint
- `GET /` - Root endpoint with API information

### Inspections
- `POST /api/v1/inspections` - Create inspection
- `GET /api/v1/inspections` - List inspections
- `GET /api/v1/inspections/{id}` - Get inspection details
- `PATCH /api/v1/inspections/{id}` - Update inspection
- `PATCH /api/v1/inspections/{id}/status` - Update inspection status
- `POST /api/v1/inspections/{id}/check-in` - Check in at site
- `POST /api/v1/inspections/{id}/check-out` - Check out from site
- `GET /api/v1/inspections/{id}/timeline` - Get state timeline
- `GET /api/v1/inspections/active` - Get active inspections
- `DELETE /api/v1/inspections/{id}` - Delete inspection

### Checklists
- `POST /api/v1/checklists/templates` - Create template
- `GET /api/v1/checklists/templates` - List templates
- `GET /api/v1/checklists/templates/{id}` - Get template with items
- `POST /api/v1/checklists/templates/{id}/sections` - Add section
- `POST /api/v1/checklists/sections/{id}/items` - Add item
- `POST /api/v1/checklists/responses` - Create responses
- `GET /api/v1/checklists/responses/{id}` - Get response
- `PATCH /api/v1/checklists/responses/{id}` - Update response
- `GET /api/v1/checklists/inspections/{id}/completion` - Get completion percentage

### Evidence
- `POST /api/v1/evidence/presigned-url` - Get presigned upload URL
- `POST /api/v1/evidence/photos` - Upload photo evidence
- `POST /api/v1/evidence/documents` - Upload document evidence
- `GET /api/v1/evidence/inspections/{id}` - List evidence
- `GET /api/v1/evidence/{id}` - Get evidence
- `PATCH /api/v1/evidence/{id}/metadata` - Update metadata
- `PATCH /api/v1/evidence/{id}/verification` - Update verification status
- `POST /api/v1/evidence/{id}/tags/{tag}` - Add tag
- `DELETE /api/v1/evidence/{id}/tags/{tag}` - Remove tag

### Notes
- `POST /api/v1/notes` - Create note
- `GET /api/v1/notes/{id}` - Get note
- `PATCH /api/v1/notes/{id}` - Update note
- `DELETE /api/v1/notes/{id}` - Delete note
- `GET /api/v1/notes/inspections/{id}` - List notes for inspection

### Sync
- `POST /api/v1/sync/push` - Push offline changes
- `POST /api/v1/sync/pull` - Pull server changes
- `GET /api/v1/sync/status` - Get sync status
- `POST /api/v1/sync/conflicts/{id}/resolve` - Resolve conflict
- `GET /api/v1/sync/conflicts` - List conflicts

## Running in Production

1. **Use a production WSGI server**
   ```bash
   uvicorn api.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Configure proper CORS settings**
   Update the CORS middleware in `api/main.py` to allow only specific origins.

3. **Enable HTTPS**
   Use a reverse proxy like Nginx or Caddy to terminate SSL.

4. **Set up monitoring**
   Configure logging to output to a log aggregation system.

5. **Run Celery workers**
   ```bash
   celery -A api.tasks worker --loglevel=info
   ```

## Testing

Run tests using pytest:
```bash
pytest tests/
```

## Database Schema

The database schema is defined in `database/migrations/001_create_inspection_tables.sql`. Key tables include:

- `inspections` - Main inspection records
- `inspection_checklists` - Checklist responses
- `checklist_templates` - Template definitions
- `checklist_sections` - Template sections
- `checklist_items` - Template items
- `evidence` - Evidence records
- `inspection_notes` - Notes and observations
- `inspection_state_history` - State transition history
- `inspection_offline_queue` - Offline sync queue
- `inspection_location_log` - Location tracking
- `submissions` - Inspection submissions
- `generated_reports` - Generated reports
- `sync_conflicts` - Sync conflicts
- `audit_logs` - Audit trail
- `inspection_attachments` - Supporting attachments

## Error Handling

The API uses custom exception classes for consistent error responses:

- `AppException` - Base application exception
- `ValidationException` - Validation errors (400)
- `NotFoundException` - Resource not found (404)
- `ConflictException` - Conflict errors (409)
- `UnauthorizedException` - Authorization errors (401)
- `ForbiddenException` - Permission errors (403)
- `RateLimitException` - Rate limiting errors (429)

All errors return a structured JSON response:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": {},
    "request_id": "uuid",
    "timestamp": "ISO-8601"
  }
}
```

## Logging

The application uses structured JSON logging for observability. Logs include:

- Request/response logging with duration
- Audit events for compliance
- Error logging with stack traces
- Request ID tracing

Configure log level via the `LOG_LEVEL` environment variable.

## License

Proprietary - All rights reserved.

## Support

For support, contact the NIRIKSHA development team.
