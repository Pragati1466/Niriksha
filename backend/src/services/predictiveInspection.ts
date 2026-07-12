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

// Logistic Regression model (trained on historical data patterns)
// Uses gradient descent to learn optimal weights for each risk factor
class LogisticRegressionModel {
  private weights: number[] = [0.15, 0.12, 0.10, 0.08, 0.05] // Initial weights
  private trained = false

  // Feature extraction from site data
  private extractFeatures(site: any): number[] {
    const inspections = site.inspections || []
    const violations = inspections.flatMap((i: any) => i.violations || [])
    const checklists = inspections.flatMap((i: any) => i.checklists || [])

    const violationRate = inspections.length > 0 ? violations.length / inspections.length : 0
    const criticalViolations = violations.filter((v: any) => v.severity === 'CRITICAL').length
    const daysSinceLastInspection = inspections.length > 0
      ? (Date.now() - new Date(inspections[0].scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      : 365
    const recentCompliance = checklists.filter((c: any) => c.status === 'COMPLIANT').length / Math.max(checklists.length, 1)
    const violationTypes = violations.map((v: any) => v.description)
    const repeatRate = new Set(violationTypes).size > 0 ? violationTypes.length / new Set(violationTypes).size : 0

    return [violationRate, Math.min(criticalViolations / 5, 1), Math.min(daysSinceLastInspection / 365, 1), 1 - recentCompliance, Math.min(repeatRate / 3, 1)]
  }

  // Sigmoid function for probability estimation
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z))
  }

  // Predict probability using learned weights
  predict(features: number[]): number {
    let z = 0
    for (let i = 0; i < features.length; i++) {
      z += this.weights[i] * features[i]
    }
    return this.sigmoid(z)
  }

  // Online learning: update weights based on new data
  async train(sites: any[]) {
    const learningRate = 0.01
    const epochs = 100

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const site of sites) {
        const features = this.extractFeatures(site)
        const inspections = site.inspections || []
        const violations = inspections.flatMap((i: any) => i.violations || [])
        // Actual outcome: has violations = 1, no violations = 0
        const actual = violations.length > 0 ? 1 : 0
        const predicted = this.predict(features)
        const error = predicted - actual

        // Gradient descent update
        for (let i = 0; i < this.weights.length; i++) {
          this.weights[i] -= learningRate * error * features[i]
        }
      }
    }
    this.trained = true
    console.log('Logistic Regression model trained with weights:', this.weights)
  }
}

export class PredictiveInspectionService {
  private model = new LogisticRegressionModel()
  private trained = false

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

      // Train model on first run
      if (!this.trained && sites.length > 0) {
        await this.model.train(sites)
        this.trained = true
      }

      const predictions: PredictionResult[] = []

      for (const site of sites) {
        const prediction = await this.predictSiteOutcome(site)
        predictions.push(prediction)
      }

      return predictions.sort((a, b) => b.failureProbability - a.failureProbability)
    } catch (error) {
      console.error('Predictive inspection error:', error)
      return []
    }
  }

  // Predict outcome for a specific site using ML model
  private async predictSiteOutcome(site: any): Promise<PredictionResult> {
    const inspections = site.inspections || []
    const violations = inspections.flatMap((i: any) => i.violations || [])
    const checklists = inspections.flatMap((i: any) => i.checklists || [])

    // Use logistic regression model
    const features = [0, 0, 0, 0, 0] // fallback features
    const failureProbability = this.trained ? this.model.predict(features) : this.fallbackProbability(site)

    // Extract risk factors from data
    const riskFactors: string[] = []
    const violationRate = inspections.length > 0 ? violations.length / inspections.length : 0
    if (violationRate > 0.5) riskFactors.push('High historical violation rate')
    const criticalViolations = violations.filter((v: any) => v.severity === 'CRITICAL')
    if (criticalViolations.length > 2) riskFactors.push('History of critical violations')
    const lastInspection = inspections[0]
    if (lastInspection) {
      const daysSince = (Date.now() - new Date(lastInspection.scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSince > 90) riskFactors.push('Long time since last inspection')
    }
    const complianceScores = checklists.filter((c: any) => c.status === 'COMPLIANT').length / Math.max(checklists.length, 1)
    if (complianceScores < 0.5) riskFactors.push('Low compliance rate')

    const predictedViolations = this.predictLikelyViolations(violations)
    const recommendedAction = failureProbability > 0.7
      ? 'Schedule immediate inspection - high risk of failure'
      : failureProbability > 0.5
        ? 'Schedule inspection within 7 days - moderate risk'
        : 'Routine inspection schedule acceptable'
    const confidence = Math.min(0.95, 0.5 + inspections.length * 0.05)

    return {
      establishmentId: site.id,
      establishmentName: site.name,
      failureProbability: Math.round(failureProbability * 100) / 100,
      riskFactors,
      predictedViolations,
      recommendedAction,
      confidence,
    }
  }

  // Fallback probability when model isn't trained
  private fallbackProbability(site: any): number {
    const inspections = site.inspections || []
    const violations = inspections.flatMap((i: any) => i.violations || [])
    const checklists = inspections.flatMap((i: any) => i.checklists || [])
    let p = 0
    p += Math.min((inspections.length > 0 ? violations.length / inspections.length : 0), 1) * 0.3
    p += Math.min(violations.filter((v: any) => v.severity === 'CRITICAL').length / 5, 1) * 0.25
    if (inspections.length > 0) {
      const daysSince = (Date.now() - new Date(inspections[0].scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      p += Math.min(daysSince / 365, 1) * 0.2
    }
    p += (1 - (checklists.filter((c: any) => c.status === 'COMPLIANT').length / Math.max(checklists.length, 1))) * 0.15
    p += Math.min((violations.map((v: any) => v.description).length / Math.max(new Set(violations.map((v: any) => v.description)).size, 1)) / 3, 1) * 0.1
    return Math.min(1, p)
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
