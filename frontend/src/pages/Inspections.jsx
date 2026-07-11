import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inspectionsService } from '../services/inspections'
import { Plus, Search, Filter, ArrowUpDown, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { Card, CardContent } from '../components/ui/Card'
import Badge from '../components/ui/Badge'

const Inspections = () => {
  const [page, setPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['inspections', page, searchTerm],
    queryFn: () => inspectionsService.getInspections({ page, page_size: 10, search: searchTerm }),
  })

  const createMutation = useMutation({
    mutationFn: inspectionsService.createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries(['inspections'])
      toast.success('Inspection created successfully')
    },
    onError: () => {
      toast.error('Failed to create inspection')
    },
  })

  const handleCreateInspection = () => {
    createMutation.mutate({
      inspector_id: '123e4567-e89b-12d3-a456-426614174000',
      site_id: '223e4567-e89b-12d3-a456-426614174000',
      inspection_type_id: '323e4567-e89b-12d3-a456-426614174000',
      priority: 'medium',
      scheduled_date: new Date().toISOString(),
    })
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'in_progress': return 'warning'
      case 'submitted': return 'info'
      case 'cancelled': return 'error'
      default: return 'default'
    }
  }

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'urgent': return <Badge variant="error">{priority}</Badge>
      case 'high': return <Badge variant="warning">{priority}</Badge>
      case 'medium': return <Badge variant="info">{priority}</Badge>
      case 'low': return <Badge variant="success">{priority}</Badge>
      default: return <Badge>{priority}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading inspections...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Inspections</h1>
          <p className="mt-2 text-muted-foreground">Manage and monitor all inspection activities</p>
        </div>
        <Button onClick={handleCreateInspection}>
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search inspections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="secondary" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="ghost" size="sm">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              Sort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inspections Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compliance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Violations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody>
                {data?.inspections?.map((inspection) => (
                  <tr key={inspection.id} className="border-b border-border hover:bg-accent transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-primary">{inspection.id.slice(0, 8)}...</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getStatusVariant(inspection.status)}>
                        {inspection.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {getPriorityBadge(inspection.priority)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(inspection.scheduled_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${inspection.compliance_score || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{inspection.compliance_score || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {inspection.violation_count || 0}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data?.inspections?.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <Search className="w-12 h-12 mb-4 text-muted-foreground" />
                        <p>No inspections found</p>
                        <p className="text-sm mt-2">Try adjusting your search or create a new inspection</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.total_pages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, data.total)} of {data.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage(p => Math.min(data.total_pages, p + 1))}
                  disabled={page === data.total_pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Inspections
