// Predictive Inspection ML Service
import prisma from '../utils/prisma'

export interface PredictionResult {
  establishmentId: string
  establishmentName: string
  failureProbability: number
  riskFactors: string[]
  predictedViolations: string[]
  recommendedAction: string
  confidence: number
}

export class PredictiveInspectionService {
  // Predict which establishments will likely fail next inspection
  async predictInspectionOutcomes(): Promise<PredictionResult[]> {
    try {
      const sites = await prisma.site.findMany({
        include: {
          inspections: {
            include: {
              violations: true,
              checklists: true,
            },
          },
        },
      })

      const predictions: PredictionResult[] = []

      for (const site of sites) {
        const prediction = await this.predictSiteOutcome(site)
        predictions.push(prediction)
      }

      // Sort by failure probability
      return predictions.sort((a, b) => b.failureProbability - a.failureProbability)
    } catch (error) {
      console.error('Predictive inspection error:', error)
      return []
    }
  }

  // Predict outcome for a specific site
  private async predictSiteOutcome(site: any): Promise<PredictionResult> {
    const inspections = site.inspections
    const violations = inspections.flatMap((i: any) => i.violations)
    const checklists = inspections.flatMap((i: any) => i.checklists)

    // Calculate risk factors
    const riskFactors: string[] = []
    let failureProbability = 0

    // Factor 1: Historical violation rate
    const violationRate = inspections.length > 0 ? violations.length / inspections.length : 0
    if (violationRate > 0.5) {
      riskFactors.push('High historical violation rate')
      failureProbability += 0.3
    } else if (violationRate > 0.3) {
      riskFactors.push('Moderate historical violation rate')
      failureProbability += 0.15
    }

    // Factor 2: Critical violations history
    const criticalViolations = violations.filter((v: any) => v.severity === 'CRITICAL')
    if (criticalViolations.length > 2) {
      riskFactors.push('History of critical violations')
      failureProbability += 0.25
    }

    // Factor 3: Time since last inspection
    if (inspections.length > 0) {
      const lastInspection = inspections[0]
      const daysSinceLastInspection = (Date.now() - new Date(lastInspection.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      
      if (daysSinceLastInspection > 90) {
        riskFactors.push('Long time since last inspection')
        failureProbability += 0.2
      } else if (daysSinceLastInspection > 60) {
        riskFactors.push('Moderate time since last inspection')
        failureProbability += 0.1
      }
    }

    // Factor 4: Compliance trend
    const recentInspections = inspections.slice(-5)
    const complianceScores = recentInspections.map((i: any) => {
      const compliantItems = i.checklists.filter((c: any) => c.status === 'COMPLIANT').length
      return i.checklists.length > 0 ? compliantItems / i.checklists.length : 1
    })

    if (complianceScores.length > 1) {
      const trend = complianceScores[complianceScores.length - 1] - complianceScores[0]
      if (trend < -0.2) {
        riskFactors.push('Declining compliance trend')
        failureProbability += 0.15
      }
    }

    // Factor 5: Repeat violations
    const violationTypes = violations.map((v: any) => v.description)
    const uniqueViolationTypes = new Set(violationTypes)
    const repeatRate = violationTypes.length / (uniqueViolationTypes.size || 1)

    if (repeatRate > 2) {
      riskFactors.push('High repeat violation rate')
      failureProbability += 0.1
    }

    // Cap probability at 1
    failureProbability = Math.min(1, failureProbability)

    // Predict likely violations
    const predictedViolations = this.predictLikelyViolations(violations)

    // Determine recommended action
    const recommendedAction = this.getRecommendedAction(failureProbability, riskFactors)

    // Calculate confidence based on data availability
    const confidence = inspections.length > 5 ? 0.85 : inspections.length > 2 ? 0.7 : 0.5

    return {
      establishmentId: site.id,
      establishmentName: site.name,
      failureProbability,
      riskFactors,
      predictedViolations,
      recommendedAction,
      confidence,
    }
  }

  // Predict likely violations based on history
  private predictLikelyViolations(violations: any[]): string[] {
    const violationCounts = violations.reduce((counts: any, v: any) => {
      const type = v.description.substring(0, 50)
      counts[type] = (counts[type] || 0) + 1
      return counts
    }, {})

    return Object.entries(violationCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((entry: any) => entry[0])
  }

  // Get recommended action based on risk level
  private getRecommendedAction(probability: number, factors: string[]): string {
    if (probability > 0.7) {
      return 'Schedule immediate inspection - high risk of failure'
    } else if (probability > 0.5) {
      return 'Schedule inspection within 7 days - moderate risk'
    } else if (probability > 0.3) {
      return 'Schedule inspection within 30 days - low risk'
    } else {
      return 'Routine inspection schedule acceptable'
    }
  }

  // Get high-risk establishments requiring immediate attention
  async getHighRiskEstablishments(): Promise<PredictionResult[]> {
    const predictions = await this.predictInspectionOutcomes()
    return predictions.filter(p => p.failureProbability > 0.6)
  }

  // Get risk trends over time
  async getRiskTrends(days: number = 30): Promise<{
    date: string
    averageRisk: number
    highRiskCount: number
  }[]> {
    const trends: { date: string; averageRisk: number; highRiskCount: number }[] = []

    for (let i = days; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      // Get inspections around this date
      const inspections = await prisma.inspection.findMany({
        where: {
          scheduledDate: {
            gte: new Date(date.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(date.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          violations: true,
        },
      })

      const totalViolations = inspections.reduce((acc, i) => acc + i.violations.length, 0)
      const averageRisk = inspections.length > 0 ? totalViolations / inspections.length : 0
      const highRiskCount = inspections.filter(i => i.violations.length > 5).length

      trends.push({
        date: dateStr,
        averageRisk,
        highRiskCount,
      })
    }

    return trends
  }

  // Predict seasonal patterns
  async predictSeasonalPatterns(): Promise<{
    season: string
    expectedViolationRate: number
    recommendations: string[]
  }[]> {
    const seasons = [
      { name: 'Winter', months: [12, 1, 2] },
      { name: 'Spring', months: [3, 4, 5] },
      { name: 'Summer', months: [6, 7, 8] },
      { name: 'Fall', months: [9, 10, 11] },
    ]

    const patterns = []

    for (const season of seasons) {
      const inspections = await prisma.inspection.findMany({
        where: {
          scheduledDate: {
            gte: new Date(2025, season.months[0] - 1, 1),
            lte: new Date(2025, season.months[2], 31),
          },
        },
        include: {
          violations: true,
        },
      })

      const violationRate = inspections.length > 0
        ? inspections.reduce((acc, i) => acc + i.violations.length, 0) / inspections.length
        : 0

      const recommendations = this.getSeasonalRecommendations(season.name, violationRate)

      patterns.push({
        season: season.name,
        expectedViolationRate: violationRate,
        recommendations,
      })
    }

    return patterns
  }

  private getSeasonalRecommendations(season: string, rate: number): string[] {
    const recommendations: string[] = []

    if (season === 'Winter') {
      recommendations.push('Focus on heating system inspections')
      recommendations.push('Check for weather-related maintenance issues')
    } else if (season === 'Summer') {
      recommendations.push('Prioritize cooling system inspections')
      recommendations.push('Monitor food storage temperatures')
    } else if (season === 'Spring') {
      recommendations.push('Check for post-winter damage')
      recommendations.push('Review pest control measures')
    } else if (season === 'Fall') {
      recommendations.push('Prepare for winter maintenance')
      recommendations.push('Review heating system readiness')
    }

    if (rate > 0.5) {
      recommendations.push('Increase inspection frequency for this season')
    }

    return recommendations
  }

  // Get predictive insights for dashboard
  async getPredictiveInsights(): Promise<{
    highRiskSites: number
    averageFailureProbability: number
    topRiskFactors: string[]
    seasonalTrends: any[]
  }> {
    const predictions = await this.predictInspectionOutcomes()
    const highRiskSites = predictions.filter(p => p.failureProbability > 0.6).length
    const averageFailureProbability = predictions.reduce((acc, p) => acc + p.failureProbability, 0) / predictions.length

    // Get top risk factors
    const allFactors = predictions.flatMap(p => p.riskFactors)
    const factorCounts = allFactors.reduce((counts: any, factor) => {
      counts[factor] = (counts[factor] || 0) + 1
      return counts
    }, {})

    const topRiskFactors = Object.entries(factorCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map((entry: any) => entry[0])

    const seasonalTrends = await this.predictSeasonalPatterns()

    return {
      highRiskSites,
      averageFailureProbability,
      topRiskFactors,
      seasonalTrends,
    }
  }
}

export const predictiveInspection = new PredictiveInspectionService()
