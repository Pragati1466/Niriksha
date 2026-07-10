"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Error Handling Middleware

Description:
    This module provides custom error handling middleware for FastAPI,
    including exception handlers for common errors, structured error responses,
    and request ID tracking for debugging.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import uuid
import traceback
import os
from typing import Any, Optional
from datetime import datetime

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Environment variable to control error detail exposure
DEBUG_MODE = os.getenv("DEBUG", "false").lower() == "true"


class AppException(Exception):
    """
    Base application exception.
    
    All custom exceptions should inherit from this class to ensure
    consistent error handling and response formatting.
    """
    
    def __init__(
        self,
        message: str,
        code: str = "APP_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[dict] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(AppException):
    """Exception for validation errors."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=status.HTTP_400_BAD_REQUEST,
            details=details
        )


class NotFoundException(AppException):
    """Exception for resource not found errors."""
    
    def __init__(self, message: str, resource_type: Optional[str] = None):
        details = {"resource_type": resource_type} if resource_type else {}
        super().__init__(
            message=message,
            code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
            details=details
        )


class ConflictException(AppException):
    """Exception for conflict errors (e.g., duplicate resources)."""
    
    def __init__(self, message: str, details: Optional[dict] = None):
        super().__init__(
            message=message,
            code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
            details=details
        )


class UnauthorizedException(AppException):
    """Exception for authorization errors."""
    
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=status.HTTP_401_UNAUTHORIZED
        )


class ForbiddenException(AppException):
    """Exception for permission errors."""
    
    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=status.HTTP_403_FORBIDDEN
        )


class RateLimitException(AppException):
    """Exception for rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded", retry_after: Optional[int] = None):
        details = {"retry_after": retry_after} if retry_after else {}
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details=details
        )


def generate_request_id() -> str:
    """
    Generate a unique request ID for tracing.
    
    Returns:
        str: Unique request ID
    """
    return str(uuid.uuid4())


def format_error_response(
    code: str,
    message: str,
    status_code: int,
    details: Optional[dict] = None,
    request_id: Optional[str] = None
) -> dict:
    """
    Format a standardized error response.
    
    Args:
        code: Error code
        message: Error message
        status_code: HTTP status code
        details: Additional error details
        request_id: Request ID for tracing
        
    Returns:
        dict: Formatted error response
    """
    error = {
        "code": code,
        "message": message,
        "status_code": status_code,
        "timestamp": datetime.now().isoformat(),
    }
    
    if details:
        error["details"] = details
    
    if request_id:
        error["request_id"] = request_id
    
    return {"error": error}


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """
    Handle custom application exceptions.
    
    Args:
        request: FastAPI request
        exc: Application exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    request_id = request.state.get("request_id", generate_request_id())
    
    error_response = format_error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        details=exc.details,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """
    Handle HTTP exceptions.
    
    Args:
        request: FastAPI request
        exc: HTTP exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    request_id = request.state.get("request_id", generate_request_id())
    
    error_response = format_error_response(
        code="HTTP_ERROR",
        message=exc.detail,
        status_code=exc.status_code,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle request validation errors.
    
    Args:
        request: FastAPI request
        exc: Validation exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    request_id = request.state.get("request_id", generate_request_id())
    
    # Format validation errors
    validation_errors = []
    for error in exc.errors():
        validation_errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    error_response = format_error_response(
        code="VALIDATION_ERROR",
        message="Request validation failed",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        details={"validation_errors": validation_errors},
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=error_response
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """
    Handle SQLAlchemy database errors.
    
    Args:
        request: FastAPI request
        exc: SQLAlchemy exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    request_id = request.state.get("request_id", generate_request_id())
    
    # Log the full traceback for debugging
    traceback.print_exc()
    
    if isinstance(exc, IntegrityError):
        # Sanitize error details for production
        error_detail = str(exc.orig) if DEBUG_MODE else "Database constraint violated"
        
        error_response = format_error_response(
            code="INTEGRITY_ERROR",
            message="Database integrity constraint violated",
            status_code=status.HTTP_409_CONFLICT,
            details={"detail": error_detail} if DEBUG_MODE else None,
            request_id=request_id
        )
        status_code = status.HTTP_409_CONFLICT
    else:
        # Sanitize error details for production
        error_detail = str(exc) if DEBUG_MODE else "Database operation failed"
        
        error_response = format_error_response(
            code="DATABASE_ERROR",
            message="Database operation failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"detail": error_detail} if DEBUG_MODE else None,
            request_id=request_id
        )
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle all other unhandled exceptions.
    
    Args:
        request: FastAPI request
        exc: Generic exception
        
    Returns:
        JSONResponse: Formatted error response
    """
    request_id = request.state.get("request_id", generate_request_id())
    
    # Log the full traceback for debugging
    traceback.print_exc()
    
    # Sanitize error details for production
    error_detail = str(exc) if DEBUG_MODE else "An unexpected error occurred"
    
    error_response = format_error_response(
        code="INTERNAL_ERROR",
        message="An unexpected error occurred",
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        details={"detail": error_detail} if DEBUG_MODE else None,
        request_id=request_id
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_response
    )


def add_request_id_middleware(app):
    """
    Add middleware to generate and attach request IDs.
    
    Args:
        app: FastAPI application instance
    """
    @app.middleware("http")
    async def request_id_middleware(request: Request, call_next):
        # Generate request ID
        request_id = generate_request_id()
        request.state.request_id = request_id
        
        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        return response


def register_exception_handlers(app):
    """
    Register all exception handlers with the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, general_exception_handler)
