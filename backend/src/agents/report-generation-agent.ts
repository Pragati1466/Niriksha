// Report Generation Agent
import { AgentState, ReportResult, ViolationSummary, ActionItem, LegalReference } from './types'
import PDFDocument from 'pdfkit'
import prisma from '../utils/prisma'

export class ReportGenerationAgent {
  private config = {
    name: 'report-generation',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 60000,
    memoryEnabled: true,
    tools: ['summary-generation', 'violation-compilation', 'action-recommendation', 'legal-reference', 'pdf-creation'],
  }

  // Tool: Generate Inspection Summary
  private generateInspectionSummary(inspection: any): string {
    const { site, inspector, template, status, confidenceScore, notes } = inspection

    let summary = `Inspection Report for ${site.name}\n`
    summary += `Address: ${site.address}\n`
    summary += `Inspector: ${inspector.name}\n`
    summary += `Date: ${new Date(inspection.scheduledDate).toLocaleDateString()}\n`
    summary += `Status: ${status}\n`
    summary += `Confidence Score: ${confidenceScore?.toFixed(1)}%\n\n`

    if (notes) {
      summary += `Inspector Notes:\n${notes}\n\n`
    }

    summary += `Checklist Items Completed: ${inspection.checklists?.length || 0}\n`
    summary += `Violations Found: ${inspection.violations?.length || 0}\n`

    return summary
  }

  // Tool: Compile Violations
  private compileViolations(violations: any[]): ViolationSummary[] {
    return violations.map(violation => ({
      id: violation.id,
      description: violation.description,
      severity: violation.severity,
      evidence: violation.imageEvidence ? [violation.imageEvidence] : [],
      status: 'OPEN',
    }))
  }

  // Tool: Generate Recommended Actions
  private generateRecommendedActions(violations: any[], inspection: any): ActionItem[] {
    const actions: ActionItem[] = []

    // Critical violations need immediate action
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL')
    criticalViolations.forEach(violation => {
      actions.push({
        priority: 'URGENT',
        description: `Immediate remediation required: ${violation.description}`,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        assignedTo: inspection.inspector.name,
      })
    })

    // High violations need action within 7 days
    const highViolations = violations.filter(v => v.severity === 'HIGH')
    highViolations.forEach(violation => {
      actions.push({
        priority: 'HIGH',
        description: `Remediation required: ${violation.description}`,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        assignedTo: inspection.inspector.name,
      })
    })

    // Medium violations need action within 30 days
    const mediumViolations = violations.filter(v => v.severity === 'MEDIUM')
    mediumViolations.forEach(violation => {
      actions.push({
        priority: 'MEDIUM',
        description: `Remediation recommended: ${violation.description}`,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
    })

    // Low violations for next inspection
    const lowViolations = violations.filter(v => v.severity === 'LOW')
    if (lowViolations.length > 0) {
      actions.push({
        priority: 'LOW',
        description: `Monitor ${lowViolations.length} low-priority items at next inspection`,
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
      })
    }

    // Follow-up inspection if violations found
    if (violations.length > 0) {
      actions.push({
        priority: 'HIGH',
        description: 'Schedule follow-up inspection to verify remediation',
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
      })
    }

    return actions
  }

  // Tool: Generate Legal References
  private generateLegalReferences(violations: any[], department: string): LegalReference[] {
    const references: LegalReference[] = []

    // Common safety regulations
    references.push({
      section: 'General Safety Standards',
      description: 'All facilities must maintain safety standards as per local regulations',
      relevance: 'Applies to all inspection findings',
    })

    // Critical violation references
    if (violations.some(v => v.severity === 'CRITICAL')) {
      references.push({
        section: 'Critical Safety Violations',
        description: 'Immediate action required for critical safety violations per regulatory guidelines',
        relevance: 'Critical violations found during inspection',
      })
    }

    // Department-specific references
    if (department === 'Health') {
      references.push({
        section: 'Health and Sanitation Regulations',
        description: 'Health facilities must comply with sanitation and hygiene standards',
        relevance: 'Health department inspection',
      })
    } else if (department === 'Safety') {
      references.push({
        section: 'Occupational Safety Regulations',
        description: 'Work必须place safety standards and equipment requirements',
        relevance: 'Safety department inspection',
      })
    } else if (department === 'Environment') {
      references.push({
        section: 'Environmental Protection Regulations',
        description: 'Environmental compliance and waste management requirements',
        relevance: 'Environment department inspection',
      })
    } else if (department === 'Building') {
      references.push({
        section: 'Building Code Compliance',
        description: 'Structural integrity and building code requirements',
        relevance: 'Building department inspection',
      })
    }

    return references
  }

  // Tool: Create PDF Report
  private async createPDFReport(inspection: any, reportData: ReportResult): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument()
        const filename = `report-${inspection.id}-${Date.now()}.pdf`
        const filepath = `uploads/reports/${filename}`

        const stream = require('fs').createWriteStream(filepath)
        doc.pipe(stream)

        // Header
        doc.fontSize(20).text('NIRIKSHA INSPECTION REPORT', { align: 'center' })
        doc.moveDown()
        doc.fontSize(12).text(`Report ID: ${inspection.id}`, { align: 'center' })
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' })
        doc.moveDown(2)

        // Inspection Details
        doc.fontSize(14).text('INSPECTION DETAILS', { underline: true })
        doc.moveDown()
        doc.fontSize(11).text(`Site: ${inspection.site.name}`)
        doc.text(`Address: ${inspection.site.address}`)
        doc.text(`Inspector: ${inspection.inspector.name}`)
        doc.text(`Date: ${new Date(inspection.scheduledDate).toLocaleDateString()}`)
        doc.text(`Status: ${inspection.status}`)
        doc.text(`Confidence Score: ${inspection.confidenceScore?.toFixed(1)}%`)
        doc.moveDown()

        // Summary
        doc.fontSize(14).text('SUMMARY', { underline: true })
        doc.moveDown()
        doc.fontSize(11).text(reportData.summary)
        doc.moveDown()

        // Violations
        if (reportData.violations.length > 0) {
          doc.fontSize(14).text('VIOLATIONS', { underline: true })
          doc.moveDown()
          reportData.violations.forEach((violation, index) => {
            doc.fontSize(11).text(`${index + 1}. ${violation.description}`)
            doc.fontSize(10).text(`   Severity: ${violation.severity}`)
            doc.text(`   Status: ${violation.status}`)
            doc.moveDown()
          })
        }

        // Recommended Actions
        if (reportData.recommendedActions.length > 0) {
          doc.fontSize(14).text('RECOMMENDED ACTIONS', { underline: true })
          doc.moveDown()
          reportData.recommendedActions.forEach((action, index) => {
            doc.fontSize(11).text(`${index + 1}. [${action.priority}] ${action.description}`)
            doc.fontSize(10).text(`   Deadline: ${action.deadline.toLocaleDateString()}`)
            if (action.assignedTo) {
              doc.text(`   Assigned to: ${action.assignedTo}`)
            }
            doc.moveDown()
          })
        }

        // Legal References
        if (reportData.legalReferences.length > 0) {
          doc.fontSize(14).text('LEGAL REFERENCES', { underline: true })
          doc.moveDown()
          reportData.legalReferences.forEach((ref, index) => {
            doc.fontSize(11).text(`${index + 1}. ${ref.section}`)
            doc.fontSize(10).text(`   ${ref.description}`)
            doc.text(`   Relevance: ${ref.relevance}`)
            doc.moveDown()
          })
        }

        // Footer
        doc.moveDown(2)
        doc.fontSize(8).text('This report is generated by NIRIKSHA AI-powered inspection system.', { align: 'center' })

        doc.end()

        stream.on('finish', () => {
          resolve(filepath)
        })

        stream.on('error', (error: any) => {
          reject(error)
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  // Node: Generate Report
  private async generateReport(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const { inspectionId } = state

      if (!inspectionId) {
        throw new Error('Inspection ID required for report generation')
      }

      // Fetch inspection data
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
          site: { include: { department: true } },
          inspector: true,
          template: true,
          checklists: true,
          violations: true,
        },
      })

      if (!inspection) {
        throw new Error('Inspection not found')
      }

      // Generate summary
      const summary = this.generateInspectionSummary(inspection)

      // Compile violations
      const violations = this.compileViolations(inspection.violations || [])

      // Generate recommended actions
      const recommendedActions = this.generateRecommendedActions(inspection.violations || [], inspection)

      // Generate legal references
      const legalReferences = this.generateLegalReferences(inspection.violations || [], inspection.site.department?.name || 'General')

      // Create PDF
      const reportData: ReportResult = {
        summary,
        violations,
        recommendedActions,
        legalReferences,
        generatedAt: new Date(),
      }

      const pdfUrl = await this.createPDFReport(inspection, reportData)
      reportData.pdfUrl = pdfUrl

      // Save report to database
      await prisma.report.create({
        data: {
          inspectionId,
          pdfUrl,
          summary,
        },
      })

      return {
        results: {
          ...state.results,
          report: reportData,
        },
        currentAgent: this.config.name,
      }
    } catch (error) {
      console.error('Report generation error:', error)
      throw error
    }
  }

  // Execute Agent
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = { ...state, currentAgent: this.config.name }
    const maxRetries = state.maxRetries || this.config.maxRetries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        currentState.retryCount = attempt
        const result = await this.generateReport(currentState)
        currentState = { ...currentState, ...result }

        if (!currentState.errors || currentState.errors.length === 0) {
          return currentState
        }
      } catch (error) {
        console.error(`Report generation attempt ${attempt + 1} failed:`, error)
        currentState.errors = [
          ...(currentState.errors || []),
          `Attempt ${attempt + 1}: ${error}`,
        ]
      }
    }

    return currentState
  }

  // Get Configuration
  getConfig() {
    return this.config
  }
}
