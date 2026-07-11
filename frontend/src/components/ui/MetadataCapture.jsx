import React, { useState, useEffect } from 'react'
import { MapPin, Clock, Smartphone, User, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from './Card'
import Button from './Button'
import Badge from './Badge'

const MetadataCapture = ({ inspectionId, onMetadataUpdate, initialMetadata = {} }) => {
  const [metadata, setMetadata] = useState({
    timestamp: initialMetadata.timestamp || new Date().toISOString(),
    gpsLocation: initialMetadata.gpsLocation || null,
    deviceInfo: initialMetadata.deviceInfo || null,
    inspectionDuration: initialMetadata.inspectionDuration || 0,
    inspectorName: initialMetadata.inspectorName || '',
    accuracy: initialMetadata.accuracy || null
  })
  const [isCapturing, setIsCapturing] = useState(false)
  const [captureStatus, setCaptureStatus] = useState(null)

  useEffect(() => {
    // Capture device info on mount
    captureDeviceInfo()
    
    // Start duration timer
    const durationInterval = setInterval(() => {
      setMetadata(prev => ({
        ...prev,
        inspectionDuration: prev.inspectionDuration + 1
      }))
    }, 1000)

    return () => clearInterval(durationInterval)
  }, [])

  useEffect(() => {
    // Auto-update parent when metadata changes
    if (onMetadataUpdate) {
      onMetadataUpdate(metadata)
    }
  }, [metadata, onMetadataUpdate])

  const captureDeviceInfo = () => {
    const deviceInfo = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      vendor: navigator.vendor
    }

    setMetadata(prev => ({
      ...prev,
      deviceInfo
    }))
  }

  const captureGPSLocation = async () => {
    setIsCapturing(true)
    setCaptureStatus('capturing')

    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'))
          return
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      })

      const locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }

      setMetadata(prev => ({
        ...prev,
        gpsLocation: locationData,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      }))

      setCaptureStatus('success')
      setTimeout(() => setCaptureStatus(null), 3000)
    } catch (error) {
      console.error('GPS capture error:', error)
      setCaptureStatus('error')
      setTimeout(() => setCaptureStatus(null), 3000)
    } finally {
      setIsCapturing(false)
    }
  }

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTimestamp = (isoString) => {
    return new Date(isoString).toLocaleString()
  }

  const getDeviceType = () => {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'Mobile'
    if (/tablet/i.test(ua)) return 'Tablet'
    if (/iPad/i.test(ua)) return 'Tablet'
    return 'Desktop'
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Inspection Metadata</h3>

      {/* GPS Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              GPS Location
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={captureGPSLocation}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {captureStatus === 'capturing' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Acquiring GPS location...</span>
            </div>
          )}

          {captureStatus === 'success' && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="w-4 h-4" />
              <span>Location captured successfully</span>
            </div>
          )}

          {captureStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to capture location. Please try again.</span>
            </div>
          )}

          {metadata.gpsLocation ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Latitude:</span>
                  <span className="ml-2 font-medium">{metadata.gpsLocation.latitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Longitude:</span>
                  <span className="ml-2 font-medium">{metadata.gpsLocation.longitude.toFixed(6)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Accuracy:</span>
                  <span className="ml-2 font-medium">±{metadata.accuracy?.toFixed(1)}m</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Altitude:</span>
                  <span className="ml-2 font-medium">
                    {metadata.gpsLocation.altitude ? `${metadata.gpsLocation.altitude.toFixed(1)}m` : 'N/A'}
                  </span>
                </div>
              </div>
              <Badge variant={metadata.accuracy && metadata.accuracy < 10 ? 'success' : 'warning'}>
                {metadata.accuracy && metadata.accuracy < 10 ? 'High Accuracy' : 'Moderate Accuracy'}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No GPS location captured yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Timestamp & Duration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4" />
            Time Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Start Time:</span>
              <span className="ml-2 font-medium">{formatTimestamp(metadata.timestamp)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(metadata.inspectionDuration)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="w-4 h-4" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metadata.deviceInfo ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Device Type:</span>
                <span className="ml-2 font-medium">{getDeviceType()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Platform:</span>
                <span className="ml-2 font-medium">{metadata.deviceInfo.platform}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Language:</span>
                <span className="ml-2 font-medium">{metadata.deviceInfo.language}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Screen:</span>
                <span className="ml-2 font-medium">
                  {metadata.deviceInfo.screenWidth}x{metadata.deviceInfo.screenHeight}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Device information not available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inspector Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="w-4 h-4" />
            Inspector Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="text"
            value={metadata.inspectorName}
            onChange={(e) => setMetadata(prev => ({ ...prev, inspectorName: e.target.value }))}
            placeholder="Enter inspector name"
            className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </CardContent>
      </Card>

      {/* Metadata Summary */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="text-sm font-medium mb-2">Metadata Summary</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            {metadata.gpsLocation ? (
              <CheckCircle className="w-3 h-3 text-success" />
            ) : (
              <AlertCircle className="w-3 h-3 text-warning" />
            )}
            <span>GPS Location</span>
          </div>
          <div className="flex items-center gap-2">
            {metadata.deviceInfo ? (
              <CheckCircle className="w-3 h-3 text-success" />
            ) : (
              <AlertCircle className="w-3 h-3 text-warning" />
            )}
            <span>Device Info</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-success" />
            <span>Timestamp</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-success" />
            <span>Duration Tracking</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MetadataCapture
