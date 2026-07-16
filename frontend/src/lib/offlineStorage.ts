import { getApiUrl } from './api'

const OFFLINE_QUEUE_KEY = 'niriksha_offline_queue'
const OFFLINE_INSPECTIONS_KEY = 'niriksha_offline_inspections'

export interface QueuedAction {
  id: string
  type: 'create' | 'update' | 'delete' | 'upload'
  endpoint: string
  method: string
  body?: any
  timestamp: number
  retryCount: number
}

export interface OfflineInspection {
  id: string
  data: any
  images: File[]
  timestamp: number
  synced: boolean
}

export class OfflineStorage {
  private queue: QueuedAction[] = []
  private inspections: OfflineInspection[] = []

  constructor() {
    this.loadFromStorage()
  }

private loadFromStorage() {
  if (typeof window === 'undefined') return

  try {
    this.queue = JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY) || '[]')
    this.inspections = JSON.parse(localStorage.getItem(OFFLINE_INSPECTIONS_KEY) || '[]')
  } catch (error) {
    console.error('Failed to load offline storage:', error)
  }
}

private saveToStorage() {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.queue))
    localStorage.setItem(OFFLINE_INSPECTIONS_KEY, JSON.stringify(this.inspections))
  } catch (error) {
    console.error('Failed to save to offline storage:', error)
  }
}

  enqueueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>) {
    const queuedAction: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    }
    this.queue.push(queuedAction)
    this.saveToStorage()
    return queuedAction.id
  }

  removeAction(id: string) {
    this.queue = this.queue.filter(a => a.id !== id)
    this.saveToStorage()
  }

  getQueue(): QueuedAction[] {
    return [...this.queue]
  }

  saveOfflineInspection(inspection: OfflineInspection) {
    this.inspections.push(inspection)
    this.saveToStorage()
  }

  getOfflineInspections(): OfflineInspection[] {
    return [...this.inspections]
  }

  removeOfflineInspection(id: string) {
    this.inspections = this.inspections.filter(i => i.id !== id)
    this.saveToStorage()
  }

  async sync(token: string): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const action of this.queue) {
      try {
        const response = await fetch(`${getApiUrl()}${action.endpoint}`, {
          method: action.method,
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: action.body ? JSON.stringify(action.body) : undefined,
        })

        if (response.ok) {
          this.removeAction(action.id)
          success++
        } else {
          action.retryCount++
          if (action.retryCount >= 3) {
            this.removeAction(action.id)
            failed++
          }
        }
      } catch (error) {
        action.retryCount++
        if (action.retryCount >= 3) {
          this.removeAction(action.id)
          failed++
        }
      }
    }

    this.saveToStorage()
    return { success, failed }
  }

  isOnline(): boolean {

  if (typeof window === 'undefined') return true
  return navigator.onLine
}


  getQueueSize(): number {
    return this.queue.length
  }
}

export const offlineStorage = new OfflineStorage()
