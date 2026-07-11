// Audit Log Service
import prisma from '../utils/prisma'

export interface AuditLog {
  id: string
  userId: string
  action: string
  entityType: string
  entityId: string
  changes: any
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
}

export class AuditLogService {
  // Create audit log entry
  async createLog(data: {
    userId: string
    action: string
    entityType: string
    entityId: string
    changes?: any
    ipAddress?: string
    userAgent?: string
    severity?: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  }): Promise<void> {
    try {
      // Store in database (if AuditLog model exists)
      // For now, we'll log to console and could extend to database
      console.log('AUDIT LOG:', {
        ...data,
        timestamp: new Date(),
      })

      // In production, this would be stored in database or sent to audit service
      // await prisma.auditLog.create({
      //   data: {
      //     userId: data.userId,
      //     action: data.action,
      //     entityType: data.entityType,
      //     entityId: data.entityId,
      //     changes: data.changes ? JSON.stringify(data.changes) : null,
      //     ipAddress: data.ipAddress,
      //     userAgent: data.userAgent,
      //     severity: data.severity || 'INFO',
      //   },
      // })
    } catch (error) {
      console.error('Audit log error:', error)
      // Don't throw error - audit logging should not break the application
    }
  }

  // Log user action
  async logUserAction(userId: string, action: string, metadata?: any) {
    return this.createLog({
      userId,
      action,
      entityType: 'USER',
      entityId: userId,
      changes: metadata,
      severity: 'INFO',
    })
  }

  // Log inspection action
  async logInspectionAction(userId: string, inspectionId: string, action: string, changes?: any) {
    return this.createLog({
      userId,
      action,
      entityType: 'INSPECTION',
      entityId: inspectionId,
      changes,
      severity: action.includes('DELETE') || action.includes('FLAG') ? 'WARNING' : 'INFO',
    })
  }

  // Log violation action
  async logViolationAction(userId: string, violationId: string, action: string, changes?: any) {
    return this.createLog({
      userId,
      action,
      entityType: 'VIOLATION',
      entityId: violationId,
      changes,
      severity: action.includes('CRITICAL') ? 'CRITICAL' : 'WARNING',
    })
  }

  // Log authentication event
  async logAuthEvent(userId: string, action: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE', metadata?: any) {
    return this.createLog({
      userId,
      action: `AUTH_${action}`,
      entityType: 'AUTH',
      entityId: userId,
      changes: metadata,
      severity: action === 'FAILED_LOGIN' ? 'WARNING' : 'INFO',
    })
  }

  // Log system event
  async logSystemEvent(action: string, metadata?: any, severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO') {
    return this.createLog({
      userId: 'SYSTEM',
      action,
      entityType: 'SYSTEM',
      entityId: 'SYSTEM',
      changes: metadata,
      severity,
    })
  }

  // Get audit logs for user
  async getUserAuditLogs(userId: string, options?: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  }): Promise<AuditLog[]> {
    try {
      // In production, this would query the database
      // For now, return empty array
      return []
    } catch (error) {
      console.error('Get user audit logs error:', error)
      return []
    }
  }

  // Get audit logs for entity
  async getEntityAuditLogs(entityType: string, entityId: string, options?: {
    limit?: number
    offset?: number
  }): Promise<AuditLog[]> {
    try {
      // In production, this would query the database
      return []
    } catch (error) {
      console.error('Get entity audit logs error:', error)
      return []
    }
  }

  // Get audit logs by action type
  async getAuditLogsByAction(action: string, options?: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
  }): Promise<AuditLog[]> {
    try {
      // In production, this would query the database
      return []
    } catch (error) {
      console.error('Get audit logs by action error:', error)
      return []
    }
  }

  // Get audit logs by severity
  async getAuditLogsBySeverity(severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL', options?: {
    limit?: number
    offset?: number
  }): Promise<AuditLog[]> {
    try {
      // In production, this would query the database
      return []
    } catch (error) {
      console.error('Get audit logs by severity error:', error)
      return []
    }
  }

  // Get audit statistics
  async getAuditStatistics(options?: {
    startDate?: Date
    endDate?: Date
  }) {
    try {
      // In production, this would aggregate from database
      return {
        totalLogs: 0,
        byAction: {},
        byEntityType: {},
        bySeverity: {},
        byUser: {},
      }
    } catch (error) {
      console.error('Get audit statistics error:', error)
      return {
        totalLogs: 0,
        byAction: {},
        byEntityType: {},
        bySeverity: {},
        byUser: {},
      }
    }
  }

  // Export audit logs
  async exportAuditLogs(filters?: {
    userId?: string
    entityType?: string
    action?: string
    startDate?: Date
    endDate?: Date
  }): Promise<string> {
    try {
      // In production, this would generate CSV/JSON export
      const logs: any[] = [] // Would fetch from database
      
      return JSON.stringify(logs, null, 2)
    } catch (error) {
      console.error('Export audit logs error:', error)
      throw new Error('Failed to export audit logs')
    }
  }

  // Cleanup old audit logs
  async cleanupOldLogs(daysToKeep: number = 365): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000)
      
      // In production, this would delete old logs from database
      // const result = await prisma.auditLog.deleteMany({
      //   where: { timestamp: { lt: cutoffDate } },
      // })
      
      return 0 // Would return actual count
    } catch (error) {
      console.error('Cleanup audit logs error:', error)
      throw new Error('Failed to cleanup audit logs')
    }
  }

  // Search audit logs
  async searchAuditLogs(query: string, options?: {
    limit?: number
    offset?: number
  }): Promise<AuditLog[]> {
    try {
      // In production, this would perform full-text search
      return []
    } catch (error) {
      console.error('Search audit logs error:', error)
      return []
    }
  }
}

export const auditLogService = new AuditLogService()
