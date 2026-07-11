"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Logging Configuration

Description:
    This module provides structured logging configuration for the application,
    including log levels, formatters, handlers, and request/response logging
    middleware for observability and debugging.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import logging
import sys
import json
from typing import Any, Optional
from datetime import datetime
from pathlib import Path

from fastapi import Request, Response
from pythonjsonlogger import jsonlogger


class JsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter for structured logging.
    
    This formatter outputs logs in JSON format for easy parsing by log
    aggregation systems like ELK, Splunk, or CloudWatch.
    """
    
    def add_fields(self, log_record: dict, record: logging.LogRecord, message_dict: dict):
        """
        Add custom fields to the log record.
        
        Args:
            log_record: The log record dictionary
            record: The logging record
            message_dict: Additional message fields
        """
        super().add_fields(log_record, record, message_dict)
        
        # Add custom fields
        log_record["level"] = record.levelname
        log_record["logger"] = record.name
        log_record["timestamp"] = datetime.now().isoformat()
        
        # Add exception info if present
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)


class RequestLoggingMiddleware:
    """
    Middleware for logging HTTP requests and responses.
    
    This middleware logs all incoming requests and outgoing responses
    with structured data for observability and debugging.
    """
    
    def __init__(self, app, logger: logging.Logger):
        """
        Initialize the request logging middleware.
        
        Args:
            app: FastAPI application
            logger: Logger instance
        """
        self.app = app
        self.logger = logger
    
    async def __call__(self, scope, receive, send):
        """
        Process request and log request/response details.
        
        Args:
            scope: ASGI scope
            receive: ASGI receive callable
            send: ASGI send callable
            
        Returns:
            Response: The response from the next handler
        """
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        
        # Create request object for logging
        from fastapi import Request
        request = Request(scope, receive)
        
        start_time = datetime.now()
        
        # Log request
        self.logger.info(
            "Incoming request",
            extra={
                "event": "request",
                "method": request.method,
                "path": request.url.path,
                "query_params": str(request.query_params),
                "client_ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        
        # Process request
        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                duration = (datetime.now() - start_time).total_seconds()
                self.logger.info(
                    "Outgoing response",
                    extra={
                        "event": "response",
                        "status_code": status_code,
                        "duration_ms": duration * 1000,
                        "path": request.url.path,
                        "method": request.method,
                    }
                )
            await send(message)
        
        await self.app(scope, receive, send_wrapper)


def setup_logging(
    log_level: str = "INFO",
    log_file: Optional[str] = None,
    json_logs: bool = True
) -> logging.Logger:
    """
    Configure application logging.
    
    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Optional log file path
        json_logs: Whether to use JSON formatter
        
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create root logger
    logger = logging.getLogger("niriksha")
    logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    logger.handlers.clear()
    
    # Create formatter
    if json_logs:
        formatter = JsonFormatter(
            fmt="%(asctime)s %(name)s %(levelname)s %(message)s"
        )
    else:
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(getattr(logging, log_level.upper()))
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance with the specified name.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        logging.Logger: Logger instance
    """
    return logging.getLogger(f"niriksha.{name}")


class AuditLogger:
    """
    Logger for audit trail events.
    
    This logger is specifically for compliance-related audit events
    that must be logged for government inspection systems.
    """
    
    def __init__(self):
        """Initialize the audit logger."""
        self.logger = logging.getLogger("niriksha.audit")
    
    def log_inspection_created(
        self,
        inspection_id: str,
        inspector_id: str,
        site_id: str,
        user_id: str
    ) -> None:
        """
        Log inspection creation event.
        
        Args:
            inspection_id: ID of the inspection
            inspector_id: ID of the inspector
            site_id: ID of the site
            user_id: ID of the user who created it
        """
        self.logger.info(
            "Inspection created",
            extra={
                "event": "inspection_created",
                "inspection_id": inspection_id,
                "inspector_id": inspector_id,
                "site_id": site_id,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
    
    def log_inspection_status_changed(
        self,
        inspection_id: str,
        from_status: str,
        to_status: str,
        user_id: str,
        ip_address: Optional[str] = None
    ) -> None:
        """
        Log inspection status change event.
        
        Args:
            inspection_id: ID of the inspection
            from_status: Previous status
            to_status: New status
            user_id: ID of the user who changed it
            ip_address: IP address of the requester
        """
        self.logger.info(
            "Inspection status changed",
            extra={
                "event": "inspection_status_changed",
                "inspection_id": inspection_id,
                "from_status": from_status,
                "to_status": to_status,
                "user_id": user_id,
                "ip_address": ip_address,
                "timestamp": datetime.now().isoformat(),
            }
        )
    
    def log_evidence_uploaded(
        self,
        evidence_id: str,
        inspection_id: str,
        evidence_type: str,
        user_id: str
    ) -> None:
        """
        Log evidence upload event.
        
        Args:
            evidence_id: ID of the evidence
            inspection_id: ID of the inspection
            evidence_type: Type of evidence
            user_id: ID of the user who uploaded it
        """
        self.logger.info(
            "Evidence uploaded",
            extra={
                "event": "evidence_uploaded",
                "evidence_id": evidence_id,
                "inspection_id": inspection_id,
                "evidence_type": evidence_type,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
    
    def log_checklist_response_updated(
        self,
        response_id: str,
        inspection_id: str,
        is_compliant: bool,
        user_id: str
    ) -> None:
        """
        Log checklist response update event.
        
        Args:
            response_id: ID of the response
            inspection_id: ID of the inspection
            is_compliant: Whether response is compliant
            user_id: ID of the user who updated it
        """
        self.logger.info(
            "Checklist response updated",
            extra={
                "event": "checklist_response_updated",
                "response_id": response_id,
                "inspection_id": inspection_id,
                "is_compliant": is_compliant,
                "user_id": user_id,
                "timestamp": datetime.now().isoformat(),
            }
        )
    
    def log_sync_operation(
        self,
        operation_type: str,
        entity_type: str,
        entity_id: str,
        user_id: str,
        success: bool
    ) -> None:
        """
        Log sync operation event.
        
        Args:
            operation_type: Type of sync operation (push, pull)
            entity_type: Type of entity synced
            entity_id: ID of the entity
            user_id: ID of the user
            success: Whether operation was successful
        """
        self.logger.info(
            "Sync operation",
            extra={
                "event": "sync_operation",
                "operation_type": operation_type,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "user_id": user_id,
                "success": success,
                "timestamp": datetime.now().isoformat(),
            }
        )
