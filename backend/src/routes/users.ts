import express from 'express'
import { authenticateToken, requireRole } from '../middleware/auth'
import prisma from '../utils/prisma'
import bcrypt from 'bcryptjs'

const router = express.Router()

router.use(authenticateToken)

router.get('/', requireRole(['ADMIN', 'SUPERVISOR']), async (req, res) => {
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

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, email, password, role, departmentId, phone, employeeId, jurisdiction } = req.body

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password, or role' })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        departmentId: departmentId || null,
        phone: phone || null,
        employeeId: employeeId || null,
        jurisdiction: jurisdiction ? JSON.stringify(jurisdiction) : null,
      },
      include: { department: true },
    })

    res.status(201).json(user)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, email, role, departmentId, phone, employeeId, jurisdiction, isActive } = req.body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = departmentId
    if (phone !== undefined) updateData.phone = phone
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (jurisdiction !== undefined) updateData.jurisdiction = JSON.stringify(jurisdiction)
    if (isActive !== undefined) updateData.isActive = isActive

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData,
      include: { department: true },
    })

    res.json(user)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id },
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
