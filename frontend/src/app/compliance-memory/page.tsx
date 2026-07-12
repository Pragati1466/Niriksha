'use client'

import { useCallback, useEffect, useState } from 'react'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ComplianceMemoryEvent } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { BrainCircuit, ChevronLeft, ChevronRight, Database, ShieldAlert, Users } from 'lucide-react'

interface MemoryStats { totalMemoryEntries: number; inspectorHistories: number; riskHistories: number }

export default function ComplianceMemoryPage() {
  const [events, setEvents] = useState<ComplianceMemoryEvent[]>([])
  const [stats, setStats] = useState<MemoryStats | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const limit = 25

  const loadMemory = useCallback(async (nextOffset: number) => {
    setLoading(true); setError('')
    try {
      const token = localStorage.getItem('token')
      const headers = { Authorization: `Bearer ${token}` }
      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/memory-history?limit=${limit}&offset=${nextOffset}`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agents/memory-stats`, { headers }),
      ])
      const history = await historyResponse.json()
      const statistics = await statsResponse.json()
      if (!historyResponse.ok) throw new Error(history.error || 'Failed to load compliance memory')
      if (!statsResponse.ok) throw new Error(statistics.error || 'Failed to load memory statistics')
      setEvents(history.events || []); setOffset(nextOffset); setHasMore(Boolean(history.pagination?.hasMore)); setStats(statistics.stats || null)
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Failed to load compliance memory') } finally { setLoading(false) }
  }, [])

  useEffect(() => { void loadMemory(0) }, [loadMemory])

  return (
    <div className="min-h-screen bg-background"><Header /><main className="container mx-auto space-y-8 px-4 py-8">
      <div><h1 className="text-3xl font-bold">Compliance Memory</h1><p className="text-muted-foreground">Institutional history captured across verification, review, correction, and risk workflows.</p></div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Memory Events</CardTitle><Database className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.totalMemoryEntries ?? '—'}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Inspector Histories</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.inspectorHistories ?? '—'}</div></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Risk Histories</CardTitle><ShieldAlert className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats?.riskHistories ?? '—'}</div></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><BrainCircuit className="h-5 w-5" />Event History</CardTitle><CardDescription>Newest events first. Metadata is shown when recorded by the workflow.</CardDescription></CardHeader><CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {loading ? <p className="text-sm text-muted-foreground">Loading compliance memory…</p> : events.length === 0 ? <p className="text-sm text-muted-foreground">No compliance memory events have been recorded.</p> : <div className="space-y-3">{events.map((event) => <div key={event.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{event.eventType.replace(/_/g, ' ')}</p><p className="text-xs text-muted-foreground">{formatDateTime(event.occurredAt)}</p></div><Badge variant="outline">{event.outcome.replace(/_/g, ' ')}</Badge></div><div className="mt-3 grid gap-2 text-sm md:grid-cols-2"><p><strong>Inspection:</strong> {event.inspectionId || '—'}</p><p><strong>Actor:</strong> {event.actor?.name || event.actorId || 'System'}</p><p><strong>Site:</strong> {event.siteId || '—'}</p><p><strong>Checklist item:</strong> {event.checklistLabel || event.checklistItemId || '—'}</p>{event.confidence !== null && event.confidence !== undefined && <p><strong>Confidence:</strong> {(event.confidence <= 1 ? event.confidence * 100 : event.confidence).toFixed(1)}%</p>}{event.reason && <p><strong>Reason:</strong> {event.reason}</p>}</div>{event.finding && <p className="mt-3 text-sm"><strong>Finding:</strong> {event.finding}</p>}{event.evidenceReference && <p className="mt-2 text-sm"><strong>Evidence:</strong> {event.evidenceReference}</p>}{event.metadata && <details className="mt-3 text-sm text-muted-foreground"><summary className="cursor-pointer">Metadata</summary><pre className="mt-2 overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(event.metadata, null, 2)}</pre></details>}</div>)}</div>}
        <div className="mt-6 flex justify-end gap-2"><Button variant="outline" size="sm" disabled={loading || offset === 0} onClick={() => void loadMemory(Math.max(0, offset - limit))}><ChevronLeft className="mr-1 h-4 w-4" />Newer</Button><Button variant="outline" size="sm" disabled={loading || !hasMore} onClick={() => void loadMemory(offset + limit)}>Older<ChevronRight className="ml-1 h-4 w-4" /></Button></div>
      </CardContent></Card>
    </main></div>
  )
}
