import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check for stored token on mount
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const demoMode = localStorage.getItem('demoMode')
    
    if (demoMode === 'true') {
      setIsDemoMode(true)
      // Set demo user
      const demoUser = {
        id: 'demo-1',
        email: 'demo@niriksha.gov',
        name: 'Demo Inspector',
        role: 'inspector',
        organization: 'Government Authority',
        avatar: null,
        isDemo: true
      }
      setUser(demoUser)
    } else if (token && storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // Mock authentication with credential validation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Valid credentials for testing
        const validCredentials = [
          { email: 'inspector@niriksha.gov', password: 'inspector123' },
          { email: 'admin@niriksha.gov', password: 'admin123' },
          { email: 'demo@niriksha.gov', password: 'demo123' }
        ]
        
        const isValid = validCredentials.some(
          cred => cred.email === email && cred.password === password
        )
        
        if (!isValid) {
          reject(new Error('Invalid credentials'))
          return
        }
        
        // Mock user data
        const mockUser = {
          id: '1',
          email: email,
          name: email.includes('admin') ? 'Admin User' : 'Inspector John Doe',
          role: email.includes('admin') ? 'admin' : 'inspector',
          organization: 'Government Authority',
          avatar: null
        }
        
        // Mock JWT token
        const mockToken = 'mock-jwt-token-' + Date.now()
        
        localStorage.setItem('token', mockToken)
        localStorage.setItem('user', JSON.stringify(mockUser))
        setUser(mockUser)
        resolve(mockUser)
      }, 800)
    })
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('demoMode')
    setUser(null)
    setIsDemoMode(false)
  }

  const enterDemoMode = () => {
    const demoUser = {
      id: 'demo-1',
      email: 'demo@niriksha.gov',
      name: 'Demo Inspector',
      role: 'inspector',
      organization: 'Government Authority',
      avatar: null,
      isDemo: true
    }
    
    localStorage.setItem('demoMode', 'true')
    localStorage.setItem('user', JSON.stringify(demoUser))
    setUser(demoUser)
    setIsDemoMode(true)
  }

  const exitDemoMode = () => {
    localStorage.removeItem('demoMode')
    localStorage.removeItem('user')
    setUser(null)
    setIsDemoMode(false)
  }

  const updateProfile = (userData) => {
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, logout, enterDemoMode, exitDemoMode, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
