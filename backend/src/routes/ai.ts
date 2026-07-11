import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { promises as fs } from 'fs'
import path from 'path'

const router = express.Router()

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const detectImageMimeType = (bytes: Buffer): string => {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) return 'image/png'
  if (bytes.subarray(0, 3).equals(Buffer.from([0xFF, 0xD8, 0xFF]))) return 'image/jpeg'
  if (bytes.subarray(0, 6).toString('ascii') === 'GIF87a' || bytes.subarray(0, 6).toString('ascii') === 'GIF89a') return 'image/gif'
  if (bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  throw new Error('Uploaded file is not a supported image format')
}

const loadImagePart = async (imagePath: string): Promise<{ inlineData: { mimeType: string, data: string } }> => {
  if (/^https?:\/\//i.test(imagePath)) {
    throw new Error('Verification requires a locally stored uploaded image, not an image URL')
  }

  const uploadsDirectory = path.resolve(process.cwd(), 'uploads')
  const resolvedPath = path.isAbsolute(imagePath)
    ? path.resolve(imagePath)
    : path.resolve(process.cwd(), imagePath.replace(/^[/\\]+/, ''))

  if (!resolvedPath.startsWith(`${uploadsDirectory}${path.sep}`)) {
    throw new Error('Image path must be inside the uploads directory')
  }

  const bytes = await fs.readFile(resolvedPath)
  return { inlineData: { mimeType: detectImageMimeType(bytes), data: bytes.toString('base64') } }
}

router.use(authenticateToken)

router.post('/verify-reality', async (req, res) => {
  try {
    const { checklist, images } = req.body

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

    const prompt = `
    You are an AI inspection verification agent. Analyze the following checklist and images to detect inconsistencies.

    Checklist:
    ${JSON.stringify(checklist, null, 2)}

    For each checklist item, determine from the supplied image bytes whether the images support the claimed status.
    Return a JSON response with:
    - itemId: the checklist item ID
    - supported: boolean indicating if images support the status
    - confidence: confidence score (0-1)
    - reasoning: explanation of your analysis
    - flag: boolean if there's a significant inconsistency
    `

    const imageParts = await Promise.all(images.map((img: any) => loadImagePart(img.url || img.imageUrl)))
    const result = await model.generateContent([prompt, ...imageParts])
    const response = await result.response
    const text = response.text()

    let analysis: any[]
    try {
      analysis = JSON.parse(text)
    } catch {
      return res.status(422).json({
        status: 'UNVERIFIED',
        compliant: null,
        confidence: 0,
        reason: 'Unable to parse verification response',
      })
    }

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

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

    const imagePart = await loadImagePart(imageUrl)
    const result = await model.generateContent([prompt, imagePart])

    const response = await result.response
    const text = response.text()

    res.json({ analysis: text })
  } catch (error) {
    console.error('Image analysis error:', error)
    res.status(500).json({ error: 'Image analysis failed' })
  }
})

export default router
