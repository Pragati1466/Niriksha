import React, { useState } from 'react'
import { ArrowRight, Shield, CheckCircle, X, Menu, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const Landing = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { path: '#platform', label: 'Platform' },
    { path: '#solutions', label: 'Solutions' },
    { path: '#features', label: 'Features' },
    { path: '#about', label: 'About' },
    { path: '#contact', label: 'Contact' },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-semibold">NIRIKSHA</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/demo"
                className="hidden sm:block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Request Demo
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-background">
            <div className="px-4 py-4 space-y-3">
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link
                to="/demo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium text-center"
              >
                Request Demo
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                  Inspection Intelligence
                  <br />
                  <span className="text-muted-foreground">for Modern Governments.</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-xl">
                  AI-powered inspection prioritization, evidence verification and regulatory decision support for government inspection departments.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/demo"
                  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Request Demo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <a
                  href="#platform"
                  className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
                >
                  View Platform
                </a>
              </div>

              <div className="flex items-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Government Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Explainable AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Human in Loop</span>
                </div>
              </div>
            </div>

            {/* Right Content - Dashboard Preview */}
            <div className="relative">
              <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                {/* Mac Window Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                  <div className="w-3 h-3 rounded-full bg-destructive" />
                  <div className="w-3 h-3 rounded-full bg-warning" />
                  <div className="w-3 h-3 rounded-full bg-success" />
                </div>
                
                {/* Dashboard Preview */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Today's Inspections</div>
                      <div className="text-2xl font-bold">24</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">High Risk</div>
                      <div className="text-2xl font-bold text-destructive">8</div>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="text-xs text-muted-foreground mb-1">Compliance</div>
                      <div className="text-2xl font-bold text-success">94%</div>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-xs text-muted-foreground mb-2">Recent Activity</div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Restaurant ABC - Inspection</span>
                        <span className="text-muted-foreground">2m ago</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Factory XYZ - Evidence</span>
                        <span className="text-muted-foreground">15m ago</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Building 123 - Report</span>
                        <span className="text-muted-foreground">1h ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by government organizations</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center opacity-60">
            {['IBM', 'FSSAI', 'Municipal', 'Fire Safety', 'Factory', 'Smart Gov'].map((logo) => (
              <div key={logo} className="text-sm font-semibold text-muted-foreground">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Modernize Your Inspections</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Move from manual, reactive inspections to AI-powered, proactive compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Traditional */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Traditional Inspection</h3>
              <div className="space-y-4">
                {[
                  'Manual prioritization',
                  'Manual reports',
                  'Reactive inspections',
                  'Scattered evidence',
                  'No risk intelligence',
                  'Paper-based workflows'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-muted-foreground">
                    <X className="w-5 h-5 text-destructive" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* NIRIKSHA */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">NIRIKSHA</h3>
              <div className="space-y-4">
                {[
                  'AI-assisted prioritization',
                  'Evidence verification',
                  'Automated reporting',
                  'Risk intelligence',
                  'Predictive analytics',
                  'Digital workflows'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="platform" className="py-20 sm:py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How NIRIKSHA Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamlined workflow from complaint to compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Complaint', description: 'Citizen reports and complaints' },
              { step: '02', title: 'Risk Analysis', description: 'AI-powered risk assessment' },
              { step: '03', title: 'Assignment', description: 'Smart inspector assignment' },
              { step: '04', title: 'Inspection', description: 'Digital inspection workflow' },
              { step: '05', title: 'Verification', description: 'Evidence AI verification' },
              { step: '06', title: 'Drafting', description: 'Automated report generation' },
              { step: '07', title: 'Approval', description: 'Supervisor review' },
              { step: '08', title: 'Compliance', description: 'Action tracking' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                  <div className="text-sm font-semibold text-muted-foreground">{item.step}</div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 7 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-muted-foreground">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to modernize government inspections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Inspection Management', description: 'End-to-end inspection workflow management' },
              { title: 'Evidence Upload', description: 'Secure evidence collection and verification' },
              { title: 'Offline Support', description: 'Work without internet connectivity' },
              { title: 'GIS Maps', description: 'Geographic inspection visualization' },
              { title: 'Analytics', description: 'Real-time compliance analytics' },
              { title: 'Compliance Reports', description: 'Automated regulatory reporting' },
              { title: 'Role Based Access', description: 'Granular permission controls' },
              { title: 'Audit Trails', description: 'Complete activity tracking' },
              { title: 'Mobile First', description: 'Tablet and mobile optimized' }
            ].map((feature, index) => (
              <div key={index} className="bg-card border border-border rounded-xl p-6 space-y-3 hover:border-primary/50 transition-colors">
                <h4 className="font-semibold">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
            Ready to modernize government inspections?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join forward-thinking government departments using NIRIKSHA to improve compliance and community safety.
          </p>
          <Link
            to="/demo"
            className="inline-flex items-center justify-center px-8 py-4 bg-background text-foreground rounded-lg font-medium hover:bg-background/90 transition-colors"
          >
            Request a Demo
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold">NIRIKSHA</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 NIRIKSHA. Enterprise Inspection Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing
