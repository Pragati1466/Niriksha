// Explainable AI Service
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface AIExplanation {
  recommendation: string
  reasoning: string
  confidence: number
  factors: string[]
  alternatives: string[]
  evidence: string[]
}

export class ExplainableAIService {
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  // Generate explanation for inspection recommendations
  async explainRecommendation(
    context: string,
    data: any
  ): Promise<AIExplanation> {
    try {
      const prompt = `
      You are an expert inspection AI assistant. Provide a detailed explanation for the following recommendation.

      Context: ${context}
      Data: ${JSON.stringify(data)}

      Return a JSON response with:
      {
        "recommendation": "Clear, actionable recommendation",
        "reasoning": "Detailed explanation of WHY this recommendation is made",
        "confidence": 0.95,
        "factors": ["factor1", "factor2", "factor3"],
        "alternatives": ["alternative1", "alternative2"],
        "evidence": ["evidence1", "evidence2"]
      }

      Be specific, data-driven, and cite the evidence.
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        // Fallback if JSON parsing fails
        return {
          recommendation: context,
          reasoning: text,
          confidence: 0.7,
          factors: ['Data analysis'],
          alternatives: ['Manual review'],
          evidence: ['Inspection data'],
        }
      }
    } catch (error) {
      console.error('Explainable AI error:', error)
      throw new Error('Failed to generate explanation')
    }
  }

  // Explain risk assessment
  async explainRiskAssessment(
    siteName: string,
    riskScore: number,
    factors: string[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      `Risk assessment for ${siteName}`,
      { riskScore, factors }
    )
  }

  // Explain violation detection
  async explainViolation(
    violationType: string,
    severity: string,
    evidence: string[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      `Violation detection: ${violationType}`,
      { severity, evidence }
    )
  }

  // Explain trust score changes
  async explainTrustScoreChange(
    inspectorName: string,
    previousScore: number,
    currentScore: number,
    factors: any[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      `Trust score change for ${inspectorName}`,
      { previousScore, currentScore, factors }
    )
  }

  // Explain route optimization
  async explainRouteOptimization(
    route: any[],
    totalTime: number,
    factors: string[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      'Route optimization recommendation',
      { route, totalTime, factors }
    )
  }

  // Explain inspection priority
  async explainInspectionPriority(
    inspectionId: string,
    priority: string,
    deadline: Date,
    factors: string[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      `Inspection priority: ${inspectionId}`,
      { priority, deadline, factors }
    )
  }

  // Generate step-by-step reasoning
  async generateStepByStepReasoning(
    decision: string,
    data: any
  ): Promise<string[]> {
    try {
      const prompt = `
      Break down the following decision into step-by-step reasoning:

      Decision: ${decision}
      Data: ${JSON.stringify(data)}

      Return a JSON array of reasoning steps:
      ["Step 1: ...", "Step 2: ...", "Step 3: ..."]

      Each step should be clear and logical.
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return [text]
      }
    } catch (error) {
      console.error('Step-by-step reasoning error:', error)
      return ['Unable to generate step-by-step reasoning']
    }
  }

  // Explain AI model confidence
  async explainConfidence(
    confidence: number,
    factors: string[]
  ): Promise<AIExplanation> {
    return this.explainRecommendation(
      'AI confidence explanation',
      { confidence, factors }
    )
  }
}

export const explainableAI = new ExplainableAIService()
