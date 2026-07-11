"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Database Session

Description:
    This module provides database session management for the application,
    including session creation, dependency injection for FastAPI, and
    session lifecycle management.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

# Database configuration from environment variables
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://neondb_owner:npg_vK63Gtuhnxgq@ep-fancy-sun-at0eyl46.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require"
)

# Validate database URL is configured
if DATABASE_URL == "postgresql://user:password@localhost:5432/niriksha":
    import warnings
    warnings.warn(
        "Using default database credentials. Please set DATABASE_URL environment variable in production.",
        RuntimeWarning
    )

# Create engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    echo=False  # Set to True for SQL query logging in development
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency for FastAPI to get database session.
    
    This function yields a database session and ensures it's closed after
    the request is complete, even if an exception occurs.
    
    Yields:
        Session: Database session
        
    Example:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """
    Context manager for database session usage outside FastAPI.
    
    This is useful for scripts, background tasks, or testing where
    dependency injection is not available.
    
    Yields:
        Session: Database session
        
    Example:
        with get_db_context() as db:
            items = db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """
    Initialize the database by creating all tables.
    
    This function should be called during application startup to ensure
    all tables exist. In production, use Alembic migrations instead.
    """
    from ..database.models import Base
    Base.metadata.create_all(bind=engine)


def drop_db() -> None:
    """
    Drop all database tables.
    
    WARNING: This will delete all data. Use only in development/testing.
    """
    from ..database.models import Base
    Base.metadata.drop_all(bind=engine)
