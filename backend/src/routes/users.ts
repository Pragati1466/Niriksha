import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)

router.get('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { department: true },
    })
    res.json(user)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
