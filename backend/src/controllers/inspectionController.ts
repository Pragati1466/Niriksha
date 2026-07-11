import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import prisma from '../utils/prisma'
import { agentOrchestrator } from '../agents/orchestrator'
import { AgentState, Inconsistency } from '../agents/types'
import { complianceMemory } from '../services/complianceMemory'

export const getInspections = async (req: AuthRequest, res: Response) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query

    const where: any = {}
    
    if (req.user?.role === 'INSPECTOR') {
      where.inspectorId = req.user.id
    }

    if (status) {
      where.status = status
    }

    const inspections = await prisma.inspection.findMany({
      where,
      include: {
        site: true,
        inspector: true,
        template: true,
        images: true,
        checklists: true,
        violations: true,
      },
      orderBy: { scheduledDate: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    })

    const total = await prisma.inspection.count({ where })

    res.json({ inspections, total })
  } catch (error) {
    console.error('Get inspections error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const getInspectionById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: {
        site: true,
        inspector: true,
        template: true,
        images: true,
        checklists: true,
        violations: true,
        reports: true,
        reviews: true,
        verificationFindings: true,
      },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    res.json(inspection)
  } catch (error) {
    console.error('Get inspection error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, templateId, scheduledDate, notes } = req.body

    const inspection = await prisma.inspection.create({
      data: {
        siteId,
        inspectorId: req.user!.id,
        templateId,
        scheduledDate: new Date(scheduledDate),
        notes,
        status: 'ASSIGNED',
      },
      include: {
        site: true,
        template: true,
      },
    })

    res.status(201).json(inspection)
  } catch (error) {
    console.error('Create inspection error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, notes, confidenceScore, aiAnalysis } = req.body

    if (status === 'SUBMITTED') {
      return submitInspection(req, res)
    }

    const inspection = await prisma.inspection.update({
      where: { id },
      data: {
        status,
        notes,
        confidenceScore,
        aiAnalysis,
        completedDate: status === 'SUBMITTED' ? new Date() : null,
      },
      include: {
        site: true,
        inspector: true,
        template: true,
      },
    })

    res.json(inspection)
  } catch (error) {
    console.error('Update inspection error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const submitInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const overrideReason = typeof req.body.overrideReason === 'string' ? req.body.overrideReason.trim() : ''
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { checklists: true, images: true },
    })

    if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only submit their own inspections' })
    }

    if (overrideReason) {
      if (inspection.status !== 'HOLD_FOR_REVIEW') {
        return res.status(409).json({ error: 'An override is only allowed for an inspection on hold' })
      }

      const submitted = await prisma.inspection.update({
        where: { id },
        data: {
          status: 'SUBMITTED',
          completedDate: new Date(),
          submissionOverrideReason: overrideReason,
          submissionOverriddenAt: new Date(),
        },
      })
      await complianceMemory.recordInspectionOutcome({
        inspectionId: inspection.id,
        actorId: req.user!.id,
        action: 'SUBMISSION_OVERRIDE',
        reason: overrideReason,
      })
      return res.json({ success: true, status: 'SUBMITTED', overridden: true, inspection: submitted })
    }

    await complianceMemory.recordVerificationStarted(inspection.id, req.user!.id)

    const state: AgentState = {
      inspectionId: inspection.id,
      inspectorId: inspection.inspectorId,
      checklist: inspection.checklists.map(item => ({
        id: item.id,
        label: item.itemLabel,
        status: item.status as 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE',
        required: true,
        notes: item.notes || undefined,
      })),
      images: inspection.images.map(image => ({
        id: image.id,
        url: image.imageUrl,
        description: image.description || '',
        timestamp: image.uploadedAt,
      })),
      currentAgent: '', errors: [], retryCount: 0, maxRetries: 3, results: {},
    }
    const verificationState = await agentOrchestrator.executeAgent('reality-verification', state)
    const verification = verificationState.results?.realityVerification
    const findings: Inconsistency[] = verification?.inconsistencies || [{
      checklistItemId: null as any,
      checklistLabel: 'Verification system',
      claimedStatus: 'UNKNOWN',
      detectedStatus: 'UNKNOWN',
      confidence: 0,
      reasoning: 'Unable to complete reality verification',
      severity: 'CRITICAL',
    }]
    const mustHold = !verification || !verification.verified || verification.confidenceScore < 70 || findings.some(f =>
      f.detectedStatus === 'NON_COMPLIANT' || f.detectedStatus === 'UNKNOWN' || f.confidence < 0.7
    )

    if (mustHold) {
      await prisma.$transaction([
        prisma.verificationFinding.createMany({
          data: findings.map(finding => ({
            inspectionId: inspection.id,
            checklistItemId: finding.checklistItemId || null,
            checklistLabel: finding.checklistLabel,
            finding: finding.reasoning,
            confidence: finding.confidence,
            evidenceReference: finding.evidenceReference || null,
          })),
        }),
        prisma.inspection.update({
          where: { id },
          data: { status: 'HOLD_FOR_REVIEW', completedDate: null, confidenceScore: verification?.confidenceScore || 0, aiAnalysis: verification?.explanation || 'Unable to complete reality verification' },
        }),
      ])
      await complianceMemory.recordInspectionOutcome({
        inspectionId: inspection.id,
        actorId: req.user!.id,
        action: 'HOLD_FOR_REVIEW',
        verification,
        findings,
      })
      return res.status(409).json({
        success: false,
        status: 'HOLD_FOR_REVIEW',
        message: 'Submission blocked pending review or inspector override',
        confidenceScore: verification?.confidenceScore || 0,
        findings,
      })
    }

    const submitted = await prisma.inspection.update({
      where: { id },
      data: { status: 'SUBMITTED', completedDate: new Date(), confidenceScore: verification.confidenceScore, aiAnalysis: verification.explanation, submissionOverrideReason: null, submissionOverriddenAt: null },
    })
    await complianceMemory.recordInspectionOutcome({
      inspectionId: inspection.id,
      actorId: req.user!.id,
      action: 'SUBMITTED',
      verification,
      findings,
    })
    return res.json({ success: true, status: 'SUBMITTED', overridden: false, inspection: submitted })
  } catch (error) {
    console.error('Submit inspection error:', error)
    return res.status(500).json({ error: 'Failed to submit inspection' })
  }
}

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const { inspectionId } = req.params
    const { description } = req.body
    const imageUrl = req.file?.path

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image uploaded' })
    }

    const image = await prisma.inspectionImage.create({
      data: {
        inspectionId,
        imageUrl,
        description,
      },
    })

    res.status(201).json(image)
  } catch (error) {
    console.error('Upload image error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { inspectionId } = req.params
    const { checklists } = req.body

    await prisma.$transaction(
      checklists.map((item: any) =>
        prisma.inspectionChecklist.upsert({
          where: { id: item.id || '' },
          create: {
            inspectionId,
            itemId: item.itemId,
            itemLabel: item.itemLabel,
            status: item.status,
            notes: item.notes,
            evidence: item.evidence,
          },
          update: {
            status: item.status,
            notes: item.notes,
            evidence: item.evidence,
          },
        })
      )
    )

    const updatedChecklists = await prisma.inspectionChecklist.findMany({
      where: { inspectionId },
    })

    await complianceMemory.recordCorrections(inspectionId, req.user!.id, updatedChecklists)

    res.json(updatedChecklists)
  } catch (error) {
    console.error('Update checklist error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const createViolation = async (req: AuthRequest, res: Response) => {
  try {
    const { inspectionId } = req.params
    const { description, severity, checklistItemId, imageEvidence } = req.body

    const violation = await prisma.violation.create({
      data: {
        inspectionId,
        description,
        severity,
        checklistItemId,
        imageEvidence,
      },
    })

    res.status(201).json(violation)
  } catch (error) {
    console.error('Create violation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
