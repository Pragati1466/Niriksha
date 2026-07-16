'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Temporarily disable Service Worker to debug login issues
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister()
          console.log('ServiceWorker unregistered')
        })
      })
    }
  }, [])

  return null
}
