import type { Metadata } from 'next'
import { Suspense } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CheatOverlay from '@/components/CheatOverlay'
import './globals.css'

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
      <body>
        <Header />
        <main className="main">
          {children}
        </main>
        <Footer />
        <Suspense fallback={null}>
          <CheatOverlay />
        </Suspense>
      </body>
    </html>
  )
}
