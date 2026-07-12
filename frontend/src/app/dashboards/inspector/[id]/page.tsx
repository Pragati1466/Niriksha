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
import { SubmissionTimeline } from '@/components/inspections/submission-timeline'
import { AlertTriangle, ArrowLeft, Camera, Check, FileUp, ShieldCheck } from 'lucide-react'

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

  useEffect(() => { if (id) void fetchInspection() }, [id])

  const fetchInspection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) throw new Error('Failed to load inspection')
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
    const checklistResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/checklist`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ checklists }),
    })
    if (!checklistResponse.ok) throw new Error((await checklistResponse.json()).error || 'Failed to save checklist')
    const inspectionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'IN_PROGRESS', notes }),
    })
    if (!inspectionResponse.ok) throw new Error((await inspectionResponse.json()).error || 'Failed to save inspection')
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('description', `Inspection image for ${inspection?.site.name}`)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/images`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      if (!response.ok) throw new Error((await response.json()).error || 'Failed to upload image')
      await fetchInspection()
    } catch (error) { setOutcome({ error: error instanceof Error ? error.message : 'Failed to upload image' }) } finally { setUploading(false) }
  }

  const handleChecklistChange = (itemId: string, status: ChecklistStatus) => setChecklists((items) => items.map((item) => item.itemId === itemId ? { ...item, status } : item))

  const handleSaveChecklist = async () => {
    try { await persistChecklist(); await fetchInspection() } catch (error) { setOutcome({ error: error instanceof Error ? error.message : 'Failed to save progress' }) }
  }

  const handleSubmit = async () => {
    setSubmitting(true); setOutcome(null)
    try {
      await persistChecklist()
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/submit`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' })
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/submit`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ overrideReason: overrideReason.trim() }),
      })
      const data = await response.json()
      if (!response.ok) { setOverrideError(data.error || 'Override could not be submitted.'); return }
      setOutcome(data); setOverrideOpen(false); setOverrideReason(''); await fetchInspection()
    } catch (error) { setOverrideError(error instanceof Error ? error.message : 'Override could not be submitted.') } finally { setSubmitting(false) }
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
          <InspectionStatusBadge status={inspection.status} />
        </div>

        {outcome?.error && <Card className="mb-6 border-destructive"><CardContent className="pt-6 text-destructive">{outcome.error}</CardContent></Card>}

        {held && <Card className="mb-6 border-red-500 bg-red-50/50 dark:bg-red-950/20"><CardHeader><CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300"><AlertTriangle className="h-5 w-5" />Inspection held for review</CardTitle><CardDescription>{outcome?.message || 'Submission is paused until the verification findings are addressed or an override is requested.'}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm md:grid-cols-2"><p><strong>Confidence:</strong> {confidence?.toFixed(1) ?? '0.0'}%</p><p><strong>Required actions:</strong> upload evidence, correct the checklist, or request a justified override.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => evidenceInputRef.current?.click()}><FileUp className="mr-2 h-4 w-4" />Upload more evidence</Button><Button variant="outline" onClick={() => document.getElementById('inspection-checklist')?.scrollIntoView({ behavior: 'smooth' })}>Correct checklist</Button><Button onClick={() => setOverrideOpen(true)}>Request Override</Button></div></CardContent></Card>}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card id="inspection-checklist"><CardHeader><CardTitle>Checklist</CardTitle><CardDescription>Complete and correct the inspection checklist.</CardDescription></CardHeader><CardContent className="space-y-4">{inspection.template.checklistItems.map((item) => { const checklistItem = checklists.find((checklist) => checklist.itemId === item.id); return <div key={item.id} className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"><div><Label className="text-base">{item.label}</Label>{item.required && <Badge variant="destructive" className="ml-2">Required</Badge>}</div><div className="flex flex-wrap gap-2">{(['COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE'] as ChecklistStatus[]).map((status) => <Button key={status} variant={checklistItem?.status === status ? 'default' : 'outline'} size="sm" onClick={() => handleChecklistChange(item.id, status)}>{status === 'COMPLIANT' && <Check className="mr-1 h-4 w-4" />}{status === 'NON_COMPLIANT' && <AlertTriangle className="mr-1 h-4 w-4" />}{status}</Button>)}</div></div> })}</CardContent></Card>
            <Card><CardHeader><CardTitle>Notes</CardTitle><CardDescription>Add additional observations.</CardDescription></CardHeader><CardContent><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Enter inspection notes..." rows={4} /></CardContent></Card>
            <VerificationFindingsPanel findings={visibleFindings} />
          </div>
          <div className="space-y-6">
            <Card><CardHeader><CardTitle>Upload Images</CardTitle><CardDescription>Add evidence for your inspection.</CardDescription></CardHeader><CardContent><div className="space-y-4"><div className="rounded-lg border-2 border-dashed p-8 text-center"><Camera className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><p className="mb-4 text-sm text-muted-foreground">Upload an image as verification evidence.</p><Input ref={evidenceInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} /></div>{inspection.images.length > 0 && <div className="space-y-2"><p className="text-sm font-medium">Uploaded Images</p>{inspection.images.map((image) => <div key={image.id} className="flex items-center gap-2 rounded border p-2"><Check className="h-4 w-4 text-green-500" /><span className="text-sm">{image.description || 'Image'}</span></div>)}</div>}</div></CardContent></Card>
            <Card><CardHeader><CardTitle>Actions</CardTitle></CardHeader><CardContent className="space-y-2"><Button onClick={handleSaveChecklist} className="w-full" variant="outline">Save Progress</Button><Button onClick={handleSubmit} className="w-full" disabled={submitting || checklists.length === 0}>{submitting ? 'Verifying...' : 'Submit for AI Verification'}</Button></CardContent></Card>
            {(confidence !== undefined || reasoning) && <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Verification Results</CardTitle><CardDescription>Outcome from the submission safety gate.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex justify-between text-sm"><span>Verification status</span><InspectionStatusBadge status={inspection.status} /></div><div className="flex justify-between text-sm"><span>Overall verification score</span><strong>{confidence?.toFixed(1) ?? '0.0'}%</strong></div>{reasoning && <div className="text-sm"><p className="mb-1 font-medium">AI reasoning</p><p className="text-muted-foreground">{reasoning}</p></div>}</CardContent></Card>}
            <Card><CardHeader><CardTitle>Submission Timeline</CardTitle></CardHeader><CardContent><SubmissionTimeline inspection={inspection} /></CardContent></Card>
          </div>
        </div>
      </main>
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}><DialogContent><DialogHeader><DialogTitle>Request submission override</DialogTitle><DialogDescription>An override submits a held inspection. Provide a clear, auditable reason.</DialogDescription></DialogHeader><Textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} placeholder="Explain why this inspection should be submitted despite the findings..." rows={5} />{overrideError && <p className="text-sm text-destructive">{overrideError}</p>}<DialogFooter><Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button><Button onClick={handleOverride} disabled={submitting || !overrideReason.trim()}>Submit Override</Button></DialogFooter></DialogContent></Dialog>
    </div>
  )
}
