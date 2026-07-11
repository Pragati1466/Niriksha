"""
Celery application configuration for async task processing.
"""
import os
from celery import Celery

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "niriksha",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "api.tasks.inspection_tasks",
        "api.tasks.evidence_tasks",
        "api.tasks.ai_tasks",
    ]
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Optional: Configure task routing
celery_app.conf.task_routes = {
    "api.tasks.ai_tasks.*": {"queue": "ai"},
    "api.tasks.evidence_tasks.*": {"queue": "evidence"},
    "api.tasks.inspection_tasks.*": {"queue": "inspections"},
}
