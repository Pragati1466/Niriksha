import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { GPSValidator, GPSValidationError } from '../../lib/validators/gps'
import { inspectionsService } from '../../services/inspections'
import Button from './Button'
import Card from './Card'
import Badge from './Badge'

const GeofenceCheckIn = ({ inspectionId, siteLocation, onCheckInSuccess, onCheckInError }) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [locationError, setLocationError] = useState(null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [distance, setDistance] = useState(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState(false)

  const geofenceRadius = siteLocation?.radius || 100 // Default 100 meters

  const getCurrentLocation = async () => {
    setIsGettingLocation(true)
    setLocationError(null)

    try {
      const position = await GPSValidator.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })

      setCurrentLocation(position)

      // Calculate distance from site
      if (siteLocation?.latitude && siteLocation?.longitude) {
        const dist = GPSValidator.calculateDistance(
          position.latitude,
          position.longitude,
          siteLocation.latitude,
          siteLocation.longitude
        )
        setDistance(dist)
        setIsWithinGeofence(dist <= geofenceRadius)
      }
    } catch (error) {
      setLocationError(error.message)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handleCheckIn = async () => {
    if (!currentLocation) {
      setLocationError('Please get your current location first')
      return
    }

    if (!isWithinGeofence) {
      setLocationError(`You are ${Math.round(distance)}m away from the site. Please move within ${geofenceRadius}m to check in.`)
      return
    }

    setIsCheckingIn(true)
    setLocationError(null)

    try {
      const result = await inspectionsService.checkIn(inspectionId, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        accuracy: currentLocation.accuracy
      })

      if (onCheckInSuccess) {
        onCheckInSuccess(result)
      }
    } catch (error) {
      if (error.isValidationError) {
        setLocationError(error.message)
      } else {
        setLocationError('Failed to check in. Please try again.')
      }
      if (onCheckInError) {
        onCheckInError(error)
      }
    } finally {
      setIsCheckingIn(false)
    }
  }

  return (
    <Card>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Site Check-In
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Verify your location at the inspection site
          </p>
        </div>

        {/* Site Location Info */}
        {siteLocation && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Site Coordinates:</span>
              <span className="font-medium">
                {siteLocation.latitude.toFixed(6)}, {siteLocation.longitude.toFixed(6)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Geofence Radius:</span>
              <span className="font-medium">{geofenceRadius}m</span>
            </div>
          </div>
        )}

        {/* Current Location */}
        {currentLocation && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Current Location</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Latitude:</span>
                <span className="ml-2 font-medium">{currentLocation.latitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Longitude:</span>
                <span className="ml-2 font-medium">{currentLocation.longitude.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Accuracy:</span>
                <span className="ml-2 font-medium">±{Math.round(currentLocation.accuracy)}m</span>
              </div>
              {distance !== null && (
                <div>
                  <span className="text-muted-foreground">Distance:</span>
                  <span className="ml-2 font-medium">{Math.round(distance)}m</span>
                </div>
              )}
            </div>
            
            {/* Geofence Status */}
            {distance !== null && (
              <div className="mt-3">
                {isWithinGeofence ? (
                  <Badge variant="success" className="w-full justify-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Within Geofence
                  </Badge>
                ) : (
                  <Badge variant="error" className="w-full justify-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Outside Geofence
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {locationError && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
            <p className="text-sm text-destructive-foreground">{locationError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!currentLocation ? (
            <Button
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="w-full"
            >
              {isGettingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Get Current Location
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleCheckIn}
              disabled={isCheckingIn || !isWithinGeofence}
              className="w-full"
            >
              {isCheckingIn ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking In...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Check In
                </>
              )}
            </Button>
          )}

          {currentLocation && (
            <Button
              onClick={getCurrentLocation}
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={isGettingLocation}
            >
              Refresh Location
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}

export default GeofenceCheckIn
