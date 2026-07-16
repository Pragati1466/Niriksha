// WebSocket Live Feed Service
import { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import prisma from '../utils/prisma'

let io: Server | null = null

export function initWebSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3003', 'http://localhost:3005'],
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('WebSocket client connected:', socket.id)

    // Send initial data
    sendLiveUpdate(socket)

    // Poll for changes every 5 seconds
    const interval = setInterval(() => {
      sendLiveUpdate(socket)
    }, 5000)

    socket.on('disconnect', () => {
      console.log('WebSocket client disconnected:', socket.id)
      clearInterval(interval)
    })
  })

  return io
}

async function sendLiveUpdate(socket: any) {
  try {
    const [activeInspections, pendingReviews, alerts, inspectorStatus] = await Promise.all([
      prisma.inspection.count({ where: { status: { in: ['IN_PROGRESS', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
      prisma.inspection.count({ where: { status: { in: ['HOLD_FOR_REVIEW', 'UNDER_REVIEW'] } } }),
      prisma.complianceMemoryEvent.count({ where: { eventType: { in: ['VERIFICATION_FINDING', 'SYSTEMIC_RISK_DISCOVERED'] }, occurredAt: { gte: new Date(Date.now() - 3600000) } } }),
      prisma.user.count({ where: { role: 'INSPECTOR', isActive: true, assignedInspections: { some: { status: 'IN_PROGRESS' } } } }),
    ])

    socket.emit('liveUpdate', {
      activeInspections,
      pendingReviews,
      alerts,
      inspectorStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('WebSocket update error:', error)
  }
}

export function broadcastEvent(event: string, data: any) {
  if (io) {
    io.emit(event, data)
  }
}

export function getIO() { return io }