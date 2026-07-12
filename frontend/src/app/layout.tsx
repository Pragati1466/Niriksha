import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register'
import { FloatingChatWidget } from '@/components/ai/floating-chat-widget'
import { OfflineBanner } from '@/components/shared/offline-banner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NIRIKSHA - AI Inspection Intelligence Platform',
  description: 'Government and institutional inspection platform powered by AI',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#8b5cf6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerRegister />
            <OfflineBanner />
            {children}
            <FloatingChatWidget />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
