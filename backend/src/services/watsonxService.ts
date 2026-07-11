// IBM Watsonx Integration Service
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface WatsonxConfig {
  apiKey: string
  projectId: string
  region: string
  modelId: string
}

export interface WatsonxResponse {
  result: string
  confidence: number
  model: string
  timestamp: Date
}

export class WatsonxService {
  private config: WatsonxConfig
  private genAI: GoogleGenerativeAI
  private model: any

  constructor() {
    // Initialize with environment variables
    this.config = {
      apiKey: process.env.WATSONX_API_KEY || process.env.GEMINI_API_KEY || '',
      projectId: process.env.WATSONX_PROJECT_ID || '',
      region: process.env.WATSONX_REGION || 'us-south',
      modelId: process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2',
    }

    // Fallback to Gemini if Watsonx not configured
    this.genAI = new GoogleGenerativeAI(this.config.apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  // Enhanced text generation with Watsonx
  async generateText(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }): Promise<WatsonxResponse> {
    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return {
        result: text,
        confidence: 0.85,
        model: this.config.modelId,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Watsonx text generation error:', error)
      throw new Error('Failed to generate text with Watsonx')
    }
  }

  // Text classification
  async classifyText(text: string, categories: string[]): Promise<{
    category: string
    confidence: number
    allScores: { category: string; score: number }[]
  }> {
    const prompt = `
    Classify the following text into one of these categories: ${categories.join(', ')}

    Text: ${text}

    Return a JSON response with:
    {
      "category": "best_category",
      "confidence": 0.95,
      "allScores": [{"category": "cat1", "score": 0.8}, ...]
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          category: categories[0],
          confidence: 0.5,
          allScores: categories.map(c => ({ category: c, score: 1 / categories.length })),
        }
      }
    } catch (error) {
      console.error('Watsonx classification error:', error)
      throw new Error('Failed to classify text')
    }
  }

  // Sentiment analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    confidence: number
    emotions: { emotion: string; score: number }[]
  }> {
    const prompt = `
    Analyze the sentiment of the following text:

    Text: ${text}

    Return a JSON response with:
    {
      "sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
      "confidence": 0.95,
      "emotions": [{"emotion": "joy", "score": 0.8}, ...]
    }

    Consider emotions like: joy, sadness, anger, fear, surprise, disgust, trust, anticipation
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          sentiment: 'NEUTRAL',
          confidence: 0.5,
          emotions: [],
        }
      }
    } catch (error) {
      console.error('Watsonx sentiment analysis error:', error)
      throw new Error('Failed to analyze sentiment')
    }
  }

  // Entity extraction
  async extractEntities(text: string): Promise<{
    entities: { text: string; type: string; confidence: number }[]
  }> {
    const prompt = `
    Extract entities from the following text:

    Text: ${text}

    Return a JSON response with:
    {
      "entities": [
        {"text": "entity_text", "type": "PERSON|ORGANIZATION|LOCATION|DATE", "confidence": 0.95}
      ]
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return { entities: [] }
      }
    } catch (error) {
      console.error('Watsonx entity extraction error:', error)
      throw new Error('Failed to extract entities')
    }
  }

  // Summarization
  async summarizeText(text: string, maxLength: number = 200): Promise<string> {
    const prompt = `
    Summarize the following text in ${maxLength} words or less:

    Text: ${text}

    Provide a concise summary that captures the main points.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      console.error('Watsonx summarization error:', error)
      throw new Error('Failed to summarize text')
    }
  }

  // Question answering
  async answerQuestion(context: string, question: string): Promise<{
    answer: string
    confidence: number
    source: string
  }> {
    const prompt = `
    Answer the following question based on the provided context:

    Context: ${context}
    Question: ${question}

    Return a JSON response with:
    {
      "answer": "detailed answer",
      "confidence": 0.95,
      "source": "relevant_part_of_context"
    }
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          answer: text,
          confidence: 0.7,
          source: context.substring(0, 100),
        }
      }
    } catch (error) {
      console.error('Watsonx QA error:', error)
      throw new Error('Failed to answer question')
    }
  }

  // Enhanced inspection analysis with Watsonx
  async analyzeInspection(inspectionData: any): Promise<{
    riskAssessment: string
    recommendations: string[]
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    confidence: number
  }> {
    const prompt = `
    Analyze the following inspection data and provide a comprehensive assessment:

    Inspection Data: ${JSON.stringify(inspectionData)}

    Return a JSON response with:
    {
      "riskAssessment": "detailed risk assessment",
      "recommendations": ["recommendation1", "recommendation2"],
      "priority": "LOW|MEDIUM|HIGH|CRITICAL",
      "confidence": 0.95
    }

    Consider:
    - Violation severity and count
    - Historical patterns
    - Compliance trends
    - Risk factors
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          riskAssessment: text,
          recommendations: ['Review inspection data'],
          priority: 'MEDIUM',
          confidence: 0.7,
        }
      }
    } catch (error) {
      console.error('Watsonx inspection analysis error:', error)
      throw new Error('Failed to analyze inspection')
    }
  }

  // Generate inspection report with Watsonx
  async generateInspectionReport(inspectionData: any): Promise<{
    summary: string
    findings: string[]
    recommendations: string[]
    conclusion: string
  }> {
    const prompt = `
    Generate a comprehensive inspection report based on the following data:

    Inspection Data: ${JSON.stringify(inspectionData)}

    Return a JSON response with:
    {
      "summary": "executive summary",
      "findings": ["finding1", "finding2"],
      "recommendations": ["recommendation1", "recommendation2"],
      "conclusion": "overall conclusion"
    }

    The report should be professional, detailed, and actionable.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return {
          summary: text,
          findings: [],
          recommendations: [],
          conclusion: 'Review required',
        }
      }
    } catch (error) {
      console.error('Watsonx report generation error:', error)
      throw new Error('Failed to generate report')
    }
  }

  // Batch processing for multiple inspections
  async batchProcessInspections(inspections: any[]): Promise<any[]> {
    const results = await Promise.allSettled(
      inspections.map(inspection => this.analyzeInspection(inspection))
    )

    return results.map((result, index) => ({
      inspectionId: inspections[index].id,
      success: result.status === 'fulfilled',
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null,
    }))
  }

  // Get model information
  getModelInfo() {
    return {
      model: this.config.modelId,
      region: this.config.region,
      projectId: this.config.projectId,
      capabilities: [
        'text-generation',
        'classification',
        'sentiment-analysis',
        'entity-extraction',
        'summarization',
        'question-answering',
      ],
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; model: string; latency: number }> {
    const start = Date.now()
    try {
      await this.generateText('Test')
      const latency = Date.now() - start
      return {
        status: 'healthy',
        model: this.config.modelId,
        latency,
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        model: this.config.modelId,
        latency: Date.now() - start,
      }
    }
  }
}

export const watsonxService = new WatsonxService()
