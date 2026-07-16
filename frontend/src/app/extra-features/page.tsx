'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Shield, Activity, Brain, MapPin, Clock, BarChart3, Network, Search, Filter, Download,
  ArrowUp, ArrowDown, Star, Target, Zap, RefreshCw, Layers, Bell, Building2, AlertTriangle,
  CheckCircle, XCircle, TrendingUp, Users, FileText, Eye, Plus, Calendar, Mic, Volume2,
  Fingerprint, GitBranch, Radio, ShieldCheck, Siren, Hexagon, GitCommit, GitPullRequest,
  Globe, Thermometer, Wifi, WifiOff
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'


const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://niriksha.onrender.com'


const COLORS = {
  critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e',
  primary: '#8b5cf6', secondary: '#ec4899', info: '#06b6d4',
}

export default function ExtraFeaturesPage() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('war-room')
  const [warRoomData, setWarRoomData] = useState<any>(null)
  const [dnaData, setDnaData] = useState<any>(null)
  const [passportData, setPassportData] = useState<any>(null)
  const [metaAuditData, setMetaAuditData] = useState<any>(null)
  const [predictiveHeatmap, setPredictiveHeatmap] = useState<any>(null)
  const [whatIfResult, setWhatIfResult] = useState<any>(null)
  const [aiDebateResult, setAiDebateResult] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(false)
  const [whatIfScenario, setWhatIfScenario] = useState('reassign_inspector')
  const [selectedInspector, setSelectedInspector] = useState('i1')
  const [selectedSite, setSelectedSite] = useState('s1')
  const [inspectorTrustData, setInspectorTrustData] = useState<any>(null)

  // Demo data
  const demoWarRoom = {
    activeInspections: 12, activeInspectors: 8, criticalAlerts: 3,
    mapMarkers: [
      { id: 'i1', site: 'GreenLeaf Restaurant', lat: 28.6139, lng: 77.209, status: 'IN_PROGRESS', inspector: 'Amit Patel', trustScore: 92, violations: 2, mismatches: 1 },
      { id: 'i2', site: 'SteelTech Factory', lat: 19.076, lng: 72.8777, status: 'SUBMITTED', inspector: 'Priya Singh', trustScore: 88, violations: 5, mismatches: 3 },
      { id: 'i3', site: 'City Hospital', lat: 12.9716, lng: 77.5946, status: 'UNDER_REVIEW', inspector: 'Rahul Verma', trustScore: 95, violations: 1, mismatches: 0 },
    ],
    alertTicker: [
      { id: 'a1', type: 'EVIDENCE_MISMATCH', message: 'GreenLeaf: Food storage temp mismatch detected', severity: 'HIGH', timestamp: new Date().toISOString() },
      { id: 'a2', type: 'RISK_ALERT', message: 'SteelTech: Chemical storage violation pattern detected', severity: 'CRITICAL', timestamp: new Date().toISOString() },
      { id: 'a3', type: 'EVIDENCE_MISMATCH', message: 'Harbor Hotel: Fire exit photo does not match claim', severity: 'HIGH', timestamp: new Date().toISOString() },
    ],
    inspectorGrid: [
      { id: 'i1', name: 'Amit Patel', trustScore: 92, activeInspections: 2, status: 'IN_FIELD' },
      { id: 'i2', name: 'Priya Singh', trustScore: 88, activeInspections: 1, status: 'IN_FIELD' },
      { id: 'i3', name: 'Rahul Verma', trustScore: 95, activeInspections: 0, status: 'AVAILABLE' },
      { id: 'i4', name: 'Sneha Reddy', trustScore: 76, activeInspections: 3, status: 'IN_FIELD' },
    ],
    ordiScores: [
      { inspectionId: 'i1', site: 'GreenLeaf', mismatchCount: 3, severity: 'HIGH' },
      { inspectionId: 'i2', site: 'SteelTech', mismatchCount: 5, severity: 'CRITICAL' },
    ],
  }

  const demoDna = {
    siteName: 'GreenLeaf Restaurant', overallHealth: 72,
    dnaScores: [
      { axis: 'Food Safety', score: 65, totalItems: 12 },
      { axis: 'Structural', score: 80, totalItems: 8 },
      { axis: 'Electrical', score: 90, totalItems: 6 },
      { axis: 'Fire', score: 55, totalItems: 10 },
      { axis: 'Hygiene', score: 70, totalItems: 15 },
      { axis: 'Documentation', score: 75, totalItems: 5 },
    ],
    recurringIssues: [
      { checklistLabel: 'Food storage temperature', occurrences: 4, repeatedViolation: true },
      { checklistLabel: 'Fire extinguisher service date', occurrences: 2, repeatedViolation: true },
    ],
    violationDistribution: { CRITICAL: 3, HIGH: 5, MEDIUM: 8, LOW: 12 },
    totalInspections: 18,
  }

  const demoPassport = {
    inspectionId: 'i1', siteName: 'GreenLeaf Restaurant', status: 'APPROVED',
    chain: [
      { index: 0, event: 'INSPECTION_CREATED', timestamp: '2026-07-01T09:00:00Z', hash: 'a1b2c3...', previousHash: '0000...' },
      { index: 1, event: 'EVIDENCE_UPLOADED', timestamp: '2026-07-01T10:30:00Z', hash: 'd4e5f6...', previousHash: 'a1b2c3...' },
      { index: 2, event: 'CHECKLIST_UPDATED', timestamp: '2026-07-01T11:00:00Z', hash: 'g7h8i9...', previousHash: 'd4e5f6...' },
      { index: 3, event: 'AI_VERIFICATION', timestamp: '2026-07-01T11:30:00Z', hash: 'j0k1l2...', previousHash: 'g7h8i9...' },
      { index: 4, event: 'REVIEW_ACTION', timestamp: '2026-07-02T09:00:00Z', hash: 'm3n4o5...', previousHash: 'j0k1l2...' },
      { index: 5, event: 'REPORT_VERSION', timestamp: '2026-07-02T10:00:00Z', hash: 'p6q7r8...', previousHash: 'm3n4o5...' },
    ],
    rootHash: 'abc123def456...', chainLength: 6, verified: true,
  }

  const demoMetaAudit = {
    reportDate: new Date().toISOString(),
    agentPerformance: {
      realityVerification: { totalDecisions: 45, overridden: 7, accuracy: 84, topBlindSpots: [{ siteName: 'SteelTech Factory', overrideCount: 3 }, { siteName: 'City Hospital', overrideCount: 2 }] },
      trustEvolution: { totalUpdates: 89, correctionsApplied: 12 },
    },
    sitePatterns: [
      { siteName: 'SteelTech Factory', overrides: 3, agents: { 'Reality Verification': 3 } },
      { siteName: 'City Hospital', overrides: 2, agents: { 'Reality Verification': 2 } },
    ],
    overrides: [
      { inspectionId: 'i1', site: 'SteelTech Factory', inspector: 'Priya Singh', action: 'REJECT', reviewer: 'Rajesh Kumar', date: '2026-07-10' },
    ],
    recommendations: '1. Reality Verification Agent shows a blind spot for industrial sites - consider retraining with more industrial inspection data.\n2. Trust Evolution Agent corrections are healthy - inspectors are responding well to feedback.\n3. Monitor SteelTech Factory closely - it has the highest override rate across all sites.',
    selfImproving: true,
  }

  const demoPredictiveHeatmap = {
    historical: [
      { id: 's1', name: 'GreenLeaf', lat: 28.6139, lng: 77.209, risk: 0.45, type: 'historical' },
      { id: 's2', name: 'SteelTech', lat: 19.076, lng: 72.8777, risk: 0.72, type: 'historical' },
      { id: 's3', name: 'City Hospital', lat: 12.9716, lng: 77.5946, risk: 0.28, type: 'historical' },
    ],
    predicted: [
      { id: 's1', name: 'GreenLeaf', lat: 28.6139, lng: 77.209, risk: 0.58, type: 'predicted' },
      { id: 's2', name: 'SteelTech', lat: 19.076, lng: 72.8777, risk: 0.89, type: 'predicted' },
      { id: 's3', name: 'City Hospital', lat: 12.9716, lng: 77.5946, risk: 0.35, type: 'predicted' },
    ],
    highRiskCount: 2,
  }

  const demoInspectorTrust = {
    currentScore: 92,
    timeline: [
      { date: '2026-06-01', type: 'IMPROVEMENT', score: 88, change: 2, reason: 'All inspections approved this week' },
      { date: '2026-06-15', type: 'DECLINE', score: 85, change: -3, reason: 'Evidence mismatch flagged in kitchen inspection' },
      { date: '2026-07-01', type: 'IMPROVEMENT', score: 90, change: 5, reason: 'Corrected all findings, supervisor approved' },
      { date: '2026-07-10', type: 'IMPROVEMENT', score: 92, change: 2, reason: 'Consistent high-quality submissions' },
    ],
    improvementPlan: '1. Continue thorough evidence documentation for all checklist items.\n2. Double-check food storage temperature readings before submitting.\n3. Maintain communication with supervisor on any ambiguous findings.',
    totalInspections: 18,
    flaggedInspections: 2,
  }

  useEffect(() => {
    if (!loading && !user && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchData()
    }
  }, [user, isDemoMode, activeTab])

  const fetchData = async () => {
    setLoadingData(true)
    try {
      if (isDemoMode) {
        switch (activeTab) {
          case 'war-room': setWarRoomData(demoWarRoom); break
          case 'compliance-dna': setDnaData(demoDna); break
          case 'passport': setPassportData(demoPassport); break
          case 'meta-audit': setMetaAuditData(demoMetaAudit); break
          case 'predictive-heatmap': setPredictiveHeatmap(demoPredictiveHeatmap); break
          case 'trust-timeline': setInspectorTrustData(demoInspectorTrust); break
        }
      } else {
        const token = localStorage.getItem('token')
        if (!token) return
        switch (activeTab) {
          case 'war-room': {
            const res = await fetch(`${API_BASE}/api/extra/war-room`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setWarRoomData(await res.json())
            break
          }
          case 'compliance-dna': {
            const res = await fetch(`${API_BASE}/api/extra/site/s1/compliance-dna`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setDnaData(await res.json())
            break
          }
          case 'passport': {
            const res = await fetch(`${API_BASE}/api/extra/inspections/i1/passport`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setPassportData(await res.json())
            break
          }
          case 'meta-audit': {
            const res = await fetch(`${API_BASE}/api/extra/meta-audit`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setMetaAuditData(await res.json())
            break
          }
          case 'predictive-heatmap': {
            const res = await fetch(`${API_BASE}/api/extra/predictive-heatmap`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setPredictiveHeatmap(await res.json())
            break
          }
          case 'trust-timeline': {
            const res = await fetch(`${API_BASE}/api/extra/inspector/i1/trust-timeline`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setInspectorTrustData(await res.json())
            break
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const runWhatIf = async () => {
    setLoadingData(true)
    try {
      if (isDemoMode) {
        setWhatIfResult({
          scenario: whatIfScenario === 'reassign_inspector' ? 'Inspector Reassignment' : 'Missed Inspection',
          currentTrustScore: 85,
          projectedTrustScore: 92,
          projectedIn: '15 days',
          confidence: 0.75,
          recommendation: 'Reassign to lower-risk sites for 2 weeks to rebuild confidence',
        })
      } else {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/extra/simulate/what-if`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenario: whatIfScenario, inspectorId: selectedInspector, siteId: selectedSite }),
        })
        if (res.ok) setWhatIfResult(await res.json())
      }
    } catch (error) {
      console.error('Failed to run simulation:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const runAiDebate = async () => {
    setLoadingData(true)
    try {
      if (isDemoMode) {
        setAiDebateResult({
          model1: { name: 'Strict Verifier (Llama 70B)', verified: false, confidence: 0.65, findings: ['Food storage temp claim does not match photo evidence'], explanation: 'Photo shows thermometer at 8°C but claim states 3°C' },
          model2: { name: 'Lenient Verifier (Llama 70B)', verified: true, confidence: 0.72, findings: ['Temperature discrepancy within acceptable margin'], explanation: 'The 5°C difference could be due to door opening' },
          consensus: { agreed: false, finalVerdict: 'FLAGGED_FOR_REVIEW', averageConfidence: 0.685, needsSupervisorReview: true },
        })
      } else {
        const token = localStorage.getItem('token')
        const res = await fetch(`${API_BASE}/api/extra/ai-debate`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ inspectionData: { id: 'i1', site: 'GreenLeaf' }, checklistData: [{ item: 'Food storage temp', status: 'COMPLIANT' }] }),
        })
        if (res.ok) setAiDebateResult(await res.json())
      }
    } catch (error) {
      console.error('Failed to run AI debate:', error)
    } finally {
      setLoadingData(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <Header />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">NIRIKSHA Extraordinary Features</h1>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Activity className="w-3 h-3 mr-1 animate-pulse" /> 10 Features
            </Badge>
          </div>
          <p className="text-white/50">Next-generation capabilities that set NIRIKSHA apart</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10 flex-wrap">
            <TabsTrigger value="war-room" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Radio className="w-4 h-4 mr-1" /> War Room
            </TabsTrigger>
            <TabsTrigger value="trust-timeline" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Star className="w-4 h-4 mr-1" /> Trust Timeline
            </TabsTrigger>
            <TabsTrigger value="compliance-dna" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Fingerprint className="w-4 h-4 mr-1" /> Compliance DNA
            </TabsTrigger>
            <TabsTrigger value="what-if" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <GitBranch className="w-4 h-4 mr-1" /> What-If Simulator
            </TabsTrigger>
            <TabsTrigger value="passport" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <ShieldCheck className="w-4 h-4 mr-1" /> Passport
            </TabsTrigger>
            <TabsTrigger value="ai-debate" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Brain className="w-4 h-4 mr-1" /> AI Debate
            </TabsTrigger>
            <TabsTrigger value="predictive-heatmap" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Globe className="w-4 h-4 mr-1" /> Predictive Map
            </TabsTrigger>
            <TabsTrigger value="meta-audit" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">
              <Hexagon className="w-4 h-4 mr-1" /> Meta-Audit
            </TabsTrigger>
          </TabsList>

          {/* FEATURE 5: WAR ROOM */}
          <TabsContent value="war-room" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Siren className="w-6 h-6 text-red-400" /> War Room
                </h2>
                <p className="text-white/50">Live operations center — mission control for inspections</p>
              </div>
              <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={fetchData}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>

            {/* KPI Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-white/50">Active Inspections</p><p className="text-2xl font-bold text-white">{warRoomData?.activeInspections || 0}</p></div>
                  <Activity className="w-8 h-8 text-purple-400" />
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-white/50">Inspectors in Field</p><p className="text-2xl font-bold text-white">{warRoomData?.activeInspectors || 0}</p></div>
                  <Users className="w-8 h-8 text-blue-400" />
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-white/50">Critical Alerts</p><p className="text-2xl font-bold text-red-400">{warRoomData?.criticalAlerts || 0}</p></div>
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 flex items-center justify-between">
                  <div><p className="text-xs text-white/50">ORDI Flags</p><p className="text-2xl font-bold text-yellow-400">{warRoomData?.ordiScores?.length || 0}</p></div>
                  <Target className="w-8 h-8 text-yellow-400" />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Map View */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl lg:col-span-2">
                <CardHeader><CardTitle className="text-white">Live Inspection Map</CardTitle><CardDescription className="text-white/50">Real-time inspector locations and status</CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80 bg-slate-800/50 rounded-lg relative overflow-hidden">
                    {/* Simulated map */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(139,92,246,0.1)_0%,_transparent_70%)]" />
                    {warRoomData?.mapMarkers?.map((marker: any, idx: number) => (
                      <div key={idx} className="absolute" style={{ left: `${20 + idx * 30}%`, top: `${30 + idx * 15}%` }}>
                        <div className={`w-4 h-4 rounded-full ${marker.status === 'IN_PROGRESS' ? 'bg-green-500' : marker.status === 'SUBMITTED' ? 'bg-yellow-500' : 'bg-purple-500'} animate-ping absolute`} />
                        <div className={`w-4 h-4 rounded-full ${marker.status === 'IN_PROGRESS' ? 'bg-green-500' : marker.status === 'SUBMITTED' ? 'bg-yellow-500' : 'bg-purple-500'} relative`} />
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                          <p className="text-xs text-white/80 bg-slate-900/90 px-2 py-1 rounded">{marker.site}</p>
                        </div>
                      </div>
                    ))}
                    <div className="absolute bottom-4 left-4 flex gap-4 text-xs text-white/40">
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> In Progress</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Submitted</span>
                      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500" /> Under Review</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Alert Ticker */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white flex items-center gap-2"><Bell className="w-4 h-4 text-red-400" /> Alert Ticker</CardTitle><CardDescription className="text-white/50">Live AI alerts</CardDescription></CardHeader>
                <CardContent className="space-y-3 max-h-80 overflow-y-auto">
                  {warRoomData?.alertTicker?.map((alert: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border ${alert.severity === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}>
                          {alert.severity}
                        </Badge>
                        <span className="text-xs text-white/40">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-white/80">{alert.message}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Inspector Grid */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-white">Inspector Status Grid</CardTitle><CardDescription className="text-white/50">Real-time inspector availability and trust scores</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {warRoomData?.inspectorGrid?.map((insp: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-lg border ${insp.status === 'IN_FIELD' ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-500/10 border-slate-500/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-medium">{insp.name}</p>
                        <div className={`w-2 h-2 rounded-full ${insp.status === 'IN_FIELD' ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Trust: <span className="text-white font-bold">{insp.trustScore}</span></span>
                        <span className="text-white/50">Active: <span className="text-white">{insp.activeInspections}</span></span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">{insp.status === 'IN_FIELD' ? '🔴 In the field' : '🟢 Available'}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURE 2: TRUST TIMELINE */}
          <TabsContent value="trust-timeline" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-400" /> Black Mirror Score Card
              </h2>
              <p className="text-white/50">Inspector trust score timeline with personalized improvement plans</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <div className="text-5xl font-bold text-green-400 mb-2">{inspectorTrustData?.currentScore || 92}</div>
                  <p className="text-white/50">Current Trust Score</p>
                  <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full" style={{ width: `${inspectorTrustData?.currentScore || 92}%` }} />
                  </div>
                  <div className="mt-4 flex justify-center gap-4 text-sm">
                    <span className="text-white/50">Total: <strong className="text-white">{inspectorTrustData?.totalInspections || 18}</strong></span>
                    <span className="text-white/50">Flagged: <strong className="text-red-400">{inspectorTrustData?.flaggedInspections || 2}</strong></span>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl lg:col-span-2">
                <CardHeader><CardTitle className="text-white">Trust Score Timeline</CardTitle><CardDescription className="text-white/50">Score changes with event context</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inspectorTrustData?.timeline?.map((event: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-white/5">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${event.type === 'IMPROVEMENT' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                          {event.type === 'IMPROVEMENT' ? <ArrowUp className="w-5 h-5 text-green-400" /> : <ArrowDown className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-white font-medium">{event.type === 'IMPROVEMENT' ? `+${event.change}` : event.change} points</p>
                            <span className="text-xs text-white/40">{new Date(event.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-white/60 mt-1">{event.reason}</p>
                        </div>
                        <div className="text-lg font-bold text-white">{event.score}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-white/5 border-purple-500/20 backdrop-blur-xl">
              <CardHeader><CardTitle className="text-white flex items-center gap-2"><Brain className="w-5 h-5 text-purple-400" /> AI-Generated Improvement Plan</CardTitle></CardHeader>
              <CardContent>
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <p className="text-white/80 whitespace-pre-line">{inspectorTrustData?.improvementPlan || 'Continue maintaining high standards of inspection accuracy and evidence documentation.'}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURE 3: COMPLIANCE DNA */}
          <TabsContent value="compliance-dna" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Fingerprint className="w-6 h-6 text-purple-400" /> Compliance DNA — Site Fingerprint
              </h2>
              <p className="text-white/50">Every site has a unique compliance fingerprint. Know it before you inspect.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Site: {dnaData?.siteName || 'GreenLeaf Restaurant'}</CardTitle><CardDescription className="text-white/50">Overall Health: <strong className={dnaData?.overallHealth >= 70 ? 'text-green-400' : 'text-yellow-400'}>{dnaData?.overallHealth || 72}%</strong></CardDescription></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={dnaData?.dnaScores || demoDna.dnaScores}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="axis" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                        <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" domain={[0, 100]} />
                        <Radar name="Compliance Score" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-white">Recurring Issues</CardTitle><CardDescription className="text-white/50">Problems that keep coming back</CardDescription></CardHeader>
                  <CardContent className="space-y-3">
                    {(dnaData?.recurringIssues || demoDna.recurringIssues).map((issue: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div>
                          <p className="text-white text-sm">{issue.checklistLabel}</p>
                          <p className="text-xs text-white/40">Repeated violation</p>
                        </div>
                        <Badge className="bg-red-500/20 text-red-400">{issue.occurrences}x</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-white">Violation Distribution</CardTitle></CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={Object.entries(dnaData?.violationDistribution || demoDna.violationDistribution).map(([k, v]) => ({ name: k, value: v }))} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                            {Object.entries(dnaData?.violationDistribution || demoDna.violationDistribution).map(([k], idx) => (
                              <Cell key={idx} fill={k === 'CRITICAL' ? '#ef4444' : k === 'HIGH' ? '#f97316' : k === 'MEDIUM' ? '#eab308' : '#22c55e'} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FEATURE 4: WHAT-IF SIMULATOR */}
          <TabsContent value="what-if" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <GitBranch className="w-6 h-6 text-cyan-400" /> What-If Simulator
              </h2>
              <p className="text-white/50">Predictive scenario modeling for smarter decisions</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Configure Scenario</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-white/70">Scenario Type</Label>
                    <Select value={whatIfScenario} onValueChange={setWhatIfScenario}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="reassign_inspector">Reassign Inspector</SelectItem>
                        <SelectItem value="miss_inspection">Miss Inspection</SelectItem>
                        <SelectItem value="increase_inspections">Increase Frequency</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white/70">Inspector</Label>
                    <Select value={selectedInspector} onValueChange={setSelectedInspector}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-white/10">
                        <SelectItem value="i1">Amit Patel</SelectItem>
                        <SelectItem value="i2">Priya Singh</SelectItem>
                        <SelectItem value="i3">Rahul Verma</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white" onClick={runWhatIf} disabled={loadingData}>
                    {loadingData ? 'Simulating...' : 'Run Simulation'}
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Projected Outcome</CardTitle></CardHeader>
                <CardContent>
                  {whatIfResult ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                        <div>
                          <p className="text-white font-medium">{whatIfResult.scenario}</p>
                          <p className="text-sm text-white/50">Confidence: {Math.round(whatIfResult.confidence * 100)}%</p>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-400">{whatIfResult.projectedIn || '30 days'}</Badge>
                      </div>
                      {whatIfResult.currentTrustScore && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Current Trust Score</span>
                          <span className="text-white font-bold">{whatIfResult.currentTrustScore}</span>
                        </div>
                      )}
                      {whatIfResult.projectedTrustScore && (
                        <div className="flex justify-between text-sm">
                          <span className="text-white/50">Projected Trust Score</span>
                          <span className="text-green-400 font-bold">{whatIfResult.projectedTrustScore}</span>
                        </div>
                      )}
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <p className="text-sm text-white/80"><strong className="text-cyan-400">Recommendation:</strong> {whatIfResult.recommendation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-white/40">
                      <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Configure a scenario and run the simulation</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* FEATURE 6: INSPECTION PASSPORT */}
          <TabsContent value="passport" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-green-400" /> Inspection Passport
              </h2>
              <p className="text-white/50">Cryptographic chain of custody — tamper-evident audit trail</p>
            </div>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{passportData?.siteName || 'GreenLeaf Restaurant'}</CardTitle>
                    <CardDescription className="text-white/50">Status: {passportData?.status || 'APPROVED'} • Chain Length: {passportData?.chainLength || 6}</CardDescription>
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(passportData?.chain || demoPassport.chain).map((block: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          block.event === 'INSPECTION_CREATED' ? 'bg-blue-500/20 text-blue-400' :
                          block.event === 'EVIDENCE_UPLOADED' ? 'bg-green-500/20 text-green-400' :
                          block.event === 'CHECKLIST_UPDATED' ? 'bg-yellow-500/20 text-yellow-400' :
                          block.event === 'AI_VERIFICATION' ? 'bg-purple-500/20 text-purple-400' :
                          block.event === 'REVIEW_ACTION' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {block.event === 'INSPECTION_CREATED' ? 'IC' :
                           block.event === 'EVIDENCE_UPLOADED' ? 'EU' :
                           block.event === 'CHECKLIST_UPDATED' ? 'CU' :
                           block.event === 'AI_VERIFICATION' ? 'AI' :
                           block.event === 'REVIEW_ACTION' ? 'RA' : 'RP'}
                        </div>
                        {idx < (passportData?.chain?.length || demoPassport.chain.length) - 1 && <div className="w-0.5 h-8 bg-white/10" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-medium text-sm">{block.event.replace(/_/g, ' ')}</p>
                          <span className="text-xs text-white/40 font-mono">{block.hash?.substring(0, 12)}...</span>
                        </div>
                        <p className="text-xs text-white/40 mt-0.5">{new Date(block.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-400 font-medium">Root Hash (Integrity Fingerprint)</p>
                      <p className="text-xs text-green-400/60 font-mono mt-1">{passportData?.rootHash || demoPassport.rootHash}</p>
                    </div>
                    <Button variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20">
                      <ShieldCheck className="mr-2 h-4 w-4" /> Verify Integrity
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURE 8: AI DEBATE */}
          <TabsContent value="ai-debate" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" /> AI Debate Mode
              </h2>
              <p className="text-white/50">Multi-model consensus for higher accuracy</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Strict Verifier (Llama 70B)</CardTitle><CardDescription className="text-white/50">High threshold, low false positives</CardDescription></CardHeader>
                <CardContent className="text-center">
                  {aiDebateResult ? (
                    <>
                      <div className={`text-5xl font-bold mb-2 ${aiDebateResult.model1.verified ? 'text-green-400' : 'text-red-400'}`}>
                        {aiDebateResult.model1.verified ? '✓' : '✗'}
                      </div>
                      <p className="text-white/60 mb-4">Confidence: {Math.round(aiDebateResult.model1.confidence * 100)}%</p>
                      <div className="text-left space-y-2">
                        {aiDebateResult.model1.findings?.map((f: string, i: number) => (
                          <p key={i} className="text-sm text-white/70 bg-white/5 p-2 rounded">• {f}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-white/40 py-8">Run debate to see results</p>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Lenient Verifier (Llama 70B)</CardTitle><CardDescription className="text-white/50">Lower threshold, catches edge cases</CardDescription></CardHeader>
                <CardContent className="text-center">
                  {aiDebateResult ? (
                    <>
                      <div className={`text-5xl font-bold mb-2 ${aiDebateResult.model2.verified ? 'text-green-400' : 'text-red-400'}`}>
                        {aiDebateResult.model2.verified ? '✓' : '✗'}
                      </div>
                      <p className="text-white/60 mb-4">Confidence: {Math.round(aiDebateResult.model2.confidence * 100)}%</p>
                      <div className="text-left space-y-2">
                        {aiDebateResult.model2.findings?.map((f: string, i: number) => (
                          <p key={i} className="text-sm text-white/70 bg-white/5 p-2 rounded">• {f}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-white/40 py-8">Run debate to see results</p>
                  )}
                </CardContent>
              </Card>
            </div>
            {aiDebateResult && (
              <Card className={`bg-white/5 backdrop-blur-xl border-2 ${aiDebateResult.consensus.needsSupervisorReview ? 'border-yellow-500/50' : 'border-green-500/50'}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium text-lg">Consensus Verdict</p>
                      <p className="text-white/60">
                        {aiDebateResult.consensus.agreed ? '✅ Models Agree' : '⚠️ Models Disagree'}
                        {' • '}Avg Confidence: {Math.round(aiDebateResult.consensus.averageConfidence * 100)}%
                      </p>
                    </div>
                    <Badge className={aiDebateResult.consensus.needsSupervisorReview ? 'bg-yellow-500/20 text-yellow-400 text-sm px-4 py-2' : 'bg-green-500/20 text-green-400 text-sm px-4 py-2'}>
                      {aiDebateResult.consensus.needsSupervisorReview ? 'Needs Supervisor Review' : 'Auto-Approved'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={runAiDebate} disabled={loadingData}>
              <Brain className="mr-2 h-4 w-4" /> {loadingData ? 'Running Debate...' : 'Run AI Debate'}
            </Button>
          </TabsContent>

          {/* FEATURE 9: PREDICTIVE HEATMAP */}
          <TabsContent value="predictive-heatmap" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-orange-400" /> Predictive Risk Heatmap
              </h2>
              <p className="text-white/50">30-day risk forecast — see which sites are getting riskier</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Current Risk (Historical)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(predictiveHeatmap?.historical || demoPredictiveHeatmap.historical).map((site: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{site.name}</p>
                          <p className="text-xs text-white/40">Current risk level</p>
                        </div>
                        <div className={`text-lg font-bold ${site.risk > 0.6 ? 'text-red-400' : site.risk > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {Math.round(site.risk * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Predicted Risk (30 Days)</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(predictiveHeatmap?.predicted || demoPredictiveHeatmap.predicted).map((site: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{site.name}</p>
                          <p className="text-xs text-white/40">Projected increase: <span className="text-red-400">+{Math.round((site.risk - (predictiveHeatmap?.historical?.[idx]?.risk || 0.45)) * 100)}%</span></p>
                        </div>
                        <div className={`text-lg font-bold ${site.risk > 0.6 ? 'text-red-400' : site.risk > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>
                          {Math.round(site.risk * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">High Risk Sites (30-day forecast)</p>
                    <p className="text-3xl font-bold text-red-400">{predictiveHeatmap?.highRiskCount || 2}</p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <Calendar className="mr-2 h-4 w-4" /> Schedule All High Risk
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURE 10: META-AUDIT */}
          <TabsContent value="meta-audit" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Hexagon className="w-6 h-6 text-indigo-400" /> Meta-Audit Agent
              </h2>
              <p className="text-white/50">An agent that watches the agents — self-improving AI system</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-purple-400">{metaAuditData?.agentPerformance?.realityVerification?.accuracy || 84}%</p>
                  <p className="text-xs text-white/50">Reality Verification Accuracy</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-orange-400">{metaAuditData?.agentPerformance?.realityVerification?.overridden || 7}</p>
                  <p className="text-xs text-white/50">Supervisor Overrides</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{metaAuditData?.agentPerformance?.trustEvolution?.correctionsApplied || 12}</p>
                  <p className="text-xs text-white/50">Corrections Applied</p>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">Detected Blind Spots</CardTitle><CardDescription className="text-white/50">Sites where AI was overridden most</CardDescription></CardHeader>
                <CardContent className="space-y-3">
                  {(metaAuditData?.sitePatterns || demoMetaAudit.sitePatterns).map((pattern: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div>
                        <p className="text-white font-medium">{pattern.siteName}</p>
                        <p className="text-xs text-white/40">Agent: Reality Verification</p>
                      </div>
                      <Badge className="bg-red-500/20 text-red-400">{pattern.overrides} overrides</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader><CardTitle className="text-white">AI Recommendations</CardTitle><CardDescription className="text-white/50">Generated by Meta-Audit Agent</CardDescription></CardHeader>
                <CardContent>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4">
                    <p className="text-white/80 whitespace-pre-line">{metaAuditData?.recommendations || demoMetaAudit.recommendations}</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-green-400">
                    <Activity className="w-4 h-4 animate-pulse" />
                    <span>Self-improving system — agents will retrain based on this report</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}