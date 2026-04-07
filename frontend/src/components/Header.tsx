'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getAvatarPath } from '@/lib/avatars'

export default function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (pathname.startsWith('/world')) return null

  const isAdmin = user?.role === 'admin'

  const navLinks = isAdmin
    ? [{ name: 'จัดการระบบ', href: '/admin', icon: '👑' }]
    : [
      { name: 'หน้าแรก', href: '/', icon: '🏠' },
      { name: 'แผนที่', href: '/world', icon: '🗺️' },
      { name: 'ภารกิจรายวัน', href: '/daily-challenge', icon: '🌟' },
      { name: 'อันดับผู้นำ', href: '/leaderboard', icon: '🏆' },
    ]

  return (
    <header className="header bg-white/90 backdrop-blur-md sticky top-0 z-[100] border-b-2 border-slate-100 shadow-sm py-1 md:py-1.5">
      <div className="container max-w-7xl px-2 md:px-4 flex flex-col md:flex-row justify-between items-center gap-1 md:gap-2">

        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-1.5 md:gap-2 hover:scale-105 transition-all group">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative h-7 md:h-12 w-7 md:w-12 flex items-center justify-center">
              {/* Floating Brain Icon - Isolated and Premium */}
              <img
                src="/assets_employer/logo.png"
                alt="Gymemo Logo"
                className="h-full w-auto object-contain drop-shadow-[0_5px_10px_rgba(79,70,229,0.2)] group-hover:rotate-6 transition-transform"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl md:text-3xl font-black text-slate-800 tracking-tighter leading-none">Gymemo</span>
              <span className="text-[6px] md:text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] leading-none mt-0.5 ml-0.5 opacity-80">ฝึกสมองรายวัน</span>
            </div>
          </div>
        </Link>

        {/* Navigation Menu - Simplified UI */}
        {/* User can navigate through the new World Map dashboard grid */}

        {/* User Profile Section */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-1.5 md:gap-3">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Link
                  href={isAdmin ? '/admin' : '/'}
                  className="flex items-center gap-1.5 md:gap-2 bg-white hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-200 rounded-full pl-1 md:pl-1.5 pr-2.5 md:pr-4 py-0.5 md:py-1 transition-all group shadow-sm scale-90 md:scale-100"
                  title={isAdmin ? 'หน้าจัดการระบบ' : 'ดูสถิติส่วนตัว'}
                >
                  <img
                    src={getAvatarPath(user.avatar)}
                    alt="avatar"
                    className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-slate-100 object-cover shadow-sm group-hover:scale-105 transition-transform"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[6px] md:text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">{isAdmin ? 'จัดการ' : 'สวัสดีคุณ'}</span>
                    <span className="text-sm md:text-lg font-black text-slate-700 leading-none group-hover:text-indigo-600 transition-colors uppercase">{user.name}</span>
                  </div>
                </Link>

                {!isAdmin && (
                  <Link
                    href="/?edit=true"
                    className="w-7 h-7 md:w-10 md:h-10 bg-orange-100 text-orange-600 hover:bg-orange-500 hover:text-white rounded-full flex items-center justify-center text-sm md:text-lg transition-all border-2 border-orange-200 hover:border-orange-400 shadow-sm"
                    title="แก้ไขโปรไฟล์"
                  >
                    ✏️
                  </Link>
                )}
              </div>

              <div className="w-[1px] h-4 md:h-6 bg-slate-200 hidden md:block mx-0.5 md:mx-1" />

              <button
                onClick={logout}
                className="w-7 h-7 md:w-10 md:h-10 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[0.6rem] md:rounded-[1rem] flex items-center justify-center transition-all border-2 border-rose-100 hover:border-rose-400 shadow-sm"
                title="ออกจากระบบ"
              >
                <span className="text-sm md:text-lg">👋</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/" className="px-5 py-1.5 rounded-xl bg-indigo-600 text-white font-black text-lg shadow-[3px_3px_0_#312e81] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#312e81] active:translate-y-0 active:shadow-none transition-all">
                เข้าสู่ระบบ
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
