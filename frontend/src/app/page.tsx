'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, Zap, Lock, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

export default function Home() {
  const router = useRouter()
  const { user, loading, isDemoMode } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (isDemoMode) {
        // In demo mode, redirect based on demo role
        const demoRole = localStorage.getItem('demoRole')
        switch (demoRole) {
          case 'INSPECTOR':
            router.push('/dashboards/inspector')
            break
          case 'SUPERVISOR':
            router.push('/dashboards/supervisor')
            break
          case 'ADMIN':
            router.push('/dashboards/admin')
            break
          default:
            router.push('/dashboards/admin') // Default to admin for demo
        }
      } else if (user) {
        switch (user.role) {
          case 'INSPECTOR':
            router.push('/dashboards/inspector')
            break
          case 'SUPERVISOR':
            router.push('/dashboards/supervisor')
            break
          case 'ADMIN':
            router.push('/dashboards/admin')
            break
          default:
            router.push('/auth/login')
        }
      }
    }
  }, [user, loading, router, isDemoMode])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user && !isDemoMode) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} textClassName="text-5xl" />
          </div>
          <p className="text-2xl text-muted-foreground mb-2">AI-Powered Inspection Intelligence Platform</p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Transforming government inspections with intelligent risk prioritization, evidence verification, and automated reporting
          </p>
          <div className="flex gap-4 justify-center mt-8">
            <Button size="lg" onClick={() => router.push('/auth/login')}>
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => router.push('/auth/login?demo=true')}>
              Try Demo Mode
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Risk Prioritization</CardTitle>
              <CardDescription>
                AI agents analyze historical data, complaints, and risk indicators to identify high-priority inspections
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Evidence Verification</CardTitle>
              <CardDescription>
                Automated reality verification compares inspection findings with uploaded evidence for accuracy
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Route planning optimizes inspector schedules based on location, urgency, and workload
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-primary transition-colors">
            <CardHeader>
              <Lock className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Human-in-Control</CardTitle>
              <CardDescription>
                Every AI recommendation can be reviewed by human officers - AI assists, never replaces
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Use Cases */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Food Safety</CardTitle>
              <CardDescription>FSSAI compliance inspections with hygiene monitoring</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fire Safety</CardTitle>
              <CardDescription>Building safety audits and fire code compliance</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pollution Control</CardTitle>
              <CardDescription>Environmental monitoring and regulatory compliance</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  )
}
