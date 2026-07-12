'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Lock, Mail, User, ArrowRight, BadgeCheck } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [demoRole, setDemoRole] = useState<'INSPECTOR' | 'SUPERVISOR' | 'ADMIN'>('SUPERVISOR')
  const { signup, enterDemoMode } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!role) {
      setError('Please select a role')
      setLoading(false)
      return
    }

    try {
      await signup(name, email, password, role)
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDemoMode = () => {
    enterDemoMode(demoRole)
    const path = demoRole === 'ADMIN' ? '/dashboards/admin' : demoRole === 'SUPERVISOR' ? '/dashboards/supervisor' : '/dashboards/inspector'
    router.push(path)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 flex-col justify-between">
        <div>
          <Logo size="lg" showText={true} className="mb-8" textClassName="text-3xl" variant="light" />
        </div>
        
        <div className="space-y-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Join the Digital Inspection Revolution</h2>
            <p className="text-blue-100 mb-6">
              Streamline government inspections with AI-powered verification, comprehensive compliance tracking, and real-time reporting.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <BadgeCheck className="h-5 w-5 text-blue-200 mt-1" />
                <div>
                  <p className="text-white font-medium">Secure Authentication</p>
                  <p className="text-blue-200 text-sm">Government-grade security</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="h-5 w-5 text-blue-200 mt-1" />
                <div>
                  <p className="text-white font-medium">Role-Based Access</p>
                  <p className="text-blue-200 text-sm">Tailored permissions for each role</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <BadgeCheck className="h-5 w-5 text-blue-200 mt-1" />
                <div>
                  <p className="text-white font-medium">Audit Trail</p>
                  <p className="text-blue-200 text-sm">Complete compliance memory</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-blue-200 text-sm">
          <p>© 2024 Niriksha Government Platform</p>
          <p className="mt-1">Secure • Reliable • Transparent</p>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Logo size="md" showText={true} className="text-center" />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Create Account</h2>
              <p className="text-gray-600 dark:text-gray-400">Register for government inspection access</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">Government Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="official@niriksha.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700 dark:text-gray-300">Government Role</Label>
                <Select value={role} onValueChange={setRole} required>
                  <SelectTrigger className="h-12">
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSPECTOR">Inspector - Field Operations</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor - Review & Approve</SelectItem>
                    <SelectItem value="ADMIN">Admin - System Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
                disabled={loading}
              >
                {loading ? 'Creating account...' : (
                  <>
                    Create Account
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="mb-4">
                <Label className="text-gray-700 dark:text-gray-300 text-sm font-medium">Quick Demo Access</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Explore features without registration</p>
              </div>
              
              <div className="space-y-3">
                <Select value={demoRole} onValueChange={(value: any) => setDemoRole(value)}>
                  <SelectTrigger className="h-11">
                    <User className="mr-2 h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Select role for demo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INSPECTOR">Inspector</SelectItem>
                    <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button 
                  type="button" 
                  className="w-full h-11 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-md"
                  onClick={handleDemoMode}
                >
                  🎮 Try Demo Mode
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Already have a government account? </span>
              <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By creating an account, you agree to government data security policies and terms of service
          </p>
        </div>
      </div>
    </div>
  )
}
