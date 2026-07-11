'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Inspection, InspectionChecklist, ChecklistStatus } from '@/types'
import { Camera, Upload, Check, AlertTriangle, ArrowLeft } from 'lucide-react'

export default function InspectionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklists, setChecklists] = useState<InspectionChecklist[]>([])
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchInspection()
  }, [id])

  const fetchInspection = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setInspection(data)
      setChecklists(data.checklists || [])
      setNotes(data.notes || '')
    } catch (error) {
      console.error('Failed to fetch inspection:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('description', `Inspection image for ${inspection?.site.name}`)

      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      fetchInspection()
    } catch (error) {
      console.error('Failed to upload image:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleChecklistChange = (itemId: string, status: ChecklistStatus) => {
    setChecklists(prev =>
      prev.map(item =>
        item.itemId === itemId ? { ...item, status } : item
      )
    )
  }

  const handleAIVerification = async () => {
    setAnalyzing(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai/verify-reality`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist: checklists,
          images: inspection?.images || [],
        }),
      })
      const data = await response.json()

      const updatedInspection = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'SUBMITTED',
          notes,
          confidenceScore: data.confidenceScore * 100,
          aiAnalysis: data,
        }),
      })

      router.push('/dashboards/inspector')
    } catch (error) {
      console.error('AI verification failed:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSaveChecklist = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}/checklist`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checklists }),
      })

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/inspections/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          notes,
        }),
      })

      fetchInspection()
    } catch (error) {
      console.error('Failed to save checklist:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Inspection not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">{inspection.site.name}</h1>
          <p className="text-muted-foreground">{inspection.site.address}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
                <CardDescription>Complete the inspection checklist</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inspection.template.checklistItems.map((item: any) => {
                  const checklistItem = checklists.find(c => c.itemId === item.id)
                  return (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="text-base">{item.label}</Label>
                        {item.required && <Badge variant="destructive" className="ml-2">Required</Badge>}
                      </div>
                      <div className="flex gap-2">
                        {(['COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE'] as ChecklistStatus[]).map((status) => (
                          <Button
                            key={status}
                            variant={checklistItem?.status === status ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleChecklistChange(item.id, status)}
                          >
                            {status === 'COMPLIANT' && <Check className="mr-1 h-4 w-4" />}
                            {status === 'NON_COMPLIANT' && <AlertTriangle className="mr-1 h-4 w-4" />}
                            {status}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
                <CardDescription>Add additional observations</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter inspection notes..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Images</CardTitle>
                <CardDescription>Add evidence for your inspection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to upload or drag and drop
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                  {inspection.images.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Uploaded Images</p>
                      {inspection.images.map((image) => (
                        <div key={image.id} className="flex items-center gap-2 p-2 border rounded">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{image.description || 'Image'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button onClick={handleSaveChecklist} className="w-full" variant="outline">
                  Save Progress
                </Button>
                <Button
                  onClick={handleAIVerification}
                  className="w-full"
                  disabled={analyzing || checklists.length === 0}
                >
                  {analyzing ? 'Analyzing...' : 'Submit & AI Verify'}
                </Button>
              </CardContent>
            </Card>

            {inspection.aiAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Confidence Score:</span>
                      <span className="font-bold">{inspection.confidenceScore?.toFixed(1)}%</span>
                    </div>
                    {inspection.aiAnalysis.flaggedItems?.length > 0 && (
                      <div className="text-sm text-destructive">
                        {inspection.aiAnalysis.flaggedItems.length} items flagged for review
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
