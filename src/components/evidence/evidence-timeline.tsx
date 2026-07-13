'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface EvidenceItem { id: string; imageUrl: string; description: string | null; timestamp: string; violation: boolean }

export function EvidenceTimeline({ inspectionId }: { inspectionId: string }) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]); const [loading, setLoading] = useState(true)
  useEffect(() => { const token = localStorage.getItem('token'); fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/supervisor/inspections/${inspectionId}`, { headers: { Authorization: `Bearer ${token}` } }).then(response => response.ok ? response.json() : Promise.reject()).then(data => { const violations = new Set(data.inspection.violations.map((violation: any) => violation.imageEvidence)); setEvidence(data.inspection.images.map((image: any) => ({ id: image.id, imageUrl: image.imageUrl, description: image.description, timestamp: image.uploadedAt, violation: violations.has(image.imageUrl) }))); }).catch(() => setEvidence([])).finally(() => setLoading(false)) }, [inspectionId])
  return <Card><CardHeader><CardTitle>Evidence Timeline</CardTitle><CardDescription>Live uploaded evidence for this inspection</CardDescription></CardHeader><CardContent>{loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading evidence…</p> : evidence.length ? <div className="space-y-3">{evidence.map(item => <div className="border-l pl-3 text-sm" key={item.id}><Badge variant={item.violation ? 'destructive' : 'outline'}>{item.violation ? 'Violation evidence' : 'Evidence'}</Badge><a className="ml-2 underline" href={`${process.env.NEXT_PUBLIC_API_URL}/${item.imageUrl}`} target="_blank">{item.description || item.imageUrl}</a><p className="mt-1 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString()}</p></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No evidence available</p>}</CardContent></Card>
}
