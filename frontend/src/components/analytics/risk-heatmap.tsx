'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RiskData {
  state: string
  lat: number
  lng: number
  riskScore: number
  violationCount: number
  inspectionCount: number
}

export function RiskHeatmap() {
  const [riskData, setRiskData] = useState<RiskData[]>([])
  const [selectedState, setSelectedState] = useState<RiskData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated risk data for Indian states
    const mockData: RiskData[] = [
      { state: 'Maharashtra', lat: 19.7515, lng: 75.7139, riskScore: 75, violationCount: 245, inspectionCount: 320 },
      { state: 'Delhi', lat: 28.6139, lng: 77.2090, riskScore: 85, violationCount: 189, inspectionCount: 210 },
      { state: 'Karnataka', lat: 15.3173, lng: 75.7139, riskScore: 65, violationCount: 178, inspectionCount: 280 },
      { state: 'Tamil Nadu', lat: 11.1271, lng: 78.6569, riskScore: 70, violationCount: 195, inspectionCount: 290 },
      { state: 'Gujarat', lat: 22.2587, lng: 71.1924, riskScore: 60, violationCount: 145, inspectionCount: 250 },
      { state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, riskScore: 80, violationCount: 267, inspectionCount: 310 },
      { state: 'West Bengal', lat: 22.9868, lng: 87.8550, riskScore: 72, violationCount: 189, inspectionCount: 260 },
      { state: 'Rajasthan', lat: 27.0238, lng: 74.2179, riskScore: 55, violationCount: 134, inspectionCount: 240 },
      { state: 'Kerala', lat: 10.8505, lng: 76.2711, riskScore: 68, violationCount: 156, inspectionCount: 270 },
      { state: 'Punjab', lat: 31.1471, lng: 75.3412, riskScore: 58, violationCount: 112, inspectionCount: 220 },
      { state: 'Haryana', lat: 29.0588, lng: 76.0856, riskScore: 62, violationCount: 128, inspectionCount: 230 },
      { state: 'Madhya Pradesh', lat: 22.9734, lng: 78.6569, riskScore: 67, violationCount: 167, inspectionCount: 250 },
      { state: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400, riskScore: 63, violationCount: 142, inspectionCount: 245 },
      { state: 'Telangana', lat: 17.3850, lng: 78.4867, riskScore: 71, violationCount: 178, inspectionCount: 260 },
      { state: 'Odisha', lat: 20.9517, lng: 85.0985, riskScore: 59, violationCount: 123, inspectionCount: 235 },
    ]

    setRiskData(mockData)
    setLoading(false)
  }, [])

  const getRiskColor = (score: number) => {
    if (score >= 80) return '#ef4444' // Red - Critical
    if (score >= 60) return '#f97316' // Orange - High
    if (score >= 40) return '#eab308' // Yellow - Medium
    return '#22c55e' // Green - Low
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'CRITICAL'
    if (score >= 60) return 'HIGH'
    if (score >= 40) return 'MEDIUM'
    return 'LOW'
  }

  const handleStateClick = (state: RiskData) => {
    setSelectedState(state)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Interactive Risk Heatmap</CardTitle>
          <CardDescription>Loading risk data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interactive Risk Heatmap</CardTitle>
        <CardDescription>
          Real-time risk visualization across India. Click on states for detailed analysis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-sm">Critical (80+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500"></div>
              <span className="text-sm">High (60-79)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Medium (40-59)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="text-sm">Low (0-39)</span>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative h-[500px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg overflow-hidden">
            {/* Simplified India Map Visualization */}
            <svg viewBox="0 0 800 600" className="w-full h-full">
              {/* Background */}
              <rect width="800" height="600" fill="transparent" />
              
              {/* State circles with risk colors */}
              {riskData.map((state) => (
                <g key={state.state} onClick={() => handleStateClick(state)} className="cursor-pointer">
                  <circle
                    cx={state.lng * 8 + 100}
                    cy={600 - state.lat * 15}
                    r={20 + (state.riskScore / 10)}
                    fill={getRiskColor(state.riskScore)}
                    opacity={0.6}
                    className="hover:opacity-100 transition-opacity"
                  />
                  <circle
                    cx={state.lng * 8 + 100}
                    cy={600 - state.lat * 15}
                    r={20 + (state.riskScore / 10)}
                    fill="none"
                    stroke={getRiskColor(state.riskScore)}
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                  <text
                    x={state.lng * 8 + 100}
                    y={600 - state.lat * 15 + 5}
                    textAnchor="middle"
                    fill="white"
                    fontSize="10"
                    fontWeight="bold"
                    className="pointer-events-none"
                  >
                    {state.state.substring(0, 3).toUpperCase()}
                  </text>
                </g>
              ))}
            </svg>

            {/* Selected State Details Panel */}
            {selectedState && (
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 w-64">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg">{selectedState.state}</h3>
                  <Badge variant={selectedState.riskScore >= 80 ? 'destructive' : 'default'}>
                    {getRiskLevel(selectedState.riskScore)}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Score:</span>
                    <span className="font-semibold">{selectedState.riskScore}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Violations:</span>
                    <span className="font-semibold">{selectedState.violationCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inspections:</span>
                    <span className="font-semibold">{selectedState.inspectionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Violation Rate:</span>
                    <span className="font-semibold">
                      {((selectedState.violationCount / selectedState.inspectionCount) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedState(null)}
                  className="mt-3 w-full text-sm text-primary hover:underline"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Statistics Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {riskData.filter(d => d.riskScore >= 80).length}
              </div>
              <div className="text-sm text-muted-foreground">Critical Risk States</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {riskData.filter(d => d.riskScore >= 60 && d.riskScore < 80).length}
              </div>
              <div className="text-sm text-muted-foreground">High Risk States</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {riskData.filter(d => d.riskScore >= 40 && d.riskScore < 60).length}
              </div>
              <div className="text-sm text-muted-foreground">Medium Risk States</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {riskData.filter(d => d.riskScore < 40).length}
              </div>
              <div className="text-sm text-muted-foreground">Low Risk States</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
