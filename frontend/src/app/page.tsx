'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loginUser, API_BASE_URL } from '@/lib/api'
import TrainingModal from '@/components/TrainingModal'
import { useAuth } from '@/contexts/AuthContext'
import BrainRadarChart from '@/components/BrainRadarChart'
import WeeklySummaryChart from '@/components/WeeklySummaryChart'
import { useProgress } from '@/contexts/ProgressContext'

type AuthPhase = 'login' | 'name' | 'profile' | 'intro' | 'grandmother' | 'tutorial_summary' | 'assessment' | 'edit_profile'
import ClockIntro from '@/components/ClockIntro'
import { updateProfile } from '@/lib/api'

const AVATARS = [
  { id: 'avatar-1', emoji: '🧑‍🚀', label: 'นักบินอวกาศ' },
  { id: 'avatar-2', emoji: '🥷', label: 'นินจา' },
  { id: 'avatar-3', emoji: '🕵️', label: 'นักสืบ' },
  { id: 'avatar-4', emoji: '🧑‍🎨', label: 'ศิลปิน' },
  { id: 'avatar-5', emoji: '👩‍🔬', label: 'นักวิทย์' },
  { id: 'avatar-6', emoji: '🧙‍♂️', label: 'ผู้วิเศษ' },
]

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
  const { login, logout, user, token, setUser: setAuthUser } = useAuth()
  const [trainingMode, setTrainingMode] = useState<'management' | 'calculation' | 'spatial' | null>(null)
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || 'avatar-1')

  const { progress, saveProgress, isLoading } = useProgress()
  const [clockTarget, setClockTarget] = useState({ hour: 10, minute: 10 })

  useEffect(() => {
    if (isLoading || !progress) return

    if (progress.userName) {
      setName(progress.userName)
      // If intro already seen, go directly to world
      if (progress.introSeen) {
        router.replace('/world')
        return
      }
      setPhase('profile')

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
  }, [isLoading, progress?.guestId, progress?.userName, progress?.introSeen, router])

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

      <div className={`w-full relative z-10 transition-all duration-700 ${(phase === 'tutorial_summary' || phase === 'profile') ? 'max-w-5xl' : (phase === 'intro' ? 'max-w-7xl' : 'max-w-md')}`}>

        {/* Phase 1: Login */}
        {phase === 'login' && (
          <div className="friendly-card animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col items-center mb-6 md:mb-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-[var(--card-bg)] border-3 md:border-4 border-[var(--border-dark)] rounded-full flex items-center justify-center text-2xl md:text-3xl mb-3 shadow-[3px_3px_0_var(--border-dark)] md:shadow-[4px_4px_0_var(--border-dark)]">
                🧠
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-[var(--text-main)] tracking-tight uppercase">ยินดีต้อนรับ</h1>
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
                  className="pill-input pill-input-icon w-full py-3 text-base"
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
              <button disabled={loading} className="pill-button w-full py-3 md:py-4 text-lg md:text-xl mt-4 bg-[var(--border-dark)] text-[var(--text-on-dark)] shadow-[0_4px_0_#000] md:shadow-[0_5px_0_#000] active:shadow-none active:translate-y-[2px] disabled:opacity-70">
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
                    {AVATARS.find(a => a.id === (user?.avatar || 'avatar-1'))?.emoji || '🧑‍🚀'}
                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-1 opacity-0 group-hover:opacity-100 transition-opacity">EDIT</div>
                  </div>
                </div>
                <h2 className="text-4xl font-black text-[#1a1a1a] mb-2">{name}</h2>
                <p className="text-[#717171] font-black uppercase tracking-[0.2em] text-[10px] mb-8">นักสำรวจความจำ | ปลดล็อก {progress?.unlockedVillages?.length || 1}/10 หมู่บ้าน</p>

                <div className="w-full grid grid-cols-2 gap-2 md:gap-4 mb-8 md:mb-10">
                  <div className="bg-white border-[2px] md:border-3 border-[#1a1a1a] rounded-2xl md:rounded-[2rem] p-3 md:p-4 shadow-[2px_2px_0_#1a1a1a] md:shadow-[4px_4px_0_#1a1a1a]">
                    <div className="text-[#717171] text-[10px] md:text-[12px] font-black uppercase tracking-widest mb-1">หมู่บ้าน</div>
                    <div className="text-2xl md:text-4xl font-black text-[#1a1a1a]">{progress?.unlockedVillages?.length || 1}</div>
                  </div>
                  <div className="bg-white border-[2px] md:border-3 border-[#1a1a1a] rounded-2xl md:rounded-[2rem] p-3 md:p-4 shadow-[2px_2px_0_#1a1a1a] md:shadow-[4px_4px_0_#1a1a1a]">
                    <div className="text-[#717171] text-[10px] md:text-[12px] font-black uppercase tracking-widest mb-1">คะแนนรวม</div>
                    <div className="text-2xl md:text-4xl font-black text-[#1a1a1a]">{progress?.totalScore || 0}</div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3 md:gap-4">
                  <button
                    onClick={nextPhase}
                    className="pill-button w-full py-3 md:py-4 text-lg md:text-2xl shadow-[0_4px_0_#000] md:shadow-[0_6px_0_#000] hover:translate-y-[-2px] hover:shadow-[0_8px_0_#000] active:translate-y-1 active:shadow-none transition-all"
                  >
                    เริ่มผจญภัย! 🚀
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => router.push('/leaderboard')}
                      className="py-3 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-full font-black text-[var(--text-main)] uppercase tracking-widest hover:bg-[var(--border-dark)] hover:text-[var(--text-on-dark)] transition-all shadow-[4px_4px_0_var(--border-dark)] text-base"
                    >
                      อันดับ 🏆
                    </button>
                    <button
                      onClick={() => setPhase('edit_profile')}
                      className="py-3 bg-white border-3 border-orange-500 rounded-full font-black text-orange-600 uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all shadow-[4px_4px_0_#f97316] text-base"
                    >
                      แก้ไขโปรไฟล์ ✏️
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
                      {av.emoji}
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

        {/* Phase 4: Game Intro Narrative (Using Employer's PDF) */}
        {phase === 'intro' && (
          <div className="text-center animate-in fade-in duration-1000 max-w-6xl mx-auto w-full h-[85vh] flex flex-col items-center">
            <iframe
              src="/assets_employer/background/INTRO.pdf#view=FitH&toolbar=0"
              className="w-full h-full rounded-[1rem] md:rounded-[2rem] border-2 md:border-4 border-black shadow-[4px_4px_0_#1a1a1a] md:shadow-[10px_10px_0_#1a1a1a] bg-white"
              title="Game Intro"
            />
            <div className="mt-4 md:mt-8 w-full max-w-md px-4 md:px-0">
              <button onClick={nextPhase} className="pill-button w-full py-4 md:py-6 text-xl md:text-2xl group shadow-lg md:shadow-xl">
                เริ่มต้นการเดินทาง <span className="inline-block transition-transform group-hover:translate-x-2">→</span>
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
                <div className="absolute inset-0 bg-[#fefae0] border-4 border-black rounded-[3rem] -rotate-3 group-hover:rotate-0 transition-transform flex items-center justify-center shadow-[10px_10px_0_rgba(0,0,0,0.1)] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets_employer/characters/grandpa.png" alt="คุณตา" className="w-full h-full object-cover scale-110 translate-y-4" />
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
                <div className="inline-block px-3 py-0.5 bg-yellow-400 border-2 border-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3">Training Mode</div>
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
                <h4 className="font-black text-2xl text-black mb-4 tracking-tighter uppercase">Management</h4>
                <p className="text-lg font-bold text-black/60 leading-relaxed">
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
