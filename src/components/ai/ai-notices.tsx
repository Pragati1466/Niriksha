'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn } from '@/components/ui/animations'

export function AINotices() {
  const [noticePath, setNoticePath] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [inspectionId, setInspectionId] = useState('')
  const [noticeType, setNoticeType] = useState<'WARNING' | 'CLOSURE' | 'COMPLIANCE' | 'SUMMARY'>('WARNING')

  const generateNotice = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-ai-features/notices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId, type: noticeType }),
      })
      const result = await response.json()
      setNoticePath(result.noticePath)
    } catch (error) {
      console.error('Error generating notice:', error)
    }
    setLoading(false)
  }

  const getNoticeTypeColor = (type: string) => {
    switch (type) {
      case 'WARNING': return 'bg-yellow-500'
      case 'CLOSURE': return 'bg-red-500'
      case 'COMPLIANCE': return 'bg-green-500'
      case 'SUMMARY': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getNoticeTypeDescription = (type: string) => {
    switch (type) {
      case 'WARNING': return 'Warning Notice for establishments with critical or high-severity violations'
      case 'CLOSURE': return 'Closure Order for establishments with immediate health/safety risks'
      case 'COMPLIANCE': return 'Compliance Notice outlining required corrective actions'
      case 'SUMMARY': return 'Inspection Summary with overall assessment and findings'
      default: return 'Unknown notice type'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">📄</span>
          AI Generated Notices
        </CardTitle>
        <CardDescription>Generate official notices using AI (PDF format)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Inspection ID</label>
            <input
              className="w-full p-2 border rounded-md"
              placeholder="Enter inspection ID..."
              value={inspectionId}
              onChange={(e) => setInspectionId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Notice Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(['WARNING', 'CLOSURE', 'COMPLIANCE', 'SUMMARY'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setNoticeType(type)}
                  className={`p-3 border rounded-lg text-left transition-all ${
                    noticeType === type
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getNoticeTypeColor(type)}>{type}</Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {getNoticeTypeDescription(type)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generateNotice} disabled={loading} className="w-full">
            {loading ? 'Generating...' : 'Generate Notice'}
          </Button>

          {noticePath && (
            <FadeIn>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">✅</span>
                  <h4 className="font-semibold">Notice Generated Successfully!</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  File: {noticePath}
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => window.open(`http://localhost:3001/${noticePath}`, '_blank')}>
                    Download PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setNoticePath(null)}>
                    Generate Another
                  </Button>
                </div>
              </div>
            </FadeIn>
          )}

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold mb-2">Notice Types:</h4>
            <ul className="text-sm space-y-2">
              <li><strong>Warning:</strong> For establishments with critical/high-severity violations</li>
              <li><strong>Closure:</strong> For immediate health/safety risks requiring closure</li>
              <li><strong>Compliance:</strong> Outlining required corrective actions</li>
              <li><strong>Summary:</strong> Overall inspection assessment and findings</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
