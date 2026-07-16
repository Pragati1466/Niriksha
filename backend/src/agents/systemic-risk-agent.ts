// Systemic Risk Discovery Agent
import { AgentState, RiskAnalysisResult, RiskArea, RepeatOffender, ViolationPattern } from './types'
import { complianceMemory } from '../services/complianceMemory'
import prisma from '../utils/prisma'

export class SystemicRiskDiscoveryAgent {
  private config = {
    name: 'systemic-risk-discovery',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 60000,
    memoryEnabled: true,
    tools: ['pattern-analysis', 'geographic-risk', 'offender-tracking', 'trend-analysis'],
  }

  // Tool: Analyze Risk Patterns
  private async analyzeRiskPatterns(): Promise<ViolationPattern[]> {
    try {
      // Fetch violation data from database
      const violations = await prisma.violation.findMany({
        include: {
          inspection: {
            include: {
              site: true,
            },
          },
        },
      })

      // Group violations by type
      const violationGroups = this.groupViolations(violations)

      // Analyze patterns
      const patterns: ViolationPattern[] = Object.entries(violationGroups).map(([type, items]) => {
        const frequency = items.length
        const trend = this.calculateViolationTrend(items)
       const commonLocations = this.extractCommonLocations(items)
        const severity = this.determineCommonSeverity(items)

        return {
          violationType: type,
          frequency,
          trend,
          commonLocations,
          severity,
        }
      })

      return patterns.sort((a, b) => b.frequency - a.frequency)
    } catch (error) {
      console.error('Risk pattern analysis error:', error)
      throw new Error(`Failed to analyze risk patterns: ${error}`)
    }
  }

  private groupViolations(violations: any[]): Record<string, any[]> {
    return violations.reduce((groups, violation) => {
      const type = (violation.description || 'Unknown').substring(0, 50) // Use first 50 chars as type
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(violation)
      return groups
    }, {} as Record<string, any[]>)
  }

  private calculateViolationTrend(violations: any[]): 'INCREASING' | 'DECREASING' | 'STABLE' {
    if (violations.length < 3) return 'STABLE'

    const sorted = violations.sort((a, b) => 
      new Date((a.inspection as any)?.scheduledDate || 0).getTime() - 
      new Date((b.inspection as any)?.scheduledDate || 0).getTime()
    )

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2))
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2))

    const firstRate = firstHalf.length / firstHalf.length
    const secondRate = secondHalf.length / secondHalf.length

    if (secondRate > firstRate * 1.2) return 'INCREASING'
    if (secondRate < firstRate * 0.8) return 'DECREASING'
    return 'STABLE'
  }

  private extractCommonLocations(violations: any[]): string[] {
    const locationCounts = violations.reduce((counts, v) => {
      const location = (v.inspection as any)?.site?.name || 'Unknown'
      counts[location] = (counts[location] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    return (Object.entries(locationCounts) as [string, number][])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([location]) => location)
  }

  private determineCommonSeverity(violations: any[]): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const severityCounts = violations.reduce((counts, v) => {
      const severity = v.severity as string
      counts[severity] = (counts[severity] || 0) + 1
      return counts
    }, {} as Record<string, number>)

    const maxSeverity = (Object.entries(severityCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0]?.[0] as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    return maxSeverity || 'MEDIUM'
  }

  // Tool: Identify High Risk Areas
  private async identifyHighRiskAreas(): Promise<RiskArea[]> {
    try {
      const sites = await prisma.site.findMany({
        include: {
          inspections: {
            include: {
              violations: true,
            },
          },
        },
      })

      const riskAreas: RiskArea[] = sites.map(site => {
        const violations = site.inspections.flatMap(i => i.violations)
        const riskScore = this.calculateAreaRiskScore(site, violations)
        const riskFactors = this.identifyRiskFactors(site, violations)

        return {
          areaId: site.id,
          areaName: site.name,
          riskScore,
          riskFactors,
          lastInspectionDate: site.inspections.length > 0 
            ? new Date(site.inspections[0].scheduledDate) 
            : new Date(),
          violationCount: violations.length,
        }
      })

      return riskAreas.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)
    } catch (error) {
      console.error('High risk area identification error:', error)
      throw new Error(`Failed to identify high risk areas: ${error}`)
    }
  }

  private calculateAreaRiskScore(site: any, violations: any[]): number {
    const violationWeight = 0.5
    const inspectionFrequencyWeight = 0.3
    const timeSinceLastInspectionWeight = 0.2

    // Violation score
    const violationScore = Math.min(100, violations.length * 10)

    // Inspection frequency score (lower frequency = higher risk)
    const daysSinceLastInspection = site.inspections.length > 0
      ? (Date.now() - new Date(site.inspections[0].scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      : 365
    const inspectionScore = Math.min(100, daysSinceLastInspection / 3)

    // Time since last inspection score
    const timeScore = Math.min(100, daysSinceLastInspection / 7)

    return (
      violationScore * violationWeight +
      inspectionScore * inspectionFrequencyWeight +
      timeScore * timeSinceLastInspectionWeight
    )
  }

  private identifyRiskFactors(site: any, violations: any[]): string[] {
    const factors: string[] = []

    if (violations.length > 5) factors.push('High violation frequency')
    if (violations.filter(v => v.severity === 'CRITICAL').length > 0) {
      factors.push('Critical violations present')
    }
    if (violations.filter(v => v.severity === 'HIGH').length > 2) {
      factors.push('Multiple high-severity violations')
    }

    const daysSinceLastInspection = site.inspections.length > 0
      ? (Date.now() - new Date(site.inspections[0].scheduledDate).getTime()) / (1000 * 60 * 60 * 24)
      : 365

    if (daysSinceLastInspection > 90) factors.push('Infrequent inspections')
    if (daysSinceLastInspection > 180) factors.push('No recent inspections')

    return factors
  }

  // Tool: Track Repeat Offenders
  private async trackRepeatOffenders(): Promise<RepeatOffender[]> {
    try {
      const inspectors = await prisma.user.findMany({
        where: { role: 'INSPECTOR' },
      })

      const repeatOffenders: RepeatOffender[] = []

      for (const inspector of inspectors) {
        const inspections = await prisma.inspection.findMany({
          where: { inspectorId: inspector.id },
          include: {
            violations: true,
            reviews: true,
          },
        })

        const violations = inspections.flatMap(i => i.violations)
        const overriddenReviews = inspections.flatMap(i => i.reviews).filter((r: any) => !r.approved)

        const violationCount = violations.length
        const lastViolationDate = violations.length > 0
          ? new Date(inspections[inspections.length - 1].scheduledDate)
          : new Date()

        const patterns = this.identifyOffenderPatterns(inspector, violations, overriddenReviews)
        const riskScore = this.calculateOffenderRiskScore(inspector, violations, overriddenReviews, inspections)

        repeatOffenders.push({
          inspectorId: inspector.id,
          inspectorName: inspector.name,
          violationCount,
          lastViolationDate,
          pattern: patterns,
          riskScore,
        })
      }

      return repeatOffenders
        .filter(o => o.violationCount > 3 || o.riskScore > 50)
        .sort((a, b) => b.riskScore - a.riskScore)
    } catch (error) {
      console.error('Repeat offender tracking error:', error)
      throw new Error(`Failed to track repeat offenders: ${error}`)
    }
  }

  private identifyOffenderPatterns(inspector: any, violations: any[], overriddenReviews: any[]): string[] {
    const patterns: string[] = []

    if (violations.length > 10) patterns.push('High violation rate')
    if (overriddenReviews.length > 3) patterns.push('Frequent supervisor overrides')

    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL')
    if (criticalViolations.length > 2) patterns.push('Repeated critical violations')

    return patterns
  }

  private calculateOffenderRiskScore(inspector: any, violations: any[], overriddenReviews: any[], inspections: any[]): number {
    const violationWeight = 0.4
    const overrideWeight = 0.3
    const criticalWeight = 0.2
    const consistencyWeight = 0.1

    const violationScore = Math.min(100, violations.length * 5)
    const overrideScore = Math.min(100, overriddenReviews.length * 15)
    const criticalScore = Math.min(100, violations.filter(v => v.severity === 'CRITICAL').length * 20)

    // Consistency score (lower variance = lower risk)
    const inspectionScores = inspections.map((i: any) => i.confidenceScore || 0)
    const variance = inspectionScores.length > 1
      ? inspectionScores.reduce((acc: number, score: number) => acc + Math.pow(score - 50, 2), 0) / inspectionScores.length
      : 0
    const consistencyScore = Math.min(100, variance / 2)

    return (
      violationScore * violationWeight +
      overrideScore * overrideWeight +
      criticalScore * criticalWeight +
      consistencyScore * consistencyWeight
    )
  }

  // Tool: Generate Risk Dashboard
  private async generateRiskDashboard(): Promise<RiskAnalysisResult> {
    const [patterns, highRiskAreas, repeatOffenders] = await Promise.all([
      this.analyzeRiskPatterns(),
      this.identifyHighRiskAreas(),
      this.trackRepeatOffenders(),
    ])

    // Calculate overall risk level
    const overallRiskLevel = this.calculateOverallRiskLevel(highRiskAreas, repeatOffenders)

    // Generate recommendations
    const recommendations = this.generateRecommendations(patterns, highRiskAreas, repeatOffenders)

    // Determine risk trend
    const riskTrend = this.calculateRiskTrend(patterns)

    const result: RiskAnalysisResult = {
      overallRiskLevel,
      highRiskAreas,
      repeatOffenders,
      commonViolations: patterns,
      recommendations,
      riskTrend,
    }

    // Store in memory
    await Promise.all(highRiskAreas.map(area => complianceMemory.recordRiskEvent(area.areaId, result)))

    return result
  }

  private calculateOverallRiskLevel(
    highRiskAreas: RiskArea[],
    repeatOffenders: RepeatOffender[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const avgAreaRisk = highRiskAreas.length > 0
      ? highRiskAreas.reduce((acc, area) => acc + area.riskScore, 0) / highRiskAreas.length
      : 0

    const avgOffenderRisk = repeatOffenders.length > 0
      ? repeatOffenders.reduce((acc, offender) => acc + offender.riskScore, 0) / repeatOffenders.length
      : 0

    const overallRisk = (avgAreaRisk * 0.6) + (avgOffenderRisk * 0.4)

    if (overallRisk >= 80) return 'CRITICAL'
    if (overallRisk >= 60) return 'HIGH'
    if (overallRisk >= 40) return 'MEDIUM'
    return 'LOW'
  }

  private generateRecommendations(
    patterns: ViolationPattern[],
    highRiskAreas: RiskArea[],
    repeatOffenders: RepeatOffender[]
  ): string[] {
    const recommendations: string[] = []

    // Pattern-based recommendations
    const increasingPatterns = patterns.filter(p => p.trend === 'INCREASING')
    if (increasingPatterns.length > 0) {
      recommendations.push(`Address ${increasingPatterns.length} violation types showing increasing trends`)
    }

    // Area-based recommendations
    const criticalAreas = highRiskAreas.filter(a => a.riskScore >= 70)
    if (criticalAreas.length > 0) {
      recommendations.push(`Prioritize inspections for ${criticalAreas.length} high-risk areas`)
    }

    // Offender-based recommendations
    const criticalOffenders = repeatOffenders.filter(o => o.riskScore >= 70)
    if (criticalOffenders.length > 0) {
      recommendations.push(`Provide additional training for ${criticalOffenders.length} inspectors with high risk scores`)
    }

    // General recommendations
    if (highRiskAreas.length > 5) {
      recommendations.push('Consider increasing inspection frequency for high-risk zones')
    }

    if (repeatOffenders.length > 3) {
      recommendations.push('Review inspector performance and implement accountability measures')
    }

    return recommendations
  }

  private calculateRiskTrend(patterns: ViolationPattern[]): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
    const increasing = patterns.filter(p => p.trend === 'INCREASING').length
    const decreasing = patterns.filter(p => p.trend === 'DECREASING').length

    if (increasing > decreasing * 1.5) return 'DETERIORATING'
    if (decreasing > increasing * 1.5) return 'IMPROVING'
    return 'STABLE'
  }

  // Execute Agent
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = { ...state, currentAgent: this.config.name }
    const maxRetries = state.maxRetries || this.config.maxRetries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        currentState.retryCount = attempt

        // Generate risk dashboard
        const riskAnalysis = await this.generateRiskDashboard()

        currentState = {
          ...currentState,
          results: {
            ...currentState.results,
            riskAnalysis,
          },
        }

        if (!currentState.errors || currentState.errors.length === 0) {
          return currentState
        }
      } catch (error) {
        console.error(`Systemic risk discovery attempt ${attempt + 1} failed:`, error)
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
