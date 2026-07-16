// AI Chat Assistant Service
import Groq from 'groq-sdk'

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
  private groq: Groq | null = null
  private conversationHistory: Map<string, ChatMessage[]> = new Map()

  constructor() {
    const apiKey = process.env.GROQ_API_KEY
    if (apiKey) {
      this.groq = new Groq({ apiKey })
    }
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

  // Answer questions using the knowledge base (fallback when no API key)
  private answerFromKnowledgeBase(question: string): ChatResponse {
    const q = question.toLowerCase()
    let answer = ''
    const sources: string[] = []
    const relatedQuestions: string[] = []

    if (q.includes('kitchen') || q.includes('food') || q.includes('hygiene')) {
      answer = 'For kitchen inspections, key areas include: (1) Food storage at proper temperatures (refrigerator < 4°C, freezer < -18°C), (2) Staff must wear clean uniforms and hairnets, (3) All equipment must be clean and in working order, (4) No signs of pest activity, (5) Proper waste disposal and storage.'
      sources.push('Kitchen Inspection Rules')
      relatedQuestions.push('What are the critical violations for safety inspections?', 'How do I determine violation severity?', 'What evidence is required for documentation?')
    } else if (q.includes('safety') || q.includes('fire') || q.includes('emergency')) {
      answer = 'For safety inspections: (1) Fire extinguishers must be accessible and serviced, (2) Emergency exits must be clearly marked and unobstructed, (3) No exposed wiring with proper grounding, (4) First aid kit must be available and stocked, (5) PPE must be available where required.'
      sources.push('Safety Inspection Rules')
      relatedQuestions.push('How do I determine violation severity?', 'What are kitchen inspection rules?', 'What is the minimum compliance rate?')
    } else if (q.includes('violation') || q.includes('severity')) {
      answer = 'Violation severity levels: CRITICAL - Immediate health/safety risk (requires immediate action). HIGH - Significant compliance issue (action within 7 days). MEDIUM - Moderate compliance issue (action within 30 days). LOW - Minor issue (address at next inspection).'
      sources.push('Violation Severity Levels')
      relatedQuestions.push('What is the minimum compliance rate for passing?', 'What are kitchen inspection rules?', 'How does the inspection workflow work?')
    } else if (q.includes('compliance') || q.includes('pass') || q.includes('rate')) {
      answer = 'Quality Standards: (1) Minimum 70% compliance rate required for passing, (2) All critical violations must be resolved, (3) Evidence must be clear and timestamped, (4) Reports must be detailed and accurate.'
      sources.push('Quality Standards')
      relatedQuestions.push('What are the critical violations for kitchen inspections?', 'How do I determine violation severity?', 'What evidence is required?')
    } else if (q.includes('workflow') || q.includes('process') || q.includes('step')) {
      answer = 'Inspection Workflow: (1) Arrive at site and verify identity, (2) Review previous inspection reports, (3) Conduct systematic inspection following checklist, (4) Capture evidence for all findings, (5) Document violations with severity levels, (6) Provide preliminary findings to site management, (7) Submit final report within 24 hours.'
      sources.push('Inspection Workflow')
      relatedQuestions.push('What are the critical violations for kitchen inspections?', 'How do I determine violation severity?', 'What is the minimum compliance rate?')
    } else if (q.includes('evidence') || q.includes('document')) {
      answer = 'For evidence documentation: (1) Evidence must be captured for all critical violations, (2) Evidence must be clear and timestamped, (3) Reports must be detailed and accurate, (4) Upload images with proper descriptions for each finding.'
      sources.push('Inspection Protocols', 'Quality Standards')
      relatedQuestions.push('How do I determine violation severity?', 'What is the minimum compliance rate for passing?', 'What are kitchen inspection rules?')
    } else if (q.includes('building') || q.includes('structural')) {
      answer = 'Building inspection rules: (1) Structural integrity - no visible damage or deterioration, (2) Electrical systems compliant with local codes, (3) Plumbing - no leaks, proper drainage, (4) Fire safety compliant with fire codes, (5) Must meet accessibility standards.'
      sources.push('Building Inspection Rules')
      relatedQuestions.push('What are safety inspection rules?', 'What are environmental inspection rules?', 'How do I determine violation severity?')
    } else if (q.includes('environment') || q.includes('waste') || q.includes('water')) {
      answer = 'Environmental inspection rules: (1) Proper waste segregation and disposal, (2) Water quality must meet local standards, (3) Ventilation must be adequate, (4) Hazardous materials properly stored and labeled, (5) Noise levels within permitted limits.'
      sources.push('Environmental Inspection Rules')
      relatedQuestions.push('What are building inspection rules?', 'What are safety inspection rules?', 'How do I determine violation severity?')
    } else if (q.includes('guide') || q.includes('website') || q.includes('how to') || q.includes('navigate')) {
      answer = 'Welcome to NIRIKSHA! Here is how to use the platform:\n\n1. **Landing Page**: Learn about our 6 AI agents (Risk Prioritization, Route Optimization, Reality Verification, Report Generation, Pattern Detection, Regulatory Knowledge).\n2. **Sign Up / Login**: Create an account or sign in using the buttons in the top right.\n3. **Demo Mode**: Click "Admin Demo", "Supervisor Demo", or "Inspector Demo" to explore without signing up.\n4. **Dashboards**: Each role has a dedicated dashboard - Admin for management, Supervisor for reviews, Inspector for field inspections.\n5. **Features**: Explore AI Features, Compliance Memory, Architecture, and Violation SLA pages from the navigation.\n\nTry clicking the "Try Demo" button or "Sign In" to get started!'
      sources.push('NIRIKSHA Platform Guide')
      relatedQuestions.push('What are the key features of NIRIKSHA?', 'How do I conduct an inspection?', 'What AI agents are available?')
    } else {
      answer = 'I can help you with information about NIRIKSHA inspection rules, violation severity levels, inspection workflows, and compliance standards. Try asking about:\n\n- Kitchen inspection rules\n- Safety inspection guidelines\n- Violation severity levels\n- Compliance requirements\n- Inspection workflows\n- How to navigate this website'
      sources.push('Inspection Rules', 'NIRIKSHA Guide')
      relatedQuestions.push('What are the critical violations for kitchen inspections?', 'How do I determine violation severity?', 'What is the minimum compliance rate for passing?')
    }

    return { answer, confidence: 0.9, sources, relatedQuestions }
  }

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

      // If no Groq API key, use knowledge base
      if (!this.groq) {
        const response = this.answerFromKnowledgeBase(question)
        this.conversationHistory.get(sessionId)!.push({
          role: 'assistant',
          content: response.answer,
          timestamp: new Date(),
        })
        return response
      }

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

      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert inspection rules assistant. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const text = completion.choices[0]?.message?.content || '{}'

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
      // Fallback to knowledge base on API error
      const response = this.answerFromKnowledgeBase(question)
      this.conversationHistory.get(sessionId)!.push({
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
      })
      return response
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
    if (!this.groq) {
      return [
        'What are the critical violations for kitchen inspections?',
        'How do I determine violation severity?',
        'What evidence is required for documentation?',
        'What is the minimum compliance rate for passing?',
        'How should I handle emergency situations during inspection?',
      ]
    }

    const prompt = `
      Based on the following context, suggest 5 relevant questions an inspector might ask:

      Context: ${context}

      Return a JSON array of questions:
      ["question1", "question2", "question3", "question4", "question5"]

      Questions should be practical and relevant to inspection work.
    `

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert inspection assistant. Respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })
      const text = completion.choices[0]?.message?.content || '[]'

      try {
        const parsed = JSON.parse(text)
        return Array.isArray(parsed) ? parsed : parsed.questions || []
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