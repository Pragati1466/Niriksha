'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn, Pulse } from '@/components/ui/animations'

interface CopilotSuggestion {
  nextStep: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedTime: number
  tools: string[]
  tips: string[]
}

interface RiskAlert {
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  recommendation: string
}

export function LiveCopilot() {
  const [suggestion, setSuggestion] = useState<CopilotSuggestion | null>(null)
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [inspectionId, setInspectionId] = useState('')

  const getNextStep = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-features/copilot/next-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId, currentProgress: {} }),
      })
      const result = await response.json()
      setSuggestion(result)
    } catch (error) {
      console.error('Error getting next step:', error)
    }
    setLoading(false)
  }

  const getRiskAlerts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-features/copilot/risk-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId }),
      })
      const result = await response.json()
      setRiskAlerts(result.alerts || [])
    } catch (error) {
      console.error('Error getting risk alerts:', error)
    }
    setLoading(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pulse>
            <span className="text-2xl">🤖</span>
          </Pulse>
          Live AI Copilot
        </CardTitle>
        <CardDescription>Real-time AI guidance during inspections</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              className="flex-1 p-2 border rounded-md"
              placeholder="Enter inspection ID..."
              value={inspectionId}
              onChange={(e) => setInspectionId(e.target.value)}
            />
            <Button onClick={getNextStep} disabled={loading}>
              Get Next Step
            </Button>
            <Button onClick={getRiskAlerts} variant="outline" disabled={loading}>
              Risk Alerts
            </Button>
          </div>

          {suggestion && (
            <FadeIn>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getPriorityColor(suggestion.priority)}>
                    {suggestion.priority}
                  </Badge>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ~{suggestion.estimatedTime} min
                  </span>
                </div>
                
                <h4 className="font-semibold mb-2">Next Step:</h4>
                <p className="text-sm mb-3">{suggestion.nextStep}</p>

                <div className="mb-3">
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Required Tools:</h5>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.tools.map((tool, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        🔧 {tool}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Tips:</h5>
                  <ul className="text-sm list-disc list-inside">
                    {suggestion.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          )}

          {riskAlerts.length > 0 && (
            <SlideUp>
              <div className="space-y-2">
                <h4 className="font-semibold">Risk Alerts:</h4>
                {riskAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : alert.severity === 'HIGH'
                        ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium text-sm">{alert.type}</span>
                    </div>
                    <p className="text-sm mb-1">{alert.message}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      💡 {alert.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </SlideUp>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
