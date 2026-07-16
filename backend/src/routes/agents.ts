import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { agentOrchestrator } from '../agents/orchestrator'
import { AgentState } from '../agents/types'
import prisma from '../utils/prisma'
import { requireRole } from '../middleware/auth'

const router = express.Router()

router.use(authenticateToken)

// Process inspection with full agent workflow
router.post('/process-inspection', async (req, res) => {
  try {
    const { inspectionId } = req.body

    if (!inspectionId) {
      return res.status(400).json({ error: 'Inspection ID required' })
    }

    // Fetch inspection data
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        site: true,
        inspector: true,
        template: true,
        checklists: true,
        images: true,
        violations: true,
      },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    // Prepare state for agents
    const state: AgentState = {
      inspectionId,
      inspectorId: inspection.inspectorId,
      checklist: inspection.checklists.map((c: any) => ({
        id: c.id,
        label: c.itemLabel,
        status: c.status,
        required: true,
        notes: c.notes,
      })),
      images: inspection.images.map((img: any) => ({
        id: img.id,
        url: img.imageUrl,
        description: img.description,
        timestamp: new Date(),
      })),
      notes: inspection.notes || '',
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    // Execute agent workflow
    const result = await agentOrchestrator.processInspection(state)

    res.json({
      success: true,
      results: result.results,
      workflowStatus: agentOrchestrator.getWorkflowStatus(result),
    })
  } catch (error) {
    console.error('Process inspection error:', error)
    res.status(500).json({ error: 'Failed to process inspection with agents' })
  }
})

// Reality verification only
router.post('/verify-reality', async (req, res) => {
  try {
    const { inspectionId } = req.body

    if (!inspectionId) {
      return res.status(400).json({ error: 'Inspection ID required' })
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        checklists: true,
        images: true,
      },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    const state: AgentState = {
      inspectionId,
      checklist: inspection.checklists.map((c: any) => ({
        id: c.id,
        label: c.itemLabel,
        status: c.status,
        required: true,
        notes: c.notes,
      })),
      images: inspection.images.map((img: any) => ({
        id: img.id,
        url: img.imageUrl,
        description: img.description,
        timestamp: new Date(),
      })),
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    const result = await agentOrchestrator.executeAgent('reality-verification', state)

    res.json({
      success: true,
      result: result.results?.realityVerification,
    })
  } catch (error) {
    console.error('Reality verification error:', error)
    res.status(500).json({ error: 'Failed to verify reality' })
  }
})

// Update trust score
router.post('/trust-score/:inspectorId', async (req, res) => {
  try {
    const { inspectorId } = req.params

    const result = await agentOrchestrator.updateTrustScore(inspectorId)

    res.json({
      success: true,
      trustScore: result.results?.trustScore,
    })
  } catch (error) {
    console.error('Trust score update error:', error)
    res.status(500).json({ error: 'Failed to update trust score' })
  }
})

// Systemic risk analysis
router.get('/risk-analysis', async (req, res) => {
  try {
    const result = await agentOrchestrator.analyzeRisk()

    res.json({
      success: true,
      riskAnalysis: result.results?.riskAnalysis,
    })
  } catch (error) {
    console.error('Risk analysis error:', error)
    res.status(500).json({ error: 'Failed to analyze risk' })
  }
})

// Generate report
router.post('/generate-report', async (req, res) => {
  try {
    const { inspectionId } = req.body

    if (!inspectionId) {
      return res.status(400).json({ error: 'Inspection ID required' })
    }

    const result = await agentOrchestrator.generateReport(inspectionId)

    res.json({
      success: true,
      report: result.results?.report,
    })
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ error: 'Failed to generate report' })
  }
})

// Optimize route
router.post('/optimize Route/:inspectorId', async (req, res) => {
  try {
    const { inspectorId } = req.params

    const result = await agentOrchestrator.optimizeRoute(inspectorId)

    res.json({
      success: true,
      routeOptimization: result.results?.routeOptimization,
    })
  } catch (error) {
    console.error('Route optimization error:', error)
    res.status(500).json({ error: 'Failed to optimize route' })
  }
})

// Get agent configurations
router.get('/configs', async (req, res) => {
  try {
    const configs = agentOrchestrator.getAllAgentConfigs()

    res.json({
      success: true,
      configs,
    })
  } catch (error) {
    console.error('Get configs error:', error)
    res.status(500).json({ error: 'Failed to get agent configurations' })
  }
})

// Get workflow status
router.get('/workflow-status/:inspectionId', async (req, res) => {
  try {
    const { inspectionId } = req.params

    // Get workflow status from memory
    const workflowData = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { status: true, confidenceScore: true },
    })

    const status = {
      inspectionId,
      status: workflowData?.status || 'UNKNOWN',
      confidenceScore: workflowData?.confidenceScore || 0,
      lastUpdated: new Date(),
    }

    res.json({
      success: true,
      status,
    })
  } catch (error) {
    console.error('Workflow status error:', error)
    res.status(500).json({ error: 'Failed to get workflow status' })
  }
})

// Get memory statistics
router.get('/memory-stats', async (req, res) => {
  try {
    const stats = await agentOrchestrator.getMemoryStats()

    res.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Memory stats error:', error)
    res.status(500).json({ error: 'Failed to get memory statistics' })
  }
})

// Get institutional compliance memory history
router.get('/memory-history', async (req, res) => {
  try {
    const requestedLimit = Number(req.query.limit) || 25
    const requestedOffset = Number(req.query.offset) || 0
    const limit = Math.min(Math.max(requestedLimit, 1), 100)
    const offset = Math.max(requestedOffset, 0)

    const [events, total] = await Promise.all([
      prisma.complianceMemoryEvent.findMany({
        include: {
          actor: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { occurredAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.complianceMemoryEvent.count(),
    ])

    res.json({
      success: true,
      events,
      pagination: { limit, offset, total, hasMore: offset + events.length < total },
    })
  } catch (error) {
    console.error('Memory history error:', error)
    res.status(500).json({ error: 'Failed to get compliance memory history' })
  }
})

// Reset agent memory
router.post('/reset-memory', requireRole(['ADMIN']), async (req, res) => {
  try {
    await agentOrchestrator.resetMemory()

    res.json({
      success: true,
      message: 'Agent memory reset successfully',
    })
  } catch (error) {
    console.error('Reset memory error:', error)
    const message = error instanceof Error ? error.message : 'Failed to reset agent memory'
    res.status(message === 'Memory reset is disabled in production' ? 403 : 500).json({ error: message })
  }
})

export default router
