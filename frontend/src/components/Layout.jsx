import React, { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Layout as LayoutIcon, FileText, Image, Settings, Moon, Sun, Menu, X, Shield, LogOut, Plus, History, Bell, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, isDemoMode, exitDemoMode } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '/app', label: 'Dashboard', icon: LayoutIcon },
    { path: '/app/inspections', label: 'My Inspections', icon: FileText },
    { path: '/app/create', label: 'Create Inspection', icon: Plus },
    { path: '/app/history', label: 'History', icon: History },
    { path: '/app/evidence', label: 'Evidence Gallery', icon: Image },
    { path: '/app/notifications', label: 'Notifications', icon: Bell },
    { path: '/app/profile', label: 'Profile', icon: User },
    { path: '/app/settings', label: 'Settings', icon: Settings },
  ]

  const toggleTheme = () => {
    setIsDark(!isDark)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Don't show layout on landing page
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/demo') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/app" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">NIRIKSHA</h1>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="flex items-center space-x-2">
              {isDemoMode && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg">
                  <span className="text-xs font-medium text-warning">Demo Mode</span>
                </div>
              )}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user?.name || 'Inspector'}</span>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {isDemoMode ? (
                <button
                  onClick={exitDemoMode}
                  className="p-2 rounded-lg hover:bg-accent transition-colors text-warning"
                  title="Exit Demo Mode"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-accent transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
              {isDemoMode && (
                <div className="px-3 py-2">
                  <span className="text-xs font-medium text-warning bg-warning/10 px-2 py-1 rounded">Demo Mode</span>
                </div>
              )}
              <button
                onClick={() => {
                  if (isDemoMode) {
                    exitDemoMode()
                  } else {
                    handleLogout()
                  }
                  setIsMobileMenuOpen(false)
                }}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full"
              >
                {isDemoMode ? (
                  <>
                    <X className="w-4 h-4 mr-3" />
                    Exit Demo
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </>
                )}
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <span className="text-sm text-muted-foreground">
              © 2024 NIRIKSHA. Enterprise Inspection Platform.
            </span>
            <span className="text-sm text-muted-foreground">
              Government-Grade Inspection Intelligence
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
