'use client'

import { Suspense, useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Item pool ────────────────────────────────────────────────────────────────

const ITEM_POOL = [
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝',
  '🍑', '🍍', '🥭', '🍒', '🥕', '🌽', '🥦', '🥑',
]

const MEMORIZE_SECS = 8
const STAGE_SECS = 60

function buildRound() {
  const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5)
  const target = shuffled.slice(0, 6)
  const distractors = shuffled.slice(6, 12)
  const choices = [...target, ...distractors].sort(() => Math.random() - 0.5)
  return { target, choices }
}

// ─── Inner component ──────────────────────────────────────────────────────────

function ManagementGame() {
  const searchParams = useSearchParams()
  const subId = parseInt(searchParams.get('subId') ?? '1', 10) || 1

  type Phase = 'intro' | 'memorize' | 'test' | 'done'
  const [phase, setPhase] = useState<Phase>('intro')
  const [round, setRound] = useState(() => buildRound())
  const [selected, setSelected] = useState<string[]>([])
  const [score, setScore] = useState(0)
  const [memorizeLeft, setMemorizeLeft] = useState(MEMORIZE_SECS)
  const [stageLeft, setStageLeft] = useState(STAGE_SECS)
  const expiredRef = useRef(false)

  // Memorize countdown
  useEffect(() => {
    if (phase !== 'memorize') return
    if (memorizeLeft <= 0) { setPhase('test'); return }
    const id = setTimeout(() => setMemorizeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, memorizeLeft])

  // Stage countdown
  const handleExpire = useCallback(() => {
    if (expiredRef.current) return
    expiredRef.current = true
    setPhase('done')
  }, [])

  useEffect(() => {
    if (phase !== 'test') return
    if (stageLeft <= 0) { handleExpire(); return }
    const id = setTimeout(() => setStageLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, stageLeft, handleExpire])

  const startGame = () => {
    const r = buildRound()
    setRound(r)
    setSelected([])
    setScore(0)
    setMemorizeLeft(MEMORIZE_SECS)
    setStageLeft(STAGE_SECS)
    expiredRef.current = false
    setPhase('memorize')
  }

  const toggle = (item: string) => {
    setSelected(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    )
  }

  const submit = () => {
    if (phase !== 'test') return
    const sc = selected.filter(s => round.target.includes(s)).length
    setScore(sc)
    setPhase('done')
  }

  // ── intro ──────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="game-page">
        <h1 className="game-title">📋 Management — ด่าน {subId}</h1>
        <div className="dc-card">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📋</div>
          <h2>จำสิ่งของ แล้วตอบ!</h2>
          <p className="dc-subtitle">
            จำรายการสิ่งของ {MEMORIZE_SECS} วินาที จากนั้นเลือกสิ่งของที่คุณเห็น
          </p>
          <button className="start-button" onClick={startGame}>เริ่มเกม 🚀</button>
        </div>
      </div>
    )
  }

  // ── memorize ───────────────────────────────────────────────────────────────
  if (phase === 'memorize') {
    return (
      <div className="game-page">
        <h1 className="game-title">📋 Management — ด่าน {subId}</h1>
        <div className="dc-card">
          <h2>จำสิ่งของเหล่านี้ไว้! ({memorizeLeft}s)</h2>
          <div className="dc-item-grid">
            {round.target.map(item => (
              <div key={item} className="dc-item dc-item-show">{item}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── test ───────────────────────────────────────────────────────────────────
  if (phase === 'test') {
    return (
      <div className="game-page">
        <h1 className="game-title">📋 Management — ด่าน {subId}</h1>
        <div className="dc-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h2>เลือกสิ่งของที่คุณเห็น ({selected.length}/6)</h2>
            <span
              className={`dc-timer ${stageLeft <= 10 ? 'dc-timer-warn' : ''}`}
              aria-label={`เวลาที่เหลือ ${stageLeft} วินาที`}
            >
              ⏱ {stageLeft}s
            </span>
          </div>
          <div className="dc-item-grid">
            {round.choices.map(item => (
              <div
                key={item}
                className={`dc-item dc-item-choice ${selected.includes(item) ? 'dc-item-selected' : ''}`}
                onClick={() => toggle(item)}
              >
                {item}
              </div>
            ))}
          </div>
          <button className="start-button dc-submit-btn" onClick={submit}>
            ยืนยันคำตอบ ✔️
          </button>
        </div>
      </div>
    )
  }

  // ── done ───────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="game-page">
        <h1 className="game-title">📋 Management — เสร็จสิ้น!</h1>
        <div className="dc-card">
          <div style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>
            {score >= 5 ? '🏆' : score >= 3 ? '👍' : '💪'}
          </div>
          <h2>{score >= 5 ? 'ยอดเยี่ยม!' : score >= 3 ? 'ดีมาก!' : 'ลองใหม่อีกครั้ง!'}</h2>
          <div className="dc-score-table" style={{ margin: '1.5rem 0' }}>
            <div className="dc-score-row">
              <span>📋 ด่าน {subId}</span>
              <span>{score} / 6</span>
            </div>
          </div>
          <button className="start-button" onClick={startGame}>เล่นอีกครั้ง 🔄</button>
        </div>
      </div>
    )
  }

  return null
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="game-page"><p>กำลังโหลด...</p></div>}>
      <ManagementGame />
    </Suspense>
  )
}
