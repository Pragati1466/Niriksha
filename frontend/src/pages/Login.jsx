import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, ArrowRight, AlertCircle, Play } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const Login = () => {
  const navigate = useNavigate()
  const { login, enterDemoMode } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    organization: '',
    phone: ''
  })
  const [errors, setErrors] = useState({})

  const handleDemoMode = () => {
    enterDemoMode()
    toast.success('Entered demo mode')
    navigate('/app')
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (isLogin) {
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.password) newErrors.password = 'Password is required'
    } else {
      if (!formData.fullName) newErrors.fullName = 'Full name is required'
      if (!formData.organization) newErrors.organization = 'Organization is required'
      if (!formData.email) newErrors.email = 'Email is required'
      if (!formData.phone) newErrors.phone = 'Phone is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors above')
      return
    }
    
    setIsLoading(true)
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        toast.success('Login successful')
        navigate('/app')
      } else {
        // Demo request - mock submission
        await new Promise(resolve => setTimeout(resolve, 1000))
        toast.success('Demo request submitted successfully')
        navigate('/')
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: null
      })
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold mb-2">
            {isLogin ? 'Sign in to NIRIKSHA' : 'Request a Demo'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLogin 
              ? 'Enterprise Inspection Intelligence Platform' 
              : 'Experience government-grade inspection management'}
          </p>
        </div>

        {/* Form */}
        <Card>
          <div className="p-6 space-y-4">
            {isLogin ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      placeholder="you@organization.gov"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.email ? 'border-destructive' : 'border-border'}`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="password"
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.password ? 'border-destructive' : 'border-border'}`}
                      required
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.password}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-border" />
                    <span className="text-muted-foreground">Remember me</span>
                  </label>
                  <a href="#" className="text-primary hover:underline">
                    Forgot password?
                  </a>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleDemoMode}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Try Demo Mode
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.fullName ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Organization</label>
                  <input
                    type="text"
                    name="organization"
                    placeholder="Government Organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.organization ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                  {errors.organization && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.organization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="email"
                      name="email"
                      placeholder="you@organization.gov"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.email ? 'border-destructive' : 'border-border'}`}
                      required
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm ${errors.phone ? 'border-destructive' : 'border-border'}`}
                    required
                  />
                  {errors.phone && (
                    <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.phone}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting...' : 'Request Demo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            {/* Toggle */}
            <div className="pt-4 border-t border-border text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin)
                  setErrors({})
                }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isLogin ? "Don't have an account? Request a demo" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          By continuing, you agree to NIRIKSHA's Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  )
}

export default Login
