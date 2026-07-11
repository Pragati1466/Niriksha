'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn } from '@/components/ui/animations'

interface AIInsight {
  id: string
  type: 'TREND' | 'ANOMALY' | 'PREDICTION' | 'CORRELATION' | 'ALERT'
  title: string
  description: string
  metric: string
  value: number
  change: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  actionable: boolean
  recommendations: string[]
  relatedEntities: string[]
  timestamp: Date
}

interface InsightsSummary {
  totalInsights: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  actionableCount: number
  topInsights: AIInsight[]
}

export function AIInsights() {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [summary, setSummary] = useState<InsightsSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'TREND' | 'ANOMALY' | 'ALERT'>('ALL')

  const generateInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/insights/generate')
      const result = await response.json()
      setInsights(result)
    } catch (error) {
      console.error('Error generating insights:', error)
    }
    setLoading(false)
  }

  const getSummary = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/insights/summary')
      const result = await response.json()
      setSummary(result)
      setInsights(result.topInsights)
    } catch (error) {
      console.error('Error getting summary:', error)
    }
    setLoading(false)
  }

  const getInsightsByType = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api-ai-features/insights/type/${type}`)
      const result = await response.json()
      setInsights(result)
    } catch (error) {
      console.error('Error getting insights by type:', error)
    }
    setLoading(false)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500'
      case 'HIGH': return 'bg-orange-500'
      case 'MEDIUM': return 'bg-yellow-500'
      case 'LOW': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TREND': return '📈'
      case 'ANOMALY': return '⚠️'
      case 'PREDICTION': return '🔮'
      case 'CORRELATION': return '🔗'
      case 'ALERT': return '🚨'
      default: return 'ℹ️'
    }
  }

  const filteredInsights = insights.filter(insight => {
    if (filter === 'ALL') return true
    return insight.type === filter
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">💡</span>
          AI Insights
        </CardTitle>
        <CardDescription>Advanced analytics with trend analysis and anomaly detection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={generateInsights} disabled={loading} size="sm">
              Generate Insights
            </Button>
            <Button onClick={getSummary} variant="outline" disabled={loading} size="sm">
              Summary
            </Button>
            <Button 
              variant={filter === 'ALL' ? 'default' : 'outline'}
              onClick={() => { setFilter('ALL'); getSummary() }}
              size="sm"
            >
              All
            </Button>
            <Button 
              variant={filter === 'TREND' ? 'default' : 'outline'}
              onClick={() => { setFilter('TREND'); getInsightsByType('TREND') }}
              size="sm"
            >
              Trends
            </Button>
            <Button 
              variant={filter === 'ANOMALY' ? 'default' : 'outline'}
              onClick={() => { setFilter('ANOMALY'); getInsightsByType('ANOMALY') }}
              size="sm"
            >
              Anomalies
            </Button>
            <Button 
              variant={filter === 'ALERT' ? 'default' : 'outline'}
              onClick={() => { setFilter('ALERT'); getInsightsByType('ALERT') }}
              size="sm"
            >
              Alerts
            </Button>
          </div>

          {summary && (
            <FadeIn>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.totalInsights}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.criticalCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Critical</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.highCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">High</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.mediumCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Medium</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-2xl font-bold">{summary.actionableCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Actionable</div>
                </div>
              </div>
            </FadeIn>
          )}

          <div className="space-y-3">
            {filteredInsights.map((insight, index) => (
              <SlideUp key={index}>
                <div className={`p-4 border rounded-lg hover:shadow-md transition-shadow ${
                  insight.severity === 'CRITICAL'
                    ? 'border-red-200 dark:border-red-800'
                    : insight.severity === 'HIGH'
                    ? 'border-orange-200 dark:border-orange-800'
                    : 'border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getTypeIcon(insight.type)}</span>
                      <div>
                        <h4 className="font-semibold">{insight.title}</h4>
                        <Badge className={getSeverityColor(insight.severity)}>
                          {insight.severity}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{insight.value}</div>
                      <div className="text-xs text-gray-500">{insight.metric}</div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {insight.description}
                  </p>

                  {insight.actionable && (
                    <div className="mb-3">
                      <h5 className="font-medium text-sm mb-1">Recommendations:</h5>
                      <ul className="text-sm list-disc list-inside space-y-1">
                        {insight.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{new Date(insight.timestamp).toLocaleString()}</span>
                    <Badge variant="outline">{insight.type}</Badge>
                  </div>
                </div>
              </SlideUp>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
