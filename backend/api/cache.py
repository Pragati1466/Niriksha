"""
Redis caching layer implementation.
"""
import json
import os
from typing import Optional, Any
import redis
from functools import wraps
import hashlib

# Get Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)


def cache_key(*args, **kwargs) -> str:
    """
    Generate a cache key from function arguments.
    """
    key_data = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True)
    return hashlib.md5(key_data.encode()).hexdigest()


def cache_result(ttl: int = 300, prefix: str = ""):
    """
    Decorator to cache function results in Redis.
    
    Args:
        ttl: Time to live in seconds (default: 5 minutes)
        prefix: Key prefix for namespacing
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            key = f"{prefix}:{func.__name__}:{cache_key(*args, **kwargs)}"
            
            # Try to get from cache
            cached = redis_client.get(key)
            if cached is not None:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            redis_client.setex(key, ttl, json.dumps(result, default=str))
            
            return result
        return wrapper
    return decorator


def invalidate_cache(pattern: str):
    """
    Invalidate cache keys matching a pattern.
    
    Args:
        pattern: Redis key pattern (e.g., "inspections:*")
    """
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)


def get_cached(key: str) -> Optional[Any]:
    """
    Get a value from cache.
    
    Args:
        key: Cache key
        
    Returns:
        Cached value or None
    """
    cached = redis_client.get(key)
    if cached is not None:
        return json.loads(cached)
    return None


def set_cached(key: str, value: Any, ttl: int = 300):
    """
    Set a value in cache.
    
    Args:
        key: Cache key
        value: Value to cache
        ttl: Time to live in seconds
    """
    redis_client.setex(key, ttl, json.dumps(value, default=str))


def delete_cached(key: str):
    """
    Delete a value from cache.
    
    Args:
        key: Cache key
    """
    redis_client.delete(key)


class CacheService:
    """
    Service for managing cached data.
    """
    
    @staticmethod
    def get_inspection(inspection_id: str) -> Optional[dict]:
        """Get cached inspection data."""
        return get_cached(f"inspection:{inspection_id}")
    
    @staticmethod
    def set_inspection(inspection_id: str, data: dict, ttl: int = 300):
        """Cache inspection data."""
        set_cached(f"inspection:{inspection_id}", data, ttl)
    
    @staticmethod
    def invalidate_inspection(inspection_id: str):
        """Invalidate cached inspection data."""
        delete_cached(f"inspection:{inspection_id}")
    
    @staticmethod
    def get_compliance_stats(site_id: Optional[str] = None) -> Optional[dict]:
        """Get cached compliance stats."""
        key = f"compliance_stats:{site_id}" if site_id else "compliance_stats:global"
        return get_cached(key)
    
    @staticmethod
    def set_compliance_stats(data: dict, site_id: Optional[str] = None, ttl: int = 600):
        """Cache compliance stats."""
        key = f"compliance_stats:{site_id}" if site_id else "compliance_stats:global"
        set_cached(key, data, ttl)
    
    @staticmethod
    def invalidate_compliance_stats():
        """Invalidate all compliance stats caches."""
        invalidate_cache("compliance_stats:*")
