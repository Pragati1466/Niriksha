"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Authentication & Authorization Middleware

Description:
    This module provides JWT-based authentication and role-based authorization
    middleware for FastAPI, including token validation, user context management,
    and permission checking.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import os
from typing import Optional, List
from datetime import datetime, timedelta
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

# Security configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security = HTTPBearer()


class UserRole:
    """User role enumeration for authorization."""
    ADMIN = "admin"
    SUPERVISOR = "supervisor"
    INSPECTOR = "inspector"
    VIEWER = "viewer"
    
    @classmethod
    def all(cls) -> List[str]:
        """Return all valid roles."""
        return [cls.ADMIN, cls.SUPERVISOR, cls.INSPECTOR, cls.VIEWER]


class UserContext(BaseModel):
    """User context model for authenticated requests."""
    id: UUID
    email: str
    role: str
    permissions: List[str] = []


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Optional[dict]: Decoded token data or None if invalid
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UserContext:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        
    Returns:
        UserContext: User context
        
    Raises:
        HTTPException: If authentication fails
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise credentials_exception
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    email: str = payload.get("email")
    role: str = payload.get("role")
    permissions: List[str] = payload.get("permissions", [])
    
    if role not in UserRole.all():
        raise credentials_exception
    
    return UserContext(
        id=UUID(user_id),
        email=email,
        role=role,
        permissions=permissions
    )


def require_roles(*allowed_roles: str):
    """
    Dependency factory to require specific user roles.
    
    Args:
        *allowed_roles: Allowed roles
        
    Returns:
        Dependency function
    """
    async def role_checker(current_user: UserContext = Depends(get_current_user)) -> UserContext:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    
    return role_checker


def require_permissions(*required_permissions: str):
    """
    Dependency factory to require specific permissions.
    
    Args:
        *required_permissions: Required permissions
        
    Returns:
        Dependency function
    """
    async def permission_checker(current_user: UserContext = Depends(get_current_user)) -> UserContext:
        for permission in required_permissions:
            if permission not in current_user.permissions:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access forbidden. Required permission: {permission}"
                )
        return current_user
    
    return permission_checker


def require_admin(current_user: UserContext = Depends(get_current_user)) -> UserContext:
    """
    Require admin role.
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserContext: User context
        
    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def is_owner_or_admin(
    resource_owner_id: UUID,
    current_user: UserContext = Depends(get_current_user)
) -> UserContext:
    """
    Check if user is resource owner or admin.
    
    Args:
        resource_owner_id: ID of the resource owner
        current_user: Current authenticated user
        
    Returns:
        UserContext: User context
        
    Raises:
        HTTPException: If user is not owner or admin
    """
    if current_user.role != UserRole.ADMIN and current_user.id != resource_owner_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden. You must be the owner or an admin"
        )
    return current_user


# Optional authentication (doesn't raise error if no token)
async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[UserContext]:
    """
    Get current user optionally (doesn't require authentication).
    
    Args:
        credentials: Optional HTTP Bearer credentials
        
    Returns:
        Optional[UserContext]: User context or None
    """
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None
