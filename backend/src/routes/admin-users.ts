import express from 'express'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)
router.use(requireRole(['ADMIN']))

// GET pending users for approval
router.get('/pending', async (req: AuthRequest, res) => {
  try {
    const pendingUsers = await prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ users: pendingUsers, total: pendingUsers.length })
  } catch (error) {
    console.error('Get pending users error:', error)
    res.status(500).json({ error: 'Failed to fetch pending users' })
  }
})

// PUT approve or reject a user
router.put('/:userId/status', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params
    const { status } = req.body // 'APPROVED' or 'REJECTED'

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED or REJECTED' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.status !== 'PENDING') {
      return res.status(400).json({ error: 'User is not in PENDING status' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    })

    res.json({
      message: `User ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
      user: updated,
    })
  } catch (error) {
    console.error('Update user status error:', error)
    res.status(500).json({ error: 'Failed to update user status' })
  }
})

export default router