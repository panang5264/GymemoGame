'use client'

/**
 * Standalone Calculation Minigame
 *
 * Supports query params:
 *   ?level=<1-10>           – which calculation level to play (default 1)
 *   ?mode=daily|practice    – daily challenge mode stores score in localStorage
 *   ?seed=YYYY-MM-DD        – deterministic seed (defaults to today)
 *
 * Phases: intro → memorize → test → done
 */

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CALC_LEVELS, CalcQuestion } from '@/lib/calculationLevels'
import { recordPlay, markDailyMode } from '@/lib/levelSystem'
import Timer from '@/components/Timer'
import ClockIntro from '@/components/ClockIntro'

// ─── Inner component (needs useSearchParams inside Suspense) ──────────────────

function CalculationGameInner() {
  const searchParams = useSearchParams()

  const mode = searchParams.get('mode') ?? 'practice'
  const seed = searchParams.get('seed') ?? new Date().toISOString().split('T')[0]
  const subId = searchParams.get('subId') ? parseInt(searchParams.get('subId')!, 10) : 1
  const levelParam = parseInt(searchParams.get('level') ?? (mode === 'village' ? Math.min(subId, 10).toString() : '1'), 10)
  const villageId = searchParams.get('villageId')

  const levelIndex = Math.min(Math.max(levelParam - 1, 0), CALC_LEVELS.length - 1)
  const level = CALC_LEVELS[levelIndex]

  type Phase = 'intro' | 'clock' | 'countdown' | 'play' | 'done'
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(3)
  const [question, setQuestion] = useState<CalcQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [answer, setAnswer] = useState('')
  const [showInfo, setShowInfo] = useState(false)

  // Results from localStorage
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // Clock Target (Randomized once per session)
  const [clockTarget] = useState(() => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  }))

  // ── Countdown logic ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
        return () => clearTimeout(timer)
      } else {
        const q = level.generate_problem()
        setQuestion(q)
        setIsRunning(true)
        setPhase('play')
      }
    }
  }, [phase, countdown, level])

  // ── Record Play for Village Mode ──────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done' && mode === 'village' && villageId) {
      recordPlay(parseInt(villageId, 10), score * 25, 'calculation')
    }
  }, [phase, mode, villageId, score])

  useEffect(() => {
    if (phase === 'done' && mode === 'daily') {
      localStorage.setItem(
        `gymemo_calc_daily_${seed}`,
        JSON.stringify({ score, total })
      )
      markDailyMode(seed, 'calculation')
    }
  }, [phase, mode, seed, score, total])

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    if (levelParam === 1) {
      setPhase('clock')
    } else {
      setPhase('countdown')
    }
    setCountdown(3)
    setScore(0)
    setTotal(0)
    setLastCorrect(null)
    setAnswer('')
    setIsTimeUp(false)
    setIsRunning(false)
  }, [levelParam])

  const handleTimeUp = useCallback(() => {
    setIsTimeUp(true)
    setIsRunning(false)
    setPhase('done')
  }, [])

  // ── Render: Clock Intro ───────────────────────────────────────────────────
  if (phase === 'clock') {
    return (
      <ClockIntro
        targetHour={clockTarget.h}
        targetMinute={clockTarget.m}
        onComplete={() => setPhase('countdown')}
      />
    )
  }

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!question || isTimeUp) return
    if (answer.trim() === '') return
    const parsed = Number(answer)
    if (Number.isNaN(parsed)) return

    const correct = parsed === question.expect_result
    setLastCorrect(correct)
    setScore(s => s + (correct ? 1 : 0))
    setTotal(t => t + 1)

    setTimeout(() => {
      setLastCorrect(null)
      setAnswer('')
      setQuestion(level.generate_problem())
    }, 500)
  }, [answer, question, isTimeUp, level])

  // ── Cheat Mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleCheat = () => {
      setScore(100)
      setTotal(100)
      setPhase('done')
    }
    window.addEventListener('gymemo:cheat_complete', handleCheat)
    return () => window.removeEventListener('gymemo:cheat_complete', handleCheat)
  }, [])

  // ── Render: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl md:text-6xl font-black mb-8 text-white drop-shadow-xl animate-fadeUp">
          🔢 Calculation
        </h1>

        <div className="bg-white/95 backdrop-blur-md border border-white/20 p-6 md:p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center animate-in zoom-in duration-500">
          <div className="text-6xl md:text-7xl mb-6">🧮</div>
          <h2 className="text-xl md:text-2xl font-black mb-2 text-slate-800">ระดับ {level.level}: {level.name}</h2>
          <p className="text-slate-500 mb-8 text-base md:text-lg px-2">{level.description}</p>

          <div className={`${level.level === 10 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50/50 border-blue-100/50'} p-5 rounded-3xl mb-10 border-2 border-dashed`}>
            <p className="text-slate-600 font-bold flex items-center justify-center gap-2">
              <span className={`text-2xl ${level.level === 10 ? 'animate-bounce' : ''}`}>⏱️</span>
              <span>
                <span className={`${level.level === 10 ? 'text-amber-600' : 'text-blue-600'} font-black`}>ภารกิจ:</span> {level.level === 10 ? 'ระวังตัวกวน! ' : ''}ตอบให้ได้มากที่สุดใน <span className="text-slate-900 font-black">1 นาที</span>
              </span>
              {mode === 'daily' && <span className="px-2 py-1 bg-yellow-400 text-yellow-900 rounded-lg text-xs font-black shrink-0">🌟 DAILY</span>}
            </p>
          </div>

          {/* Level selector - only show in practice mode */}
          {mode !== 'village' && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {CALC_LEVELS.map(l => (
                <Link
                  key={l.level}
                  href={`/minigame/calculation?level=${l.level}${mode === 'daily' ? `&mode=daily&seed=${seed}` : ''}`}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-xl font-black transition-all border ${l.level === level.level
                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg scale-110'
                    : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  {l.level}
                </Link>
              ))}
            </div>
          )}

          <button
            className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all"
            onClick={startGame}
          >
            ไปกันเลย! 🚀
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'countdown') {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-[10rem] md:text-[15rem] font-black text-white drop-shadow-[0_10px_50px_rgba(0,0,0,0.3)] animate-ping">
          {countdown > 0 ? countdown : 'GO!'}
        </div>
      </div>
    )
  }

  // ── Render: play ──────────────────────────────────────────────────────────
  if (phase === 'play' && question) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center p-4">
        {/* Responsive Header */}
        <div className="w-full max-w-3xl flex justify-between items-center mb-6 mt-2 md:mt-8 px-2 md:px-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-white drop-shadow-md tracking-tight">🔢 ด่าน {level.level}</h1>
            <button
              onClick={() => setShowInfo(true)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 transition-all active:scale-90"
            >
              <span className="font-serif italic font-black text-sm">i</span>
            </button>
          </div>
          <div className="bg-white/90 backdrop-blur-md px-4 md:px-8 py-2 rounded-2xl border border-white/20 flex items-center gap-2 md:gap-4 shadow-xl">
            <span className="text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-widest hidden xs:block">Score</span>
            <span className="text-xl md:text-3xl font-black text-blue-600">{score}</span>
          </div>
        </div>

        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-md w-full border-4 border-indigo-500 animate-in zoom-in duration-300">
              <h3 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="text-3xl">ℹ️</span> วิธีเล่นด่านนี้
              </h3>
              <div className="space-y-4 text-slate-600 font-bold">
                <p className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                  สังเกตจำนวนที่ต้องบวกจริงๆ เป็นหลัก!
                </p>
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-4xl text-slate-300">★ 15</span>
                  <div>
                    <p className="text-slate-800 font-black">ตัวเลขสีเทา = ตัวหลอก</p>
                    <p className="text-xs opacity-70">ห้ามนำมาคำนวณ ให้มองผ่านไปเลย</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <span className="text-4xl font-black text-slate-800">22</span>
                  <div>
                    <p className="text-indigo-700 font-black">ตัวเลขสีเข้ม = โจทย์จริง</p>
                    <p className="text-xs opacity-70 font-bold uppercase tracking-widest">Calculated numbers</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="w-full mt-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
              >
                เข้าใจแล้ว! 🚀
              </button>
            </div>
          </div>
        )}

        {/* Game Container - Optimized for mobile width and PC laptop height */}
        <div className="bg-white p-6 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl max-w-2xl w-full text-center relative overflow-hidden flex flex-col justify-center min-h-[450px] md:min-h-[550px] animate-fadeUp">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>

          <div className="flex flex-col justify-center mb-6 md:mb-10">
            <div className="scale-110 md:scale-150 relative">
              <Timer isRunning={isRunning} initialSeconds={60} onTimeUp={handleTimeUp} />
              <div className={`absolute -top-3 md:-top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-[8px] md:text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse uppercase tracking-wider ${level.level === 10 ? 'bg-red-500' : 'bg-blue-600 shadow-[0_4px_12px_rgba(79,70,229,0.3)]'}`}>
                {level.level === 10 ? '⚠️ Interference Active ⚠️' : '⏱️ Mission: 1 Minute!'}
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center overflow-y-auto min-h-0">
            <div className="min-h-[140px] md:min-h-[220px] flex items-center justify-center mb-4 md:mb-8">
              <div className="flex justify-center gap-2 md:gap-4 items-center flex-wrap max-w-full px-2">
                {question.operands.map((value, index) => (
                  <div key={`op-${index}`} className="flex items-center gap-2 md:gap-4">
                    {/* 1. Missing Index (The one to answer) */}
                    {question.hidden_index === index ? (
                      <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-blue-50 border-2 md:border-4 border-dashed border-blue-200 rounded-xl md:rounded-2xl text-2xl md:text-4xl text-blue-600 font-black animate-pulse shrink-0">?</div>
                    ) : (question.messing_index === index || question.messing_indices?.includes(index)) ? (
                      /* 2. Messing Index (The distractor / clown / symbol) */
                      <div className="relative group shrink-0">
                        {question.custom_messing?.[index] ? (
                          <span className="text-3xl md:text-5xl font-black text-slate-300 transition-all group-hover:text-slate-400 group-hover:scale-105 whitespace-nowrap">
                            {question.custom_messing[index]}
                          </span>
                        ) : (
                          <>
                            <span className="text-3xl md:text-5xl animate-bounce inline-block">🤡</span>
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">ตัวแปรส่วนเกิน!</div>
                          </>
                        )}
                      </div>
                    ) : typeof value === 'number' ? (
                      /* 3. Normal Number */
                      <span className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter shrink-0">{value}</span>
                    ) : (
                      /* 4. Dice Image */
                      <div className="p-1 md:p-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center justify-center w-[50px] h-[40px] md:w-[100px] md:h-[75px] shrink-0">
                        <Image src={(value as any).path} width={80} height={60} className="rounded-lg object-contain w-full h-full" alt={(value as any).name} />
                      </div>
                    )}

                    {/* Operator between operands */}
                    {index < question.operators.length && (
                      <span className={`${level.level === 10 ? 'text-2xl md:text-4xl text-indigo-400/50' : 'text-2xl md:text-4xl text-indigo-400'} font-black shrink-0`}>
                        {question.operators[index].name}
                      </span>
                    )}

                    {/* Show equals sign at the end */}
                    {index === question.operands.length - 1 && (
                      <div className="flex items-center gap-2 md:gap-4 ml-1 md:ml-2 shrink-0">
                        <span className="text-2xl md:text-4xl font-black text-indigo-400">=</span>
                        {question.final_result !== undefined ? (
                          <span className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-800 tracking-tighter">{question.final_result}</span>
                        ) : (
                          <div className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center bg-blue-50 border-2 md:border-4 border-dashed border-blue-200 rounded-xl md:rounded-2xl text-2xl md:text-4xl text-blue-600 font-black">?</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 w-full max-w-sm mx-auto">
            <div className="flex flex-col items-center gap-5">
              <input
                autoFocus
                inputMode="numeric"
                pattern="[0-9]*"
                className={`w-full bg-slate-50 border-[6px] rounded-[1.5rem] py-4 md:py-6 px-6 md:px-10 text-4xl md:text-5xl font-black text-center outline-none transition-all ${lastCorrect === true ? 'border-green-500 text-green-600 bg-green-50/50' : lastCorrect === false ? 'border-red-500 text-red-600 animate-shake bg-red-50/50' : 'border-slate-100 focus:border-blue-400 text-blue-700'}`}
                placeholder="?"
                value={answer}
                disabled={isTimeUp}
                onKeyDown={(event) => { if (event.key === 'Enter') handleSubmit() }}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button
                className={`w-full py-5 rounded-[1.5rem] font-black text-xl md:text-2xl transition-all ${isTimeUp ? 'bg-slate-100 text-slate-300' : 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl hover:shadow-blue-500/20 active:scale-95'}`}
                disabled={isTimeUp}
                onClick={handleSubmit}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Render: done ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0
    let evaluation = "อาจจะไม่ดี"
    if (pct >= 100) evaluation = "ดี"
    else if (pct >= 70) evaluation = "โอเค"
    else if (pct >= 50) evaluation = "ไม่แย่"

    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-xl border border-white/20 p-8 md:p-12 rounded-[3rem] shadow-2xl max-w-sm md:max-w-md w-full text-center animate-in zoom-in duration-500">
          <div className="text-7xl md:text-8xl mb-6">🎯</div>
          <p className="text-slate-500 font-bold mb-8 italic text-sm">แม่นยำ {pct}%</p>

          <div className="space-y-3 mb-10">
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-slate-500 font-bold text-sm">LEVEL</span>
              <span className="text-xl font-black text-slate-800">{level.level}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
              <span className="text-slate-500 font-bold text-sm">CORRECT</span>
              <span className="text-xl font-black text-blue-600">{score} / {total}</span>
            </div>
            <div className="flex justify-between items-center bg-indigo-600 p-5 rounded-2xl shadow-lg shadow-indigo-200 font-black">
              <span className="text-indigo-100 text-sm">ACCURACY</span>
              <span className="text-3xl text-white">{pct}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {mode === 'village' && villageId ? (
              <>
                {subId < 12 ? (
                  <Link href={`/world/${villageId}/sublevel/${subId + 1}`} className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-[1.5rem] font-black text-xl shadow-lg transition-all text-center active:scale-95">
                    ด่านต่อไป 🚀
                  </Link>
                ) : parseInt(villageId, 10) < 10 ? (
                  <Link href={`/world/${parseInt(villageId, 10) + 1}`} className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[1.5rem] font-black text-xl shadow-lg transition-all text-center active:scale-95">
                    หมู่บ้านต่อไป 🏘️
                  </Link>
                ) : null}
                <Link href={`/world/${villageId}?showSummary=1`} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.5rem] font-black text-lg transition-all text-center">
                  กลับสู่แผนที่ 🗺️
                </Link>
              </>
            ) : mode === 'daily' ? (
              <Link
                href={`/minigame/spatial?mode=daily&villageId=${villageId}&level=${levelParam}&seed=${seed}`}
                className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[1.5rem] font-black text-xl shadow-lg transition-all text-center active:scale-95"
              >
                ด่านถัดไป: 🗺️ พื้นที่
              </Link>
            ) : (
              <Link href="/minigame" className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[1.5rem] font-black text-lg transition-all text-center">
                กลับมินิเกม 🎮
              </Link>
            )}
            <button className="w-full py-4 border-2 border-slate-200 hover:bg-white text-slate-400 rounded-[1.5rem] font-black text-lg transition-all mt-4" onClick={startGame} >
              เล่นอีกครั้ง 🔄
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}

// ─── Page wrapper (Suspense required for useSearchParams in Next.js App Router) ─

export default function CalculationPage() {
  return (
    <Suspense fallback={<div className="game-page"><p>กำลังโหลด…</p></div>}>
      <CalculationGameInner />
    </Suspense>
  )
}
