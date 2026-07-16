
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://niriksha.onrender.com'
console.log('API_BASE =', API_BASE)

type RequestOptions = {
  method?: string
  body?: any
  headers?: Record<string, string>
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
  }

  if (options.body && options.method !== 'GET') {
    config.body = JSON.stringify(options.body)
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${res.status}`)
  }

  return res.json()
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request('/api/auth/login', { method: 'POST', body: { email, password } }),

  signup: (data: any) =>
    request('/api/auth/signup', { method: 'POST', body: data }),

  // Users
  getUsers: (role?: string) =>
    request(`/api/users${role ? `?role=${role}` : ''}`),

  getUser: (id: string) =>
    request(`/api/users/${id}`),

  createUser: (data: any) =>
    request('/api/auth/signup', { method: 'POST', body: data }),

  deleteUser: (id: string) =>
    request(`/api/users/${id}`, { method: 'DELETE' }),

  // Departments
  getDepartments: () =>
    request('/api/departments'),

  createDepartment: (data: any) =>
    request('/api/departments', { method: 'POST', body: data }),

  // Sites
  getSites: () =>
    request('/api/sites'),

  createSite: (data: any) =>
    request('/api/sites', { method: 'POST', body: data }),

  deleteSite: (id: string) =>
    request(`/api/sites/${id}`, { method: 'DELETE' }),

  // Templates
  getTemplates: () =>
    request('/api/templates'),

  createTemplate: (data: any) =>
    request('/api/templates', { method: 'POST', body: data }),

  // Inspections
  getInspections: (params?: { status?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.offset) query.set('offset', String(params.offset))
    const qs = query.toString()
    return request(`/api/inspections${qs ? `?${qs}` : ''}`)
  },

  getInspection: (id: string) =>
    request(`/api/inspections/${id}`),

  createInspection: (data: any) =>
    request('/api/inspections', { method: 'POST', body: data }),

  updateInspection: (id: string, data: any) =>
    request(`/api/inspections/${id}`, { method: 'PUT', body: data }),

  submitInspection: (id: string, data?: any) =>
    request(`/api/inspections/${id}/submit`, { method: 'POST', body: data || {} }),

  updateChecklist: (inspectionId: string, checklists: any[]) =>
    request(`/api/inspections/${inspectionId}/checklist`, { method: 'PUT', body: { inspectionId, checklists } }),

  createViolation: (inspectionId: string, data: any) =>
    request(`/api/inspections/${inspectionId}/violations`, { method: 'POST', body: data }),

  // Supervisor APIs
  getSupervisorDashboard: () =>
    request('/api/supervisor/dashboard'),

  getSupervisorQueue: (params?: { status?: string }) => {
    const query = params?.status ? `?status=${params.status}` : ''
    return request(`/api/supervisor/queue${query}`)
  },

  getSupervisorInspection: (id: string) =>
    request(`/api/supervisor/inspections/${id}`),

  reviewInspection: (id: string, data: { action: string; comments?: string; reportContent?: string }) =>
    request(`/api/supervisor/inspections/${id}/review`, { method: 'POST', body: data }),

  getTrustScores: () =>
    request('/api/supervisor/trust'),

  getHeatmap: () =>
    request('/api/supervisor/heatmap'),

  getExecutiveDashboard: () =>
    request('/api/supervisor/executive'),

  getMemoryGraph: () =>
    request('/api/supervisor/memory/graph'),

  getAnalytics: () =>
    request('/api/supervisor/analytics'),

  // Notifications
  getNotifications: (unreadOnly?: boolean) =>
    request(`/api/supervisor/notifications${unreadOnly ? '?unread=true' : ''}`),

  markNotificationRead: (id: string) =>
    request(`/api/supervisor/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request('/api/supervisor/notifications/read-all', { method: 'PATCH' }),

  // AI Features
  getAiInsights: () =>
    request('/api/ai-features/insights'),

  getFraudDetection: (inspectionId: string) =>
    request(`/api/ai-features/fraud-detection/${inspectionId}`),

  getPredictiveInspection: (siteId: string) =>
    request(`/api/ai-features/predictive/${siteId}`),

  getExplainableAI: (inspectionId: string) =>
    request(`/api/ai-features/explain/${inspectionId}`),

  // Agents
  executeAgent: (agentName: string, data: any) =>
    request(`/api/agents/execute`, { method: 'POST', body: { agent: agentName, data } }),

  getAgentStatus: () =>
    request('/api/agents/status'),

  // Compliance Memory
  getComplianceMemory: (params?: { siteId?: string }) => {
    const query = params?.siteId ? `?siteId=${params.siteId}` : ''
    return request(`/api/ai-features/compliance-memory${query}`)
  },

  // Reports
  downloadReport: async (inspectionId: string) => {
    const token = localStorage.getItem('token')

    const res = await fetch(`${API_BASE}/api/supervisor/inspections/${inspectionId}/export/pdf`, {

      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to download report')
    return res.blob()
  },


  downloadCsv: async () => {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/api/supervisor/exports/inspections.csv`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to download CSV')
    return res.blob()
  },

  // Upload image
  uploadImage: async (inspectionId: string, file: File, description?: string) => {
    const formData = new FormData()
    formData.append('image', file)
    if (description) formData.append('description', description)

    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE}/api/inspections/${inspectionId}/images`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    if (!res.ok) throw new Error('Failed to upload image')
    return res.json()
  },

}

// Triggers a browser download for a Blob returned by an export endpoint.
export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

}