// AI Chat Assistant Service
import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ChatResponse {
  answer: string
  confidence: number
  sources: string[]
  relatedQuestions: string[]
}

export class ChatAssistantService {
  private genAI: GoogleGenerativeAI
  private model: any
  private conversationHistory: Map<string, ChatMessage[]> = new Map()

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  // Knowledge base of inspection rules
  private inspectionRules = `
  NIRIKSHA INSPECTION RULES AND GUIDELINES:

  GENERAL INSPECTION PROTOCOLS:
  1. All inspections must be conducted by certified inspectors
  2. Checklist items marked as "required" must be completed
  3. Evidence must be captured for all critical violations
  4. Inspections should be conducted during business hours unless specified
  5. Inspector must maintain professional conduct throughout

  KITCHEN INSPECTION RULES:
  - Food storage: Must be at proper temperatures (refrigerator < 4°C, freezer < -18°C)
  - Hygiene: Staff must wear clean uniforms and hairnets
  - Equipment: All equipment must be clean and in working order
  - Pest control: No signs of pest activity
  - Waste management: Proper disposal and storage of waste

  SAFETY INSPECTION RULES:
  - Fire safety: Fire extinguishers must be accessible and serviced
  - Emergency exits: Must be clearly marked and unobstructed
  - Electrical: No exposed wiring, proper grounding
  - First aid: First aid kit must be available and stocked
  - PPE: Personal protective equipment must be available where required

  ENVIRONMENTAL INSPECTION RULES:
  - Waste disposal: Proper segregation and disposal
  - Water quality: Must meet local standards
  - Air quality: Ventilation must be adequate
  - Hazardous materials: Proper storage and labeling
  - Noise levels: Must be within permitted limits

  BUILDING INSPECTION RULES:
  - Structural integrity: No visible damage or deterioration
  - Electrical systems: Compliant with local codes
  - Plumbing: No leaks, proper drainage
  - Fire safety: Compliant with fire codes
  - Accessibility: Must meet accessibility standards

  VIOLATION SEVERITY LEVELS:
  - CRITICAL: Immediate health/safety risk, requires immediate action
  - HIGH: Significant compliance issue, action within 7 days
  - MEDIUM: Moderate compliance issue, action within 30 days
  - LOW: Minor issue, address at next inspection

  INSPECTION WORKFLOW:
  1. Arrive at site and verify identity
  2. Review previous inspection reports
  3. Conduct systematic inspection following checklist
  4. Capture evidence for all findings
  5. Document violations with severity levels
  6. Provide preliminary findings to site management
  7. Submit final report within 24 hours

  QUALITY STANDARDS:
  - Minimum 70% compliance rate required for passing
  - All critical violations must be resolved
  - Evidence must be clear and timestamped
  - Reports must be detailed and accurate
  `

  // Ask question about inspection rules
  async askQuestion(
    sessionId: string,
    question: string,
    context?: string
  ): Promise<ChatResponse> {
    try {
      // Add user message to history
      if (!this.conversationHistory.has(sessionId)) {
        this.conversationHistory.set(sessionId, [])
      }
      this.conversationHistory.get(sessionId)!.push({
        role: 'user',
        content: question,
        timestamp: new Date(),
      })

      // Build conversation context
      const history = this.conversationHistory.get(sessionId) || []
      const historyText = history
        .slice(-5) // Last 5 messages for context
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n')

      const prompt = `
      You are an expert inspection rules assistant for NIRIKSHA. Answer the user's question based on the inspection rules and guidelines.

      INSPECTION RULES:
      ${this.inspectionRules}

      CONVERSATION HISTORY:
      ${historyText}

      ADDITIONAL CONTEXT:
      ${context || 'None'}

      USER QUESTION:
      ${question}

      Return a JSON response with:
      {
        "answer": "Detailed, accurate answer based on inspection rules",
        "confidence": 0.95,
        "sources": ["rule1", "rule2"],
        "relatedQuestions": ["related1", "related2", "related3"]
      }

      Be specific, cite the relevant rules, and provide practical guidance.
      `

      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        const parsedResponse = JSON.parse(text)

        // Add assistant response to history
        this.conversationHistory.get(sessionId)!.push({
          role: 'assistant',
          content: parsedResponse.answer,
          timestamp: new Date(),
        })

        return parsedResponse
      } catch {
        // Fallback if JSON parsing fails
        const fallbackResponse: ChatResponse = {
          answer: text,
          confidence: 0.7,
          sources: ['Inspection Rules'],
          relatedQuestions: [],
        }

        this.conversationHistory.get(sessionId)!.push({
          role: 'assistant',
          content: text,
          timestamp: new Date(),
        })

        return fallbackResponse
      }
    } catch (error) {
      console.error('Chat assistant error:', error)
      throw new Error('Failed to process question')
    }
  }

  // Get conversation history
  getConversationHistory(sessionId: string): ChatMessage[] {
    return this.conversationHistory.get(sessionId) || []
  }

  // Clear conversation history
  clearConversation(sessionId: string): void {
    this.conversationHistory.delete(sessionId)
  }

  // Suggest related questions based on context
  async suggestQuestions(context: string): Promise<string[]> {
    const prompt = `
      Based on the following context, suggest 5 relevant questions an inspector might ask:

      Context: ${context}

      Return a JSON array of questions:
      ["question1", "question2", "question3", "question4", "question5"]

      Questions should be practical and relevant to inspection work.
    `

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      try {
        return JSON.parse(text)
      } catch {
        return [
          'What are the critical violations for kitchen inspections?',
          'How do I determine violation severity?',
          'What evidence is required for documentation?',
          'What is the minimum compliance rate for passing?',
          'How should I handle emergency situations during inspection?',
        ]
      }
    } catch (error) {
      console.error('Suggest questions error:', error)
      return []
    }
  }

  // Get rule summary by category
  getRuleSummary(category: string): string {
    const categoryRules: Record<string, string> = {
      kitchen: 'Kitchen inspections focus on food safety, hygiene, equipment, pest control, and waste management. Critical areas include temperature control, staff hygiene, and sanitation.',
      safety: 'Safety inspections cover fire safety, emergency exits, electrical systems, first aid, and PPE requirements. Critical violations include blocked exits and missing fire extinguishers.',
      environmental: 'Environmental inspections address waste disposal, water quality, air quality, hazardous materials, and noise levels. Critical issues include improper hazardous material storage.',
      building: 'Building inspections assess structural integrity, electrical systems, plumbing, fire safety, and accessibility. Critical violations include structural damage and fire code violations.',
      general: 'General inspection protocols require certified inspectors, completion of required checklist items, evidence capture for violations, and professional conduct throughout the process.',
    }

    return categoryRules[category.toLowerCase()] || 'Category not found. Available categories: kitchen, safety, environmental, building, general.'
  }
}

export const chatAssistant = new ChatAssistantService()
