// Live AI Copilot Service
import { GoogleGenerativeAI } from '@google/generative-ai'
import prisma from '../utils/prisma'

export interface CopilotSuggestion {
  suggestion: string
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  reasoning: string
  estimatedTime: number
  confidence: number
}

export class LiveCopilotService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  // Get real-time inspection guidance
  async getNextInspectionStep(
    inspectionId: string,
    currentProgress: any
  ): Promise<CopilotSuggestion> {
    try {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
          template: true,
          checklists: true,
          violations: true,
          site: true,
        },
      })

      if (!inspection) {
        throw new Error('Inspection not found')
      }

      const completedItems = inspection.checklists.filter((c: any) => c.status !== 'NOT_APPLICABLE')
      const remainingItems = inspection.checklists.filter((c: any) => c.status === 'NOT_APPLICABLE')
      const criticalViolations = inspection.violations.filter((v: any) => v.severity === 'CRITICAL')

      const prompt = `
      You are an expert inspection guide. Based on the current inspection progress, suggest the next step.

      Inspection Details:
      - Site: ${inspection.site.name}
      - Template: ${inspection.template.name}
      - Completed items: ${completedItems.length}/${inspection.checklists.length}
      - Critical violations: ${criticalViolations.length}
      - Current progress: ${JSON.stringify(currentProgress)}

      Remaining checklist items: ${JSON.stringify(remainingItems.map((c: any) => c.itemLabel))}

      Return a JSON response with:
      {
        "suggestion": "Specific next step to take",
        "priority": "URGENT|HIGH|MEDIUM|LOW",
        "reasoning": "Why this is the best next step",
        "estimatedTime": 15,
        "confidence": 0.9
      }

      Prioritize:
      1. Critical violations
      2. Required checklist items
      3. High-risk areas
      4. Time-sensitive items
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          suggestion: 'Continue with next required checklist item',
          priority: 'MEDIUM',
          reasoning: 'Proceed with remaining checklist items',
          estimatedTime: 15,
          confidence: 0.7,
        }
      }
    } catch (error) {
      console.error('Live copilot error:', error)
      throw new Error('Failed to generate copilot suggestion')
    }
  }

  // Get real-time risk alerts
  async getRiskAlerts(inspectionId: string): Promise<CopilotSuggestion[]> {
    try {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
          site: {
            include: {
              inspections: {
                include: {
                  violations: true,
                },
              },
            },
          },
          checklists: true,
        },
      })

      if (!inspection) {
        throw new Error('Inspection not found')
      }

      const previousViolations = inspection.site.inspections.flatMap((i: any) => i.violations)
      const criticalViolations = previousViolations.filter((v: any) => v.severity === 'CRITICAL')
      const highViolations = previousViolations.filter((v: any) => v.severity === 'HIGH')

      const alerts: CopilotSuggestion[] = []

      if (criticalViolations.length > 0) {
        alerts.push({
          suggestion: `Pay special attention to areas with ${criticalViolations.length} previous critical violations`,
          priority: 'URGENT',
          reasoning: 'This site has a history of critical violations',
          estimatedTime: 30,
          confidence: 0.95,
        })
      }

      if (highViolations.length > 2) {
        alerts.push({
          suggestion: 'Focus on high-risk areas identified in previous inspections',
          priority: 'HIGH',
          reasoning: `Site has ${highViolations.length} high-severity violations in history`,
          estimatedTime: 20,
          confidence: 0.85,
        })
      }

      const pendingRequired = inspection.checklists.filter(
        (c: any) => c.status === 'NOT_APPLICABLE' && c.required
      )

      if (pendingRequired.length > 0) {
        alerts.push({
          suggestion: `Complete ${pendingRequired.length} remaining required checklist items`,
          priority: 'HIGH',
          reasoning: 'Required items must be completed for compliance',
          estimatedTime: pendingRequired.length * 10,
          confidence: 0.9,
        })
      }

      return alerts
    } catch (error) {
      console.error('Risk alerts error:', error)
      return []
    }
  }

  // Get contextual suggestions based on current location
  async getLocationBasedSuggestions(
    inspectorId: string,
    currentLocation: { lat: number; lng: number }
  ): Promise<CopilotSuggestion[]> {
    try {
      const nearbySites = await prisma.site.findMany({
        where: {
          latitude: { gte: currentLocation.lat - 0.01, lte: currentLocation.lat + 0.01 },
          longitude: { gte: currentLocation.lng - 0.01, lte: currentLocation.lng + 0.01 },
        },
        include: {
          inspections: {
            include: {
              violations: true,
            },
          },
        },
      })

      const suggestions: CopilotSuggestion[] = []

      for (const site of nearbySites) {
        const violations = site.inspections.flatMap((i: any) => i.violations)
        const criticalCount = violations.filter((v: any) => v.severity === 'CRITICAL').length

        if (criticalCount > 0) {
          suggestions.push({
            suggestion: `Consider scheduling inspection for ${site.name} nearby`,
            priority: 'MEDIUM',
            reasoning: `Site has ${criticalCount} critical violations requiring attention`,
            estimatedTime: 45,
            confidence: 0.8,
          })
        }
      }

      return suggestions
    } catch (error) {
      console.error('Location-based suggestions error:', error)
      return []
    }
  }

  // Get time optimization suggestions
  async getTimeOptimizationSuggestions(
    inspectorId: string,
    scheduledInspections: any[]
  ): Promise<CopilotSuggestion[]> {
    const suggestions: CopilotSuggestion[] = []

    // Check for overlapping time slots
    const timeSlots = scheduledInspections.map((i: any) => new Date(i.scheduledDate).getTime())
    const sortedSlots = timeSlots.sort((a, b) => a - b)

    for (let i = 0; i < sortedSlots.length - 1; i++) {
      const timeDiff = (sortedSlots[i + 1] - sortedSlots[i]) / (1000 * 60 * 60) // hours

      if (timeDiff < 1) {
        suggestions.push({
          suggestion: 'Consider rescheduling inspections - time slots are too close',
          priority: 'HIGH',
          reasoning: 'Insufficient time between inspections for thorough review',
          estimatedTime: 15,
          confidence: 0.9,
        })
      }
    }

    return suggestions
  }

  // Get compliance suggestions
  async getComplianceSuggestions(inspectionId: string): Promise<CopilotSuggestion[]> {
    try {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        include: {
          checklists: true,
          template: true,
        },
      })

      if (!inspection) {
        throw new Error('Inspection not found')
      }

      const suggestions: CopilotSuggestion[] = []

      const requiredItems = inspection.checklists.filter((c: any) => c.required)
      const completedRequired = requiredItems.filter((c: any) => c.status === 'COMPLIANT')

      const complianceRate = requiredItems.length > 0 ? completedRequired.length / requiredItems.length : 1

      if (complianceRate < 0.8) {
        suggestions.push({
          suggestion: `Compliance rate is ${(complianceRate * 100).toFixed(1)}% - focus on required items`,
          priority: 'HIGH',
          reasoning: 'Low compliance rate may lead to failed inspection',
          estimatedTime: 30,
          confidence: 0.95,
        })
      }

      return suggestions
    } catch (error) {
      console.error('Compliance suggestions error:', error)
      return []
    }
  }

  // Get all copilot suggestions for current inspection
  async getAllSuggestions(inspectionId: string): Promise<{
    nextStep: CopilotSuggestion
    riskAlerts: CopilotSuggestion[]
    complianceSuggestions: CopilotSuggestion[]
  }> {
    const [nextStep, riskAlerts, complianceSuggestions] = await Promise.all([
      this.getNextInspectionStep(inspectionId, {}),
      this.getRiskAlerts(inspectionId),
      this.getComplianceSuggestions(inspectionId),
    ])

    return {
      nextStep,
      riskAlerts,
      complianceSuggestions,
    }
  }
}

export const liveCopilot = new LiveCopilotService()
