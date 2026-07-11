import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Upload, FileText, Image as ImageIcon, Video, Music, Grid3x3, List, ZoomIn, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { evidenceService } from '../services/evidence'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import FileUpload from '../components/ui/FileUpload'

const Evidence = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [showUpload, setShowUpload] = useState(false)
  const [selectedEvidence, setSelectedEvidence] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [previewImage, setPreviewImage] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)

  const itemsPerPage = 12

  const { data: evidenceData, isLoading } = useQuery({
    queryKey: ['evidence', searchTerm, filterType, currentPage],
    queryFn: () => evidenceService.getAllEvidence({
      search: searchTerm,
      type: filterType === 'all' ? undefined : filterType,
      page: currentPage,
      page_size: itemsPerPage
    })
  })

  const evidence = evidenceData?.evidence || []
  const totalItems = evidenceData?.total || 0
  const totalPages = evidenceData?.total_pages || 1

  const deleteMutation = useMutation({
    mutationFn: (id) => evidenceService.deleteEvidence(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['evidence'])
    }
  })

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this evidence?')) {
      deleteMutation.mutate(id)
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.startsWith('image/')) return ImageIcon
    if (mimeType?.startsWith('video/')) return Video
    if (mimeType?.startsWith('audio/')) return Music
    return FileText
  }

  const handlePreview = (item) => {
    if (item.mime_type?.startsWith('image/')) {
      setPreviewImage(item.url || item.thumbnail_url)
    }
  }

  const closePreview = () => {
    setPreviewImage(null)
  }

  const handleDownload = (item) => {
    const link = document.createElement('a')
    link.href = item.url
    link.download = item.filename
    link.click()
  }

  const getFileTypeBadge = (mimeType) => {
    if (mimeType?.startsWith('image/')) return { variant: 'secondary', label: 'Image' }
    if (mimeType?.startsWith('video/')) return { variant: 'secondary', label: 'Video' }
    if (mimeType?.startsWith('audio/')) return { variant: 'secondary', label: 'Audio' }
    if (mimeType?.includes('pdf')) return { variant: 'secondary', label: 'PDF' }
    return { variant: 'secondary', label: 'Document' }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading evidence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Evidence</h1>
          <p className="mt-2 text-muted-foreground">Manage and monitor all evidence files</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button onClick={() => setShowUpload(!showUpload)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Evidence
          </Button>
        </div>
      </div>

      {/* File Upload */}
      {showUpload && (
        <FileUpload
          onUploadComplete={(data) => {
            setShowUpload(false)
            queryClient.invalidateQueries(['evidence'])
          }}
          onUploadError={(error) => console.error('Upload error:', error)}
          acceptedTypes={[
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'video/mp4',
            'video/webm',
            'audio/mpeg',
            'audio/wav'
          ]}
        />
      )}

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search evidence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
              <option value="audio">Audio</option>
              <option value="document">Documents</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Grid/List */}
      {evidence && evidence.evidence && evidence.evidence.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {evidence.evidence.map((item) => {
                const Icon = getFileIcon(item.mime_type)
                const typeBadge = getFileTypeBadge(item.mime_type)
                
                return (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                        {item.mime_type?.startsWith('image/') ? (
                          <img
                            src={item.url || item.thumbnail_url}
                            alt={item.filename}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon className="w-12 h-12 text-muted-foreground" />
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {item.mime_type?.startsWith('image/') && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePreview(item)}
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(item)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm truncate flex-1">
                            {item.filename}
                          </h4>
                          <Badge variant={typeBadge.variant} className="text-xs">
                            {typeBadge.label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{formatFileSize(item.file_size)}</span>
                          <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                        </div>
                        
                        {item.virus_scan_status && (
                          <Badge 
                            variant={item.virus_scan_status === 'clean' ? 'success' : 'error'}
                            className="text-xs"
                          >
                            {item.virus_scan_status === 'clean' ? 'Clean' : 'Threat Detected'}
                          </Badge>
                        )}
                        
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(item.url, '_blank')}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(item)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {evidence.evidence.map((item) => {
                const Icon = getFileIcon(item.mime_type)
                const typeBadge = getFileTypeBadge(item.mime_type)
                
                return (
                  <Card key={item.id} className="hover:border-primary/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          {item.mime_type?.startsWith('image/') ? (
                            <img
                              src={item.url || item.thumbnail_url}
                              alt={item.filename}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <Icon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {item.filename}
                            </h4>
                            <Badge variant={typeBadge.variant} className="text-xs">
                              {typeBadge.label}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{formatFileSize(item.file_size)}</span>
                            <span>•</span>
                            <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                          </div>
                          
                          {item.virus_scan_status && (
                            <Badge 
                              variant={item.virus_scan_status === 'clean' ? 'success' : 'error'}
                              className="text-xs mt-1"
                            >
                              {item.virus_scan_status === 'clean' ? 'Clean' : 'Threat Detected'}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {item.mime_type?.startsWith('image/') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(item)}
                              title="Preview"
                            >
                              <ZoomIn className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item)}
                            title="Download"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
                          >
                            <FileText className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {evidence.evidence.length > itemsPerPage && (
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, evidence.evidence.length)} to {Math.min(currentPage * itemsPerPage, evidence.evidence.length)} of {evidence.evidence.length}
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
                  Page {currentPage} of {Math.ceil(evidence.evidence.length / itemsPerPage)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(evidence.evidence.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.ceil(evidence.evidence.length / itemsPerPage)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No evidence found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm || filterType !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Upload your first evidence file to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closePreview}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Evidence
