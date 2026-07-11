import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import authRoutes from './routes/auth'
import inspectionRoutes from './routes/inspections'
import userRoutes from './routes/users'
import departmentRoutes from './routes/departments'
import siteRoutes from './routes/sites'
import templateRoutes from './routes/templates'
import reportRoutes from './routes/reports'
import aiRoutes from './routes/ai'
import agentRoutes from './routes/agents'
import aiFeaturesRoutes from './routes/ai-features'
import { setupSwagger } from './routes/swagger'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

console.log('Environment PORT:', process.env.PORT)
console.log('Using PORT:', PORT)

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/sites', siteRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/ai-features', aiFeaturesRoutes)

// Setup Swagger documentation
setupSwagger(app)

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'NIRIKSHA API is running',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      inspections: '/api/inspections',
      users: '/api/users',
      departments: '/api/departments',
      sites: '/api/sites',
      templates: '/api/templates',
      reports: '/api/reports',
      ai: '/api/ai'
    }
  })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NIRIKSHA API is running' })
})

app.listen(PORT, () => {
  console.log(`NIRIKSHA API server running on port ${PORT}`)
})
