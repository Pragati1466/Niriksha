// import express from 'express'
// import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
// import prisma from '../utils/prisma'

// const router = express.Router()

// router.use(authenticateToken)
// router.use(requireRole(['ADMIN']))

// // GET all users with status
// router.get('/', async (req: AuthRequest, res) => {
//   try {
//     const { status } = req.query
//     const where = status ? { status: status as string } : {}
    
//     const users = await prisma.user.findMany({
//       where,
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//         createdAt: true,
//         departmentId: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     })
    
//     res.json({ users, total: users.length })
//   } catch (error) {
//     console.error('Get users error:', error)
//     res.status(500).json({ error: 'Failed to fetch users' })
//   }
// })

// // GET pending users for approval
// router.get('/pending', async (req: AuthRequest, res) => {
//   try {
//     const pendingUsers = await prisma.user.findMany({
//       where: { status: 'PENDING' },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         createdAt: true,
//       },
//       orderBy: { createdAt: 'desc' },
//     })
//     res.json({ users: pendingUsers, total: pendingUsers.length })
//   } catch (error) {
//     console.error('Get pending users error:', error)
//     res.status(500).json({ error: 'Failed to fetch pending users' })
//   }
// })

// // PUT approve or reject a user
// router.put('/:userId/status', async (req: AuthRequest, res) => {
//   try {
//     const { userId } = req.params
//     const { status } = req.body // 'APPROVED' or 'REJECTED'
    
//     if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
//       return res.status(400).json({ error: 'Status must be APPROVED, REJECTED, or PENDING' })
//     }
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     })
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' })
//     }
    
//     const updated = await prisma.user.update({
//       where: { id: userId },
//       data: { status },
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         role: true,
//         status: true,
//       },
//     })
    
//     res.json({
//       message: `User ${status === 'APPROVED' ? 'approved' : status === 'REJECTED' ? 'rejected' : 'updated'} successfully`,
//       user: updated,
//     })
//   } catch (error) {
//     console.error('Update user status error:', error)
//     res.status(500).json({ error: 'Failed to update user status' })
//   }
// })

// // DELETE a user
// router.delete('/:userId', async (req: AuthRequest, res) => {
//   try {
//     const { userId } = req.params
    
//     const user = await prisma.user.findUnique({
//       where: { id: userId },
//     })
    
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' })
//     }
    
//     await prisma.user.delete({
//       where: { id: userId },
//     })
    
//     res.json({ message: 'User deleted successfully' })
//   } catch (error) {
//     console.error('Delete user error:', error)
//     res.status(500).json({ error: 'Failed to delete user' })
//   }
// })

// export default router
import express from 'express'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth'
import prisma from '../utils/prisma'

const router = express.Router()

router.use(authenticateToken)
router.use(requireRole(['ADMIN']))

// GET all users
router.get('/', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        departmentId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})


// GET inspector users
router.get('/pending', async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: 'INSPECTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({
      users,
      total: users.length,
    })
  } catch (error) {
    console.error('Get inspector users error:', error)
    res.status(500).json({ error: 'Failed to fetch inspector users' })
  }
})


// DELETE a user
router.delete('/:userId', async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      })
    }

    await prisma.user.delete({
      where: { id: userId },
    })

    res.json({
      message: 'User deleted successfully',
    })

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      error: 'Failed to delete user',
    })
  }
})


export default router