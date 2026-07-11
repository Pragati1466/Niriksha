'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemoMode: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  enterDemoMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')
      const demoMode = localStorage.getItem('demoMode')
      
      if (token && userData) {
        setUser(JSON.parse(userData))
      }
      if (demoMode === 'true') {
        setIsDemoMode(true)
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Login failed')
    }

    const data = await response.json()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const signup = async (name: string, email: string, password: string, role: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Signup failed')
    }

    const data = await response.json()
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('demoMode')
    setUser(null)
    setIsDemoMode(false)
  }

  const enterDemoMode = () => {
    localStorage.setItem('demoMode', 'true')
    setIsDemoMode(true)
    // Set a demo user
    const demoUser: User = {
      id: 'demo-user',
      name: 'Demo User',
      email: 'demo@niriksha.com',
      role: 'SUPERVISOR',
      departmentId: undefined,
      createdAt: new Date().toISOString()
    }
    setUser(demoUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, signup, logout, enterDemoMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
