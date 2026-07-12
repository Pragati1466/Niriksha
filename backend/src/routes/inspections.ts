import express from 'express'
import multer from 'multer'
import path from 'path'
import { authenticateToken, requireRole } from '../middleware/auth'
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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/')
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

export default router
