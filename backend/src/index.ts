import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
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
import supervisorRoutes from './routes/supervisor'
import extraFeaturesRoutes from './routes/extra-features'
import { setupSwagger } from './routes/swagger'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

console.log('Environment PORT:', process.env.PORT)
console.log('Using PORT:', PORT)

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api/', limiter)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 auth requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
})

// CORS configuration - allow any localhost origin for development
app.use(cors({
  origin: (origin, callback) => {
    // Allow any localhost origin (any port) for development
    if (!origin || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true)
    } else if (process.env.ALLOWED_ORIGINS) {
      // Check against allowed origins for non-localhost in production
      const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',')
      if (allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    } else {
      // Allow all origins if no restrictions specified
      callback(null, true)
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Secure static file serving with basic auth check
app.use('/uploads', (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization required' })
  }
  next()
}, express.static(path.join(__dirname, '../uploads')))

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/inspections', inspectionRoutes)
app.use('/api/users', userRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/sites', siteRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/agents', agentRoutes)
app.use('/api/ai-features', aiFeaturesRoutes)
app.use('/api/supervisor', supervisorRoutes)
app.use('/api/extra', extraFeaturesRoutes)

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
