'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadProgress, saveProgress } from '@/lib/levelSystem'

type AuthPhase = 'login' | 'name' | 'profile' | 'intro' | 'grandmother'

export default function Home() {
  const router = useRouter()
  const [phase, setPhase] = useState<AuthPhase>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const p = loadProgress()
    if (p.userName) {
      setName(p.userName)
      setStats(p)
      setPhase('profile')
    }
    setIsReady(true)
  }, [])

  if (!isReady) return null

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setPhase('name')
  }

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    const p = loadProgress()
    p.userName = name
    saveProgress(p)
    setStats(p)
    setPhase('profile')
  }

  const nextPhase = () => {
    if (phase === 'profile') setPhase('intro')
    else if (phase === 'intro') setPhase('grandmother')
    else if (phase === 'grandmother') router.push('/world')
  }

  return (
    <div className="min-h-screen bg-[var(--bg-warm)] flex items-center justify-center p-4 md:p-6 selection:bg-orange-100 selection:text-orange-900 overflow-hidden font-['Supermarket']">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-100/50 blur-[100px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 transition-all duration-700">

        {/* Phase 1: Login */}
        {phase === 'login' && (
          <div className="friendly-card animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[var(--card-bg)] border-4 border-[var(--border-dark)] rounded-full flex items-center justify-center text-4xl mb-4 shadow-[6px_6px_0_var(--border-dark)]">
                🧠
              </div>
              <h1 className="text-4xl font-black text-[var(--text-main)] tracking-tight uppercase">ยินดีต้อนรับ</h1>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative group">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">👤</div>
                <input
                  type="text"
                  placeholder="USERNAME"
                  className="pill-input pill-input-icon w-full py-4 text-lg"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div className="relative group">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                <input
                  type="password"
                  placeholder="PASSWORD"
                  className="pill-input pill-input-icon w-full py-4 text-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button className="pill-button w-full py-5 text-2xl mt-4 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_6px_0_#000] active:shadow-none active:translate-y-[2px]">
                เข้าสู่ระบบ
              </button>
            </form>

            <div className="mt-8 pt-8 border-t-2 border-[#1a1a1a]/10">
              <p className="text-center text-sm font-bold text-[#717171] mb-6">ล็อกอินโดยเบอร์โทรศัพท์ / เข้าชมทั่วไป</p>
              <button
                onClick={() => router.push('/leaderboard')}
                className="w-full py-4 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-full font-black text-[var(--text-main)] uppercase tracking-widest hover:bg-[var(--border-dark)] hover:text-[var(--text-on-dark)] transition-all shadow-[4px_4px_0_var(--border-dark)]"
              >
                🏆 กระดานผู้นำ
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Name Input */}
        {phase === 'name' && (
          <div className="friendly-card animate-in slide-in-from-right duration-500 text-center">
            <div className="text-7xl mb-6">👋</div>
            <h2 className="text-3xl font-black text-[#1a1a1a] mb-2">ยินดีที่ได้รู้จัก!</h2>
            <p className="text-[#717171] font-bold mb-10">เราควรเรียกคุณว่าอะไรดีครับ?</p>

            <form onSubmit={handleSaveName} className="space-y-6">
              <input
                autoFocus
                type="text"
                placeholder="กรอกชื่อของคุณ..."
                className="pill-input w-full text-center text-2xl uppercase"
                value={name}
                required
                onChange={e => setName(e.target.value)}
              />
              <button className="pill-button w-full py-5 text-xl">
                ยืนยันชื่อ ✨
              </button>
            </form>
          </div>
        )}

        {/* Phase 3: Character Profile */}
        {phase === 'profile' && (
          <div className="friendly-card animate-in zoom-in duration-500 text-center">
            <div className="relative mx-auto w-32 h-32 mb-8">
              <div className="absolute inset-0 bg-orange-200 border-3 border-[#1a1a1a] rounded-full translate-x-1 translate-y-1" />
              <div className="relative w-full h-full bg-white border-3 border-[#1a1a1a] rounded-full flex items-center justify-center text-6xl">
                🧑‍🚀
              </div>
            </div>
            <h2 className="text-4xl font-black text-[#1a1a1a] mb-1">{name}</h2>
            <p className="text-[#717171] font-bold uppercase tracking-[0.2em] text-[10px] mb-10">นักสำรวจความจำระดับ 1</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white border-3 border-[#1a1a1a] rounded-[2rem] p-4 shadow-[4px_4px_0_#1a1a1a]">
                <div className="text-[#717171] text-[10px] font-black uppercase tracking-widest mb-1">หมู่บ้าน</div>
                <div className="text-3xl font-black text-[#1a1a1a]">{stats?.unlockedVillages?.length || 1}</div>
              </div>
              <div className="bg-white border-3 border-[#1a1a1a] rounded-[2rem] p-4 shadow-[4px_4px_0_#1a1a1a]">
                <div className="text-[#717171] text-[10px] font-black uppercase tracking-widest mb-1">คะแนน</div>
                <div className="text-3xl font-black text-[#1a1a1a]">{stats?.totalScore || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={nextPhase} className="pill-button w-full py-5 text-xl">
                ลุยกันเลย! 🚀
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="w-full py-4 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-full font-black text-[var(--text-main)] uppercase tracking-widest hover:bg-[var(--border-dark)] hover:text-[var(--text-on-dark)] transition-all shadow-[4px_4px_0_var(--border-dark)]"
              >
                อันดับ 🏆
              </button>
            </div>

            <button
              onClick={() => {
                const fresh = { ...loadProgress(), userName: '' };
                saveProgress(fresh);
                setPhase('login');
              }}
              className="mt-10 font-black text-[#717171] hover:text-red-500 transition-colors uppercase tracking-[0.1em] text-[10px] underline underline-offset-4"
            >
              ออกจากระบบ / เปลี่ยนชื่อ
            </button>
          </div>
        )}

        {/* Phase 4: Game Intro Narrative */}
        {phase === 'intro' && (
          <div className="text-center animate-in fade-in duration-1000">
            <div className="inline-block px-4 py-1 bg-[var(--border-dark)] text-[var(--text-on-dark)] text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
              Story Prologue
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] mb-8 leading-tight uppercase text-center">
              จุดเริ่มต้นของ<br /><span className="bg-[var(--border-dark)] text-[var(--text-on-dark)] px-2">การเดินทาง</span>
            </h2>
            <p className="text-[#717171] text-lg font-bold leading-relaxed mb-12 max-w-xs mx-auto">
              บนโลกที่ความทรงจำเริ่มเลือนหาย...<br />
              อารยธรรมและความผูกพันกำลังถูกลบเลือน<br />
              มีเพียงคุณเท่านั้นที่จะช่วยได้
            </p>
            <div className="flex justify-center">
              <button onClick={nextPhase} className="pill-button px-16 py-6 text-2xl group">
                ต่อไป <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
              </button>
            </div>
          </div>
        )}

        {/* Phase 5: Grandmother Story Placeholder */}
        {phase === 'grandmother' && (
          <div className="friendly-card p-4 animate-in zoom-in duration-700">
            <div className="relative aspect-[4/3] bg-[#f5e6d3] overflow-hidden rounded-[2.5rem] border-3 border-[#1a1a1a] shadow-[8px_8px_0_rgba(0,0,0,0.1)] mb-8">
              <div className="absolute inset-0 flex items-center justify-center text-9xl">
                👵
              </div>
              <div className="absolute bottom-0 inset-x-0 p-8 bg-[var(--border-dark)]/80 text-[var(--text-on-dark)] backdrop-blur-md">
                <p className="text-lg font-black leading-relaxed italic">
                  "ช่วยพวกเราทีนะลูก นำความทรงจำกลับคืนมาสู่หมู่บ้านของเรา..."
                </p>
              </div>
            </div>
            <div className="px-4 text-center">
              <button onClick={nextPhase} className="pill-button w-full py-6 text-2xl shadow-[6px_6px_0_rgba(0,0,0,0.2)]">
                เริ่มต้นภารกิจ 🏹
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
