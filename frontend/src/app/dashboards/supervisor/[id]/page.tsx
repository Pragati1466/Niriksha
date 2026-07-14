'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Inspection, InspectionChecklist } from '@/types'
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge'
import { VerificationFindingsPanel } from '@/components/inspections/verification-findings-panel'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, FileText, Camera, ShieldCheck, User, Calendar, MapPin, MessageSquare, Send, TrendingUp, Download } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { triggerDownload } from '@/lib/api-client'

export default function SupervisorInspectionDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const searchParams = useSearchParams()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [requestEvidenceDialogOpen, setRequestEvidenceDialogOpen] = useState(false)
  const [editReportDialogOpen, setEditReportDialogOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [evidenceRequest, setEvidenceRequest] = useState('')
  const [reviewNote, setReviewNote] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Open edit report dialog if navigated with ?editReport=true
  useEffect(() => {
    if (!loading && inspection && searchParams.get('editReport') === 'true') {
      const aiContent = typeof inspection.aiAnalysis === 'string' ? inspection.aiAnalysis : ''
      setReportContent(aiContent)
      setEditReportDialogOpen(true)
    }
  }, [loading, inspection])

  useEffect(() => {
    if (id) void fetchInspection()
  }, [id])

  const fetchInspection = async () => {
    try {
      const demoMode = localStorage.getItem('demoMode') === 'true'
      if (demoMode) {
        // Use mock data for demo mode
        const mockInspection: Inspection = {
          id: id || '1',
          siteId: 'site1',
          site: { id: 'site1', name: 'Restaurant A', address: '123 Main St', departmentId: 'dept1' },
          inspectorId: 'inspector001',
          inspector: { id: 'inspector001', name: 'Amit Patel', email: 'inspector@niriksha.gov.in', role: 'INSPECTOR', createdAt: '2024-01-01' },
          templateId: 'templ1',
          template: { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
          status: 'UNDER_REVIEW',
          scheduledDate: '2024-01-20',
          notes: 'Initial inspection completed',
          confidenceScore: 85,
          aiAnalysis: { flaggedItems: [], summary: 'No major violations detected' },
          createdAt: '2024-01-15',
          images: [
            { id: 'img1', inspectionId: id || '1', imageUrl: '/uploads/demo-image.jpg', description: 'Kitchen area', uploadedAt: '2024-01-15T10:00:00Z' }
          ],
          checklists: [
            { id: 'check1', inspectionId: id || '1', itemId: 'item1', itemLabel: 'Kitchen Cleanliness', status: 'COMPLIANT', required: true, notes: 'All equipment clean' }
          ],
          violations: []
        }
        setInspection(mockInspection)
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load inspection')
      }
      const data = await response.json()
      setInspection(data.inspection)
    } catch (error) {
      console.error('Failed to fetch inspection:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load inspection' })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'APPROVE',
          comments: reviewNote || undefined
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to approve inspection')
      }
      setApproveDialogOpen(false)
      setReviewNote('')
      setMessage({ type: 'success', text: 'Inspection approved successfully' })
      await fetchInspection()
    } catch (error) {
      console.error('Failed to approve inspection:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to approve inspection' })
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' })
      return
    }
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'REJECT',
          comments: reviewNote ? `${rejectReason}\n\nReview note: ${reviewNote}` : rejectReason
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reject inspection')
      }
      setRejectDialogOpen(false)
      setRejectReason('')
      setReviewNote('')
      setMessage({ type: 'success', text: 'Inspection rejected successfully' })
      await fetchInspection()
    } catch (error) {
      console.error('Failed to reject inspection:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to reject inspection' })
    } finally {
      setProcessing(false)
    }
  }

  const handleEditReport = async () => {
    if (!reportContent.trim()) {
      setMessage({ type: 'error', text: 'Report content cannot be empty' })
      return
    }
    setProcessing(true)
    try {
      const demoMode = localStorage.getItem('demoMode') === 'true'
      if (demoMode) {
        setEditReportDialogOpen(false)
        setMessage({ type: 'success', text: 'AI Report modification saved. (Demo mode)' })
        setProcessing(false)
        return
      }
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'MODIFY_AI_REPORT',
          comments: reviewNote || undefined,
          reportContent: reportContent,
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save report modification')
      }
      setEditReportDialogOpen(false)
      setReportContent('')
      setReviewNote('')
      setMessage({ type: 'success', text: 'AI Report modified successfully. SUPERVISOR_EDIT version saved.' })
      await fetchInspection()
    } catch (error) {
      console.error('Failed to modify report:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to modify report' })
    } finally {
      setProcessing(false)
    }
  }

  const handleRequestEvidence = async () => {
    if (!evidenceRequest.trim()) {
      setMessage({ type: 'error', text: 'Please describe what additional evidence is needed' })
      return
    }
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}/review`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'REQUEST_EVIDENCE',
          comments: reviewNote ? `${evidenceRequest}\n\nReview note: ${reviewNote}` : evidenceRequest
        }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request evidence')
      }
      setRequestEvidenceDialogOpen(false)
      setEvidenceRequest('')
      setReviewNote('')
      setMessage({ type: 'success', text: 'Additional evidence requested from inspector' })
      await fetchInspection()
    } catch (error) {
      console.error('Failed to request evidence:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to request evidence' })
    } finally {
      setProcessing(false)
    }
  }

  const handleExportPdf = async () => {
    const demoMode = localStorage.getItem('demoMode') === 'true'
    if (demoMode) {
      setMessage({ type: 'error', text: 'PDF export is not available in demo mode.' })
      return
    }
    setProcessing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/supervisor/inspections/${id}/export/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to export PDF')
      }
      const blob = await response.blob()
      triggerDownload(blob, `inspection-${id}.pdf`)
      setMessage({ type: 'success', text: 'PDF export started. Your download should begin shortly.' })
    } catch (error) {
      console.error('Failed to export PDF:', error)
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to export PDF' })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Inspection not found</p>
        </div>
      </div>
    )
  }

  const reasoning = typeof inspection.aiAnalysis === 'string' ? inspection.aiAnalysis : inspection.aiAnalysis?.explanation as string | undefined
  const confidence = inspection.confidenceScore

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold">{inspection.site.name}</h1>
            <p className="text-muted-foreground">{inspection.site.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <InspectionStatusBadge status={inspection.status} />
          </div>
        </div>

        {message && (
          <Card className={`mb-6 ${message.type === 'error' ? 'border-destructive bg-destructive/10' : 'border-green-500 bg-green-50 dark:bg-green-950/20'}`}>
            <CardContent className="pt-6">
              <p className={message.type === 'error' ? 'text-destructive' : 'text-green-700 dark:text-green-300'}>{message.text}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Inspection Details */}
            <Card>
              <CardHeader>
                <CardTitle>Inspection Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Inspector</p>
                      <p className="text-sm text-muted-foreground">{inspection.inspector.name}</p>
                      <p className="text-xs text-muted-foreground">{inspection.inspector.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Scheduled Date</p>
                      <p className="text-sm text-muted-foreground">{new Date(inspection.scheduledDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{inspection.site.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Template</p>
                      <p className="text-sm text-muted-foreground">{inspection.template.name}</p>
                    </div>
                  </div>
                </div>
                {inspection.notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-1">Inspector Notes</p>
                    <p className="text-sm text-muted-foreground">{inspection.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Checklist Results */}
            <Card>
              <CardHeader>
                <CardTitle>Checklist Results</CardTitle>
                <CardDescription>Inspector's checklist responses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.checklists.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No checklist items</p>
                ) : (
                  inspection.checklists.map((item: InspectionChecklist) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{item.itemLabel}</p>
                          {item.required && <Badge variant="destructive" className="mt-1">Required</Badge>}
                        </div>
                        <Badge variant={
                          item.status === 'COMPLIANT' ? 'default' :
                          item.status === 'NON_COMPLIANT' ? 'destructive' : 'secondary'
                        }>
                          {item.status}
                        </Badge>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Evidence */}
            <Card>
              <CardHeader>
                <CardTitle>Evidence</CardTitle>
                <CardDescription>Uploaded images and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                {inspection.images.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No evidence uploaded</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {inspection.images.map((image) => (
                      <div key={image.id} className="relative group rounded-lg border overflow-hidden">
                        <img 
                          src={image.imageUrl} 
                          alt={image.description || 'Evidence'} 
                          className="h-40 w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                          <p className="text-white text-xs">{image.description || 'No description'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verification Findings */}
            <VerificationFindingsPanel findings={inspection.verificationFindings || []} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Verification */}
            {(confidence !== undefined || reasoning) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    AI Verification
                  </CardTitle>
                  <CardDescription>Reality verification results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Confidence Score</span>
                    <strong>{confidence?.toFixed(1) ?? '0.0'}%</strong>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div 
                      className={`h-2 rounded-full ${
                        confidence! >= 90 ? 'bg-green-500' :
                        confidence! >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                  {reasoning && (
                    <div className="text-sm pt-2 border-t">
                      <p className="mb-1 font-medium">AI Reasoning</p>
                      <p className="text-muted-foreground">{reasoning}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Violations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inspection.violations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No violations recorded</p>
                ) : (
                  <div className="space-y-3">
                    {inspection.violations.map((violation) => (
                      <div key={violation.id} className="p-3 border rounded-lg">
                        <Badge variant={violation.severity === 'CRITICAL' ? 'destructive' : 'secondary'} className="mb-2">
                          {violation.severity}
                        </Badge>
                        <p className="text-sm">{violation.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review Note */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Review Note
                </CardTitle>
                <CardDescription>Add your review comments (optional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add your review comments or observations..."
                  rows={4}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            {inspection.status === 'UNDER_REVIEW' && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Actions</CardTitle>
                  <CardDescription>Approve, reject, or request additional evidence</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    onClick={() => {
                      const aiContent = typeof inspection.aiAnalysis === 'string' ? inspection.aiAnalysis : ''
                      setReportContent(aiContent)
                      setEditReportDialogOpen(true)
                    }} 
                    variant="outline"
                    className="w-full border-purple-500/30 text-purple-600 hover:bg-purple-50"
                    disabled={processing}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Modify AI Report
                  </Button>
                  <Button 
                    onClick={() => setApproveDialogOpen(true)} 
                    className="w-full"
                    disabled={processing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve Inspection
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setRequestEvidenceDialogOpen(true)} 
                    className="w-full"
                    disabled={processing}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Request Additional Evidence
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => setRejectDialogOpen(true)} 
                    className="w-full"
                    disabled={processing}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject Inspection
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Inspector Trust Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Inspector Performance
                </CardTitle>
                <CardDescription>Trust score and inspection history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Trust Score</span>
                  <Badge variant={inspection.confidenceScore && inspection.confidenceScore >= 90 ? 'default' : 'secondary'}>
                    {inspection.confidenceScore?.toFixed(1) || 'N/A'}%
                  </Badge>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div 
                    className={`h-2 rounded-full ${
                      inspection.confidenceScore && inspection.confidenceScore >= 90 ? 'bg-green-500' :
                      inspection.confidenceScore && inspection.confidenceScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${inspection.confidenceScore || 0}%` }}
                  />
                </div>
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  Based on {inspection.violations?.length || 0} violations in this inspection
                </div>
              </CardContent>
            </Card>

            {/* Status Info */}
            <Card>
              <CardHeader>
                <CardTitle>Status Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(inspection.createdAt).toLocaleDateString()}</span>
                </div>
                {inspection.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed</span>
                    <span>{new Date(inspection.completedDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <InspectionStatusBadge status={inspection.status} />
                </div>
              </CardContent>
            </Card>

            {/* Export */}
            <Card>
              <CardHeader>
                <CardTitle>Export</CardTitle>
                <CardDescription>Download a copy of this inspection report</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={handleExportPdf}
                  className="w-full"
                  disabled={processing}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Inspection</DialogTitle>
            <DialogDescription>
              Are you sure you want to approve this inspection? This will mark it as complete and generate the final report. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {reviewNote && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Your Review Note:</p>
              <p className="text-sm text-muted-foreground">{reviewNote}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? 'Processing...' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Inspection</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this inspection. The inspector will be notified and can resubmit with corrections.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-reason">Rejection Reason *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                rows={4}
              />
            </div>
            {reviewNote && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Review Note:</p>
                <p className="text-sm text-muted-foreground">{reviewNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
              {processing ? 'Processing...' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Evidence Dialog */}
      <Dialog open={requestEvidenceDialogOpen} onOpenChange={setRequestEvidenceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Additional Evidence</DialogTitle>
            <DialogDescription>
              Describe what additional evidence or documentation is needed from the inspector to complete this review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="evidence-request">Evidence Request *</Label>
              <Textarea
                id="evidence-request"
                value={evidenceRequest}
                onChange={(e) => setEvidenceRequest(e.target.value)}
                placeholder="Describe what additional evidence is needed..."
                rows={4}
              />
            </div>
            {reviewNote && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Review Note:</p>
                <p className="text-sm text-muted-foreground">{reviewNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestEvidenceDialogOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleRequestEvidence} disabled={processing || !evidenceRequest.trim()}>
              {processing ? 'Processing...' : 'Request Evidence'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modify AI Report Dialog */}
      <Dialog open={editReportDialogOpen} onOpenChange={(open) => { if (!open) { setEditReportDialogOpen(false); setReportContent('') }}}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modify AI Report</DialogTitle>
            <DialogDescription>
              Edit the AI-generated report content below. This will create a SUPERVISOR_EDIT version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="report-content">Report Content</Label>
              <Textarea
                id="report-content"
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Enter or edit the report content..."
                rows={16}
                className="font-mono text-sm"
              />
            </div>
            {reviewNote && (
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Your Review Note:</p>
                <p className="text-sm text-muted-foreground">{reviewNote}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditReportDialogOpen(false); setReportContent('') }} disabled={processing}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleEditReport}
              disabled={processing || !reportContent.trim()}
            >
              <FileText className="mr-2 h-4 w-4" />
              {processing ? 'Saving...' : 'Save Modified Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
