'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function Home() {
  const router = useRouter()
  const { user, loading, isDemoMode } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        switch (user.role) {
          case 'INSPECTOR':
            router.push('/dashboards/inspector')
            break
          case 'SUPERVISOR':
            router.push('/dashboards/supervisor')
            break
          case 'ADMIN':
            router.push('/dashboards/admin')
            break
          default:
            router.push('/auth/login')
        }
      } else {
        router.push('/auth/login')
      }
    }
  }, [user, loading, router, isDemoMode])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}
