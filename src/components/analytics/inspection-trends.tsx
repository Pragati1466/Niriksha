'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts'

const empty = <p className="py-8 text-center text-sm text-muted-foreground">No data available</p>

export function InspectionTrends({ data }: { data: Array<{ month: string; inspections: number; completed: number }> }) { return <Card><CardHeader><CardTitle>Inspection Trends</CardTitle><CardDescription>Database-backed monthly completion rates</CardDescription></CardHeader><CardContent>{data.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="completed" fill="#22c55e" /><Bar dataKey="inspections" fill="#2563eb" /></BarChart></ResponsiveContainer> : empty}</CardContent></Card> }

export function ViolationDistribution({ data }: { data: Array<{ name: string; value: number; color: string }> }) { return <Card><CardHeader><CardTitle>Violation Distribution</CardTitle></CardHeader><CardContent>{data.length ? <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>{data.map((entry, index) => <Cell key={index} fill={entry.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer> : empty}</CardContent></Card> }

export function ConfidenceTrends({ data }: { data: Array<{ month: string; score: number }> }) { return <Card><CardHeader><CardTitle>AI Accuracy Trends</CardTitle></CardHeader><CardContent>{data.length ? <ResponsiveContainer width="100%" height={300}><LineChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="score" stroke="#3b82f6" /></LineChart></ResponsiveContainer> : empty}</CardContent></Card> }
