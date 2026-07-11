// AI Insights Service
import prisma from '../utils/prisma'

export interface AIInsight {
  id: string
  type: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'CORRELATION' | 'ALERT'
  title: string
  description: string
  metric: string
  value: number
  change: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionable: boolean
  recommendations: string[]
  relatedEntities: string[]
  timestamp: Date
}

export class AIInsightsService {
  // Generate comprehensive AI insights
  async generateInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Trend insights
    const trendInsights = await this.generateTrendInsights()
    insights.push(...trendInsights)

    // Anomaly insights
    const anomalyInsights = await this.generateAnomalyInsights()
    insights.push(...anomalyInsights)

    // Correlation insights
    const correlationInsights = await this.generateCorrelationInsights()
    insights.push(...correlationInsights)

    // Alert insights
    const alertInsights = await this.generateAlertInsights()
    insights.push(...alertInsights)

    // Sort by severity and timestamp
    return insights.sort((a, b) => {
      const severityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
  }

  // Generate trend insights
  private async generateTrendInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Kitchen hygiene trend
    const kitchenInspections = await prisma.inspection.findMany({
      where: {
        site: { department: { name: 'Health' } },
        scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      include: { violations: true },
    })

    if (kitchenInspections.length > 10) {
      const recentViolations = kitchenInspections.slice(-10).flatMap((i: any) => i.violations)
      const olderViolations = kitchenInspections.slice(0, -10).flatMap((i: any) => i.violations)
      
      const recentRate = recentViolations.length / 10
      const olderRate = olderViolations.length / (kitchenInspections.length - 10)
      const change = ((recentRate - olderRate) / olderRate) * 100

      if (Math.abs(change) > 20) {
        insights.push({
          id: `trend-${Date.now()}-1`,
          type: 'TREND',
          title: 'Kitchen Hygiene Trend',
          description: `Kitchen hygiene ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}% in the last month`,
          metric: 'Violation Rate',
          value: recentRate * 100,
          change,
          trend: change > 0 ? 'UP' : 'DOWN',
          severity: Math.abs(change) > 40 ? 'HIGH' : 'MEDIUM',
          actionable: true,
          recommendations: change > 0
            ? ['Increase inspection frequency', 'Review hygiene protocols', 'Provide additional training']
            : ['Maintain current practices', 'Document successful measures', 'Share best practices'],
          relatedEntities: kitchenInspections.map((i: any) => i.siteId),
          timestamp: new Date(),
        })
      }
    }

    // Inspector performance trend
    const inspectors = await prisma.user.findMany({
      where: { role: 'INSPECTOR' },
    })

    for (const inspector of inspectors) {
      const inspectorInspections = await prisma.inspection.findMany({
        where: { inspectorId: inspector.id },
        include: { violations: true },
        orderBy: { scheduledDate: 'desc' },
        take: 20,
      })

      if (inspectorInspections.length < 10) continue

      const recentInspections = inspectorInspections.slice(0, 5)
      const olderInspections = inspectorInspections.slice(5, 10)

      const recentViolations = recentInspections.flatMap((i: any) => i.violations.length)
      const olderViolations = olderInspections.flatMap((i: any) => i.violations.length)

      const recentAvg = recentViolations.reduce((a: number, b: number) => a + b, 0) / 5
      const olderAvg = olderViolations.reduce((a: number, b: number) => a + b, 0) / 5

      const change = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100

      if (Math.abs(change) > 30) {
        insights.push({
          id: `trend-${Date.now()}-${inspector.id}`,
          type: 'TREND',
          title: `Inspector Performance: ${inspector.name}`,
          description: `Violation rate ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change).toFixed(1)}%`,
          metric: 'Average Violations',
          value: recentAvg,
          change,
          trend: change > 0 ? 'UP' : 'DOWN',
          severity: Math.abs(change) > 50 ? 'HIGH' : 'MEDIUM',
          actionable: true,
          recommendations: change > 0
            ? ['Schedule performance review', 'Provide additional training', 'Monitor closely']
            : ['Recognize excellence', 'Share best practices', 'Consider for leadership role'],
          relatedEntities: [inspector.id],
          timestamp: new Date(),
        })
      }
    }

    return insights
  }

  // Generate anomaly insights
  private async generateAnomalyInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Find contractors appearing in multiple high-risk sites
    const contractors = await prisma.user.findMany({
      where: { role: 'INSPECTOR' },
    })

    for (const contractor of contractors) {
      const contractorInspections = await prisma.inspection.findMany({
        where: { inspectorId: contractor.id },
        include: {
          site: {
            include: {
              inspections: {
                include: { violations: true },
              },
            },
          },
        },
      })

      const highRiskSites = contractorInspections.filter((inspection: any) => {
        const siteViolations = inspection.site.inspections.flatMap((i: any) => i.violations)
        return siteViolations.length > 5
      })

      if (highRiskSites.length >= 8) {
        insights.push({
          id: `anomaly-${Date.now()}-${contractor.id}`,
          type: 'ANOMALY',
          title: `High-Risk Pattern: ${contractor.name}`,
          description: `This inspector appears in ${highRiskSites.length} high-risk sites`,
          metric: 'High-Risk Site Count',
          value: highRiskSites.length,
          change: 0,
          trend: 'STABLE',
          severity: 'HIGH',
          actionable: true,
          recommendations: [
            'Review inspection assignments',
            'Investigate potential bias',
            'Consider workload redistribution',
          ],
          relatedEntities: highRiskSites.map((i: any) => i.siteId),
          timestamp: new Date(),
        })
      }
    }

    // Find sites with sudden violation spikes
    const sites = await prisma.site.findMany({
      include: {
        inspections: {
          include: { violations: true },
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    })

    for (const site of sites) {
      if (site.inspections.length < 5) continue

      const recentInspections = site.inspections.slice(0, 3)
      const olderInspections = site.inspections.slice(3, 8)

      const recentViolations = recentInspections.flatMap((i: any) => i.violations.length)
      const olderViolations = olderInspections.flatMap((i: any) => i.violations.length)

      const recentAvg = recentViolations.reduce((a: number, b: number) => a + b, 0) / 3
      const olderAvg = olderViolations.reduce((a: number, b: number) => a + b, 0) / olderInspections.length

      const spike = ((recentAvg - olderAvg) / (olderAvg || 1)) * 100

      if (spike > 100) {
        insights.push({
          id: `anomaly-${Date.now()}-${site.id}`,
          type: 'ANOMALY',
          title: `Violation Spike: ${site.name}`,
          description: `Violations increased by ${spike.toFixed(1)}% compared to historical average`,
          metric: 'Violation Spike',
          value: spike,
          change: spike,
          trend: 'UP',
          severity: 'CRITICAL',
          actionable: true,
          recommendations: [
            'Immediate inspection required',
            'Investigate root cause',
            'Consider temporary closure if critical',
          ],
          relatedEntities: [site.id],
          timestamp: new Date(),
        })
      }
    }

    return insights
  }

  // Generate correlation insights
  private async generateCorrelationInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Correlation between inspection time and violations
    const morningInspections = await prisma.inspection.findMany({
      where: {
        scheduledDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    })

    const morningViolations = morningInspections
      .filter((i: any) => new Date(i.scheduledDate).getHours() < 12)
      .flatMap((i: any) => i.violations.length)

    const afternoonViolations = morningInspections
      .filter((i: any) => new Date(i.scheduledDate).getHours() >= 12)
      .flatMap((i: any) => i.violations.length)

    const morningAvg = morningViolations.reduce((a: number, b: number) => a + b, 0) / (morningViolations.length || 1)
    const afternoonAvg = afternoonViolations.reduce((a: number, b: number) => a + b, 0) / (afternoonViolations.length || 1)

    if (Math.abs(morningAvg - afternoonAvg) > 1) {
      insights.push({
        id: `correlation-${Date.now()}-1`,
        type: 'CORRELATION',
        title: 'Time-Based Violation Pattern',
        description: `${morningAvg > afternoonAvg ? 'Morning' : 'Afternoon'} inspections show ${Math.abs(morningAvg - afternoonAvg).toFixed(1)}x more violations`,
        metric: 'Time Correlation',
        value: Math.abs(morningAvg - afternoonAvg),
        change: 0,
        trend: 'STABLE',
        severity: 'MEDIUM',
        actionable: true,
        recommendations: [
          'Schedule critical inspections during low-violation periods',
          'Investigate time-specific factors',
          'Adjust inspection schedules accordingly',
        ],
        relatedEntities: [],
        timestamp: new Date(),
      })
    }

    return insights
  }

  // Generate alert insights
  private async generateAlertInsights(): Promise<AIInsight[]> {
    const insights: AIInsight[] = []

    // Critical violations requiring immediate attention
    const criticalViolations = await prisma.violation.findMany({
      where: { severity: 'CRITICAL' },
      include: {
        inspection: {
          include: {
            site: true,
            inspector: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (criticalViolations.length > 5) {
      insights.push({
        id: `alert-${Date.now()}-1`,
        type: 'ALERT',
        title: 'Critical Violation Surge',
        description: `${criticalViolations.length} critical violations detected in recent inspections`,
        metric: 'Critical Violations',
        value: criticalViolations.length,
        change: 0,
        trend: 'UP',
        severity: 'CRITICAL',
        actionable: true,
        recommendations: [
          'Immediate follow-up required',
          'Prioritize these sites for re-inspection',
          'Consider emergency measures if safety risk',
        ],
        relatedEntities: criticalViolations.map((v: any) => v.inspection.siteId),
        timestamp: new Date(),
      })
    }

    // Overdue inspections
    const overdueInspections = await prisma.inspection.findMany({
      where: {
        status: 'ASSIGNED',
        scheduledDate: { lt: new Date() },
      },
    })

    if (overdueInspections.length > 0) {
      insights.push({
        id: `alert-${Date.now()}-2`,
        type: 'ALERT',
        title: 'Overdue Inspections',
        description: `${overdueInspections.length} inspections are overdue`,
        metric: 'Overdue Count',
        value: overdueInspections.length,
        change: 0,
        trend: 'UP',
        severity: overdueInspections.length > 10 ? 'HIGH' : 'MEDIUM',
        actionable: true,
        recommendations: [
          'Contact inspectors immediately',
          'Reschedule overdue inspections',
          'Implement reminder system',
        ],
        relatedEntities: overdueInspections.map((i: any) => i.id),
        timestamp: new Date(),
      })
    }

    return insights
  }

  // Get insights summary for dashboard
  async getInsightsSummary() {
    const insights = await this.generateInsights()

    return {
      totalInsights: insights.length,
      criticalCount: insights.filter(i => i.severity === 'CRITICAL').length,
      highCount: insights.filter(i => i.severity === 'HIGH').length,
      mediumCount: insights.filter(i => i.severity === 'MEDIUM').length,
      lowCount: insights.filter(i => i.severity === 'LOW').length,
      actionableCount: insights.filter(i => i.actionable).length,
      topInsights: insights.slice(0, 5),
    }
  }

  // Get insights by type
  async getInsightsByType(type: string): Promise<AIInsight[]> {
    const insights = await this.generateInsights()
    return insights.filter(i => i.type === type)
  }

  // Get insights by severity
  async getInsightsBySeverity(severity: string): Promise<AIInsight[]> {
    const insights = await this.generateInsights()
    return insights.filter(i => i.severity === severity)
  }
}

export const aiInsights = new AIInsightsService()
