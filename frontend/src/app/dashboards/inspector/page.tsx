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
import { InspectionStatusBadge } from '@/components/inspections/inspection-status-badge'
import { Calendar, Camera, FileText, AlertTriangle, CheckCircle, Clock, ShieldCheck } from 'lucide-react'

export default function InspectorDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loadingInspections, setLoadingInspections] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'INSPECTOR')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchInspections()
    }
  }, [user])

  const fetchInspections = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setInspections(data.inspections || [])
    } catch (error) {
      console.error('Failed to fetch inspections:', error)
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

  const assignedInspections = inspections.filter(i => i.status === 'ASSIGNED')
  const inProgressInspections = inspections.filter(i => i.status === 'IN_PROGRESS' || i.status === 'VERIFYING')
  const completedInspections = inspections.filter(i => ['VERIFIED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(i.status))
  const heldInspections = inspections.filter(i => i.status === 'HOLD_FOR_REVIEW')
  const today = new Date().toDateString()
  const verifiedToday = inspections.filter(i => i.status === 'VERIFIED' && i.completedDate && new Date(i.completedDate).toDateString() === today).length
  const confidenceValues = inspections.map(i => i.confidenceScore).filter((value): value is number => typeof value === 'number')
  const averageConfidence = confidenceValues.length ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-3xl font-bold">Inspector Dashboard</h1><p className="text-muted-foreground">Manage your assigned inspections</p></div>
            <Button variant="outline" onClick={() => router.push('/compliance-memory')}>Compliance Memory</Button>
          </div>
        </div>

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
            {assignedInspections.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">No assigned inspections</p>
                </CardContent>
              </Card>
            ) : (
              [...assignedInspections, ...inProgressInspections, ...heldInspections].map((inspection) => (
                <Card key={inspection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription>{inspection.site.address}</CardDescription>
                      </div>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Scheduled: {formatDate(inspection.scheduledDate)}</span>
                        <span className="text-muted-foreground">Template: {inspection.template.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/dashboards/inspector/${inspection.id}`)}
                          className="flex-1"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          {inspection.status === 'HOLD_FOR_REVIEW' ? 'Resolve Review Hold' : 'Open Inspection'}
                        </Button>
                      </div>
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
                  <p className="text-center text-muted-foreground">No completed inspections</p>
                </CardContent>
              </Card>
            ) : (
              completedInspections.map((inspection) => (
                <Card key={inspection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription>{inspection.site.address}</CardDescription>
                      </div>
                      <InspectionStatusBadge status={inspection.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Completed: {formatDate(inspection.completedDate!)}</span>
                        <span className="text-muted-foreground">Confidence: {inspection.confidenceScore?.toFixed(1)}%</span>
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
