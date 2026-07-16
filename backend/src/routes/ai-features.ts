// AI Features API Routes
import { Router } from 'express'
import { explainableAI } from '../services/explainableAI'
import { liveCopilot } from '../services/liveCopilot'
import { chatAssistant } from '../services/chatAssistant'
import { fraudDetection } from '../services/fraudDetection'
import { predictiveInspection } from '../services/predictiveInspection'
import { noticeGenerator } from '../services/noticeGenerator'
import { aiInsights } from '../services/aiInsights'
import { watsonxService } from '../services/watsonxService'

const router = Router()

// Explainable AI Routes
router.post('/explain', async (req, res) => {
  try {
    const { context, data } = req.body
    const explanation = await explainableAI.explainRecommendation(context, data)
    res.json(explanation)
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate explanation' })
  }
})

router.post('/explain-risk', async (req, res) => {
  try {
    const { siteName, riskScore, factors } = req.body
    const explanation = await explainableAI.explainRiskAssessment(siteName, riskScore, factors)
    res.json(explanation)
  } catch (error) {
    res.status(500).json({ error: 'Failed to explain risk assessment' })
  }
})

// Live AI Copilot Routes
router.post('/copilot/next-step', async (req, res) => {
  try {
    const { inspectionId, currentProgress } = req.body
    const suggestion = await liveCopilot.getNextInspectionStep(inspectionId, currentProgress)
    res.json(suggestion)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get next step suggestion' })
  }
})

router.post('/copilot/risk-alert', async (req, res) => {
  try {
    const { inspectionId } = req.body
    const alert = await liveCopilot.getRiskAlerts(inspectionId)
    res.json(alert)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get risk alert' })
  }
})

// AI Chat Assistant Routes
router.post('/chat/ask', async (req, res) => {
  try {
    const { sessionId, question, context } = req.body
    const response = await chatAssistant.askQuestion(sessionId, question, context)
    res.json(response)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get chat response' })
  }
})

router.get('/chat/rules/:category', async (req, res) => {
  try {
    const { category } = req.params
    const rules = await chatAssistant.getRuleSummary(category)
    res.json(rules)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rule summary' })
  }
})

// Fraud Detection Routes
router.post('/fraud/photo-reuse', async (req, res) => {
  try {
    const { imageUrl, inspectorId } = req.body
    const result = await fraudDetection.detectPhotoReuse(imageUrl, inspectorId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to detect photo reuse' })
  }
})

router.post('/fraud/comprehensive', async (req, res) => {
  try {
    const { inspectionId } = req.body
    const result = await fraudDetection.performComprehensiveFraudCheck(inspectionId)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to perform comprehensive fraud check' })
  }
})

router.get('/fraud/statistics', async (req, res) => {
  try {
    const stats = await fraudDetection.getFraudStatistics()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get fraud statistics' })
  }
})

// Predictive Inspection Routes
router.get('/predictive/outcomes', async (req, res) => {
  try {
    const predictions = await predictiveInspection.predictInspectionOutcomes()
    res.json(predictions)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predictions' })
  }
})

router.get('/predictive/high-risk', async (req, res) => {
  try {
    const highRisk = await predictiveInspection.getHighRiskEstablishments()
    res.json(highRisk)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get high-risk establishments' })
  }
})

router.get('/predictive/insights', async (req, res) => {
  try {
    const insights = await predictiveInspection.getPredictiveInsights()
    res.json(insights)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get predictive insights' })
  }
})

// AI Generated Notices Routes
router.post('/notices/generate', async (req, res) => {
  try {
    const { inspectionId, type } = req.body
    const noticePath = await noticeGenerator.generateNoticeFromInspection(inspectionId, type)
    res.json({ noticePath })
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate notice' })
  }
})

router.get('/notices/template/:type', async (req, res) => {
  try {
    const { type } = req.params
    const template = noticeGenerator.getNoticeTemplate(type)
    res.json({ template })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get notice template' })
  }
})

// AI Insights Routes
router.get('/insights/generate', async (req, res) => {
  try {
    const insights = await aiInsights.generateInsights()
    res.json(insights)
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' })
  }
})

router.get('/insights/summary', async (req, res) => {
  try {
    const summary = await aiInsights.getInsightsSummary()
    res.json(summary)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get insights summary' })
  }
})

router.get('/insights/type/:type', async (req, res) => {
  try {
    const { type } = req.params
    const insights = await aiInsights.getInsightsByType(type)
    res.json(insights)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get insights by type' })
  }
})

// IBM Watsonx Routes
router.post('/watsonx/generate', async (req, res) => {
  try {
    const { prompt, options } = req.body
    const result = await watsonxService.generateText(prompt, options)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate text with Watsonx' })
  }
})

router.post('/watsonx/analyze', async (req, res) => {
  try {
    const { inspectionData } = req.body
    const analysis = await watsonxService.analyzeInspection(inspectionData)
    res.json(analysis)
  } catch (error) {
    res.status(500).json({ error: 'Failed to analyze inspection with Watsonx' })
  }
})

router.get('/watsonx/health', async (req, res) => {
  try {
    const health = await watsonxService.healthCheck()
    res.json(health)
  } catch (error) {
    res.status(500).json({ error: 'Failed to check Watsonx health' })
  }
})

export default router
