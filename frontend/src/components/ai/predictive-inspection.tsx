'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn } from '@/components/ui/animations'

interface PredictionResult {
  establishmentId: string
  establishmentName: string
  failureProbability: number
  riskFactors: string[]
  predictedViolations: string[]
  recommendedAction: string
  confidence: number
}

interface PredictiveInsights {
  highRiskSites: number
  averageFailureProbability: number
  topRiskFactors: string[]
  seasonalTrends: any[]
}

export function PredictiveInspection() {
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [insights, setInsights] = useState<PredictiveInsights | null>(null)
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'predictions' | 'insights' | 'high-risk'>('predictions')

  const getPredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/predictive/outcomes')
      const result = await response.json()
      setPredictions(result)
    } catch (error) {
      console.error('Error getting predictions:', error)
    }
    setLoading(false)
  }

  const getHighRisk = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/predictive/high-risk')
      const result = await response.json()
      setPredictions(result)
    } catch (error) {
      console.error('Error getting high risk:', error)
    }
    setLoading(false)
  }

  const getInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/predictive/insights')
      const result = await response.json()
      setInsights(result)
    } catch (error) {
      console.error('Error getting insights:', error)
    }
    setLoading(false)
  }

  const getRiskColor = (probability: number) => {
    if (probability >= 80) return 'bg-red-500'
    if (probability >= 60) return 'bg-orange-500'
    if (probability >= 40) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getRiskLevel = (probability: number) => {
    if (probability >= 80) return 'CRITICAL'
    if (probability >= 60) return 'HIGH'
    if (probability >= 40) return 'MEDIUM'
    return 'LOW'
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          Predictive Inspection
        </CardTitle>
        <CardDescription>ML-powered prediction of inspection outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant={view === 'predictions' ? 'default' : 'outline'}
              onClick={() => { setView('predictions'); getPredictions() }}
              disabled={loading}
            >
              All Predictions
            </Button>
            <Button 
              variant={view === 'high-risk' ? 'default' : 'outline'}
              onClick={() => { setView('high-risk'); getHighRisk() }}
              disabled={loading}
            >
              High Risk Only
            </Button>
            <Button 
              variant={view === 'insights' ? 'default' : 'outline'}
              onClick={() => { setView('insights'); getInsights() }}
              disabled={loading}
            >
              Insights
            </Button>
          </div>

          {view === 'insights' && insights && (
            <FadeIn>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold">{insights.highRiskSites}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">High Risk Sites</div>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="text-2xl font-bold">
                      {(insights.averageFailureProbability * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Failure Rate</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Top Risk Factors:</h4>
                  <div className="flex flex-wrap gap-2">
                    {insights.topRiskFactors.map((factor, i) => (
                      <Badge key={i} variant="outline">{factor}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Seasonal Trends:</h4>
                  <div className="space-y-2">
                    {insights.seasonalTrends.map((trend: any, i: number) => (
                      <div key={i} className="p-2 border rounded-lg">
                        <div className="flex justify-between">
                          <span className="font-medium">{trend.season}</span>
                          <Badge variant="secondary">
                            {(trend.expectedViolationRate * 100).toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </FadeIn>
          )}

          {(view === 'predictions' || view === 'high-risk') && predictions.length > 0 && (
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <SlideUp key={index}>
                  <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">{prediction.establishmentName}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ID: {prediction.establishmentId}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getRiskColor(prediction.failureProbability)}>
                          {getRiskLevel(prediction.failureProbability)}
                        </Badge>
                        <div className="text-2xl font-bold mt-1">
                          {(prediction.failureProbability * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">Failure Probability</div>
                      </div>
                    </div>

                    <div className="mb-3">
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Risk Factors:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {prediction.riskFactors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{factor}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Predicted Violations:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {prediction.predictedViolations.map((violation, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{violation}</Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-medium">{prediction.recommendedAction}</p>
                    </div>
                  </div>
                </SlideUp>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
