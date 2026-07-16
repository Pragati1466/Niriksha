'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, X, Plus } from 'lucide-react'

interface Violation {
  id: string
  description: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  checklistItemId?: string
  imageEvidence?: string
  status: 'OPEN' | 'RESOLVED' | 'IGNORED'
}

interface ViolationTrackerProps {
  violations: Violation[]
  onAdd: (violation: Omit<Violation, 'id' | 'status'>) => void
  onUpdate: (id: string, updates: Partial<Violation>) => void
  onDelete: (id: string) => void
  checklistItems?: Array<{ id: string; label: string }>
}

export function ViolationTracker({ violations, onAdd, onUpdate, onDelete, checklistItems = [] }: ViolationTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newViolation, setNewViolation] = useState({
    description: '',
    severity: 'MEDIUM' as const,
    checklistItemId: '',
    imageEvidence: '',
  })

  const handleAdd = () => {
    if (newViolation.description) {
      onAdd(newViolation)
      setNewViolation({ description: '', severity: 'MEDIUM', checklistItemId: '', imageEvidence: '' })
      setShowAddForm(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'RESOLVED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'IGNORED': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Violations
            </CardTitle>
            <CardDescription>Track and manage inspection violations</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
            {showAddForm ? 'Cancel' : 'Add Violation'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="violation-desc">Description</Label>
              <Textarea
                id="violation-desc"
                value={newViolation.description}
                onChange={(e) => setNewViolation({ ...newViolation, description: e.target.value })}
                placeholder="Describe the violation..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="violation-severity">Severity</Label>
              <Select value={newViolation.severity} onValueChange={(value: any) => setNewViolation({ ...newViolation, severity: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {checklistItems.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="violation-checklist">Related Checklist Item (Optional)</Label>
                <Select value={newViolation.checklistItemId} onValueChange={(value) => setNewViolation({ ...newViolation, checklistItemId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select checklist item" />
                  </SelectTrigger>
                  <SelectContent>
                    {checklistItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="violation-image">Image Evidence URL (Optional)</Label>
              <Input
                id="violation-image"
                value={newViolation.imageEvidence}
                onChange={(e) => setNewViolation({ ...newViolation, imageEvidence: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button onClick={handleAdd} className="w-full">Add Violation</Button>
          </div>
        )}

        {violations.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No violations recorded</p>
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <div key={violation.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                      <Badge className={getStatusColor(violation.status)}>{violation.status}</Badge>
                    </div>
                    <p className="text-sm">{violation.description}</p>
                    {violation.checklistItemId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Related to: {checklistItems.find(c => c.id === violation.checklistItemId)?.label || 'Unknown'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Select value={violation.status} onValueChange={(value) => onUpdate(violation.id, { status: value as any })}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="IGNORED">Ignored</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(violation.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {violation.imageEvidence && (
                  <div className="mt-2">
                    <img src={violation.imageEvidence} alt="Evidence" className="h-24 w-24 object-cover rounded" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
