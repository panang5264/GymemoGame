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
import { CALC_LEVELS, seededRng, dateSeed, CalcQuestion } from '@/lib/calculationLevels'
import { recordPlay } from '@/lib/levelSystem'

const MEMORIZE_DURATION = 10  // seconds to study questions before answering

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

  type Phase = 'intro' | 'memorize' | 'test' | 'done'
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<CalcQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [memorizeLeft, setMemorizeLeft] = useState(MEMORIZE_DURATION)
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null)

  // ── Memorize countdown ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'memorize') return
    if (memorizeLeft <= 0) { setPhase('test'); return }
    const id = setTimeout(() => setMemorizeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, memorizeLeft])

  // ── Record Play for Village Mode ──────────────────────────────────────────
  useEffect(() => {
    if (phase === 'done' && mode === 'village' && villageId) {
      recordPlay(parseInt(villageId, 10), score * 25)
    }
  }, [phase, mode, villageId, score])

  // ── Start game ────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const rng = seededRng(dateSeed(seed) + levelIndex * 1000)
    const qs = level.generate(rng, 4)
    setQuestions(qs)
    setCurrentIndex(0)
    setScore(0)
    setMemorizeLeft(MEMORIZE_DURATION)
    setLastCorrect(null)
    setPhase('memorize')
  }, [seed, levelIndex, level])

  // ── Answer handler ────────────────────────────────────────────────────────
  const handleAnswer = (chosen: number) => {
    const q = questions[currentIndex]
    const correct = chosen === q.answer
    setLastCorrect(correct)
    const newScore = score + (correct ? 1 : 0)
    setScore(newScore)

    setTimeout(() => {
      setLastCorrect(null)
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(i => i + 1)
      } else {
        if (mode === 'daily') {
          localStorage.setItem(
            `gymemo_calc_daily_${seed}`,
            JSON.stringify({ score: newScore, total: questions.length })
          )
        }
        setPhase('done')
      }
    }, 400)
  }

  // ── Render: intro ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation</h1>
        <div className="dc-card">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🧮</div>
          <h2 style={{ marginBottom: '0.5rem' }}>ระดับ {level.id}: {level.name}</h2>
          <p className="dc-subtitle">{level.description}</p>
          <p className="dc-note">
            จดจำ {MEMORIZE_DURATION} วินาที → ตอบคำถาม 4 ข้อ
            {mode === 'daily' && <> &nbsp;|&nbsp; 🌟 ภารกิจรายวัน</>}
          </p>
          {/* Level selector */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', margin: '1rem 0' }}>
            {CALC_LEVELS.map(l => (
              <Link
                key={l.id}
                href={`/minigame/calculation?level=${l.id}${mode === 'daily' ? `&mode=daily&seed=${seed}` : ''}`}
                style={{
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  background: l.id === level.id ? 'rgba(255,215,0,0.35)' : 'rgba(255,255,255,0.12)',
                  border: l.id === level.id ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: '0.9rem',
                  textDecoration: 'none',
                }}
              >
                {l.id}
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
  if (phase === 'memorize') {
    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation – ระดับ {level.id}</h1>
        <div className="dc-card">
          <h2>จำโจทย์เหล่านี้ไว้! ({memorizeLeft}s)</h2>
          <div className="dc-calc-list">
            {questions.map((q, i) => (
              <div key={i} className="dc-calc-row">
                <span className="dc-calc-num">ข้อ {i + 1}:</span> {q.expression} = ?
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Render: test ──────────────────────────────────────────────────────────
  if (phase === 'test' && questions.length > 0) {
    const q = questions[currentIndex]
    return (
      <div className="game-page">
        <h1 className="game-title">🔢 Calculation – ระดับ {level.id}</h1>
        <div className="dc-card">
          <h2>ข้อ {currentIndex + 1} / {questions.length}</h2>
          <div className="dc-calc-question">{q.expression} = ?</div>
          {lastCorrect !== null && (
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: lastCorrect ? '#4ade80' : '#f87171' }}>
              {lastCorrect ? '✅ ถูกต้อง!' : '❌ ผิด'}
            </div>
          )}
          <div className="dc-choice-grid">
            {q.choices.map(c => (
              <button
                key={c}
                className="dc-choice-btn"
                onClick={() => handleAnswer(c)}
                disabled={lastCorrect !== null}
              >
                {c}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.9rem', opacity: 0.6, marginTop: '1rem' }}>
            คะแนน: {score} / {currentIndex + 1}
          </p>
        </div>
      </div>
    )
  }

  // ── Render: done ──────────────────────────────────────────────────────────
  if (phase === 'done') {
    const pct = Math.round((score / questions.length) * 100)

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
              <span>🧮 ระดับ {level.id}</span>
              <span>{score} / {questions.length}</span>
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
