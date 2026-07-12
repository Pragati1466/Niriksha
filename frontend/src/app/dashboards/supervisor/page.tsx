'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Inspection, User, Site, InspectionTemplate } from '@/types'
import { formatDate } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, FileText, Eye, Plus, Calendar } from 'lucide-react'

export default function SupervisorDashboard() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [inspectors, setInspectors] = useState<User[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [templates, setTemplates] = useState<InspectionTemplate[]>([])
  const [assignmentForm, setAssignmentForm] = useState({
    siteId: '',
    templateId: '',
    inspectorId: '',
    scheduledDate: '',
    notes: ''
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPERVISOR') && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchInspections()
      fetchAssignmentData()
    }
  }, [user, isDemoMode])

  const fetchAssignmentData = async () => {
    try {
      if (isDemoMode) {
        setInspectors([
          { id: 'insp1', name: 'John Smith', email: 'john@example.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
          { id: 'insp2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'INSPECTOR', createdAt: '2024-01-01' }
        ])
        setSites([
          { id: 'site1', name: 'Restaurant A', address: '123 Main St', departmentId: 'dept1' },
          { id: 'site2', name: 'Factory B', address: '456 Industrial Ave', departmentId: 'dept2' }
        ])
        setTemplates([
          { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
          { id: 'templ2', name: 'Safety Inspection', departmentId: 'dept2', checklistItems: [] }
        ] as any)
      } else {
        const token = localStorage.getItem('token')
        const [inspectorsRes, sitesRes, templatesRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/users?role=INSPECTOR`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/api/sites`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${getApiUrl()}/api/templates`, { headers: { Authorization: `Bearer ${token}` } })
        ])
        setInspectors(await inspectorsRes.json())
        setSites(await sitesRes.json())
        setTemplates(await templatesRes.json())
      }
    } catch (error) {
      console.error('Failed to fetch assignment data:', error)
    }
  }

  const fetchInspections = async () => {
    try {
      if (isDemoMode) {
        // Use mock data for demo mode
        setInspections([
          {
            id: '1',
            siteId: 'site1',
            site: { id: 'site1', name: 'Restaurant A', address: '123 Main St', departmentId: 'dept1' },
            inspectorId: 'insp1',
            inspector: { id: 'insp1', name: 'John Smith', email: 'john@example.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
            templateId: 'templ1',
            template: { id: 'templ1', name: 'Health Inspection', departmentId: 'dept1', checklistItems: [] },
            status: 'UNDER_REVIEW',
            scheduledDate: '2024-01-15',
            completedDate: '2024-01-15',
            confidenceScore: 92,
            aiAnalysis: { flaggedItems: [{ reasoning: 'Photo quality concerns' }] },
            createdAt: '2024-01-15',
            images: [],
            checklists: [],
            violations: []
          },
          {
            id: '2',
            siteId: 'site2',
            site: { id: 'site2', name: 'Factory B', address: '456 Industrial Ave', departmentId: 'dept2' },
            inspectorId: 'insp2',
            inspector: { id: 'insp2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'INSPECTOR', createdAt: '2024-01-01' },
            templateId: 'templ2',
            template: { id: 'templ2', name: 'Safety Inspection', departmentId: 'dept2', checklistItems: [] },
            status: 'UNDER_REVIEW',
            scheduledDate: '2024-01-16',
            completedDate: '2024-01-16',
            confidenceScore: 88,
            aiAnalysis: { flaggedItems: [] },
            createdAt: '2024-01-16',
            images: [],
            checklists: [],
            violations: []
          }
        ])
      } else {
        const token = localStorage.getItem('token')
        const response = await fetch(`${getApiUrl()}/api/inspections?status=UNDER_REVIEW`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await response.json()
        setInspections(data.inspections || [])
      }
    } catch (error) {
      console.error('Failed to fetch inspections:', error)
    } finally {
      setLoadingInspections(false)
    }
  }

  const handleReview = async (inspectionId: string, approved: boolean) => {
    try {
      if (isDemoMode) {
        // In demo mode, update the local state
        setInspections(inspections.map(i => 
          i.id === inspectionId 
            ? { ...i, status: approved ? 'APPROVED' : 'REJECTED' as const }
            : i
        ))
        alert(`Inspection ${approved ? 'approved' : 'rejected'} successfully (demo mode)`)
        return
      }

      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/inspections/${inspectionId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approved ? 'APPROVED' : 'REJECTED',
        }),
      })
      fetchInspections()
    } catch (error) {
      console.error('Failed to review inspection:', error)
    }
  }

  const handleAssign = async () => {
    try {
      if (isDemoMode) {
        // In demo mode, just show a success message and add a mock inspection
        const newInspection = {
          id: `demo-${Date.now()}`,
          siteId: assignmentForm.siteId,
          site: sites.find(s => s.id === assignmentForm.siteId)!,
          inspectorId: assignmentForm.inspectorId,
          inspector: inspectors.find(i => i.id === assignmentForm.inspectorId)!,
          templateId: assignmentForm.templateId,
          template: templates.find(t => t.id === assignmentForm.templateId)!,
          status: 'ASSIGNED' as const,
          scheduledDate: assignmentForm.scheduledDate,
          notes: assignmentForm.notes,
          confidenceScore: 0,
          aiAnalysis: {},
          createdAt: new Date().toISOString(),
          images: [],
          checklists: [],
          violations: []
        }
        setInspections([...inspections, newInspection])
        setAssignDialogOpen(false)
        setAssignmentForm({ siteId: '', templateId: '', inspectorId: '', scheduledDate: '', notes: '' })
        alert('Inspection assigned successfully (demo mode)')
        return
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No authentication token found. Please login again.')
      }

      const response = await fetch(`${getApiUrl()}/api/inspections`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(assignmentForm),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to assign inspection')
      }
      setAssignDialogOpen(false)
      setAssignmentForm({ siteId: '', templateId: '', inspectorId: '', scheduledDate: '', notes: '' })
      fetchInspections()
    } catch (error) {
      console.error('Failed to assign inspection:', error)
      alert(error instanceof Error ? error.message : 'Failed to assign inspection')
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

  const pendingApprovals = inspections.filter(i => i.status === 'UNDER_REVIEW')
  const flaggedInspections = inspections.filter(i => i.aiAnalysis?.flaggedItems?.length > 0)
  const avgConfidence = inspections.reduce((acc, i) => acc + (i.confidenceScore || 0), 0) / inspections.length || 0

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
            <p className="text-muted-foreground">Review inspections and manage inspector performance</p>
          </div>
          <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Assign Inspection</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign New Inspection</DialogTitle>
                <DialogDescription>Assign an inspector to a site with a specific template</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="site">Site</Label>
                  <select
                    id="site"
                    className="w-full mt-1 p-2 border rounded"
                    value={assignmentForm.siteId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, siteId: e.target.value })}
                  >
                    <option value="">Select a site</option>
                    {sites.map((site) => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="template">Template</Label>
                  <select
                    id="template"
                    className="w-full mt-1 p-2 border rounded"
                    value={assignmentForm.templateId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, templateId: e.target.value })}
                  >
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="inspector">Inspector</Label>
                  <select
                    id="inspector"
                    className="w-full mt-1 p-2 border rounded"
                    value={assignmentForm.inspectorId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, inspectorId: e.target.value })}
                  >
                    <option value="">Select an inspector</option>
                    {inspectors.map((inspector) => (
                      <option key={inspector.id} value={inspector.id}>{inspector.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="scheduledDate">Scheduled Date</Label>
                  <Input
                    id="scheduledDate"
                    type="date"
                    value={assignmentForm.scheduledDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, scheduledDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={assignmentForm.notes}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                    placeholder="Optional notes for the inspector"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleAssign}>Assign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingApprovals.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Flagged Items</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{flaggedInspections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgConfidence.toFixed(1)}%</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Inspectors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
            <TabsTrigger value="flagged">Evidence Mismatch</TabsTrigger>
            <TabsTrigger value="inspectors">Inspector Trust Scores</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovals.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No pending approvals</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingApprovals.map((inspection) => (
                  <Card key={inspection.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-1">{inspection.site.name}</CardTitle>
                          <CardDescription className="text-base">
                            Inspector: {inspection.inspector.name}
                          </CardDescription>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary">
                            {inspection.confidenceScore?.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm border-t pt-3">
                          <span className="text-muted-foreground flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            Submitted: {formatDate(inspection.completedDate!)}
                          </span>
                          <span className="text-muted-foreground">
                            Violations: {inspection.violations.length}
                          </span>
                        </div>
                        {inspection.aiAnalysis?.flaggedItems?.length > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                              <AlertTriangle className="inline h-4 w-4 mr-1" />
                              {inspection.aiAnalysis.flaggedItems.length} items flagged for review
                            </p>
                          </div>
                        )}
                        <div className="flex gap-3 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/dashboards/supervisor/${inspection.id}`)}
                            className="flex-1"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Review Details
                          </Button>
                          <Button
                            onClick={() => handleReview(inspection.id, true)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReview(inspection.id, false)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="flagged" className="space-y-4">
            {flaggedInspections.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No flagged inspections</p>
                </CardContent>
              </Card>
            ) : (
              flaggedInspections.map((inspection) => (
                <Card key={inspection.id} className="border-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription>Inspector: {inspection.inspector.name}</CardDescription>
                      </div>
                      <Badge variant="destructive">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Flagged
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <p className="text-sm font-medium mb-2">Flagged Items:</p>
                        <ul className="text-sm space-y-1">
                          {inspection.aiAnalysis?.flaggedItems?.map((item: any, idx: number) => (
                            <li key={idx} className="text-yellow-800 dark:text-yellow-200">
                              • {item.reasoning}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/dashboards/supervisor/${inspection.id}`)}
                        className="w-full"
                      >
                        Review Full Inspection
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="inspectors">
            <Card>
              <CardHeader>
                <CardTitle>Inspector Trust Scores</CardTitle>
                <CardDescription>Monitor inspector performance and reliability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'John Smith', score: 95, inspections: 45, flagged: 2 },
                    { name: 'Sarah Johnson', score: 88, inspections: 38, flagged: 5 },
                    { name: 'Mike Davis', score: 92, inspections: 52, flagged: 3 },
                    { name: 'Emily Brown', score: 78, inspections: 29, flagged: 8 },
                  ].map((inspector) => (
                    <div key={inspector.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{inspector.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {inspector.inspections} inspections • {inspector.flagged} flagged
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">{inspector.score}%</p>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                          <div
                            className={`h-2 rounded-full ${
                              inspector.score >= 90 ? 'bg-green-500' :
                              inspector.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${inspector.score}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Inspection Trends</CardTitle>
                  <CardDescription>Monthly inspection completion rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center bg-muted rounded-lg">
                    <p className="text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Violation Distribution</CardTitle>
                  <CardDescription>Breakdown by severity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600 font-medium">Critical</span>
                      <span className="font-bold text-red-600">12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600 font-medium">High</span>
                      <span className="font-bold text-orange-600">28</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '28%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-600 font-medium">Medium</span>
                      <span className="font-bold text-yellow-600">45</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-green-600 font-medium">Low</span>
                      <span className="font-bold text-green-600">67</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>AI Accuracy</CardTitle>
                  <CardDescription>Reality verification performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-primary mb-2">94.2%</div>
                      <div className="text-sm text-muted-foreground">Overall accuracy rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Inspection completion by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { name: 'Health', percentage: 92, color: 'bg-green-500' },
                      { name: 'Safety', percentage: 88, color: 'bg-yellow-500' },
                      { name: 'Environment', percentage: 95, color: 'bg-green-500' },
                      { name: 'Building', percentage: 85, color: 'bg-orange-500' },
                    ].map((dept) => (
                      <div key={dept.name} className="text-center">
                        <div className="text-3xl font-bold mb-1">{dept.percentage}%</div>
                        <div className="text-sm text-muted-foreground mb-2">{dept.name}</div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className={`${dept.color} h-2 rounded-full`} style={{ width: `${dept.percentage}%` }}></div>
                        </div>
                      </div>
                    ))}
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
