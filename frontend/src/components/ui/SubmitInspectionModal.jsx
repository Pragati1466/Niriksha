import React, { useState } from 'react'
import { AlertTriangle, CheckCircle, FileText, Image as ImageIcon, MapPin, Clock, Brain, Loader2, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './Card'
import Button from './Button'
import Badge from './Badge'
import { getChecklistProgress } from '../../lib/checklistTemplates'
import draftManager from '../../lib/draftManager'

const SubmitInspectionModal = ({ inspectionData, checklistTemplate, onSubmit, onCancel }) => {
  const [isValidating, setIsValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [aiProcessing, setAiProcessing] = useState(false)

  const validateInspection = () => {
    const errors = []

    // Check required fields
    if (!inspectionData.inspectionType) {
      errors.push({ field: 'Inspection Type', message: 'Inspection type is required' })
    }
    if (!inspectionData.inspectionDate) {
      errors.push({ field: 'Inspection Date', message: 'Inspection date is required' })
    }
    if (!inspectionData.location) {
      errors.push({ field: 'Location', message: 'Location is required' })
    }
    if (!inspectionData.establishment) {
      errors.push({ field: 'Establishment', message: 'Establishment name is required' })
    }

    // Check checklist completion
    if (checklistTemplate) {
      const progress = getChecklistProgress(inspectionData.checklistResponses, checklistTemplate)
      if (progress < 100) {
        errors.push({
          field: 'Checklist',
          message: `Checklist is ${Math.round(progress)}% complete. Please complete all required items.`
        })
      }
    }

    // Check evidence
    if (!inspectionData.evidence || inspectionData.evidence.length === 0) {
      errors.push({
        field: 'Evidence',
        message: 'At least one evidence file is required'
      })
    }

    // Check GPS location
    if (!inspectionData.metadata?.gpsLocation) {
      errors.push({
        field: 'GPS Location',
        message: 'GPS location capture is required for verification'
      })
    }

    return errors
  }

  const handleValidate = () => {
    setIsValidating(true)
    
    setTimeout(() => {
      const errors = validateInspection()
      setValidationErrors(errors)
      setIsValidating(false)
    }, 500)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      // Remove draft flag
      const finalData = {
        ...inspectionData,
        isDraft: false,
        submittedAt: new Date().toISOString(),
        status: 'submitted'
      }

      // Submit to backend
      await onSubmit(finalData)

      // Remove from drafts if it exists
      if (inspectionData.id && inspectionData.id.startsWith('draft-')) {
        draftManager.deleteDraft(inspectionData.id)
      }

      // Show success
      setShowSuccess(true)

      // Simulate AI processing
      setTimeout(() => {
        setAiProcessing(true)
        setTimeout(() => {
          setAiProcessing(false)
          // Redirect will be handled by parent component
        }, 3000)
      }, 1000)

    } catch (error) {
      console.error('Submission error:', error)
      setValidationErrors([
        { field: 'Submission', message: 'Failed to submit inspection. Please try again.' }
      ])
      setIsSubmitting(false)
    }
  }

  const checklistProgress = checklistTemplate 
    ? getChecklistProgress(inspectionData.checklistResponses, checklistTemplate)
    : 0

  const hasErrors = validationErrors.length > 0
  const canSubmit = !hasErrors && !isValidating && !isSubmitting

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Inspection Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Your inspection has been successfully submitted and is now being processed.
            </p>
            
            {aiProcessing && (
              <div className="flex items-center justify-center gap-2 text-sm text-primary mb-6">
                <Brain className="w-4 h-4 animate-pulse" />
                <span>AI analysis in progress...</span>
              </div>
            )}
            
            <Button onClick={onCancel} className="w-full">
              View Inspection History
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Submit Inspection</CardTitle>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Validation Status */}
          {hasErrors && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Please fix the following issues:</span>
              </div>
              <ul className="space-y-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-destructive">•</span>
                    <span>
                      <strong>{error.field}:</strong> {error.message}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Inspection Summary */}
          <div className="space-y-4">
            <h4 className="font-medium">Inspection Summary</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{inspectionData.inspectionType || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium truncate">{inspectionData.location || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Date:</span>
                <span className="font-medium">
                  {inspectionData.inspectionDate ? new Date(inspectionData.inspectionDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Evidence:</span>
                <span className="font-medium">{inspectionData.evidence?.length || 0} files</span>
              </div>
            </div>
          </div>

          {/* Checklist Progress */}
          {checklistTemplate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Checklist Completion</h4>
                <Badge variant={checklistProgress === 100 ? 'success' : 'warning'}>
                  {Math.round(checklistProgress)}%
                </Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    checklistProgress === 100 ? 'bg-success' : 'bg-warning'
                  }`}
                  style={{ width: `${checklistProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* GPS Status */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">GPS Location</span>
            </div>
            {inspectionData.metadata?.gpsLocation ? (
              <Badge variant="success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Captured
              </Badge>
            ) : (
              <Badge variant="warning">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not Captured
              </Badge>
            )}
          </div>

          {/* AI Processing Notice */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-sm mb-1">AI Analysis</h4>
                <p className="text-xs text-muted-foreground">
                  After submission, your inspection will be analyzed by our AI system to identify risks, 
                  generate recommendations, and provide compliance insights.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            {hasErrors ? (
              <Button
                onClick={handleValidate}
                disabled={isValidating}
                className="flex-1"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Re-validate
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Submit Inspection
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SubmitInspectionModal
