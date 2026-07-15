import express from 'express'
import multer from 'multer'
import path from 'path'

import fs from 'fs'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'

import {
  getInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  submitInspection,
  uploadImage,
  updateImage,
  deleteImage,
  updateChecklist,
  createViolation,
} from '../controllers/inspectionController'
import prisma from '../utils/prisma'

const router = express.Router()


// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../../uploads')
const imagesDir = path.join(uploadsDir, 'images')
const reportsDir = path.join(uploadsDir, 'reports')
for (const dir of [uploadsDir, imagesDir, reportsDir]) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir)

  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (extname && mimetype) {
      return cb(null, true)
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed'))
    }
  },
})

router.use(authenticateToken)


// ===== Standard API Routes =====

router.get('/', getInspections)
router.get('/:id', getInspectionById)
router.post('/', requireRole(['ADMIN', 'SUPERVISOR']), createInspection)
router.put('/:id', updateInspection)
router.post('/:id/submit', submitInspection)
router.post('/:id/images', upload.single('image'), uploadImage)
router.put('/:id/images/:imageId', updateImage)
router.delete('/:id/images/:imageId', deleteImage)
router.put('/:id/checklist', updateChecklist)
router.post('/:id/violations', createViolation)


// ===== FIX #2: Inspector report download endpoint =====
router.get('/:id/report', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const inspection = await prisma.inspection.findFirst({
      where: { id },
      include: {
        site: true,
        inspector: true,
        checklists: true,
        violations: true,
        reportVersions: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (!inspection) return res.status(404).json({ error: 'Inspection not found' })

    if (req.user?.role === 'INSPECTOR' && inspection.inspectorId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Generate PDF using PDFKit
    const PDFDocument = require('pdfkit')
    const doc = new PDFDocument({ margin: 50 })
    const filename = `report-${inspection.id}.pdf`
    const filepath = path.join(reportsDir, filename)

    const stream = fs.createWriteStream(filepath)
    doc.pipe(stream)

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('NIRIKSHA Inspection Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toISOString()}`, { align: 'center' })
    doc.moveDown(2)

    // Inspection Info
    doc.fontSize(14).font('Helvetica-Bold').text('Inspection Details')
    doc.moveDown(0.5)
    doc.fontSize(12).font('Helvetica').text(`Site: ${inspection.site.name}`)
    doc.text(`Inspector: ${inspection.inspector.name}`)
    doc.text(`Status: ${inspection.status}`)
    doc.text(`Completed: ${inspection.completedDate?.toISOString() || 'Not completed'}`)
    doc.text(`Confidence: ${inspection.confidenceScore ? inspection.confidenceScore.toFixed(1) + '%' : 'N/A'}`)
    doc.moveDown()

    // Report Content
    const reportVersions = (inspection as any).reportVersions as any[] | undefined
    if (reportVersions?.[0]?.content || inspection.aiAnalysis) {
      doc.fontSize(14).font('Helvetica-Bold').text('Report Summary')
      doc.moveDown(0.5)
      doc.fontSize(12).font('Helvetica').text(reportVersions?.[0]?.content || inspection.aiAnalysis || '')
      doc.moveDown()
    }

    // Checklist
    doc.fontSize(14).font('Helvetica-Bold').text('Checklist')
    doc.moveDown(0.5)
    doc.fontSize(11).font('Helvetica')
    inspection.checklists.forEach(item => {
      doc.text(`${item.itemLabel}: ${item.status}`)
    })
    doc.moveDown()

    // Violations
    if (inspection.violations.length > 0) {
      doc.fontSize(14).font('Helvetica-Bold').text('Violations')
      doc.moveDown(0.5)
      doc.fontSize(11).font('Helvetica')
      inspection.violations.forEach(item => {
        doc.text(`${item.severity}: ${item.description}`)
      })
    }

    doc.end()

    stream.on('finish', () => {
      res.download(filepath, filename, (err) => {
        if (err) console.error('Download error:', err)
        // Clean up after download
        fs.unlink(filepath, () => {})
      })
    })
  } catch (error) {
    console.error('Report generation error:', error)
    res.status(500).json({ error: 'Failed to generate report' })
  }
})


// Get all violations with optional filters (for SLA dashboard)
router.get('/violations/all', async (req, res) => {
  try {
    const { severity, status, limit = 50, offset = 0 } = req.query

    const where: any = {}
    if (severity) where.severity = severity
    if (status) where.status = status

    const [violations, total] = await Promise.all([
      prisma.violation.findMany({
        where,
        include: {
          inspection: {
            include: {
              site: { select: { id: true, name: true } },
              inspector: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.violation.count({ where }),
    ])

    res.json({ violations, total })
  } catch (error) {
    console.error('Get violations error:', error)
    res.status(500).json({ error: 'Failed to fetch violations' })
  }
})




// ===== FIX #5: Team-brief API aliases =====
// POST /inspection/create → POST /api/inspections/
router.post('/create', requireRole(['ADMIN', 'SUPERVISOR']), createInspection)

// POST /inspection/upload → POST /api/inspections/:id/images
router.post('/upload', upload.single('image'), async (req, res) => {
  // Accept inspectionId from body instead of params for the alias
  req.params.inspectionId = req.body.inspectionId
  return uploadImage(req, res)
})

// POST /inspection/submit → POST /api/inspections/:id/submit
router.post('/submit', async (req: AuthRequest, res) => {
  req.params.id = req.body.inspectionId
  return submitInspection(req, res)
})

// GET /inspection/history → GET /api/inspections/
router.get('/history', getInspections)

// GET /inspection/:id → GET /api/inspections/:id
router.get('/history/:id', getInspectionById)

export default router

