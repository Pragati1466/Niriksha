import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const templates = await prisma.inspectionTemplate.findMany({
      include: { department: true },
    })
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description, departmentId, checklistItems } = req.body
    const template = await prisma.inspectionTemplate.create({
      data: { name, description, departmentId, checklistItems },
      include: { department: true },
    })
    res.status(201).json(template)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
