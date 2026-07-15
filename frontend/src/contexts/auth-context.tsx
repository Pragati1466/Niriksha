'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { getApiUrl } from '@/lib/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemoMode: boolean

  login: (email: string, password: string) => Promise<void>

  signup: (name: string, email: string, password: string, role: string) => Promise<void>
  logout: () => void
  enterDemoMode: (role: 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN') => void
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

      const demoRole = localStorage.getItem('demoRole')
      
      // Clear any invalid data
      if (userData === 'undefined' || userData === 'null' || !userData) {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      }
      
      if (token && userData && userData !== 'undefined' && userData !== 'null') {
        try {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        } catch (e) {
          // Invalid stored user data, clear it
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
      
      // Restore demo mode with user
      if (demoMode === 'true' && demoRole) {
        setIsDemoMode(true)
        const demoUsers: Record<string, User> = {
          'ADMIN': {
            id: 'admin001',
            name: 'Rajesh Kumar',
            email: 'admin@niriksha.gov.in',
            role: 'ADMIN',
            departmentId: 'DEPT001',
            phone: '9876543210',
            employeeId: 'EMP001',
            createdAt: new Date().toISOString()
          },
          'SUPERVISOR': {
            id: 'supervisor001',
            name: 'Priya Sharma',
            email: 'supervisor@niriksha.gov.in',
            role: 'SUPERVISOR',
            departmentId: 'DEPT001',
            phone: '9876543211',
            employeeId: 'EMP002',
            createdAt: new Date().toISOString()
          },
          'INSPECTOR': {
            id: 'inspector001',
            name: 'Amit Patel',
            email: 'inspector@niriksha.gov.in',
            role: 'INSPECTOR',
            departmentId: 'DEPT001',
            phone: '9876543212',
            employeeId: 'EMP003',
            createdAt: new Date().toISOString()
          }
        }
        setUser(demoUsers[demoRole])

      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
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

    const response = await fetch(`${getApiUrl()}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed')
    }
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

  const enterDemoMode = (role: 'INSPECTOR' | 'SUPERVISOR' | 'ADMIN') => {
    localStorage.setItem('demoMode', 'true')
    localStorage.setItem('demoRole', role)
    setIsDemoMode(true)
    // Use seeded demo users that match the database seed data
    const demoUsers: Record<string, User> = {
      'ADMIN': {
        id: 'admin001',
        name: 'Rajesh Kumar',
        email: 'admin@niriksha.gov.in',
        role: 'ADMIN',
        departmentId: 'DEPT001',
        phone: '9876543210',
        employeeId: 'EMP001',
        createdAt: new Date().toISOString()
      },
      'SUPERVISOR': {
        id: 'supervisor001',
        name: 'Priya Sharma',
        email: 'supervisor@niriksha.gov.in',
        role: 'SUPERVISOR',
        departmentId: 'DEPT001',
        phone: '9876543211',
        employeeId: 'EMP002',
        createdAt: new Date().toISOString()
      },
      'INSPECTOR': {
        id: 'inspector001',
        name: 'Amit Patel',
        email: 'inspector@niriksha.gov.in',
        role: 'INSPECTOR',
        departmentId: 'DEPT001',
        phone: '9876543212',
        employeeId: 'EMP003',
        createdAt: new Date().toISOString()
      }
    }
    setUser(demoUsers[role])
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
