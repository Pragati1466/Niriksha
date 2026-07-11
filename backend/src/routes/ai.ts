import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = express.Router()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

router.use(authenticateToken)

router.post('/verify-reality', async (req, res) => {
  try {
    const { checklist, images } = req.body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `
    You are an AI inspection verification agent. Analyze the following checklist and images to detect inconsistencies.

    Checklist:
    ${JSON.stringify(checklist, null, 2)}

    Images:
    ${images.map((img: any) => img.description).join('\n')}

    For each checklist item, determine if the images support the claimed status.
    Return a JSON response with:
    - itemId: the checklist item ID
    - supported: boolean indicating if images support the status
    - confidence: confidence score (0-1)
    - reasoning: explanation of your analysis
    - flag: boolean if there's a significant inconsistency
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    const analysis = JSON.parse(text)

    const confidenceScore = analysis.reduce((acc: number, item: any) => {
      return acc + (item.supported ? item.confidence : 1 - item.confidence)
    }, 0) / analysis.length

    res.json({
      analysis,
      confidenceScore,
      flaggedItems: analysis.filter((item: any) => item.flag),
    })
  } catch (error) {
    console.error('AI verification error:', error)
    res.status(500).json({ error: 'AI verification failed' })
  }
})

router.post('/analyze-image', async (req, res) => {
  try {
    const { imageUrl, prompt } = req.body

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const result = await model.generateContent([
      prompt,
      imageUrl,
    ])

    const response = await result.response
    const text = response.text()

    res.json({ analysis: text })
  } catch (error) {
    console.error('Image analysis error:', error)
    res.status(500).json({ error: 'Image analysis failed' })
  }
})

export default router
