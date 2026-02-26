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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10 transition-all duration-700">

        {/* Phase 1: Login */}
        {phase === 'login' && (
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/20 animate-in fade-in zoom-in duration-500">
            <h1 className="text-4xl font-black text-slate-800 mb-2 text-center">🧠 Gymemo</h1>
            <p className="text-slate-500 font-bold text-center mb-8 uppercase tracking-widest text-xs">Authentication Portal</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                placeholder="Username (Placeholder)"
                className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 transition-all font-bold"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password (Placeholder)"
                className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-500 transition-all font-bold"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 active:scale-95 transition-all mt-4">
                LOGIN
              </button>
            </form>

            <button
              onClick={() => router.push('/leaderboard')}
              className="w-full mt-6 py-3 bg-slate-50 text-slate-400 rounded-xl font-bold text-sm hover:text-indigo-500 transition-colors uppercase tracking-widest"
            >
              🏆 ดูอันดับผู้เล่นอื่น
            </button>
          </div>
        )}

        {/* Phase 2: Name Input */}
        {phase === 'name' && (
          <div className="bg-white/95 backdrop-blur-xl p-10 rounded-[40px] shadow-2xl border border-white/20 animate-in slide-in-from-right duration-500">
            <div className="text-6xl mb-6 text-center">👋</div>
            <h2 className="text-3xl font-black text-slate-800 mb-2 text-center">ยินดีที่ได้รู้จัก!</h2>
            <p className="text-slate-500 font-bold text-center mb-8">เราควรเรียกคุณว่าอะไรดีครับ?</p>

            <form onSubmit={handleSaveName}>
              <input
                autoFocus
                type="text"
                placeholder="ใส่ชื่อของคุณที่นี่..."
                className="w-full bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 transition-all font-black text-2xl text-center text-blue-600"
                value={name}
                required
                onChange={e => setName(e.target.value)}
              />
              <button className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all mt-6">
                ยืนยันชื่อ ✨
              </button>
            </form>
          </div>
        )}

        {/* Phase 3: Character Profile */}
        {phase === 'profile' && (
          <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[48px] shadow-2xl border border-white/20 animate-in zoom-in duration-500 text-center">
            <div className="relative mx-auto w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-full animate-pulse blur-xl opacity-30" />
              <div className="relative w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-6xl shadow-inner border-4 border-white">
                🧑‍🚀
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-1">{name}</h2>
            <p className="text-indigo-500 font-bold uppercase tracking-[0.2em] text-xs mb-8">Memory Explorer</p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Level Unlocked</div>
                <div className="text-2xl font-black text-slate-800">{stats?.unlockedVillages?.length || 1}</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Score</div>
                <div className="text-2xl font-black text-indigo-600">{stats?.totalScore || 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={nextPhase} className="py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
                เริ่มผจญภัย 🚀
              </button>
              <button
                onClick={() => router.push('/leaderboard')}
                className="py-5 bg-white text-slate-700 rounded-[24px] font-black text-xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-all active:scale-95"
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
              className="mt-8 text-slate-300 font-bold text-xs uppercase tracking-widest hover:text-red-400 transition-colors"
            >
              ออกจากระบบ / เปลี่ยนชื่อ
            </button>
          </div>
        )}

        {/* Phase 4: Game Intro Narrative */}
        {phase === 'intro' && (
          <div className="text-center animate-in fade-in duration-1000">
            <div className="inline-block px-4 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
              Story Prologue
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">
              จุดเริ่มต้นของ<br />การเดินทาง
            </h2>
            <p className="text-indigo-200/80 text-lg font-bold leading-relaxed mb-12">
              บนโลกที่ความทรงจำเริ่มเลือนหาย...<br />
              อารยธรรมและความผูกพันกำลังถูกลบเลือน<br />
              มีเพียงการฝึกฝนและฟื้นฟูเท่านั้นที่จะช่วยได้
            </p>
            <button onClick={nextPhase} className="px-12 py-5 bg-white text-indigo-900 rounded-full font-black text-xl shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all group">
              ต่อไป <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
            </button>
          </div>
        )}

        {/* Phase 4: Grandmother Story Placeholder */}
        {phase === 'grandmother' && (
          <div className="bg-white rounded-[48px] p-2 overflow-hidden shadow-2xl animate-in zoom-in duration-700">
            <div className="relative aspect-video bg-slate-200 overflow-hidden rounded-[40px]">
              {/* Placeholder for Grandmother Image */}
              <div className="absolute inset-0 flex items-center justify-center text-8xl grayscale opacity-50 bg-gradient-to-br from-slate-100 to-slate-300">
                👵
              </div>
              <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white pt-20">
                <p className="text-lg font-black leading-relaxed italic">
                  "ลูกเอ๋ย... หมู่บ้านทั้ง 10 กำลังตกอยู่ในความเงียบเหงา ความจำที่เคยมีหายไปหมดสิ้น เจ้าต้องนำ 'ยานั้น' กลับมาช่วยพวกเรานะ"
                </p>
              </div>
            </div>
            <div className="p-8 text-center">
              <p className="text-slate-500 font-bold mb-8">คุณยายเล่าถึงที่มาของภารกิจสำคัญนี้...</p>
              <button onClick={nextPhase} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-2xl shadow-xl hover:bg-slate-800 transition-all active:scale-95">
                เริ่มต้นการเดินทาง 🚀
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
