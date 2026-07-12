// Agent State Types
export interface AgentState {
  inspectionId?: string
  inspectorId?: string
  checklist?: ChecklistItem[]
  images?: ImageEvidence[]
  notes?: string
  currentAgent?: string
  errors?: string[]
  retryCount?: number
  maxRetries?: number
  results?: AgentResults
}

export interface ChecklistItem {
  id: string
  label: string
  status: 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE'
  required: boolean
  notes?: string
}

export interface ImageEvidence {
  id: string
  url: string
  description: string
  timestamp: Date
}

export interface AgentResults {
  realityVerification?: RealityVerificationResult
  trustScore?: TrustScoreResult
  riskAnalysis?: RiskAnalysisResult
  report?: ReportResult
  routeOptimization?: RouteOptimizationResult
}

export interface RealityVerificationResult {
  confidenceScore: number
  inconsistencies: Inconsistency[]
  flaggedItems: string[]
  explanation: string
  verified: boolean
}

export interface Inconsistency {
  checklistItemId: string
  checklistLabel: string
  claimedStatus: string
  detectedStatus: string
  confidence: number
  reasoning: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  evidenceReference?: string
}

export interface TrustScoreResult {
  inspectorId: string
  currentScore: number
  previousScore: number
  scoreChange: number
  factors: TrustFactor[]
  recommendation: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  trend?: 'IMPROVING' | 'STABLE' | 'DETERIORATING' | 'INSUFFICIENT_DATA'
}

export interface TrustFactor {
  type: 'ACCURACY' | 'CONSISTENCY' | 'TIMELINESS' | 'QUALITY' | 'SUPERVISOR_OVERRIDE'
  impact: number
  description: string
  value: number
}

export interface RiskAnalysisResult {
  overallRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  highRiskAreas: RiskArea[]
  repeatOffenders: RepeatOffender[]
  commonViolations: ViolationPattern[]
  recommendations: string[]
  riskTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING'
}

export interface RiskArea {
  areaId: string
  areaName: string
  riskScore: number
  riskFactors: string[]
  lastInspectionDate: Date
  violationCount: number
}

export interface RepeatOffender {
  inspectorId: string
  inspectorName: string
  violationCount: number
  lastViolationDate: Date
  pattern: string[]
  riskScore: number
}

export interface ViolationPattern {
  violationType: string
  frequency: number
  trend: 'INCREASING' | 'DECREASING' | 'STABLE'
  commonLocations: string[]
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface ReportResult {
  summary: string
  violations: ViolationSummary[]
  recommendedActions: ActionItem[]
  legalReferences: LegalReference[]
  pdfUrl?: string
  generatedAt: Date
}

export interface ViolationSummary {
  id: string
  description: string
  severity: string
  evidence: string[]
  status: string
}

export interface ActionItem {
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  deadline: Date
  assignedTo?: string
}

export interface LegalReference {
  section: string
  description: string
  relevance: string
}

export interface RouteOptimizationResult {
  optimizedRoute: RoutePoint[]
  estimatedTime: number
  distance: number
  fuelEstimate: number
  alternativeRoutes: AlternativeRoute[]
  trafficAlerts: TrafficAlert[]
}

export interface RoutePoint {
  id: string
  inspectionId: string
  siteName: string
  address: string
  coordinates: { lat: number; lng: number }
  priority: number
  estimatedArrival: Date
  estimatedDuration: number
}

export interface AlternativeRoute {
  routeId: string
  points: RoutePoint[]
  estimatedTime: number
  distance: number
  reason: string
}

export interface TrafficAlert {
  location: string
  type: 'ACCIDENT' | 'CONSTRUCTION' | 'CONGESTION' | 'WEATHER'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedDelay: number
}

// Agent Configuration
export interface AgentConfig {
  name: string
  version: string
  maxRetries: number
  timeout: number
  memoryEnabled: boolean
  tools: string[]
}
