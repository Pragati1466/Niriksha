'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SlideUp, AnimatedListItem } from '@/components/ui/animations'

interface EvidenceItem {
  id: string
  imageUrl: string
  description: string
  timestamp: Date
  location?: string
  inspector?: string
  violationId?: string
}

interface EvidenceTimelineProps {
  inspectionId: string
}

export function EvidenceTimeline({ inspectionId }: EvidenceTimelineProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'VIOLATIONS' | 'COMPLIANT'>('ALL')

  useEffect(() => {
    // Simulated evidence data
    const mockEvidence: EvidenceItem[] = [
      {
        id: '1',
        imageUrl: '/api/uploads/evidence1.jpg',
        description: 'Kitchen hygiene check - food storage temperature',
        timestamp: new Date('2026-07-11T09:30:00'),
        location: 'Kitchen Area',
        inspector: 'John Smith',
        violationId: 'v1',
      },
      {
        id: '2',
        imageUrl: '/api/uploads/evidence2.jpg',
        description: 'Fire safety equipment check',
        timestamp: new Date('2026-07-11T09:45:00'),
        location: 'Main Hall',
        inspector: 'John Smith',
      },
      {
        id: '3',
        imageUrl: '/api/uploads/evidence3.jpg',
        description: 'Electrical wiring inspection',
        timestamp: new Date('2026-07-11T10:00:00'),
        location: 'Server Room',
        inspector: 'John Smith',
        violationId: 'v2',
      },
      {
        id: '4',
        imageUrl: '/api/uploads/evidence4.jpg',
        description: 'Waste disposal area check',
        timestamp: new Date('2026-07-11T10:15:00'),
        location: 'Backyard',
        inspector: 'John Smith',
      },
      {
        id: '5',
        imageUrl: '/api/uploads/evidence5.jpg',
        description: 'Pest control evidence',
        timestamp: new Date('2026-07-11T10:30:00'),
        location: 'Storage Room',
        inspector: 'John Smith',
        violationId: 'v3',
      },
    ]

    setEvidence(mockEvidence)
    setLoading(false)
  }, [inspectionId])

  const filteredEvidence = evidence.filter(item => {
    if (filter === 'ALL') return true
    if (filter === 'VIOLATIONS') return !!item.violationId
    if (filter === 'COMPLIANT') return !item.violationId
    return true
  })

  const sortedEvidence = filteredEvidence.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evidence Timeline</CardTitle>
          <CardDescription>Loading evidence...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Evidence Timeline</CardTitle>
            <CardDescription>
              Chronological view of all uploaded evidence ({sortedEvidence.length} items)
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'ALL' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('ALL')}
            >
              All
            </Button>
            <Button
              variant={filter === 'VIOLATIONS' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('VIOLATIONS')}
            >
              Violations
            </Button>
            <Button
              variant={filter === 'COMPLIANT' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('COMPLIANT')}
            >
              Compliant
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

            {/* Timeline items */}
            <div className="space-y-6">
              {sortedEvidence.map((item, index) => (
                <AnimatedListItem key={item.id} index={index}>
                  <div className="flex gap-4 relative">
                    {/* Timeline dot */}
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      item.violationId 
                        ? 'border-red-500 bg-red-500' 
                        : 'border-green-500 bg-green-500'
                    } z-10 mt-2`}></div>

                    {/* Evidence card */}
                    <div 
                      className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                        selectedEvidence?.id === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                      onClick={() => setSelectedEvidence(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={item.violationId ? 'destructive' : 'default'}>
                            {item.violationId ? 'Violation' : 'Compliant'}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {item.location && (
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            📍 {item.location}
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-medium mb-2">{item.description}</p>

                      {item.inspector && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Inspector: {item.inspector}
                        </p>
                      )}
                    </div>
                  </div>
                </AnimatedListItem>
              ))}
            </div>
          </div>

          {/* Selected evidence detail */}
          {selectedEvidence && (
            <SlideUp>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Evidence Detail</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedEvidence(null)}>
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Image placeholder */}
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📷</div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Evidence Image
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                      <p className="font-medium">
                        {new Date(selectedEvidence.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {selectedEvidence.location && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Location:</span>
                        <p className="font-medium">{selectedEvidence.location}</p>
                      </div>
                    )}
                    {selectedEvidence.inspector && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Inspector:</span>
                        <p className="font-medium">{selectedEvidence.inspector}</p>
                      </div>
                    )}
                    {selectedEvidence.violationId && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Violation ID:</span>
                        <p className="font-medium">{selectedEvidence.violationId}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Description:</span>
                    <p className="font-medium">{selectedEvidence.description}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm">Download</Button>
                    <Button size="sm" variant="outline">Share</Button>
                  </div>
                </div>
              </div>
            </SlideUp>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
