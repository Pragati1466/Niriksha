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

router.get('/:id', async (req, res) => {
  try {
    const site = await prisma.site.findUnique({
      where: { id: req.params.id },
      include: { department: true },
    })
    if (!site) {
      return res.status(404).json({ error: 'Site not found' })
    }
    res.json(site)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, address, departmentId, latitude, longitude, pincode, businessType, category, contactDetails, registrationNumber, registrationDate, expiryDate, status, metadata } = req.body

    if (!name || !address) {
      return res.status(400).json({ error: 'Missing required fields: name or address' })
    }

    const site = await prisma.site.create({
      data: {
        name,
        address,
        departmentId: departmentId || null,
        latitude: latitude || null,
        longitude: longitude || null,
        pincode: pincode || null,
        businessType: businessType || null,
        category: category || null,
        contactDetails: contactDetails ? JSON.stringify(contactDetails) : null,
        registrationNumber: registrationNumber || null,
        registrationDate: registrationDate ? new Date(registrationDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        status: status || 'ACTIVE',
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: { department: true },
    })
    res.status(201).json(site)
  } catch (error) {
    console.error('Create site error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.put('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    const { name, address, departmentId, latitude, longitude, pincode, businessType, category, contactDetails, registrationNumber, registrationDate, expiryDate, status, metadata, isActive } = req.body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (departmentId !== undefined) updateData.departmentId = departmentId
    if (latitude !== undefined) updateData.latitude = latitude
    if (longitude !== undefined) updateData.longitude = longitude
    if (pincode !== undefined) updateData.pincode = pincode
    if (businessType !== undefined) updateData.businessType = businessType
    if (category !== undefined) updateData.category = category
    if (contactDetails !== undefined) updateData.contactDetails = JSON.stringify(contactDetails)
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber
    if (registrationDate !== undefined) updateData.registrationDate = new Date(registrationDate)
    if (expiryDate !== undefined) updateData.expiryDate = new Date(expiryDate)
    if (status !== undefined) updateData.status = status
    if (metadata !== undefined) updateData.metadata = JSON.stringify(metadata)
    if (isActive !== undefined) updateData.isActive = isActive

    const site = await prisma.site.update({
      where: { id: req.params.id },
      data: updateData,
      include: { department: true },
    })

    res.json(site)
  } catch (error) {
    console.error('Update site error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', requireRole(['ADMIN']), async (req, res) => {
  try {
    await prisma.site.delete({
      where: { id: req.params.id },
    })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete site error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
