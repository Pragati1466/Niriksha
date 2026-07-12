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
import { Inspection } from '@/types'
import { formatDate } from '@/lib/utils'
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge'
import { getApiUrl } from '@/lib/api'
import { Calendar, Camera, FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck, Download, Search, Filter, MapPin } from 'lucide-react'

export default function InspectorDashboard() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('scheduledDate')

  useEffect(() => {
    if (!loading && (!user || user.role !== 'INSPECTOR') && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchInspections()
    }
  }, [user, isDemoMode])

  // Apply filters and search
  useEffect(() => {
    let filtered = [...inspections]

    // Apply status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(i => i.status === statusFilter)
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(i => 
        i.site.name.toLowerCase().includes(query) ||
        i.site.address.toLowerCase().includes(query) ||
        i.template.name.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'scheduledDate') {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
      } else if (sortBy === 'confidenceScore') {
        return (b.confidenceScore || 0) - (a.confidenceScore || 0)
      } else if (sortBy === 'siteName') {
        return a.site.name.localeCompare(b.site.name)
      }
      return 0
    })

    setFilteredInspections(filtered)
  }, [inspections, searchQuery, statusFilter, sortBy])

  const handleDownloadReport = async (inspectionId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${getApiUrl()}/api/inspections/${inspectionId}/report`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to generate report')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inspection-report-${inspectionId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download report:', error)
    }
  }

  const fetchInspections = async () => {
    try {
      if (isDemoMode) {
        // Use mock data for demo mode
        const mockInspections: Inspection[] = [
          {
            id: '1',
            siteId: 'site1',
            site: { id: 'site1', name: 'Restaurant A', address: '123 Main St', departmentId: 'dept1' },
            inspectorId: 'insp1',
            inspector: { id: 'insp1', name: 'Demo User', email: 'demo@niriksha.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
            templateId: 'templ1',
            template: { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
            status: 'ASSIGNED',
            scheduledDate: '2024-01-20',
            confidenceScore: 0,
            aiAnalysis: {},
            createdAt: '2024-01-15',
            images: [],
            checklists: [],
            violations: []
          },
          {
            id: '2',
            siteId: 'site2',
            site: { id: 'site2', name: 'Factory B', address: '456 Industrial Ave', departmentId: 'dept2' },
            inspectorId: 'insp1',
            inspector: { id: 'insp1', name: 'Demo User', email: 'demo@niriksha.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
            templateId: 'templ2',
            template: { id: 'templ2', name: 'Safety Inspection', departmentId: 'dept2', checklistItems: [] },
            status: 'IN_PROGRESS',
            scheduledDate: '2024-01-18',
            confidenceScore: 0,
            aiAnalysis: {},
            createdAt: '2024-01-16',
            images: [],
            checklists: [],
            violations: []
          },
          {
            id: '3',
            siteId: 'site3',
            site: { id: 'site3', name: 'School C', address: '789 Education Blvd', departmentId: 'dept1' },
            inspectorId: 'insp1',
            inspector: { id: 'insp1', name: 'Demo User', email: 'demo@niriksha.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
            templateId: 'templ1',
            template: { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
            status: 'SUBMITTED',
            scheduledDate: '2024-01-15',
            completedDate: '2024-01-15',
            confidenceScore: 95,
            aiAnalysis: {},
            createdAt: '2024-01-14',
            images: [],
            checklists: [],
            violations: []
          }
        ]
        setInspections(mockInspections)
      } else {
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found. Please login again.')
        }
        const response = await fetch(`${getApiUrl()}/api/inspections`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to load inspections')
        }
        const data = await response.json()
        setInspections(data.inspections || [])
      }
    } catch (error) {
      console.error('Failed to fetch inspections:', error)
      // Show error toast in production
    } finally {
      setLoadingInspections(false)
    }
  }

  if (loading || loadingInspections) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  const assignedInspections = filteredInspections.filter(i => i.status === 'ASSIGNED')
  const inProgressInspections = filteredInspections.filter(i => i.status === 'IN_PROGRESS' || i.status === 'VERIFYING')
  const completedInspections = filteredInspections.filter(i => ['VERIFIED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(i.status))
  const heldInspections = filteredInspections.filter(i => i.status === 'HOLD_FOR_REVIEW')
  const today = new Date().toDateString()
  const verifiedToday = filteredInspections.filter(i => i.status === 'VERIFIED' && i.completedDate && new Date(i.completedDate).toDateString() === today).length
  const confidenceValues = filteredInspections.map(i => i.confidenceScore).filter((value): value is number => typeof value === 'number')
  const averageConfidence = confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-3xl font-bold">Inspector Dashboard</h1><p className="text-muted-foreground">Manage your assigned inspections</p></div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/compliance-memory')}>Compliance Memory</Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by site name, address, or template..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="ASSIGNED">Assigned</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="SUBMITTED">Submitted</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="HOLD_FOR_REVIEW">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduledDate">Scheduled Date</SelectItem>
                    <SelectItem value="confidenceScore">Confidence Score</SelectItem>
                    <SelectItem value="siteName">Site Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignedInspections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressInspections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{verifiedToday}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Held for Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{heldInspections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Verification Confidence</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold">{averageConfidence === null ? '—' : `${averageConfidence.toFixed(1)}%`}</div></CardContent>
          </Card>
        </div>

        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned">Assigned Inspections</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="assigned" className="space-y-4">
            {assignedInspections.length === 0 && inProgressInspections.length === 0 && heldInspections.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No assigned inspections</p>
                    <p className="text-sm text-muted-foreground">Contact your supervisor to get new assignments</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              [...assignedInspections, ...inProgressInspections, ...heldInspections].map((inspection) => (
                <Card key={inspection.id} className={inspection.status === 'HOLD_FOR_REVIEW' ? 'border-yellow-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          {inspection.site.name}
                          {inspection.status === 'HOLD_FOR_REVIEW' && (
                            <Badge variant="destructive" className="ml-2">
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Action Required
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" />
                          {inspection.site.address}
                        </CardDescription>
                      </div>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Scheduled</p>
                          <p className="font-medium">{formatDate(inspection.scheduledDate)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Template</p>
                          <p className="font-medium">{inspection.template.name}</p>
                        </div>
                      </div>
                      {inspection.status === 'HOLD_FOR_REVIEW' && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            This inspection is held for review. Address AI findings or request override.
                          </p>
                        </div>
                      )}
                      <Button
                        onClick={() => router.push(`/dashboards/inspector/${inspection.id}`)}
                        className="w-full"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        {inspection.status === 'HOLD_FOR_REVIEW' ? 'Resolve Review Hold' : inspection.status === 'IN_PROGRESS' ? 'Continue Inspection' : 'Start Inspection'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedInspections.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No completed inspections</p>
                    <p className="text-sm text-muted-foreground">Completed inspections will appear here</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              completedInspections.map((inspection) => (
                <Card key={inspection.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <MapPin className="h-3 w-3" />
                          {inspection.site.address}
                        </CardDescription>
                      </div>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Completed</p>
                          <p className="font-medium">{formatDate(inspection.completedDate!)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Confidence</p>
                          <p className="font-medium">{inspection.confidenceScore?.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Violations</p>
                          <p className="font-medium">{inspection.violations?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboards/inspector/${inspection.id}`)}
                          className="flex-1"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </Button>
                        {inspection.status === 'APPROVED' && (
                          <Button
                            variant="outline"
                            onClick={() => handleDownloadReport(inspection.id)}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Previous Reports</CardTitle>
                <CardDescription>View and download your inspection reports</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Reports will appear here after inspections are approved.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
