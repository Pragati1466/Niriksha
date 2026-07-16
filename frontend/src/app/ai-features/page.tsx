'use client'

import { ExplainableAI } from '@/components/ai/explainable-ai'
import { LiveCopilot } from '@/components/ai/live-copilot'
import { ChatAssistant } from '@/components/ai/chat-assistant'
import { FraudDetection } from '@/components/ai/fraud-detection'
import { PredictiveInspection } from '@/components/ai/predictive-inspection'
import { AINotices } from '@/components/ai/ai-notices'
import { AIInsights } from '@/components/ai/ai-insights'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FadeIn } from '@/components/ui/animations'

export default function AIFeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              AI Features Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore our startup-grade AI-powered inspection intelligence platform
            </p>
          </div>
        </FadeIn>

        <Tabs defaultValue="explainable" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="explainable">Explainable AI</TabsTrigger>
            <TabsTrigger value="copilot">Live Copilot</TabsTrigger>
            <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
            <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
            <TabsTrigger value="predictive">Predictive</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="explainable">
            <ExplainableAI />
          </TabsContent>

          <TabsContent value="copilot">
            <LiveCopilot />
          </TabsContent>

          <TabsContent value="chat">
            <ChatAssistant />
          </TabsContent>

          <TabsContent value="fraud">
            <FraudDetection />
          </TabsContent>

          <TabsContent value="predictive">
            <PredictiveInspection />
          </TabsContent>

          <TabsContent value="insights">
            <AIInsights />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AINotices />
        </div>

        <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold mb-4">Available AI Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🧠 Explainable AI</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get detailed reasoning for AI recommendations with confidence scores and evidence
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🤖 Live AI Copilot</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time AI guidance during inspections with risk alerts and suggestions
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💬 AI Chat Assistant</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Q&A system for inspection rules and guidelines with conversation history
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🔍 Fraud Detection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Detect photo reuse, image editing, duplicate inspections, and anomalies
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📊 Predictive Inspection</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                ML-powered prediction of inspection outcomes and high-risk sites
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">💡 AI Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Advanced analytics with trend analysis, anomaly detection, and correlations
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📄 AI Generated Notices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Generate official PDF notices for warnings, closures, and compliance
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">🗺️ Risk Heatmap</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Interactive India map visualization with state-level risk analysis
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">📋 Evidence Timeline</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chronological view of inspection evidence with filtering and details
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
