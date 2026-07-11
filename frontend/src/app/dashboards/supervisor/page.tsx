'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Inspection } from '@/types'
import { formatDate } from '@/lib/utils'
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, FileText, Eye } from 'lucide-react'

export default function SupervisorDashboard() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPERVISOR') && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchInspections()
    }
  }, [user, isDemoMode])

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections?status=UNDER_REVIEW`, {
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
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${inspectionId}`, {
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Supervisor Dashboard</h1>
          <p className="text-muted-foreground">Review inspections and manage inspector performance</p>
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
              pendingApprovals.map((inspection) => (
                <Card key={inspection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription>Inspector: {inspection.inspector.name}</CardDescription>
                      </div>
                      <Badge>{inspection.confidenceScore?.toFixed(1)}% Confidence</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Submitted: {formatDate(inspection.completedDate!)}</span>
                        <span className="text-muted-foreground">Violations: {inspection.violations.length}</span>
                      </div>
                      {inspection.aiAnalysis?.flaggedItems?.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            {inspection.aiAnalysis.flaggedItems.length} items flagged for review
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2">
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
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleReview(inspection.id, false)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
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
                      <span className="text-sm">Critical</span>
                      <span className="font-bold">12</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">High</span>
                      <span className="font-bold">28</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Medium</span>
                      <span className="font-bold">45</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Low</span>
                      <span className="font-bold">67</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>AI Accuracy</CardTitle>
                  <CardDescription>Reality verification performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-4xl font-bold">94.2%</p>
                    <p className="text-sm text-muted-foreground mt-2">Overall accuracy rate</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Department Performance</CardTitle>
                  <CardDescription>Inspection completion by department</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { dept: 'Health', rate: 92 },
                      { dept: 'Safety', rate: 88 },
                      { dept: 'Environment', rate: 95 },
                      { dept: 'Building', rate: 85 },
                    ].map((dept) => (
                      <div key={dept.dept} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{dept.dept}</span>
                          <span>{dept.rate}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${dept.rate}%` }}
                          />
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
