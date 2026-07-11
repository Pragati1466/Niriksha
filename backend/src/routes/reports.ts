import express from 'express'
import { authenticateToken } from '../middleware/auth'
import prisma from '../utils/prisma'
import PDFDocument from 'pdfkit'

const router = express.Router()

router.use(authenticateToken)

router.get('/:inspectionId', async (req, res) => {
  try {
    const report = await prisma.report.findUnique({
      where: { inspectionId: req.params.inspectionId },
      include: { inspection: true },
    })
    res.json(report)
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:inspectionId', async (req, res) => {
  try {
    const inspection = await prisma.inspection.findUnique({
      where: { id: req.params.inspectionId },
      include: {
        site: true,
        inspector: true,
        template: true,
        checklists: true,
        violations: true,
      },
    })

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' })
    }

    const doc = new PDFDocument()
    const filename = `report-${inspection.id}.pdf`
    const filepath = `uploads/reports/${filename}`

    doc.pipe(require('fs').createWriteStream(filepath))

    doc.fontSize(20).text('NIRIKSHA Inspection Report', { align: 'center' })
    doc.moveDown()
    doc.fontSize(14).text(`Site: ${inspection.site.name}`)
    doc.text(`Address: ${inspection.site.address}`)
    doc.text(`Inspector: ${inspection.inspector.name}`)
    doc.text(`Date: ${inspection.scheduledDate.toLocaleDateString()}`)
    doc.text(`Status: ${inspection.status}`)
    doc.moveDown()

    doc.fontSize(16).text('Checklist Results')
    inspection.checklists.forEach((item) => {
      doc.fontSize(12).text(`${item.itemLabel}: ${item.status}`)
      if (item.notes) doc.text(`Notes: ${item.notes}`)
    })

    doc.moveDown()
    doc.fontSize(16).text('Violations')
    inspection.violations.forEach((violation) => {
      doc.fontSize(12).text(`${violation.severity}: ${violation.description}`)
    })

    doc.end()

    const report = await prisma.report.create({
      data: {
        inspectionId: inspection.id,
        pdfUrl: filepath,
        summary: `Inspection report for ${inspection.site.name}`,
      },
    })

    res.status(201).json(report)
  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
