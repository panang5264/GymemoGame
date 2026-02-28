'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-6 flex-wrap justify-center w-full md:w-auto">
          <Link href="/" className="logo text-3xl font-black mb-2 md:mb-0">🧠 Gymemo</Link>
          <nav className="nav flex gap-2 items-center flex-wrap justify-center text-sm md:text-base">
            <Link href="/" className="nav-link">หน้าแรก</Link>
            <Link href="/world" className="nav-link">🗺️ แผนที่</Link>
            <Link href="/daily-challenge" className="nav-link">🌟 ภารกิจ</Link>
          </nav>
        </div>

        <div className="flex gap-2 items-center font-black justify-center w-full md:w-auto mt-2 md:mt-0 text-sm md:text-base">
          {user ? (
            <div className="flex items-center gap-2">
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
            <div className="flex gap-2 justify-center w-full md:w-auto">
              <Link href="/" className="nav-link flex-1 text-center justify-center">เข้าสู่ระบบ</Link>
              <Link href="/register" className="nav-link flex-1 text-center justify-center">สมัครสมาชิก</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}