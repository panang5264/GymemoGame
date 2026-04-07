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
import { getDefaultProgress, resetGameProgress } from '@/lib/levelSystem'
import { getCognitiveAnalysis, getWeeklyTrends } from '@/lib/profile'

type AuthPhase = 'login' | 'name' | 'profile' | 'intro' | 'grandmother' | 'tutorial_summary' | 'assessment' | 'edit_profile' | 'grandpa_assessment'
import ClockIntro from '@/components/ClockIntro'
import MemoryRecallChallenge from '@/components/MemoryRecallChallenge'

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
  const [activeAvatarCategory, setActiveAvatarCategory] = useState('ธรรมดา')

  const { progress, setProgress, saveProgress, isLoading: progressLoading, history } = useProgress()
  const [clockTarget, setClockTarget] = useState({ hour: 10, minute: 10 })
  const [isClockTraining, setIsClockTraining] = useState(false)
  const [storyStep, setStoryStep] = useState(0)
  const [memoryWords, setMemoryWords] = useState<string[]>([])
  const [assessmentSubPhase, setAssessmentSubPhase] = useState<'memorize' | 'clock' | 'recall' | 'result'>('memorize')
  const [clockEval, setClockEval] = useState<{ score: number, title: string, text: string } | null>(null)
  const [memoryEval, setMemoryEval] = useState<{ tries: number, success: boolean } | null>(null)

  useEffect(() => {
    if (progressLoading || !progress) return

    const activeName = progress.userName || user?.name

    if (activeName) {
      setName(activeName)

      if (!progress.userName && user?.name) {
        saveProgress({ ...progress, userName: user.name })
      }

      const isEditMode = searchParams.get('edit') === 'true'
      const hasSeenIntro = progress.introSeen || (user as any)?.introSeen

      // Determine initial phase: edit -> intro(if not seen) -> profile
      if (isEditMode) {
        setPhase('edit_profile')
      } else if (!hasSeenIntro) {
        setPhase('intro')
      } else {
        setPhase('profile')
      }

      // Fetch Analysis Data whenever guestId changes
      if (progress.guestId) {
        fetch(`${API_BASE_URL}/analysis/profile/${progress.guestId}`)
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
  }, [progressLoading, progress?.guestId, progress?.userName, progress?.introSeen, router, searchParams, user?.name, (user as any)?.introSeen])

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

        // กรองสิทธิ์และนำทางไปยังหน้าใหม่
        if (res.data.role === 'admin') {
          router.push('/admin')
          return
        }

        if (res.data.name || progress.userName) {
          const userName = res.data.name || progress.userName
          setName(userName)

          if (!progress.userName) {
            saveProgress({ ...progress, userName })
          }

          // ถ้าเคยดูเนื้อเรื่องแล้ว ให้เข้าหน้าโปรไฟล์ แต่ถ้ายังให้ดูเนื้อเรื่อง
          if (progress.introSeen || (res.data as any).introSeen) {
            setPhase('profile')
          } else {
            setPhase('intro')
          }
        } else {
          setPhase('name')
        }
      }
    } catch (err: any) {
      setError(err.message || 'เบอร์โทรหรือรหัสผ่านไม่ถูกต้อง')
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
      if (progress.introSeen) {
        router.push('/world')
      } else {
        setPhase('intro')
      }
    }
    else if (phase === 'intro') setPhase('grandmother')
    else if (phase === 'grandmother') setPhase('tutorial_summary')
    else if (phase === 'tutorial_summary') {
      // Randomize clock target
      const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const minutes = [10, 15, 20, 30, 40, 45, 50];
      setClockTarget({
        hour: hours[Math.floor(Math.random() * hours.length)],
        minute: minutes[Math.floor(Math.random() * minutes.length)]
      });
      setAssessmentSubPhase('memorize')
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
    <div className="flex-1 w-full flex flex-col items-center justify-center p-4 md:p-6 bg-[var(--bg-warm)] selection:bg-orange-100 selection:text-orange-900 font-['Supermarket'] overflow-y-auto">
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
                className="absolute top-3 right-3 w-10 h-10 text-xl md:top-6 md:right-6 md:w-12 md:h-12 md:text-2xl rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center hover:bg-indigo-100 transition-colors shadow-sm z-20"
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
                    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ username, newPassword: password }),
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
                    placeholder="ระบุเบอร์โทรที่สมัคร"
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
              <div>
                {/* Welcome Back Shortcut (If already logged in) */}
                {progress.userName && (
                  <div className="mb-10 p-6 bg-indigo-50 border-4 border-black rounded-[2rem] shadow-[8px_8px_0_#312e81] animate-in zoom-in duration-500">
                    <p className="text-indigo-600 font-black text-[10px] uppercase tracking-widest mb-2 text-center">เข้าสู่ระบบล่าสุดในชื่อ</p>
                    <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">{progress.userName} ✨</h3>
                    <button
                      onClick={() => router.push('/world')}
                      className="pill-button w-full py-4 !bg-green-500 !text-white !border-black shadow-[0_6px_0_#166534] hover:shadow-[0_2px_0_#166534] hover:translate-y-0.5 transition-all text-xl"
                    >
                      เข้าสู่แผนที่โลกเลย!
                    </button>
                    <p className="mt-4 text-[9px] text-slate-400 font-black uppercase tracking-widest text-center">หรือล็อกอินใหม่ด้วยบัญชีอื่นด้านล่าง</p>
                  </div>
                )}

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
              </div>
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
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 md:p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-300">
            <div className="bg-white border-[3px] md:border-4 border-[#1a1a1a] rounded-[2rem] md:rounded-[3rem] shadow-[6px_6px_0_#1a1a1a] md:shadow-[15px_15px_0_#1a1a1a] max-w-sm md:max-w-md w-full p-5 md:p-8 animate-in zoom-in duration-300 my-auto max-h-[85vh] flex flex-col">

              <div className="text-center mb-3 md:mb-6 shrink-0">
                <div className="text-3xl md:text-5xl mb-1 md:mb-4">📖</div>
                <h2 className="text-xl md:text-3xl font-black text-[#1a1a1a]">คู่มือการผจญภัย</h2>
              </div>

              <div className="space-y-3 md:space-y-6 overflow-y-auto pr-1 shrink">
                <div className="flex gap-2 md:gap-4 p-3 md:p-4 bg-orange-50 border-2 border-orange-100 rounded-xl md:rounded-2xl">
                  <div className="w-6 h-6 md:w-10 md:h-10 shrink-0 bg-orange-400 rounded-full flex items-center justify-center font-black text-white text-sm md:text-xl">!</div>
                  <p className="text-orange-900 font-bold text-xs md:text-base leading-tight">หากคุณยังไม่เคยเข้าเล่น โปรด "สมัครสมาชิก" เพื่อสร้างประวัติการผจญภัยของคุณก่อนนะครับ</p>
                </div>
                <div className="flex gap-2 md:gap-4 px-1 md:px-2 items-start">
                  <div className="w-6 h-6 md:w-10 md:h-10 mt-0.5 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-sm md:text-lg">1</div>
                  <p className="text-slate-600 font-bold text-xs md:text-base leading-snug">เข้าสู่ระบบด้วยเบอร์โทรศัพท์และรหัสผ่านที่คุณสมัครไว้</p>
                </div>
                <div className="flex gap-2 md:gap-4 px-1 md:px-2 items-start">
                  <div className="w-6 h-6 md:w-10 md:h-10 mt-0.5 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-sm md:text-lg">2</div>
                  <p className="text-slate-600 font-bold text-xs md:text-base leading-snug">ออกเดินทางสำรวจหมู่บ้านต่างๆ เพื่อค้นหายาฟื้นฟูสมอง</p>
                </div>
                <div className="flex gap-2 md:gap-4 px-1 md:px-2 items-start">
                  <div className="w-6 h-6 md:w-10 md:h-10 mt-0.5 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-sm md:text-lg">3</div>
                  <p className="text-slate-600 font-bold text-xs md:text-base leading-snug">ฝึกฝนทักษะการตัดสินใจ การคำนวณ และความทรงจำผ่านมินิเกม</p>
                </div>
                <div className="flex gap-2 md:gap-4 px-1 md:px-2 items-start">
                  <div className="w-6 h-6 md:w-10 md:h-10 mt-0.5 shrink-0 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600 text-sm md:text-lg">4</div>
                  <p className="text-slate-600 font-bold text-xs md:text-base leading-snug">สะสมคะแนนเพื่อชิงอันดับหนึ่งในกระดานผู้นำโลก!</p>
                </div>
              </div>

              <button
                onClick={() => setShowGuide(false)}
                className="w-full mt-5 md:mt-10 py-3 md:py-4 bg-indigo-600 text-white rounded-full font-black text-base md:text-xl shadow-[0_3px_0_#312e81] md:shadow-[0_6px_0_#312e81] hover:translate-y-[-2px] active:translate-y-1 active:shadow-none transition-all shrink-0"
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
                    <span className="text-3xl">✨</span>
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
                        if (window.confirm('คุณต้องการรีเซ็ตการเล่นใหม่ใช่หรือไม่? (ความสำเร็จและเควสรายวันจะยังคงถูกเก็บไว้)')) {
                          const fresh = resetGameProgress(progress)
                          await saveProgress(fresh)
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
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar border-b-2 border-transparent">
                    {history && history.length > 0 ? (
                      history.map((h: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100 text-xs hover:bg-white hover:shadow-sm transition-all group">
                          <div className="text-left">
                            <p className="font-black text-slate-700 group-hover:text-black transition-colors">{new Date(h.date).toLocaleDateString('th-TH')}</p>
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

                {/* Back and Direct Map Buttons */}
                <div className="mt-10 flex flex-col gap-4">
                  <button
                    onClick={() => router.push('/world')}
                    className="pill-button w-full py-5 text-2xl !bg-green-500 !text-white !border-black shadow-[0_8px_0_#166534] hover:translate-y-1 hover:shadow-[0_4px_0_#166534] active:translate-y-2 active:shadow-none transition-all"
                  >
                    เข้าสู่แผนที่โลก
                  </button>
                  <button
                    onClick={() => setPhase('login')}
                    className="text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 py-2"
                  >
                    ← ย้อนกลับหน้าหลัก
                  </button>
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
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {['ธรรมดา', 'ใส่แว่น', 'ชุดพื้นเมือง', 'แว่น+พื้นเมือง'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveAvatarCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all border-2 ${activeAvatarCategory === cat
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-[2px_2px_0_#312e81]'
                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'
                        }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 max-h-[320px] overflow-y-auto p-2 scrollbar-hide">
                  {AVATARS.filter(av => (av as any).category === activeAvatarCategory).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av.id)}
                      className={`relative aspect-square flex items-center justify-center text-4xl rounded-[1.5rem] border-4 transition-all ${selectedAvatar === av.id
                        ? 'bg-orange-100 border-orange-500 scale-105 shadow-[4px_4px_0_#f97316]'
                        : 'bg-white border-slate-100 hover:border-slate-300'
                        }`}
                    >
                      <img src={av.imagePath} alt={av.label} className="w-full h-full object-cover p-2 rounded-[1.5rem]" />
                      {selectedAvatar === av.id && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white">
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
                      {storyStep === 0 && "หมู่บ้านแห่งหนึ่งเคยเป็นสถานที่ที่เต็มไปด้วยชีวิตชีวาและความกระตือรือร้น แต่วันหนึ่งได้ถูกตัวร้ายลึกลับเข้ารุกราน"}
                      {storyStep === 1 && "ตัวร้ายเหล่านี้เป็นสัญลักษณ์ของปัจจัยต่าง ๆ ที่ส่งผลให้สมองเสื่อมถอย ทำให้ชาวบ้านค่อย ๆ สูญเสียความสดใส ความกระฉับกระเฉง และพลังในการใช้ชีวิต"}
                      {storyStep === 2 && "เจ้าสมองจึงตัดสินใจออกเดินทางเพื่อค้นหา “ยาป้องกันสมองเสื่อม” ที่เชื่อกันว่าสามารถปกป้องและฟื้นฟูสมองให้กลับมาแข็งแรงได้อีกครั้ง ระหว่างการเดินทาง ผู้เล่นจะต้องเผชิญกับอุปสรรคและตัวร้ายหลากหลายรูปแบบ!"}
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
                <div className="absolute inset-0 bg-white border-4 border-black rounded-[3rem] rotate-3 group-hover:rotate-0 transition-all duration-500"></div>
                <div className="absolute inset-0 bg-[#fefae0] border-4 border-black rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-all duration-500 flex items-center justify-center shadow-[10px_10px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  <img src="/assets_employer/characters/grandpa_front.png" alt="คุณตา" className="w-full h-full object-contain object-bottom scale-125 translate-y-2 group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-red-500 text-white w-20 h-20 rounded-full border-4 border-black flex items-center justify-center text-3xl shadow-[4px_4px_0_#000] rotate-12 z-10 animate-bounce">❤️</div>
              </div>

              <div className="bg-white border-4 border-black rounded-[2.5rem] p-8 relative shadow-[10px_10px_0_#000] w-full">
                {/* Speech bubble arrow */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-l-4 border-t-4 border-black rotate-45"></div>

                <h3 className="text-xl font-black text-black mb-4 uppercase tracking-widest text-center opacity-40">คุณตาผู้ดูแลหมู่บ้าน</h3>
                <p className="text-3xl font-black leading-tight text-[#1a1a1a] text-center">
                  "พร้อมบริหารสมอง<br />กันหรือยัง?" ✨
                </p>
                <div className="mt-4 text-center">
                  <p className="text-sm font-bold text-slate-400">มาฝึกฝนเพื่อปกป้องหมู่บ้านกันเถอะ!</p>
                </div>
              </div>

              <div className="mt-12 w-full relative">
                <button
                  onClick={nextPhase}
                  className="pill-button w-full py-5 text-2xl !bg-green-500 !text-white !border-black shadow-[0_8px_0_#166534] hover:translate-y-1 hover:shadow-[0_4px_0_#166534] active:translate-y-2 active:shadow-none transition-all relative"
                >
                  พร้อมแล้ว! ✨

                  {/* Red pulsing indicator moved INSIDE the button for perfect alignment */}
                  <div className="absolute right-3 top-1 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                    <div className="w-6 h-6 bg-red-500 rounded-full animate-ping absolute border-2 border-white"></div>
                    <div className="w-6 h-6 bg-red-500 rounded-full relative border-2 border-white"></div>
                  </div>
                </button>
                <p className="mt-4 text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] text-center animate-pulse">ก้าวแรกสู่การเป็นปรมาจารย์</p>
              </div>
            </div>
          </div>
        )}

        {/* Phase 6: Tutorial Summary - Sequential Learning */}
        {phase === 'tutorial_summary' && (
          <div className="friendly-card !p-6 md:!p-12 animate-in slide-in-from-bottom duration-700 max-w-4xl mx-auto border-[4px] md:border-[6px] min-h-[650px] flex flex-col items-center">

            {/* Consistent Top Header */}
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-5xl font-black text-black mb-3 tracking-tight">งั้นมาสอนเล่นกันก่อนนะ</h2>
              {storyStep > 0 && (
                <div className="inline-block px-4 py-1.5 bg-indigo-50 border-2 border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                  ขั้นตอนที่ {storyStep} จาก 3
                </div>
              )}
            </div>

            {/* Step 0: Let's learn or Skip */}
            {storyStep === 0 && (
              <div className="text-center animate-in zoom-in duration-500 py-10">
                <div className="text-7xl md:text-9xl mb-10 drop-shadow-lg">💡</div>
                <p className="text-[#717171] font-bold text-lg mb-12 max-w-sm">เพื่อการผจญภัยที่ราบรื่น มาลองฝึกทักษะพื้นฐานกันครับ</p>

                <div className="flex flex-col gap-6 w-full max-w-xs mx-auto">
                  <div className="relative">
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 rounded-full animate-ping z-10"></div>
                    <button
                      onClick={() => setStoryStep(1)}
                      className="pill-button w-full py-5 text-2xl !bg-indigo-600 !text-white shadow-[0_8px_0_#312e81]"
                    >
                      ลองฝึกฝนกัน ✨
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setClockTarget({ hour: 10, minute: 10 });
                      setAssessmentSubPhase('memorize');
                      setPhase('assessment');
                    }}
                    className="text-slate-400 font-black hover:text-slate-600 transition-colors uppercase tracking-widest text-xs"
                  >
                    ข้ามการฝึกฝน
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Management Tutorial */}
            {storyStep === 1 && (
              <div className="w-full animate-in slide-in-from-right duration-500 text-center flex flex-col items-center">
                <div
                  onClick={() => setTrainingMode('management')}
                  className="group cursor-pointer relative bg-[#fffcf0] p-12 md:p-16 rounded-[4rem] border-4 border-black inline-block shadow-[20px_20px_0_#000] hover:scale-105 transition-all mb-12"
                >
                  <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-10 h-10 bg-red-500 rounded-full animate-ping"></div>
                  <div className="w-28 h-28 bg-orange-100 border-4 border-black rounded-[2rem] flex items-center justify-center text-6xl mx-auto mb-8 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">📦</div>
                  <h4 className="font-black text-4xl text-black mb-6 uppercase">โหมดจัดการ</h4>
                  <p className="text-xl font-bold text-black/60 max-w-sm mx-auto leading-relaxed italic">
                    "ฝึกทักษะการแยกแยะและจัดหมวดหมู่สิ่งของ"
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => setStoryStep(2)}
                    className="pill-button px-20 py-5 text-2xl shadow-[0_8px_0_#1a1a1a]"
                  >
                    ขั้นตอนต่อไป →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Calculation Tutorial */}
            {storyStep === 2 && (
              <div className="w-full animate-in slide-in-from-right duration-500 text-center flex flex-col items-center">
                <div
                  onClick={() => setTrainingMode('calculation')}
                  className="group cursor-pointer relative bg-[#f0f7ff] p-12 md:p-16 rounded-[4rem] border-4 border-black inline-block shadow-[20px_20px_0_#000] hover:scale-105 transition-all mb-12"
                >
                  <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-10 h-10 bg-red-500 rounded-full animate-ping"></div>
                  <div className="w-28 h-28 bg-blue-100 border-4 border-black rounded-[2rem] flex items-center justify-center text-6xl mx-auto mb-8 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🔢</div>
                  <h4 className="font-black text-4xl text-black mb-6 uppercase">โหมดคำนวณ</h4>
                  <p className="text-xl font-bold text-black/60 max-w-sm mx-auto leading-relaxed italic">
                    "ท้าทายความไวในการคิดเลข เพื่อสมองที่เฉียบแหลม"
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => setStoryStep(3)}
                    className="pill-button px-20 py-5 text-2xl shadow-[0_8px_0_#1a1a1a]"
                  >
                    ขั้นตอนต่อไป →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Spatial Tutorial */}
            {storyStep === 3 && (
              <div className="w-full animate-in slide-in-from-right duration-500 text-center flex flex-col items-center">
                <div
                  onClick={() => setTrainingMode('spatial')}
                  className="group cursor-pointer relative bg-[#f0fff4] p-12 md:p-16 rounded-[4rem] border-4 border-black inline-block shadow-[20px_20px_0_#000] hover:scale-105 transition-all mb-12"
                >
                  <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 w-10 h-10 bg-red-500 rounded-full animate-ping"></div>
                  <div className="w-28 h-28 bg-green-100 border-4 border-black rounded-[2rem] flex items-center justify-center text-6xl mx-auto mb-8 shadow-[8px_8px_0_#000] group-hover:rotate-12 transition-transform">🗺️</div>
                  <h4 className="font-black text-4xl text-black mb-6 uppercase">โหมดมิติสัมพันธ์</h4>
                  <p className="text-xl font-bold text-black/60 max-w-sm mx-auto leading-relaxed italic">
                    "ฝึกการมองภาพในใจ และการเชื่อมโยงมิติที่ซับซ้อน"
                  </p>
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => {
                      const hours = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
                      const minutes = [10, 15, 20, 30, 40, 45, 50];
                      setClockTarget({
                        hour: hours[Math.floor(Math.random() * hours.length)],
                        minute: minutes[Math.floor(Math.random() * minutes.length)]
                      });
                      setAssessmentSubPhase('memorize')
                      setPhase('assessment')
                    }}
                    className="pill-button px-14 py-5 text-2xl !bg-[#4ade80] !text-white !border-black shadow-[0_8px_0_#166534] hover:translate-y-1 hover:shadow-[0_4px_0_#166534] active:translate-y-2 active:shadow-none transition-all"
                  >
                    พร้อมผจญภัยจริง! ✨
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phase 7: Integrated Assessment */}
      {phase === 'assessment' && (
        <div className="animate-in fade-in duration-700 fixed inset-0 z-[5000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            {assessmentSubPhase === 'memorize' && (
              <MemoryRecallChallenge
                phase="memorize"
                selectedWords={['หลานสาว', 'สวรรค์', 'ภูเขา']}
                onWordsGenerated={setMemoryWords}
                onComplete={() => {
                  setMemoryWords(['หลานสาว', 'สวรรค์', 'ภูเขา']);
                  setAssessmentSubPhase('clock');
                }}
              />
            )}

            {assessmentSubPhase === 'clock' && (
              <ClockIntro
                targetHour={clockTarget.hour}
                targetMinute={clockTarget.minute}
                showResult={false}
                onEvaluation={(score, title, text) => setClockEval({ score, title, text })}
                onComplete={() => setAssessmentSubPhase('recall')}
              />
            )}

            {assessmentSubPhase === 'recall' && (
              <MemoryRecallChallenge
                phase="recall"
                selectedWords={memoryWords}
                showFeedback={false}
                onEvaluation={(tries, success) => setMemoryEval({ tries, success })}
                onComplete={() => setAssessmentSubPhase('result')}
              />
            )}

            {assessmentSubPhase === 'result' && (
              <div className="fixed inset-0 z-[5050] bg-slate-900/80 backdrop-blur-xl p-4 md:p-6 overflow-y-auto flex flex-col pt-24 md:pt-32 pb-8">
                <div className="max-w-xl w-full bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-center animate-in zoom-in duration-500 relative mx-auto my-auto shrink-0">
                  <div className="absolute -top-14 md:-top-16 left-1/2 -translate-x-1/2 w-28 h-28 md:w-32 md:h-32 bg-gradient-to-b from-amber-100 to-orange-50 rounded-full border-[6px] border-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden flex items-end justify-center z-10 transition-transform duration-500 hover:scale-105">
                    <img src="/assets_employer/characters/grandpa_front.png" alt="คุณตา" className="w-full h-full object-contain scale-[1.3] translate-y-[10%]" />
                  </div>

                  <div className="pt-12 md:pt-16">
                    <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-2 md:mb-3 uppercase tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                      ผลการประเมินเบื้องต้น
                    </h2>
                    <p className="text-slate-500 font-bold mb-6 md:mb-8 text-xs md:text-sm">
                      คุณตาได้สรุปผลระดับการรู้คิดของหลานไว้ตรงนี้แล้วนะ 📝
                    </p>

                    <div className="space-y-4 md:space-y-6 mb-8 md:mb-10">
                      {/* Clock Result */}
                      <div className="relative overflow-hidden group rounded-[1.5rem] md:rounded-[2rem]">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-indigo-100/50 transform transition-transform duration-500 group-hover:scale-105"></div>
                        <div className="relative bg-white/60 backdrop-blur-sm p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-indigo-100 shadow-sm text-left transition-all hover:bg-white hover:shadow-md hover:border-indigo-200">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-2 md:mb-3">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-2xl md:text-3xl shadow-lg shadow-indigo-500/30 shrink-0 transform -rotate-6 group-hover:rotate-0 transition-transform">
                              🕘
                            </div>
                            <div>
                              <span className="text-[10px] md:text-xs font-black text-indigo-500 uppercase tracking-widest block mb-0.5">การประมวลผล & มิติสัมพันธ์</span>
                              <h4 className="font-black text-lg md:text-xl text-indigo-950 uppercase">ทักษะการวางแผน (Clock Task)</h4>
                            </div>
                          </div>
                          <div className="md:pl-[4.5rem]">
                            <p className="font-bold text-slate-600 text-sm md:text-base leading-relaxed">
                              {clockEval?.text || 'การตอบสนองปกติดีมาก แสดงให้เห็นถึงทักษะมิติสัมพันธ์ที่ดีเยี่ยม'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Memory Result */}
                      <div className="relative overflow-hidden group rounded-[1.5rem] md:rounded-[2rem]">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-orange-100/50 transform transition-transform duration-500 group-hover:scale-105"></div>
                        <div className="relative bg-white/60 backdrop-blur-sm p-5 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-amber-100 shadow-sm text-left transition-all hover:bg-white hover:shadow-md hover:border-amber-200">
                          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 mb-2 md:mb-3">
                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl md:text-3xl shadow-lg shadow-amber-500/30 shrink-0 transform rotate-6 group-hover:rotate-0 transition-transform">
                              🧠
                            </div>
                            <div>
                              <span className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest block mb-0.5">ความจำขณะทำงาน</span>
                              <h4 className="font-black text-lg md:text-xl text-amber-950 uppercase">ความจำระยะสั้น (Memory Task)</h4>
                            </div>
                          </div>
                          <div className="md:pl-[4.5rem]">
                            <p className="font-bold text-slate-600 text-sm md:text-base leading-relaxed">
                              {memoryEval?.success
                                ? `ยอดเยี่ยมมาก! หลานความจำดีมาก จำได้แม่นยำในเวลาไม่กี่อึดใจ 🌟`
                                : `ไม่เป็นไรนะ ความจำคนเรามีขึ้นมีลง ฝึกฝนบ่อยๆ เดี๋ยวก็ดีขึ้นเอง! 💪`}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={nextPhase}
                      className="group relative w-full overflow-hidden rounded-[2rem] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl shadow-indigo-500/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity duration-300" />
                      <div className="relative py-4 md:py-5 px-6 flex items-center justify-center gap-3">
                        <span className="font-black text-white text-xl md:text-2xl tracking-wide uppercase">เริ่มออกเดินทางจริง!</span>
                        <span className="text-2xl md:text-3xl group-hover:scale-110 group-hover:-rotate-12 transition-transform">🌍</span>
                      </div>
                    </button>

                    <div className="mt-6 md:mt-8 pt-5 border-t border-slate-100">
                      <details className="group cursor-pointer">
                        <summary className="text-[10px] md:text-xs text-slate-400 font-bold flex items-center justify-center gap-2 list-none outline-none select-none hover:text-slate-600 transition-colors">
                          <span className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-slate-200 flex items-center justify-center group-open:bg-slate-100 group-hover:border-slate-300 transition-colors bg-slate-50">
                            <span className="text-[10px] md:text-[11px] font-black italic">i</span>
                          </span>
                          <span className="underline decoration-slate-200 underline-offset-4 group-hover:decoration-slate-300">คลิกเพื่ออ่านเงื่อนไขการเก็บข้อมูล (PDPA)</span>
                        </summary>
                        <div className="p-4 mt-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <p className="text-[10px] md:text-xs text-slate-500 font-bold leading-relaxed text-left">
                            *ข้อมูลผลการทดสอบนี้จัดเก็บตามมาตรฐาน PDPA เพื่อใช้ในการประมวลผลทักษะการรู้คิดส่วนบุคคลเท่านั้น ผลลัพธ์ที่ได้เป็นเพียงการบันทึกระดับความพยายามในขณะนั้น ไม่ใช่การวินิจฉัยทางการแพทย์ และสามารถพัฒนาได้ผ่านการฝึกฝนอย่างสม่ำเสมอ เพื่อให้ทุกคนสามารถสนุกกับการพัฒนาตนเองได้โดยไม่ต้องกังวลเรื่องคะแนนจนเกินไป
                          </p>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Training Modal Overlay */}
      {trainingMode && (
        <TrainingModal
          mode={trainingMode}
          onClose={() => setTrainingMode(null)}
        />
      )}

    </div >
  )
}
