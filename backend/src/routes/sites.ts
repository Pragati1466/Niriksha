import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)

router.get('/', async (req, res) => {
  try {
    const sites = await prisma.site.findMany({
      include: { department: true },
    })
    res.json(sites)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, address, departmentId, latitude, longitude } = req.body
    const site = await prisma.site.create({
      data: { name, address, departmentId, latitude, longitude },
      include: { department: true },
    })
    res.status(201).json(site)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
