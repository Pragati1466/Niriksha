'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn } from '@/components/ui/animations'

interface AIExplanation {
  recommendation: string
  reasoning: string
  confidence: number
  factors: string[]
  alternatives: string[]
  evidence: string[]
}

export function ExplainableAI() {
  const [explanation, setExplanation] = useState<AIExplanation | null>(null)
  const [loading, setLoading] = useState(false)
  const [context, setContext] = useState('')
  const [data, setData] = useState('')

  const generateExplanation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-features/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, data: JSON.parse(data || '{}') }),
      })
      const result = await response.json()
      setExplanation(result)
    } catch (error) {
      console.error('Error generating explanation:', error)
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explainable AI</CardTitle>
        <CardDescription>Get detailed explanations for AI recommendations with reasoning and confidence scores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Context</label>
            <textarea
              className="w-full p-2 border rounded-md"
              placeholder="Enter the context for the recommendation..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Data (JSON)</label>
            <textarea
              className="w-full p-2 border rounded-md font-mono text-sm"
              placeholder='{"riskScore": 75, "factors": ["factor1", "factor2"]}'
              value={data}
              onChange={(e) => setData(e.target.value)}
              rows={4}
            />
          </div>
          <Button onClick={generateExplanation} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate Explanation'}
          </Button>

          {explanation && (
            <FadeIn>
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="mb-3">
                  <Badge variant="outline" className="mb-2">
                    Confidence: {(explanation.confidence * 100).toFixed(0)}%
                  </Badge>
                  <h4 className="font-semibold">{explanation.recommendation}</h4>
                </div>
                
                <div className="mb-3">
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Reasoning:</h5>
                  <p className="text-sm">{explanation.reasoning}</p>
                </div>

                <div className="mb-3">
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Key Factors:</h5>
                  <div className="flex flex-wrap gap-1">
                    {explanation.factors.map((factor, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Alternatives:</h5>
                  <ul className="text-sm list-disc list-inside">
                    {explanation.alternatives.map((alt, i) => (
                      <li key={i}>{alt}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-sm text-gray-600 dark:text-gray-400 mb-1">Evidence:</h5>
                  <ul className="text-sm list-disc list-inside">
                    {explanation.evidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
