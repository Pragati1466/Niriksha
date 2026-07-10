"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Base Repository Tests

Description:
    This module contains unit tests for the BaseRepository class,
    testing CRUD operations and filtering functionality.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

import pytest
from uuid import uuid4
from sqlalchemy.orm import Session

from ..database.models.base import Base
from ..repositories.base_repository import BaseRepository


class MockModel(Base):
    """Mock model for testing."""
    
    __tablename__ = "mock_models"
    
    def __init__(self, id=None, name=None, value=None):
        self.id = id or uuid4()
        self.name = name
        self.value = value
    
    def to_dict(self):
        """Convert to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "value": self.value
        }


@pytest.fixture
def mock_session():
    """Create a mock database session."""
    # In a real test, this would use an in-memory database
    # For now, we'll create a simple mock
    class MockSession:
        def __init__(self):
            self.data = {}
        
        def add(self, item):
            self.data[str(item.id)] = item
        
        def commit(self):
            pass
        
        def refresh(self, item):
            pass
        
        def rollback(self):
            pass
        
        def flush(self):
            pass
    
    return MockSession()


@pytest.fixture
def base_repository(mock_session):
    """Create a BaseRepository instance for testing."""
    return BaseRepository(MockModel, mock_session)


class TestBaseRepository:
    """Test cases for BaseRepository."""
    
    def test_create_repository(self, base_repository):
        """Test repository initialization."""
        assert base_repository.model == MockModel
        assert base_repository.session is not None
    
    def test_create_entity(self, base_repository, mock_session):
        """Test creating an entity."""
        entity = MockModel(name="Test", value=42)
        result = base_repository.create(entity)
        
        assert result is not None
        assert result.name == "Test"
        assert result.value == 42
    
    def test_get_by_id(self, base_repository, mock_session):
        """Test getting an entity by ID."""
        entity_id = uuid4()
        entity = MockModel(id=entity_id, name="Test", value=42)
        mock_session.add(entity)
        mock_session.commit()
        
        # Mock the get method
        base_repository.session.data = {str(entity_id): entity}
        
        result = base_repository.get(entity_id)
        assert result is not None
    
    def test_get_all(self, base_repository):
        """Test getting all entities."""
        result = base_repository.get_all(skip=0, limit=10)
        assert isinstance(result, list)
    
    def test_update_entity(self, base_repository, mock_session):
        """Test updating an entity."""
        entity = MockModel(name="Test", value=42)
        mock_session.add(entity)
        mock_session.commit()
        
        entity.name = "Updated"
        result = base_repository.update(entity)
        
        assert result.name == "Updated"
    
    def test_delete_entity(self, base_repository, mock_session):
        """Test deleting an entity."""
        entity = MockModel(name="Test", value=42)
        mock_session.add(entity)
        
        result = base_repository.delete(entity)
        assert result is True
    
    def test_count(self, base_repository):
        """Test counting entities."""
        result = base_repository.count()
        assert isinstance(result, int)
    
    def test_exists(self, base_repository):
        """Test checking if entity exists."""
        result = base_repository.exists(uuid4())
        assert isinstance(result, bool)
    
    def test_find_by_field(self, base_repository):
        """Test finding entities by field."""
        result = base_repository.find_by_field("name", "Test")
        assert isinstance(result, list)
    
    def test_find_by_fields(self, base_repository):
        """Test finding entities by multiple fields."""
        result = base_repository.find_by_fields({"name": "Test", "value": 42})
        assert isinstance(result, list)
