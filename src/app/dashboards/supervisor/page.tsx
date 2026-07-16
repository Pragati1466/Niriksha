'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api-client'
import { Inspection, User, Site, InspectionTemplate } from '@/types'
import { 
  AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, FileText, Eye, Plus, Calendar,
  Shield, Activity, Brain, MapPin, Clock, BarChart3, Network, Search, Filter, Download,
  ArrowUp, ArrowDown, Star, Target, Zap, RefreshCw, Layers, Bell, Building2
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'

const COLORS = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  primary: '#8b5cf6',
  secondary: '#ec4899',
  info: '#06b6d4',
}

const severityColors: Record<string, string> = {
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/30',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  LOW: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusColors: Record<string, string> = {
  ASSIGNED: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  IN_PROGRESS: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  SUBMITTED: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  HOLD_FOR_REVIEW: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  UNDER_REVIEW: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  APPROVED: 'bg-green-500/20 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function SupervisorDashboard() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [queue, setQueue] = useState<any[]>([])
  const [trustData, setTrustData] = useState<any[]>([])
  const [heatmapData, setHeatmapData] = useState<any[]>([])
  const [executiveData, setExecutiveData] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [memoryGraph, setMemoryGraph] = useState<any>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [riskFilter, setRiskFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')

  // Assignment dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [inspectors, setInspectors] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [assignmentForm, setAssignmentForm] = useState({
    siteId: '', templateId: '', inspectorId: '', scheduledDate: '', notes: ''
  })

  // Review dialog
  const [reviewDialog, setReviewDialog] = useState<{ open: boolean; inspection: any | null }>({ open: false, inspection: null })
  const [reviewAction, setReviewAction] = useState('')
  const [reviewComments, setReviewComments] = useState('')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPERVISOR') && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchAllData()
    }
  }, [user, isDemoMode])

  const fetchAllData = async () => {
    setLoadingData(true)
    try {
      if (isDemoMode) {
        // Mock comprehensive supervisor data
        setDashboardData({
          pendingReviews: 7,
          totalInspections: 156,
          activeInspectors: 12,
          aiAlerts: 23,
          memoryEvents: 189,
          averageConfidence: 87.3,
          averageReviewTimeHours: 4.2,
          approvalRate: 78.5,
          evidenceMismatchPercent: 14.7,
          inspectorProductivity: [
            { id: 'i1', name: 'Amit Patel', inspections: 18 },
            { id: 'i2', name: 'Priya Singh', inspections: 22 },
            { id: 'i3', name: 'Rahul Verma', inspections: 15 },
            { id: 'i4', name: 'Sneha Reddy', inspections: 20 },
          ],
          ordiKpis: { assessed: 89, averageScore: 32.5, critical: 5, priorityP0: 3 },
          trustKpis: { assessed: 12, averageScore: 84.7, below70: 2 },
        })
        setQueue([
          { inspectionId: 'i1', site: 'GreenLeaf Restaurant', inspector: 'Amit Patel', department: 'Food Safety', submissionDate: '2026-07-12', status: 'HOLD_FOR_REVIEW', aiConfidence: 62, trustScore: 92, evidenceMismatchCount: 3, ordi: { score: 68, riskLevel: 'HIGH', priority: 'P1', trend: 'RISING', contributors: {} } },
          { inspectionId: 'i2', site: 'SteelTech Factory', inspector: 'Priya Singh', department: 'Industrial Safety', submissionDate: '2026-07-11', status: 'UNDER_REVIEW', aiConfidence: 85, trustScore: 88, evidenceMismatchCount: 1, ordi: { score: 42, riskLevel: 'MEDIUM', priority: 'P2', trend: 'STABLE', contributors: {} } },
          { inspectionId: 'i3', site: 'City Hospital', inspector: 'Rahul Verma', department: 'Healthcare', submissionDate: '2026-07-10', status: 'HOLD_FOR_REVIEW', aiConfidence: 45, trustScore: 95, evidenceMismatchCount: 5, ordi: { score: 82, riskLevel: 'CRITICAL', priority: 'P0', trend: 'RISING', contributors: {} } },
          { inspectionId: 'i4', site: 'Sunrise School', inspector: 'Sneha Reddy', department: 'Education', submissionDate: '2026-07-09', status: 'UNDER_REVIEW', aiConfidence: 91, trustScore: 76, evidenceMismatchCount: 0, ordi: { score: 18, riskLevel: 'LOW', priority: 'P3', trend: 'FALLING', contributors: {} } },
          { inspectionId: 'i5', site: 'Harbor Hotel', inspector: 'Amit Patel', department: 'Fire Safety', submissionDate: '2026-07-08', status: 'HOLD_FOR_REVIEW', aiConfidence: 55, trustScore: 92, evidenceMismatchCount: 2, ordi: { score: 71, riskLevel: 'HIGH', priority: 'P1', trend: 'RISING', contributors: {} } },
        ])
        setTrustData([
          { id: 'i1', name: 'Amit Patel', currentTrust: 92, history: Array.from({ length: 20 }, (_, i) => ({ score: 85 + Math.random() * 15, createdAt: new Date(Date.now() - i * 86400000).toISOString() })), inspections: [{ id: 'a', status: 'APPROVED', confidenceScore: 88, createdAt: '2026-07-01' }] },
          { id: 'i2', name: 'Priya Singh', currentTrust: 88, history: [], inspections: [] },
          { id: 'i3', name: 'Rahul Verma', currentTrust: 95, history: [], inspections: [] },
          { id: 'i4', name: 'Sneha Reddy', currentTrust: 76, history: [], inspections: [] },
          { id: 'i5', name: 'Vikram Joshi', currentTrust: 100, history: [], inspections: [] },
          { id: 'i6', name: 'Ananya Gupta', currentTrust: 72, history: [], inspections: [] },
          { id: 'i7', name: 'Rohan Desai', currentTrust: 91, history: [], inspections: [] },
          { id: 'i8', name: 'Kavita Nair', currentTrust: 67, history: [], inspections: [] },
        ])
        setHeatmapData([
          { name: 'Zone A', latitude: 28.6139, longitude: 77.2090, score: 72, riskLevel: 'HIGH', violationCount: 12, inspectionCount: 8 },
          { name: 'Zone B', latitude: 19.0760, longitude: 72.8777, score: 45, riskLevel: 'MEDIUM', violationCount: 6, inspectionCount: 5 },
          { name: 'Zone C', latitude: 12.9716, longitude: 77.5946, score: 88, riskLevel: 'CRITICAL', violationCount: 18, inspectionCount: 7 },
          { name: 'Zone D', latitude: 13.0827, longitude: 80.2707, score: 15, riskLevel: 'LOW', violationCount: 2, inspectionCount: 4 },
        ])
        setExecutiveData({
          kpis: { totalInspections: 156, completedInspections: 98, pendingInspections: 58, criticalViolations: 23, highRiskSites: 12, averageComplianceRate: 78.5, inspectorPerformance: 84.7 },
          departmentPerformance: [
            { id: 'd1', name: 'Food Safety', inspections: 42, violations: 28, complianceRate: 82, trend: 'UP' },
            { id: 'd2', name: 'Industrial Safety', inspections: 35, violations: 31, complianceRate: 71, trend: 'DOWN' },
            { id: 'd3', name: 'Healthcare', inspections: 28, violations: 15, complianceRate: 89, trend: 'UP' },
            { id: 'd4', name: 'Fire Safety', inspections: 31, violations: 42, complianceRate: 65, trend: 'DOWN' },
            { id: 'd5', name: 'Environmental', inspections: 20, violations: 12, complianceRate: 86, trend: 'UP' },
          ],
          trends: [
            { month: '2026-01', inspections: 18, completed: 14, approvalRate: 85.7, trustScore: 88, ordiScore: 28 },
            { month: '2026-02', inspections: 22, completed: 18, approvalRate: 83.3, trustScore: 86, ordiScore: 32 },
            { month: '2026-03', inspections: 25, completed: 20, approvalRate: 80.0, trustScore: 87, ordiScore: 30 },
            { month: '2026-04', inspections: 28, completed: 22, approvalRate: 86.4, trustScore: 85, ordiScore: 35 },
            { month: '2026-05', inspections: 30, completed: 24, approvalRate: 79.2, trustScore: 84, ordiScore: 38 },
            { month: '2026-06', inspections: 33, completed: 26, approvalRate: 76.9, trustScore: 82, ordiScore: 42 },
          ],
          alerts: [
            { type: 'ORDI', severity: 'CRITICAL', site: 'City Hospital', message: 'ORDI score 82 at City Hospital', createdAt: '2026-07-12' },
            { type: 'VIOLATION', severity: 'CRITICAL', site: 'SteelTech Factory', message: 'Unsafe chemical storage detected', createdAt: '2026-07-11' },
          ],
          insights: [
            { type: 'COMPLIANCE', title: 'Fire Safety has the lowest compliance', message: '65% compliance across 31 inspections', recommendation: 'Prioritize fire safety inspections and corrective actions.' },
            { type: 'ORDI', title: 'High ORDI divergence detected', message: 'City Hospital inspection has ORDI 82', recommendation: 'Review evidence mismatches immediately.' },
          ],
        })
        setNotifications([
          { id: 'n1', type: 'WARNING', title: 'Evidence Mismatch Alert', message: 'GreenLeaf Restaurant has 3 mismatches', read: false, createdAt: '2026-07-12T10:30:00Z' },
          { id: 'n2', type: 'INFO', title: 'New Submission', message: 'SteelTech Factory inspection submitted', read: false, createdAt: '2026-07-11T14:20:00Z' },
          { id: 'n3', type: 'SUCCESS', title: 'Approval', message: 'Sunrise School inspection approved', read: true, createdAt: '2026-07-10T09:15:00Z' },
        ])
        setUnreadCount(2)
        setMemoryGraph({
          nodes: [
            { id: 'site:1', type: 'Site', label: 'GreenLeaf Restaurant' },
            { id: 'inspector:i1', type: 'Inspector', label: 'Amit Patel' },
            { id: 'inspection:i1', type: 'Inspection', label: 'i1' },
            { id: 'violation:v1', type: 'Violation', label: 'Food storage violation' },
          ],
          edges: [
            { from: 'inspector:i1', to: 'inspection:i1', type: 'inspected' },
            { from: 'inspection:i1', to: 'site:1', type: 'at_site' },
            { from: 'inspection:i1', to: 'violation:v1', type: 'flagged' },
          ],
        })
        setInspectors([
          { id: 'i1', name: 'Amit Patel', email: 'amit@niriksha.gov.in', role: 'INSPECTOR', createdAt: '2024-01-01' },
          { id: 'i2', name: 'Priya Singh', email: 'priya@niriksha.gov.in', role: 'INSPECTOR', createdAt: '2024-01-01' },
          { id: 'i3', name: 'Rahul Verma', email: 'rahul@niriksha.gov.in', role: 'INSPECTOR', createdAt: '2024-01-01' },
          { id: 'i4', name: 'Sneha Reddy', email: 'sneha@niriksha.gov.in', role: 'INSPECTOR', createdAt: '2024-01-01' },
        ])
        setSites([
          { id: 's1', name: 'GreenLeaf Restaurant', address: '123 MG Road', departmentId: 'd1' },
          { id: 's2', name: 'SteelTech Factory', address: '456 Industrial Area', departmentId: 'd2' },
          { id: 's3', name: 'City Hospital', address: '789 Health Campus', departmentId: 'd3' },
          { id: 's4', name: 'Sunrise School', address: '321 Education St', departmentId: 'd4' },
        ])
        setTemplates([
          { id: 't1', name: 'Food Safety Inspection', departmentId: 'd1', checklistItems: [] },
          { id: 't2', name: 'Industrial Safety Audit', departmentId: 'd2', checklistItems: [] },
          { id: 't3', name: 'Healthcare Compliance', departmentId: 'd3', checklistItems: [] },
        ])
      } else {
        const token = localStorage.getItem('token')
        if (!token) return

        const [dash, q, trust, heatmap, exec, notifs, graph] = await Promise.all([
          api.getSupervisorDashboard().catch(() => null),
          api.getSupervisorQueue().catch(() => ({ queue: [] })),
          api.getTrustScores().catch(() => ({ inspectors: [] })),
          api.getHeatmap().catch(() => ({ markers: [] })),
          api.getExecutiveDashboard().catch(() => null),
          api.getNotifications().catch(() => ({ notifications: [], unreadCount: 0 })),
          api.getMemoryGraph().catch(() => ({ nodes: [], edges: [] })),
        ])

        setDashboardData(dash)
        setQueue(q.queue || [])
        setTrustData(trust.inspectors || [])
        setHeatmapData(heatmap.markers || [])
        setExecutiveData(exec)
        setNotifications(notifs.notifications || [])
        setUnreadCount(notifs.unreadCount || 0)
        setMemoryGraph(graph)

        // Fetch assignment data
        const [inspectorsRes, sitesRes, templatesRes] = await Promise.all([
          api.getUsers('INSPECTOR').catch(() => []),
          api.getSites().catch(() => []),
          api.getTemplates().catch(() => []),
        ])
        setInspectors(Array.isArray(inspectorsRes) ? inspectorsRes : [])
        setSites(Array.isArray(sitesRes) ? sitesRes : [])
        setTemplates(Array.isArray(templatesRes) ? templatesRes : [])
      }
    } catch (error) {
      console.error('Failed to fetch supervisor data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAssign = async () => {
    try {
      if (isDemoMode) {
        setQueue([...queue, {
          inspectionId: `demo-${Date.now()}`,
          site: sites.find(s => s.id === assignmentForm.siteId)?.name || 'Unknown',
          inspector: inspectors.find(i => i.id === assignmentForm.inspectorId)?.name || 'Unknown',
          department: 'Various',
          submissionDate: new Date().toISOString(),
          status: 'ASSIGNED',
          aiConfidence: 0,
          trustScore: null,
          evidenceMismatchCount: 0,
          ordi: { score: 0, riskLevel: 'LOW', priority: 'P3', trend: 'NEW', contributors: {} },
        }])
        setAssignDialogOpen(false)
        setAssignmentForm({ siteId: '', templateId: '', inspectorId: '', scheduledDate: '', notes: '' })
        return
      }
      await api.createInspection(assignmentForm)
      setAssignDialogOpen(false)
      fetchAllData()
    } catch (error) {
      console.error('Failed to assign inspection:', error)
    }
  }

  const handleReview = async () => {
    if (!reviewDialog.inspection) return
    try {
      if (isDemoMode) {
        setQueue(queue.map(q => q.inspectionId === reviewDialog.inspection.inspectionId 
          ? { ...q, status: reviewAction === 'APPROVE' ? 'APPROVED' : 'REJECTED' } 
          : q
        ))
        setReviewDialog({ open: false, inspection: null })
        setReviewAction('')
        setReviewComments('')
        return
      }
      await api.reviewInspection(reviewDialog.inspection.inspectionId, {
        action: reviewAction,
        comments: reviewComments,
      })
      setReviewDialog({ open: false, inspection: null })
      setReviewAction('')
      setReviewComments('')
      fetchAllData()
    } catch (error) {
      console.error('Failed to review inspection:', error)
    }
  }

  const handleMarkNotificationsRead = async (id: string) => {
    if (isDemoMode) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(Math.max(0, unreadCount - 1))
      return
    }
    await api.markNotificationRead(id)
    fetchAllData()
  }

  const handleMarkAllRead = async () => {
    if (isDemoMode) {
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      return
    }
    await api.markAllNotificationsRead()
    fetchAllData()
  }

  // Filter queue
  const filteredQueue = useMemo(() => {
    let filtered = [...queue]
    if (statusFilter !== 'ALL') filtered = filtered.filter(i => i.status === statusFilter)
    if (riskFilter !== 'ALL') filtered = filtered.filter(i => i.ordi?.riskLevel === riskFilter)
    if (departmentFilter !== 'ALL') filtered = filtered.filter(i => i.department === departmentFilter)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(i => i.site.toLowerCase().includes(q) || i.inspector.toLowerCase().includes(q))
    }
    return filtered
  }, [queue, searchQuery, statusFilter, riskFilter, departmentFilter])

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-pink-500/30 animate-pulse" />
              <Shield className="w-12 h-12 text-purple-400 absolute inset-6" />
            </div>
            <p className="text-white/60">Loading Niriksha Control Room...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      <Header />
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-white">Supervisor Control Room</h1>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                <Activity className="w-3 h-3 mr-1 animate-pulse" /> Live
              </Badge>
            </div>
            <p className="text-white/50">AI-augmented inspection review and performance monitoring</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={fetchAllData}>
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Assign Inspection
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Assign New Inspection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/70">Site</Label>
                    <select className="w-full mt-1 p-2 rounded bg-white/5 border border-white/10 text-white" value={assignmentForm.siteId} onChange={(e) => setAssignmentForm({ ...assignmentForm, siteId: e.target.value })}>
                      <option value="">Select a site</option>
                      {sites.map(site => <option key={site.id} value={site.id}>{site.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-white/70">Template</Label>
                    <select className="w-full mt-1 p-2 rounded bg-white/5 border border-white/10 text-white" value={assignmentForm.templateId} onChange={(e) => setAssignmentForm({ ...assignmentForm, templateId: e.target.value })}>
                      <option value="">Select a template</option>
                      {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-white/70">Inspector</Label>
                    <select className="w-full mt-1 p-2 rounded bg-white/5 border border-white/10 text-white" value={assignmentForm.inspectorId} onChange={(e) => setAssignmentForm({ ...assignmentForm, inspectorId: e.target.value })}>
                      <option value="">Select an inspector</option>
                      {inspectors.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-white/70">Scheduled Date</Label>
                    <Input type="date" className="bg-white/5 border-white/10 text-white" value={assignmentForm.scheduledDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, scheduledDate: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-white/70">Notes</Label>
                    <Input className="bg-white/5 border-white/10 text-white" value={assignmentForm.notes} onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })} placeholder="Optional notes" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white" onClick={handleAssign}>Assign</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Pending Reviews</p>
                <p className="text-2xl font-bold text-white">{dashboardData?.pendingReviews || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Avg Confidence</p>
                <p className="text-2xl font-bold text-white">{dashboardData?.averageConfidence?.toFixed(1) || '—'}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">AI Alerts</p>
                <p className="text-2xl font-bold text-red-400">{dashboardData?.aiAlerts || 0}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl col-span-1 lg:col-span-2">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Approval Rate</p>
                <p className="text-2xl font-bold text-white">{dashboardData?.approvalRate?.toFixed(1) || '—'}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="overview" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">Overview</TabsTrigger>
            <TabsTrigger value="queue" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">Review Queue</TabsTrigger>
            <TabsTrigger value="trust" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">Trust Scores</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">Analytics</TabsTrigger>
            <TabsTrigger value="executive" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20">Executive View</TabsTrigger>
            <TabsTrigger value="notifications" className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-500/20 relative">
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">{unreadCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6">
            {/* ORDI KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50">ORDI Assessed</p>
                    <Target className="w-4 h-4 text-purple-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{dashboardData?.ordiKpis?.assessed || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50">Avg ORDI Score</p>
                    <Activity className="w-4 h-4 text-orange-400" />
                  </div>
                  <p className="text-2xl font-bold text-white">{dashboardData?.ordiKpis?.averageScore?.toFixed(1) || '—'}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50">Critical Risk</p>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  </div>
                  <p className="text-2xl font-bold text-red-400">{dashboardData?.ordiKpis?.critical || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white/50">P0 Priority</p>
                    <Zap className="w-4 h-4 text-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-400">{dashboardData?.ordiKpis?.priorityP0 || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Inspector Productivity */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Inspector Productivity</CardTitle>
                <CardDescription className="text-white/50">Inspections completed per inspector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardData?.inspectorProductivity || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} />
                      <YAxis stroke="rgba(255,255,255,0.4)" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                      <Bar dataKey="inspections" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Trust Score Distribution</CardTitle>
                  <CardDescription className="text-white/50">{dashboardData?.trustKpis?.assessed || 0} inspectors assessed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-white mb-1">{dashboardData?.trustKpis?.averageScore?.toFixed(1) || '—'}</div>
                      <p className="text-sm text-white/50">Average Trust Score</p>
                      <div className="mt-3 flex gap-4 justify-center">
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {dashboardData?.trustKpis?.assessed - (dashboardData?.trustKpis?.below70 || 0)} Good
                        </Badge>
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          {dashboardData?.trustKpis?.below70 || 0} Needs Review
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Evidence Mismatch</CardTitle>
                  <CardDescription className="text-white/50">AI-flagged inconsistencies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-red-400 mb-1">{dashboardData?.evidenceMismatchPercent?.toFixed(1) || '—'}%</div>
                      <p className="text-sm text-white/50">of inspections have mismatches</p>
                      <div className="mt-3">
                        <Button variant="outline" className="border-purple-500/30 text-purple-400" onClick={() => setActiveTab('queue')}>
                          <Eye className="mr-2 h-4 w-4" /> Review Queue
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* REVIEW QUEUE TAB */}
          <TabsContent value="queue" className="space-y-4">
            {/* Filters */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <Input
                      placeholder="Search site or inspector..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="HOLD_FOR_REVIEW">On Hold</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-[140px] bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-white/10">
                      <SelectItem value="ALL">All Risks</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Queue */}
            {filteredQueue.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-white/70 text-lg">No items in the review queue</p>
                  <p className="text-white/40">All caught up! New submissions will appear here.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredQueue.map((item) => (
                  <Card key={item.inspectionId} className={`bg-white/5 border backdrop-blur-xl hover:bg-white/10 transition-all ${
                    item.ordi?.riskLevel === 'CRITICAL' ? 'border-red-500/30' : 
                    item.ordi?.riskLevel === 'HIGH' ? 'border-orange-500/30' : 'border-white/10'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">{item.site}</h3>
                            <Badge className={statusColors[item.status] || 'bg-gray-500/20 text-gray-400'}>
                              {item.status?.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-white/50">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {item.inspector}
                            </span>
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" /> {item.department}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {new Date(item.submissionDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          {/* ORDI Score */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              item.ordi?.riskLevel === 'CRITICAL' ? 'text-red-400' :
                              item.ordi?.riskLevel === 'HIGH' ? 'text-orange-400' :
                              item.ordi?.riskLevel === 'MEDIUM' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {item.ordi?.score || '—'}
                            </div>
                            <div className="text-xs text-white/40">ORDI</div>
                            <Badge className={`mt-1 text-[10px] ${severityColors[item.ordi?.riskLevel] || ''}`}>
                              {item.ordi?.priority || '—'}
                            </Badge>
                          </div>
                          {/* AI Confidence */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              (item.aiConfidence || 0) >= 80 ? 'text-green-400' :
                              (item.aiConfidence || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {item.aiConfidence?.toFixed(0) || '—'}%
                            </div>
                            <div className="text-xs text-white/40">AI Confidence</div>
                          </div>
                          {/* Mismatches */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${item.evidenceMismatchCount > 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {item.evidenceMismatchCount || 0}
                            </div>
                            <div className="text-xs text-white/40">Mismatches</div>
                          </div>
                          {/* Trust Score */}
                          <div className="text-center">
                            <div className={`text-lg font-bold ${
                              (item.trustScore || 0) >= 90 ? 'text-green-400' :
                              (item.trustScore || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {item.trustScore || '—'}
                            </div>
                            <div className="text-xs text-white/40">Trust</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                            onClick={() => router.push(`/dashboards/supervisor/${item.inspectionId}`)}
                          >
                            <Eye className="mr-1 h-4 w-4" /> Review
                          </Button>
                          <Button
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              setReviewDialog({ open: true, inspection: item })
                              setReviewAction('APPROVE')
                            }}
                          >
                            <CheckCircle className="mr-1 h-4 w-4" /> 
                          </Button>
                          <Button
                            variant="destructive"
                            className="bg-red-500 hover:bg-red-600 text-white"
                            onClick={() => {
                              setReviewDialog({ open: true, inspection: item })
                              setReviewAction('REJECT')
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {item.ordi?.trend && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/40">
                          <span>Trend: </span>
                          <Badge className={`${
                            item.ordi.trend === 'RISING' ? 'bg-red-500/20 text-red-400' :
                            item.ordi.trend === 'FALLING' ? 'bg-green-500/20 text-green-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {item.ordi.trend === 'RISING' ? <ArrowUp className="w-3 h-3 mr-1" /> :
                             item.ordi.trend === 'FALLING' ? <ArrowDown className="w-3 h-3 mr-1" /> : null}
                            {item.ordi.trend}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Review Dialog */}
            <Dialog open={reviewDialog.open} onOpenChange={(open) => !open && setReviewDialog({ open: false, inspection: null })}>
              <DialogContent className="bg-slate-900 border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {reviewAction === 'APPROVE' ? 'Approve Inspection' : 'Reject Inspection'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-white/60">
                    {reviewAction === 'APPROVE' 
                      ? `Confirm approval for inspection at ${reviewDialog.inspection?.site}`
                      : `Provide feedback for rejection of ${reviewDialog.inspection?.site}`
                    }
                  </p>
                  <div>
                    <Label className="text-white/70">Comments</Label>
                    <textarea
                      className="w-full mt-1 p-2 rounded bg-white/5 border border-white/10 text-white min-h-[100px]"
                      value={reviewComments}
                      onChange={(e) => setReviewComments(e.target.value)}
                      placeholder="Add your review comments..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={() => setReviewDialog({ open: false, inspection: null })}>Cancel</Button>
                  <Button
                    className={reviewAction === 'APPROVE' ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}
                    onClick={handleReview}
                  >
                    {reviewAction === 'APPROVE' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                    {reviewAction === 'APPROVE' ? 'Confirm Approve' : 'Confirm Reject'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* TRUST SCORES TAB */}
          <TabsContent value="trust" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {trustData.map((inspector: any) => (
                <Card key={inspector.id} className={`bg-white/5 border backdrop-blur-xl ${
                  (inspector.currentTrust || 0) >= 90 ? 'border-green-500/30' :
                  (inspector.currentTrust || 0) >= 70 ? 'border-yellow-500/30' : 'border-red-500/30'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{inspector.name}</h3>
                        <p className="text-sm text-white/50">Trust Score</p>
                      </div>
                      <div className={`text-3xl font-bold ${
                        (inspector.currentTrust || 0) >= 90 ? 'text-green-400' :
                        (inspector.currentTrust || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {inspector.currentTrust || '—'}
                      </div>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-4">
                      <div className={`h-full rounded-full transition-all ${
                        (inspector.currentTrust || 0) >= 90 ? 'bg-green-500' :
                        (inspector.currentTrust || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${inspector.currentTrust || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-sm text-white/40">
                      <span>{inspector.inspections?.length || 0} inspections</span>
                      <span>Trust Evolution Agent</span>
                    </div>
                    {inspector.history?.length > 0 && (
                      <div className="mt-4 h-20">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inspector.history}>
                            <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Inspection Trends</CardTitle>
                  <CardDescription className="text-white/50">Inspections over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={executiveData?.trends || []}>
                        <defs>
                          <linearGradient id="inspectionGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                        <YAxis stroke="rgba(255,255,255,0.4)" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                        <Area type="monotone" dataKey="inspections" stroke="#8b5cf6" fill="url(#inspectionGradient)" strokeWidth={2} />
                        <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#inspectionGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Department Performance</CardTitle>
                  <CardDescription className="text-white/50">Compliance rates by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={executiveData?.departmentPerformance?.map((d: any) => ({ ...d, complianceRate: d.complianceRate || 0 })) || []}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis dataKey="name" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 10 }} />
                        <PolarRadiusAxis stroke="rgba(255,255,255,0.2)" />
                        <Radar name="Compliance Rate" dataKey="complianceRate" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Risk Heatmap</CardTitle>
                  <CardDescription className="text-white/50">Geographic distribution of risk</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {heatmapData.map((zone, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                          <p className="text-white font-medium">{zone.name}</p>
                          <p className="text-xs text-white/40">{zone.inspectionCount} inspections • {zone.violationCount} violations</p>
                        </div>
                        <Badge className={severityColors[zone.riskLevel] || ''}>
                          {zone.riskLevel} • {zone.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Violation Distribution</CardTitle>
                  <CardDescription className="text-white/50">By severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Critical', value: 23, color: '#ef4444' },
                            { name: 'High', value: 45, color: '#f97316' },
                            { name: 'Medium', value: 67, color: '#eab308' },
                            { name: 'Low', value: 89, color: '#22c55e' },
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[
                            { name: 'Critical', color: '#ef4444' },
                            { name: 'High', color: '#f97316' },
                            { name: 'Medium', color: '#eab308' },
                            { name: 'Low', color: '#22c55e' },
                          ].map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* EXECUTIVE VIEW TAB */}
          <TabsContent value="executive" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-xs text-white/50 mb-1">Total Inspections</p>
                  <p className="text-2xl font-bold text-white">{executiveData?.kpis?.totalInspections || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-xs text-white/50 mb-1">Completed</p>
                  <p className="text-2xl font-bold text-green-400">{executiveData?.kpis?.completedInspections || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-xs text-white/50 mb-1">Critical Violations</p>
                  <p className="text-2xl font-bold text-red-400">{executiveData?.kpis?.criticalViolations || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-4">
                  <p className="text-xs text-white/50 mb-1">Avg Compliance</p>
                  <p className="text-2xl font-bold text-white">{executiveData?.kpis?.averageComplianceRate?.toFixed(1) || '—'}%</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Department Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {executiveData?.departmentPerformance?.map((dept: any) => (
                      <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="flex-1">
                          <p className="text-white font-medium">{dept.name}</p>
                          <p className="text-xs text-white/40">{dept.inspections} inspections • {dept.violations} violations</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full"
                              style={{ width: `${dept.complianceRate || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold text-white w-10 text-right">{dept.complianceRate}%</span>
                          <Badge className={dept.trend === 'UP' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                            {dept.trend === 'UP' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">AI Insights & Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {executiveData?.insights?.map((insight: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                        <div className="flex items-start gap-3">
                          <Brain className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-white font-medium mb-1">{insight.title}</p>
                            <p className="text-sm text-white/60 mb-2">{insight.message}</p>
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {insight.recommendation}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!executiveData?.insights || executiveData.insights.length === 0) && (
                      <p className="text-white/40 text-center py-8">No insights available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trends */}
            {executiveData?.trends && executiveData.trends.length > 0 && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={executiveData.trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.4)" />
                        <YAxis stroke="rgba(255,255,255,0.4)" />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }} />
                        <Line type="monotone" dataKey="approvalRate" stroke="#22c55e" strokeWidth={2} name="Approval Rate" />
                        <Line type="monotone" dataKey="trustScore" stroke="#8b5cf6" strokeWidth={2} name="Trust Score" />
                        <Line type="monotone" dataKey="ordiScore" stroke="#f97316" strokeWidth={2} name="ORDI Score" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* NOTIFICATIONS TAB */}
          <TabsContent value="notifications" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-white/50">{unreadCount} unread notifications</p>
              {unreadCount > 0 && (
                <Button variant="outline" className="border-white/20 text-white bg-white/5 hover:bg-white/10" onClick={handleMarkAllRead}>
                  Mark All Read
                </Button>
              )}
            </div>
            {notifications.length === 0 ? (
              <Card className="bg-white/5 border-white/10 backdrop-blur-xl">
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 text-white/30 mx-auto mb-4" />
                  <p className="text-white/50">No notifications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {notifications.map((n: any) => (
                  <Card key={n.id} className={`bg-white/5 border-white/10 backdrop-blur-xl ${!n.read ? 'border-purple-500/30' : ''}`}>
                    <CardContent className="p-4 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            n.type === 'SUCCESS' ? 'bg-green-500/20 text-green-400' :
                            n.type === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                            n.type === 'ERROR' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }>
                            {n.type}
                          </Badge>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-purple-500" />}
                        </div>
                        <p className="text-white font-medium">{n.title}</p>
                        <p className="text-sm text-white/50">{n.message}</p>
                        <p className="text-xs text-white/30 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                      {!n.read && (
                        <Button variant="ghost" className="text-white/50 hover:text-white" onClick={() => handleMarkNotificationsRead(n.id)}>
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}