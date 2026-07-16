// Swagger API Documentation
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Express } from 'express'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NIRIKSHA API',
      version: '1.0.0',
      description: 'AI-powered Inspection Intelligence Platform API',
      contact: {
        name: 'NIRIKSHA Team',
        email: 'support@niriksha.gov',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.niriksha.gov',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'SUPERVISOR', 'INSPECTOR', 'VIEWER'] },
            departmentId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Inspection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string', format: 'uuid' },
            inspectorId: { type: 'string', format: 'uuid' },
            templateId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'FLAGGED'] },
            scheduledDate: { type: 'string', format: 'date-time' },
            completedDate: { type: 'string', format: 'date-time' },
            confidenceScore: { type: 'number' },
          },
        },
        Violation: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            inspectionId: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
            status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization',
      },
      {
        name: 'Inspections',
        description: 'Inspection management',
      },
      {
        name: 'Violations',
        description: 'Violation tracking and management',
      },
      {
        name: 'Users',
        description: 'User management',
      },
      {
        name: 'Sites',
        description: 'Site management',
      },
      {
        name: 'Departments',
        description: 'Department management',
      },
      {
        name: 'AI Agents',
        description: 'AI-powered agent system',
      },
      {
        name: 'Reports',
        description: 'Report generation and management',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'NIRIKSHA API Documentation',
  }))

  // JSON endpoint for programmatic access
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.send(specs)
  })
}
