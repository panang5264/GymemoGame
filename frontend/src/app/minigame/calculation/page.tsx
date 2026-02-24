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

  const levelParam = parseInt(searchParams.get('level') ?? '1', 10)
  const mode = searchParams.get('mode') ?? 'practice'
  const seed = searchParams.get('seed') ?? new Date().toISOString().split('T')[0]
  const subId = parseInt(searchParams.get('subId') ?? '1', 10)
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
    const q = level.generate_problem(level.maxNumber)
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

    const correct = parsed === question.result
    setLastCorrect(correct)
    setScore(s => s + (correct ? 1 : 0))
    setTotal(t => t + 1)

    setTimeout(() => {
      setLastCorrect(null)
      setAnswer('')
      setQuestion(level.generate_problem(level.maxNumber))
    }, 400)
  }, [answer, isTimeUp, level, question])

  // ── Render: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation</h1>
        <div className="dc-card">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧮</div>
          <h2 style={{ marginBottom: '0.5rem' }}>ระดับ {level.level}: {level.name}</h2>
          <p className="dc-subtitle">{level.description}</p>
          <p className="dc-note">
            ตอบโจทย์ให้ได้มากที่สุดใน 1 นาที
            {mode === 'daily' && <> &nbsp;|&nbsp; 🌟 ภารกิจรายวัน</>}
          </p>
          {/* Level selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0' }}>
            {CALC_LEVELS.map(l => (
              <Link
                key={l.level}
                href={`/minigame/calculation?level=${l.level}${mode === 'daily' ? `&mode=daily&seed=${seed}` : ''}`}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  background: l.level === level.level ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.12)',
                  border: l.level === level.level ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                {l.level}
              </Link>
            ))}
          </div>
          <button className="start-button" onClick={startGame} style={{ marginTop: '0.5rem' }}>
            เริ่มเกม 🚀
          </button>
        </div>
      </div>
    )
  }

  // ── Render: memorize ──────────────────────────────────────────────────────
  // ── Render: play ──────────────────────────────────────────────────────────
  if (phase === 'play' && question) {
    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation – ระดับ {level.level}</h1>
        <div className="dc-card">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Timer isRunning={isRunning} initialSeconds={60} onTimeUp={handleTimeUp} />
          </div>
          {isTimeUp && (
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: '#f87171', fontWeight: 700 }}>
              ⏰ หมดเวลา! ไม่สามารถตอบได้แล้ว
            </div>
          )}
          <div className="dc-calc-question" style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {question.operands.map((value, index) => (
              <span key={`op-${index}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem' }}>
                {typeof value === 'number' ? (
                  <span className="game-title">{value}</span>
                ) : (
                  <Image
                    src={value.path}
                    width={75}
                    height={50}
                    style={{ width: 'auto', height: 'auto' }}
                    alt={value.name}
                  />
                )}
                {index < question.operators.length && (
                  <span className="game-title">{question.operators[index].name}</span>
                )}
              </span>
            ))}
          </div>
          {lastCorrect !== null && (
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: lastCorrect ? '#4ade80' : '#f87171' }}>
              {lastCorrect ? '✅ ถูกต้อง!' : '❌ ผิด'}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="game-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              Answer:
              <input
                className="border-4 border-white-500"
                name="calcAnswer"
                placeholder="พิมพ์คำตอบ..."
                value={answer}
                disabled={isTimeUp}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSubmit()
                }}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ opacity: isTimeUp ? 0.5 : 1 }}
              />
            </label>
            <button
              className="cta-button"
              disabled={isTimeUp}
              onClick={handleSubmit}
              style={{ opacity: isTimeUp ? 0.5 : 1, cursor: isTimeUp ? 'not-allowed' : 'pointer' }}
            >
              ยืนยัน
            </button>
          </div>
          <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '1rem' }}>
            คะแนน: {score} / {total}
          </p>
        </div>
      </div>
    )
  }

  // ── Render: done ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0

    // Check if the game was triggered from village so route back to Map
    const villageId = searchParams.get('villageId')

    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation – เสร็จสิ้น!</h1>
        <div className="dc-card">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
            {pct >= 75 ? '🏆' : pct >= 50 ? '👍' : '💪'}
          </div>
          <h2>{pct >= 75 ? 'ยอดเยี่ยม!' : pct >= 50 ? 'ดีมาก!' : 'ลองใหม่อีกครั้ง!'}</h2>
          <div className="dc-score-table" style={{ margin: '1.5rem 0' }}>
            <div className="dc-score-row">
              <span>🧮 ระดับ {level.level}</span>
              <span>{score} / {total}</span>
            </div>
            <div className="dc-score-row">
              <span>คะแนน</span>
              <span>{pct}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
            {mode === 'village' && villageId ? (
              <>
                {subId < 12 ? (
                  <Link href={`/world/${villageId}/sublevel/${subId + 1}`} className="start-button" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '0', textDecoration: 'none' }}>
                    ด่านต่อไป 🚀
                  </Link>
                ) : parseInt(villageId, 10) < 10 ? (
                  <Link href={`/world/${parseInt(villageId, 10) + 1}`} className="start-button" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '0', textDecoration: 'none', background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                    หมู่บ้านถัดไป 🏘️
                  </Link>
                ) : null}
                <Link href={`/world/${villageId}`} className="start-button" style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '0', marginTop: (subId < 12 || parseInt(villageId, 10) < 10) ? '1rem' : '0', background: 'linear-gradient(135deg, #667eea, #764ba2)', textDecoration: 'none', color: '#fff' }}>
                  กลับสู่แผนที่ 🗺️
                </Link>
              </>
            ) : mode === 'daily' ? (
              <Link href="/daily-challenge" className="cta-button" style={{ display: 'inline-block' }}>
                กลับภารกิจรายวัน 🌟
              </Link>
            ) : (
              <Link href="/minigame" className="cta-button" style={{ display: 'inline-block' }}>
                กลับมินิเกม 🎮
              </Link>
            )}

            <button className="start-button" onClick={startGame} style={{ marginBottom: 0, marginTop: '1rem', padding: '0.5rem 2rem', fontSize: '1rem' }}>
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
