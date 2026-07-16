'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/shared/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock, Shield, Filter, ArrowUpDown } from 'lucide-react'

interface ViolationSLA {
  id: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'OPEN' | 'RESOLVED' | 'IGNORED'
  siteName: string
  inspectorName: string
  detectedAt: string
  slaDeadline: string
  slaRemainingHours: number
  slaBreached: boolean
}

const SEVERITY_SLA_HOURS: Record<string, number> = {
  CRITICAL: 24,
  HIGH: 72,
  MEDIUM: 168, // 7 days
  LOW: 720,    // 30 days
}

export default function ViolationSLAPage() {
  const [violations, setViolations] = useState<ViolationSLA[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'sla' | 'severity'>('sla')

  useEffect(() => {
    fetchViolations()
    const interval = setInterval(fetchViolations, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchViolations = async () => {
    try {
      const response = await fetch('/api/inspections/violations')
      const data = await response.json()
      
      // Transform and calculate SLA
      const violationsWithSLA: ViolationSLA[] = (data.violations || []).map((v: any) => {
        const slaHours = SEVERITY_SLA_HOURS[v.severity] || 168
        const detectedAt = new Date(v.detectedAt || v.createdAt || new Date())
        const deadline = new Date(detectedAt.getTime() + slaHours * 60 * 60 * 1000)
        const remainingMs = deadline.getTime() - Date.now()
        const remainingHours = remainingMs / (1000 * 60 * 60)
        
        return {
          id: v.id,
          description: v.description || v.violationType || 'Unknown violation',
          severity: v.severity || 'MEDIUM',
          status: v.status || 'OPEN',
          siteName: v.site?.name || v.siteName || 'Unknown site',
          inspectorName: v.inspector?.name || v.inspectorName || 'Unknown',
          detectedAt: detectedAt.toISOString(),
          slaDeadline: deadline.toISOString(),
          slaRemainingHours: Math.round(remainingHours * 10) / 10,
          slaBreached: remainingHours <= 0,
        }
      })

      setViolations(violationsWithSLA)
    } catch (error) {
      console.error('Error fetching violations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getSlaColor = (hours: number, breached: boolean) => {
    if (breached) return 'text-red-500'
    if (hours < 6) return 'text-red-400'
    if (hours < 24) return 'text-orange-400'
    if (hours < 72) return 'text-yellow-400'
    return 'text-green-400'
  }

  const formatTimeRemaining = (hours: number, breached: boolean): string => {
    if (breached) return 'BREACHED'
    if (hours < 1) return `${Math.round(hours * 60)}m remaining`
    if (hours < 24) return `${Math.round(hours)}h remaining`
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    return `${days}d ${remainingHours}h remaining`
  }

  const filteredViolations = violations
    .filter(v => filter === 'all' || v.severity === filter)
    .sort((a, b) => {
      if (sortBy === 'sla') {
        return a.slaRemainingHours - b.slaRemainingHours
      }
      const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      return (severityOrder[a.severity] || 99) - (severityOrder[b.severity] || 99)
    })

  const breachedCount = violations.filter(v => v.slaBreached).length
  const openCount = violations.filter(v => v.status === 'OPEN').length
  const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-400" />
            Violation SLA Dashboard
          </h1>
          <p className="text-gray-400 mt-2">
            Real-time SLA tracking for open violations. Critical violations must be addressed within 24 hours.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Open Violations</p>
                  <p className="text-2xl font-bold text-white">{openCount}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">SLA Breached</p>
                  <p className="text-2xl font-bold text-red-400">{breachedCount}</p>
                </div>
                <Clock className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Critical</p>
                  <p className="text-2xl font-bold text-red-500">{criticalCount}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Compliance Rate</p>
                  <p className="text-2xl font-bold text-green-400">
                    {violations.length > 0
                      ? `${Math.round(((violations.length - breachedCount) / violations.length) * 100)}%`
                      : '100%'}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-slate-700 text-white border border-slate-600 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="all">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <button
            onClick={() => setSortBy(sortBy === 'sla' ? 'severity' : 'sla')}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowUpDown className="w-4 h-4" />
            Sort by {sortBy === 'sla' ? 'Severity' : 'SLA'}
          </button>
        </div>

        {/* Violation List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading violations...</p>
          </div>
        ) : filteredViolations.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white text-lg font-medium">No violations found</p>
              <p className="text-gray-400 mt-2">All clear! No violations matching your filter.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredViolations.map((violation) => (
              <Card
                key={violation.id}
                className={`bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors ${
                  violation.slaBreached ? 'ring-1 ring-red-500/50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(violation.severity)}>
                          {violation.severity}
                        </Badge>
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          {violation.status}
                        </Badge>
                        {violation.slaBreached && (
                          <Badge className="bg-red-500/20 text-red-300 border-red-500/30 animate-pulse">
                            SLA BREACHED
                          </Badge>
                        )}
                      </div>
                      <p className="text-white font-medium">{violation.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                        <span>📍 {violation.siteName}</span>
                        <span>👤 {violation.inspectorName}</span>
                        <span>📅 {new Date(violation.detectedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-lg font-bold ${getSlaColor(violation.slaRemainingHours, violation.slaBreached)}`}>
                        {formatTimeRemaining(violation.slaRemainingHours, violation.slaBreached)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Deadline: {new Date(violation.slaDeadline).toLocaleDateString()}
                      </div>
                      {/* Progress bar */}
                      <div className="w-32 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        {(() => {
                          const slaHours = SEVERITY_SLA_HOURS[violation.severity] || 168
                          const elapsed = slaHours - violation.slaRemainingHours
                          const progress = Math.min(100, Math.max(0, (elapsed / slaHours) * 100))
                          return (
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                violation.slaBreached ? 'bg-red-500' :
                                progress > 80 ? 'bg-red-400' :
                                progress > 50 ? 'bg-orange-400' :
                                progress > 25 ? 'bg-yellow-400' :
                                'bg-green-400'
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}