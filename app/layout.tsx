import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { ThemeRegistry } from '@/components/ThemeRegistry'
import QuickWidget from '@/components/quickWidget/QuickWidget'
import PwaBootstrap from '@/components/pwa/PwaBootstrap'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Expense Tracker',
  description: 'Track your daily expenses and manage your budget',
  manifest: '/manifest.ts',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          <AuthProvider>
            {children}
            <QuickWidget />
            <PwaBootstrap />
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  )
} 