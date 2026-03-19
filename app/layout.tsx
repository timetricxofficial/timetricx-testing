import type { Metadata } from 'next'
import './globals.css'
import Navbar from '../components/landing/Navbar'
import { ThemeProvider } from '../contexts/ThemeContext'
import { ToastProvider } from '../contexts/ToastContext'
import ClientGuard from './ClientGuard'

// 🚀 Force ALL pages to be dynamic — no SSR caching on Vercel
export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Timetricx',
  description: 'Employee attendance management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ToastProvider>
            <ClientGuard>
              <Navbar />
              {children}
            </ClientGuard>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
