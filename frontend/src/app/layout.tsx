import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { AuthProvider } from '@/contexts/AuthContext'
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
        <AuthProvider>
          <Header />
          <main className="main">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
