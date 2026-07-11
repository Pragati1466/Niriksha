export type UserRole = 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN'

export type InspectionStatus = 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'

export type ChecklistStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE' | 'PENDING'

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  departmentId?: string
  createdAt: string
}

export interface Department {
  id: string
  name: string
  description?: string
}

export interface Site {
  id: string
  name: string
  address: string
  departmentId: string
  latitude?: number
  longitude?: number
}

export interface InspectionTemplate {
  id: string
  name: string
  description?: string
  departmentId: string
  checklistItems: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  label: string
  required: boolean
}

export interface Inspection {
  id: string
  siteId: string
  site: Site
  inspectorId: string
  inspector: User
  templateId: string
  template: InspectionTemplate
  status: InspectionStatus
  scheduledDate: string
  completedDate?: string
  notes?: string
  confidenceScore?: number
  aiAnalysis?: any
  createdAt: string
  images: InspectionImage[]
  checklists: InspectionChecklist[]
  violations: Violation[]
}

export interface InspectionImage {
  id: string
  inspectionId: string
  imageUrl: string
  description?: string
  uploadedAt: string
}

export interface InspectionChecklist {
  id: string
  inspectionId: string
  itemId: string
  itemLabel: string
  status: ChecklistStatus
  notes?: string
  evidence?: any
}

export interface Violation {
  id: string
  inspectionId: string
  description: string
  severity: ViolationSeverity
  checklistItemId?: string
  imageEvidence?: string
  status: string
}

export interface Report {
  id: string
  inspectionId: string
  pdfUrl?: string
  summary?: string
  generatedAt: string
}

export interface Review {
  id: string
  inspectionId: string
  reviewerId: string
  reviewer: User
  approved?: boolean
  comments?: string
  reviewedAt: string
}

export interface TrustScore {
  id: string
  inspectorId: string
  score: number
  totalInspections: number
  flaggedInspections: number
  lastUpdated: string
}
