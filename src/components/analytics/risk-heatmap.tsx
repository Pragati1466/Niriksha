'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export interface RiskMarker { siteId: string; name: string; latitude: number; longitude: number; score: number; riskLevel: string; violationCount: number; inspectionCount: number }

export function RiskHeatmap({ markers }: { markers: RiskMarker[] }) {
  const [selected, setSelected] = useState<RiskMarker | null>(null)
  const color = (level: string) => level === 'CRITICAL' ? '#ef4444' : level === 'HIGH' ? '#f97316' : level === 'MEDIUM' ? '#eab308' : '#22c55e'
  const coordinate = (value: number, min: number, max: number) => min + ((value + 180) / 360) * (max - min)
  return <Card><CardHeader><CardTitle>Risk Heatmap</CardTitle><CardDescription>Live site coordinates and persisted ORDI scores</CardDescription></CardHeader><CardContent>{markers.length ? <div className="space-y-4"><div className="relative h-80 overflow-hidden rounded-lg border bg-slate-50"><svg viewBox="0 0 800 400" className="h-full w-full">{markers.map(marker => <g className="cursor-pointer" key={marker.siteId} onClick={() => setSelected(marker)}><circle cx={coordinate(marker.longitude, 40, 760)} cy={400 - coordinate(marker.latitude, 30, 370)} r={12 + Math.min(marker.score, 80) / 8} fill={color(marker.riskLevel)} opacity="0.75" /><text x={coordinate(marker.longitude, 40, 760)} y={400 - coordinate(marker.latitude, 30, 370) + 4} textAnchor="middle" fill="white" fontSize="10">{marker.score.toFixed(0)}</text></g>)}</svg></div><div className="grid gap-2 md:grid-cols-2">{markers.map(marker => <button className="rounded border p-2 text-left text-sm" key={marker.siteId} onClick={() => setSelected(marker)}><Badge variant={marker.riskLevel === 'CRITICAL' ? 'destructive' : 'outline'}>{marker.riskLevel}</Badge><span className="ml-2 font-medium">{marker.name}</span><span className="ml-2 text-muted-foreground">ORDI {marker.score.toFixed(1)}</span></button>)}</div>{selected && <div className="rounded border p-3 text-sm"><b>{selected.name}</b><p>Coordinates: {selected.latitude}, {selected.longitude}</p><p>ORDI: {selected.score.toFixed(1)} · Violations: {selected.violationCount} · Inspections: {selected.inspectionCount}</p></div>}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No sites with persisted coordinates and ORDI assessments</p>}</CardContent></Card>
}
