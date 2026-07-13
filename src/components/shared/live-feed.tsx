'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { Badge } from '@/components/ui/badge'
import { Activity, Wifi, WifiOff } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

interface LiveData {
  activeInspections: number
  pendingReviews: number
  alerts: number
  inspectorStatus: number
  timestamp: string
}

export function LiveFeed() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [liveData, setLiveData] = useState<LiveData | null>(null)

  useEffect(() => {
    const s = io(API_BASE, {
      transports: ['websocket', 'polling'],
    })

    s.on('connect', () => {
      setConnected(true)
    })

    s.on('liveUpdate', (data: LiveData) => {
      setLiveData(data)
    })

    s.on('disconnect', () => {
      setConnected(false)
    })

    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  if (!liveData) return null

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        {connected ? (
          <Wifi className="w-3 h-3 text-green-400" />
        ) : (
          <WifiOff className="w-3 h-3 text-red-400" />
        )}
        <span className={connected ? 'text-green-400' : 'text-red-400'}>
          {connected ? 'Live' : 'Offline'}
        </span>
      </div>
      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
        <Activity className="w-3 h-3 mr-1 animate-pulse" />
        {liveData.activeInspections} Active
      </Badge>
      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
        {liveData.pendingReviews} Pending
      </Badge>
      {liveData.alerts > 0 && (
        <Badge className="bg-red-500/20 text-red-300 border-red-500/30">
          {liveData.alerts} Alerts
        </Badge>
      )}
    </div>
  )
}