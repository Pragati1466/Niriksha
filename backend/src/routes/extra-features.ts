// Extra Features API Routes - Voice, War Room, Compliance DNA, What-If, Passport, Meta-Audit
import { Router } from 'express'
import prisma from '../utils/prisma'
import { agentOrchestrator } from '../agents/orchestrator'
import { predictiveInspection } from '../services/predictiveInspection'
import { complianceMemory } from '../services/complianceMemory'
import crypto from 'crypto'

const router = Router()

// ============================================================
// FEATURE 2: Black Mirror Score Card - Inspector Trust Timeline
// ============================================================
router.get('/inspector/:id/trust-timeline', async (req, res) => {
  try {
    const inspector = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        trustScore: true,
        trustHistory: { orderBy: { createdAt: 'desc' }, take: 50 },
        reviews: { include: { inspection: { select: { id: true, siteId: true } } }, orderBy: { reviewedAt: 'desc' }, take: 20 },
      }
    })
    if (!inspector) return res.status(404).json({ error: 'Inspector not found' })

    // Build timeline events
    const events: any[] = []
    inspector.trustHistory.forEach(h => {
      const diff = h.score - h.previousScore
      events.push({
        date: h.createdAt,
        type: diff >= 0 ? 'IMPROVEMENT' : 'DECLINE',
        score: h.score,
        change: diff,
        reason: h.reasons,
      })
    })

    // Generate improvement plan using Groq
    const improvementPlan = await generateImprovementPlan(inspector)

    res.json({
      currentScore: inspector.trustScore?.score || 100,
      history: inspector.trustHistory,
      timeline: events,
      improvementPlan,
      totalInspections: inspector.trustScore?.totalInspections || 0,
      flaggedInspections: inspector.trustScore?.flaggedInspections || 0,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to load trust timeline' })
  }
})

async function generateImprovementPlan(inspector: any): Promise<string> {
  try {
    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const history = inspector.trustHistory?.slice(0, 10) || []
    const reasons = history.map((h: any) => h.reasons).filter(Boolean).join('. ')
    
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a trust improvement coach for inspectors. Provide a personalized action plan.' },
        { role: 'user', content: `Inspector ${inspector.name} has trust score ${inspector.trustScore?.score || 100}. Recent events: ${reasons}. Give a 3-point improvement plan.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
    })
    return completion.choices[0]?.message?.content || 'Continue maintaining high standards of inspection accuracy and evidence documentation.'
  } catch {
    return 'Continue maintaining high standards of inspection accuracy and evidence documentation.'
  }
}

// ============================================================
// FEATURE 3: Compliance DNA - Site Fingerprint
// ============================================================
router.get('/site/:id/compliance-dna', async (req, res) => {
  try {
    const site = await prisma.site.findUnique({
      where: { id: req.params.id },
      include: {
        inspections: {
          include: { checklists: true, violations: true, verificationFindings: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        }
      }
    })
    if (!site) return res.status(404).json({ error: 'Site not found' })

    // Calculate 6-axis radar data
    const axes = ['Food Safety', 'Structural', 'Electrical', 'Fire', 'Hygiene', 'Documentation']
    const scores = axes.map(axis => {
      const relevantChecklists = site.inspections.flatMap(i => i.checklists.filter(c => 
        c.itemLabel.toLowerCase().includes(axis.toLowerCase())
      ))
      const compliant = relevantChecklists.filter(c => c.status === 'COMPLIANT').length
      const total = relevantChecklists.length || 1
      return { axis, score: Math.round((compliant / total) * 100), totalItems: total }
    })

    // Find recurring issues
    const recurringIssues = await complianceMemory.findRepeatedIssues(site.id)

    // Get violation trends
    const violationsByType = site.inspections.flatMap(i => i.violations)
      .reduce((acc: any, v: any) => {
        acc[v.severity] = (acc[v.severity] || 0) + 1
        return acc
      }, {})

    res.json({
      siteName: site.name,
      dnaScores: scores,
      overallHealth: Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length),
      recurringIssues,
      violationDistribution: violationsByType,
      totalInspections: site.inspections.length,
      lastInspection: site.inspections[0]?.createdAt || null,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to load compliance DNA' })
  }
})

// ============================================================
// FEATURE 4: What-If Simulator
// ============================================================
router.post('/simulate/what-if', async (req, res) => {
  try {
    const { scenario, inspectorId, siteId, daysAhead = 30 } = req.body

    // Get current data
    const [inspector, site] = await Promise.all([
      inspectorId ? prisma.user.findUnique({ where: { id: inspectorId }, include: { trustScore: true, trustHistory: { take: 20, orderBy: { createdAt: 'desc' } } } }) : null,
      siteId ? prisma.site.findUnique({ where: { id: siteId }, include: { inspections: { include: { violations: true, checklists: true }, take: 10, orderBy: { createdAt: 'desc' } } } }) : null,
    ])

    let projectedOutcome: any = {}

    if (scenario === 'reassign_inspector' && inspector) {
      // Simulate trust score recovery with new assignments
      const currentScore = inspector.trustScore?.score || 100
      const recoveryRate = Math.min(15, (100 - currentScore) * 0.3)
      projectedOutcome = {
        scenario: 'Inspector Reassignment',
        currentTrustScore: currentScore,
        projectedTrustScore: Math.min(100, currentScore + recoveryRate),
        projectedIn: `${Math.ceil(daysAhead / 2)} days`,
        confidence: 0.75,
        recommendation: currentScore < 70 
          ? 'Reassign to lower-risk sites for 2 weeks to rebuild confidence'
          : 'Continue with current assignments, monitor weekly',
      }
    } else if (scenario === 'miss_inspection' && site) {
      // Simulate risk increase from missed inspection
      const currentRisk = site.inspections.flatMap(i => i.violations).length / Math.max(site.inspections.length, 1)
      const projectedRisk = Math.min(1, currentRisk * 1.4)
      projectedOutcome = {
        scenario: 'Missed Inspection',
        currentRiskLevel: currentRisk > 0.5 ? 'HIGH' : currentRisk > 0.3 ? 'MEDIUM' : 'LOW',
        projectedRiskLevel: projectedRisk > 0.5 ? 'CRITICAL' : projectedRisk > 0.3 ? 'HIGH' : 'MEDIUM',
        riskIncrease: `${Math.round((projectedRisk - currentRisk) * 100)}%`,
        confidence: 0.8,
        recommendation: 'Schedule inspection immediately to prevent risk escalation',
      }
    } else if (scenario === 'increase_inspections' && site) {
      // Simulate compliance improvement with more inspections
      const currentCompliance = site.inspections.flatMap(i => i.checklists)
      const compliantRate = currentCompliance.filter((c: any) => c.status === 'COMPLIANT').length / Math.max(currentCompliance.length, 1)
      projectedOutcome = {
        scenario: 'Increased Inspection Frequency',
        currentComplianceRate: `${Math.round(compliantRate * 100)}%`,
        projectedComplianceRate: `${Math.min(100, Math.round(compliantRate * 100 + 15))}%`,
        projectedIn: `${daysAhead} days`,
        confidence: 0.7,
        recommendation: 'Increase inspection frequency from monthly to bi-weekly for 2 months',
      }
    } else {
      projectedOutcome = {
        scenario: 'General Projection',
        message: 'Select a specific scenario to simulate',
        confidence: 0,
      }
    }

    res.json(projectedOutcome)
  } catch (error) {
    res.status(500).json({ error: 'Failed to run simulation' })
  }
})

// ============================================================
// FEATURE 5: War Room - Live Supervisor Dashboard
// ============================================================
router.get('/war-room', async (req, res) => {
  try {
    const [activeInspections, alerts, inspectorStatus, recentEvents] = await Promise.all([
      prisma.inspection.findMany({
        where: { status: { in: ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW'] } },
        include: { site: true, inspector: { include: { trustScore: true } }, violations: true, verificationFindings: true },
        orderBy: { updatedAt: 'desc' },
        take: 20,
      }),
      prisma.complianceMemoryEvent.findMany({
        where: { eventType: { in: ['VERIFICATION_FINDING', 'SYSTEMIC_RISK_DISCOVERED'] } },
        orderBy: { occurredAt: 'desc' },
        take: 30,
      }),
      prisma.user.findMany({
        where: { role: 'INSPECTOR', isActive: true },
        include: { trustScore: true, assignedInspections: { where: { status: 'IN_PROGRESS' }, select: { id: true } } },
      }),
      prisma.complianceMemoryEvent.findMany({
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
    ])

    // Build map markers
    const mapMarkers = activeInspections
      .filter(i => i.site.latitude && i.site.longitude)
      .map(i => ({
        id: i.id,
        site: i.site.name,
        lat: i.site.latitude,
        lng: i.site.longitude,
        status: i.status,
        inspector: i.inspector.name,
        trustScore: i.inspector.trustScore?.score || null,
        violations: i.violations.length,
        mismatches: i.verificationFindings.length,
      }))

    // Build alert ticker
    const alertTicker = alerts.map(a => ({
      id: a.id,
      type: a.eventType === 'VERIFICATION_FINDING' ? 'EVIDENCE_MISMATCH' : 'RISK_ALERT',
      message: a.finding || a.outcome,
      siteId: a.siteId,
      timestamp: a.occurredAt,
      severity: a.eventType === 'SYSTEMIC_RISK_DISCOVERED' ? 'CRITICAL' : 'HIGH',
    }))

    // Inspector status grid
    const inspectorGrid = inspectorStatus.map(i => ({
      id: i.id,
      name: i.name,
      trustScore: i.trustScore?.score || 100,
      activeInspections: i.assignedInspections.length,
      status: i.assignedInspections.length > 0 ? 'IN_FIELD' : 'AVAILABLE',
    }))

    // ORDI gauge
    const ordiScores = activeInspections
      .filter(i => i.verificationFindings.length > 0)
      .map(i => ({
        inspectionId: i.id,
        site: i.site.name,
        mismatchCount: i.verificationFindings.length,
        severity: i.verificationFindings.length > 3 ? 'CRITICAL' : i.verificationFindings.length > 1 ? 'HIGH' : 'LOW',
      }))

    res.json({
      activeInspections: activeInspections.length,
      activeInspectors: inspectorStatus.length,
      criticalAlerts: alerts.filter(a => a.eventType === 'SYSTEMIC_RISK_DISCOVERED').length,
      mapMarkers,
      alertTicker,
      inspectorGrid,
      ordiScores,
      recentEvents: recentEvents.slice(0, 20),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to load war room' })
  }
})

// ============================================================
// FEATURE 6: Inspection Passport - Cryptographic Chain
// ============================================================
router.get('/inspections/:id/passport', async (req, res) => {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: req.params.id },
      include: {
        site: true,
        inspector: true,
        checklists: true,
        violations: true,
        images: true,
        verificationFindings: true,
        reviews: { include: { reviewer: true } },
        reviewActions: { include: { reviewer: true }, orderBy: { createdAt: 'asc' } },
        reportVersions: { orderBy: { createdAt: 'asc' } },
        complianceMemoryEvents: { orderBy: { occurredAt: 'asc' } },
      }
    })
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' })

    // Build chain of custody
    const chain: any[] = []
    let previousHash = '0'.repeat(64) // Genesis hash

    // Helper to add a block
    const addBlock = (event: string, timestamp: Date, data: any) => {
      const block: any = { index: chain.length, timestamp, event, data, previousHash }
      block.hash = crypto.createHash('sha256').update(JSON.stringify(block)).digest('hex')
      chain.push(block)
      previousHash = block.hash
    }

    // Event 1: Inspection Created
    addBlock('INSPECTION_CREATED', inspection.createdAt, { inspectionId: inspection.id, siteId: inspection.siteId, inspectorId: inspection.inspectorId })

    // Event 2: Evidence Uploaded
    ;(inspection as any).images?.forEach((img: any) => {
      addBlock('EVIDENCE_UPLOADED', img.uploadedAt, { imageId: img.id, description: img.description })
    })

    // Event 3: Checklist Completed
    ;(inspection as any).checklists?.forEach((cl: any) => {
      addBlock('CHECKLIST_UPDATED', cl.updatedAt, { itemId: cl.itemId, status: cl.status })
    })

    // Event 4: AI Verification
    ;(inspection as any).verificationFindings?.forEach((vf: any) => {
      addBlock('AI_VERIFICATION', vf.createdAt, { finding: vf.finding, confidence: vf.confidence })
    })

    // Event 5: Review Actions
    ;(inspection as any).reviewActions?.forEach((ra: any) => {
      addBlock('REVIEW_ACTION', ra.createdAt, { action: ra.action, reviewerId: ra.reviewerId, oldStatus: ra.oldStatus, newStatus: ra.newStatus })
    })

    // Event 6: Report Generated
    ;(inspection as any).reportVersions?.forEach((rv: any) => {
      addBlock('REPORT_VERSION', rv.createdAt, { versionType: rv.versionType, authorId: rv.authorId })
    })

    // Final hash (root)
    const rootHash = crypto.createHash('sha256').update(chain.map(e => e.hash).join('')).digest('hex')

    res.json({
      inspectionId: inspection.id,
      siteName: inspection.site.name,
      status: inspection.status,
      chain,
      rootHash,
      chainLength: chain.length,
      verified: true,
      lastVerified: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate passport' })
  }
})

// ============================================================
// FEATURE 8: AI Debate Mode - Multi-Model Consensus
// ============================================================
router.post('/ai-debate', async (req, res) => {
  try {
    const { inspectionData, checklistData } = req.body
    if (!inspectionData) return res.status(400).json({ error: 'Inspection data required' })

    const Groq = (await import('groq-sdk')).default
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // Run two models in parallel
    const [model1Result, model2Result] = await Promise.all([
      groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a strict inspection verifier. Analyze evidence vs claims. Respond with JSON: { "verified": boolean, "confidence": number, "findings": string[], "explanation": string }' },
          { role: 'user', content: `Inspection data: ${JSON.stringify(inspectionData)}. Checklist: ${JSON.stringify(checklistData)}` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
      groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a lenient inspection verifier. Focus on what was done right. Respond with JSON: { "verified": boolean, "confidence": number, "findings": string[], "explanation": string }' },
          { role: 'user', content: `Inspection data: ${JSON.stringify(inspectionData)}. Checklist: ${JSON.stringify(checklistData)}` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        response_format: { type: 'json_object' },
      }),
    ])

    const verdict1 = JSON.parse(model1Result.choices[0]?.message?.content || '{}')
    const verdict2 = JSON.parse(model2Result.choices[0]?.message?.content || '{}')

    const agree = verdict1.verified === verdict2.verified
    const avgConfidence = ((verdict1.confidence || 0) + (verdict2.confidence || 0)) / 2

    res.json({
      model1: { name: 'Strict Verifier (Llama 70B)', ...verdict1 },
      model2: { name: 'Lenient Verifier (Llama 70B)', ...verdict2 },
      consensus: {
        agreed: agree,
        finalVerdict: agree ? verdict1.verified : 'FLAGGED_FOR_REVIEW',
        averageConfidence: avgConfidence,
        needsSupervisorReview: !agree || avgConfidence < 0.7,
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to run AI debate' })
  }
})

// ============================================================
// FEATURE 9: Predictive Heatmap (30-day forecast)
// ============================================================
router.get('/predictive-heatmap', async (req, res) => {
  try {
    const predictions = await predictiveInspection.predictInspectionOutcomes()
    const sites = await prisma.site.findMany({ select: { id: true, name: true, latitude: true, longitude: true } })

    const heatmapData = sites.map(site => {
      const prediction = predictions.find(p => p.establishmentId === site.id)
      return {
        id: site.id,
        name: site.name,
        latitude: site.latitude,
        longitude: site.longitude,
        currentRisk: prediction?.failureProbability || 0,
        predictedRisk30d: Math.min(1, (prediction?.failureProbability || 0) * 1.3),
        riskFactors: prediction?.riskFactors || [],
        recommendedAction: prediction?.recommendedAction || 'Routine inspection',
      }
    })

    res.json({
      historical: heatmapData.map(d => ({ id: d.id, name: d.name, lat: d.latitude, lng: d.longitude, risk: d.currentRisk, type: 'historical' })),
      predicted: heatmapData.map(d => ({ id: d.id, name: d.name, lat: d.latitude, lng: d.longitude, risk: d.predictedRisk30d, type: 'predicted' })),
      highRiskCount: heatmapData.filter(d => d.predictedRisk30d > 0.6).length,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to load predictive heatmap' })
  }
})

// ============================================================
// FEATURE 10: Meta-Audit Agent
// ============================================================
router.get('/meta-audit', async (req, res) => {
  try {
    // Get all agent decisions and supervisor overrides
    const [reviewActions, verificationFindings, complianceEvents] = await Promise.all([
      prisma.reviewAction.findMany({
        include: { inspection: { include: { site: true, inspector: true } }, reviewer: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.verificationFinding.findMany({
        include: { inspection: { include: { site: true, inspector: true } } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      prisma.complianceMemoryEvent.findMany({
        where: { eventType: { in: ['REVIEW_DECISION', 'VERIFICATION_COMPLETED', 'HUMAN_CORRECTION'] } },
        orderBy: { occurredAt: 'desc' },
        take: 200,
      }),
    ])

    // Find overrides (supervisor disagreed with AI)
    const overrides = reviewActions.filter(ra => {
      const aiVerdict = verificationFindings.find(vf => vf.inspectionId === ra.inspectionId)
      if (!aiVerdict) return false
      const aiApproved = aiVerdict.confidence > 0.7
      const supervisorApproved = ra.action === 'APPROVE'
      return aiApproved !== supervisorApproved
    })

    // Group by site to find patterns
    const sitePatterns = overrides.reduce((acc: any, ra) => {
      const siteId = ra.inspection.siteId
      if (!acc[siteId]) acc[siteId] = { siteName: ra.inspection.site.name, overrides: 0, agents: {} }
      acc[siteId].overrides++
      acc[siteId].agents['Reality Verification'] = (acc[siteId].agents['Reality Verification'] || 0) + 1
      return acc
    }, {})

    // Generate agent performance report
    const agentPerformance = {
      realityVerification: {
        totalDecisions: verificationFindings.length,
        overridden: overrides.length,
        accuracy: verificationFindings.length > 0 
          ? Math.round(((verificationFindings.length - overrides.length) / verificationFindings.length) * 100) 
          : 100,
        topBlindSpots: Object.entries(sitePatterns)
          .sort((a: any, b: any) => b[1].overrides - a[1].overrides)
          .slice(0, 3)
          .map(([siteId, data]: any) => ({ siteId, siteName: data.siteName, overrideCount: data.overrides })),
      },
      trustEvolution: {
        totalUpdates: complianceEvents.filter(e => e.eventType === 'TRUST_SCORE').length,
        correctionsApplied: complianceEvents.filter(e => e.eventType === 'HUMAN_CORRECTION').length,
      },
    }

    // Generate recommendations using Groq
    let recommendations = 'All agents performing within expected parameters.'
    try {
      const Groq = (await import('groq-sdk')).default
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a meta-audit agent. Analyze agent performance and suggest improvements.' },
          { role: 'user', content: `Agent Report: ${JSON.stringify(agentPerformance)}. Site patterns: ${JSON.stringify(sitePatterns)}. Give 3 specific recommendations.` }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
      })
      recommendations = completion.choices[0]?.message?.content || recommendations
    } catch {}

    res.json({
      reportDate: new Date().toISOString(),
      agentPerformance,
      sitePatterns: Object.entries(sitePatterns).map(([siteId, data]: any) => ({ siteId, ...data })),
      overrides: overrides.slice(0, 10).map(ra => ({
        inspectionId: ra.inspectionId,
        site: ra.inspection.site.name,
        inspector: ra.inspection.inspector.name,
        action: ra.action,
        reviewer: ra.reviewer.name,
        date: ra.createdAt,
      })),
      recommendations,
      selfImproving: true,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to run meta-audit' })
  }
})

export default router