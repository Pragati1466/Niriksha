'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Inspection, InspectionChecklist, ChecklistStatus } from '@/types'
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge'
import { VerificationFindingsPanel } from '@/components/inspections/verification-findings-panel'
import { getApiUrl } from '@/lib/api'
import { SubmissionTimeline } from '@/components/inspections/submission-timeline'
import { AlertTriangle, ArrowLeft, Camera, Check, FileUp, ShieldCheck, WifiOff, Wifi } from 'lucide-react'
import { offlineStorage } from '@/lib/offlineStorage'

type SubmissionOutcome = { status?: string; message?: string; confidenceScore?: number; error?: string; findings?: Inspection['verificationFindings'] }

export default function InspectionDetailPage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const router = useRouter()
  const evidenceInputRef = useRef<HTMLInputElement>(null)
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklists, setChecklists] = useState<InspectionChecklist[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [outcome, setOutcome] = useState<SubmissionOutcome | null>(null)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideError, setOverrideError] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [imagePreview, setImagePreview] = useState<{ file: File; url: string } | null>(null)
  const [imageCaption, setImageCaption] = useState('')

  useEffect(() => { if (id) void fetchInspection() }, [id])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLocationError(null)
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    getCurrentLocation()
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!inspection || inspection.status === 'SUBMITTED') return

    const autosaveTimer = setTimeout(async () => {
      try {
        await persistChecklist()
      } catch (error) {
        console.error('Autosave failed:', error)
      }
    }, 30000) // Autosave every 30 seconds

    return () => clearTimeout(autosaveTimer)
  }, [checklists, notes, inspection?.status])

  const fetchInspection = async () => {
    try {
      const demoMode = localStorage.getItem('demoMode') === 'true'
      if (demoMode) {
        // Use mock data for demo mode
        const mockInspection: Inspection = {
          id: id || '',
          siteId: 'site1',
          site: { id: 'site1', name: 'Restaurant A', address: '123 Main St', departmentId: 'dept1' },
          inspectorId: 'insp1',
          inspector: { id: 'insp1', name: 'Demo User', email: 'demo@niriksha.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
          templateId: 'templ1',
          template: { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
          status: 'IN_PROGRESS',
          scheduledDate: '2024-01-20',
          notes: '',
          confidenceScore: 0,
          aiAnalysis: {},
          createdAt: '2024-01-15',
          images: [],
          checklists: [],
          violations: []
        }
        setInspection(mockInspection)
        setChecklists(mockInspection.checklists || [])
        setNotes(mockInspection.notes || '')
        setLoading(false)
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }

      const response = await fetch(`${getApiUrl()}/api/inspections/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load inspection')
      }
      const data: Inspection = await response.json()
      setInspection(data)
      setChecklists(data.checklists || [])
      setNotes(data.notes || '')
    } catch (error) {
      console.error('Failed to fetch inspection:', error)
    } finally { setLoading(false) }
  }

  const persistChecklist = async () => {
    const token = localStorage.getItem('token')
    const checklistResponse = await fetch(`${getApiUrl()}/api/inspections/${id}/checklist`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ checklists }),
    })
    if (!checklistResponse.ok) throw new Error((await checklistResponse.json()).error || 'Failed to save checklist')
    const inspectionResponse = await fetch(`${getApiUrl()}/api/inspections/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS', notes }),
    })
    if (!inspectionResponse.ok) throw new Error((await inspectionResponse.json()).error || 'Failed to save inspection')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // Create preview
    const url = URL.createObjectURL(file)
    setImagePreview({ file, url })
    setImageCaption(`Inspection image for ${inspection?.site.name}`)
  }

  const handleConfirmImageUpload = async () => {
    if (!imagePreview) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', imagePreview.file)
      formData.append('description', imageCaption)
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/inspections/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload image')
      await fetchInspection()
      setImagePreview(null)
      setImageCaption('')
    } catch (error) { setOutcome({ error: error instanceof Error ? error.message : 'Failed to upload image' }) } finally { setUploading(false) }
  }

  const handleCancelImageUpload = () => {
    setImagePreview(null)
    setImageCaption('')
    if (evidenceInputRef.current) {
      evidenceInputRef.current.value = ''
    }
  }

  const handleChecklistChange = (itemId: string, status: ChecklistStatus) => setChecklists((items) => items.map((item) => item.itemId === itemId ? { ...item, status } : item))

  const handleChecklistNoteChange = (itemId: string, notes: string) => setChecklists((items) => items.map((item) => item.itemId === itemId ? { ...item, notes } : item))

  const handleBulkComplete = (status: ChecklistStatus) => {
    setChecklists((items) => items.map((item) => ({ ...item, status })))
  }

  const handleImageCaptionChange = async (imageId: string, description: string) => {
    if (!inspection) return
    setInspection({
      ...inspection,
      images: inspection.images.map(img => img.id === imageId ? { ...img, description } : img)
    })
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/inspections/${id}/images/${imageId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })
    } catch (error) {
      console.error('Failed to update image caption:', error)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/inspections/${id}/images/${imageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchInspection()
    } catch (error) {
      console.error('Failed to delete image:', error)
    }
  }

  const handleLinkImageToChecklist = (imageId: string, checklistItemId: string) => {
    setChecklists((items) => items.map((item) => {
      if (item.id === checklistItemId) {
        const currentEvidence = item.evidence || []
        return { ...item, evidence: [...currentEvidence, imageId] }
      }
      return item
    }))
  }

  const handleUnlinkImageFromChecklist = (imageId: string, checklistItemId: string) => {
    setChecklists((items) => items.map((item) => {
      if (item.id === checklistItemId) {
        const currentEvidence = item.evidence || []
        return { ...item, evidence: currentEvidence.filter(id => id !== imageId) }
      }
      return item
    }))
  }

  const handleCameraCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      const video = document.createElement('video')
      video.srcObject = stream
      video.play()
      
      return new Promise<{ file: File; metadata: any }>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)
          canvas.toBlob((blob) => {
            stream.getTracks().forEach(track => track.stop())
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
              const metadata = {
                timestamp: new Date().toISOString(),
                width: video.videoWidth,
                height: video.videoHeight,
                facingMode: 'environment'
              }
              resolve({ file, metadata })
            } else {
              reject(new Error('Failed to capture image'))
            }
          }, 'image/jpeg', 0.9)
        }
        video.onerror = () => {
          stream.getTracks().forEach(track => track.stop())
          reject(new Error('Camera error'))
        }
      })
    } catch (error) {
      console.error('Camera capture failed:', error)
      throw error
    }
  }

  const handleCameraUpload = async () => {
    try {
      const { file, metadata } = await handleCameraCapture()
      setUploading(true)
      const formData = new FormData()
      formData.append('image', file)
      formData.append('description', `Camera capture - ${metadata.timestamp}`)
      formData.append('metadata', JSON.stringify(metadata))
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/inspections/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload image')
      await fetchInspection()
    } catch (error) { 
      setOutcome({ error: error instanceof Error ? error.message : 'Failed to capture image' }) 
    } finally { 
      setUploading(false) 
    }
  }

  const handleSaveChecklist = async () => {
    try { await persistChecklist(); await fetchInspection() } catch (error) { setOutcome({ error: error instanceof Error ? error.message : 'Failed to save progress' }) }
  }

  const handleSubmit = async () => {
    setSubmitting(true); setOutcome(null)
    try {
      await persistChecklist()
      const token = localStorage.getItem('token')
      const locationData = location ? {
        locationLat: location.lat,
        locationLng: location.lng,
        locationAccuracy: location.accuracy,
        locationTimestamp: new Date().toISOString(),
      } : {}
      const response = await fetch(`${getApiUrl()}/api/inspections/${id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(locationData) })
      const data = await response.json()
      if (!response.ok && data.status !== 'HOLD_FOR_REVIEW') throw new Error(data.error || data.message || 'Submission failed')
      setOutcome({ ...data, findings: Array.isArray(data.findings) ? data.findings.map((finding: Record<string, unknown>, index: number) => ({ ...finding, id: `submission-finding-${index}`, inspectionId: id, createdAt: new Date().toISOString() })) : undefined })
      await fetchInspection()
    } catch (error) { setOutcome({ error: error instanceof Error ? error.message : 'Submission failed' }) } finally { setSubmitting(false) }
  }

  const handleOverride = async () => {
    if (!overrideReason.trim()) { setOverrideError('An override reason is required.'); return }
    setSubmitting(true); setOverrideError('')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/inspections/${id}/submit`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ overrideReason: overrideReason.trim() }),
      })
      const data = await response.json()
      if (!response.ok) { setOverrideError(data.error || 'Override could not be submitted.'); return }
      setOutcome(data); setOverrideOpen(false); setOverrideReason(''); await fetchInspection()
    } catch (error) { setOverrideError(error instanceof Error ? error.message : 'Override could not be submitted.') } finally { setSubmitting(false) }
  }

  const handleSync = async () => {
    if (!isOnline) return
    setSyncing(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('No authentication token')
      const result = await offlineStorage.sync(token)
      setOutcome({ message: `Synced ${result.success} actions${result.failed > 0 ? `, ${result.failed} failed` : ''}` })
      await fetchInspection()
    } catch (error) {
      setOutcome({ error: error instanceof Error ? error.message : 'Sync failed' })
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className="min-h-screen"><Header /><div className="flex h-[calc(100vh-80px)] items-center justify-center"><div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary" /></div></div>
  if (!inspection) return <div className="min-h-screen"><Header /><div className="container mx-auto px-4 py-8">Inspection not found</div></div>

  const held = inspection.status === 'HOLD_FOR_REVIEW' || outcome?.status === 'HOLD_FOR_REVIEW'
  const reasoning = typeof inspection.aiAnalysis === 'string' ? inspection.aiAnalysis : inspection.aiAnalysis?.explanation as string | undefined
  const confidence = outcome?.confidenceScore ?? inspection.confidenceScore
  const visibleFindings = outcome?.findings?.length ? outcome.findings : inspection.verificationFindings || []

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div><Button variant="ghost" onClick={() => router.back()} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button><h1 className="text-3xl font-bold">{inspection.site.name}</h1><p className="text-muted-foreground">{inspection.site.address}</p></div>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-red-500" />}
            <InspectionStatusBadge status={inspection.status} />
          </div>
        </div>

        {outcome?.error && <Card className="mb-6 border-destructive"><CardContent className="pt-6 text-destructive">{outcome.error}</CardContent></Card>}

        {held && <Card className="mb-6 border-red-500 bg-red-50/50 dark:bg-red-950/20"><CardHeader><CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300"><AlertTriangle className="h-5 w-5" />Inspection held for review</CardTitle><CardDescription>{outcome?.message || 'Submission is paused until the verification findings are addressed or an override is requested.'}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm md:grid-cols-2"><p><strong>Confidence:</strong> {confidence?.toFixed(1) ?? '0.0'}%</p><p><strong>Required actions:</strong> upload evidence, correct the checklist, or request a justified override.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => evidenceInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" />Upload more evidence</Button><Button variant="outline" onClick={() => document.getElementById('inspection-checklist')?.scrollIntoView({ behavior: 'smooth' })}>Correct checklist</Button><Button onClick={() => setOverrideOpen(true)}>Request Override</Button></div></CardContent></Card>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card id="inspection-checklist"><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Checklist</CardTitle><CardDescription>Complete and correct the inspection checklist.</CardDescription></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => handleBulkComplete('COMPLIANT')}><Check className="mr-1 h-4 w-4" />All Compliant</Button><Button variant="outline" size="sm" onClick={() => handleBulkComplete('NON_COMPLIANT')}><AlertTriangle className="mr-1 h-4 w-4" />All Non-Compliant</Button><Button variant="outline" size="sm" onClick={() => handleBulkComplete('NOT_APPLICABLE')}>All N/A</Button></div></div></CardHeader><CardContent className="space-y-4">{inspection.template.checklistItems.map((item) => { const checklistItem = checklists.find((checklist) => checklist.itemId === item.id); return <div key={item.id} className="flex flex-col gap-4 rounded-lg border p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Label className="text-base">{item.label}</Label>{item.required && <Badge variant="destructive" className="ml-2">Required</Badge>}</div><div className="flex flex-wrap gap-2">{(['COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE'] as ChecklistStatus[]).map((status) => <Button key={status} variant={checklistItem?.status === status ? 'default' : 'outline'} size="sm" onClick={() => handleChecklistChange(item.id, status)}>{status === 'COMPLIANT' && <Check className="mr-1 h-4 w-4" />}{status === 'NON_COMPLIANT' && <AlertTriangle className="mr-1 h-4 w-4" />}{status}</Button>)}</div></div><div className="space-y-2"><Label htmlFor={`notes-${item.id}`} className="text-sm text-muted-foreground">Item Notes</Label><Textarea id={`notes-${item.id}`} value={checklistItem?.notes || ''} onChange={(e) => handleChecklistNoteChange(item.id, e.target.value)} placeholder="Add specific notes for this finding..." rows={2} className="text-sm" /></div><div className="space-y-2"><Label className="text-sm text-muted-foreground">Linked Evidence</Label><div className="flex flex-wrap gap-2">{checklistItem?.evidence?.map((imageId) => { const image = inspection.images.find(img => img.id === imageId); return image ? <div key={imageId} className="relative group"><img src={image.imageUrl} alt={image.description || 'Evidence'} className="h-16 w-16 rounded object-cover border" /><button onClick={() => handleUnlinkImageFromChecklist(imageId, checklistItem?.id || '')} className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs opacity-0 group-hover:opacity-100 flex items-center justify-center">×</button></div> : null }) || <span className="text-sm text-muted-foreground">No evidence linked</span>}</div></div></div> })}</CardContent></Card>
            <Card><CardHeader><CardTitle>Notes</CardTitle><CardDescription>Add additional observations.</CardDescription></CardHeader><CardContent><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Enter inspection notes..." rows={4} /></CardContent></Card>
            <VerificationFindingsPanel findings={visibleFindings} />
          </div>
          <div className="space-y-6">
            <Card><CardHeader><CardTitle>Upload Images</CardTitle><CardDescription>Add evidence for your inspection.</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="flex gap-2"><Button variant="outline" onClick={() => evidenceInputRef.current?.click()} disabled={uploading} className="flex-1"><FileUp className="mr-2 h-4 w-4" />Upload File</Button><Button variant="outline" onClick={handleCameraUpload} disabled={uploading} className="flex-1"><Camera className="mr-2 h-4 w-4" />Camera Capture</Button></div><Input ref={evidenceInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />{inspection.images.length > 0 && <div className="space-y-3"><p className="text-sm font-medium">Uploaded Images ({inspection.images.length})</p><div className="grid grid-cols-2 gap-3">{inspection.images.map((image) => <div key={image.id} className="relative group rounded-lg border overflow-hidden"><img src={image.imageUrl} alt={image.description || 'Evidence'} className="h-32 w-full object-cover" /><div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2"><button onClick={() => handleDeleteImage(image.id)} className="px-2 py-1 bg-destructive text-white text-xs rounded">Delete</button><Input value={image.description || ''} onChange={(e) => handleImageCaptionChange(image.id, e.target.value)} placeholder="Add caption..." className="bg-white/90 text-black text-xs h-6" onClick={(e) => e.stopPropagation()} /></div></div>)}</div></div>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="space-y-2"><Button onClick={handleSaveChecklist} className="w-full" variant="outline">Save Progress</Button>{!isOnline && <Button onClick={handleSync} className="w-full" variant="outline" disabled={syncing || !offlineStorage.getQueueSize()}>{syncing ? 'Syncing...' : `Sync (${offlineStorage.getQueueSize()} pending)`}</Button>}<Button onClick={handleSubmit} className="w-full" disabled={submitting || checklists.length === 0}>{submitting ? 'Verifying...' : 'Submit for AI Verification'}</Button></CardContent></Card>
            {(confidence !== undefined || reasoning) && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verification Results</CardTitle><CardDescription>Outcome from the submission safety gate.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex justify-between text-sm"><span>Verification status</span><InspectionStatusBadge status={inspection.status} /></div><div className="flex justify-between text-sm"><span>Overall verification score</span><strong>{confidence?.toFixed(1) ?? '0.0'}%</strong></div>{reasoning && <div className="text-sm"><p className="mb-1 font-medium">AI reasoning</p><p className="text-muted-foreground">{reasoning}</p></div>}</CardContent></Card>}
            <Card><CardHeader><CardTitle>Submission Timeline</CardTitle></CardHeader><CardContent><SubmissionTimeline inspection={inspection} /></CardContent></Card>
          </div>
        </div>
      </main>
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}><DialogContent><DialogHeader><DialogTitle>Request submission override</DialogTitle><DialogDescription>An override submits a held inspection. Provide a clear, auditable reason.</DialogDescription></DialogHeader><Textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Explain why this inspection should be submitted despite the findings..." rows={5} />{overrideError && <p className="text-sm text-destructive">{overrideError}</p>}<DialogFooter><Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button><Button onClick={handleOverride} disabled={submitting || !overrideReason.trim()}>Submit Override</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={!!imagePreview} onOpenChange={(open) => !open && handleCancelImageUpload()}><DialogContent><DialogHeader><DialogTitle>Preview Image</DialogTitle><CardDescription>Review the image before uploading.</CardDescription></DialogHeader>{imagePreview && <div className="space-y-4"><img src={imagePreview.url} alt="Preview" className="w-full h-auto rounded-lg border" /><div><Label htmlFor="image-caption">Caption</Label><Input id="image-caption" value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} placeholder="Add a description..." /></div></div>}<DialogFooter><Button variant="outline" onClick={handleCancelImageUpload}>Cancel</Button><Button onClick={handleConfirmImageUpload} disabled={uploading}>{uploading ? 'Uploading...' : 'Confirm Upload'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
