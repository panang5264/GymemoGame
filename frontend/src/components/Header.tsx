'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAvatarPath } from '@/lib/avatars'

export default function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const navLinks = [
    { name: 'หน้าแรก', href: '/', icon: '🏠' },
    { name: 'แผนที่', href: '/world', icon: '🗺️' },
    { name: 'ภารกิจรายวัน', href: '/daily-challenge', icon: '🌟' },
    { name: 'อันดับผู้นำ', href: '/leaderboard', icon: '🏆' },
  ]

  return (
    <header className="header bg-white/80 backdrop-blur-md sticky top-0 z-[50] border-b-4 border-slate-100 shadow-sm py-4">
      <div className="container max-w-7xl px-4 flex flex-col md:flex-row justify-between items-center gap-4">

        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 hover:scale-105 transition-all group">
          <div className="flex items-center gap-4">
            <div className="relative h-14 md:h-16 w-14 md:w-16 flex items-center justify-center">
              {/* Floating Brain Icon - Isolated and Premium */}
              <img
                src="/assets_employer/logo.png"
                alt="Gymemo Logo"
                className="h-full w-auto object-contain drop-shadow-[0_10px_15px_rgba(79,70,229,0.2)] group-hover:rotate-6 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-3xl md:text-5xl font-black text-slate-800 tracking-tighter leading-none">Gymemo</span>
              <span className="text-[10px] md:text-[12px] font-black text-indigo-500 uppercase tracking-[0.3em] leading-none mt-1.5 ml-1 opacity-80">ฝึกสมองรายวัน</span>
            </div>
          </div>
        </Link>

        {/* Navigation Menu - Larger for 30+ readability */}
        <nav className="flex items-center gap-1 md:gap-3 flex-wrap justify-center bg-slate-100/50 p-1 md:p-2 rounded-[2.5rem] border-2 border-slate-100">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2 px-5 py-3 rounded-[2rem] font-black transition-all text-lg md:text-xl border-2 ${pathname === link.href
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-[2px_2px_0_#312e81]'
                : 'text-slate-600 border-transparent hover:bg-white hover:text-indigo-600 hover:border-indigo-100 hover:shadow-sm'
                }`}
            >
              <span className="text-2xl">{link.icon}</span>
              <span className="hidden lg:inline">{link.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="flex items-center gap-3 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-200 rounded-full pl-2 pr-5 py-1.5 transition-all group shadow-sm"
                  title="ดูสถิติส่วนตัว"
                >
                  <img
                    src={getAvatarPath(user.avatar)}
                    alt="avatar"
                    className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-slate-100 object-cover shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">สวัสดีคุณ</span>
                    <span className="text-lg md:text-xl font-black text-slate-700 leading-none group-hover:text-indigo-600 transition-colors uppercase">{user.name}</span>
                  </div>
                </Link>

                <Link
                  href="/?edit=true"
                  className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center text-xl transition-all border-2 border-orange-200 hover:border-orange-400 shadow-sm"
                  title="แก้ไขโปรไฟล์"
                >
                  ✏️
                </Link>
              </div>

              <div className="w-[2px] h-8 bg-slate-200 hidden md:block mx-1" />

              <button
                onClick={logout}
                className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[1rem] md:rounded-[1.2rem] flex items-center justify-center transition-all border-2 border-rose-100 hover:border-rose-400 shadow-sm"
                title="ออกจากระบบ"
              >
                <span className="text-xl">👋</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <Link href="/" className="px-6 py-2 rounded-2xl bg-indigo-600 text-white font-black text-xl shadow-[4px_4px_0_#312e81] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#312e81] active:translate-y-0 active:shadow-none transition-all">
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
