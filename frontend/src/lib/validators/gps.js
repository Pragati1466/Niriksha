/**
 * GPS coordinate validation utilities for frontend.
 */

class GPSValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GPSValidationError'
  }
}

class GPSValidator {
  static LATITUDE_MIN = -90.0
  static LATITUDE_MAX = 90.0
  static LONGITUDE_MIN = -180.0
  static LONGITUDE_MAX = 180.0
  static MAX_ACCURACY_METERS = 1000.0
  static MIN_ACCURACY_METERS = 0.0

  static validateLatitude(latitude) {
    if (latitude === null || latitude === undefined) {
      throw new GPSValidationError('Latitude cannot be empty')
    }

    const lat = parseFloat(latitude)
    if (isNaN(lat)) {
      throw new GPSValidationError('Invalid latitude format')
    }

    if (lat < this.LATITUDE_MIN || lat > this.LATITUDE_MAX) {
      throw new GPSValidationError(
        `Latitude must be between ${this.LATITUDE_MIN} and ${this.LATITUDE_MAX}. Got: ${lat}`
      )
    }

    // Check precision (max 8 decimal places)
    const decimalPlaces = latitude.toString().split('.')[1]?.length || 0
    if (decimalPlaces > 8) {
      throw new GPSValidationError('Latitude precision too high. Maximum 8 decimal places allowed')
    }

    return lat
  }

  static validateLongitude(longitude) {
    if (longitude === null || longitude === undefined) {
      throw new GPSValidationError('Longitude cannot be empty')
    }

    const lng = parseFloat(longitude)
    if (isNaN(lng)) {
      throw new GPSValidationError('Invalid longitude format')
    }

    if (lng < this.LONGITUDE_MIN || lng > this.LONGITUDE_MAX) {
      throw new GPSValidationError(
        `Longitude must be between ${this.LONGITUDE_MIN} and ${this.LONGITUDE_MAX}. Got: ${lng}`
      )
    }

    // Check precision (max 8 decimal places)
    const decimalPlaces = longitude.toString().split('.')[1]?.length || 0
    if (decimalPlaces > 8) {
      throw new GPSValidationError('Longitude precision too high. Maximum 8 decimal places allowed')
    }

    return lng
  }

  static validateAccuracy(accuracy) {
    if (accuracy === null || accuracy === undefined) {
      throw new GPSValidationError('Accuracy cannot be empty')
    }

    const acc = parseFloat(accuracy)
    if (isNaN(acc)) {
      throw new GPSValidationError('Invalid accuracy format')
    }

    if (acc < this.MIN_ACCURACY_METERS || acc > this.MAX_ACCURACY_METERS) {
      throw new GPSValidationError(
        `Accuracy must be between ${this.MIN_ACCURACY_METERS} and ${this.MAX_ACCURACY_METERS} meters. Got: ${acc}`
      )
    }

    return acc
  }

  static validateCoordinates(latitude, longitude, accuracy = null) {
    const validatedLat = this.validateLatitude(latitude)
    const validatedLng = this.validateLongitude(longitude)
    const validatedAcc = accuracy ? this.validateAccuracy(accuracy) : null

    return {
      latitude: validatedLat,
      longitude: validatedLng,
      accuracy: validatedAcc
    }
  }

  // Haversine formula for distance calculation
  static calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000 // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  static isWithinGeofence(lat1, lng1, lat2, lng2, radiusMeters) {
    const distance = this.calculateDistance(lat1, lng1, lat2, lng2)
    return distance <= radiusMeters
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  // Get current GPS position
  static getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new GPSValidationError('Geolocation is not supported by your browser'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new GPSValidationError('User denied the request for geolocation'))
              break
            case error.POSITION_UNAVAILABLE:
              reject(new GPSValidationError('Location information is unavailable'))
              break
            case error.TIMEOUT:
              reject(new GPSValidationError('The request to get user location timed out'))
              break
            default:
              reject(new GPSValidationError('An unknown error occurred getting location'))
          }
        },
        { ...defaultOptions, ...options }
      )
    })
  }
}

export { GPSValidator, GPSValidationError }
