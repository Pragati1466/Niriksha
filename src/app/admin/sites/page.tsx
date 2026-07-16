'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, MapPin, Building2, Edit, Trash2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export default function SitesPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [sites, setSites] = useState<any[]>([])
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
      const [sitesRes, deptsRes] = await Promise.all([
        fetch(`${getApiUrl()}/api/sites`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${getApiUrl()}/api/departments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      const sitesData = await sitesRes.json()
      const deptsData = await deptsRes.json()
      setSites(sitesData || [])
      setDepartments(deptsData || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddSite = async (siteData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/sites`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to add site:', error)
    }
  }

  const handleDeleteSite = async (id: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/sites/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete site:', error)
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
            <h1 className="text-3xl font-bold">Sites</h1>
            <p className="text-muted-foreground">Manage inspection sites</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Site
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
                <DialogDescription>Create a new inspection site</DialogDescription>
              </DialogHeader>
              <AddSiteForm departments={departments} onSubmit={handleAddSite} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <Card key={site.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {site.name}
                    </CardTitle>
                    <CardDescription className="mt-2">{site.address}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSite(site.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{site.department?.name || 'No Department'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{site.inspections?.length || 0} Inspections</span>
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

function AddSiteForm({ departments, onSubmit }: { departments: any[], onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    departmentId: '',
    latitude: '',
    longitude: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      latitude: formData.latitude ? parseFloat(formData.latitude) : null,
      longitude: formData.longitude ? parseFloat(formData.longitude) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="site-name">Site Name</Label>
        <Input
          id="site-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="site-address">Address</Label>
        <Input
          id="site-address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="site-department">Department</Label>
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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="site-lat">Latitude (Optional)</Label>
          <Input
            id="site-lat"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site-lng">Longitude (Optional)</Label>
          <Input
            id="site-lng"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full">Create Site</Button>
    </form>
  )
}
