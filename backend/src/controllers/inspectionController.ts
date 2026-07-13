import { Response } from 'express'
import { AuthRequest } from '../middleware/auth'
import prisma from '../utils/prisma'
import { agentOrchestrator } from '../agents/orchestrator'
import { AgentState, Inconsistency } from '../agents/types'
import { complianceMemory } from '../services/complianceMemory'
import * as fs from 'fs'
// @ts-ignore
import * as piexif from 'piexifjs'
import { uploadToS3, deleteFromS3, generateS3Key } from '../utils/s3'

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
    console.log('Get inspection by ID request:', { id, userId: req.user?.id, userRole: req.user?.role })

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
      console.log('Inspection not found:', id)
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      console.log('Permission denied: inspector trying to access another inspection', { 
        inspectorId: inspection.inspectorId, 
        userId: req.user.id 
      })
      return res.status(403).json({ error: 'Inspectors can only access their own inspections' })
    }

    console.log('Inspection found and authorized:', id)
    res.json(inspection)
  } catch (error) {
    console.error('Get inspection error:', error)
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}

export const createInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { siteId, templateId, scheduledDate, notes, inspectorId } = req.body

    console.log('Create inspection request:', { siteId, templateId, scheduledDate, notes, inspectorId, userRole: req.user?.role })

    if (!siteId || !templateId || !scheduledDate) {
      return res.status(400).json({ error: 'Missing required fields: siteId, templateId, or scheduledDate' })
    }

    const template = await prisma.inspectionTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const checklistItems = JSON.parse(template.checklistItems)

    const targetInspectorId = req.user?.role === 'SUPERVISOR' ? inspectorId : req.user!.id

    console.log('Target inspector ID:', targetInspectorId, 'User role:', req.user?.role)

    if (!targetInspectorId) {
      return res.status(400).json({ error: 'No inspector ID available' })
    }

    const inspection = await prisma.inspection.create({
      data: {
        siteId,
        inspectorId: targetInspectorId,
        templateId,
        scheduledDate: new Date(scheduledDate),
        notes,
        status: 'ASSIGNED',
        checklists: {
          create: checklistItems.map((item: any) => ({
            itemId: item.id,
            itemLabel: item.label,
            status: 'PENDING',
            required: item.required || false,
          })),
        },
      },
      include: {
        site: true,
        template: true,
        checklists: true,
        inspector: true,
      },
    })

    res.status(201).json(inspection)
  } catch (error) {
    console.error('Create inspection error:', error)
    res.status(500).json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' })
  }
}

// SECURITY FIX: Enforce ownership on inspection edits
export const updateInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const { status, notes, confidenceScore, aiAnalysis } = req.body

    if (status === 'SUBMITTED') {
      return submitInspection(req, res)
    }

    // SECURITY: Check ownership for INSPECTOR role
    const existing = await prisma.inspection.findUnique({
      where: { id },
      select: { inspectorId: true },
    })

    if (!existing) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && existing.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only edit their own inspections' })
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

// FIX #1: Wire full AI pipeline on inspection submit
export const submitInspection = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const overrideReason = typeof req.body.overrideReason === 'string' ? req.body.overrideReason.trim() : ''
    const { locationLat, locationLng, locationAccuracy, locationTimestamp } = req.body
    const inspection = await prisma.inspection.findUnique({
      where: { id },
      include: { checklists: true, images: true, site: true },
    })

    if (!inspection) return res.status(404).json({ error: 'Inspection not found' })
    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only submit their own inspections' })
    }

    // Validate all required checklist items are answered
    const requiredItems = inspection.checklists.filter(c => c.required)
    const unansweredRequired = requiredItems.filter(c => c.status === 'PENDING')

    if (unansweredRequired.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot submit inspection with unanswered required items',
        unansweredItems: unansweredRequired.map(c => ({ id: c.id, label: c.itemLabel }))
      })
    }

    // GPS validation
    if (locationLat && locationLng && inspection.site.latitude && inspection.site.longitude) {
      const distance = calculateDistance(
        locationLat, locationLng,
        inspection.site.latitude, inspection.site.longitude
      )
      const maxDistance = 500
      if (distance > maxDistance) {
        return res.status(400).json({ 
          error: 'Location validation failed',
          message: `Inspector is ${distance.toFixed(0)}m from site. Maximum allowed distance is ${maxDistance}m.`,
          distance,
          maxDistance
        })
      }
    }

    // Save GPS data
    await prisma.inspection.update({
      where: { id },
      data: {
        locationLat,
        locationLng,
        locationAccuracy,
        locationTimestamp: locationTimestamp ? new Date(locationTimestamp) : null,
      },
    })

    // Handle submission override for held inspections
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

    // FIX: Run the FULL AI pipeline instead of just evidence verification
    await complianceMemory.recordVerificationStarted(inspection.id, req.user!.id)

    const state: AgentState = {
      inspectionId: inspection.id,
      inspectorId: inspection.inspectorId,
      checklist: inspection.checklists.map(item => ({
        id: item.id,
        label: item.itemLabel,
        status: item.status as 'COMPLIANT' | 'NON_COMPLIANT' | 'NOT_APPLICABLE',
        required: item.required,
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

    // Run the full multi-agent pipeline
    const results = await agentOrchestrator.processInspection(state)
    const verification = results.results?.realityVerification
    const riskAnalysis = results.results?.riskAnalysis
    const agentReport = results.results?.report
    const trustScore = results.results?.trustScore

    // FIX: Detect if AI was unavailable (no keys configured) — don't block submission
    const aiNotConfigured = !verification || (
      verification.inconsistencies.length === 1 &&
      verification.inconsistencies[0].reasoning === 'Unable to complete reality verification' &&
      verification.confidenceScore === 0
    )

    const findings: Inconsistency[] = verification?.inconsistencies || []
    const confidenceScore = verification?.confidenceScore || 0

    // Only hold if AI actually ran and found real issues (not just "no key configured")
    const mustHold = !aiNotConfigured && (
      !verification ||
      !verification.verified ||
      confidenceScore < 70 ||
      findings.some(f =>
        f.detectedStatus === 'NON_COMPLIANT' ||
        (f.detectedStatus === 'UNKNOWN' && f.confidence > 0) ||
        f.confidence < 0.7
      )
    )

    // Save AI results
    const aiAnalysisPayload = {
      verification: verification ? {
        verified: verification.verified,
        confidenceScore: verification.confidenceScore,
        explanation: verification.explanation,
      } : null,
      riskAnalysis: riskAnalysis ? {
        score: riskAnalysis.overallRiskLevel,
        level: riskAnalysis.overallRiskLevel,
        factors: riskAnalysis.highRiskAreas,
      } : null,
      trustScore: trustScore ? {
        score: trustScore.currentScore,
        riskLevel: trustScore.riskLevel,
      } : null,
      report: agentReport ? {
        summary: agentReport.summary,
        violations: agentReport.violations,
        recommendations: agentReport.recommendedActions,
      } : null,
    }

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
          data: {
            status: 'HOLD_FOR_REVIEW',
            completedDate: null,
            confidenceScore: confidenceScore,
            aiAnalysis: JSON.stringify(aiAnalysisPayload),
          },
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
        confidenceScore,
        findings,
        aiAnalysis: aiAnalysisPayload,
      })
    }

    // Also save report if generated
    if (agentReport) {
      await prisma.report.upsert({
        where: { inspectionId: inspection.id },
        update: {
          summary: agentReport.summary || 'AI-generated report',
          pdfUrl: null,
        },
        create: {
          inspectionId: inspection.id,
          summary: agentReport.summary || 'AI-generated report',
          pdfUrl: null,
        },
      })
    }

    const submitted = await prisma.inspection.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        completedDate: new Date(),
        confidenceScore: confidenceScore,
        aiAnalysis: JSON.stringify(aiAnalysisPayload),
        submissionOverrideReason: null,
        submissionOverriddenAt: null,
      },
    })
    await complianceMemory.recordInspectionOutcome({
      inspectionId: inspection.id,
      actorId: req.user!.id,
      action: 'SUBMITTED',
      verification,
      findings,
    })
    return res.json({
      success: true,
      status: 'SUBMITTED',
      overridden: false,
      inspection: submitted,
      aiAnalysis: aiAnalysisPayload,
    })
  } catch (error) {
    console.error('Submit inspection error:', error)
    return res.status(500).json({ error: 'Failed to submit inspection' })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const φ1 = lat1 * Math.PI / 180
  const φ2 = lat2 * Math.PI / 180
  const Δφ = (lat2 - lat1) * Math.PI / 180
  const Δλ = (lon2 - lon1) * Math.PI / 180

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function extractExifData(imagePath: string): any {
  try {
    const data = fs.readFileSync(imagePath)
    const exifData = piexif.load(data.toString('base64'))
    return exifData || {}
  } catch (error) {
    console.error('EXIF extraction error:', error)
    return {}
  }
}

function validateImageIntegrity(exifData: any, uploadTimestamp: Date): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  if (!exifData || Object.keys(exifData).length === 0) {
    issues.push('No EXIF data found - image may be edited or from screenshot')
  }

  if (exifData['0th'] && exifData['0th'][piexif.ImageIFD.Software]) {
    issues.push(`Image processed with software: ${exifData['0th'][piexif.ImageIFD.Software]}`)
  }

  if (exifData['Exif'] && exifData['Exif'][piexif.ExifIFD.DateTimeOriginal]) {
    const exifDateStr = exifData['Exif'][piexif.ExifIFD.DateTimeOriginal]
    const exifDate = new Date(exifDateStr)
    const timeDiff = Math.abs(uploadTimestamp.getTime() - exifDate.getTime())
    const maxTimeDiff = 24 * 60 * 60 * 1000

    if (timeDiff > maxTimeDiff) {
      issues.push(`EXIF timestamp differs significantly from upload time (${Math.round(timeDiff / (1000 * 60))} minutes)`)
    }
  }

  return { valid: issues.length === 0, issues }
}

export const uploadImage = async (req: AuthRequest, res: Response) => {
  try {
    const { inspectionId } = req.params
    const { description, metadata, checklistItemId } = req.body
    const imageUrl = req.file?.path
    const originalName = req.file?.originalname || 'image.jpg'
    const mimeType = req.file?.mimetype || 'image/jpeg'

    if (!imageUrl) {
      return res.status(400).json({ error: 'No image uploaded' })
    }

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { inspectorId: true },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only upload to their own inspections' })
    }

    const exifData = extractExifData(imageUrl)
    const integrityCheck = validateImageIntegrity(exifData, new Date())

    const combinedMetadata = {
      ...metadata ? JSON.parse(metadata) : {},
      exif: exifData,
      integrity: integrityCheck,
    }

    const imageId = crypto.randomUUID()
    const s3Key = generateS3Key(inspectionId, imageId, originalName)
    const fileBuffer = fs.readFileSync(imageUrl)
    
    let finalImageUrl: string
    if (process.env.AWS_S3_BUCKET) {
      finalImageUrl = await uploadToS3(s3Key, fileBuffer, mimeType)
      fs.unlinkSync(imageUrl)
    } else {
      finalImageUrl = imageUrl
    }

    const image = await prisma.inspectionImage.create({
      data: {
        inspectionId,
        imageUrl: finalImageUrl,
        description,
        metadata: JSON.stringify({ ...combinedMetadata, checklistItemId: checklistItemId || null }),
      },
    })

    res.status(201).json({ ...image, integrityCheck })
  } catch (error) {
    console.error('Upload image error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const updateChecklist = async (req: AuthRequest, res: Response) => {
  try {
    const { inspectionId } = req.params
    const { checklists } = req.body

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      select: { inspectorId: true },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only edit their own inspections' })
    }

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

export const updateImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imageId } = req.params
    const { description } = req.body

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      select: { inspectorId: true },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only update their own inspection images' })
    }

    const image = await prisma.inspectionImage.update({
      where: { id: imageId },
      data: { description },
    })

    res.json(image)
  } catch (error) {
    console.error('Update image error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

export const deleteImage = async (req: AuthRequest, res: Response) => {
  try {
    const { id, imageId } = req.params

    const inspection = await prisma.inspection.findUnique({
      where: { id },
      select: { inspectorId: true },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Inspectors can only delete their own inspection images' })
    }

    const image = await prisma.inspectionImage.findUnique({
      where: { id: imageId },
    })

    if (!image) {
      return res.status(404).json({ error: 'Image not found' })
    }

    if (image.imageUrl.startsWith('https://') && process.env.AWS_S3_BUCKET) {
      const s3Key = image.imageUrl.split('/').pop()
      if (s3Key) {
        try {
          await deleteFromS3(`inspections/${id}/${s3Key}`)
        } catch (error) {
          console.error('Failed to delete from S3:', error)
        }
      }
    } else {
      if (fs.existsSync(image.imageUrl)) {
        fs.unlinkSync(image.imageUrl)
      }
    }

    await prisma.inspectionImage.delete({
      where: { id: imageId },
    })

    res.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
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