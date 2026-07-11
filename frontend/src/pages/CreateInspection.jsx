import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, User, Building, FileText, AlertTriangle, Save, Send, X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const CreateInspection = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [formData, setFormData] = useState({
    inspectionType: '',
    inspectionDate: '',
    inspectorName: user?.name || '',
    location: '',
    establishment: '',
    owner: '',
    licenseNumber: '',
    riskCategory: '',
    status: 'scheduled',
    checklistTemplate: '',
    notes: ''
  })

  const inspectionTypes = [
    { value: 'food_safety', label: 'Food Safety' },
    { value: 'fire_safety', label: 'Fire Safety' },
    { value: 'factory', label: 'Factory' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'construction', label: 'Construction' },
    { value: 'pollution', label: 'Pollution' }
  ]

  const riskCategories = [
    { value: 'low', label: 'Low Risk', color: 'success' },
    { value: 'medium', label: 'Medium Risk', color: 'warning' },
    { value: 'high', label: 'High Risk', color: 'error' }
  ]

  const statuses = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'draft', label: 'Draft' }
  ]

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.inspectionType) newErrors.inspectionType = 'Inspection type is required'
    if (!formData.inspectionDate) newErrors.inspectionDate = 'Inspection date is required'
    if (!formData.inspectorName) newErrors.inspectorName = 'Inspector name is required'
    if (!formData.location) newErrors.location = 'Location is required'
    if (!formData.establishment) newErrors.establishment = 'Establishment is required'
    if (!formData.licenseNumber) newErrors.licenseNumber = 'License number is required'
    if (!formData.riskCategory) newErrors.riskCategory = 'Risk category is required'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      })
    }
  }

  const handleSaveDraft = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors above')
      return
    }

    setIsSaving(true)
    
    try {
      // Save to localStorage as draft
      const draftData = {
        ...formData,
        id: 'draft-' + Date.now(),
        createdAt: new Date().toISOString(),
        isDraft: true
      }
      
      const drafts = JSON.parse(localStorage.getItem('inspectionDrafts') || '[]')
      drafts.push(draftData)
      localStorage.setItem('inspectionDrafts', JSON.stringify(drafts))
      
      toast.success('Draft saved successfully')
      navigate('/app/history')
    } catch (error) {
      toast.error('Failed to save draft')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors above')
      return
    }

    setIsSubmitting(true)
    
    try {
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const inspectionData = {
        ...formData,
        id: 'ins-' + Date.now(),
        createdAt: new Date().toISOString(),
        createdBy: user?.id
      }
      
      // In real app, this would be: await inspectionsService.createInspection(inspectionData)
      
      toast.success('Inspection created successfully')
      navigate('/app/inspections')
    } catch (error) {
      toast.error('Failed to create inspection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (Object.keys(formData).some(key => formData[key])) {
      if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        navigate('/app')
      }
    } else {
      navigate('/app')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">Create Inspection</h2>
            <p className="text-sm text-muted-foreground">Fill in the details to create a new inspection</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || isSubmitting}
          >
            <Send className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Creating...' : 'Create Inspection'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Inspection Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Inspection Type *</label>
                <select
                  name="inspectionType"
                  value={formData.inspectionType}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.inspectionType ? 'border-destructive' : 'border-border'}`}
                  required
                >
                  <option value="">Select inspection type</option>
                  {inspectionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                {errors.inspectionType && (
                  <p className="text-xs text-destructive mt-1">{errors.inspectionType}</p>
                )}
              </div>

              {/* Inspection Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Inspection Date *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="datetime-local"
                    name="inspectionDate"
                    value={formData.inspectionDate}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.inspectionDate ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                </div>
                {errors.inspectionDate && (
                  <p className="text-xs text-destructive mt-1">{errors.inspectionDate}</p>
                )}
              </div>

              {/* Inspector Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Inspector Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    name="inspectorName"
                    value={formData.inspectorName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.inspectorName ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                </div>
                {errors.inspectorName && (
                  <p className="text-xs text-destructive mt-1">{errors.inspectorName}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2">Location *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Enter address or coordinates"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.location ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-destructive mt-1">{errors.location}</p>
                )}
              </div>

              {/* Establishment */}
              <div>
                <label className="block text-sm font-medium mb-2">Establishment *</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    name="establishment"
                    value={formData.establishment}
                    onChange={handleChange}
                    placeholder="Name of the establishment"
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.establishment ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                </div>
                {errors.establishment && (
                  <p className="text-xs text-destructive mt-1">{errors.establishment}</p>
                )}
              </div>

              {/* Owner */}
              <div>
                <label className="block text-sm font-medium mb-2">Owner</label>
                <input
                  type="text"
                  name="owner"
                  value={formData.owner}
                  onChange={handleChange}
                  placeholder="Owner name"
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              {/* License Number */}
              <div>
                <label className="block text-sm font-medium mb-2">License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="License or permit number"
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.licenseNumber ? 'border-destructive' : 'border-border'}`}
                  required
                />
                {errors.licenseNumber && (
                  <p className="text-xs text-destructive mt-1">{errors.licenseNumber}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Risk Category */}
              <div>
                <label className="block text-sm font-medium mb-2">Risk Category *</label>
                <div className="flex gap-2">
                  {riskCategories.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => handleChange({ target: { name: 'riskCategory', value: category.value } })}
                      className={`flex-1 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                        formData.riskCategory === category.value
                          ? `border-${category.color} bg-${category.color}/10 text-${category.color}`
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                {errors.riskCategory && (
                  <p className="text-xs text-destructive mt-1">{errors.riskCategory}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Checklist Template */}
              <div>
                <label className="block text-sm font-medium mb-2">Checklist Template</label>
                <select
                  name="checklistTemplate"
                  value={formData.checklistTemplate}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                >
                  <option value="">Select template (optional)</option>
                  <option value="standard">Standard Checklist</option>
                  <option value="comprehensive">Comprehensive Checklist</option>
                  <option value="quick">Quick Inspection</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes or observations..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium">
                  {inspectionTypes.find(t => t.value === formData.inspectionType)?.label || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {formData.inspectionDate ? new Date(formData.inspectionDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Risk</span>
                {formData.riskCategory && (
                  <Badge variant={riskCategories.find(r => r.value === formData.riskCategory)?.color}>
                    {riskCategories.find(r => r.value === formData.riskCategory)?.label}
                  </Badge>
                )}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{formData.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Select the appropriate inspection type to auto-generate checklist</p>
              <p>• High risk inspections require immediate attention</p>
              <p>• Save drafts to continue later</p>
              <p>• All fields marked with * are required</p>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/history')}>
                <FileText className="w-4 h-4 mr-2" />
                View Drafts
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/app/inspections')}>
                <FileText className="w-4 h-4 mr-2" />
                View Inspections
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CreateInspection
