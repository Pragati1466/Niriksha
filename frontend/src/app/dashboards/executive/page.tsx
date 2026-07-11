'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RiskHeatmap } from '@/components/analytics/risk-heatmap'

interface KPIData {
  totalInspections: number
  completedInspections: number
  pendingInspections: number
  criticalViolations: number
  highRiskSites: number
  averageComplianceRate: number
  inspectorPerformance: number
  monthlyTrend: number[]
}

interface DepartmentPerformance {
  name: string
  inspections: number
  violations: number
  complianceRate: number
  trend: 'UP' | 'DOWN' | 'STABLE'
}

export default function ExecutiveDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [departmentPerformance, setDepartmentPerformance] = useState<DepartmentPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated KPI data
    const mockKPI: KPIData = {
      totalInspections: 1247,
      completedInspections: 1089,
      pendingInspections: 158,
      criticalViolations: 23,
      highRiskSites: 45,
      averageComplianceRate: 87.3,
      inspectorPerformance: 92.1,
      monthlyTrend: [78, 82, 85, 88, 87, 90, 89, 91, 93, 92, 94, 95],
    }

    const mockDepartmentPerformance: DepartmentPerformance[] = [
      { name: 'Health', inspections: 423, violations: 89, complianceRate: 78.9, trend: 'UP' },
      { name: 'Safety', inspections: 356, violations: 67, complianceRate: 81.2, trend: 'STABLE' },
      { name: 'Environment', inspections: 289, violations: 45, complianceRate: 84.4, trend: 'UP' },
      { name: 'Building', inspections: 179, violations: 34, complianceRate: 81.0, trend: 'DOWN' },
    ]

    setKpiData(mockKPI)
    setDepartmentPerformance(mockDepartmentPerformance)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Executive Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Real-time inspection intelligence overview</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">Export Report</Button>
            <Button>Generate Insights</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData?.totalInspections}</div>
              <div className="text-sm opacity-75 mt-1">
                {kpiData?.completedInspections} completed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData?.averageComplianceRate}%</div>
              <div className="text-sm opacity-75 mt-1">
                {kpiData && kpiData.monthlyTrend.length >= 2 && (
                  <>+{kpiData.monthlyTrend[kpiData.monthlyTrend.length - 1] - kpiData.monthlyTrend[kpiData.monthlyTrend.length - 2]}% from last month</>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Critical Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData?.criticalViolations}</div>
              <div className="text-sm opacity-75 mt-1">
                {kpiData?.highRiskSites} high-risk sites
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Inspector Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpiData?.inspectorPerformance}%</div>
              <div className="text-sm opacity-75 mt-1">
                Above target
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Heatmap */}
              <RiskHeatmap />

              {/* Monthly Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Inspection Trends</CardTitle>
                  <CardDescription>12-month inspection completion trend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-end justify-between gap-2">
                    {kpiData?.monthlyTrend.map((value, index) => (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full(bg-blue-500 hover:bg-blue-600 transition-colors rounded-t"
                          style={{ height: `${value}%`, minHeight: '20px' }}
                        ></div>
                        <div className="text-xs mt-2 text-gray-600 dark:text-gray-400">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
                <CardDescription>Critical issues requiring immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">CRITICAL</Badge>
                      <div>
                        <div className="font-medium">Critical violation surge detected</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          5 new critical violations in last 24 hours
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="default">HIGH</Badge>
                      <div>
                        <div className="font-medium">High-risk site identified</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Site #1234 showing 85% risk score
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">MEDIUM</Badge>
                      <div>
                        <div className="font-medium">Inspector performance decline</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Inspector #456 showing 15% performance drop
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departmentPerformance.map((dept) => (
                <Card key={dept.name}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{dept.name} Department</CardTitle>
                      <Badge
                        variant={dept.trend === 'UP' ? 'default' : dept.trend === 'DOWN' ? 'destructive' : 'secondary'}
                      >
                        {dept.trend}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Inspections</span>
                        <span className="font-semibold">{dept.inspections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Violations</span>
                        <span className="font-semibold">{dept.violations}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Compliance Rate</span>
                        <span className="font-semibold">{dept.complianceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${dept.complianceRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key metrics trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Inspection Completion Rate</span>
                      <span className="text-sm text-green-600 dark:text-green-400">+12%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-green-500 h-3 rounded-full" style={{ width: '87%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Violation Resolution Time</span>
                      <span className="text-sm text-green-600 dark:text-green-400">-8%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: '72%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Inspector Efficiency</span>
                      <span className="text-sm text-green-600 dark:text-green-400">+5%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-purple-500 h-3 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Site Compliance Improvement</span>
                      <span className="text-sm text-red-600 dark:text-red-400">-3%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div className="bg-orange-500 h-3 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>Intelligent analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <div className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Kitchen hygiene dropped 42% in last month
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Analysis of 156 kitchen inspections shows significant decline in hygiene compliance across 23 establishments.
                    </div>
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      Recommended: Increase inspection frequency and provide targeted training
                    </div>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                    <div className="font-medium text-red-900 dark:text-red-100 mb-2">
                      This contractor appears in 8 high-risk sites
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Inspector #789 has been assigned to 8 establishments with critical violations, suggesting potential assignment bias.
                    </div>
                    <div className="text-sm font-medium text-red-700 dark:text-red-300">
                      Recommended: Review inspection assignments and redistribute workload
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                    <div className="font-medium text-green-900 dark:text-green-100 mb-2">
                      Safety compliance improved 15% in Q4
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Safety department shows consistent improvement with 89% compliance rate, up from 74% in Q3.
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-300">
                      Recommended: Document best practices and share across departments
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border-l-4 border-purple-500">
                    <div className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Predictive model identifies 12 high-risk sites
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      ML analysis predicts 85% probability of inspection failure for 12 establishments within next 30 days.
                    </div>
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                      Recommended: Prioritize these sites for immediate inspection
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
