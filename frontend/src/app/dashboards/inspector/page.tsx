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
import { Calendar, Camera, FileText, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-500'
      case 'IN_PROGRESS': return 'bg-yellow-500'
      case 'SUBMITTED': return 'bg-purple-500'
      case 'UNDER_REVIEW': return 'bg-orange-500'
      case 'APPROVED': return 'bg-green-500'
      case 'REJECTED': return 'bg-red-500'
      default: return 'bg-gray-500'
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

  const assignedInspections = inspections.filter(i => i.status === 'ASSIGNED' || i.status === 'IN_PROGRESS')
  const completedInspections = inspections.filter(i => i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW' || i.status === 'APPROVED')

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Inspector Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned inspections</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <div className="text-2xl font-bold">{inspections.filter(i => i.status === 'IN_PROGRESS').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedInspections.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Violations</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inspections.reduce((acc, i) => acc + i.violations.length, 0)}</div>
            </CardContent>
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
              assignedInspections.map((inspection) => (
                <Card key={inspection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{inspection.site.name}</CardTitle>
                        <CardDescription>{inspection.site.address}</CardDescription>
                      </div>
                      <Badge className={getStatusColor(inspection.status)}>{inspection.status}</Badge>
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
                          Start Inspection
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
                      <Badge className={getStatusColor(inspection.status)}>{inspection.status}</Badge>
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
