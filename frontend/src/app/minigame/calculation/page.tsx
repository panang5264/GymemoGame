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
import { recordPlay } from '@/lib/levelSystem'
import Timer from '@/components/Timer'

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

  type Phase = 'intro' | 'play' | 'done'
  const [phase, setPhase] = useState<Phase>('intro')
  const [question, setQuestion] = useState<CalcQuestion | null>(null)
  const [score, setScore] = useState(0)
  const [total, setTotal] = useState(0)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)
  const [answer, setAnswer] = useState('')
  const [isTimeUp, setIsTimeUp] = useState(false)
  const [isRunning, setIsRunning] = useState(false)

  // ── Record Play for Village Mode ──────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done' && mode === 'village' && villageId) {
      recordPlay(parseInt(villageId, 10), score * 25)
    }
  }, [phase, mode, villageId, score])

  useEffect(() => {
    if (phase === 'done' && mode === 'daily') {
      localStorage.setItem(
        `gymemo_calc_daily_${seed}`,
        JSON.stringify({ score, total })
      )
    }
  }, [phase, mode, seed, score, total])

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const q = level.generate_problem()
    setQuestion(q)
    setScore(0)
    setTotal(0)
    setLastCorrect(null)
    setAnswer('')
    setIsTimeUp(false)
    setIsRunning(true)
    setPhase('play')
  }, [level])

  const handleTimeUp = useCallback(() => {
    setIsTimeUp(true)
    setIsRunning(false)
    setPhase('done')
  }, [])

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
    }, 400)
  }, [answer, isTimeUp, level, question])

  // ── Render: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="game-page min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <h1 className="text-4xl md:text-6xl font-black mb-8 text-slate-800 drop-shadow-sm">
          🔢 Calculation
        </h1>

        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-lg max-w-2xl w-full text-center">
          <div className="text-7xl mb-6">🧮</div>
          <h2 className="text-2xl font-bold mb-2 text-slate-700">ระดับ {level.level}: {level.name}</h2>
          <p className="text-slate-500 mb-6 text-lg">{level.description}</p>

          <div className="bg-slate-100 p-4 rounded-2xl mb-8 border border-slate-200">
            <p className="text-slate-600">
              <span className="text-blue-600 font-bold">ภารกิจ:</span> ตอบโจทย์ให้ได้มากที่สุดใน <span className="text-slate-900 font-bold">1 นาที</span>
              {mode === 'daily' && <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-sm border border-yellow-200 font-bold">🌟 รายวัน</span>}
            </p>
          </div>

          {/* Level selector - only show in practice mode */}
          {mode !== 'village' && (
            <div className="flex flex-wrap gap-2 justify-center mb-10">
              {CALC_LEVELS.map(l => (
                <Link
                  key={l.level}
                  href={`/minigame/calculation?level=${l.level}${mode === 'daily' ? `&mode=daily&seed=${seed}` : ''}`}
                  className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold transition-all border ${l.level === level.level
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md scale-110'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                >
                  {l.level}
                </Link>
              ))}
            </div>
          )}

          <button
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all"
            onClick={startGame}
          >
            เริ่มเกม 🚀
          </button>
        </div>
      </div>
    )
  }

  // ── Render: play ──────────────────────────────────────────────────────────
  if (phase === 'play' && question) {
    return (
      <div className="game-page min-h-screen flex flex-col items-center p-4 bg-slate-50">
        <div className="w-full max-w-4xl flex justify-between items-center mb-8 mt-4 px-4">
          <h1 className="text-2xl font-black text-slate-800">🔢 ระดับ {level.level}</h1>
          <div className="bg-white px-6 py-2 rounded-full border border-slate-200 flex items-center gap-4 shadow-sm">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Score</span>
            <span className="text-2xl font-black text-blue-600">{score}</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-8 md:p-12 rounded-[2.5rem] shadow-xl max-w-2xl w-full text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>

          <div className="flex justify-center mb-8">
            <div className="scale-125">
              <Timer isRunning={isRunning} initialSeconds={60} onTimeUp={handleTimeUp} />
            </div>
          </div>

          <div className="min-h-[160px] flex items-center justify-center mb-10">
            <div className="flex justify-center gap-6 items-center flex-wrap">
              {level.level === 8 ? (
                <div className="flex items-center gap-4 scale-150">
                  {/* ... operands matching logic keeps same but simpler style ... */}
                  {/* (Simplified version for space) */}
                  <span className="text-4xl font-black text-slate-800">{typeof question.operands[0] === 'number' ? question.operands[0] : '?'}</span>
                  <span className="text-4xl font-black text-blue-500">{question.operators[0].name}</span>
                  <div className="w-12 h-12 flex items-center justify-center bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl text-3xl text-blue-600 font-black">?</div>
                  <span className="text-4xl font-black text-blue-500">=</span>
                  <span className="text-4xl font-black text-slate-800">{typeof question.operands[1] === 'number' ? question.operands[1] : '?'}</span>
                </div>
              ) : (
                question.operands.map((value, index) => (
                  <div key={`op-${index}`} className="flex items-center gap-6">
                    {level.level === 10 && question.messing_index === index ? (
                      <span className="text-6xl">🤡</span>
                    ) : typeof value === 'number' ? (
                      <span className="text-5xl font-black text-slate-800">{value}</span>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
                        <Image src={value.path} width={80} height={60} className="rounded-lg" alt={value.name} />
                      </div>
                    )}
                    {index < question.operators.length && (
                      <span className="text-4xl font-black text-blue-500">{question.operators[index].name}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex flex-col items-center gap-4">
              <input
                autoFocus
                className={`w-full bg-slate-50 border-4 rounded-2xl py-6 px-10 text-4xl font-black text-center outline-none transition-all ${lastCorrect === true ? 'border-green-500' : lastCorrect === false ? 'border-red-500 animate-shake' : 'border-slate-200 focus:border-blue-500'}`}
                placeholder="???"
                value={answer}
                disabled={isTimeUp}
                onKeyDown={(event) => { if (event.key === 'Enter') handleSubmit() }}
                onChange={(e) => setAnswer(e.target.value)}
              />
              <button
                className={`w-full py-4 rounded-xl font-black text-xl transition-all ${isTimeUp ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg active:scale-95'}`}
                disabled={isTimeUp}
                onClick={handleSubmit}
              >
                ยืนยันคำตอบ
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
    return (
      <div className="game-page min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50">
        <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-xl max-w-md w-full text-center">
          <div className="text-8xl mb-6">
            {pct >= 75 ? '🏆' : pct >= 50 ? '🥈' : '🥉'}
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-6"> {pct >= 75 ? 'ยอดเยี่ยม!' : pct >= 50 ? 'ดีมาก!' : 'ลองใหม่อีกครั้ง!'} </h2>

          <div className="space-y-3 mb-10">
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500 font-bold">ระดับที่เล่น</span>
              <span className="text-xl font-black text-slate-800">{level.level}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500 font-bold">ความถูกต้อง</span>
              <span className="text-xl font-black text-blue-600">{score} / {total}</span>
            </div>
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100 font-black">
              <span className="text-blue-700 font-bold">คะแนนเฉลี่ย</span>
              <span className="text-3xl text-blue-600">{pct}%</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {mode === 'village' && villageId ? (
              <>
                {subId < 12 ? (
                  <Link href={`/world/${villageId}/sublevel/${subId + 1}`} className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg transition-all text-center">
                    ด่านต่อไป 🚀
                  </Link>
                ) : parseInt(villageId, 10) < 10 ? (
                  <Link href={`/world/${parseInt(villageId, 10) + 1}`} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-lg transition-all text-center">
                    หมู่บ้านถัดไป 🏘️
                  </Link>
                ) : null}
                <Link href={`/world/${villageId}`} className="w-full py-4 bg-slate-700 hover:bg-slate-800 text-white rounded-2xl font-black text-lg transition-all text-center">
                  กลับสู่แผนที่ 🗺️
                </Link>
              </>
            ) : mode === 'daily' ? (
              <Link href="/daily-challenge" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all text-center">
                กลับภารกิจรายวัน 🌟
              </Link>
            ) : (
              <Link href="/minigame" className="w-full py-4 bg-slate-600 hover:bg-slate-700 text-white rounded-2xl font-black text-lg transition-all text-center">
                กลับมินิเกม 🎮
              </Link>
            )}
            <button className="w-full py-4 border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-black text-lg transition-all mt-4" onClick={startGame} >
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
