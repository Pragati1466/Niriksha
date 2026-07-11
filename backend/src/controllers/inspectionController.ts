import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import prisma from '../utils/prisma'

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
