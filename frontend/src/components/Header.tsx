'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="logo" style={{ display: 'inline-block', marginRight: '1rem' }}>🧠 Gymemo</h1>
          <nav className="nav" style={{ display: 'inline-flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/" className="nav-link">หน้าแรก</Link>
            <Link href="/world" className="nav-link">🗺️ แผนที่หมู่บ้าน</Link>
            <Link href="/daily-challenge" className="nav-link">🌟 ภารกิจรายวัน</Link>
          </nav>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <span>คุณ {user.name}</span>
              <button onClick={logout} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' }}>ออกจากระบบ</button>
            </>
          ) : (
            <>
              <Link href="/" className="nav-link">เข้าสู่ระบบ</Link>
              <Link href="/register" className="nav-link">สมัครสมาชิก</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}