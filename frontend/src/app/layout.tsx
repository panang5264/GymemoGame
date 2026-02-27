import type { Metadata } from 'next'
import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
import CheatOverlay from '@/components/CheatOverlay'
import localFont from 'next/font/local'
import './globals.css'

const supermarketFont = localFont({
  src: '../../public/assets/fonts/supermarket.ttf',
  variable: '--font-supermarket',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Gymemo Game - เกมฝึกสมอง',
  description: 'เกมจับคู่การ์ดเพื่อฝึกความจำและสมาธิ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={`${supermarketFont.variable}`}>
        <AuthProvider>
          <Header />
          <main className="main">
            {children}
          </main>
          <Footer />
        </AuthProvider>
        <Suspense fallback={null}>
          <CheatOverlay />
        </Suspense>
      </body>
    </html>
  )
}
