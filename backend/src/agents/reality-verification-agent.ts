// Reality Verification Agent
import { GoogleGenerativeAI } from '@google/generative-ai'
import { AgentState, RealityVerificationResult, Inconsistency } from './types'
import { agentMemory } from './memory'

export class RealityVerificationAgent {
  private genAI: GoogleGenerativeAI
  private model: any
  private config = {
    name: 'reality-verification',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 30000,
    memoryEnabled: true,
    tools: ['image-analysis', 'checklist-comparison', 'confidence-calculation'],
  }

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  // Tool: Analyze Image
  private async analyzeImage(imageUrl: string, checklistItem: string): Promise<any> {
    try {
      const prompt = `
      Analyze this image in the context of a safety inspection.
      Checklist item: "${checklistItem}"
      
      Determine if this image shows:
      1. Compliance with the checklist item
      2. Any violations or issues
      3. Overall condition
      
      Return JSON with:
      {
        "compliant": boolean,
        "confidence": number (0-1),
        "observations": string[],
        "violations": string[]
      }
      `

      const result = await this.model.generateContent([
        prompt,
        imageUrl,
      ])

      const response = await result.response
      const text = response.text()
      
      try {
        return JSON.parse(text)
      } catch {
        return {
          compliant: true,
          confidence: 0.5,
          observations: [text],
          violations: [],
        }
      }
    } catch (error) {
      console.error('Image analysis error:', error)
      throw new Error(`Failed to analyze image: ${error}`)
    }
  }

  // Tool: Compare Checklist with Images
  private async compareChecklistWithImages(
    checklist: any[],
    images: any[]
  ): Promise<Inconsistency[]> {
    const inconsistencies: Inconsistency[] = []

    for (const item of checklist) {
      if (item.status === 'NOT_APPLICABLE') continue

      // Find relevant images for this checklist item
      const relevantImages = images.filter(img => 
        img.description.toLowerCase().includes(item.label.toLowerCase()) ||
        img.description.toLowerCase().includes('general')
      )

      if (relevantImages.length === 0) {
        // No images to verify - flag as potential issue
        if (item.required) {
          inconsistencies.push({
            checklistItemId: item.id,
            checklistLabel: item.label,
            claimedStatus: item.status,
            detectedStatus: 'UNKNOWN',
            confidence: 0.3,
            reasoning: 'No supporting images provided for required checklist item',
            severity: 'MEDIUM',
          })
        }
        continue
      }

      // Analyze each relevant image
      for (const image of relevantImages) {
        try {
          const analysis = await this.analyzeImage(image.url, item.label)
          
          const detectedStatus = analysis.compliant ? 'COMPLIANT' : 'NON_COMPLIANT'
          
          // Check for inconsistency
          if (item.status !== detectedStatus) {
            inconsistencies.push({
              checklistItemId: item.id,
              checklistLabel: item.label,
              claimedStatus: item.status,
              detectedStatus,
              confidence: analysis.confidence,
              reasoning: analysis.observations.join('; '),
              severity: this.calculateSeverity(item.required, analysis.confidence),
            })
          }
        } catch (error) {
          console.error(`Error analyzing image for ${item.label}:`, error)
        }
      }
    }

    return inconsistencies
  }

  // Tool: Calculate Confidence Score
  private calculateConfidenceScore(
    checklist: any[],
    inconsistencies: Inconsistency[]
  ): number {
    if (checklist.length === 0) return 0

    const totalItems = checklist.length
    const inconsistentItems = inconsistencies.length
    const consistencyRatio = (totalItems - inconsistentItems) / totalItems

    // Average confidence of all analyses
    const avgConfidence = inconsistencies.reduce((acc, inc) => acc + inc.confidence, 0) / 
                         (inconsistencies.length || 1)

    // Weighted score
    const score = (consistencyRatio * 0.7) + (avgConfidence * 0.3)
    return Math.round(score * 100)
  }

  private calculateSeverity(required: boolean, confidence: number): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (required && confidence < 0.5) return 'CRITICAL'
    if (required && confidence < 0.7) return 'HIGH'
    if (!required && confidence < 0.5) return 'MEDIUM'
    return 'LOW'
  }

  // Node: Verify Reality
  private async verifyReality(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const { checklist, images, notes } = state

      if (!checklist || !images) {
        throw new Error('Missing checklist or images')
      }

      // Compare checklist with images
      const inconsistencies = await this.compareChecklistWithImages(checklist, images)

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(checklist, inconsistencies)

      // Generate explanation
      const explanation = this.generateExplanation(inconsistencies, confidenceScore)

      // Determine if verified
      const verified = confidenceScore >= 70 && inconsistencies.filter(i => i.severity === 'CRITICAL').length === 0

      const result: RealityVerificationResult = {
        confidenceScore,
        inconsistencies,
        flaggedItems: inconsistencies.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').map(i => i.checklistItemId),
        explanation,
        verified,
      }

      // Store in memory
      if (state.inspectorId) {
        agentMemory.setInspectorMemory(state.inspectorId, {
          type: 'REALITY_VERIFICATION',
          data: result,
        })
      }

      return {
        results: {
          ...state.results,
          realityVerification: result,
        },
        currentAgent: 'reality-verification',
      }
    } catch (error) {
      console.error('Reality verification error:', error)
      throw error
    }
  }

  private generateExplanation(inconsistencies: Inconsistency[], confidenceScore: number): string {
    if (inconsistencies.length === 0) {
      return 'All checklist items are consistent with the provided images. No discrepancies detected.'
    }

    const critical = inconsistencies.filter(i => i.severity === 'CRITICAL').length
    const high = inconsistencies.filter(i => i.severity === 'HIGH').length
    const medium = inconsistencies.filter(i => i.severity === 'MEDIUM').length

    let explanation = `Found ${inconsistencies.length} inconsistencies between checklist and images. `
    
    if (critical > 0) explanation += `${critical} critical issues detected. `
    if (high > 0) explanation += `${high} high-priority issues detected. `
    if (medium > 0) explanation += `${medium} medium-priority issues detected. `
    
    explanation += `Overall confidence score: ${confidenceScore}%.`
    
    return explanation
  }

  // Decision Node: Should Retry
  private shouldRetry(state: AgentState): string {
    const retryCount = state.retryCount || 0
    const maxRetries = state.maxRetries || this.config.maxRetries
    const hasErrors = state.errors && state.errors.length > 0

    return hasErrors && retryCount < maxRetries ? 'retry' : 'end'
  }

  // Decision Node: Should Flag for Review
  private shouldFlagForReview(state: AgentState): boolean {
    const result = state.results?.realityVerification
    if (!result) return false

    return !result.verified || result.confidenceScore < 70
  }

  // Execute Agent with retry logic
  async execute(state: AgentState): Promise<AgentState> {
    let currentState = { ...state, currentAgent: this.config.name }
    const maxRetries = state.maxRetries || this.config.maxRetries

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        currentState.retryCount = attempt
        const result = await this.verifyReality(currentState)
        currentState = { ...currentState, ...result }
        
        if (!currentState.errors || currentState.errors.length === 0) {
          return currentState
        }
      } catch (error) {
        console.error(`Reality verification attempt ${attempt + 1} failed:`, error)
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
