"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Input Sanitization Middleware

Description:
    This module provides input sanitization middleware to prevent XSS attacks,
    SQL injection, and other injection vulnerabilities.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import re
import html
from typing import Any, Dict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse


class InputSanitizer:
    """
    Input sanitizer for preventing injection attacks.
    """
    
    # SQL injection patterns
    SQL_INJECTION_PATTERNS = [
        r"(\bunion\b.*\bselect\b)",
        r"(\bselect\b.*\bfrom\b)",
        r"(\binsert\b.*\binto\b)",
        r"(\bupdate\b.*\bset\b)",
        r"(\bdelete\b.*\bfrom\b)",
        r"(\bdrop\b.*\btable\b)",
        r"(\bexec\b|\bexecute\b)",
        r"(--|#|/\*|\*/)",
        r"(\bor\b\s+1\s*=\s*1)",
        r"(\band\b\s+1\s*=\s*1)",
        r"(;)",
        r"(\bxp_cmdshell\b)",
        r"(\bsp_executesql\b)",
    ]
    
    # XSS patterns
    XSS_PATTERNS = [
        r"<script[^>]*>.*?</script>",
        r"javascript:",
        r"on\w+\s*=",
        r"<iframe",
        r"<object",
        r"<embed",
        r"<link",
        r"<meta",
        r"onload\s*=",
        r"onerror\s*=",
    ]
    
    @classmethod
    def sanitize_string(cls, value: str) -> str:
        """
        Sanitize a string value.
        
        Args:
            value: String to sanitize
            
        Returns:
            str: Sanitized string
        """
        if not isinstance(value, str):
            return value
        
        # HTML escape
        sanitized = html.escape(value)
        
        # Remove null bytes
        sanitized = sanitized.replace("\x00", "")
        
        return sanitized
    
    @classmethod
    def check_sql_injection(cls, value: str) -> bool:
        """
        Check for SQL injection patterns.
        
        Args:
            value: String to check
            
        Returns:
            bool: True if SQL injection detected
        """
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        for pattern in cls.SQL_INJECTION_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def check_xss(cls, value: str) -> bool:
        """
        Check for XSS patterns.
        
        Args:
            value: String to check
            
        Returns:
            bool: True if XSS detected
        """
        if not isinstance(value, str):
            return False
        
        value_lower = value.lower()
        for pattern in cls.XSS_PATTERNS:
            if re.search(pattern, value_lower, re.IGNORECASE):
                return True
        return False
    
    @classmethod
    def sanitize_dict(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize dictionary values.
        
        Args:
            data: Dictionary to sanitize
            
        Returns:
            Dict: Sanitized dictionary
        """
        sanitized = {}
        for key, value in data.items():
            if isinstance(value, str):
                # Check for injection attacks
                if cls.check_sql_injection(value) or cls.check_xss(value):
                    raise ValueError(f"Potentially malicious input detected in field: {key}")
                sanitized[key] = cls.sanitize_string(value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_dict(value)
            elif isinstance(value, list):
                sanitized[key] = [cls.sanitize_string(item) if isinstance(item, str) else item for item in value]
            else:
                sanitized[key] = value
        return sanitized


async def sanitization_middleware(request: Request, call_next):
    """
    Input sanitization middleware.
    
    Args:
        request: FastAPI request
        call_next: Next middleware/route handler
        
    Returns:
        Response: HTTP response or sanitization error
    """
    # Skip sanitization for GET requests and health checks
    if request.method == "GET" or request.url.path in ["/health", "/health/ready", "/"]:
        return await call_next(request)
    
    # Skip if request body is not JSON
    content_type = request.headers.get("content-type", "")
    if "application/json" not in content_type:
        return await call_next(request)
    
    try:
        # Get request body
        body = await request.json()
        
        # Sanitize input
        try:
            sanitized_body = InputSanitizer.sanitize_dict(body)
            
            # Replace request body with sanitized version
            # Note: This is a simplified approach. In production, you might want to
            # use a more sophisticated method to modify the request body
            request._body = sanitized_body
            
        except ValueError as e:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "error": {
                        "code": "INVALID_INPUT",
                        "message": str(e)
                    }
                }
            )
    
    except Exception:
        # If JSON parsing fails, let it pass to the next middleware
        pass
    
    return await call_next(request)


def add_sanitization_middleware(app):
    """
    Add input sanitization middleware to FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.middleware("http")(sanitization_middleware)


def validate_gps_coordinates(latitude: float, longitude: float) -> bool:
    """
    Validate GPS coordinates.
    
    Args:
        latitude: Latitude value
        longitude: Longitude value
        
    Returns:
        bool: True if coordinates are valid
    """
    try:
        lat = float(latitude)
        lng = float(longitude)
        return -90 <= lat <= 90 and -180 <= lng <= 180
    except (ValueError, TypeError):
        return False


def validate_file_mime_type(mime_type: str, allowed_types: list) -> bool:
    """
    Validate file MIME type.
    
    Args:
        mime_type: MIME type to validate
        allowed_types: List of allowed MIME types
        
    Returns:
        bool: True if MIME type is allowed
    """
    return mime_type.lower() in [t.lower() for t in allowed_types]


def validate_file_size(file_size: int, max_size_mb: int = 100) -> bool:
    """
    Validate file size.
    
    Args:
        file_size: File size in bytes
        max_size_mb: Maximum allowed size in MB
        
    Returns:
        bool: True if file size is within limit
    """
    max_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_bytes
