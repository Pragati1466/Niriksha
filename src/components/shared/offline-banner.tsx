'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Upload, X } from 'lucide-react'
import { offlineStorage } from '@/lib/offlineStorage'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [queueSize, setQueueSize] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); syncQueue() }
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    setIsOffline(!navigator.onLine)
    setQueueSize(offlineStorage.getQueueSize())

    const interval = setInterval(() => {
      setQueueSize(offlineStorage.getQueueSize())
    }, 3000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  const syncQueue = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const result = await offlineStorage.sync(token)
    setQueueSize(offlineStorage.getQueueSize())
  }

  if (dismissed) return null

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <WifiOff className="w-4 h-4" />
            <span>You are offline. Inspections will sync when connection returns.</span>
            {queueSize > 0 && (
              <span className="bg-amber-700 px-2 py-0.5 rounded text-xs font-bold">
                {queueSize} pending
              </span>
            )}
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-amber-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {!isOffline && queueSize > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-600 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4 animate-bounce" />
            <span>Back online! Syncing {queueSize} pending action{queueSize !== 1 ? 's' : ''}...</span>
          </div>
          <button onClick={() => setDismissed(true)} className="p-1 hover:bg-green-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  )
}