import { Router } from 'express'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'
import { notificationService } from '../services/notificationService'
import { agentOrchestrator } from '../agents/orchestrator'
import PDFDocument from 'pdfkit'

const router = Router()
router.use(authenticateToken, requireRole(['SUPERVISOR', 'ADMIN']))

const reviewStatuses = ['UNDER_REVIEW', 'HOLD_FOR_REVIEW', 'AI_FLAGGED', 'REQUIRES_OVERRIDE', 'SUBMITTED']

async function scope(req: AuthRequest) {
  if (req.user!.role === 'ADMIN') return {}
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { departmentId: true } })
  if (!user?.departmentId) return { site: { departmentId: '__none__' } }
  return { site: { departmentId: user.departmentId } }
}

function risk(score: number) { return score >= 75 ? 'CRITICAL' : score >= 50 ? 'HIGH' : score >= 25 ? 'MEDIUM' : 'LOW' }
function priority(score: number) { return score >= 75 ? 'P0' : score >= 50 ? 'P1' : score >= 25 ? 'P2' : 'P3' }

async function calculateOrdi(inspection: any) {
  const mismatch = inspection.verificationFindings?.length || 0
  const checklistCount = Math.max(inspection.checklists?.length || 0, 1)
  const mismatchRate = mismatch / checklistCount
  const trust = inspection.inspector.trustScore?.score ?? 100
  const repeatViolations = inspection.violations?.filter((v: any) => v.status === 'OPEN').length || 0
  const pending = reviewStatuses.includes(inspection.status) ? 1 : 0
  const correction = inspection.reviews?.filter((r: any) => r.approved === false).length || 0
  const contributors = {
    evidenceMismatchRate: Math.round(mismatchRate * 100), trustDrift: Math.round(100 - trust),
    repeatViolations, pendingReview: pending, adversarialFailures: mismatch, correctionFrequency: correction,
  }
  const score = Math.min(100, Math.round(mismatchRate * 35 + (100 - trust) * .25 + repeatViolations * 8 + pending * 12 + correction * 8))
  const previous = inspection.ordiAssessments?.[0]?.score
  return { score, riskLevel: risk(score), priority: priority(score), trend: previous === undefined ? 'NEW' : score > previous ? 'RISING' : score < previous ? 'FALLING' : 'STABLE', contributors }
}

function monthKey(date: Date) { return date.toISOString().slice(0, 7) }

function average(values: number[]) { return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null }

async function latestOrdiByInspection(inspectionIds: string[]) {
  if (!inspectionIds.length) return new Map<string, any>()
  const rows = await prisma.ordiAssessment.findMany({ where: { inspectionId: { in: inspectionIds } }, orderBy: { createdAt: 'desc' } })
  const latest = new Map<string, any>()
  rows.forEach(row => { if (!latest.has(row.inspectionId)) latest.set(row.inspectionId, row) })
  return latest
}

router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const where = await scope(req)
    const base = { ...where } as any
    const [pending, total, inspectors, alerts, memory, inspections] = await Promise.all([
      prisma.inspection.count({ where: { ...base, status: { in: reviewStatuses } } }), prisma.inspection.count({ where: base }),
      prisma.user.findMany({ where: req.user!.role === 'ADMIN' ? { role: 'INSPECTOR' } : (await prisma.user.findUnique({ where: { id: req.user!.id } }))?.departmentId ? { role: 'INSPECTOR', departmentId: (await prisma.user.findUnique({ where: { id: req.user!.id } }))!.departmentId! } : { role: 'INSPECTOR', departmentId: '__none__' }, include: { trustScore: true } as any }),
      prisma.inspection.count({ where: { ...base, verificationFindings: { some: {} } } }), prisma.complianceMemoryEvent.count({ where: req.user!.role === 'ADMIN' ? {} : (await prisma.user.findUnique({ where: { id: req.user!.id } }))?.departmentId ? { site: { departmentId: (await prisma.user.findUnique({ where: { id: req.user!.id } }))!.departmentId! } } : {} }),
      prisma.inspection.findMany({ where: base, include: { reviews: true, ordiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 }, verificationFindings: true, reports: true } }),
    ])
    const confidence = inspections.filter(i => i.confidenceScore !== null)
    const reviews = inspections.flatMap(i => i.reviews.map(review => ({ review, inspection: i })))
    const reportDurations = inspections.filter(i => i.reports?.generatedAt && (i.completedDate || i.createdAt)).map(i => i.reports!.generatedAt.getTime() - (i.completedDate || i.createdAt).getTime())
    const ordi = inspections.map(i => i.ordiAssessments[0]).filter(Boolean)
    const trustScores = inspectors.map((u: any) => u.trustScore?.score).filter((score: number | undefined): score is number => score !== undefined)
    res.json({
      pendingReviews: pending, totalInspections: total, activeInspectors: inspectors.length, aiAlerts: inspections.reduce((sum, i) => sum + i.verificationFindings.length, 0), memoryEvents: memory,
      averageConfidence: confidence.length ? confidence.reduce((sum, i) => sum + (i.confidenceScore || 0), 0) / confidence.length : null,
      averageReviewTimeHours: reportDurations.length ? reportDurations.reduce((sum, duration) => sum + duration, 0) / reportDurations.length / 3600000 : null,
      inspectorProductivity: inspectors.map((u: any) => ({ id: u.id, name: u.name, inspections: inspections.filter(i => i.inspectorId === u.id && i.status !== 'ASSIGNED' && i.status !== 'IN_PROGRESS').length })),
      approvalRate: reviews.length ? reviews.filter(({ review }) => review.approved === true).length / reviews.length * 100 : null,
      evidenceMismatchPercent: total ? alerts / total * 100 : null,
      ordiKpis: { assessed: ordi.length, averageScore: ordi.length ? ordi.reduce((sum, item) => sum + item.score, 0) / ordi.length : null, critical: ordi.filter(item => item.riskLevel === 'CRITICAL').length, priorityP0: ordi.filter(item => item.priority === 'P0').length },
      trustKpis: { assessed: trustScores.length, averageScore: trustScores.length ? trustScores.reduce((sum, score) => sum + score, 0) / trustScores.length : null, below70: trustScores.filter(score => score < 70).length },
      trust: inspectors.map((u: any) => ({ id: u.id, name: u.name, score: u.trustScore?.score ?? null })),
    })
  } catch (error) { res.status(500).json({ error: 'Failed to load control room' }) }
})

router.get('/queue', async (req: AuthRequest, res) => {
  try {
    const { department, inspector, status, risk, from, to } = req.query as Record<string, string>
    const where: any = { ...(await scope(req)), status: status ? status : { in: reviewStatuses } }
    // A supervisor's scope is fixed by their JWT-backed department. Only an
    // administrator may use the department filter to switch control-room scope.
    if (department && req.user!.role === 'ADMIN') where.site = { ...(where.site || {}), departmentId: department }
    if (inspector) where.inspectorId = inspector
    if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) }
    const rows = await prisma.inspection.findMany({ where, include: { site: { include: { department: true } }, inspector: { include: { trustScore: true } }, verificationFindings: true, checklists: true, violations: true, reviews: true, ordiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } }, orderBy: { createdAt: 'desc' } })
    const queue = await Promise.all(rows.map(async inspection => {
      const ordi = await calculateOrdi(inspection)
      return { inspectionId: inspection.id, site: inspection.site.name, inspector: inspection.inspector.name, inspectorId: inspection.inspectorId, department: inspection.site.department.name, submissionDate: inspection.completedDate || inspection.createdAt, status: inspection.status, aiConfidence: inspection.confidenceScore, trustScore: inspection.inspector.trustScore?.score ?? null, evidenceMismatchCount: inspection.verificationFindings.length, ordi }
    }))
    res.json({ queue: risk ? queue.filter(item => item.ordi.riskLevel === risk) : queue.sort((a, b) => b.ordi.score - a.ordi.score) })
  } catch { res.status(500).json({ error: 'Failed to load review queue' }) }
})

router.post('/inspections/:id/review', async (req: AuthRequest, res) => {
  const actions: Record<string, string> = { APPROVE: 'APPROVED', REJECT: 'REJECTED', RETURN_FOR_CORRECTION: 'IN_PROGRESS', REQUEST_EVIDENCE: 'HOLD_FOR_REVIEW', ESCALATE: 'REQUIRES_OVERRIDE', MODIFY_AI_REPORT: 'UNDER_REVIEW' }
  try {
    const action = String(req.body.action || '')
    const next = actions[action]
    if (!next) return res.status(400).json({ error: 'Invalid review action' })
    const inspection = await prisma.inspection.findFirst({ where: { id: req.params.id, ...(await scope(req)) }, include: { site: true, reports: true, reportVersions: { orderBy: { createdAt: 'desc' } } } })
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
    const comments = typeof req.body.comments === 'string' ? req.body.comments.trim() : null
    const editedReport = typeof req.body.reportContent === 'string' ? req.body.reportContent : null
    const finalContent = editedReport || inspection.reportVersions[0]?.content || inspection.aiAnalysis
    const result = await prisma.$transaction(async tx => {
      await tx.inspection.update({ where: { id: inspection.id }, data: { status: next } })
      const review = await tx.review.create({ data: { inspectionId: inspection.id, reviewerId: req.user!.id, approved: action === 'APPROVE' ? true : action === 'REJECT' ? false : null, comments } })
      const reviewAction = await tx.reviewAction.create({ data: { inspectionId: inspection.id, reviewerId: req.user!.id, action, oldStatus: inspection.status, newStatus: next, comments } })
      const auditLog = await tx.auditLog.create({ data: { userId: req.user!.id, action: `REVIEW_${action}`, entityType: 'INSPECTION', entityId: inspection.id, changes: JSON.stringify({ oldStatus: inspection.status, newStatus: next, comments }) } })
      await tx.complianceMemoryEvent.create({ data: { inspectionId: inspection.id, siteId: inspection.siteId, actorId: req.user!.id, eventType: 'REVIEW_DECISION', outcome: next, reason: comments, sourceRecordId: reviewAction.id, metadata: JSON.stringify({ action, oldStatus: inspection.status, newStatus: next, reviewId: review.id, auditLogId: auditLog.id }) } })
      if (editedReport) await tx.reportVersion.create({ data: { inspectionId: inspection.id, versionType: 'SUPERVISOR_EDIT', content: editedReport, authorId: req.user!.id } })
      if (action === 'APPROVE' && finalContent) await tx.reportVersion.create({ data: { inspectionId: inspection.id, versionType: 'FINAL_APPROVED', content: finalContent, authorId: req.user!.id } })
      return { review, reviewAction, auditLog }
    })
    await notificationService.createNotification({ userId: inspection.inspectorId, type: action === 'APPROVE' ? 'SUCCESS' : action === 'REJECT' ? 'ERROR' : 'WARNING', title: `Inspection ${next.replace(/_/g, ' ')}`, message: comments || `Inspection at ${inspection.site.name} was ${next.replace(/_/g, ' ').toLowerCase()}.`, actionUrl: `/dashboards/inspector/${inspection.id}` })
    await notificationService.createNotification({ userId: req.user!.id, type: 'INFO', title: `Review recorded: ${next.replace(/_/g, ' ')}`, message: `${inspection.site.name} review decision was persisted.`, actionUrl: `/dashboards/supervisor/${inspection.id}`, metadata: { inspectionId: inspection.id, reviewActionId: result.reviewAction.id } })
    const trust = await agentOrchestrator.updateTrustScore(inspection.inspectorId)
    res.json({ status: next, review: result.review, reviewAction: result.reviewAction, auditLog: result.auditLog, trust: trust.results?.trustScore })
  } catch { res.status(500).json({ error: 'Failed to record review decision' }) }
})

router.get('/inspections/:id', async (req: AuthRequest, res) => {
  const inspection = await prisma.inspection.findFirst({ where: { id: req.params.id, ...(await scope(req)) }, include: { site: true, inspector: { include: { trustScore: true } }, template: true, images: true, checklists: true, violations: true, verificationFindings: true, reviews: { include: { reviewer: true } }, reviewActions: { include: { reviewer: true }, orderBy: { createdAt: 'asc' } }, reports: true, reportVersions: { orderBy: { createdAt: 'asc' } }, ordiAssessments: { orderBy: { createdAt: 'desc' }, take: 1 } } })
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
  const ordi = await calculateOrdi(inspection)
  res.json({ inspection, ordi, aiDraft: inspection.aiAnalysis, finalReport: inspection.reportVersions.find(
  v => v.versionType === 'FINAL_APPROVED' || v.versionType === 'FINAL'
)?.content ||
null })
})

router.get('/trust', async (req: AuthRequest, res) => {
  const departmentId = req.user!.role === 'ADMIN' ? undefined : (await prisma.user.findUnique({ where: { id: req.user!.id } }))?.departmentId
  const inspectors = await prisma.user.findMany({ where: { role: 'INSPECTOR', ...(departmentId ? { departmentId } : {}) }, include: { trustScore: true, trustHistory: { orderBy: { createdAt: 'desc' }, take: 20 }, assignedInspections: { orderBy: { createdAt: 'desc' }, take: 20, select: { id: true, status: true, confidenceScore: true, createdAt: true } } } })
  res.json({ inspectors: inspectors.map((u: any) => ({ id: u.id, name: u.name, currentTrust: u.trustScore?.score ?? null, calculationSource: 'Trust Evolution Agent (persisted)', history: u.trustHistory, inspections: u.assignedInspections })) })
})

router.get('/notifications', async (req: AuthRequest, res) => {
  const notifications = await notificationService.getUserNotifications(req.user!.id, { unreadOnly: req.query.unread === 'true' })
  const unreadCount = await notificationService.getUnreadCount(req.user!.id)
  res.json({ unreadCount, notifications })
})

router.patch('/notifications/:id/read', async (req: AuthRequest, res) => {
  const notification = await prisma.notification.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!notification) return res.status(404).json({ error: 'Notification not found' })
  await notificationService.markAsRead(notification.id)
  res.json({ id: notification.id, read: true })
})

router.patch('/notifications/read-all', async (req: AuthRequest, res) => {
  await notificationService.markAllAsRead(req.user!.id)
  res.json({ read: true })
})

router.get('/heatmap', async (req: AuthRequest, res) => {
  const scoped: any = await scope(req)
  const where: any = { ...scoped, site: { ...(scoped.site || {}), latitude: { not: null }, longitude: { not: null } } }
  const inspections = await prisma.inspection.findMany({ where, include: { site: true, violations: true } })
  const latest = await latestOrdiByInspection(inspections.map(inspection => inspection.id))
  const bySite = new Map<string, any>()
  inspections.forEach(inspection => {
    const marker = bySite.get(inspection.siteId) || { siteId: inspection.siteId, name: inspection.site.name, latitude: inspection.site.latitude, longitude: inspection.site.longitude, scores: [], violationCount: 0, inspectionCount: 0 }
    const assessment = latest.get(inspection.id)
    if (assessment) marker.scores.push(assessment.score)
    marker.violationCount += inspection.violations.length
    marker.inspectionCount += 1
    bySite.set(inspection.siteId, marker)
  })
  res.json({ markers: Array.from(bySite.values()).map(marker => ({ ...marker, score: average(marker.scores) || 0, riskLevel: risk(average(marker.scores) || 0) })) })
})

router.get('/executive', async (req: AuthRequest, res) => {
  const inspectionWhere: any = await scope(req)
  const inspections = await prisma.inspection.findMany({ where: inspectionWhere, include: { site: { include: { department: true } }, inspector: { include: { trustScore: true } }, checklists: true, violations: true, reviews: true } })
  const inspectionIds = inspections.map(inspection => inspection.id)
  const latest = await latestOrdiByInspection(inspectionIds)
  const checklistItems = inspections.flatMap(inspection => inspection.checklists)
  const completed = inspections.filter(inspection => ['APPROVED', 'REJECTED'].includes(inspection.status))
  const scopedDepartmentIds = Array.from(new Set(inspections.map(inspection => inspection.site.departmentId)))
  const departments = await prisma.department.findMany({ where: scopedDepartmentIds.length ? { id: { in: scopedDepartmentIds } } : { id: { in: [] } } })
  const month = new Map<string, any>()
  inspections.forEach(inspection => { const key = monthKey(inspection.createdAt); const item = month.get(key) || { month: key, inspections: 0, completed: 0, approvals: 0, reviews: 0, trust: [], ordi: [] }; item.inspections++; if (['APPROVED', 'REJECTED'].includes(inspection.status)) item.completed++; inspection.reviews.forEach(review => { item.reviews++; if (review.approved === true) item.approvals++ }); if (inspection.inspector.trustScore) item.trust.push(inspection.inspector.trustScore.score); const score = latest.get(inspection.id)?.score; if (score !== undefined) item.ordi.push(score); month.set(key, item) })
  const trends = Array.from(month.values()).sort((a, b) => a.month.localeCompare(b.month)).map(item => ({ month: item.month, inspections: item.inspections, completed: item.completed, approvalRate: item.reviews ? item.approvals / item.reviews * 100 : null, trustScore: average(item.trust), ordiScore: average(item.ordi) }))
  const departmentPerformance = departments.map(department => { const rows = inspections.filter(inspection => inspection.site.departmentId === department.id); const items = rows.flatMap(inspection => inspection.checklists); const previous = rows.filter(inspection => inspection.createdAt < new Date(Date.now() - 30 * 86400000)); const recent = rows.filter(inspection => inspection.createdAt >= new Date(Date.now() - 30 * 86400000)); const previousRate = average(previous.flatMap(inspection => inspection.checklists).map(item => item.status === 'COMPLIANT' ? 100 : 0)); const recentRate = average(recent.flatMap(inspection => inspection.checklists).map(item => item.status === 'COMPLIANT' ? 100 : 0)); return { id: department.id, name: department.name, inspections: rows.length, violations: rows.reduce((total, row) => total + row.violations.length, 0), complianceRate: average(items.map(item => item.status === 'COMPLIANT' ? 100 : 0)), trend: recentRate === null || previousRate === null ? 'STABLE' : recentRate > previousRate ? 'UP' : recentRate < previousRate ? 'DOWN' : 'STABLE' } })
  const alerts = inspections.flatMap(inspection => { const assessment = latest.get(inspection.id); const items: any[] = []; if (assessment && assessment.score >= 50) items.push({ type: 'ORDI', severity: assessment.riskLevel, inspectionId: inspection.id, site: inspection.site.name, message: `ORDI score ${assessment.score} at ${inspection.site.name}`, createdAt: assessment.createdAt }); inspection.violations.filter(violation => violation.severity === 'CRITICAL').forEach(violation => items.push({ type: 'VIOLATION', severity: 'CRITICAL', inspectionId: inspection.id, site: inspection.site.name, message: violation.description, createdAt: violation.createdAt })); return items }).sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 10)
  const reviewActions = await prisma.reviewAction.findMany({ where: { inspectionId: { in: inspectionIds } }, include: { reviewer: true, inspection: { include: { site: true } } }, orderBy: { createdAt: 'desc' }, take: 10 })
  const insights = [
    ...departmentPerformance.filter(item => item.complianceRate !== null).sort((a, b) => (a.complianceRate || 0) - (b.complianceRate || 0)).slice(0, 1).map(item => ({ type: 'COMPLIANCE', title: `${item.name} has the lowest recorded compliance`, message: `${item.complianceRate?.toFixed(1)}% checklist compliance across ${item.inspections} inspections.`, recommendation: 'Prioritize supervisor review and corrective action follow-up.' })),
    ...Array.from(latest.values()).filter(item => item.score >= 50).sort((a, b) => b.score - a.score).slice(0, 1).map(item => ({ type: 'ORDI', title: 'High operational-reality divergence detected', message: `Inspection ${item.inspectionId} has ORDI ${item.score}.`, recommendation: 'Review evidence mismatches and open violations.' })),
  ]
  const trustScores = inspections.map(inspection => inspection.inspector.trustScore?.score).filter((score): score is number => score !== undefined)
  res.json({ kpis: { totalInspections: inspections.length, completedInspections: completed.length, pendingInspections: inspections.length - completed.length, criticalViolations: inspections.reduce((total, inspection) => total + inspection.violations.filter(violation => violation.severity === 'CRITICAL').length, 0), highRiskSites: new Set(inspections.filter(inspection => (latest.get(inspection.id)?.score || 0) >= 50).map(inspection => inspection.siteId)).size, averageComplianceRate: average(checklistItems.map(item => item.status === 'COMPLIANT' ? 100 : 0)), inspectorPerformance: average(trustScores) }, departmentPerformance, trends, alerts, insights, recentActions: reviewActions.map(action => ({ id: action.id, action: action.action, site: action.inspection.site.name, reviewer: action.reviewer.name, status: action.newStatus, createdAt: action.createdAt })) })
})

router.get('/exports/inspections.csv', async (req: AuthRequest, res) => {
  const inspections = await prisma.inspection.findMany({ where: await scope(req), include: { site: { include: { department: true } }, inspector: true, violations: true }, orderBy: { createdAt: 'desc' } })
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = ['Inspection ID,Site,Department,Inspector,Status,Completed Date,Confidence,Violation Count', ...inspections.map(inspection => [inspection.id, inspection.site.name, inspection.site.department.name, inspection.inspector.name, inspection.status, inspection.completedDate?.toISOString() || '', inspection.confidenceScore ?? '', inspection.violations.length].map(escape).join(','))].join('\n')
  res.type('text/csv').attachment('supervisor-inspections.csv').send(csv)
})

router.get('/inspections/:id/export/pdf', async (req: AuthRequest, res) => {
  const inspection = await prisma.inspection.findFirst({ where: { id: req.params.id, ...(await scope(req)) }, include: { site: true, inspector: true, checklists: true, violations: true, reportVersions: { orderBy: { createdAt: 'desc' }, take: 1 } } })
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="inspection-${inspection.id}.pdf"`)
  const doc = new PDFDocument()
  doc.pipe(res)
  doc.fontSize(20).text('NIRIKSHA Supervisor Inspection Report', { align: 'center' }).moveDown()
  doc.fontSize(12).text(`Site: ${inspection.site.name}`).text(`Inspector: ${inspection.inspector.name}`).text(`Status: ${inspection.status}`).text(`Completed: ${inspection.completedDate?.toISOString() || 'Not completed'}`).moveDown()
  doc.fontSize(15).text('Final Report').fontSize(12).text(inspection.reportVersions[0]?.content || inspection.aiAnalysis || 'No report content available').moveDown()
  doc.fontSize(15).text('Checklist').fontSize(12); inspection.checklists.forEach(item => doc.text(`${item.itemLabel}: ${item.status}`)); doc.moveDown(); doc.fontSize(15).text('Violations').fontSize(12); inspection.violations.forEach(item => doc.text(`${item.severity}: ${item.description}`)); doc.end()
})

// Department-specific checklist label mappings
const departmentChecklistLabels: Record<string, string[]> = {
  'Food Safety': ['Sanitation', 'Pest Control', 'Water Quality', 'Documentation', 'Staff Training', 'Waste Disposal'],
  'Fire Safety': ['Fire Safety', 'Emergency Exits', 'Electrical Safety', 'Signage', 'Equipment Maintenance', 'Documentation'],
  'Healthcare': ['Sanitation', 'First Aid', 'Documentation', 'Equipment Maintenance', 'Staff Training', 'Waste Disposal'],
  'Industrial Safety': ['Equipment Maintenance', 'Structural Integrity', 'Electrical Safety', 'Documentation', 'Staff Training', 'Ventilation'],
  'Environmental': ['Waste Disposal', 'Water Quality', 'Documentation', 'Structural Integrity', 'Ventilation', 'Signage'],
}

router.get('/analytics', async (req: AuthRequest, res) => {
  const where: any = await scope(req)
  const inspections = await prisma.inspection.findMany({ where, include: { violations: true, verificationFindings: true, reviews: true, site: { include: { department: true } }, checklists: true, inspector: true } })
  const completed = inspections.filter(i => ['APPROVED', 'COMPLETED', 'CLOSED'].includes(i.status))
  const confidence = inspections.filter(i => i.confidenceScore !== null)
  const byMonth = new Map<string, { inspections: number, completed: number }>()
  inspections.forEach(i => { const key = i.createdAt.toISOString().slice(0, 7); const value = byMonth.get(key) || { inspections: 0, completed: 0 }; value.inspections++; if (completed.some(c => c.id === i.id)) value.completed++; byMonth.set(key, value) })
  const reviews = inspections.flatMap(i => i.reviews)
  
  // Get department name from scoped inspections
  const departmentName = inspections[0]?.site?.department?.name || 'Unknown'
  
  // Build compliance breakdown from actual checklist data
  const allChecklists = inspections.flatMap(i => i.checklists)
  const labelGroups = new Map<string, { total: number, compliant: number }>()
  
  allChecklists.forEach(c => {
    const label = c.itemLabel
    const existing = labelGroups.get(label) || { total: 0, compliant: 0 }
    existing.total++
    if (c.status === 'COMPLIANT') existing.compliant++
    labelGroups.set(label, existing)
  })
  
  // Filter labels by department and calculate compliance rates
  const relevantLabels = departmentChecklistLabels[departmentName] || Array.from(labelGroups.keys())
  const complianceBreakdown = relevantLabels
    .filter(label => labelGroups.has(label))
    .map(label => {
      const counts = labelGroups.get(label)!
      return {
        category: label,
        complianceRate: Math.round((counts.compliant / counts.total) * 100),
        inspectionCount: counts.total
      }
    })
    .sort((a, b) => b.complianceRate - a.complianceRate)
  
  res.json({ 
    totalInspections: inspections.length, 
    completedInspections: completed.length, 
    approvalRate: reviews.length ? reviews.filter(r => r.approved).length / reviews.length * 100 : null, 
    averageVerificationConfidence: confidence.length ? confidence.reduce((n, i) => n + (i.confidenceScore || 0), 0) / confidence.length : null, 
    evidenceMismatchPercent: inspections.length ? inspections.filter(i => i.verificationFindings.length > 0).length / inspections.length * 100 : null, 
    violations: ['CRITICAL','HIGH','MEDIUM','LOW'].map(severity => ({ severity, count: inspections.reduce((n, i) => n + i.violations.filter(v => v.severity === severity).length, 0) })), 
    monthlyTrends: Array.from(byMonth, ([month, values]) => ({ month, ...values })),
    departmentName,
    complianceBreakdown
  })
})

router.get('/memory/graph', async (req: AuthRequest, res) => {
  const inspections = await prisma.inspection.findMany({ where: await scope(req), include: { site: true, inspector: true, images: true, violations: true, reviews: true, verificationFindings: true } })
  const nodes: any[] = [], edges: any[] = [], added = new Set<string>(); const add = (id: string, type: string, label: string) => { if (!added.has(id)) { nodes.push({ id, type, label }); added.add(id) } }
  inspections.forEach(i => { add(`inspection:${i.id}`, 'Inspection', i.id); add(`site:${i.siteId}`, 'Site', i.site.name); add(`inspector:${i.inspectorId}`, 'Inspector', i.inspector.name); edges.push({ from: `inspector:${i.inspectorId}`, to: `inspection:${i.id}`, type: 'inspected' }, { from: `inspection:${i.id}`, to: `site:${i.siteId}`, type: 'at_site' }); i.images.forEach(x => { add(`evidence:${x.id}`, 'Evidence', x.description || x.id); edges.push({ from: `inspection:${i.id}`, to: `evidence:${x.id}`, type: 'has_evidence' }) }); i.violations.forEach(x => { add(`violation:${x.id}`, 'Violation', x.description); edges.push({ from: `inspection:${i.id}`, to: `violation:${x.id}`, type: 'flagged' }) }); i.reviews.forEach(x => { add(`review:${x.id}`, 'Review', x.approved === true ? 'Approved' : x.approved === false ? 'Rejected' : 'Pending'); edges.push({ from: `review:${x.id}`, to: `inspection:${i.id}`, type: 'reviewed' }) }) })
  res.json({ nodes, edges })
})

router.get('/timeline/:id', async (req: AuthRequest, res) => {
  const inspection = await prisma.inspection.findFirst({ where: { id: req.params.id, ...(await scope(req)) }, include: { images: true, checklists: true, verificationFindings: true, reviewActions: true, complianceMemoryEvents: true } })
  if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
  const [notifications, auditLogs] = await Promise.all([
    prisma.notification.findMany({ where: { actionUrl: `/dashboards/inspector/${inspection.id}` }, orderBy: { createdAt: 'asc' } }),
    prisma.auditLog.findMany({ where: { entityType: 'INSPECTION', entityId: inspection.id }, orderBy: { createdAt: 'asc' } }),
  ])
  const events = [{ type: 'Inspection assigned', timestamp: inspection.createdAt }, ...inspection.checklists.map(i => ({ type: `Checklist updated: ${i.itemLabel}`, timestamp: i.updatedAt })), ...inspection.images.map(i => ({ type: 'Evidence uploaded', timestamp: i.uploadedAt })), ...inspection.verificationFindings.map(i => ({ type: 'AI verification', timestamp: i.createdAt })), ...inspection.complianceMemoryEvents.map(i => ({ type: i.eventType.replace(/_/g, ' '), timestamp: i.occurredAt })), ...inspection.reviewActions.map(i => ({ type: `Supervisor: ${i.action.replace(/_/g, ' ')}`, timestamp: i.createdAt })), ...notifications.map(i => ({ type: `Notification: ${i.title}`, timestamp: i.createdAt })), ...auditLogs.map(i => ({ type: `Audit: ${i.action}`, timestamp: i.createdAt }))].sort((a, b) => +new Date(a.timestamp) - +new Date(b.timestamp))
  res.json({ events })
})

export default router
