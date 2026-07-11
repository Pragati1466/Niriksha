// Agent Memory System
import { AgentState, TrustScoreResult, RiskAnalysisResult } from './types'

export class AgentMemory {
  private memory: Map<string, any> = new Map()
  private inspectorHistory: Map<string, any[]> = new Map()
  private riskHistory: Map<string, any[]> = new Map()

  constructor() {
    this.initializeMemory()
  }

  private initializeMemory() {
    // Initialize with empty collections
    this.memory.set('global', {
      totalInspections: 0,
      totalViolations: 0,
      averageConfidence: 0,
      lastUpdated: new Date(),
    })
  }

  // Global memory operations
  setGlobal(key: string, value: any) {
    const global = this.memory.get('global') || {}
    global[key] = value
    global.lastUpdated = new Date()
    this.memory.set('global', global)
  }

  getGlobal(key: string): any {
    const global = this.memory.get('global') || {}
    return global[key]
  }

  // Inspector-specific memory
  setInspectorMemory(inspectorId: string, data: any) {
    if (!this.inspectorHistory.has(inspectorId)) {
      this.inspectorHistory.set(inspectorId, [])
    }
    const history = this.inspectorHistory.get(inspectorId)!
    history.push({
      ...data,
      timestamp: new Date(),
    })
    this.inspectorHistory.set(inspectorId, history)
  }

  getInspectorMemory(inspectorId: string): any[] {
    return this.inspectorHistory.get(inspectorId) || []
  }

  getInspectorTrustHistory(inspectorId: string): TrustScoreResult[] {
    const history = this.getInspectorMemory(inspectorId)
    return history.filter(item => item.type === 'TRUST_SCORE').map(item => item.data)
  }

  // Risk analysis memory
  setRiskAnalysis(areaId: string, data: any) {
    if (!this.riskHistory.has(areaId)) {
      this.riskHistory.set(areaId, [])
    }
    const history = this.riskHistory.get(areaId)!
    history.push({
      ...data,
      timestamp: new Date(),
    })
    this.riskHistory.set(areaId, history)
  }

  getRiskHistory(areaId: string): any[] {
    return this.riskHistory.get(areaId) || []
  }

  // Session memory for current workflow
  setSession(sessionId: string, state: AgentState) {
    this.memory.set(`session:${sessionId}`, state)
  }

  getSession(sessionId: string): AgentState | undefined {
    return this.memory.get(`session:${sessionId}`)
  }

  clearSession(sessionId: string) {
    this.memory.delete(`session:${sessionId}`)
  }

  // Agent-specific memory
  setAgentMemory(agentName: string, key: string, value: any) {
    const agentKey = `agent:${agentName}`
    const agentMemory = this.memory.get(agentKey) || {}
    agentMemory[key] = value
    agentMemory.lastUpdated = new Date()
    this.memory.set(agentKey, agentMemory)
  }

  getAgentMemory(agentName: string, key: string): any {
    const agentKey = `agent:${agentName}`
    const agentMemory = this.memory.get(agentKey) || {}
    return agentMemory[key]
  }

  // Clear old memory (cleanup)
  clearOldMemory(daysToKeep: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // Clean inspector history
    this.inspectorHistory.forEach((history, inspectorId) => {
      const filtered = history.filter(item => 
        new Date(item.timestamp) > cutoffDate
      )
      this.inspectorHistory.set(inspectorId, filtered)
    })

    // Clean risk history
    this.riskHistory.forEach((history, areaId) => {
      const filtered = history.filter(item => 
        new Date(item.timestamp) > cutoffDate
      )
      this.riskHistory.set(areaId, filtered)
    })
  }

  // Export memory for persistence
  exportMemory(): any {
    return {
      global: this.memory.get('global'),
      inspectorHistory: Object.fromEntries(this.inspectorHistory),
      riskHistory: Object.fromEntries(this.riskHistory),
      exportDate: new Date(),
    }
  }

  // Import memory from persistence
  importMemory(data: any) {
    if (data.global) {
      this.memory.set('global', data.global)
    }
    if (data.inspectorHistory) {
      Object.entries(data.inspectorHistory).forEach(([key, value]) => {
        this.inspectorHistory.set(key, value as any[])
      })
    }
    if (data.riskHistory) {
      Object.entries(data.riskHistory).forEach(([key, value]) => {
        this.riskHistory.set(key, value as any[])
      })
    }
  }

  // Get statistics
  getMemoryStats() {
    return {
      totalMemoryEntries: this.memory.size,
      inspectorHistories: this.inspectorHistory.size,
      riskHistories: this.riskHistory.size,
      lastGlobalUpdate: this.getGlobal('lastUpdated'),
    }
  }
}

// Singleton instance
export const agentMemory = new AgentMemory()
