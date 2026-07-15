'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, Shield, BarChart3, MapPin, Camera, FileText, 
  CheckCircle, ArrowRight, Sparkles, Activity, 
  Network, Bot, Users, Building2, AlertTriangle,
  TrendingUp, Globe, ChevronRight, Play, Pause
} from 'lucide-react'

const agents = [
  { name: 'Risk Prioritization', icon: AlertTriangle, color: 'from-red-500 to-orange-500', desc: 'AI identifies high-risk establishments using historical data, complaints & risk indicators' },
  { name: 'Route Optimization', icon: MapPin, color: 'from-blue-500 to-cyan-500', desc: 'Smart scheduling based on location, urgency, travel time & inspector workload' },
  { name: 'Reality Verification', icon: Camera, color: 'from-purple-500 to-pink-500', desc: 'Cross-checks inspection findings with uploaded images for inconsistencies' },
  { name: 'Report Generation', icon: FileText, color: 'from-green-500 to-emerald-500', desc: 'Auto-generates reports, notices & documents per department templates' },
  { name: 'Pattern Detection', icon: Activity, color: 'from-yellow-500 to-orange-500', desc: 'Identifies recurring violations, geographical clusters & emerging risks' },
  { name: 'Regulatory Knowledge', icon: Brain, color: 'from-indigo-500 to-purple-500', desc: 'Retrieves department-specific rules & compliance guidelines in real-time' },
]

const stats = [
  { label: 'Inspections Processed', value: '10,000+', icon: BarChart3 },
  { label: 'AI Agents Deployed', value: '6', icon: Bot },
  { label: 'Departments Covered', value: '7+', icon: Building2 },
  { label: 'Accuracy Rate', value: '94.2%', icon: TrendingUp },
]

export default function Home() {

  const { user, loading, isDemoMode, enterDemoMode } = useAuth()

  const router = useRouter()
  const [activeAgent, setActiveAgent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {

    if (!loading && user && !isDemoMode) {

      const role = user.role
      if (role === 'ADMIN') router.push('/dashboards/admin')
      else if (role === 'SUPERVISOR') router.push('/dashboards/supervisor')
      else if (role === 'INSPECTOR') router.push('/dashboards/inspector')
    }

  }, [user, isDemoMode, router, loading])


  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setActiveAgent((prev) => (prev + 1) % agents.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isPaused])

  const handleDemoLogin = (role: 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN') => {
    enterDemoMode(role)
    const path = role === 'ADMIN' ? '/dashboards/admin' : role === 'SUPERVISOR' ? '/dashboards/supervisor' : '/dashboards/inspector'
    router.push(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
      {/* Animated background grid */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Niriksha</span>
              <Badge variant="secondary" className="ml-2 bg-purple-500/20 text-purple-300 border-purple-500/30">
                Agentic AI Platform
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" className="text-white/70 hover:text-white" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white" onClick={() => router.push('/auth/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* Hero Section - One-Liner Pitch */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm text-purple-300">IBM SkillsBuild Hackathon 2026 — Agentic AI for Government</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight">
            NIRIKSHA:{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 text-transparent bg-clip-text">
              AI Agents that Verify Reality,
            </span>
            <br />
            <span>Evolve Trust, and Close the Compliance Loop Autonomously</span>
          </h1>
          <p className="text-lg text-white/60 max-w-3xl mx-auto mb-6">
            <span className="text-purple-300 font-semibold">ORDI</span> (Operational Reality Divergence Index) powered multi-agent platform 
            that doesn't just assist inspections — it <span className="text-white/90 font-semibold">verifies every finding</span> with AI, 
            <span className="text-white/90 font-semibold"> evolves inspector trust</span> dynamically, and 
            <span className="text-white/90 font-semibold"> closes the compliance loop</span> autonomously.
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-sm px-3 py-1">
              <Activity className="w-3 h-3 mr-1" /> ORDI Powered
            </Badge>
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-sm px-3 py-1">
              <Brain className="w-3 h-3 mr-1" /> WatsonX Granite
            </Badge>
            <Badge className="bg-green-500/20 text-green-300 border-green-500/30 text-sm px-3 py-1">
              <Shield className="w-3 h-3 mr-1" /> Multi-Agent Graph
            </Badge>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-lg px-8 py-6" onClick={() => router.push('/auth/signup')}>
              Explore Niriksha <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 text-white bg-white/10 hover:bg-white/20 text-lg px-8 py-6" onClick={() => handleDemoLogin('SUPERVISOR')}>
              <Play className="mr-2 w-5 h-5" /> Try Demo
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-white/5 border-white/10 backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-white/50">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Agentic AI Pipeline Visualization */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Six AI Agents Working in Harmony
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            Each agent specializes in a critical aspect of the inspection lifecycle, 
            collaborating to deliver intelligent, actionable insights.
          </p>
        </div>

        {/* Agent Carousel */}
        <div className="relative mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {agents.map((agent, idx) => (
              <Card
                key={agent.name}
                className={`relative overflow-hidden transition-all duration-500 cursor-pointer border ${
                  idx === activeAgent 
                    ? 'border-purple-500/50 bg-white/10 shadow-lg shadow-purple-500/20 scale-105' 
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
                onMouseEnter={() => { setActiveAgent(idx); setIsPaused(true) }}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${agent.color} opacity-0 transition-opacity duration-500 ${
                  idx === activeAgent ? 'opacity-10' : ''
                }`} />
                <CardContent className="p-6 relative">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${agent.color} flex items-center justify-center mb-4`}>
                    <agent.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{agent.name}</h3>
                  <p className="text-sm text-white/60">{agent.desc}</p>
                  {idx === activeAgent && (
                    <div className="mt-4 flex items-center gap-2 text-purple-400 text-sm">
                      <Activity className="w-4 h-4 animate-pulse" />
                      <span>Active</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Agent Pipeline Flow */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Inspection Intelligence Pipeline</h3>
              <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-500/30">
                <Activity className="w-3 h-3 mr-1 animate-pulse" /> Live
              </Badge>
            </div>
            <div className="relative">
              <div className="flex flex-wrap items-center justify-center gap-3">
                {['Risk Analysis', 'Route Planning', 'On-site Inspection', 'Evidence Verification', 'Report Generation', 'Supervisor Review'].map((step, idx) => (
                  <div key={step} className="flex items-center">
                    <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      idx <= activeAgent ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-white/5 text-white/40 border border-white/10'
                    }`}>
                      {step}
                    </div>
                    {idx < 5 && <ChevronRight className={`w-4 h-4 mx-1 ${idx < activeAgent ? 'text-purple-400' : 'text-white/20'}`} />}
                  </div>
                ))}
              </div>
              <div className="mt-6 h-2 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((activeAgent + 1) / 6) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            How Niriksha Works
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto">
            From risk assessment to final approval — a seamless, AI-augmented workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Risk-Based Prioritization', desc: 'AI analyzes historical data, complaints, and risk indicators to identify which establishments need inspection most urgently.', icon: AlertTriangle },
            { step: '02', title: 'Smart Assignment & Inspection', desc: 'Inspectors receive optimized routes and digital checklists. On-site, they capture evidence, fill checklists, and submit with geolocation verification.', icon: MapPin },
            { step: '03', title: 'AI Verification & Review', desc: 'Reality Verification Agent cross-checks findings against evidence. Supervisor reviews with full transparency and AI confidence scores.', icon: Shield },
          ].map((item) => (
            <Card key={item.step} className="bg-white/5 border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all">
              <CardContent className="p-8">
                <div className="text-5xl font-bold bg-gradient-to-br from-purple-500 to-pink-500 text-transparent bg-clip-text mb-4">{item.step}</div>
                <item.icon className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-white/60">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Demo Access */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Experience Niriksha Now
            </h2>
            <p className="text-lg text-white/60 mb-8 max-w-2xl mx-auto">
              Jump into a fully functional demo with pre-loaded data. No sign-up required.
              Choose your role and see the platform in action.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg" onClick={() => handleDemoLogin('ADMIN')}>
                <Users className="mr-2 w-5 h-5" /> Admin Demo
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg" onClick={() => handleDemoLogin('SUPERVISOR')}>
                <Shield className="mr-2 w-5 h-5" /> Supervisor Demo
              </Button>
              <Button size="lg" className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg" onClick={() => handleDemoLogin('INSPECTOR')}>
                <Camera className="mr-2 w-5 h-5" /> Inspector Demo
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-white/40 text-sm">
            Built with ❤️ for IBM Hackathon 2026 — Agentic AI & Automation Internship
          </p>
        </div>
      </footer>
    </div>
  )
}