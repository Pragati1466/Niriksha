'use client'

import { useAuth } from '@/contexts/auth-context'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Shield, LogOut, User, Home, Activity, Brain, Clock } from 'lucide-react'

export function Header() {
  const { user, isDemoMode, logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getDashboardPath = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'ADMIN': return '/dashboards/admin'
      case 'SUPERVISOR': return '/dashboards/supervisor'
      case 'INSPECTOR': return '/dashboards/inspector'
      default: return '/'
    }
  }

  return (
    <header className="relative z-20 border-b border-white/10 backdrop-blur-xl bg-slate-900/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Niriksha</span>
            </button>
            {user && (
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 ml-2">
                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                {user.role}
              </Badge>
            )}
            {isDemoMode && (
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                Demo Mode
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <>
                <Button
                  variant="ghost"
                  className="text-white/60 hover:text-white"
                  onClick={() => router.push(getDashboardPath())}
                >
                  <Home className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
                <div className="flex items-center gap-2 text-white/60">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm text-white font-medium">{user.name}</p>
                    <p className="text-xs text-white/40">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="text-white/60 hover:text-red-400"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}