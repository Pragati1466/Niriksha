import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { sites: true, users: true },
    })
    res.json(departments)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, description } = req.body
    const department = await prisma.department.create({
      data: { name, description },
    })
    res.status(201).json(department)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
