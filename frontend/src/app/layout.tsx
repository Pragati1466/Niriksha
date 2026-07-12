import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/shared/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { ServiceWorkerRegister } from '@/components/shared/service-worker-register'
import { FloatingChatWidget } from '@/components/ai/floating-chat-widget'

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
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ServiceWorkerRegister />
            {children}
            <FloatingChatWidget />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
