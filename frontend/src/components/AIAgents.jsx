import React from 'react'
import { Card, CardContent } from './ui/Card'
import Badge from './ui/Badge'
import { Brain, Route, ShieldCheck, FileText, TrendingUp, BookOpen, ArrowRight, Activity } from 'lucide-react'

const AIAgents = () => {
  const agents = [
    {
      name: 'Risk Prioritization Agent',
      icon: Brain,
      description: 'Analyzes inspection data to identify high-risk areas and prioritize inspections based on historical patterns and real-time data.',
      status: 'active',
      confidence: 94,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      name: 'Route Planning Agent',
      icon: Route,
      description: 'Optimizes inspection routes to minimize travel time and maximize coverage using advanced algorithms.',
      status: 'active',
      confidence: 89,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      name: 'Evidence Verification Agent',
      icon: ShieldCheck,
      description: 'Automatically verifies evidence authenticity using computer vision and metadata analysis.',
      status: 'active',
      confidence: 92,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Report Generation Agent',
      icon: FileText,
      description: 'Generates comprehensive inspection reports with AI-powered insights and recommendations.',
      status: 'active',
      confidence: 88,
      color: 'from-orange-500 to-red-500',
    },
    {
      name: 'Pattern Detection Agent',
      icon: TrendingUp,
      description: 'Identifies patterns and trends across inspections to predict future compliance issues.',
      status: 'learning',
      confidence: 76,
      color: 'from-indigo-500 to-purple-500',
    },
    {
      name: 'Regulatory Knowledge Agent',
      icon: BookOpen,
      description: 'Maintains up-to-date knowledge of regulations and provides compliance guidance.',
      status: 'active',
      confidence: 91,
      color: 'from-cyan-500 to-blue-500',
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gradient-ai">Multi-Agent AI Architecture</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Six specialized AI agents working together to enhance inspection intelligence
        </p>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => {
          const Icon = agent.icon
          return (
            <Card 
              key={agent.name} 
              variant="ai" 
              className="group hover:shadow-ai-blue transition-all duration-300 cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Badge variant={agent.status === 'active' ? 'success' : 'warning'}>
                    {agent.status}
                  </Badge>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {agent.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-ai-500" />
                    <span className="text-sm font-medium">{agent.confidence}%</span>
                    <span className="text-xs text-muted-foreground">confidence</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
                
                {/* Confidence Bar */}
                <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${agent.color} transition-all duration-500`}
                    style={{ width: `${agent.confidence}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Agent Workflow */}
      <Card variant="elevated" className="mt-8">
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold mb-6">Agent Collaboration Workflow</h3>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            {agents.slice(0, 4).map((agent, index) => {
              const Icon = agent.icon
              return (
                <React.Fragment key={agent.name}>
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${agent.color} flex items-center justify-center shadow-lg mb-3`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm font-medium">{agent.name.split(' ')[0]}</span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 md:rotate-0 hidden md:block" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Explainable AI Section */}
      <Card variant="elevated">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-ai-500" />
                Explainable AI
              </h3>
              <p className="text-muted-foreground mb-6">
                Every AI decision is transparent and explainable. Our system provides detailed reasoning chains, 
                confidence scores, and human approval gates to ensure accountability and trust.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Confidence Scoring</h4>
                    <p className="text-sm text-muted-foreground">Every AI recommendation includes a confidence score based on data quality and pattern strength.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Reasoning Chains</h4>
                    <p className="text-sm text-muted-foreground">Step-by-step explanation of how the AI reached its conclusion.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-medium">Human Approval</h4>
                    <p className="text-sm text-muted-foreground">Critical decisions require human review before execution.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 bg-gradient-to-br from-ai-50 to-purple-50 dark:from-ai-900/20 dark:to-purple-900/20 rounded-2xl p-6">
              <h4 className="font-semibold mb-4">AI Decision Flow</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">1</div>
                  <span className="text-sm">Data Input</span>
                </div>
                <div className="w-0.5 h-4 bg-primary/30 ml-4" />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">2</div>
                  <span className="text-sm">AI Analysis</span>
                </div>
                <div className="w-0.5 h-4 bg-primary/30 ml-4" />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">3</div>
                  <span className="text-sm">Confidence Score</span>
                </div>
                <div className="w-0.5 h-4 bg-primary/30 ml-4" />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">4</div>
                  <span className="text-sm">Recommendation</span>
                </div>
                <div className="w-0.5 h-4 bg-primary/30 ml-4" />
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">✓</div>
                  <span className="text-sm font-medium">Human Approval</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIAgents
