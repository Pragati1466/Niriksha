'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, FileText, Building2, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react'

export default function TemplatesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [templates, setTemplates] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [templatesRes, deptsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      const templatesData = await templatesRes.json()
      const deptsData = await deptsRes.json()
      setTemplates(templatesData || [])
      setDepartments(deptsData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddTemplate = async (templateData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to add template:', error)
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete template:', error)
    }
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Inspection Templates</h1>
            <p className="text-muted-foreground">Manage inspection checklist templates</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Template</DialogTitle>
                <DialogDescription>Create a new inspection checklist template</DialogDescription>
              </DialogHeader>
              <AddTemplateForm departments={departments} onSubmit={handleAddTemplate} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {template.name}
                    </CardTitle>
                    <CardDescription className="mt-2">{template.description || 'No description'}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{template.department?.name || 'No Department'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{template.inspections?.length || 0} Inspections</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span>{JSON.parse(template.checklistItems).length} Checklist Items</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}

function AddTemplateForm({ departments, onSubmit }: { departments: any[], onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    departmentId: '',
    checklistItems: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const checklistItems = JSON.parse(formData.checklistItems)
      onSubmit({
        ...formData,
        checklistItems: JSON.stringify(checklistItems),
      })
    } catch {
      alert('Invalid JSON format for checklist items')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-description">Description</Label>
        <Textarea
          id="template-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-department">Department</Label>
        <Select value={formData.departmentId} onValueChange={(value) => setFormData({ ...formData, departmentId: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="template-checklist">Checklist Items (JSON)</Label>
        <Textarea
          id="template-checklist"
          value={formData.checklistItems}
          onChange={(e) => setFormData({ ...formData, checklistItems: e.target.value })}
          rows={6}
          placeholder='[{"id": "1", "label": "Kitchen Clean", "required": true}, {"id": "2", "label": "Fire Extinguisher", "required": true}]'
        />
        <p className="text-xs text-muted-foreground">Format: JSON array with id, label, and required fields</p>
      </div>
      <Button type="submit" className="w-full">Create Template</Button>
    </form>
  )
}
