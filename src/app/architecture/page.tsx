'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/shared/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, Shield, BarChart3, Route, FileText, 
  Activity, ArrowRight, ArrowDown, RefreshCw,
  CheckCircle, AlertTriangle, Zap, Database,
  Users, Building2, ClipboardCheck, Eye
} from 'lucide-react'

interface AgentNode {
  id: string
  name: string
  icon: React.ReactNode
  description: string
  color: string
  status: 'active' | 'idle' | 'error'
  metrics: { label: string; value: string }[]
}

const agents: AgentNode[] = [
  {
    id: 'reality-verification',
    name: 'Reality Verification Agent',
    icon: <Eye className="w-5 h-5" />,
    description: 'AI-powered verification of inspection data against visual evidence using computer vision and EXIF analysis',
    color: 'from-blue-500 to-cyan-500',
    status: 'active',
    metrics: [
      { label: 'Accuracy', value: '94.2%' },
      { label: 'Images Analyzed', value: '1,247' },
      { label: 'Inconsistencies Found', value: '89' },
    ],
  },
  {
    id: 'trust-evolution',
    name: 'Trust Evolution Agent',
    icon: <Shield className="w-5 h-5" />,
    description: 'Dynamic trust scoring system that evolves based on inspector accuracy, consistency, and compliance history',
    color: 'from-purple-500 to-pink-500',
    status: 'active',
    metrics: [
      { label: 'Active Profiles', value: '156' },
      { label: 'Avg Trust Score', value: '87.3' },
      { label: 'Flagged Inspectors', value: '12' },
    ],
  },
  {
    id: 'systemic-risk',
    name: 'Systemic Risk Agent',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Identifies patterns of systemic non-compliance across departments, sites, and time periods',
    color: 'from-orange-500 to-red-500',
    status: 'active',
    metrics: [
      { label: 'Risk Patterns', value: '23' },
      { label: 'High-Risk Sites', value: '8' },
      { label: 'Repeat Offenders', value: '15' },
    ],
  },
  {
    id: 'report-generation',
    name: 'Report Generation Agent',
    icon: <FileText className="w-5 h-5" />,
    description: 'Generates comprehensive inspection reports with AI-written summaries, findings, and legal references',
    color: 'from-green-500 to-emerald-500',
    status: 'active',
    metrics: [
      { label: 'Reports Generated', value: '892' },
      { label: 'Avg Generation Time', value: '3.2s' },
      { label: 'PDF Downloads', value: '567' },
    ],
  },
  {
    id: 'route-optimization',
    name: 'Route Optimization Agent',
    icon: <Route className="w-5 h-5" />,
    description: 'Optimizes inspector routes based on priority, location, traffic, and compliance urgency',
    color: 'from-yellow-500 to-amber-500',
    status: 'idle',
    metrics: [
      { label: 'Routes Optimized', value: '345' },
      { label: 'Time Saved', value: '127h' },
      { label: 'Fuel Saved', value: '340L' },
    ],
  },
]

const dataFlows = [
  { from: 'Inspector App', to: 'Reality Verification Agent', description: 'Submits inspection data with images' },
  { from: 'Reality Verification Agent', to: 'Trust Evolution Agent', description: 'Verification failures trigger trust updates' },
  { from: 'Reality Verification Agent', to: 'Report Generation Agent', description: 'Verified data flows to report generation' },
  { from: 'Trust Evolution Agent', to: 'Systemic Risk Agent', description: 'Critical trust scores trigger risk analysis' },
  { from: 'Systemic Risk Agent', to: 'Report Generation Agent', description: 'Risk patterns included in reports' },
  { from: 'Report Generation Agent', to: 'Route Optimization Agent', description: 'Completed reports enable route planning' },
  { from: 'Compliance Memory', to: 'All Agents', description: 'Historical context for every decision' },
]

export default function ArchitecturePage() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)

  useEffect(() => {
    fetchMemoryStats()
  }, [])

  const fetchMemoryStats = async () => {
    try {
      const response = await fetch('/api/agents/memory-stats')
      const data = await response.json()
      setMemoryStats(data.stats)
    } catch (error) {
      console.error('Error fetching memory stats:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Brain className="w-8 h-8 text-purple-400" />
            Multi-Agent System Architecture
          </h1>
          <p className="text-gray-400 mt-2">
            NIRIKSHA operates on a distributed multi-agent architecture where specialized AI agents collaborate autonomously.
            Each agent has a specific role, and the orchestrator routes work dynamically based on real-time results.
          </p>
        </div>

        {/* Architecture Overview */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm px-3 py-1">
                <Zap className="w-3 h-3 mr-1" />
                LLM-Powered Orchestrator
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm px-3 py-1">
                <Database className="w-3 h-3 mr-1" />
                Compliance Memory
              </Badge>
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm px-3 py-1">
                <RefreshCw className="w-3 h-3 mr-1" />
                Feedback Loop
              </Badge>
            </div>

            {/* Agent Flow Diagram */}
            <div className="relative">
              {/* Central Orchestrator */}
              <div className="text-center mb-8">
                <div className="inline-block p-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 shadow-lg">
                  <Brain className="w-8 h-8 text-white mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">AI Orchestrator</p>
                  <p className="text-white/60 text-xs">WatsonX Granite Powered</p>
                </div>
                <ArrowDown className="w-5 h-5 text-purple-400 mx-auto mt-2" />
              </div>

              {/* Agent Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
                    className={`text-left p-4 rounded-xl border transition-all ${
                      selectedAgent === agent.id
                        ? 'border-purple-500 bg-slate-700/50 ring-1 ring-purple-500/50'
                        : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${agent.color} flex items-center justify-center mb-3`}>
                      {agent.icon}
                    </div>
                    <p className="text-white text-sm font-semibold mb-1">{agent.name}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-green-400 animate-pulse' :
                        agent.status === 'idle' ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                      <span className="text-xs text-gray-400 capitalize">{agent.status}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected Agent Details */}
              {selectedAgent && (
                <Card className="bg-slate-700/50 border-slate-600 mb-8">
                  <CardContent className="p-4">
                    {(() => {
                      const agent = agents.find(a => a.id === selectedAgent)
                      if (!agent) return null
                      return (
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${agent.color} flex items-center justify-center flex-shrink-0`}>
                            {agent.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold mb-1">{agent.name}</h3>
                            <p className="text-gray-400 text-sm mb-3">{agent.description}</p>
                            <div className="grid grid-cols-3 gap-4">
                              {agent.metrics.map((metric, i) => (
                                <div key={i} className="bg-slate-800/50 rounded-lg p-2 text-center">
                                  <p className="text-white font-bold text-lg">{metric.value}</p>
                                  <p className="text-gray-500 text-xs">{metric.label}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* Data Flow */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <ArrowRight className="w-5 h-5 text-purple-400" />
                    Agent Communication & Data Flow
                  </CardTitle>
                  <CardDescription>How agents pass data and trigger each other</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dataFlows.map((flow, index) => (
                      <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/30 transition-colors">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-purple-300 text-sm font-medium truncate">{flow.from}</span>
                          <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-cyan-300 text-sm font-medium truncate">{flow.to}</span>
                        </div>
                        <span className="text-gray-500 text-xs hidden sm:block">{flow.description}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* ORDI & Trust Score Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                ORDI - Operational Reality Divergence Index
              </CardTitle>
              <CardDescription>
                A novel metric that quantifies the gap between reported and verified inspection reality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm">
                    <strong className="text-white">ORDI</strong> measures how much an inspection's reported findings 
                    diverge from AI-verified reality. Lower scores indicate higher trustworthiness.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <p className="text-green-400 text-2xl font-bold">{'<'} 15</p>
                    <p className="text-gray-400 text-xs">Low Divergence</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                    <p className="text-yellow-400 text-2xl font-bold">15-30</p>
                    <p className="text-gray-400 text-xs">Medium Divergence</p>
                  </div>
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                    <p className="text-orange-400 text-2xl font-bold">30-50</p>
                    <p className="text-gray-400 text-xs">High Divergence</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-2xl font-bold">{'>'} 50</p>
                    <p className="text-gray-400 text-xs">Critical Divergence</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" />
                Trust Score Feedback Loop
              </CardTitle>
              <CardDescription>
                Continuous evolution of inspector trust based on AI verification outcomes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 p-4">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                    <p className="text-green-400 text-xs">Verified</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500 flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                    <p className="text-blue-400 text-xs">Trust +</p>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-500" />
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500 flex items-center justify-center mx-auto mb-2">
                      <Brain className="w-8 h-8 text-purple-400" />
                    </div>
                    <p className="text-purple-400 text-xs">Learn</p>
                  </div>
                </div>
                <p className="text-gray-400 text-sm text-center">
                  Each verification outcome updates the inspector's trust score, 
                  which influences future inspection routing and review requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Memory Stats */}
        {memoryStats && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                Compliance Memory Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(memoryStats).map(([key, value]: [string, any]) => (
                  <div key={key} className="bg-slate-700/50 rounded-lg p-3 text-center">
                    <p className="text-white font-bold text-lg">
                      {typeof value === 'number' ? value.toLocaleString() : String(value)}
                    </p>
                    <p className="text-gray-500 text-xs capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}