"""
NIRIKSHA - Inspection Workflow & Data Collection Module
Inspection Location Log Model

Description:
    This module defines the InspectionLocationLog model for tracking
    inspector location updates during inspections for route verification,
    safety, and compliance.

Author: NIRIKSHA Development Team
Date: 2026-07-10
Version: 1.0.0
"""

from decimal import Decimal
from typing import Optional
from uuid import UUID

from sqlalchemy import String, Numeric, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import BaseModel


class LocationSource:
    """
    Enumeration of location data sources.
    
    Location data can come from different sources with varying accuracy
    and reliability.
    """
    GPS = "gps"
    NETWORK = "network"
    PASSIVE = "passive"
    
    @classmethod
    def all(cls) -> list[str]:
        """Return all valid location source values."""
        return [cls.GPS, cls.NETWORK, cls.PASSIVE]
    
    @classmethod
    def get_accuracy(cls, source: str) -> str:
        """
        Get expected accuracy level for location source.
        
        Args:
            source: Location source
            
        Returns:
            str: Accuracy level (high, medium, low)
        """
        accuracy_map = {
            cls.GPS: "high",
            cls.NETWORK: "medium",
            cls.PASSIVE: "low",
        }
        return accuracy_map.get(source, "unknown")


class InspectionLocationLog(BaseModel):
    """
    Model for tracking inspector location updates during inspections.
    
    Safety and compliance require tracking inspector movement. This logs
    GPS coordinates during inspections for verification, route optimization,
    and safety monitoring.
    
    Attributes:
        inspection_id: ID of the inspection
        latitude: GPS latitude
        longitude: GPS longitude
        accuracy: GPS accuracy in meters
        altitude: Altitude in meters
        speed: Speed in m/s
        heading: Heading in degrees
        location_source: Source of location data (gps, network, passive)
        is_at_site: Whether location is within site geofence
        distance_from_site: Distance from site in meters
        device_id: Device that recorded location
        recorded_at: When location was recorded
    """
    
    __tablename__ = "inspection_location_log"
    
    # Foreign Key
    inspection_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        nullable=False,
        index=True,
        doc="ID of the inspection"
    )
    
    # GPS Data
    latitude: Mapped[Decimal] = mapped_column(
        Numeric(10, 8),
        nullable=False,
        doc="GPS latitude (8 decimal places ~1mm precision)"
    )
    
    longitude: Mapped[Decimal] = mapped_column(
        Numeric(11, 8),
        nullable=False,
        doc="GPS longitude (8 decimal places ~1mm precision)"
    )
    
    accuracy: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="GPS accuracy in meters"
    )
    
    altitude: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        doc="Altitude in meters"
    )
    
    speed: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="Speed in m/s"
    )
    
    heading: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(5, 2),
        nullable=True,
        doc="Heading in degrees"
    )
    
    # Location Source
    location_source: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        doc="Source of location data (gps, network, passive)"
    )
    
    # Geofence Status
    is_at_site: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True,
        doc="Whether location is within site geofence"
    )
    
    distance_from_site: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(10, 2),
        nullable=True,
        doc="Distance from site in meters"
    )
    
    # Device and Timing
    device_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        doc="Device that recorded location"
    )
    
    recorded_at: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True,
        doc="When location was recorded"
    )
    
    # Table constraints
    __table_args__ = (
        CheckConstraint(
            f"location_source IN {tuple(LocationSource.all())}",
            name="chk_location_source"
        ),
    )
    
    def has_high_accuracy(self, threshold_meters: float = 10.0) -> bool:
        """
        Check if location has high accuracy.
        
        Args:
            threshold_meters: Accuracy threshold in meters
            
        Returns:
            bool: True if accuracy is above threshold, False otherwise
        """
        if self.accuracy is None:
            return False
        return float(self.accuracy) <= threshold_meters
    
    def is_gps_source(self) -> bool:
        """
        Check if location source is GPS.
        
        Returns:
            bool: True if GPS source, False otherwise
        """
        return self.location_source == LocationSource.GPS
    
    def get_coordinates(self) -> tuple[float, float]:
        """
        Get coordinates as a tuple.
        
        Returns:
            tuple[float, float]: (latitude, longitude)
        """
        return (float(self.latitude), float(self.longitude))
    
    def calculate_distance_to(self, other_lat: Decimal, other_lng: Decimal) -> float:
        """
        Calculate distance to another point using Haversine formula.
        
        Args:
            other_lat: Latitude of other point
            other_lng: Longitude of other point
            
        Returns:
            float: Distance in kilometers
        """
        import math
        
        # Convert to radians
        lat1 = math.radians(float(self.latitude))
        lat2 = math.radians(float(other_lat))
        lng1 = math.radians(float(self.longitude))
        lng2 = math.radians(float(other_lng))
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng / 2) ** 2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth's radius in kilometers
        r = 6371
        return c * r
    
    def is_moving(self, speed_threshold: float = 1.0) -> bool:
        """
        Check if inspector is moving based on speed.
        
        Args:
            speed_threshold: Speed threshold in m/s
            
        Returns:
            bool: True if moving, False otherwise
        """
        if self.speed is None:
            return False
        return float(self.speed) > speed_threshold
    
    def get_accuracy_level(self) -> str:
        """
        Get accuracy level based on accuracy value.
        
        Returns:
            str: Accuracy level (high, medium, low, unknown)
        """
        if self.accuracy is None:
            return "unknown"
        
        accuracy_meters = float(self.accuracy)
        if accuracy_meters <= 10:
            return "high"
        elif accuracy_meters <= 50:
            return "medium"
        else:
            return "low"
    
    def __repr__(self) -> str:
        """String representation with key information."""
        return (
            f"InspectionLocationLog(id={self.id}, "
            f"inspection_id={self.inspection_id}, "
            f"latitude={self.latitude}, "
            f"longitude={self.longitude}, "
            f"is_at_site={self.is_at_site})"
        )
