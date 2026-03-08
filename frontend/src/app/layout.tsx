import type { Metadata } from 'next'
import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProgressProvider } from '@/contexts/ProgressContext'
import { Itim, Mali } from 'next/font/google'
import './globals.css'

const itim = Itim({
  weight: '400',
  subsets: ['thai', 'latin'],
  variable: '--font-itim',
  display: 'swap',
})

const mali = Mali({
  weight: ['400', '700'],
  subsets: ['thai', 'latin'],
  variable: '--font-mali',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gymemo Game - เกมฝึกสมอง',
  description: 'เกมจับคู่การ์ดเพื่อฝึกความจำและสมาธิ',
  icons: {
    icon: '/assets_employer/logo.png',
  },
}

import CheatOverlay from '@/components/CheatOverlay'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${itim.variable} ${mali.variable}`}>
        <AuthProvider>
          <ProgressProvider>
            <Header />
            <main className="main">
              {children}
            </main>
            <Footer />
            <Suspense fallback={null}>
              <CheatOverlay />
            </Suspense>
          </ProgressProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
