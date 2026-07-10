"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Main FastAPI Application

Description:
    This module is the entry point for the FastAPI application. It initializes
    the application, registers routers, configures middleware, and sets up
    all necessary components for the inspection workflow module API.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from ..api.routers import (
    inspection_router,
    checklist_router,
    evidence_router,
    notes_router,
    sync_router,
    ai_router,
)
from ..api.middleware.error_handler import (
    register_exception_handlers,
    add_request_id_middleware,
)
from ..api.middleware.rate_limit import add_rate_limiting_middleware
from ..api.middleware.sanitization import add_sanitization_middleware
from ..api.middleware.logging import (
    setup_logging,
    RequestLoggingMiddleware,
    get_logger,
)
from ..database.session import init_db


# Configure logging
logger = setup_logging(log_level="INFO", json_logs=True)
app_logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Lifespan context manager for startup and shutdown events.
    
    This function handles application startup and shutdown tasks such as
    database initialization and resource cleanup.
    
    Args:
        app: FastAPI application instance
        
    Yields:
        None
    """
    # Startup
    app_logger.info("Starting NIRIKSHA Inspection Workflow API")
    
    # Initialize database (create tables if they don't exist)
    # In production, use Alembic migrations instead
    try:
        init_db()
        app_logger.info("Database initialized successfully")
    except Exception as e:
        app_logger.error(f"Database initialization failed: {str(e)}")
        raise
    
    yield
    
    # Shutdown
    app_logger.info("Shutting down NIRIKSHA Inspection Workflow API")


# Create FastAPI application
app = FastAPI(
    title="NIRIKSHA Inspection Workflow API",
    description="API for the Inspection Workflow & Data Collection Module - Government inspection intelligence platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)


# ============================================================================
# CORS Configuration
# ============================================================================

import os

# Get allowed origins from environment variable
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)


# ============================================================================
# Middleware Configuration
# ============================================================================

# Add rate limiting middleware
add_rate_limiting_middleware(app)

# Add input sanitization middleware
add_sanitization_middleware(app)

# Add request ID middleware
add_request_id_middleware(app)

# Add request logging middleware
request_logger = get_logger("request")
app.add_middleware(RequestLoggingMiddleware, logger=request_logger)

# Register exception handlers
register_exception_handlers(app)


# ============================================================================
# Health Check Endpoints
# ============================================================================

@app.get("/health", tags=["health"])
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    
    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "service": "niriksha-inspection-workflow-api",
        "version": "1.0.0",
    }


@app.get("/health/ready", tags=["health"])
async def readiness_check():
    """
    Readiness check endpoint.
    
    Returns:
        dict: Readiness status
    """
    # Check database connection
    try:
        from ..database.session import SessionLocal
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()
        database_status = "ready"
    except Exception as e:
        database_status = "not_ready"
        app_logger.error(f"Database readiness check failed: {str(e)}")
    
    return {
        "status": "ready" if database_status == "ready" else "not_ready",
        "checks": {
            "database": database_status,
        },
    }


@app.get("/", tags=["root"])
async def root():
    """
    Root endpoint with API information.
    
    Returns:
        dict: API information
    """
    return {
        "name": "NIRIKSHA Inspection Workflow API",
        "version": "1.0.0",
        "description": "Government inspection intelligence platform - Inspection Workflow & Data Collection Module",
        "documentation": "/docs",
        "health": "/health",
    }


# ============================================================================
# Router Registration
# ============================================================================

app.include_router(inspection_router, prefix="/api/v1")
app.include_router(checklist_router, prefix="/api/v1")
app.include_router(evidence_router, prefix="/api/v1")
app.include_router(notes_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


# ============================================================================
# Global Exception Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions.
    
    This is a fallback handler that catches any exceptions not handled
    by specific exception handlers.
    
    Args:
        request: FastAPI request
        exc: Exception
        
    Returns:
        JSONResponse: Error response
    """
    app_logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "request_id": request.state.get("request_id"),
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "request_id": request.state.get("request_id"),
            }
        },
    )


# ============================================================================
# Application Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
