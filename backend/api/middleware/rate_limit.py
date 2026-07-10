"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Rate Limiting Middleware

Description:
    This module provides rate limiting middleware for FastAPI using a sliding window
    algorithm to prevent API abuse and ensure fair usage.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import os
import time
from typing import Dict, Optional
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse

# Rate limiting configuration
DEFAULT_RATE_LIMIT = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
RATE_LIMIT_WINDOW = 60  # seconds


class RateLimiter:
    """
    Sliding window rate limiter.
    
    Tracks request timestamps per client and enforces rate limits.
    """
    
    def __init__(self, requests_per_minute: int = DEFAULT_RATE_LIMIT):
        """
        Initialize rate limiter.
        
        Args:
            requests_per_minute: Maximum requests per minute per client
        """
        self.requests_per_minute = requests_per_minute
        self.window_seconds = RATE_LIMIT_WINDOW
        self.client_requests: Dict[str, list] = defaultdict(list)
    
    def is_allowed(self, client_id: str) -> tuple[bool, Optional[int]]:
        """
        Check if request is allowed for client.
        
        Args:
            client_id: Unique client identifier (IP or user ID)
            
        Returns:
            tuple: (is_allowed, retry_after_seconds)
        """
        current_time = time.time()
        
        # Get client's request history
        requests = self.client_requests[client_id]
        
        # Remove requests outside the time window
        requests[:] = [req_time for req_time in requests 
                      if current_time - req_time < self.window_seconds]
        
        # Check if under limit
        if len(requests) < self.requests_per_minute:
            requests.append(current_time)
            return True, None
        
        # Calculate retry after
        oldest_request = min(requests)
        retry_after = int(self.window_seconds - (current_time - oldest_request))
        
        return False, retry_after
    
    def reset(self, client_id: str):
        """
        Reset rate limit for a client.
        
        Args:
            client_id: Client identifier
        """
        if client_id in self.client_requests:
            del self.client_requests[client_id]


# Global rate limiter instance
rate_limiter = RateLimiter()


def get_client_identifier(request: Request) -> str:
    """
    Get client identifier for rate limiting.
    
    Prioritizes user ID over IP address.
    
    Args:
        request: FastAPI request
        
    Returns:
        str: Client identifier
    """
    # Try to get user ID from request state (if authenticated)
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return f"user:{user.id}"
    
    # Fall back to IP address
    client_host = request.client.host if request.client else "unknown"
    return f"ip:{client_host}"


async def rate_limit_middleware(request: Request, call_next):
    """
    Rate limiting middleware.
    
    Args:
        request: FastAPI request
        call_next: Next middleware/route handler
        
    Returns:
        Response: HTTP response or rate limit error
    """
    # Skip rate limiting for health checks
    if request.url.path in ["/health", "/health/ready", "/"]:
        return await call_next(request)
    
    client_id = get_client_identifier(request)
    
    # Check rate limit
    allowed, retry_after = rate_limiter.is_allowed(client_id)
    
    if not allowed:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": {
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Rate limit exceeded",
                    "retry_after": retry_after
                }
            },
            headers={"Retry-After": str(retry_after)}
        )
    
    response = await call_next(request)
    
    # Add rate limit headers
    remaining = rate_limiter.requests_per_minute - len(rate_limiter.client_requests[client_id])
    response.headers["X-RateLimit-Limit"] = str(rate_limiter.requests_per_minute)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(int(time.time()) + RATE_LIMIT_WINDOW)
    
    return response


def add_rate_limiting_middleware(app):
    """
    Add rate limiting middleware to FastAPI app.
    
    Args:
        app: FastAPI application instance
    """
    app.middleware("http")(rate_limit_middleware)
