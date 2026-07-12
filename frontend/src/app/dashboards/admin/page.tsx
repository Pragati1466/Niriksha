'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/shared/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, Building2, FileText, Settings, BarChart3, Search, Filter } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

export default function AdminDashboard() {
  const { user, loading, isDemoMode } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN') && !isDemoMode) {
      router.push('/auth/login')
    }
  }, [user, loading, router, isDemoMode])

  useEffect(() => {
    if (user || isDemoMode) {
      fetchData()
    }
  }, [user, isDemoMode])

  const fetchData = async () => {
    try {
      if (isDemoMode) {
        // Use mock data for demo mode
        setUsers([
          { id: '1', name: 'John Smith', email: 'john@example.com', role: 'INSPECTOR', department: { name: 'Health' } },
          { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'INSPECTOR', department: { name: 'Safety' } },
          { id: '3', name: 'Mike Davis', email: 'mike@example.com', role: 'SUPERVISOR', department: { name: 'Health' } },
          { id: '4', name: 'Emily Brown', email: 'emily@example.com', role: 'ADMIN', department: null },
        ])
        setDepartments([
          { id: '1', name: 'Health', description: 'Health and safety inspections', sites: [{ length: 45 }], users: [{ length: 12 }] },
          { id: '2', name: 'Safety', description: 'Workplace safety inspections', sites: [{ length: 32 }], users: [{ length: 8 }] },
          { id: '3', name: 'Environment', description: 'Environmental compliance inspections', sites: [{ length: 28 }], users: [{ length: 6 }] },
          { id: '4', name: 'Building', description: 'Building code inspections', sites: [{ length: 51 }], users: [{ length: 15 }] },
        ])
        setSites([
          { id: 'site1', name: 'Restaurant A', address: '123 Main St', department: { name: 'Health' }, status: 'ACTIVE', businessType: 'Restaurant' },
          { id: 'site2', name: 'Factory B', address: '456 Industrial Ave', department: { name: 'Safety' }, status: 'ACTIVE', businessType: 'Factory' },
          { id: 'site3', name: 'Hospital C', address: '789 Medical Center', department: { name: 'Health' }, status: 'ACTIVE', businessType: 'Hospital' },
        ])
      } else {
        const token = localStorage.getItem('token')
        const [usersRes, deptsRes, sitesRes] = await Promise.all([
          fetch(`${getApiUrl()}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${getApiUrl()}/api/departments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${getApiUrl()}/api/sites`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        const usersData = await usersRes.json()
        const deptsData = await deptsRes.json()
        const sitesData = await sitesRes.json()
        setUsers(usersData || [])
        setDepartments(deptsData || [])
        setSites(sitesData || [])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleAddUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/auth/signup`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to add user:', error)
    }
  }

  const handleAddDepartment = async (deptData: any) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/departments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(deptData),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to add department:', error)
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

  const handleDeleteSite = async (siteId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/sites/${siteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete site:', error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${getApiUrl()}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete user:', error)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, departments, and system settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{departments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Templates</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inspections</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Manage Users</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="sites">Sites/Establishments</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-xl font-semibold">Users</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Create a new user account</DialogDescription>
                  </DialogHeader>
                  <AddUserForm onSubmit={handleAddUser} departments={departments} />
                </DialogContent>
              </Dialog>
            </div>
            
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or employee ID..."
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select defaultValue="ALL">
                      <SelectTrigger className="w-[180px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Roles</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                        <SelectItem value="INSPECTOR">Inspector</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select defaultValue="ALL">
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Departments</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{userItem.name}</p>
                          {!userItem.isActive && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{userItem.employeeId || 'No Employee ID'}</span>
                          <span>•</span>
                          <span>{userItem.phone || 'No Phone'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <Badge variant={userItem.role === 'ADMIN' ? 'default' : 'secondary'} className="mb-1">{userItem.role}</Badge>
                          <p className="text-xs text-muted-foreground">{userItem.department?.name || 'No Department'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => {/* TODO: Open edit modal */}}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => {/* TODO: Reset password */}}>
                            Reset Password
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(userItem.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-2">No users found</p>
                      <p className="text-sm text-muted-foreground">Add your first user to get started</p>
                    </div>
                  )}
                </div>
                {/* Pagination would go here */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">Showing {users.length} of {users.length} users</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled>Previous</Button>
                    <Button variant="outline" size="sm" disabled>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Departments</h2>
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
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{dept.name}</p>
                        <p className="text-sm text-muted-foreground">{dept.description || 'No description'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{dept.sites?.length || 0} Sites</p>
                        <p className="text-xs text-muted-foreground">{dept.users?.length || 0} Users</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sites" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Sites/Establishments</h2>
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
                    <DialogDescription>Register a new establishment</DialogDescription>
                  </DialogHeader>
                  <AddSiteForm onSubmit={handleAddSite} departments={departments} />
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {sites.map((site) => (
                    <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{site.name}</p>
                        <p className="text-sm text-muted-foreground">{site.address}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{site.businessType || 'N/A'}</Badge>
                          <Badge variant={site.status === 'ACTIVE' ? 'default' : 'secondary'}>{site.status}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{site.department?.name || 'No Department'}</p>
                          {site.registrationNumber && <p className="text-xs text-muted-foreground">{site.registrationNumber}</p>}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSite(site.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Inspection Templates</CardTitle>
                <CardDescription>Manage inspection checklist templates</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Template management interface would appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">AI Verification</p>
                      <p className="text-sm text-muted-foreground">Enable/disable AI-powered verification</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Notification Settings</p>
                      <p className="text-sm text-muted-foreground">Manage email and push notifications</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">API Configuration</p>
                      <p className="text-sm text-muted-foreground">Manage API keys and integrations</p>
                    </div>
                    <Button variant="outline">Configure</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function AddUserForm({ onSubmit, departments }: { onSubmit: (data: any) => void; departments: any[] }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'INSPECTOR',
    departmentId: '',
    phone: '',
    employeeId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(formData)
   } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="Full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          placeholder="user@niriksha.gov.in"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required
          placeholder="Minimum 8 characters"
          minLength={8}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="role">Role *</Label>
        <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="INSPECTOR">Inspector</SelectItem>
            <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="department">Department</Label>
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
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="10-digit phone number"
          pattern="[0-9]{10}"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employeeId">Employee ID</Label>
        <Input
          id="employeeId"
          value={formData.employeeId}
          onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          placeholder="EMPXXXXX"
        />
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating...' : 'Create User'}
      </Button>
    </form>
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
        <Input
          id="dept-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>
      <Button type="submit" className="w-full">Create Department</Button>
    </form>
  )
}

function AddSiteForm({ onSubmit, departments }: { onSubmit: (data: any) => void; departments: any[] }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    departmentId: '',
    businessType: '',
    registrationNumber: '',
    pincode: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
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
      <div className="space-y-2">
        <Label htmlFor="site-business-type">Business Type</Label>
        <Input
          id="site-business-type"
          value={formData.businessType}
          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
          placeholder="e.g., Restaurant, Factory, Hospital"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="site-registration">Registration Number</Label>
        <Input
          id="site-registration"
          value={formData.registrationNumber}
          onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
          placeholder="e.g., FSSAI, GSTIN"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="site-pincode">Pincode</Label>
        <Input
          id="site-pincode"
          value={formData.pincode}
          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          placeholder="Postal code"
        />
      </div>
      <Button type="submit" className="w-full">Create Site</Button>
    </form>
  )
}
