'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser } from '@/lib/api'
import TrainingModal from '@/components/TrainingModal'
import { useAuth } from '@/contexts/AuthContext'
import BrainRadarChart from '@/components/BrainRadarChart'
import { useProgress } from '@/contexts/ProgressContext'

type AuthPhase = 'login' | 'name' | 'profile' | 'intro' | 'grandmother' | 'tutorial_summary' | 'assessment'
import ClockIntro from '@/components/ClockIntro'

export default function Home() {
  const router = useRouter()
  const [phase, setPhase] = useState<AuthPhase>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [cognitiveData, setCognitiveData] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuth()
  const [trainingMode, setTrainingMode] = useState<'management' | 'calculation' | 'spatial' | null>(null)

  const { progress, saveProgress, isLoading } = useProgress()

  useEffect(() => {
    if (isLoading || !progress || isReady) return

    if (progress.userName) {
      setName(progress.userName)
      // If intro already seen, go directly to world
      if (progress.introSeen) {
        router.replace('/world')
        return
      }
      setPhase('profile')
      // Fetch Analysis Data
      if (progress.guestId) {
        fetch(`http://localhost:3001/api/analysis/profile/${progress.guestId}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) setCognitiveData(res.data)
          })
          .catch(err => console.error('Failed to fetch profile analysis:', err))
      }
    }
    setIsReady(true)
  }, [isLoading, progress, isReady, router])

  if (!isReady || isLoading || !progress) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      setLoading(true)
      const res = await loginUser(username, password)
      if (res.success) {
        // Log the user in with the token
        await login(res.data.token, res.data)
        // Refresh local stats info AFTER sync completes
        if (progress.userName || res.data.name) {
          setName(progress.userName || res.data.name)
          if (res.data.name && !progress.userName) {
            const p = { ...progress, userName: res.data.name }
            saveProgress(p)
          }
          setPhase('profile')
        } else {
          setPhase('name')
        }
      }
    } catch (err: any) {
      setError(err.message || 'เบอร์โทรศัพท์หรือรหัสผ่านไม่ถูกต้อง')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault()
    const p = { ...progress, userName: name }
    saveProgress(p)
    // Direct link to the story flow after name entry
    setPhase('intro')
  }

  const nextPhase = () => {
    if (phase === 'profile') {
      const p = { ...progress, introSeen: true }
      saveProgress(p)
      router.push('/world')
    }
    else if (phase === 'intro') setPhase('grandmother')
    else if (phase === 'grandmother') setPhase('tutorial_summary')
    else if (phase === 'tutorial_summary') {
      setPhase('assessment')
    }
    else if (phase === 'assessment') {
      const p = { ...progress, introSeen: true }
      saveProgress(p)
      router.push('/world')
    }
  }


  return (
    <div className="min-h-screen bg-[var(--bg-warm)] flex items-center justify-center p-4 md:p-6 selection:bg-orange-100 selection:text-orange-900 overflow-hidden font-['Supermarket']">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-100/50 blur-[100px] rounded-full" />
      </div>

      <div className={`w-full relative z-10 transition-all duration-700 ${phase === 'tutorial_summary' ? 'max-w-6xl' : 'max-w-md'}`}>

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
              {error && (
                <div className="bg-red-100 text-red-600 p-3 rounded-2xl text-sm font-bold text-center mb-4">
                  {error}
                </div>
              )}
              <div className="relative group">
                <div className="absolute left-7 top-1/2 -translate-y-1/2 text-xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">📞</div>
                <input
                  type="tel"
                  placeholder="เบอร์โทรศัพท์"
                  className="pill-input pill-input-icon w-full py-4 text-lg"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
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
                  required
                />
              </div>
              <button disabled={loading} className="pill-button w-full py-5 text-2xl mt-4 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_6px_0_#000] active:shadow-none active:translate-y-[2px] disabled:opacity-70">
                {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm font-bold text-[#717171]">
              ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 underline hover:text-blue-800 ml-1">สมัครสมาชิก</Link>
            </div>

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
            <p className="text-[#717171] font-bold uppercase tracking-[0.2em] text-[10px] mb-10">นักสำรวจความจำ | ปลดล็อก {progress?.unlockedVillages?.length || 1}/10 หมู่บ้าน</p>

            {/* Brain Development Section (Visual Graph) */}
            <div className="bg-white border-3 border-[#1a1a1a] rounded-[3rem] p-8 shadow-[10px_10px_0_#1a1a1a] mb-12 text-center overflow-hidden">
              <h3 className="text-xl font-black text-[#1a1a1a] mb-2 uppercase tracking-tight flex items-center justify-center gap-2">
                <span>🧠</span> พัฒนาการสมอง
              </h3>
              <p className="text-[10px] font-black text-[#717171] uppercase tracking-[0.2em] mb-6 opacity-60">Cognitive Profile Analysis</p>

              <BrainRadarChart
                data={[
                  { label: 'Management', value: cognitiveData?.averages?.executiveFunction || 65, color: '#4f46e5' },
                  { label: 'Calculation', value: cognitiveData?.averages?.processingSpeed || 45, color: '#3b82f6' },
                  { label: 'Spatial', value: cognitiveData?.averages?.workingMemory || 55, color: '#10b981' },
                  { label: 'Reaction', value: cognitiveData?.averages?.attention || 50, color: '#f59e0b' },
                ]}
                size={220}
              />

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl border-2 border-indigo-100">
                  <div className="text-[8px] font-black text-indigo-400 uppercase">Executive</div>
                  <div className="text-xl font-black text-indigo-700">{Math.round(cognitiveData?.averages?.executiveFunction || 65)}%</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border-2 border-emerald-100">
                  <div className="text-[8px] font-black text-emerald-400 uppercase">Memory</div>
                  <div className="text-xl font-black text-emerald-700">{Math.round(cognitiveData?.averages?.workingMemory || 55)}%</div>
                </div>
              </div>
            </div>


            <div className="grid grid-cols-2 gap-4 mb-10">
              <div className="bg-white border-3 border-[#1a1a1a] rounded-[2rem] p-4 shadow-[4px_4px_0_#1a1a1a]">
                <div className="text-[#717171] text-[10px] font-black uppercase tracking-widest mb-1">หมู่บ้าน</div>
                <div className="text-3xl font-black text-[#1a1a1a]">{progress?.unlockedVillages?.length || 1}</div>
              </div>
              <div className="bg-white border-3 border-[#1a1a1a] rounded-[2rem] p-4 shadow-[4px_4px_0_#1a1a1a]">
                <div className="text-[#717171] text-[10px] font-black uppercase tracking-widest mb-1">คะแนน</div>
                <div className="text-3xl font-black text-[#1a1a1a]">{progress?.totalScore || 0}</div>
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
                logout();
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
          <div className="text-center animate-in fade-in duration-1000 max-w-md mx-auto">
            <div className="inline-block px-4 py-1 bg-[var(--border-dark)] text-[var(--text-on-dark)] text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-6">
              Story Prologue
            </div>
            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-main)] mb-8 leading-tight uppercase text-center">
              จุดเริ่มต้นของ<br /><span className="bg-[var(--border-dark)] text-[var(--text-on-dark)] px-2">การเดินทาง</span>
            </h2>
            <p className="text-[#717171] text-lg font-bold leading-relaxed mb-12">
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

        {/* Phase 5: Grandmother Story */}
        {phase === 'grandmother' && (
          <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[280px] mb-10 group">
                <div className="absolute inset-0 bg-white border-4 border-black rounded-[3rem] rotate-3 group-hover:rotate-0 transition-transform"></div>
                <div className="absolute inset-0 bg-[#fefae0] border-4 border-black rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform flex items-center justify-center text-[10rem] shadow-[10px_10px_0_rgba(0,0,0,0.1)]">
                  👵
                </div>
                <div className="absolute -bottom-4 -right-4 bg-red-500 text-white w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0_#000] rotate-12">❤️</div>
              </div>

              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 relative shadow-[10px_10px_0_#000]">
                {/* Speech bubble arrow */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-l-4 border-t-4 border-black rotate-45"></div>

                <h3 className="text-xl font-black text-black mb-4 uppercase tracking-widest text-center">คุณยายผู้ดูแลหมู่บ้าน</h3>
                <p className="text-2xl font-black leading-relaxed text-[#444] text-center italic">
                  "ความทรงจำของพวกเราน่ะ...<br />
                  ซ่อนอยู่ในความกล้าหาญของคนรุ่นใหม่เช่นเจ้า<br />
                  <span className="text-red-500 underline decoration-wavy decoration-2">ช่วยพาแผนที่นี้กลับมามีชีวิตอีกครั้งนะ</span>"
                </p>
              </div>

              <div className="mt-12 w-full">
                <button
                  onClick={nextPhase}
                  className="pill-button w-full py-6 text-2xl shadow-[0_10px_0_#1a1a1a] hover:translate-y-1 hover:shadow-[0_6px_0_#1a1a1a] active:translate-y-2 active:shadow-none transition-all"
                >
                  รับคำท้าและเตรียมตัว 🏹
                </button>
                <p className="mt-4 text-[10px] font-black text-[#717171] uppercase tracking-[0.2em] text-center">คำสั่งเสียจากผู้อาวุโส</p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 6: Tutorial Summary */}
        {phase === 'tutorial_summary' && (
          <div className="friendly-card !p-12 animate-in slide-in-from-bottom duration-700 max-w-5xl mx-auto border-[6px]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
              <div className="text-left">
                <div className="inline-block px-4 py-1 bg-yellow-400 border-2 border-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full mb-4">Training Mode</div>
                <h2 className="text-6xl font-black text-black tracking-tighter leading-none mb-4">เรียนรู้วิธีฟื้นฟู 🧠</h2>
                <p className="text-[#717171] font-bold text-lg">ทดสอบทักษะทั้ง 3 ด้านเพื่อเตรียมความพร้อมสู่การเดินทางจริง</p>
              </div>
              <div className="flex -space-x-4">
                <div className="w-16 h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-lg -rotate-12">📦</div>
                <div className="w-16 h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-lg rotate-0 z-10">🔢</div>
                <div className="w-16 h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center text-3xl shadow-lg rotate-12">🗺️</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
              {/* Management */}
              <div
                onClick={() => setTrainingMode('management')}
                className="group cursor-pointer relative bg-[#fffcf0] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-28 h-28 bg-orange-100 border-4 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-10 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">📦</div>
                <h4 className="font-black text-3xl text-black mb-6 tracking-tighter uppercase">Management</h4>
                <p className="text-xl font-bold text-black/60 leading-relaxed">
                  ฝึกการแยกแยะสิ่งของตามเงื่อนไข
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Try Training ⚡
                </div>
              </div>

              {/* Calculation */}
              <div
                onClick={() => setTrainingMode('calculation')}
                className="group cursor-pointer relative bg-[#f0f7ff] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-28 h-28 bg-blue-100 border-4 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-10 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🔢</div>
                <h4 className="font-black text-3xl text-black mb-6 tracking-tighter uppercase">Calculation</h4>
                <p className="text-xl font-bold text-black/60 leading-relaxed">
                  ท้าทายความไวการคำนวณเลข
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Try Training ⚡
                </div>
              </div>

              {/* Spatial */}
              <div
                onClick={() => setTrainingMode('spatial')}
                className="group cursor-pointer relative bg-[#f0fff4] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-28 h-28 bg-green-100 border-4 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-10 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🗺️</div>
                <h4 className="font-black text-3xl text-black mb-6 tracking-tighter uppercase">Spatial</h4>
                <p className="text-xl font-bold text-black/60 leading-relaxed">
                  วาดภาพในใจและจับคู่มุมมอง
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Try Training ⚡
                </div>
              </div>
            </div>

            <div className="bg-black text-[var(--text-on-dark)] p-10 rounded-[3.5rem] mb-16 text-center shadow-[0_15px_40px_rgba(0,0,0,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-9xl -rotate-12 text-yellow-400">⚡</div>
              <p className="text-3xl font-black leading-tight">
                "ทุกหมู่บ้านรอคอยให้เจ้าปลดปล่อยความทรงจำกลับคืนมา"
              </p>
            </div>

            <button
              onClick={nextPhase}
              className="pill-button w-full py-10 text-4xl shadow-[0_15px_0_#1a1a1a] hover:translate-y-2 hover:shadow-[0_8px_0_#1a1a1a] active:translate-y-4 active:shadow-none transition-all"
            >
              พร้อมแล้ว! เข้าสู่ก้าวสำคัญ 🗝️
            </button>
          </div>
        )}

        {/* Phase 7: CDT Assessment (Clock Game) */}
        {phase === 'assessment' && (
          <div className="animate-in fade-in duration-700 w-full max-w-4xl relative z-[5000]">
            <ClockIntro
              targetHour={10}
              targetMinute={10}
              onComplete={nextPhase}
            />
          </div>
        )}

        {/* Training Modal Overlay */}
        {trainingMode && (
          <TrainingModal
            mode={trainingMode}
            onClose={() => setTrainingMode(null)}
          />
        )}

      </div>
    </div >
  )
}
