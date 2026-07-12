/** DEVELOPMENT / DEMO ONLY: never run this seed against production. */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '../src/utils/prisma'
import { agentOrchestrator } from '../src/agents/orchestrator'

const demoEmails = ['demo.supervisor@niriksha.test', 'demo.inspector.asha@niriksha.test', 'demo.inspector.vikram@niriksha.test']
const demoDepartmentNames = ['DEMO Operations', 'DEMO Safety']
const demoSiteNames = ['DEMO North Plant', 'DEMO River Warehouse']
const at = (day: number, hour = 9) => new Date(Date.UTC(2026, 6, day, hour, 0, 0))

async function removePreviousDemoData() {
  const users = await prisma.user.findMany({ where: { email: { in: demoEmails } }, select: { id: true } })
  const userIds = users.map(user => user.id)
  const inspections = await prisma.inspection.findMany({
    where: { OR: [{ inspectorId: { in: userIds } }, { site: { name: { in: demoSiteNames } } }] },
    select: { id: true },
  })
  const inspectionIds = inspections.map(inspection => inspection.id)
  const sites = await prisma.site.findMany({ where: { name: { in: demoSiteNames } }, select: { id: true } })
  const siteIds = sites.map(site => site.id)

  await prisma.notification.deleteMany({ where: { OR: [{ userId: { in: userIds } }, { actionUrl: { in: inspectionIds.map(id => `/dashboards/inspector/${id}`) } }] } })
  await prisma.complianceMemoryEvent.deleteMany({ where: { OR: [{ inspectionId: { in: inspectionIds } }, { siteId: { in: siteIds } }, { actorId: { in: userIds } }] } })
  await prisma.auditLog.deleteMany({ where: { OR: [{ entityId: { in: inspectionIds } }, { userId: { in: userIds } }] } })
  await prisma.reviewAction.deleteMany({ where: { inspectionId: { in: inspectionIds } } })
  await prisma.review.deleteMany({ where: { inspectionId: { in: inspectionIds } } })
  await prisma.reportVersion.deleteMany({ where: { inspectionId: { in: inspectionIds } } })
  await prisma.ordiAssessment.deleteMany({ where: { inspectionId: { in: inspectionIds } } })
  await prisma.report.deleteMany({ where: { inspectionId: { in: inspectionIds } } })
  await prisma.inspection.deleteMany({ where: { id: { in: inspectionIds } } })
  await prisma.trustHistory.deleteMany({ where: { inspectorId: { in: userIds } } })
  await prisma.trustScore.deleteMany({ where: { inspectorId: { in: userIds } } })
  await prisma.inspectionTemplate.deleteMany({ where: { name: { startsWith: 'DEMO ' } } })
  await prisma.site.deleteMany({ where: { name: { in: demoSiteNames } } })
  await prisma.user.deleteMany({ where: { email: { in: demoEmails } } })
  await prisma.department.deleteMany({ where: { name: { in: demoDepartmentNames } } })
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DEVELOPMENT / DEMO seed is disabled in production')
  }

  await removePreviousDemoData()
  const password = await bcrypt.hash('DemoOnly!2026', 10)
  const operations = await prisma.department.create({ data: { name: 'DEMO Operations', description: 'Development-only operations department' } })
  const safety = await prisma.department.create({ data: { name: 'DEMO Safety', description: 'Development-only safety department' } })
  const supervisor = await prisma.user.create({ data: { name: 'Demo Supervisor', email: 'demo.supervisor@niriksha.test', password, role: 'SUPERVISOR', departmentId: operations.id } })
  const asha = await prisma.user.create({ data: { name: 'Asha Rao', email: 'demo.inspector.asha@niriksha.test', password, role: 'INSPECTOR', departmentId: operations.id } })
  const vikram = await prisma.user.create({ data: { name: 'Vikram Shah', email: 'demo.inspector.vikram@niriksha.test', password, role: 'INSPECTOR', departmentId: safety.id } })
  const plant = await prisma.site.create({ data: { name: 'DEMO North Plant', address: '101 Industrial Estate, Pune', departmentId: operations.id, latitude: 18.5204, longitude: 73.8567 } })
  const warehouse = await prisma.site.create({ data: { name: 'DEMO River Warehouse', address: '22 River Road, Pune', departmentId: safety.id, latitude: 18.5314, longitude: 73.8446 } })
  const template = await prisma.inspectionTemplate.create({ data: { name: 'DEMO Electrical and Fire Safety', description: 'Development-only site safety checklist', departmentId: operations.id, checklistItems: JSON.stringify([{ id: 'fire-exit', label: 'Emergency exits clear' }, { id: 'panel', label: 'Electrical panel secured' }, { id: 'extinguisher', label: 'Extinguishers in service' }]) } })

  const approved = await prisma.inspection.create({ data: { siteId: plant.id, inspectorId: asha.id, templateId: template.id, status: 'APPROVED', scheduledDate: at(2), completedDate: at(2, 14), confidenceScore: 92, notes: 'Routine safety inspection completed.', aiAnalysis: 'Evidence aligned with the completed checklist.', createdAt: at(2, 9), updatedAt: at(2, 14) } })
  const target = await prisma.inspection.create({ data: { siteId: plant.id, inspectorId: asha.id, templateId: template.id, status: 'HOLD_FOR_REVIEW', scheduledDate: at(9), completedDate: at(9, 14), confidenceScore: 61, notes: 'Inspector noted a temporary obstruction near the east emergency exit.', aiAnalysis: 'Evidence indicates an exit obstruction requiring supervisor review.', createdAt: at(9, 9), updatedAt: at(9, 14) } })
  const warehouseInspection = await prisma.inspection.create({ data: { siteId: warehouse.id, inspectorId: vikram.id, templateId: template.id, status: 'UNDER_REVIEW', scheduledDate: at(10), completedDate: at(10, 15), confidenceScore: 78, notes: 'Warehouse electrical panel inspection.', aiAnalysis: 'Panel label mismatch requires review.', createdAt: at(10, 9), updatedAt: at(10, 15) } })

  await prisma.inspectionChecklist.createMany({ data: [
    { inspectionId: approved.id, itemId: 'fire-exit', itemLabel: 'Emergency exits clear', status: 'COMPLIANT', notes: 'All exits clear.', evidence: 'demo://north-plant/approved-exit.jpg', createdAt: at(2, 10), updatedAt: at(2, 11) },
    { inspectionId: approved.id, itemId: 'panel', itemLabel: 'Electrical panel secured', status: 'COMPLIANT', notes: 'Lock and label present.', evidence: 'demo://north-plant/approved-panel.jpg', createdAt: at(2, 10), updatedAt: at(2, 11) },
    { inspectionId: approved.id, itemId: 'extinguisher', itemLabel: 'Extinguishers in service', status: 'COMPLIANT', notes: 'Service tags current.', evidence: 'demo://north-plant/approved-extinguisher.jpg', createdAt: at(2, 10), updatedAt: at(2, 11) },
    { inspectionId: target.id, itemId: 'fire-exit', itemLabel: 'Emergency exits clear', status: 'NON_COMPLIANT', notes: 'Pallet staged in east exit route; removed before review.', evidence: 'demo://north-plant/east-exit.jpg', createdAt: at(9, 10), updatedAt: at(9, 11) },
    { inspectionId: target.id, itemId: 'panel', itemLabel: 'Electrical panel secured', status: 'COMPLIANT', notes: 'Panel locked and labelled.', evidence: 'demo://north-plant/panel.jpg', createdAt: at(9, 10), updatedAt: at(9, 11) },
    { inspectionId: target.id, itemId: 'extinguisher', itemLabel: 'Extinguishers in service', status: 'COMPLIANT', notes: 'Service tags current.', evidence: 'demo://north-plant/extinguisher.jpg', createdAt: at(9, 10), updatedAt: at(9, 11) },
    { inspectionId: warehouseInspection.id, itemId: 'panel', itemLabel: 'Electrical panel secured', status: 'NON_COMPLIANT', notes: 'Panel label is faded.', evidence: 'demo://warehouse/panel.jpg', createdAt: at(10, 10), updatedAt: at(10, 11) },
  ] })
  await prisma.inspectionImage.createMany({ data: [
    { inspectionId: approved.id, imageUrl: 'demo://north-plant/approved-exit.jpg', description: 'Clear emergency exit', uploadedAt: at(2, 11) },
    { inspectionId: target.id, imageUrl: 'demo://north-plant/east-exit.jpg', description: 'East exit obstruction before removal', uploadedAt: at(9, 11) },
    { inspectionId: target.id, imageUrl: 'demo://north-plant/panel.jpg', description: 'Secured electrical panel', uploadedAt: at(9, 11) },
    { inspectionId: warehouseInspection.id, imageUrl: 'demo://warehouse/panel.jpg', description: 'Faded warehouse panel label', uploadedAt: at(10, 11) },
  ] })
  await prisma.violation.createMany({ data: [
    { inspectionId: target.id, description: 'Pallet obstructed the east emergency exit.', severity: 'HIGH', checklistItemId: 'fire-exit', imageEvidence: 'demo://north-plant/east-exit.jpg', status: 'OPEN', createdAt: at(9, 12), updatedAt: at(9, 12) },
    { inspectionId: warehouseInspection.id, description: 'Electrical panel label is faded and incomplete.', severity: 'MEDIUM', checklistItemId: 'panel', imageEvidence: 'demo://warehouse/panel.jpg', status: 'OPEN', createdAt: at(10, 12), updatedAt: at(10, 12) },
  ] })
  await prisma.verificationFinding.createMany({ data: [
    { inspectionId: target.id, checklistItemId: 'fire-exit', checklistLabel: 'Emergency exits clear', finding: 'Vision evidence confirms a pallet occupied part of the east exit route before removal.', confidence: 0.89, evidenceReference: 'demo://north-plant/east-exit.jpg', createdAt: at(9, 12) },
    { inspectionId: warehouseInspection.id, checklistItemId: 'panel', checklistLabel: 'Electrical panel secured', finding: 'Panel photograph does not clearly show a current circuit label.', confidence: 0.76, evidenceReference: 'demo://warehouse/panel.jpg', createdAt: at(10, 12) },
  ] })
  await prisma.review.create({ data: { inspectionId: target.id, reviewerId: supervisor.id, approved: false, comments: 'Hold until the exit obstruction is removed and photo evidence is retained.', reviewedAt: at(9, 15) } })
  await prisma.reviewAction.createMany({ data: [
    { inspectionId: target.id, reviewerId: supervisor.id, action: 'REQUEST_EVIDENCE', oldStatus: 'SUBMITTED', newStatus: 'HOLD_FOR_REVIEW', comments: 'Retain removal evidence before final approval.', createdAt: at(9, 15) },
    { inspectionId: target.id, reviewerId: supervisor.id, action: 'MODIFY_AI_REPORT', oldStatus: 'HOLD_FOR_REVIEW', newStatus: 'HOLD_FOR_REVIEW', comments: 'Supervisor override: obstruction was remediated on site.', createdAt: at(9, 16) },
  ] })
  await prisma.report.create({ data: { inspectionId: approved.id, summary: 'North Plant passed routine electrical and fire safety inspection.', generatedAt: at(2, 14) } })
  await prisma.reportVersion.createMany({ data: [
    { inspectionId: approved.id, versionType: 'AI_DRAFT', content: 'North Plant routine inspection draft: all submitted evidence is compliant.', authorId: asha.id, createdAt: at(2, 13) },
    { inspectionId: approved.id, versionType: 'SUPERVISOR_EDIT', content: 'North Plant routine inspection reviewed; evidence and checklist are compliant.', authorId: supervisor.id, createdAt: at(2, 14) },
    { inspectionId: approved.id, versionType: 'FINAL_APPROVED', content: 'North Plant routine inspection approved after supervisor review.', authorId: supervisor.id, createdAt: at(2, 14) },
    { inspectionId: target.id, versionType: 'AI_DRAFT', content: 'Hold for review: east exit obstruction detected in submitted evidence.', authorId: asha.id, createdAt: at(9, 14) },
    { inspectionId: target.id, versionType: 'SUPERVISOR_EDIT', content: 'Exit obstruction was removed; retain evidence and approve after supervisor confirmation.', authorId: supervisor.id, createdAt: at(9, 16) },
  ] })
  await prisma.notification.createMany({ data: [
    { userId: asha.id, type: 'WARNING', title: 'Inspection on hold', message: 'North Plant inspection requires supervisor review.', actionUrl: `/dashboards/inspector/${target.id}`, createdAt: at(9, 15) },
    { userId: vikram.id, type: 'WARNING', title: 'Evidence review required', message: 'Warehouse panel label needs clearer evidence.', actionUrl: `/dashboards/inspector/${warehouseInspection.id}`, createdAt: at(10, 15) },
  ] })
  await prisma.auditLog.createMany({ data: [
    { userId: supervisor.id, action: 'REVIEW_REQUEST_EVIDENCE', entityType: 'INSPECTION', entityId: target.id, changes: { oldStatus: 'SUBMITTED', newStatus: 'HOLD_FOR_REVIEW' }, createdAt: at(9, 15) },
    { userId: supervisor.id, action: 'SUPERVISOR_OVERRIDE', entityType: 'INSPECTION', entityId: target.id, changes: { remediation: 'Exit cleared on site' }, createdAt: at(9, 16) },
  ] })
  await prisma.complianceMemoryEvent.createMany({ data: [
    { inspectionId: approved.id, siteId: plant.id, actorId: asha.id, eventType: 'VERIFICATION_COMPLETED', outcome: 'COMPLIANT', confidence: 0.92, sourceRecordId: 'demo-approved-verification', metadata: { verified: true }, occurredAt: at(2, 13) },
    { inspectionId: approved.id, siteId: plant.id, actorId: asha.id, eventType: 'INSPECTION_SUBMISSION', outcome: 'ON_TIME', sourceRecordId: 'demo-approved-submission', metadata: { onTime: true }, occurredAt: at(2, 14) },
    { inspectionId: approved.id, siteId: plant.id, actorId: asha.id, eventType: 'REPORT_GENERATION', outcome: 'COMPLETE', sourceRecordId: 'demo-approved-report', metadata: { qualityScore: 0.93 }, occurredAt: at(2, 14) },
    { inspectionId: target.id, siteId: plant.id, actorId: asha.id, eventType: 'VERIFICATION_COMPLETED', outcome: 'UNVERIFIED', confidence: 0.61, sourceRecordId: 'demo-target-verification', metadata: { verified: false }, occurredAt: at(9, 13) },
    { inspectionId: target.id, siteId: plant.id, actorId: asha.id, checklistItemId: 'fire-exit', checklistLabel: 'Emergency exits clear', eventType: 'VERIFICATION_FINDING', outcome: 'NON_COMPLIANT', finding: 'East exit route obstructed.', confidence: 0.89, evidenceReference: 'demo://north-plant/east-exit.jpg', sourceRecordId: 'demo-target-finding', occurredAt: at(9, 13) },
    { inspectionId: target.id, siteId: plant.id, actorId: asha.id, eventType: 'INSPECTION_OUTCOME', outcome: 'HOLD_FOR_REVIEW', reason: 'Evidence mismatch requires supervisor decision.', sourceRecordId: 'demo-target-hold', occurredAt: at(9, 14) },
    { inspectionId: target.id, siteId: plant.id, actorId: asha.id, eventType: 'SUBMISSION_OVERRIDE', outcome: 'SUBMISSION_OVERRIDE', reason: 'Obstruction cleared and evidence retained.', sourceRecordId: 'demo-target-override', occurredAt: at(9, 16) },
    { inspectionId: target.id, siteId: plant.id, actorId: supervisor.id, eventType: 'SUPERVISOR_REVIEW', outcome: 'OVERRIDDEN', reason: 'Supervisor accepted documented remediation.', sourceRecordId: 'demo-target-supervisor-review', occurredAt: at(9, 16) },
    { inspectionId: warehouseInspection.id, siteId: warehouse.id, actorId: vikram.id, eventType: 'VERIFICATION_COMPLETED', outcome: 'UNVERIFIED', confidence: 0.78, sourceRecordId: 'demo-warehouse-verification', metadata: { verified: false }, occurredAt: at(10, 13) },
    { inspectionId: warehouseInspection.id, siteId: warehouse.id, actorId: vikram.id, eventType: 'INSPECTION_SUBMISSION', outcome: 'ON_TIME', sourceRecordId: 'demo-warehouse-submission', metadata: { onTime: true }, occurredAt: at(10, 14) },
    { siteId: plant.id, actorId: supervisor.id, eventType: 'SYSTEMIC_RISK_DISCOVERED', outcome: 'DISCOVERED', finding: 'Repeated emergency-exit obstruction pattern requires monthly monitoring.', sourceRecordId: 'demo-systemic-risk-plant', metadata: { severity: 'HIGH', pattern: 'Emergency exit obstructions' }, occurredAt: at(10, 16) },
  ] })
  await prisma.ordiAssessment.createMany({ data: [
    { inspectionId: approved.id, score: 8, riskLevel: 'LOW', priority: 'P3', trend: 'STABLE', contributors: { evidenceMismatchRate: 0, trustDrift: 0, repeatViolations: 0, pendingReview: 0, adversarialFailures: 0, correctionFrequency: 0 }, createdAt: at(2, 14) },
    { inspectionId: target.id, score: 66, riskLevel: 'HIGH', priority: 'P1', trend: 'RISING', contributors: { evidenceMismatchRate: 33, trustDrift: 0, repeatViolations: 1, pendingReview: 1, adversarialFailures: 1, correctionFrequency: 1 }, createdAt: at(9, 15) },
    { inspectionId: warehouseInspection.id, score: 48, riskLevel: 'MEDIUM', priority: 'P2', trend: 'NEW', contributors: { evidenceMismatchRate: 100, trustDrift: 0, repeatViolations: 1, pendingReview: 1, adversarialFailures: 1, correctionFrequency: 0 }, createdAt: at(10, 15) },
  ] })

  // Uses the existing Trust Evolution Agent. It persists the unchanged agent result; it never invokes Gemini.
  await agentOrchestrator.updateTrustScore(asha.id)
  await agentOrchestrator.updateTrustScore(asha.id)
  await agentOrchestrator.updateTrustScore(vikram.id)
  await agentOrchestrator.updateTrustScore(vikram.id)

  console.log(JSON.stringify({ environment: process.env.NODE_ENV || 'development', seeded: true, supervisorId: supervisor.id, approvalInspectionId: target.id, inspectors: [asha.id, vikram.id] }, null, 2))
}

main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => prisma.$disconnect())
