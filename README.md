# NIRIKSHA - Government Inspection Intelligence Platform

NIRIKSHA is a comprehensive government inspection intelligence platform designed to modernize and streamline inspection workflows for regulatory compliance. The platform enables inspectors to conduct efficient, data-driven inspections with real-time compliance tracking, evidence collection, and offline-first capabilities.

## Overview

NIRIKSHA transforms traditional paper-based inspection processes into a digital, intelligent system that:
- Streamlines inspection workflows with mobile-first design
- Ensures regulatory compliance through standardized checklists
- Captures rich evidence with AI-powered verification
- Supports offline operations for remote inspections
- Provides real-time analytics and reporting
- Maintains comprehensive audit trails for governance

## Architecture

The platform follows a modern microservices-inspired architecture with clear separation of concerns:

### Backend (FastAPI)
- RESTful API with comprehensive endpoint coverage
- PostgreSQL database with UUID-based primary keys
- SQLAlchemy ORM with advanced features (soft delete, optimistic locking)
- Structured JSON logging for observability
- Custom exception handling with detailed error responses
- Docker containerization for deployment

### Frontend (React)
- Modern React 18 with Vite for fast development
- TailwindCSS for responsive, accessible UI
- Zustand for lightweight state management
- TanStack Query for efficient data fetching
- Radix UI primitives for accessible components
- Offline-first architecture with sync capabilities

## Project Structure

```
niriksha/
├── backend/                 # FastAPI backend application
│   ├── api/                # API layer
│   │   ├── main.py         # FastAPI application entry
│   │   ├── middleware/     # Custom middleware
│   │   ├── routers/        # API route handlers
│   │   └── schemas/        # Pydantic validation schemas
│   ├── database/           # Database layer
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── migrations/     # Database migrations
│   │   └── session.py      # Session management
│   ├── repositories/       # Data access layer
│   ├── services/           # Business logic layer
│   ├── tests/              # Unit and integration tests
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Backend Docker image
│   └── docker-compose.yml  # Docker orchestration
├── frontend/               # React frontend application
│   ├── src/                # Source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and API client
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API service functions
│   │   └── store/          # Global state management
│   ├── package.json        # Node dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # TailwindCSS configuration
│   ├── Dockerfile          # Frontend Docker image
│   └── nginx.conf          # Nginx configuration
└── inspection-workflow-module/  # Documentation
    ├── TASK_BREAKDOWN.md   # Detailed task breakdown
    ├── BACKEND_ARCHITECTURE.md
    ├── FRONTEND_ARCHITECTURE.md
    └── DATABASE_SCHEMA.md
```

## Features

### Inspection Management
- Create and schedule inspections
- Track inspection status through state machine
- GPS-based check-in/check-out with geofencing
- Compliance score calculation
- Timeline and audit trail

### Checklist System
- Template-based checklists with sections and items
- Multiple response types (text, yes/no, dropdown, multiple choice)
- Progress tracking and completion percentage
- Non-compliant item identification
- Evidence requirement enforcement

### Evidence Collection
- Photo and document upload
- AI-powered verification
- Location tagging with GPS
- File integrity verification
- Searchable tags and metadata

### Notes & Observations
- Rich text notes with formatting
- Voice note support
- Action item tracking
- Severity classification
- Link to checklist items

### Offline Sync
- First-class offline support
- Conflict resolution UI
- Sync queue management
- Automatic retry logic
- Status indicators

### Audit & Compliance
- Comprehensive audit logging
- State transition history
- User action tracking
- IP and session logging
- Regulatory reference tracking

## Technology Stack

### Backend
- **Framework**: FastAPI 0.104.1
- **Database**: PostgreSQL 14
- **ORM**: SQLAlchemy 2.0.23
- **Validation**: Pydantic 2.5.0
- **Authentication**: python-jose, passlib
- **Task Queue**: Celery with Redis
- **Storage**: AWS S3 (via boto3)

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: TailwindCSS
- **UI Components**: Radix UI
- **Forms**: React Hook Form with Zod
- **Charts**: Recharts

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Redis (for Celery)
- Docker (optional)

### Backend Setup

1. Navigate to backend directory:
   ```bash
   cd backend
   ```

2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. Run database migrations:
   ```bash
   psql -U user -d niriksha -f database/migrations/001_create_inspection_tables.sql
   ```

6. Start the server:
   ```bash
   uvicorn api.main:app --reload
   ```

### Frontend Setup

1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

### Docker Setup

1. Build and start all services:
   ```bash
   cd backend
   docker-compose up --build
   ```

2. The application will be available at:
   - Backend API: http://localhost:8000
   - Frontend: http://localhost:5173
   - API Documentation: http://localhost:8000/docs

## API Documentation

Once the backend is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Testing

### Backend Tests
```bash
cd backend
pytest tests/
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Deployment

### Backend Deployment
1. Build Docker image: `docker build -t niriksha-backend .`
2. Push to registry
3. Deploy with environment variables
4. Run database migrations
5. Start application

### Frontend Deployment
1. Build production bundle: `npm run build`
2. Build Docker image: `docker build -t niriksha-frontend .`
3. Deploy to web server or CDN
4. Configure nginx for SPA routing

## Documentation

Detailed documentation is available in the `inspection-workflow-module/` directory:
- **TASK_BREAKDOWN.md**: Complete task breakdown and implementation status
- **BACKEND_ARCHITECTURE.md**: Backend architecture details
- **FRONTEND_ARCHITECTURE.md**: Frontend architecture details
- **DATABASE_SCHEMA.md**: Complete database schema documentation

## Contributing

This is a proprietary project for government use. All contributions must follow:
- Code review process
- Testing requirements
- Documentation standards
- Security guidelines

## License

Proprietary - All rights reserved. Government use only.

## Support

For support, contact the NIRIKSHA development team.

## Acknowledgments

Built for the IBM Hackathon 2026 - Government Inspection Intelligence Challenge.
