import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { inspectionsService } from '../services/inspections'
import { FileText, Clock, CheckCircle, TrendingUp, ArrowRight, AlertTriangle, Calendar, MapPin, Search, Bell, User } from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'

const Dashboard = () => {
  const navigate = useNavigate()
  const { data: stats, isLoading } = useQuery({
    queryKey: ['compliance-stats'],
    queryFn: () => inspectionsService.getComplianceStats(),
  })

  const { data: inspections } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionsService.getInspections({ page: 1, page_size: 5 }),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': case 'evidence_collection': return 'warning'
      case 'submitted': case 'under_review': return 'info'
      case 'cancelled': return 'error'
      default: return 'secondary'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high': return { variant: 'error', label: 'High' }
      case 'medium': return { variant: 'warning', label: 'Medium' }
      case 'low': return { variant: 'success', label: 'Low' }
      default: return { variant: 'secondary', label: priority }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Overview of inspection activities</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-64"
            />
          </div>
          <Button variant="ghost" size="sm">
            <Bell className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-success font-medium">+12%</span>
            </div>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Total Inspections</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <span className="text-xs text-success font-medium">+8%</span>
            </div>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Completed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-xs text-destructive font-medium">-3%</span>
            </div>
            <div className="text-2xl font-bold">{stats?.pending || 0}</div>
            <div className="text-sm text-muted-foreground mt-1">Pending Review</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs text-success font-medium">+2.3%</span>
            </div>
            <div className="text-2xl font-bold">{stats?.average_compliance_score?.toFixed(1) || 0}%</div>
            <div className="text-sm text-muted-foreground mt-1">Avg Compliance</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Inspections */}
        <Card className="lg:col-span-2">
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">Recent Inspections</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {inspections?.inspections?.slice(0, 5).map((inspection) => {
                const priorityBadge = getPriorityBadge(inspection.priority)
                return (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/app/inspections/${inspection.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{inspection.id.slice(0, 8)}...</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={getStatusVariant(inspection.status)} className="text-xs">
                            {inspection.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant={priorityBadge.variant} className="text-xs">
                            {priorityBadge.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{inspection.compliance_score || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">Score</div>
                    </div>
                  </div>
                )
              })}
              {inspections?.inspections?.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No inspections found</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-4"
              onClick={() => navigate('/app/inspections')}
            >
              View all inspections
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {/* High Priority */}
        <Card>
          <div className="p-6 border-b border-border">
            <h3 className="font-semibold">High Priority</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {inspections?.inspections?.filter(i => i.priority === 'high').slice(0, 3).map((inspection) => (
                <div
                  key={inspection.id}
                  className="p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="font-medium text-sm">{inspection.id.slice(0, 8)}...</span>
                    </div>
                    <Badge variant="error" className="text-xs">High</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(inspection.scheduled_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {inspections?.inspections?.filter(i => i.priority === 'high').length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-8 h-8 mx-auto text-success mb-2" />
                  <p className="text-sm text-muted-foreground">No high priority items</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">New Inspection</h4>
                <p className="text-xs text-muted-foreground">Start inspection</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Schedule</h4>
                <p className="text-xs text-muted-foreground">View calendar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Map View</h4>
                <p className="text-xs text-muted-foreground">GIS overview</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium text-sm">Analytics</h4>
                <p className="text-xs text-muted-foreground">View reports</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
