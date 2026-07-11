// Notification Service
import prisma from '../utils/prisma'

export interface Notification {
  id: string
  userId: string
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ALERT'
  title: string
  message: string
  actionUrl?: string
  read: boolean
  createdAt: Date
  metadata?: any
}

export class NotificationService {
  // Create notification
  async createNotification(data: {
    userId: string
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ALERT'
    title: string
    message: string
    actionUrl?: string
    metadata?: any
  }): Promise<Notification> {
    try {
      const notification = await (prisma as any).notification.create({
        data: {
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          actionUrl: data.actionUrl,
          read: false,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      })

      return {
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || undefined,
        read: notification.read,
        createdAt: notification.createdAt,
        metadata: notification.metadata ? JSON.parse(notification.metadata as string) : undefined,
      }
    } catch (error) {
      console.error('Create notification error:', error)
      throw new Error('Failed to create notification')
    }
  }

  // Get user notifications
  async getUserNotifications(userId: string, options?: {
    unreadOnly?: boolean
    limit?: number
    offset?: number
  }): Promise<Notification[]> {
    try {
      const where: any = { userId }
      if (options?.unreadOnly) {
        where.read = false
      }

      const notifications = await (prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      })

      return notifications.map((notification: any) => ({
        id: notification.id,
        userId: notification.userId,
        type: notification.type as any,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl || undefined,
        read: notification.read,
        createdAt: notification.createdAt,
        metadata: notification.metadata ? JSON.parse(notification.metadata as string) : undefined,
      }))
    } catch (error) {
      console.error('Get notifications error:', error)
      throw new Error('Failed to get notifications')
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await (prisma as any).notification.update({
        where: { id: notificationId },
        data: { read: true },
      })
    } catch (error) {
      console.error('Mark as read error:', error)
      throw new Error('Failed to mark notification as read')
    }
  }

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await (prisma as any).notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
    } catch (error) {
      console.error('Mark all as read error:', error)
      throw new Error('Failed to mark all notifications as read')
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await (prisma as any).notification.delete({
        where: { id: notificationId },
      })
    } catch (error) {
      console.error('Delete notification error:', error)
      throw new Error('Failed to delete notification')
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await (prisma as any).notification.count({
        where: { userId, read: false },
      })
      return count
    } catch (error) {
      console.error('Get unread count error:', error)
      throw new Error('Failed to get unread count')
    }
  }

  // Create inspection notification
  async createInspectionNotification(inspectionId: string, type: 'ASSIGNED' | 'COMPLETED' | 'OVERDUE' | 'FLAGGED'): Promise<void> {
    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { inspector: true, site: true },
    })

    if (!inspection) return

    const notifications = {
      ASSIGNED: {
        title: 'New Inspection Assigned',
        message: `You have been assigned to inspect ${inspection.site.name}`,
        type: 'INFO' as const,
      },
      COMPLETED: {
        title: 'Inspection Completed',
        message: `Inspection for ${inspection.site.name} has been completed`,
        type: 'SUCCESS' as const,
      },
      OVERDUE: {
        title: 'Inspection Overdue',
        message: `Inspection for ${inspection.site.name} is overdue`,
        type: 'WARNING' as const,
      },
      FLAGGED: {
        title: 'Inspection Flagged',
        message: `Inspection for ${inspection.site.name} has been flagged for review`,
        type: 'ALERT' as const,
      },
    }

    const notificationData = notifications[type]
    await this.createNotification({
      userId: inspection.inspectorId,
      ...notificationData,
      actionUrl: `/inspections/${inspectionId}`,
      metadata: { inspectionId, type },
    })
  }

  // Create violation notification
  async createViolationNotification(violationId: string, severity: string): Promise<void> {
    const violation = await prisma.violation.findUnique({
      where: { id: violationId },
      include: {
        inspection: {
          include: { inspector: true, site: true },
        },
      },
    })

    if (!violation) return

    const type = severity === 'CRITICAL' ? 'ALERT' : severity === 'HIGH' ? 'WARNING' : 'INFO'

    await this.createNotification({
      userId: violation.inspection.inspectorId,
      type,
      title: `New ${severity} Violation`,
      message: `${severity} violation detected at ${violation.inspection.site.name}`,
      actionUrl: `/inspections/${violation.inspectionId}`,
      metadata: { violationId, severity },
    })
  }

  // Create system notification for all users
  async createSystemNotification(data: {
    type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'ALERT'
    title: string
    message: string
    role?: 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN'
  }): Promise<void> {
    const users = await prisma.user.findMany({
      where: data.role ? { role: data.role } : undefined,
    })

    for (const user of users) {
      await this.createNotification({
        userId: user.id,
        ...data,
      })
    }
  }

  // Get notification statistics
  async getNotificationStats(userId: string) {
    const [total, unread, byType] = await Promise.all([
      (prisma as any).notification.count({ where: { userId } }),
      (prisma as any).notification.count({ where: { userId, read: false } }),
      (prisma as any).notification.groupBy({
        by: ['type'],
        where: { userId },
        _count: true,
      }),
    ])

    return {
      total,
      unread,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
    }
  }

  // Cleanup old notifications
  async cleanupOldNotifications(daysOld: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)

    const result = await (prisma as any).notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        read: true,
      },
    })

    return result.count
  }
}

export const notificationService = new NotificationService()
