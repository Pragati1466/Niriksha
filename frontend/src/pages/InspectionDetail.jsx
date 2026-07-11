import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { inspectionsService } from '../services/inspections'
import { ArrowLeft, MapPin, Calendar, AlertTriangle, CheckCircle, FileText, Brain, Settings, Camera, Mic, Navigation, Upload, Send } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import GeofenceCheckIn from '../components/ui/GeofenceCheckIn'
import FileUpload from '../components/ui/FileUpload'
import TaskStatusMonitor from '../components/ui/TaskStatusMonitor'
import ConflictResolutionModal from '../components/ui/ConflictResolutionModal'

const InspectionDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showChecklist, setShowChecklist] = useState(false)
  const [taskId, setTaskId] = useState(null)
  const [conflictModal, setConflictModal] = useState({
    isOpen: false,
    conflictData: null,
    currentData: null,
    latestData: null
  })

  const { data: inspection, isLoading, error } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => inspectionsService.getInspection(id),
    enabled: !!id,
    retry: 1
  })

  const { data: timeline } = useQuery({
    queryKey: ['inspection-timeline', id],
    queryFn: () => inspectionsService.getTimeline(id),
    enabled: !!id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason, version }) => 
      inspectionsService.updateStatus(id, status, reason, version),
    onSuccess: () => {
      queryClient.invalidateQueries(['inspection', id])
      queryClient.invalidateQueries(['inspection-timeline', id])
    },
    onError: (error) => {
      if (error.isConflict) {
        setConflictModal({
          isOpen: true,
          conflictData: error,
          currentData: inspection,
          latestData: error.latestData
        })
      }
    }
  })

  const aiAnalysisMutation = useMutation({
    mutationFn: () => inspectionsService.triggerAIAnalysis(id),
    onSuccess: (data) => {
      if (data.task_id) {
        setTaskId(data.task_id)
      }
    }
  })

  const reportGenerationMutation = useMutation({
    mutationFn: () => inspectionsService.generateReport(id),
    onSuccess: (data) => {
      if (data.task_id) {
        setTaskId(data.task_id)
      }
    }
  })

  const handleStatusUpdate = (status, reason) => {
    updateStatusMutation.mutate({
      status,
      reason,
      version: inspection?.version
    })
  }

  const handleConflictResolve = (resolution) => {
    setConflictModal({ isOpen: false, conflictData: null, currentData: null, latestData: null })
    
    if (resolution.action === 'reload') {
      queryClient.invalidateQueries(['inspection', id])
    } else if (resolution.action === 'overwrite') {
      updateStatusMutation.mutate({
        status: resolution.data?.status || inspection?.status,
        reason: 'Overwriting after conflict',
        version: resolution.data?.version
      })
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'in_progress':
      case 'evidence_collection':
        return 'warning'
      case 'submitted':
      case 'under_review':
        return 'info'
      case 'cancelled':
        return 'error'
      default:
        return 'secondary'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading inspection...</p>
        </div>
      </div>
    )
  }

  if (error || !inspection) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground">
          {error?.message || 'Inspection not found'}
        </p>
        <Button
          onClick={() => navigate('/app/inspections')}
          variant="outline"
          className="mt-4"
        >
          Back to Inspections
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header - Tablet Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/inspections')}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-semibold">Inspection Details</h2>
            <p className="text-sm text-muted-foreground">{inspection.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => aiAnalysisMutation.mutate()}
            disabled={aiAnalysisMutation.isLoading}
            variant="secondary"
            size="sm"
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Analysis
          </Button>
          <Button
            onClick={() => reportGenerationMutation.mutate()}
            disabled={reportGenerationMutation.isLoading}
            variant="secondary"
            size="sm"
          >
            <FileText className="w-4 h-4 mr-2" />
            Report
          </Button>
        </div>
      </div>

      {/* Task Status Monitor */}
      {taskId && (
        <TaskStatusMonitor
          taskId={taskId}
          onComplete={() => {
            setTaskId(null)
            queryClient.invalidateQueries(['inspection', id])
          }}
          onError={() => setTaskId(null)}
        />
      )}

      {/* Status Cards - Tablet Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Badge variant={getStatusVariant(inspection.status)} className="text-xs">
              {inspection.status.replace('_', ' ')}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Priority</p>
            <p className="text-sm font-semibold capitalize">{inspection.priority}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Compliance</p>
            <p className="text-sm font-semibold">
              {inspection.compliance_score || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Violations</p>
            <p className="text-sm font-semibold">
              {inspection.violation_count || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Tablet Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted-foreground flex items-center mb-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Scheduled Date
                  </dt>
                  <dd className="text-sm">
                    {new Date(inspection.scheduled_date).toLocaleString()}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground flex items-center mb-1">
                    <MapPin className="w-3 h-3 mr-1" />
                    Location
                  </dt>
                  <dd className="text-sm">
                    {inspection.location_lat && inspection.location_lng ? (
                      `${inspection.location_lat.toFixed(6)}, ${inspection.location_lng.toFixed(6)}`
                    ) : (
                      'Not specified'
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Check-in Time</dt>
                  <dd className="text-sm">
                    {inspection.check_in_time 
                      ? new Date(inspection.check_in_time).toLocaleString() 
                      : 'Not checked in'}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs text-muted-foreground">Check-out Time</dt>
                  <dd className="text-sm">
                    {inspection.check_out_time 
                      ? new Date(inspection.check_out_time).toLocaleString() 
                      : 'Not checked out'}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-border">
                <dt className="text-xs text-muted-foreground mb-2">Checklist Progress</dt>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: inspection.total_checklist_items > 0
                          ? `${(inspection.completed_checklist_items / inspection.total_checklist_items) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium">
                    {inspection.completed_checklist_items || 0} / {inspection.total_checklist_items || 0}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <dt className="text-xs text-muted-foreground">Version</dt>
                <dd className="text-sm">v{inspection.version || 1}</dd>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {timeline && timeline.state_history && timeline.state_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>State Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {timeline.state_history.map((event, index) => (
                    <div key={event.id || index} className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {event.to_state === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-success" />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-white text-xs">{index + 1}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium truncate">
                            {event.to_state.replace('_', ' ').toUpperCase()}
                          </div>
                          <Badge variant="secondary" className="text-xs ml-2">
                            v{event.version || 'N/A'}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {event.transition_reason || 'State changed'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(event.changed_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-4">
          {/* Quick Actions - Tablet Optimized */}
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setShowCheckIn(!showCheckIn)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Navigation className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Check In</h4>
                    <p className="text-xs text-muted-foreground">Verify location</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setShowUpload(!showUpload)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Upload</h4>
                    <p className="text-xs text-muted-foreground">Add evidence</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setShowChecklist(!showChecklist)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Checklist</h4>
                    <p className="text-xs text-muted-foreground">View items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Status</h4>
                    <p className="text-xs text-muted-foreground">Change state</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Media Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="flex flex-col gap-1 h-auto py-3">
              <Camera className="w-4 h-4" />
              <span className="text-xs">Photo</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col gap-1 h-auto py-3">
              <Mic className="w-4 h-4" />
              <span className="text-xs">Voice</span>
            </Button>
            <Button variant="outline" size="sm" className="flex flex-col gap-1 h-auto py-3">
              <MapPin className="w-4 h-4" />
              <span className="text-xs">GPS</span>
            </Button>
          </div>

          {/* Submit Button */}
          <Button className="w-full" size="lg">
            <Send className="w-4 h-4 mr-2" />
            Submit Report
          </Button>
        </div>
      </div>

      {/* Geofence Check-In */}
      {showCheckIn && (
        <GeofenceCheckIn
          inspectionId={id}
          siteLocation={{
            latitude: inspection.location_lat,
            longitude: inspection.location_lng,
            radius: 100
          }}
          onCheckInSuccess={() => {
            setShowCheckIn(false)
            queryClient.invalidateQueries(['inspection', id])
          }}
          onCheckInError={(error) => console.error('Check-in error:', error)}
        />
      )}

      {/* File Upload */}
      {showUpload && (
        <FileUpload
          inspectionId={id}
          onUploadComplete={(data) => {
            setShowUpload(false)
            queryClient.invalidateQueries(['inspection', id])
          }}
          onUploadError={(error) => console.error('Upload error:', error)}
          acceptedTypes={[
            'image/jpeg',
            'image/png',
            'application/pdf'
          ]}
        />
      )}

      {/* Conflict Resolution Modal */}
      <ConflictResolutionModal
        isOpen={conflictModal.isOpen}
        onClose={() => setConflictModal({ isOpen: false, conflictData: null, currentData: null, latestData: null })}
        onResolve={handleConflictResolve}
        conflictData={conflictModal.conflictData}
        currentData={conflictModal.currentData}
        latestData={conflictModal.latestData}
      />
    </div>
  )
}

export default InspectionDetail
