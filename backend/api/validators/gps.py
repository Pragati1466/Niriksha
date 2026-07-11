"""
GPS coordinate validation utilities.
"""
from decimal import Decimal, InvalidOperation
from typing import Optional, Tuple
import re


class GPSValidationError(Exception):
    """Exception raised for GPS validation errors."""
    pass


class GPSValidator:
    """
    Validator for GPS coordinates.
    
    Validates latitude, longitude, and accuracy values according to
    standard GPS specifications and business requirements.
    """
    
    # Valid ranges for coordinates
    LATITUDE_MIN = -90.0
    LATITUDE_MAX = 90.0
    LONGITUDE_MIN = -180.0
    LONGITUDE_MAX = 180.0
    
    # Maximum acceptable accuracy in meters
    MAX_ACCURACY_METERS = 1000.0
    
    # Minimum acceptable accuracy in meters (for reasonable GPS)
    MIN_ACCURACY_METERS = 0.0
    
    @staticmethod
    def validate_latitude(latitude: Optional[float | str | Decimal]) -> Decimal:
        """
        Validate latitude coordinate.
        
        Args:
            latitude: Latitude value (float, string, or Decimal)
            
        Returns:
            Decimal: Validated latitude as Decimal
            
        Raises:
            GPSValidationError: If latitude is invalid
        """
        if latitude is None:
            raise GPSValidationError("Latitude cannot be None")
        
        try:
            # Convert to Decimal for precision
            lat_decimal = Decimal(str(latitude))
        except (InvalidOperation, ValueError):
            raise GPSValidationError(f"Invalid latitude format: {latitude}")
        
        # Check range
        if not (GPSValidator.LATITUDE_MIN <= float(lat_decimal) <= GPSValidator.LATITUDE_MAX):
            raise GPSValidationError(
                f"Latitude must be between {GPSValidator.LATITUDE_MIN} and {GPSValidator.LATITUDE_MAX}. "
                f"Got: {lat_decimal}"
            )
        
        # Check precision (max 8 decimal places ~1mm precision)
        if abs(lat_decimal.as_tuple().exponent) > 8:
            raise GPSValidationError(
                f"Latitude precision too high. Maximum 8 decimal places allowed. "
                f"Got: {lat_decimal}"
            )
        
        return lat_decimal
    
    @staticmethod
    def validate_longitude(longitude: Optional[float | str | Decimal]) -> Decimal:
        """
        Validate longitude coordinate.
        
        Args:
            longitude: Longitude value (float, string, or Decimal)
            
        Returns:
            Decimal: Validated longitude as Decimal
            
        Raises:
            GPSValidationError: If longitude is invalid
        """
        if longitude is None:
            raise GPSValidationError("Longitude cannot be None")
        
        try:
            # Convert to Decimal for precision
            lng_decimal = Decimal(str(longitude))
        except (InvalidOperation, ValueError):
            raise GPSValidationError(f"Invalid longitude format: {longitude}")
        
        # Check range
        if not (GPSValidator.LONGITUDE_MIN <= float(lng_decimal) <= GPSValidator.LONGITUDE_MAX):
            raise GPSValidationError(
                f"Longitude must be between {GPSValidator.LONGITUDE_MIN} and {GPSValidator.LONGITUDE_MAX}. "
                f"Got: {lng_decimal}"
            )
        
        # Check precision (max 8 decimal places ~1mm precision)
        if abs(lng_decimal.as_tuple().exponent) > 8:
            raise GPSValidationError(
                f"Longitude precision too high. Maximum 8 decimal places allowed. "
                f"Got: {lng_decimal}"
            )
        
        return lng_decimal
    
    @staticmethod
    def validate_accuracy(accuracy: Optional[float | str | Decimal]) -> Decimal:
        """
        Validate GPS accuracy in meters.
        
        Args:
            accuracy: Accuracy value in meters
            
        Returns:
            Decimal: Validated accuracy as Decimal
            
        Raises:
            GPSValidationError: If accuracy is invalid
        """
        if accuracy is None:
            raise GPSValidationError("Accuracy cannot be None")
        
        try:
            # Convert to Decimal
            acc_decimal = Decimal(str(accuracy))
        except (InvalidOperation, ValueError):
            raise GPSValidationError(f"Invalid accuracy format: {accuracy}")
        
        # Check range
        if not (GPSValidator.MIN_ACCURACY_METERS <= float(acc_decimal) <= GPSValidator.MAX_ACCURACY_METERS):
            raise GPSValidationError(
                f"Accuracy must be between {GPSValidator.MIN_ACCURACY_METERS} and "
                f"{GPSValidator.MAX_ACCURACY_METERS} meters. Got: {acc_decimal}"
            )
        
        return acc_decimal
    
    @staticmethod
    def validate_coordinates(
        latitude: Optional[float | str | Decimal],
        longitude: Optional[float | str | Decimal],
        accuracy: Optional[float | str | Decimal] = None
    ) -> Tuple[Decimal, Decimal, Optional[Decimal]]:
        """
        Validate complete GPS coordinates.
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            accuracy: Optional accuracy in meters
            
        Returns:
            Tuple[Decimal, Decimal, Optional[Decimal]]: Validated (lat, lng, accuracy)
            
        Raises:
            GPSValidationError: If any coordinate is invalid
        """
        validated_lat = GPSValidator.validate_latitude(latitude)
        validated_lng = GPSValidator.validate_longitude(longitude)
        validated_acc = GPSValidator.validate_accuracy(accuracy) if accuracy else None
        
        return (validated_lat, validated_lng, validated_acc)
    
    @staticmethod
    def is_within_geofence(
        lat1: Decimal,
        lng1: Decimal,
        lat2: Decimal,
        lng2: Decimal,
        radius_meters: float
    ) -> bool:
        """
        Check if a point is within a geofence radius using Haversine formula.
        
        Args:
            lat1: First point latitude
            lng1: First point longitude
            lat2: Second point latitude
            lng2: Second point longitude
            radius_meters: Geofence radius in meters
            
        Returns:
            bool: True if within radius, False otherwise
        """
        from math import radians, sin, cos, sqrt, asin
        
        # Convert to radians
        lat1_rad = radians(float(lat1))
        lng1_rad = radians(float(lng1))
        lat2_rad = radians(float(lat2))
        lng2_rad = radians(float(lng2))
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng / 2) ** 2
        c = 2 * asin(sqrt(a))
        
        # Earth's radius in meters
        earth_radius = 6371000
        
        distance = earth_radius * c
        
        return distance <= radius_meters
    
    @staticmethod
    def calculate_distance(
        lat1: Decimal,
        lng1: Decimal,
        lat2: Decimal,
        lng2: Decimal
    ) -> float:
        """
        Calculate distance between two points using Haversine formula.
        
        Args:
            lat1: First point latitude
            lng1: First point longitude
            lat2: Second point latitude
            lng2: Second point longitude
            
        Returns:
            float: Distance in meters
        """
        from math import radians, sin, cos, sqrt, asin
        
        # Convert to radians
        lat1_rad = radians(float(lat1))
        lng1_rad = radians(float(lng1))
        lat2_rad = radians(float(lat2))
        lng2_rad = radians(float(lng2))
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = sin(dlat / 2) ** 2 + cos(lat1_rad) * cos(lat2_rad) * sin(dlng / 2) ** 2
        c = 2 * asin(sqrt(a))
        
        # Earth's radius in meters
        earth_radius = 6371000
        
        return earth_radius * c
    
    @staticmethod
    def parse_coordinate_string(coord_str: str) -> Tuple[float, float]:
        """
        Parse coordinate string in various formats.
        
        Supported formats:
        - "40.7128,-74.0060" (lat,lng)
        - "40.7128, -74.0060" (with space)
        - "40°42'46\"N 74°0'21\"W" (DMS format)
        
        Args:
            coord_str: Coordinate string
            
        Returns:
            Tuple[float, float]: (latitude, longitude)
            
        Raises:
            GPSValidationError: If string cannot be parsed
        """
        # Try simple decimal format first
        decimal_pattern = r'^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$'
        match = re.match(decimal_pattern, coord_str.strip())
        
        if match:
            try:
                lat = float(match.group(1))
                lng = float(match.group(2))
                return (lat, lng)
            except ValueError:
                pass
        
        # Try DMS format (simplified)
        dms_pattern = r'(\d+)°(\d+)\'([\d\.]+)"([NS])\s+(\d+)°(\d+)\'([\d\.]+)"([EW])'
        match = re.match(dms_pattern, coord_str.strip())
        
        if match:
            try:
                lat_deg = float(match.group(1))
                lat_min = float(match.group(2))
                lat_sec = float(match.group(3))
                lat_dir = match.group(4)
                
                lng_deg = float(match.group(5))
                lng_min = float(match.group(6))
                lng_sec = float(match.group(7))
                lng_dir = match.group(8)
                
                # Convert to decimal
                lat_decimal = lat_deg + lat_min / 60 + lat_sec / 3600
                lng_decimal = lng_deg + lng_min / 60 + lng_sec / 3600
                
                # Apply direction
                if lat_dir == 'S':
                    lat_decimal = -lat_decimal
                if lng_dir == 'W':
                    lng_decimal = -lng_decimal
                
                return (lat_decimal, lng_decimal)
            except ValueError:
                pass
        
        raise GPSValidationError(f"Cannot parse coordinate string: {coord_str}")
