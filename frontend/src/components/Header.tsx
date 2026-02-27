'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <Link href="/" className="logo">🧠 Gymemo</Link>
          <nav className="nav" style={{ display: 'inline-flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/" className="nav-link">หน้าแรก</Link>
            <Link href="/world" className="nav-link">🗺️ แผนที่</Link>
            <Link href="/daily-challenge" className="nav-link">🌟 ภารกิจ</Link>
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', fontWeight: '900' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="hidden sm:inline">สวัสดี, {user.name}</span>
              <button
                onClick={logout}
                className="nav-link bg-rose-50 text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white"
                style={{ background: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                ออกจากระบบ 👋
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Link href="/" className="nav-link">เข้าสู่ระบบ</Link>
              <Link href="/register" className="nav-link">สมัครสมาชิก</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}