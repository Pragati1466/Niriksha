// Multi-Agent Orchestrator
import { AgentState, AgentResults } from './types'
import { RealityVerificationAgent } from './reality-verification-agent'
import { TrustEvolutionAgent } from './trust-evolution-agent'
import { SystemicRiskDiscoveryAgent } from './systemic-risk-agent'
import { ReportGenerationAgent } from './report-generation-agent'
import { RouteOptimizationAgent } from './route-optimization-agent'
import { complianceMemory } from '../services/complianceMemory'
import { watsonxService } from '../services/watsonxService'

export class AgentOrchestrator {
  private realityVerificationAgent: RealityVerificationAgent
  private trustEvolutionAgent: TrustEvolutionAgent
  private systemicRiskAgent: SystemicRiskDiscoveryAgent
  private reportGenerationAgent: ReportGenerationAgent
  private routeOptimizationAgent: RouteOptimizationAgent

  constructor() {
    this.realityVerificationAgent = new RealityVerificationAgent()
    this.trustEvolutionAgent = new TrustEvolutionAgent()
    this.systemicRiskAgent = new SystemicRiskDiscoveryAgent()
    this.reportGenerationAgent = new ReportGenerationAgent()
    this.routeOptimizationAgent = new RouteOptimizationAgent()
  }

  // Decision Node: Determine Next Agent
  // Uses WatsonX LLM for dynamic, context-aware routing when available
  // Falls back to deterministic rule-based routing
  private determineNextAgent(state: AgentState): string {
    const deterministicNext = this.deterministicRouting(state)
    return deterministicNext
  }

  // LLM-powered dynamic routing
  private async llmRouting(state: AgentState): Promise<string> {
    try {
      const decision = await watsonxService.decideNextAgent({
        currentAgent: state.currentAgent,
        results: state.results,
        inspectionId: state.inspectionId,
        inspectorId: state.inspectorId,
      })
      return decision.nextAgent || this.deterministicRouting(state)
    } catch (error) {
      console.warn('LLM routing failed, using deterministic fallback:', error)
      return this.deterministicRouting(state)
    }
  }

  // Deterministic fallback routing
  private deterministicRouting(state: AgentState): string {
    const { currentAgent, results } = state

    // Initial state - start with reality verification
    if (!currentAgent) {
      return 'reality-verification'
    }

    // After reality verification, decide based on results
    if (currentAgent === 'reality-verification') {
      const verification = results?.realityVerification
      if (verification && !verification.verified) {
        // If verification failed, update trust score
        return 'trust-evolution'
      }
      // If verification passed, proceed to report generation
      return 'report-generation'
    }

    // After trust evolution, decide based on risk level
    if (currentAgent === 'trust-evolution') {
      const trustScore = results?.trustScore
      if (trustScore && trustScore.riskLevel === 'CRITICAL') {
        // High risk - trigger systemic risk analysis
        return 'systemic-risk'
      }
      // Normal risk - proceed to report generation
      return 'report-generation'
    }

    // After systemic risk analysis, always generate report
    if (currentAgent === 'systemic-risk') {
      return 'report-generation'
    }

    // After report generation, check if route optimization is needed
    if (currentAgent === 'report-generation') {
      if (state.inspectorId) {
        return 'route-optimization'
      }
      return 'complete'
    }

    // After route optimization, complete
    if (currentAgent === 'route-optimization') {
      return 'complete'
    }

    return 'complete'
  }

  // Decision Node: Should Continue Workflow
  private shouldContinueWorkflow(state: AgentState): boolean {
    const nextAgent = this.determineNextAgent(state)
    return nextAgent !== 'complete'
  }

  // Decision Node: Handle Errors
  private async handleErrors(state: AgentState): Promise<Partial<AgentState>> {
    const { errors, retryCount, maxRetries } = state

    if (!errors || errors.length === 0) {
      return state
    }

    if ((retryCount || 0) >= (maxRetries || 3)) {
      // Max retries reached, log error and continue
      console.error('Max retries reached for agent:', state.currentAgent)
      return {
        ...state,
        errors: [],
      }
    }

    // Retry the current agent
    return {
      ...state,
      retryCount: (retryCount || 0) + 1,
    }
  }

  // Execute Single Agent
  public async executeAgent(agentName: string, state: AgentState): Promise<AgentState> {
    switch (agentName) {
      case 'reality-verification':
        return await this.realityVerificationAgent.execute(state)
      case 'trust-evolution':
        return await this.trustEvolutionAgent.execute(state)
      case 'systemic-risk':
        return await this.systemicRiskAgent.execute(state)
      case 'report-generation':
        return await this.reportGenerationAgent.execute(state)
      case 'route-optimization':
        return await this.routeOptimizationAgent.execute(state)
      default:
        throw new Error(`Unknown agent: ${agentName}`)
    }
  }

  // Main Workflow: Inspection Processing
  async processInspection(state: AgentState): Promise<AgentState> {
    let currentState: AgentState = { 
      ...state, 
      maxRetries: state.maxRetries || 3,
      retryCount: state.retryCount || 0,
      errors: state.errors || [],
      results: state.results || {},
    }
    const workflowLog: string[] = []

    workflowLog.push(`Starting inspection workflow for inspection ${state.inspectionId}`)

    while (this.shouldContinueWorkflow(currentState)) {
      const nextAgent = this.determineNextAgent(currentState)
      workflowLog.push(`Executing agent: ${nextAgent}`)

      try {
        currentState = await this.executeAgent(nextAgent, currentState)
        workflowLog.push(`Agent ${nextAgent} completed successfully`)

        // Clear errors on success
        currentState.errors = []
        currentState.retryCount = 0
      } catch (error) {
        console.error(`Agent ${nextAgent} failed:`, error)
        currentState.errors = [
          ...(currentState.errors || []),
          `${nextAgent}: ${error}`,
        ]

        // Handle errors with retry logic
        currentState = await this.handleErrors(currentState) as AgentState

        if (currentState.errors && currentState.errors.length > 0) {
          workflowLog.push(`Agent ${nextAgent} failed after retries, continuing workflow`)
          currentState.errors = []
        }
      }
    }

    workflowLog.push('Inspection workflow completed')

    // Store workflow log in memory
    if (state.inspectionId) {
      await complianceMemory.recordWorkflowEvent(state.inspectionId, workflowLog)
    }

    return currentState
  }

  // Workflow: Trust Score Update
  async updateTrustScore(inspectorId: string): Promise<AgentState> {
    const state: AgentState = {
      inspectorId,
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    return await this.trustEvolutionAgent.execute(state)
  }

  // Workflow: Risk Analysis
  async analyzeRisk(): Promise<AgentState> {
    const state: AgentState = {
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    return await this.systemicRiskAgent.execute(state)
  }

  // Workflow: Route Optimization
  async optimizeRoute(inspectorId: string): Promise<AgentState> {
    const state: AgentState = {
      inspectorId,
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    return await this.routeOptimizationAgent.execute(state)
  }

  // Workflow: Report Generation
  async generateReport(inspectionId: string): Promise<AgentState> {
    const state: AgentState = {
      inspectionId,
      currentAgent: '',
      errors: [],
      retryCount: 0,
      maxRetries: 3,
      results: {},
    }

    return await this.reportGenerationAgent.execute(state)
  }

  // Parallel Workflow: Multiple Agents
  async executeParallelAgents(state: AgentState, agents: string[]): Promise<AgentState> {
    const promises = agents.map(agent => this.executeAgent(agent, { ...state }))
    const results = await Promise.allSettled(promises)

    let currentState = { ...state, results: {} }

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        currentState.results = {
          ...currentState.results,
          ...result.value.results,
        }
      } else {
        currentState.errors = [
          ...(currentState.errors || []),
          `${agents[index]}: ${result.reason}`,
        ]
      }
    })

    return currentState
  }

  // Get Workflow Status
  getWorkflowStatus(state: AgentState): {
    currentAgent: string
    completedAgents: string[]
    remainingAgents: string[]
    errors: string[]
    progress: number
  } {
    const agentOrder = [
      'reality-verification',
      'trust-evolution',
      'systemic-risk',
      'report-generation',
      'route-optimization',
    ]

    const currentIndex = agentOrder.indexOf(state.currentAgent || '')
    const completedAgents = currentIndex >= 0 ? agentOrder.slice(0, currentIndex) : []
    const remainingAgents = currentIndex >= 0 ? agentOrder.slice(currentIndex + 1) : agentOrder

    return {
      currentAgent: state.currentAgent || 'not-started',
      completedAgents,
      remainingAgents,
      errors: state.errors || [],
      progress: (completedAgents.length / agentOrder.length) * 100,
    }
  }

  // Get All Agent Configurations
  getAllAgentConfigs() {
    return {
      realityVerification: this.realityVerificationAgent.getConfig(),
      trustEvolution: this.trustEvolutionAgent.getConfig(),
      systemicRisk: this.systemicRiskAgent.getConfig(),
      reportGeneration: this.reportGenerationAgent.getConfig(),
      routeOptimization: this.routeOptimizationAgent.getConfig(),
    }
  }

  // Reset Agent Memory
  async resetMemory() {
    return complianceMemory.resetDevelopmentMemory()
  }

  // Get Memory Statistics
  async getMemoryStats() {
    return complianceMemory.getMemoryStats()
  }
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator()
