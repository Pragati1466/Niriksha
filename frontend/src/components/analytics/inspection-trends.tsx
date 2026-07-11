'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const monthlyData = [
  { month: 'Jan', completed: 45, pending: 12 },
  { month: 'Feb', completed: 52, pending: 8 },
  { month: 'Mar', completed: 48, pending: 15 },
  { month: 'Apr', completed: 61, pending: 10 },
  { month: 'May', completed: 55, pending: 12 },
  { month: 'Jun', completed: 67, pending: 9 },
]

const violationData = [
  { name: 'Critical', value: 12, color: '#ef4444' },
  { name: 'High', value: 28, color: '#f97316' },
  { name: 'Medium', value: 45, color: '#eab308' },
  { name: 'Low', value: 67, color: '#22c55e' },
]

const confidenceData = [
  { month: 'Jan', score: 92 },
  { month: 'Feb', score: 94 },
  { month: 'Mar', score: 91 },
  { month: 'Apr', score: 95 },
  { month: 'May', score: 93 },
  { month: 'Jun', score: 96 },
]

export function InspectionTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inspection Trends</CardTitle>
        <CardDescription>Monthly inspection completion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="completed" fill="#22c55e" name="Completed" />
            <Bar dataKey="pending" fill="#eab308" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ViolationDistribution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Violation Distribution</CardTitle>
        <CardDescription>Breakdown by severity</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={violationData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {violationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ConfidenceTrends() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Accuracy Trends</CardTitle>
        <CardDescription>Reality verification performance over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={confidenceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis domain={[80, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
