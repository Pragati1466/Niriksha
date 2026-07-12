import prisma from '../utils/prisma'
import { Inconsistency, RealityVerificationResult, TrustScoreResult } from '../agents/types'

type HumanAction = 'HUMAN_CORRECTION' | 'SUBMISSION_OVERRIDE' | 'REVIEW_DECISION' | 'INSPECTION_SUBMITTED'

interface MemoryEventInput {
  inspectionId?: string
  siteId?: string
  checklistItemId?: string | null
  checklistLabel?: string | null
  eventType: string
  outcome: string
  finding?: string | null
  confidence?: number | null
  evidenceReference?: string | null
  actorId?: string | null
  reason?: string | null
  sourceRecordId?: string | null
  metadata?: Record<string, any>
  occurredAt?: Date
}

const humanActions = new Set<HumanAction>(['HUMAN_CORRECTION', 'SUBMISSION_OVERRIDE', 'REVIEW_DECISION', 'INSPECTION_SUBMITTED'])

class ComplianceMemoryService {
  async recordEvent(event: MemoryEventInput) {
    if (humanActions.has(event.eventType as HumanAction) && !event.actorId) {
      throw new Error(`Authenticated actor ID is required for ${event.eventType}`)
    }
    return prisma.complianceMemoryEvent.create({ data: event })
  }

  async recordVerificationStarted(inspectionId: string, actorId: string) {
    const inspection = await prisma.inspection.findUniqueOrThrow({ where: { id: inspectionId }, select: { siteId: true } })
    return this.recordEvent({
      inspectionId, siteId: inspection.siteId, actorId,
      eventType: 'INSPECTION_SUBMITTED', outcome: 'VERIFICATION_STARTED',
      sourceRecordId: `verification-start:${inspectionId}:${Date.now()}`,
    })
  }

  async recordInspectionOutcome(input: {
    inspectionId: string
    actorId: string
    action: 'HOLD_FOR_REVIEW' | 'SUBMITTED' | 'SUBMISSION_OVERRIDE'
    reason?: string
    verification?: RealityVerificationResult
    findings?: Inconsistency[]
  }) {
    const inspection = await prisma.inspection.findUniqueOrThrow({ where: { id: input.inspectionId }, include: { reviews: true } })
    const findings = input.findings || input.verification?.inconsistencies || []
    const timestamp = Date.now()

    await prisma.$transaction([
      prisma.complianceMemoryEvent.create({ data: {
        inspectionId: inspection.id, siteId: inspection.siteId, actorId: input.actorId,
        eventType: 'VERIFICATION_COMPLETED', outcome: input.verification?.verified ? 'COMPLIANT' : 'UNVERIFIED',
        confidence: input.verification?.confidenceScore ?? null,
        sourceRecordId: `verification-complete:${inspection.id}:${timestamp}`,
        metadata: { confidenceScore: input.verification?.confidenceScore, explanation: input.verification?.explanation },
      } }),
      ...findings.map((finding, index) => prisma.complianceMemoryEvent.create({ data: {
        inspectionId: inspection.id, siteId: inspection.siteId, actorId: input.actorId,
        checklistItemId: finding.checklistItemId || null, checklistLabel: finding.checklistLabel,
        eventType: 'VERIFICATION_FINDING', outcome: finding.detectedStatus,
        finding: finding.reasoning, confidence: finding.confidence,
        evidenceReference: finding.evidenceReference || null,
        sourceRecordId: `verification-finding:${inspection.id}:${timestamp}:${index}`,
      } })),
      prisma.complianceMemoryEvent.create({ data: {
        inspectionId: inspection.id, siteId: inspection.siteId, actorId: input.actorId,
        eventType: input.action === 'SUBMISSION_OVERRIDE' ? 'SUBMISSION_OVERRIDE' : 'INSPECTION_OUTCOME',
        outcome: input.action, reason: input.reason || null,
        sourceRecordId: `inspection-outcome:${inspection.id}:${timestamp}:${input.action}`,
        metadata: { confidenceScore: input.verification?.confidenceScore },
      } }),
    ])

    await Promise.all(inspection.reviews.map(review => prisma.complianceMemoryEvent.create({ data: {
      inspectionId: inspection.id, siteId: inspection.siteId, actorId: review.reviewerId,
      eventType: 'REVIEW_DECISION', outcome: review.approved === true ? 'APPROVED' : review.approved === false ? 'REJECTED' : 'PENDING',
      reason: review.comments, sourceRecordId: review.id, occurredAt: review.reviewedAt,
    } }).catch(error => { if (error.code !== 'P2002') throw error })))
  }

  async recordCorrections(inspectionId: string, actorId: string, checklists: Array<{ id: string, itemLabel: string, status: string, notes?: string | null, evidence?: string | null }>) {
    const inspection = await prisma.inspection.findUniqueOrThrow({ where: { id: inspectionId }, select: { siteId: true } })
    const timestamp = Date.now()
    await prisma.$transaction(checklists.map((item, index) => prisma.complianceMemoryEvent.create({ data: {
      inspectionId, siteId: inspection.siteId, actorId, checklistItemId: item.id, checklistLabel: item.itemLabel,
      eventType: 'HUMAN_CORRECTION', outcome: item.status, reason: item.notes || null,
      evidenceReference: item.evidence || null, sourceRecordId: `correction:${item.id}:${timestamp}:${index}`,
    } })))
  }

  async recordTrustScore(inspectorId: string, result: TrustScoreResult) {
    return this.recordEvent({ eventType: 'TRUST_SCORE', outcome: result.riskLevel, actorId: inspectorId,
      sourceRecordId: `trust-score:${inspectorId}:${Date.now()}`, metadata: { type: 'TRUST_SCORE', data: result } })
  }

  async recordRiskEvent(siteId: string, result: unknown) {
    return this.recordEvent({ siteId, eventType: 'SYSTEMIC_RISK_DISCOVERED', outcome: 'DISCOVERED',
      sourceRecordId: `risk:${siteId}:${Date.now()}`, metadata: { result: JSON.parse(JSON.stringify(result)) } })
  }

  async recordWorkflowEvent(inspectionId: string, log: string[]) {
    const inspection = await prisma.inspection.findUnique({ where: { id: inspectionId }, select: { siteId: true } })
    if (!inspection) return
    return this.recordEvent({ inspectionId, siteId: inspection.siteId, eventType: 'WORKFLOW_COMPLETED', outcome: 'COMPLETED', metadata: { log } })
  }

  async getInspectorMemory(inspectorId: string): Promise<any[]> {
    const events = await prisma.complianceMemoryEvent.findMany({ where: { actorId: inspectorId }, orderBy: { occurredAt: 'asc' } })
    return events.map(event => ({
      type: event.eventType === 'VERIFICATION_COMPLETED' ? 'REALITY_VERIFICATION' : event.eventType,
      data: event.metadata && typeof event.metadata === 'object' && 'data' in event.metadata ? (event.metadata as any).data : { verified: event.outcome === 'COMPLIANT', ...event },
      timestamp: event.occurredAt,
    }))
  }

  async getInspectorTrustHistory(inspectorId: string): Promise<TrustScoreResult[]> {
    const history = await this.getInspectorMemory(inspectorId)
    return history.filter(item => item.type === 'TRUST_SCORE').map(item => item.data as TrustScoreResult)
  }

  async findRepeatedIssues(siteId: string) {
    const since = new Date()
    since.setDate(since.getDate() - 90)
    const groups = await prisma.complianceMemoryEvent.groupBy({
      by: ['checklistItemId', 'checklistLabel'],
      where: { siteId, outcome: 'NON_COMPLIANT', occurredAt: { gte: since }, checklistItemId: { not: null } },
      _count: { _all: true }, having: { checklistItemId: { _count: { gte: 2 } } },
    })
    return groups.map(group => ({ checklistItemId: group.checklistItemId!, checklistLabel: group.checklistLabel, occurrences: group._count._all, repeatedViolation: true }))
  }

  async getInstitutionHistory(siteId: string) {
    const [inspections, events, recurringIssues] = await Promise.all([
      prisma.inspection.findMany({ where: { siteId }, include: { verificationFindings: true, reviews: true }, orderBy: { scheduledDate: 'desc' } }),
      prisma.complianceMemoryEvent.findMany({ where: { siteId }, orderBy: { occurredAt: 'desc' } }), this.findRepeatedIssues(siteId),
    ])
    return { inspections, recurringIssues,
      unresolvedFindings: events.filter(event => event.outcome === 'NON_COMPLIANT' || event.outcome === 'UNVERIFIED'),
      correctionPatterns: events.filter(event => event.eventType === 'HUMAN_CORRECTION') }
  }

  async getMemoryStats() {
    const [totalMemoryEntries, inspectorHistories, riskHistories] = await Promise.all([
      prisma.complianceMemoryEvent.count(),
      prisma.complianceMemoryEvent.groupBy({ by: ['actorId'], where: { actorId: { not: null } } }),
      prisma.complianceMemoryEvent.groupBy({ by: ['siteId'], where: { eventType: 'SYSTEMIC_RISK_DISCOVERED', siteId: { not: null } } }),
    ])
    return { totalMemoryEntries, inspectorHistories: inspectorHistories.length, riskHistories: riskHistories.length }
  }

  async resetDevelopmentMemory() {
    if (process.env.NODE_ENV === 'production') throw new Error('Memory reset is disabled in production')
    return prisma.complianceMemoryEvent.deleteMany()
  }
}

export const complianceMemory = new ComplianceMemoryService()
