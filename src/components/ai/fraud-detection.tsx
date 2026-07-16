'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SlideUp, FadeIn } from '@/components/ui/animations'

interface FraudCheckResult {
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  checks: {
    photoReuse: { detected: boolean; severity: string; details: string }
    imageEditing: { detected: boolean; severity: string; details: string }
    duplicateInspection: { detected: boolean; severity: string; details: string }
    inspectorAnomalies: { detected: boolean; severity: string; details: string }
  }
  summary: string[]
}

interface FraudStats {
  totalInspections: number
  flaggedInspections: number
  photoReuseCases: number
  imageEditingCases: number
  duplicateInspections: number
  anomalyCases: number
}

export function FraudDetection() {
  const [checkResult, setCheckResult] = useState<FraudCheckResult | null>(null)
  const [stats, setStats] = useState<FraudStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [inspectionId, setInspectionId] = useState('')

  const runComprehensiveCheck = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai-features/fraud/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectionId }),
      })
      const result = await response.json()
      setCheckResult(result)
    } catch (error) {
      console.error('Error running fraud check:', error)
    }
    setLoading(false)
  }

  const getStatistics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api-features/fraud/statistics')
      const result = await response.json()
      setStats(result)
    } catch (error) {
      console.error('Error getting statistics:', error)
    }
    setLoading(false)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
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
          <span className="text-2xl">🔍</span>
          Fraud Detection
        </CardTitle>
        <CardDescription>AI-powered fraud detection for inspections</CardDescription>
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
            <Button onClick={runComprehensiveCheck} disabled={loading}>
              Run Check
            </Button>
            <Button onClick={getStatistics} variant="outline" disabled={loading}>
              Statistics
            </Button>
          </div>

          {stats && (
            <FadeIn>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.totalInspections}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Inspections</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.flaggedInspections}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Flagged</div>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.photoReuseCases}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Photo Reuse</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.imageEditingCases}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Image Editing</div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.duplicateInspections}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Duplicates</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold">{stats.anomalyCases}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Anomalies</div>
                </div>
              </div>
            </FadeIn>
          )}

          {checkResult && (
            <SlideUp>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <span className="font-semibold">Overall Risk:</span>
                  <Badge className={getRiskColor(checkResult.overallRisk)}>
                    {checkResult.overallRisk}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Check Results:</h4>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Photo Reuse Detection</span>
                      <Badge variant={checkResult.checks.photoReuse.detected ? 'destructive' : 'default'}>
                        {checkResult.checks.photoReuse.detected ? 'Detected' : 'Clear'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkResult.checks.photoReuse.details}
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Image Editing Detection</span>
                      <Badge variant={checkResult.checks.imageEditing.detected ? 'destructive' : 'default'}>
                        {checkResult.checks.imageEditing.detected ? 'Detected' : 'Clear'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkResult.checks.imageEditing.details}
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Duplicate Inspection Detection</span>
                      <Badge variant={checkResult.checks.duplicateInspection.detected ? 'destructive' : 'default'}>
                        {checkResult.checks.duplicateInspection.detected ? 'Detected' : 'Clear'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkResult.checks.duplicateInspection.details}
                    </p>
                  </div>

                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Inspector Anomalies</span>
                      <Badge variant={checkResult.checks.inspectorAnomalies.detected ? 'destructive' : 'default'}>
                        {checkResult.checks.inspectorAnomalies.detected ? 'Detected' : 'Clear'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {checkResult.checks.inspectorAnomalies.details}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Summary:</h4>
                  <ul className="text-sm list-disc list-inside space-y-1">
                    {checkResult.summary.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SlideUp>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
