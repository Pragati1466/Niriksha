// IBM Watsonx Integration Service - Real WatsonX API with IBM Granite
import axios from 'axios'

export interface WatsonxConfig {
  apiKey: string
  projectId: string
  region: string
  modelId: string
  deploymentUrl?: string
  version?: string
}

export interface WatsonxResponse {
  result: string
  confidence: number
  model: string
  timestamp: Date
  usage?: {
    promptTokens: number
    generatedTokens: number
    totalTokens: number
  }
}

export class WatsonxService {
  private config: WatsonxConfig
  private tokenCache: { token: string; expiresAt: number } | null = null

  constructor() {
    this.config = {
      apiKey: process.env.WATSONX_API_KEY || '',
      projectId: process.env.WATSONX_PROJECT_ID || process.env.WATSONX_SPACE_ID || '',
      region: process.env.WATSONX_REGION || 'us-south',
      modelId: process.env.WATSONX_MODEL_ID || 'ibm/granite-13b-chat-v2',
      deploymentUrl: process.env.WATSONX_DEPLOYMENT_URL,
      version: process.env.WATSONX_VERSION || '2023-09-01',
    }
  }

  // Get IBM Cloud IAM token
  private async getIAMToken(): Promise<string> {
    // Check cache first
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now()) {
      return this.tokenCache.token
    }

    try {
      const response = await axios.post(
        'https://iam.cloud.ibm.com/identity/token',
        new URLSearchParams({
          grant_type: 'urn:ibm:params:oauth:grant-type:apikey',
          apikey: this.config.apiKey,
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      )

      const token = response.data.access_token
      const expiresIn = response.data.expires_in || 3600

      this.tokenCache = {
        token,
        expiresAt: Date.now() + (expiresIn - 60) * 1000, // Expire 60s early
      }

      return token
    } catch (error: any) {
      console.error('Failed to get IAM token:', error.response?.data || error.message)
      
      // Fallback: if apiKey itself is an IAM token (for local testing with no-real-key)
      if (this.config.apiKey.startsWith('Bearer ')) {
        return this.config.apiKey.replace('Bearer ', '')
      }
      
      throw new Error(`WatsonX IAM authentication failed: ${error.response?.data?.errorMessage || error.message}`)
    }
  }

  // Build the WatsonX API URL
  private getApiBaseUrl(): string {
    if (this.config.deploymentUrl) {
      return this.config.deploymentUrl
    }
    return `https://${this.config.region}.ml.cloud.ibm.com/ml/v1/text/generation`
  }

  // Core method to call WatsonX / IBM Granite
  private async callWatsonx(
    prompt: string,
    options?: {
      temperature?: number
      maxTokens?: number
      topP?: number
      stopSequences?: string[]
    }
  ): Promise<string> {
    const iamToken = await this.getIAMToken()
    const baseUrl = this.getApiBaseUrl()

    const payload = {
      input: prompt,
      parameters: {
        decoding_method: options?.temperature ? 'sample' : 'greedy',
        max_new_tokens: options?.maxTokens || 1024,
        min_new_tokens: 1,
        temperature: options?.temperature || 0.7,
        top_p: options?.topP || 1.0,
        stop_sequences: options?.stopSequences || [],
        repetition_penalty: 1.05,
      },
      model_id: this.config.modelId,
      project_id: this.config.projectId,
    }

    try {
      const response = await axios.post(
        `${baseUrl}?version=${this.config.version}`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${iamToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      )

      if (response.data?.results?.[0]?.generated_text) {
        return response.data.results[0].generated_text
      }

      throw new Error('Unexpected response format from WatsonX')
    } catch (error: any) {
      console.error('WatsonX API call failed:', error.response?.data || error.message)

      // If it's an auth/permission error, throw clearly
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(`WatsonX authentication failed (${error.response.status}). Check WATSONX_API_KEY and WATSONX_PROJECT_ID.`)
      }
      if (error.response?.status === 404) {
        throw new Error(`WatsonX model "${this.config.modelId}" not found in project ${this.config.projectId}`)
      }

      throw new Error(`WatsonX generation failed: ${error.message}`)
    }
  }

  // Enhanced text generation with Watsonx Granite
  async generateText(prompt: string, options?: {
    temperature?: number
    maxTokens?: number
    topP?: number
  }): Promise<WatsonxResponse> {
    const startTime = Date.now()
    
    try {
      const generatedText = await this.callWatsonx(prompt, options)

      return {
        result: generatedText,
        confidence: 0.92,
        model: this.config.modelId,
        timestamp: new Date(),
      }
    } catch (error) {
      console.error('Watsonx text generation error:', error)
      throw new Error('Failed to generate text with Watsonx')
    }
  }

  // Text classification via Granite
  async classifyText(text: string, categories: string[]): Promise<{
    category: string
    confidence: number
    allScores: { category: string; score: number }[]
  }> {
    const prompt = `You are an AI classifier. Classify the following text into EXACTLY one of these categories: ${categories.join(', ')}

Text: "${text}"

IMPORTANT: Return ONLY a valid JSON object with no markdown formatting, no code blocks, and no additional text:
{
  "category": "exact_category_name",
  "confidence": 0.95,
  "reasoning": "brief explanation"
}`

    try {
      const text = await this.callWatsonx(prompt)

      try {
        // Try to extract JSON from the response
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text)
        return {
          category: parsed.category || categories[0],
          confidence: parsed.confidence || 0.5,
          allScores: categories.map(c => ({
            category: c,
            score: c === parsed.category ? parsed.confidence || 0.8 : (1 - (parsed.confidence || 0.5)) / (categories.length - 1),
          })),
        }
      } catch {
        // Fallback: find best matching category
        const lowerText = text.toLowerCase()
        let bestCategory = categories[0]
        let bestScore = 0

        for (const cat of categories) {
          const score = lowerText.includes(cat.toLowerCase()) ? 0.8 : 0.2
          if (score > bestScore) {
            bestScore = score
            bestCategory = cat
          }
        }

        return {
          category: bestCategory,
          confidence: 0.6,
          allScores: categories.map(c => ({ category: c, score: c === bestCategory ? bestScore : 0.2 })),
        }
      }
    } catch (error) {
      console.error('Watsonx classification error:', error)
      throw new Error('Failed to classify text')
    }
  }

  // Enhanced inspection analysis with Watsonx Granite
  async analyzeInspection(inspectionData: any): Promise<{
    riskAssessment: string
    recommendations: string[]
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    confidence: number
  }> {
    const prompt = `You are a safety inspection analyst. Analyze the following inspection data and provide a comprehensive assessment.

Inspection Data:
${JSON.stringify(inspectionData, null, 2)}

Consider:
- Violation severity and count
- Historical patterns
- Compliance trends
- Risk factors

Return ONLY a valid JSON object:
{
  "riskAssessment": "detailed risk assessment in 2-3 sentences",
  "recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "priority": "LOW or MEDIUM or HIGH or CRITICAL",
  "confidence": 0.95
}`

    try {
      const generatedText = await this.callWatsonx(prompt, { temperature: 0.3, maxTokens: 800 })

      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
        return JSON.parse(jsonMatch ? jsonMatch[0] : generatedText)
      } catch {
        return {
          riskAssessment: generatedText.substring(0, 300),
          recommendations: ['Review inspection data for details'],
          priority: 'MEDIUM',
          confidence: 0.6,
        }
      }
    } catch (error) {
      console.error('Watsonx inspection analysis error:', error)
      return {
        riskAssessment: 'Analysis temporarily unavailable',
        recommendations: ['Retry analysis later'],
        priority: 'MEDIUM',
        confidence: 0.3,
      }
    }
  }

  // Generate inspection report with Watsonx
  async generateInspectionReport(inspectionData: any): Promise<{
    summary: string
    findings: string[]
    recommendations: string[]
    conclusion: string
  }> {
    const prompt = `You are a professional report writer. Generate a comprehensive inspection report based on the following data:

Inspection Data:
${JSON.stringify(inspectionData, null, 2)}

Return ONLY a valid JSON object:
{
  "summary": "executive summary paragraph",
  "findings": ["finding 1", "finding 2", "finding 3"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "conclusion": "overall conclusion"
}`

    try {
      const generatedText = await this.callWatsonx(prompt, { temperature: 0.2, maxTokens: 1000 })

      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/)
        return JSON.parse(jsonMatch ? jsonMatch[0] : generatedText)
      } catch {
        return {
          summary: generatedText.substring(0, 300),
          findings: [],
          recommendations: [],
          conclusion: 'Automated report generation requires review',
        }
      }
    } catch (error) {
      console.error('Watsonx report generation error:', error)
      throw new Error('Failed to generate report')
    }
  }

  // Dynamic agent routing decision - makes orchestrator truly agentic
  async decideNextAgent(
    currentState: {
      currentAgent?: string
      results?: any
      inspectionId?: string
      inspectorId?: string
    }
  ): Promise<{
    nextAgent: string
    reasoning: string
    confidence: number
  }> {
    const agents = [
      'reality-verification',
      'trust-evolution',
      'systemic-risk',
      'report-generation',
      'route-optimization',
    ]

    const prompt = `You are the decision engine for a multi-agent AI inspection system. Based on the current workflow state, decide which agent should execute NEXT.

Available Agents:
${agents.map(a => `  - ${a}`).join('\n')}

Current State:
${JSON.stringify(currentState, null, 2)}

Agent Chain Rules:
1. Start with reality-verification if no current agent
2. After reality-verification: if verification fails → trust-evolution, else → report-generation
3. After trust-evolution: if risk is CRITICAL → systemic-risk, else → report-generation
4. After systemic-risk: → report-generation
5. After report-generation: if inspectorId exists → route-optimization, else complete
6. After route-optimization: complete

Return ONLY a valid JSON object:
{
  "nextAgent": "agent_name or 'complete' to finish",
  "reasoning": "brief explanation of why this agent was chosen",
  "confidence": 0.95
}`

    try {
      const result = await this.callWatsonx(prompt, { temperature: 0.1, maxTokens: 300 })

      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        return JSON.parse(jsonMatch ? jsonMatch[0] : result)
      } catch {
        // Fallback to deterministic routing
        return this.getFallbackRouting(currentState)
      }
    } catch (error) {
      console.error('Watsonx agent routing error:', error)
      return this.getFallbackRouting(currentState)
    }
  }

  private getFallbackRouting(state: { currentAgent?: string; results?: any; inspectorId?: string }): {
    nextAgent: string
    reasoning: string
    confidence: number
  } {
    if (!state.currentAgent) {
      return { nextAgent: 'reality-verification', reasoning: 'Initial state - start verification', confidence: 0.7 }
    }
    if (state.currentAgent === 'reality-verification') {
      const verified = state.results?.realityVerification?.verified
      return {
        nextAgent: verified === false ? 'trust-evolution' : 'report-generation',
        reasoning: verified === false ? 'Verification failed - update trust' : 'Passed - generate report',
        confidence: 0.7,
      }
    }
    if (state.currentAgent === 'trust-evolution') {
      return {
        nextAgent: state.results?.trustScore?.riskLevel === 'CRITICAL' ? 'systemic-risk' : 'report-generation',
        reasoning: 'Trust score evaluated',
        confidence: 0.7,
      }
    }
    if (state.currentAgent === 'systemic-risk') {
      return { nextAgent: 'report-generation', reasoning: 'Risk analysis complete', confidence: 0.7 }
    }
    if (state.currentAgent === 'report-generation') {
      return {
        nextAgent: state.inspectorId ? 'route-optimization' : 'complete',
        reasoning: state.inspectorId ? 'Optimize routes' : 'Workflow complete',
        confidence: 0.7,
      }
    }
    return { nextAgent: 'complete', reasoning: 'Workflow finished', confidence: 0.7 }
  }

  // Sentiment analysis
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
    confidence: number
    emotions: { emotion: string; score: number }[]
  }> {
    const prompt = `Analyze the sentiment of this text. Return ONLY a JSON object:

Text: "${text}"

{
  "sentiment": "POSITIVE or NEGATIVE or NEUTRAL",
  "confidence": 0.95,
  "emotions": [{"emotion": "joy", "score": 0.8}]
}`

    try {
      const result = await this.callWatsonx(prompt)
      const jsonMatch = result.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { sentiment: 'NEUTRAL', confidence: 0.5, emotions: [] }
    } catch (error) {
      console.error('Watsonx sentiment analysis error:', error)
      return { sentiment: 'NEUTRAL', confidence: 0.5, emotions: [] }
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
      provider: 'IBM Watsonx',
      capabilities: [
        'text-generation',
        'classification',
        'sentiment-analysis',
        'agent-routing',
        'inspection-analysis',
        'report-generation',
      ],
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; model: string; latency: number; configured: boolean }> {
    const start = Date.now()
    const configured = !!(this.config.apiKey && this.config.projectId)
    
    if (!configured) {
      return {
        status: 'not-configured',
        model: this.config.modelId,
        latency: 0,
        configured: false,
      }
    }

    try {
      await this.callWatsonx('Return the word "ok" and nothing else.', { maxTokens: 10 })
      const latency = Date.now() - start
      return { status: 'healthy', model: this.config.modelId, latency, configured: true }
    } catch (error) {
      return { status: 'unhealthy', model: this.config.modelId, latency: Date.now() - start, configured: true }
    }
  }
}

export const watsonxService = new WatsonxService()