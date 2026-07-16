// Reality Verification Agent
import { GoogleGenerativeAI } from '@google/generative-ai'
import Groq from 'groq-sdk'
import OpenAI from 'openai'
import { promises as fs } from 'fs'
import path from 'path'
import { AgentState, RealityVerificationResult, Inconsistency } from './types'

export class RealityVerificationAgent {
  private genAI: GoogleGenerativeAI | null = null
  private geminiModel: any = null
  private groq: Groq | null = null
  private openrouter: OpenAI | null = null
  private aiProvider: 'openrouter' | 'groq' | 'gemini' | 'none' = 'none'
  private config = {
    name: 'reality-verification',
    version: '1.0.0',
    maxRetries: 3,
    timeout: 30000,
    memoryEnabled: true,
    tools: ['image-analysis', 'checklist-comparison', 'confidence-calculation'],
  }

  constructor() {
    // Priority: OpenRouter > Groq > Gemini
    if (process.env.OPENROUTER_API_KEY) {
      this.openrouter = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      })
      this.aiProvider = 'openrouter'
      console.log('RealityVerificationAgent: Using OpenRouter AI')
    } else if (process.env.GROQ_API_KEY) {
      this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
      this.aiProvider = 'groq'
      console.log('RealityVerificationAgent: Using Groq AI')
    } else if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
      this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
      this.aiProvider = 'gemini'
      console.log('RealityVerificationAgent: Using Google Gemini')
    } else {
      console.warn('RealityVerificationAgent: No AI API key configured (OPENROUTER_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY)')
    }
  }

  // Tool: Analyze Image
  private async loadImagePart(imagePath: string): Promise<{ inlineData: { mimeType: string, data: string } }> {
    if (/^https?:\/\//i.test(imagePath)) {
      throw new Error('Verification requires a locally stored uploaded image, not an image URL')
    }

    const uploadsDirectory = path.resolve(process.cwd(), 'uploads')
    const resolvedPath = path.isAbsolute(imagePath)
      ? path.resolve(imagePath)
      : path.resolve(process.cwd(), imagePath.replace(/^[/\\]+/, ''))

    if (!resolvedPath.startsWith(`${uploadsDirectory}${path.sep}`)) {
      throw new Error('Image path must be inside the uploads directory')
    }

    const bytes = await fs.readFile(resolvedPath)
    const mimeType = this.detectImageMimeType(bytes)
    return { inlineData: { mimeType, data: bytes.toString('base64') } }
  }

  private detectImageMimeType(bytes: Buffer): string {
    if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png'
    if (bytes.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return 'image/jpeg'
    if (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif'
    if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
    throw new Error('Uploaded file is not a supported image format')
  }

  private async analyzeImage(imagePath: string, checklistItem: string): Promise<any> {
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

      let text: string

      if (this.aiProvider === 'openrouter' && this.openrouter) {
        // OpenRouter supports vision models via OpenAI-compatible API
        const imagePart = await this.loadImagePart(imagePath)
        const response = await this.openrouter.chat.completions.create({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` } }
              ]
            }
          ],
        })
        text = response.choices[0]?.message?.content || ''
      } else if (this.aiProvider === 'groq' && this.groq) {
        // Groq doesn't support image analysis directly, use text-only fallback
        console.warn('Groq does not support image analysis, using mock verification')
        return {
          status: 'UNVERIFIED',
          compliant: null,
          confidence: 0.5,
          observations: ['Image analysis not available with Groq - manual review required'],
          violations: [],
        }
      } else if (this.aiProvider === 'gemini' && this.geminiModel) {
        const imagePart = await this.loadImagePart(imagePath)
        const result = await this.geminiModel.generateContent([prompt, imagePart])
        const response = await result.response
        text = response.text()
      } else {
        // No AI configured, return mock response
        return {
          status: 'UNVERIFIED',
          compliant: null,
          confidence: 0,
          observations: ['No AI configured for verification'],
          violations: [],
        }
      }
      
      try {
        return JSON.parse(text)
      } catch {
        return {
          status: 'UNVERIFIED',
          compliant: null,
          confidence: 0,
          reason: 'Unable to parse verification response',
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

      // Each stored inspection image is analyzed visually for every checklist item.
      // Metadata such as filenames and descriptions is never used as evidence.
      const relevantImages = images

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

          if (analysis.status === 'UNVERIFIED') {
            inconsistencies.push({
              checklistItemId: item.id,
              checklistLabel: item.label,
              claimedStatus: item.status,
              detectedStatus: 'UNKNOWN',
              confidence: 0,
              reasoning: analysis.reason,
              severity: this.calculateSeverity(item.required, 0),
              evidenceReference: image.url,
            })
            continue
          }
          
          const detectedStatus = analysis.compliant ? 'COMPLIANT' : 'NON_COMPLIANT'
          
          // Non-compliance and low-confidence visual evidence must be surfaced
          // even when the inspector selected the same checklist status.
          if (item.status !== detectedStatus || detectedStatus === 'NON_COMPLIANT' || analysis.confidence < 0.7) {
            inconsistencies.push({
              checklistItemId: item.id,
              checklistLabel: item.label,
              claimedStatus: item.status,
              detectedStatus,
              confidence: analysis.confidence,
              reasoning: analysis.observations.join('; '),
              severity: this.calculateSeverity(item.required, analysis.confidence),
              evidenceReference: image.url,
            })
          }
        } catch (error) {
          console.error(`Error analyzing image for ${item.label}:`, error)
          inconsistencies.push({
            checklistItemId: item.id,
            checklistLabel: item.label,
            claimedStatus: item.status,
            detectedStatus: 'UNKNOWN',
            confidence: 0,
            reasoning: 'Unable to verify image evidence',
            severity: this.calculateSeverity(item.required, 0),
            evidenceReference: image.url,
          })
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
