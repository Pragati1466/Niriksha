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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Building2, MapPin, Users, Edit, Trash2 } from 'lucide-react'

export default function DepartmentsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [departments, setDepartments] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDepartments()
    }
  }, [user])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setDepartments(data || [])
    } catch (error) {
      console.error('Failed to fetch departments:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddDepartment = async (deptData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deptData),
      })
      fetchDepartments()
    } catch (error) {
      console.error('Failed to add department:', error)
    }
  }

  const handleDeleteDepartment = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchDepartments()
    } catch (error) {
      console.error('Failed to delete department:', error)
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
            <h1 className="text-3xl font-bold">Departments</h1>
            <p className="text-muted-foreground">Manage organizational departments</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
                <DialogDescription>Create a new department</DialogDescription>
              </DialogHeader>
              <AddDepartmentForm onSubmit={handleAddDepartment} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card key={dept.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {dept.name}
                    </CardTitle>
                    <CardDescription className="mt-2">{dept.description || 'No description'}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteDepartment(dept.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.sites?.length || 0} Sites</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.users?.length || 0} Users</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{dept.templates?.length || 0} Templates</span>
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

function AddDepartmentForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="dept-name">Department Name</Label>
        <Input
          id="dept-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="dept-description">Description</Label>
        <Textarea
          id="dept-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full">Create Department</Button>
    </form>
  )
}
