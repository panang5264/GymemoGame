'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { loginUser, updateProfile, getLeaderboard, API_BASE_URL } from '@/lib/api'
import TrainingModal from '@/components/TrainingModal'
import { useAuth } from '@/contexts/AuthContext'
import BrainRadarChart from '@/components/BrainRadarChart'
import WeeklySummaryChart from '@/components/WeeklySummaryChart'
import { useProgress } from '@/contexts/ProgressContext'
import { getDefaultProgress } from '@/lib/levelSystem'
import { getCognitiveAnalysis, getWeeklyTrends } from '@/lib/profile'

type AuthPhase = 'login' | 'name' | 'profile' | 'intro' | 'grandmother' | 'tutorial_summary' | 'assessment' | 'edit_profile'
import ClockIntro from '@/components/ClockIntro'

import { AVATARS, getAvatarPath } from '@/lib/avatars'

export default function Home() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [phase, setPhase] = useState<AuthPhase>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [cognitiveData, setCognitiveData] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const { login, logout, user, token, setUser: setAuthUser } = useAuth()
  const [trainingMode, setTrainingMode] = useState<'management' | 'calculation' | 'spatial' | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar-1')

  const { progress, setProgress, saveProgress, isLoading: progressLoading, history } = useProgress()
  const [clockTarget, setClockTarget] = useState({ hour: 10, minute: 10 })
  const [isClockTraining, setIsClockTraining] = useState(false)
  const [storyStep, setStoryStep] = useState(0)

  useEffect(() => {
    if (progressLoading || !progress) return

    if (progress.userName) {
      setName(progress.userName)
      const isEditMode = searchParams.get('edit') === 'true'

      // Determine initial phase: edit -> intro(if not seen) -> profile
      if (isEditMode) {
        setPhase('edit_profile')
      } else if (!progress.introSeen) {
        setPhase('grandmother')
      } else {
        setPhase('profile')
      }

      // Fetch Analysis Data whenever guestId changes
      if (progress.guestId) {
        fetch(`${API_BASE_URL}/api/analysis/profile/${progress.guestId}`)
          .then(res => res.json())
          .then(res => {
            if (res.success && res.data) {
              setCognitiveData(res.data)
            } else {
              setCognitiveData(null)
            }
          })
          .catch(err => {
            console.error('Failed to fetch profile analysis:', err)
            setCognitiveData(null)
          })
      } else {
        setCognitiveData(null)
      }
    } else {
      setPhase('login')
      setCognitiveData(null)
    }
    setIsReady(true)
  }, [progressLoading, progress?.guestId, progress?.userName, progress?.introSeen, router, searchParams])

  if (progressLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-warm)] flex items-center justify-center font-['Supermarket']">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-black text-indigo-600 animate-pulse">กำลังเตรียมความพร้อม... 🧠</p>
        </div>
      </div>
    )
  }

  if (!isReady || !progress) return null

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

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (token) {
        const res = await updateProfile(token, { name, avatar: selectedAvatar })
        if (res.success) {
          setAuthUser({ ...user!, name, avatar: selectedAvatar })
        }
      }

      const p = { ...progress, userName: name }
      saveProgress(p)

      if (phase === 'edit_profile') {
        setPhase('profile')
      } else {
        setPhase('intro')
      }
    } catch (err: any) {
      setError(err.message || 'บันทึกข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const nextPhase = () => {
    if (phase === 'profile') {
      setPhase('intro') // Go to Intro PDF next, don't skip to world
    }
    else if (phase === 'intro') setPhase('grandmother')
    else if (phase === 'grandmother') setPhase('tutorial_summary')
    else if (phase === 'tutorial_summary') {
      // Randomize clock target: Hour 1-12, Minutes 10, 20, 30, 40, 50
      const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const minutes = [10, 20, 30, 40, 50];
      setClockTarget({
        hour: hours[Math.floor(Math.random() * hours.length)],
        minute: minutes[Math.floor(Math.random() * minutes.length)]
      });
      setPhase('assessment')
    }
    else if (phase === 'assessment') {
      if (isClockTraining) {
        // If we were just training, go back to profile
        setPhase('profile')
        setIsClockTraining(false)
        // Optionally save clock performance in progress here if desired
        const p = { ...progress, lastClockTraining: new Date().toISOString() }
        saveProgress(p)
      } else {
        const p = { ...progress, introSeen: true }
        saveProgress(p)
        router.push('/world')
      }
    }
  }


  return (
    <div className="min-h-screen bg-[var(--bg-warm)] flex items-center justify-center p-4 md:p-6 selection:bg-orange-100 selection:text-orange-900 overflow-hidden font-['Supermarket']">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-100/50 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-100/50 blur-[100px] rounded-full" />
      </div>

      <div className={`w-full relative z-10 transition-all duration-700 ${(phase === 'tutorial_summary' || phase === 'profile') ? 'max-w-5xl' : (phase === 'intro' ? 'max-w-7xl' : (phase === 'login' ? 'max-w-xl' : 'max-w-md'))}`}>

        {/* Phase 1: Login / Forgot Password */}
        {phase === 'login' && (
          <div className="friendly-card animate-in fade-in zoom-in duration-500 relative min-h-[450px] flex flex-col justify-center py-10">
            {/* Guide Button */}
            {!showForgot && (
              <button
                onClick={() => setShowGuide(true)}
                className="absolute top-6 right-6 w-12 h-12 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-2xl hover:bg-indigo-100 transition-colors shadow-sm z-20"
                title="คู่มือการผจญภัย"
              >
                ❓
              </button>
            )}

            <div className="flex flex-col items-center mb-6 md:mb-10 text-center">
              <div className="w-24 h-24 md:w-28 md:h-28 bg-white border-4 border-[#1a1a1a] rounded-full flex items-center justify-center mb-6 overflow-hidden">
                {showForgot ? (
                  <span className="text-5xl">🔑</span>
                ) : (
                  <img src="/assets_employer/logo.png" className="w-full h-full object-cover scale-[1.25]" alt="Gymemo Game Logo" />
                )}
              </div>
              {!showForgot && <p className="text-indigo-600 font-black uppercase tracking-[0.3em] text-xs mb-2">เข้าสู่การผจญภัย</p>}
              <h1 className="text-4xl md:text-5xl font-black text-[#1a1a1a] tracking-tight uppercase">
                {showForgot ? 'ลืมรหัสผ่าน' : 'Gymemo Game'}
              </h1>
              {!showForgot && <p className="text-slate-700 font-black mt-3 text-lg drop-shadow-sm">ยินดีต้อนรับนักสำรวจความจำ!</p>}
            </div>

            {showForgot ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setLoading(true);
                  setError('');
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ phone: username, newPassword: password }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(data.message);
                      setShowForgot(false);
                      setPassword('');
                    } else {
                      setError(data.message);
                    }
                  } catch (err) {
                    setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-6"
              >
                {error && (
                  <div className="bg-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold text-center mb-4">
                    {error}
                  </div>
                )}
                <div className="relative group">
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-2xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">📞</div>
                  <input
                    type="tel"
                    placeholder="ระบุเบอร์โทรศัพท์ที่สมัคร"
                    className="pill-input pill-input-icon w-full py-4 text-lg"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-2xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                  <input
                    type="password"
                    placeholder="ตั้งรหัสผ่านใหม่"
                    className="pill-input pill-input-icon w-full py-4 text-lg"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <button disabled={loading} className="pill-button w-full py-4 md:py-5 text-xl md:text-2xl bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_5px_0_#000] active:shadow-none active:translate-y-[2px] disabled:opacity-70">
                    {loading ? 'กำลังดำเนินการ...' : 'บันทึกรหัสผ่านใหม่'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors underline"
                  >
                    ← กลับไปหน้าล็อกอิน
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-100 text-red-600 p-4 rounded-2xl text-sm font-bold text-center mb-4">
                    {error}
                  </div>
                )}
                <div className="relative group">
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-2xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">📞</div>
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
                  <div className="absolute left-7 top-1/2 -translate-y-1/2 text-2xl opacity-60 group-focus-within:opacity-100 transition-opacity z-10">🔒</div>
                  <input
                    type="password"
                    placeholder="รหัสผ่าน (PASSWORD)"
                    className="pill-input pill-input-icon w-full py-5 text-xl"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <button disabled={loading} className="pill-button w-full py-4 md:py-5 text-xl md:text-2xl mt-4 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_5px_0_#000] md:shadow-[0_7px_0_#000] active:shadow-none active:translate-y-[2px] disabled:opacity-70">
                    {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    className="text-base font-bold text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    ลืมรหัสผ่าน? รีเซ็ตได้ที่นี่ 🔑
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 text-center text-base font-bold text-[#717171]">
              ยังไม่มีบัญชี? <Link href="/register" className="text-blue-600 underline hover:text-blue-800 ml-1">สมัครสมาชิก</Link>
            </div>

            {/* Other Options Row: Leaderboard with Game Feel */}
            <div className="mt-10 pt-10 border-t-2 border-[#1a1a1a]/10">
              <p className="text-center text-sm font-bold text-[#717171] mb-8 uppercase tracking-widest">ทางเลือกอื่นสำหรับนักเดินทาง</p>
              <button
                onClick={() => router.push('/leaderboard')}
                className="w-full py-6 bg-slate-800 border-4 border-[#1a1a1a] rounded-full font-black text-white uppercase tracking-widest hover:bg-black transition-all shadow-[8px_8px_0_#4f46e5] text-xl flex items-center justify-center gap-3"
              >
                <span>🏆</span> กระดานผู้นำระดับโลก
              </button>
            </div>
          </div>
        )}

        {/* Guide Popup Modal */}
        {showGuide && (
          <div className="fixed inset-0 z-[120] flex items-start justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-in fade-in duration-300 pt-24 overflow-y-auto">
            <div className="bg-white border-4 border-[#1a1a1a] rounded-[3rem] shadow-[15px_15px_0_#1a1a1a] max-w-md w-full p-8 animate-in zoom-in duration-300 my-auto">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📖</div>
                <h2 className="text-3xl font-black text-[#1a1a1a]">คู่มือการผจญภัย</h2>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4 p-4 bg-orange-50 border-2 border-orange-100 rounded-2xl">
                  <div className="w-10 h-10 shrink-0 bg-orange-400 rounded-full flex items-center justify-center font-black text-white text-xl">!</div>
                  <p className="text-orange-900 font-bold">หากคุณยังไม่เคยเข้าเล่น โปรด "สมัครสมาชิก" เพื่อสร้างประวัติการผจญภัยของคุณก่อนนะครับ</p>
                </div>
                <div className="flex gap-4 px-2">
                  <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">1</div>
                  <p className="text-slate-600 font-bold">เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่านที่คุณสมัครไว้</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">2</div>
                  <p className="text-slate-600 font-bold">ออกเดินทางสำรวจหมู่บ้านต่างๆ เพื่อค้นหายาฟื้นฟูสมอง</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">3</div>
                  <p className="text-slate-600 font-bold">ฝึกฝนทักษะการตัดสินใจ การคำนวณ และความทรงจำผ่านมินิเกม</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">4</div>
                  <p className="text-slate-600 font-bold">สะสมคะแนนเพื่อชิงอันดับหนึ่งในกระดานผู้นำโลก!</p>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-full mt-10 py-4 bg-indigo-600 text-white rounded-full font-black text-xl shadow-[0_6px_0_#312e81] hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all"
              >
                เข้าใจแล้ว พร้อมลุย!
              </button>
            </div>
          </div>
        )}

        {/* Phase 2: Name Input */}
        {phase === 'name' && (
          <div className="friendly-card animate-in slide-in-from-right duration-500 text-center px-4 md:px-8 py-8 md:py-12">
            <div className="text-6xl md:text-7xl mb-6">👋</div>
            <h2 className="text-2xl md:text-3xl font-black text-[#1a1a1a] mb-2">ยินดีที่ได้รู้จัก!</h2>
            <p className="text-[#717171] font-bold mb-8 md:mb-10 text-sm md:text-base">เราควรเรียกคุณว่าอะไรดีครับ?</p>

            <form onSubmit={handleSaveName} className="space-y-4 md:space-y-6">
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
          <div className="friendly-card animate-in zoom-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start">

              {/* ── Left Column: Avatar + Stats + Buttons ── */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mx-auto w-32 h-32 mb-8 group cursor-pointer" onClick={() => setPhase('edit_profile')}>
                  <div className="absolute inset-0 bg-orange-200 border-4 border-[#1a1a1a] rounded-full translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-all" />
                  <div className="relative w-full h-full bg-white border-4 border-[#1a1a1a] rounded-full flex items-center justify-center text-6xl shadow-inner overflow-hidden">
                    <img src={getAvatarPath(user?.avatar || 'avatar-1')} className="w-full h-full object-cover p-1 rounded-full" alt="avatar" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 opacity-0 group-hover:opacity-100 transition-opacity">EDIT</div>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-[#1a1a1a] mb-2">{name}</h2>
                <p className="text-[#717171] font-black uppercase tracking-[0.2em] text-[10px] mb-8">นักสำรวจความจำ | ปลดล็อก {progress?.unlockedVillages?.length || 1}/10 หมู่บ้าน</p>

                <div className="w-full grid grid-cols-2 gap-3 md:gap-5 mb-10 md:mb-12">
                  <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-5 md:p-6 shadow-[6px_6px_0_#1a1a1a] transition-transform hover:scale-105">
                    <div className="text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-2">หมู่บ้าน</div>
                    <div className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter">{progress?.unlockedVillages?.length || 1}</div>
                  </div>
                  <div className="bg-white border-4 border-slate-800 rounded-[2.5rem] p-5 md:p-6 shadow-[6px_6px_0_#1a1a1a] transition-transform hover:scale-105">
                    <div className="text-slate-400 text-xs md:text-sm font-black uppercase tracking-[0.2em] mb-2">คะแนนรวม</div>
                    <div className="text-4xl md:text-6xl font-black text-indigo-600 tracking-tighter">{progress?.totalScore || 0}</div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-4 mt-6">
                  {/* Primary Action */}
                  <button
                    onClick={nextPhase}
                    className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl shadow-[0_8px_0_#312e81] hover:translate-y-[-4px] hover:shadow-[0_12px_0_#312e81] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                  >
                    <span>เข้าสู่บทเรียน</span>
                    <span className="text-3xl">🚀</span>
                  </button>

                  <div className="h-[2px] bg-slate-100 my-2" />

                  {/* Secondary Tools */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => router.push('/leaderboard')}
                      className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all text-sm"
                    >
                      <span>🏆</span> อันดับโลก
                    </button>
                    <button
                      onClick={() => setPhase('edit_profile')}
                      className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all text-sm"
                    >
                      <span>✏️</span> ปรับแต่ง
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('คุณต้องการรีเซ็ตความก้าวหน้าใช่หรือไม่? (ประวัติความสำเร็จของคุณทั้งหมดจะยังคงถูกเก็บไว้)')) {
                          const defaultP = getDefaultProgress()
                          // Deep copy history to preserve it through the reset
                          if (progress.history) {
                            defaultP.history = [...progress.history]
                          }
                          await saveProgress(defaultP)
                          window.location.reload()
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-rose-50 border-2 border-rose-100 rounded-2xl font-black text-rose-600 hover:bg-rose-100 transition-all text-sm"
                    >
                      <span>🔄</span> รีเซ็ตเกม
                    </button>
                    <button
                      onClick={() => setPhase('grandmother')}
                      className="flex items-center justify-center gap-2 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all text-sm"
                    >
                      <span>📖</span> เนื้อเรื่อง
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => { logout(); }}
                  className="mt-10 text-rose-500 font-black text-sm uppercase tracking-widest hover:text-rose-700 transition-colors flex items-center gap-2 mx-auto bg-rose-50 px-6 py-2 rounded-full border-2 border-rose-100"
                >
                  ล็อคเอาท์ 👋
                </button>
              </div>

              {/* ── Right Column: Brain Development ── */}
              <div className="bg-white border-3 border-[#1a1a1a] rounded-[3rem] p-8 shadow-[10px_10px_0_#1a1a1a] text-center">
                <h3 className="text-xl font-black text-[#1a1a1a] mb-2 uppercase tracking-tight flex items-center justify-center gap-2">
                  <span>🧠</span> พัฒนาการสมอง
                </h3>
                <p className="text-sm font-black text-[#717171] uppercase tracking-[0.2em] mb-8 opacity-60">วิเคราะห์ทักษะสมอง</p>

                <BrainRadarChart
                  data={[
                    { label: 'การจัดการ', value: cognitiveData?.averages?.executiveFunction || 0, color: '#4f46e5' },
                    { label: 'การคำนวณ', value: cognitiveData?.averages?.processingSpeed || 0, color: '#3b82f6' },
                    { label: 'มิติสัมพันธ์', value: cognitiveData?.averages?.workingMemory || 0, color: '#10b981' },
                    { label: 'การตอบสนอง', value: cognitiveData?.averages?.attention || 0, color: '#f59e0b' },
                  ]}
                  size={200}
                />

                <div className="mt-10 grid grid-cols-1 gap-4">
                  <div className="p-5 bg-indigo-50 rounded-3xl border-2 border-indigo-200 flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-indigo-400 uppercase tracking-widest">การบริหารจัดการ</span>
                        <div className="w-5 h-5 rounded-full border-2 border-indigo-200 flex items-center justify-center text-[11px] font-black text-indigo-400 cursor-help bg-white shadow-sm" title="ทักษะการตัดสินใจ การวางแผน และจัดลำดับความสำคัญ">i</div>
                      </div>
                      <div className="text-xl font-black text-indigo-900 leading-tight">โหมดจัดการ</div>
                    </div>
                    <div className="text-3xl font-black text-indigo-700 tabular-nums">{Math.round(cognitiveData?.averages?.executiveFunction || 0)}%</div>
                  </div>

                  <div className="p-5 bg-emerald-50 rounded-3xl border-2 border-emerald-200 flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">ความจำขณะทำงาน</span>
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-200 flex items-center justify-center text-[11px] font-black text-emerald-400 cursor-help bg-white shadow-sm" title="ความสามารถในการประมวลผลข้อมูลควบคู่กับการมองภาพมิติในใจ">i</div>
                      </div>
                      <div className="text-2xl font-black text-emerald-900 leading-tight">โหมดมิติสัมพันธ์</div>
                    </div>
                    <div className="text-4xl font-black text-emerald-700 tabular-nums">{Math.round(cognitiveData?.averages?.workingMemory || 0)}%</div>
                  </div>

                  <div className="p-5 bg-blue-50 rounded-3xl border-2 border-blue-200 flex items-center justify-between">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">ความรวดเร็วในการคิด</span>
                        <div className="w-5 h-5 rounded-full border-2 border-blue-200 flex items-center justify-center text-[11px] font-black text-blue-400 cursor-help bg-white shadow-sm" title="ความไวในการตีความโจทย์และหาคำตอบอย่างแม่นยำ">i</div>
                      </div>
                      <div className="text-xl font-black text-blue-900 leading-tight">โหมดคำนวณ</div>
                    </div>
                    <div className="text-3xl font-black text-blue-700 tabular-nums">{Math.round(cognitiveData?.averages?.processingSpeed || 0)}%</div>
                  </div>
                </div>

                {/* Weekly Trends Aggregation */}
                {progress.guestId && (
                  <div className="animate-in slide-in-from-bottom-8 duration-700 delay-300">
                    <WeeklySummaryChart guestId={progress.guestId} />
                  </div>
                )}

                {/* Local History Section */}
                <div className="mt-8 pt-8 border-t-2 border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">📜 ประวัติความสำเร็จ (ในเครื่องนี้)</h4>
                  <div className="space-y-2">
                    {history && history.length > 0 ? (
                      history.map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                          <div className="text-left">
                            <p className="font-black text-slate-700">{new Date(h.date).toLocaleDateString('th-TH')}</p>
                            <p className="text-[10px] text-slate-400">ปลดล็อก {h.villages} หมู่บ้าน</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-indigo-600 text-sm">{h.score.toLocaleString()} แต้ม</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-300 font-bold py-4">ยังไม่พบประวัติการเล่น</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Phase Edit Profile: Change Avatar & Name */}
        {phase === 'edit_profile' && (
          <div className="friendly-card animate-in zoom-in duration-500 max-w-lg mx-auto overflow-hidden">
            <h2 className="text-4xl font-black text-center mb-8 uppercase tracking-tight">แก้ไขโปรไฟล์</h2>

            <form onSubmit={handleSaveName} className="space-y-8">
              <div className="space-y-4">
                <p className="text-center text-sm font-black text-slate-400 uppercase tracking-widest">เลือกอวตาร</p>
                <div className="grid grid-cols-3 gap-4">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`relative aspect-square flex items-center justify-center text-4xl rounded-[2rem] border-4 transition-all ${selectedAvatar === av.id
                        ? 'bg-orange-100 border-orange-500 scale-105 shadow-[4px_4px_0_#f97316]'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                        }`}
                    >
                      <img src={av.imagePath} alt={av.label} className="w-full h-full object-cover p-2 rounded-[2rem]" />
                      {selectedAvatar === av.id && (
                        <div className="absolute -top-2 -right-2 bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
                          ✓
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-center text-sm font-black text-slate-400 uppercase tracking-widest">ชื่อเล่นเสียงเรียกขาน</p>
                <input
                  type="text"
                  placeholder="กรอกชื่อของคุณ..."
                  className="pill-input w-full text-center text-2xl uppercase tracking-widest"
                  value={name}
                  required
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button type="submit" disabled={loading} className="pill-button w-full py-4 md:py-5 text-xl md:text-2xl">
                  {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง ✨'}
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('profile')}
                  className="py-3 md:py-4 text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-xs md:text-sm"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Phase 4: Game Intro Narrative (Story Panels) */}
        {phase === 'intro' && (
          <div className="w-full max-w-4xl mx-auto h-[85vh] flex flex-col items-center justify-center p-4">
            <div className="bg-white border-6 border-black rounded-[3rem] shadow-[15px_15px_0_#000] overflow-hidden w-full flex flex-col h-full animate-in zoom-in duration-500">
              {/* Panel Area */}
              <div className="flex-1 relative overflow-hidden bg-slate-100">
                {/* 
                  Using FINAL enhanced images (DIP processed for sharpness and contrast):
                  Scene1_Final.png, Scene2_Final.png, Scene3_Final.png
                */}
                <img
                  key={storyStep}
                  src={`/assets_employer/background/Scene${storyStep + 1}_Final.png`}
                  alt="Story Panel"
                  className="w-full h-full object-cover scale-[1.1] md:scale-[1.05] animate-in fade-in duration-500"
                  onError={(e) => {
                    // Fallback to HQ if Final missing
                    (e.target as any).src = `/assets_employer/background/Scene${storyStep + 1}_HQ.png`;
                  }}
                />

                {/* Overlay Text Box */}
                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/90 via-black/70 to-transparent pt-20">
                  <div className="max-w-2xl mx-auto space-y-4">
                    <p className="text-white text-xl md:text-2xl font-black leading-relaxed text-center drop-shadow-lg scale-in-95 animate-in fade-in duration-700">
                      {storyStep === 0 && "หมู่บ้านที่เคยเต็มไปด้วยสีสัน กลับถูกเหล่าตัวร้าย 'ความเสื่อมถอย' เข้าจู่โจมและขโมยความสดใสออกจากจิตใจชาวบ้าน!"}
                      {storyStep === 1 && "ในความมืดมิดนั้นเอง... ความหวังได้จุดประกายขึ้น! เมื่อข้าพบเบาะแสของ 'ยาป้องกันสมองเสื่อม' ที่จะช่วยกอบกู้หมู่บ้านได้!"}
                      {storyStep === 2 && "การเดินทางที่ยิ่งใหญ่เริ่มขึ้นแล้ว! ข้าต้องมุ่งหน้าไปข้างหน้า เพื่อนำความทรงจำและความสุขกลับคืนมาให้จงได้!"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar & Button Area */}
              <div className="bg-white p-6 border-t-4 border-black flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex gap-4">
                  {[0, 1, 2].map(i => (
                    <div key={i} className={`h-4 rounded-full transition-all duration-500 border-2 border-black ${storyStep === i ? 'w-12 bg-indigo-600' : 'w-4 bg-slate-200'}`} />
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (storyStep < 2) setStoryStep(storyStep + 1);
                    else nextPhase();
                  }}
                  className="pill-button px-12 py-4 text-xl md:text-2xl group shadow-[4px_4px_0_#000]"
                >
                  {storyStep < 2 ? 'เรื่องราวต่อไป →' : 'เลือกรับแผนที่และลุย! 🗝️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phase 5: Grandmother Story */}
        {phase === 'grandmother' && (
          <div className="max-w-md mx-auto animate-in fade-in zoom-in duration-700">
            <div className="flex flex-col items-center">
              <div className="relative w-full aspect-square max-w-[280px] mb-10 group">
                <div className="absolute inset-0 bg-white border-4 border-black rounded-[3rem] rotate-3 group-hover:rotate-0 transition-transform"></div>
                <div className="absolute inset-0 bg-[#fefae0] border-4 border-black rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform flex items-center justify-center shadow-[10px_10px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets_employer/characters/grandpa_front.png" alt="คุณตา" className="w-full h-full object-contain object-bottom scale-125 translate-y-2" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-red-500 text-white w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0_#000] rotate-12 z-10">❤️</div>
              </div>

              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 relative shadow-[10px_10px_0_#000]">
                {/* Speech bubble arrow */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-l-4 border-t-4 border-black rotate-45"></div>

                <h3 className="text-xl font-black text-black mb-4 uppercase tracking-widest text-center">คุณตาผู้ดูแลหมู่บ้าน</h3>
                <p className="text-2xl font-black leading-relaxed text-[#444] text-center italic">
                  "ความทรงจำของพวกเราน่ะ...<br />
                  ซ่อนอยู่ในความกล้าหาญของคนรุ่นใหม่เช่นเจ้า<br />
                  <span className="text-red-500 underline decoration-wavy decoration-2">ช่วยพาแผนที่นี้กลับมามีชีวิตอีกครั้งนะ</span>"
                </p>
              </div>

              <div className="mt-12 w-full">
                <button
                  onClick={nextPhase}
                  className="pill-button w-full py-4 text-xl shadow-[0_8px_0_#1a1a1a] hover:translate-y-1 hover:shadow-[0_4px_0_#1a1a1a] active:translate-y-2 active:shadow-none transition-all"
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
          <div className="friendly-card !p-6 md:!p-12 animate-in slide-in-from-bottom duration-700 max-w-5xl mx-auto border-[4px] md:border-[6px]">
            <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6 md:mb-10 gap-4 text-center md:text-left">
              <div className="w-full">
                <div className="inline-block px-3 py-0.5 bg-yellow-400 border-2 border-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3">โหมดฝึกซ้อม</div>
                <h2 className="text-3xl md:text-5xl font-black text-black tracking-tighter leading-none mb-3">เรียนรู้วิธีฟื้นฟู 🧠</h2>
                <p className="text-[#717171] font-bold text-xs md:text-base">ทดสอบทักษะทั้ง 3 ด้านเพื่อเตรียมความพร้อมสู่การเดินทางจริง</p>
              </div>
              <div className="flex -space-x-3">
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white border-2 md:border-3 border-black rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl shadow-md md:shadow-lg -rotate-12">📦</div>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white border-2 md:border-3 border-black rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl shadow-md md:shadow-lg rotate-0 z-10">🔢</div>
                <div className="w-10 h-10 md:w-14 md:h-14 bg-white border-2 md:border-3 border-black rounded-lg md:rounded-xl flex items-center justify-center text-lg md:text-2xl shadow-md md:shadow-lg rotate-12">🗺️</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-10 mb-10 md:mb-16">
              {/* Management */}
              <div
                onClick={() => setTrainingMode('management')}
                className="group cursor-pointer relative bg-[#fffcf0] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-20 h-20 bg-orange-100 border-3 border-black rounded-[1.5rem] flex items-center justify-center text-4xl mx-auto mb-6 shadow-[6px_6px_0_#000] group-hover:rotate-12 transition-transform">📦</div>
                <h4 className="font-black text-2xl text-black mb-4 tracking-tighter uppercase">การจัดการ</h4>
                <p className="text-lg font-bold text-black/60 leading-relaxed">
                  ฝึกการแยกแยะสิ่งของตามเงื่อนไข
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  ลองฝึกฝน ⚡
                </div>
              </div>

              {/* Calculation */}
              <div
                onClick={() => setTrainingMode('calculation')}
                className="group cursor-pointer relative bg-[#f0f7ff] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-28 h-28 bg-blue-100 border-4 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-10 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🔢</div>
                <h4 className="font-black text-3xl text-black mb-6 tracking-tighter uppercase">การคำนวณ</h4>
                <p className="text-xl font-bold text-black/60 leading-relaxed">
                  ท้าทายความไวการคำนวณเลข
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  ลองฝึกฝน ⚡
                </div>
              </div>

              {/* Spatial */}
              <div
                onClick={() => setTrainingMode('spatial')}
                className="group cursor-pointer relative bg-[#f0fff4] p-10 rounded-[4rem] border-4 border-black text-center shadow-[15px_15px_0_#000] hover:translate-y-[-12px] transition-all duration-500"
              >
                <div className="w-28 h-28 bg-green-100 border-4 border-black rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-10 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🗺️</div>
                <h4 className="font-black text-3xl text-black mb-6 tracking-tighter uppercase">มิติสัมพันธ์</h4>
                <p className="text-xl font-bold text-black/60 leading-relaxed">
                  วาดภาพในใจและจับคู่มุมมอง
                </p>
                <div className="mt-8 py-3 bg-[var(--border-dark)] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  ลองฝึกฝน ⚡
                </div>
              </div>
            </div>


            <div className="bg-black text-[var(--text-on-dark)] p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] mb-10 md:mb-16 text-center shadow-[0_10px_20px_rgba(0,0,0,0.2)] md:shadow-[0_15px_40px_rgba(0,0,0,0.2)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20 text-7xl md:text-9xl -rotate-12 text-yellow-400">⚡</div>
              <p className="text-xl md:text-3xl font-black leading-tight">
                "ทุกหมู่บ้านรอคอยให้เจ้าปลดปล่อยความทรงจำกลับคืนมา"
              </p>
            </div>

            <button
              onClick={nextPhase}
              className="pill-button w-full py-5 md:py-8 text-xl md:text-3xl shadow-[0_6px_0_#1a1a1a] md:shadow-[0_12px_0_#1a1a1a] hover:translate-y-1 hover:shadow-[0_3px_0_#1a1a1a] md:hover:shadow-[0_6px_0_#1a1a1a] active:translate-y-2 md:active:translate-y-4 active:shadow-none transition-all"
            >
              พร้อมแล้ว! เข้าสู่ก้าวสำคัญ 🗝️
            </button>
          </div>
        )}

        {/* Phase 7: CDT Assessment (Clock Game) */}
        {phase === 'assessment' && (
          <div className="animate-in fade-in duration-700 w-full max-w-4xl relative z-[5000]">
            <ClockIntro
              targetHour={clockTarget.hour}
              targetMinute={clockTarget.minute}
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
