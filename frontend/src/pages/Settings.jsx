import React, { useState } from 'react'
import { Settings as SettingsIcon, Moon, Sun, Globe, Wifi, WifiOff, Bell, Shield, Database, Trash2, Save, RefreshCw } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const Settings = () => {
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState('en')
  const [offlineMode, setOfflineMode] = useState(false)
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false
  })
  const [autoSave, setAutoSave] = useState(true)
  const [clearCacheLoading, setClearCacheLoading] = useState(false)

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: SettingsIcon }
  ]

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'hi', label: 'हिन्दी' }
  ]

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
    // In production, this would apply the theme to the document
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage)
    // In production, this would update the app language
  }

  const handleOfflineModeToggle = () => {
    setOfflineMode(!offlineMode)
    // In production, this would enable/disable service worker for offline support
  }

  const handleClearCache = async () => {
    setClearCacheLoading(true)
    // Simulate cache clearing
    await new Promise(resolve => setTimeout(resolve, 2000))
    setClearCacheLoading(false)
    // In production, this would clear browser cache and IndexedDB
  }

  const handleSaveSettings = () => {
    // In production, this would save settings to backend
    console.log('Settings saved:', { theme, language, offlineMode, notifications, autoSave })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Settings</h2>
          <p className="text-sm text-muted-foreground">
            Manage your application preferences
          </p>
        </div>
        <Button onClick={handleSaveSettings}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme */}
          <div>
            <label className="block text-sm font-medium mb-3">Theme</label>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(option => {
                const Icon = option.icon
                return (
                  <button
                    key={option.value}
                    onClick={() => handleThemeChange(option.value)}
                    className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-colors ${
                      theme === option.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium mb-3">Language</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Offline Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {offlineMode ? <WifiOff className="w-5 h-5" /> : <Wifi className="w-5 h-5" />}
            Offline Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Enable Offline Mode</h4>
              <p className="text-xs text-muted-foreground">
                Allow the app to work without an internet connection
              </p>
            </div>
            <button
              onClick={handleOfflineModeToggle}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                offlineMode ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  offlineMode ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          {offlineMode && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-3">
                <WifiOff className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm mb-1">Offline Mode Active</h4>
                  <p className="text-xs text-muted-foreground">
                    Your data will be synced when you reconnect to the internet. 
                    Some features may be limited while offline.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Email Notifications</h4>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications.email ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.email ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Push Notifications</h4>
              <p className="text-xs text-muted-foreground">Receive in-app notifications</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications.push ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.push ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">SMS Notifications</h4>
              <p className="text-xs text-muted-foreground">Receive urgent alerts via SMS</p>
            </div>
            <button
              onClick={() => setNotifications(prev => ({ ...prev, sms: !prev.sms }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                notifications.sms ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  notifications.sms ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Data & Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data & Storage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Auto-Save Drafts</h4>
              <p className="text-xs text-muted-foreground">Automatically save inspection drafts</p>
            </div>
            <button
              onClick={() => setAutoSave(!autoSave)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                autoSave ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoSave ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Clear Cache</h4>
              <p className="text-xs text-muted-foreground">Remove cached data and temporary files</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              disabled={clearCacheLoading}
            >
              {clearCacheLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Cache
                </>
              )}
            </Button>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Storage Usage</h4>
              <Badge variant="secondary">45 MB used</Badge>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '15%' }} />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              45 MB of 300 MB used
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Session Timeout</h4>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <select
              defaultValue="30"
              className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="0">Never</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <h4 className="font-medium text-sm">Two-Factor Authentication</h4>
              <p className="text-xs text-muted-foreground">Add extra security to your account</p>
            </div>
            <Badge variant="warning">Not Enabled</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Settings
