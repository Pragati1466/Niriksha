// Trust Evolution Agent
import { AgentState, TrustScoreResult, TrustFactor } from './types'
import { complianceMemory } from '../services/complianceMemory'

export class TrustEvolutionAgent {
  private config = {
    name: 'trust-evolution',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 30000,
    memoryEnabled: true,
    tools: ['score-calculation', 'factor-analysis', 'trend-detection'],
  }

  private baseScore = 100
  private scoreWeights = {
    accuracy: 0.4,
    consistency: 0.25,
    timeliness: 0.15,
    quality: 0.1,
    supervisorOverride: 0.1,
  }

  // Tool: Calculate Trust Score
  private async calculateTrustScore(inspectorId: string): Promise<TrustScoreResult> {
    const history = await complianceMemory.getInspectorMemory(inspectorId)
    const trustHistory = await complianceMemory.getInspectorTrustHistory(inspectorId)
    
    const previousScore = trustHistory.length > 0 
      ? trustHistory[trustHistory.length - 1].currentScore 
      : this.baseScore

    // Analyze factors
    const factors = this.analyzeFactors(history)
    
    // Calculate new score
    let scoreChange = 0
    factors.forEach(factor => {
      scoreChange += factor.impact * this.scoreWeights[factor.type as keyof typeof this.scoreWeights]
    })

    const currentScore = Math.max(0, Math.min(100, previousScore + scoreChange))

    // Determine risk level
    const riskLevel = this.determineRiskLevel(currentScore)

    // Generate recommendation
    const recommendation = this.generateRecommendation(currentScore, riskLevel, factors)

    const result: TrustScoreResult = {
      inspectorId,
      currentScore,
      previousScore,
      scoreChange,
      factors,
      recommendation,
      riskLevel,
    }

    await complianceMemory.recordTrustScore(inspectorId, result)

    return result
  }

  // Tool: Analyze Trust Factors
  private analyzeFactors(history: any[]): TrustFactor[] {
    const factors: TrustFactor[] = []

    // Accuracy Factor
    const accuracyFactor = this.calculateAccuracyFactor(history)
    factors.push(accuracyFactor)

    // Consistency Factor
    const consistencyFactor = this.calculateConsistencyFactor(history)
    factors.push(consistencyFactor)

    // Timeliness Factor
    const timelinessFactor = this.calculateTimelinessFactor(history)
    factors.push(timelinessFactor)

    // Quality Factor
    const qualityFactor = this.calculateQualityFactor(history)
    factors.push(qualityFactor)

    // Supervisor Override Factor
    const overrideFactor = this.calculateOverrideFactor(history)
    factors.push(overrideFactor)

    return factors
  }

  private calculateAccuracyFactor(history: any[]): TrustFactor {
    const realityVerifications = history.filter(h => h.type === 'REALITY_VERIFICATION')
    const accurate = realityVerifications.filter(v => v.data.verified).length
    const total = realityVerifications.length

    if (total === 0) {
      return {
        type: 'ACCURACY',
        impact: 0,
        description: 'No verification history available',
        value: 0,
      }
    }

    const accuracy = accurate / total
    const impact = (accuracy - 0.7) * 30 // Scale impact based on 70% baseline

    return {
      type: 'ACCURACY',
      impact,
      description: `${(accuracy * 100).toFixed(1)}% of reports verified accurate`,
      value: accuracy,
    }
  }

  private calculateConsistencyFactor(history: any[]): TrustFactor {
    const trustScores = history.filter(h => h.type === 'TRUST_SCORE')
    
    if (trustScores.length < 2) {
      return {
        type: 'CONSISTENCY',
        impact: 0,
        description: 'Insufficient history for consistency analysis',
        value: 0,
      }
    }

    const scores = trustScores.map(t => t.data.currentScore)
    const variance = this.calculateVariance(scores)
    const impact = -variance * 2 // Higher variance = negative impact

    return {
      type: 'CONSISTENCY',
      impact,
      description: `Score variance: ${variance.toFixed(2)}`,
      value: variance,
    }
  }

  private calculateTimelinessFactor(history: any[]): TrustFactor {
    const inspections = history.filter(h => h.type === 'INSPECTION_SUBMISSION')
    
    if (inspections.length === 0) {
      return {
        type: 'TIMELINESS',
        impact: 0,
        description: 'No submission history available',
        value: 0,
      }
    }

    const onTime = inspections.filter(i => i.data.onTime).length
    const total = inspections.length
    const timeliness = onTime / total
    const impact = (timeliness - 0.8) * 15

    return {
      type: 'TIMELINESS',
      impact,
      description: `${(timeliness * 100).toFixed(1)}% of inspections submitted on time`,
      value: timeliness,
    }
  }

  private calculateQualityFactor(history: any[]): TrustFactor {
    const reports = history.filter(h => h.type === 'REPORT_GENERATION')
    
    if (reports.length === 0) {
      return {
        type: 'QUALITY',
        impact: 0,
        description: 'No report quality history available',
        value: 0,
      }
    }

    const avgQuality = reports.reduce((acc, r) => acc + (r.data.qualityScore || 0.7), 0) / reports.length
    const impact = (avgQuality - 0.7) * 20

    return {
      type: 'QUALITY',
      impact,
      description: `Average report quality: ${(avgQuality * 100).toFixed(1)}%`,
      value: avgQuality,
    }
  }

  private calculateOverrideFactor(history: any[]): TrustFactor {
    const reviews = history.filter(h => h.type === 'SUPERVISOR_REVIEW')
    
    if (reviews.length === 0) {
      return {
        type: 'SUPERVISOR_OVERRIDE',
        impact: 0,
        description: 'No supervisor review history',
        value: 0,
      }
    }

    const overrides = reviews.filter(r => r.data.overridden).length
    const total = reviews.length
    const overrideRate = overrides / total
    const impact = -overrideRate * 25 // Overrides have negative impact

    return {
      type: 'SUPERVISOR_OVERRIDE',
      impact,
      description: `${(overrideRate * 100).toFixed(1)}% of reports overridden by supervisor`,
      value: overrideRate,
    }
  }

  private calculateVariance(scores: number[]): number {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length
    const squaredDiffs = scores.map(score => Math.pow(score - mean, 2))
    return squaredDiffs.reduce((a, b) => a + b, 0) / scores.length
  }

  private determineRiskLevel(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 85) return 'LOW'
    if (score >= 70) return 'MEDIUM'
    if (score >= 50) return 'HIGH'
    return 'CRITICAL'
  }

  private generateRecommendation(
    score: number,
    riskLevel: string,
    factors: TrustFactor[]
  ): string {
    if (riskLevel === 'LOW') {
      return 'Inspector maintains excellent performance. Continue current practices.'
    }

    if (riskLevel === 'MEDIUM') {
      const negativeFactors = factors.filter(f => f.impact < 0)
      return `Performance needs attention. Focus on improving: ${negativeFactors.map(f => f.type).join(', ')}.`
    }

    if (riskLevel === 'HIGH') {
      return 'Significant performance issues detected. Immediate supervision and training recommended.'
    }

    return 'Critical performance issues. Consider retraining or reassignment.'
  }

  // Node: Update Trust Score
  private async updateTrustScore(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const { inspectorId, results } = state

      if (!inspectorId) {
        throw new Error('Inspector ID required for trust score calculation')
      }

      // Calculate new trust score
      const trustScore = await this.calculateTrustScore(inspectorId)

      return {
        results: {
          ...results,
          trustScore,
        },
        currentAgent: this.config.name,
      }
    } catch (error) {
      console.error('Trust score update error:', error)
      throw error
    }
  }

  // Node: Analyze Trust Trend
  private async analyzeTrustTrend(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const { inspectorId } = state

      if (!inspectorId) {
        throw new Error('Inspector ID required for trend analysis')
      }

      const history = await complianceMemory.getInspectorTrustHistory(inspectorId)
      
      if (history.length < 3) {
        return {
          results: {
            ...state.results,
            trustScore: {
              ...state.results?.trustScore,
              trend: 'INSUFFICIENT_DATA',
            } as TrustScoreResult,
          },
        }
      }

      const recentScores = history.slice(-5).map(h => h.currentScore)
      const trend = this.calculateTrend(recentScores)

      const existingTrustScore = state.results?.trustScore
      return {
        results: {
          ...state.results,
          trustScore: {
            inspectorId: inspectorId,
            currentScore: existingTrustScore?.currentScore || 100,
            previousScore: existingTrustScore?.previousScore || 100,
            scoreChange: existingTrustScore?.scoreChange || 0,
            factors: existingTrustScore?.factors || [],
            recommendation: existingTrustScore?.recommendation || '',
            riskLevel: existingTrustScore?.riskLevel || 'LOW',
            trend,
          } as TrustScoreResult,
        },
      }
    } catch (error) {
      console.error('Trust trend analysis error:', error)
      throw error
    }
  }

  private calculateTrend(scores: number[]): 'IMPROVING' | 'STABLE' | 'DETERIORATING' {
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
    const secondHalf = scores.slice(Math.floor(scores.length / 2))

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length

    const diff = secondAvg - firstAvg

    if (diff > 5) return 'IMPROVING'
    if (diff < -5) return 'DETERIORATING'
    return 'STABLE'
  }

  // Execute Agent
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = { ...state, currentAgent: this.config.name }
    const maxRetries = state.maxRetries || this.config.maxRetries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        currentState.retryCount = attempt
        
        // Update trust score
        const scoreResult = await this.updateTrustScore(currentState)
        currentState = { ...currentState, ...scoreResult }

        // Analyze trend
        const trendResult = await this.analyzeTrustTrend(currentState)
        currentState = { ...currentState, ...trendResult }

        if (!currentState.errors || currentState.errors.length === 0) {
          return currentState
        }
      } catch (error) {
        console.error(`Trust evolution attempt ${attempt + 1} failed:`, error)
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
