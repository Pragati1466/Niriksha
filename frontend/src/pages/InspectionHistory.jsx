import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Calendar, MapPin, ArrowUpDown, FileText, Trash2, Edit, Download, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { inspectionsService } from '../services/inspections'

const InspectionHistory = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedInspections, setSelectedInspections] = useState([])

  const itemsPerPage = 10

  const { data: inspectionsData, isLoading } = useQuery({
    queryKey: ['inspections', searchQuery, statusFilter, typeFilter, currentPage],
    queryFn: () => inspectionsService.getInspections({
      search: searchQuery,
      status: statusFilter === 'all' ? undefined : statusFilter,
      type: typeFilter === 'all' ? undefined : typeFilter,
      page: currentPage,
      page_size: itemsPerPage
    })
  })

  const inspections = inspectionsData?.inspections || []
  const totalItems = inspectionsData?.total || 0
  const totalPages = inspectionsData?.total_pages || 1

  const inspectionTypes = [
    { value: 'food_safety', label: 'Food Safety' },
    { value: 'fire_safety', label: 'Fire Safety' },
    { value: 'factory', label: 'Factory' },
    { value: 'hospital', label: 'Hospital' },
    { value: 'construction', label: 'Construction' },
    { value: 'pollution', label: 'Pollution' }
  ]

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'submitted', label: 'Submitted' }
  ]

  const priorityOptions = [
    { value: 'urgent', label: 'Urgent', color: 'error' },
    { value: 'high', label: 'High', color: 'warning' },
    { value: 'medium', label: 'Medium', color: 'secondary' },
    { value: 'low', label: 'Low', color: 'success' }
  ]

  // Filter and sort inspections (API handles this, but we keep for UI display)
  const filteredInspections = inspections

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleViewInspection = (id) => {
    navigate(`/app/inspections/${id}`)
  }

  const handleEditDraft = (id) => {
    navigate(`/app/create`)
  }

  const handleDeleteInspection = (id) => {
    if (confirm('Are you sure you want to delete this inspection?')) {
      queryClient.invalidateQueries(['inspections'])
    }
  }

  const handleDownloadReport = (id) => {
    alert(`Downloading report for inspection ${id}`)
  }

  const toggleSelectInspection = (id) => {
    setSelectedInspections(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleBulkDelete = () => {
    if (confirm(`Are you sure you want to delete ${selectedInspections.length} inspection(s)?`)) {
      queryClient.invalidateQueries(['inspections'])
      setSelectedInspections([])
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeLabel = (type) => {
    return inspectionTypes.find(t => t.value === type)?.label || type
  }

  const getPriorityBadge = (priority) => {
    const option = priorityOptions.find(p => p.value === priority)
    return option ? <Badge variant={option.color}>{option.label}</Badge> : null
  }

  const getStatusBadge = (status, isDraft) => {
    if (isDraft) return <Badge variant="secondary">Draft</Badge>
    
    const statusMap = {
      draft: { variant: 'secondary', label: 'Draft' },
      scheduled: { variant: 'info', label: 'Scheduled' },
      in_progress: { variant: 'warning', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      submitted: { variant: 'success', label: 'Submitted' }
    }
    
    const config = statusMap[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Inspection History</h2>
          <p className="text-sm text-muted-foreground">
            View and manage all your inspections and drafts
          </p>
        </div>
        <Button onClick={() => navigate('/app/create')}>
          <FileText className="w-4 h-4 mr-2" />
          New Inspection
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search inspections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {(statusFilter !== 'all' || typeFilter !== 'all') && (
                <Badge variant="primary" className="ml-1">
                  {statusFilter !== 'all' && typeFilter !== 'all' ? '2' : '1'}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Types</option>
                  {inspectionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStatusFilter('all')
                    setTypeFilter('all')
                    setSearchQuery('')
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedInspections.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedInspections.length} inspection(s) selected
          </span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Inspections Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Inspections ({totalItems})
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Sort by:</span>
              <button
                onClick={() => handleSort('date')}
                className={`flex items-center gap-1 hover:text-foreground ${
                  sortBy === 'date' ? 'text-foreground font-medium' : ''
                }`}
              >
                <Calendar className="w-4 h-4" />
                Date
                {sortBy === 'date' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSort('establishment')}
                className={`flex items-center gap-1 hover:text-foreground ${
                  sortBy === 'establishment' ? 'text-foreground font-medium' : ''
                }`}
              >
                <MapPin className="w-4 h-4" />
                Location
                {sortBy === 'establishment' && (
                  <ArrowUpDown className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading inspections...</p>
            </div>
          ) : inspections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No inspections found</p>
              <Button
                variant="outline"
                onClick={() => navigate('/app/create')}
                className="mt-4"
              >
                Create New Inspection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {inspections.map(inspection => (
                <div
                  key={inspection.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedInspections.includes(inspection.id)}
                      onChange={() => toggleSelectInspection(inspection.id)}
                      className="rounded border-border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium truncate">{inspection.establishment}</h4>
                        {inspection.isDraft && (
                          <Badge variant="secondary">Draft</Badge>
                        )}
                        {getPriorityBadge(inspection.priority)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{getTypeLabel(inspection.inspectionType)}</span>
                        <span>•</span>
                        <span>{inspection.location}</span>
                        <span>•</span>
                        <span>{formatDate(inspection.inspectionDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusBadge(inspection.status, inspection.isDraft)}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewInspection(inspection.id)}
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {inspection.isDraft && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditDraft(inspection.id)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDuplicateInspection(inspection)}
                        title="Duplicate"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      {!inspection.isDraft && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReport(inspection.id)}
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteInspection(inspection.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Showing {inspections.length} of {totalItems} inspections
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InspectionHistory
