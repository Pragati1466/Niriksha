import React, { useState } from 'react'
import { Bell, Check, CheckCheck, Trash2, Filter, X, AlertTriangle, Info, CheckCircle, Clock, User } from 'lucide-react'
import { Card, CardHeader, CardContent, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'

const Notifications = () => {
  const [filterType, setFilterType] = useState('all')
  const [selectedNotifications, setSelectedNotifications] = useState([])

  // Mock notifications data - in production, this would come from API
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-001',
      type: 'alert',
      title: 'High Priority Inspection Assigned',
      message: 'You have been assigned to a high priority inspection at Manufacturing Plant XYZ. Due date: 2024-01-20',
      timestamp: '2024-01-15T09:00:00',
      read: false,
      actionUrl: '/app/inspections/ins-003'
    },
    {
      id: 'notif-002',
      type: 'info',
      title: 'Inspection Report Ready',
      message: 'The AI analysis for Restaurant ABC inspection is complete. Review the recommendations.',
      timestamp: '2024-01-14T14:30:00',
      read: false,
      actionUrl: '/app/inspections/ins-001'
    },
    {
      id: 'notif-003',
      type: 'success',
      title: 'Inspection Submitted Successfully',
      message: 'Your inspection for Office Building XYZ has been submitted and is pending review.',
      timestamp: '2024-01-14T10:15:00',
      read: true,
      actionUrl: '/app/inspections/ins-002'
    },
    {
      id: 'notif-004',
      type: 'alert',
      title: 'Draft Expiring Soon',
      message: 'Your draft inspection for City Hospital will expire in 3 days. Complete or delete it.',
      timestamp: '2024-01-13T16:45:00',
      read: false,
      actionUrl: '/app/create'
    },
    {
      id: 'notif-005',
      type: 'info',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance on January 20, 2024 from 2:00 AM to 4:00 AM UTC.',
      timestamp: '2024-01-12T11:00:00',
      read: true,
      actionUrl: null
    },
    {
      id: 'notif-006',
      type: 'success',
      title: 'Profile Updated',
      message: 'Your profile information has been successfully updated.',
      timestamp: '2024-01-11T09:30:00',
      read: true,
      actionUrl: '/app/profile'
    }
  ])

  const filterOptions = [
    { value: 'all', label: 'All Notifications' },
    { value: 'unread', label: 'Unread' },
    { value: 'alert', label: 'Alerts' },
    { value: 'info', label: 'Information' },
    { value: 'success', label: 'Success' }
  ]

  const filteredNotifications = notifications.filter(notif => {
    if (filterType === 'all') return true
    if (filterType === 'unread') return !notif.read
    return notif.type === filterType
  })

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="w-5 h-5 text-warning" />
      case 'info':
        return <Info className="w-5 h-5 text-primary" />
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success" />
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getNotificationBadge = (type) => {
    switch (type) {
      case 'alert':
        return <Badge variant="warning">Alert</Badge>
      case 'info':
        return <Badge variant="secondary">Info</Badge>
      case 'success':
        return <Badge variant="success">Success</Badge>
      default:
        return null
    }
  }

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const deleteSelected = () => {
    if (confirm(`Delete ${selectedNotifications.length} notification(s)?`)) {
      setNotifications(prev => prev.filter(n => !selectedNotifications.includes(n.id)))
      setSelectedNotifications([])
    }
  }

  const toggleSelectNotification = (id) => {
    setSelectedNotifications(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    // In production, this would navigate to the actionUrl
    if (notification.actionUrl) {
      console.log('Navigate to:', notification.actionUrl)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {filterOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <span className="text-sm font-medium">
            {selectedNotifications.length} notification(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectedNotifications.forEach(id => markAsRead(id))
                setSelectedNotifications([])
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Mark Read
            </Button>
            <Button variant="destructive" size="sm" onClick={deleteSelected}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterType === 'all' ? 'All Notifications' : filterOptions.find(o => o.value === filterType)?.label}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({filteredNotifications.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No notifications found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 border border-border rounded-lg transition-colors cursor-pointer ${
                    !notification.read ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleSelectNotification(notification.id)
                    }}
                    className="rounded border-border mt-1"
                  />

                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className={`font-medium text-sm ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </h4>
                      {getNotificationBadge(notification.type)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(notification.timestamp)}</span>
                      {!notification.read && (
                        <span className="text-primary font-medium">• Unread</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notification.id)
                        }}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notification.id)
                      }}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Notifications
