'use client'

/**
 * Daily Challenge page
 *
 * Flow:
 *  1. Check isDailyComplete(dateKey) – shows countdown if all modes done today.
 *  2. On start: run 3 × 60-second stages in order:
 *       Stage 1 – Management  (📋 จัดการ)    : remember items, pick correct ones
 *       Stage 2 – Calculation (🧮 คำนวณ)     : remember equations, answer MCQ
 *       Stage 3 – Spatial     (🗺️ พื้นที่)   : remember grid pattern, reproduce it
 *  3. After each stage: call markDailyMode(dateKey, mode).
 *  4. After stage 3: show results.
 *
 * Reset: every day at local midnight (00:00). See src/lib/dailyChallenge.ts.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  getCountdownToReset,
  getDateKey,
} from '@/lib/dailyChallenge'
import { CALC_LEVELS, seededRng, dateSeed, type CalcQuestion } from '@/lib/calculationLevels'
import {
  isDailyComplete,
  getDailyProgress,
  markDailyMode,
} from '@/lib/levelSystem'

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_DURATION = 60 // seconds per stage
const STAGES = ['📋 การจัดการ', '🧮 การคำนวณ', '🗺️ พื้นที่'] as const

// ─── Stage 1 – Management ────────────────────────────────────────────────────

const ITEM_POOL = [
  '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝',
  '🍑', '🍍', '🥭', '🍒', '🥕', '🌽', '🥦', '🥑',
]

function buildManagementRound() {
  const shuffled = [...ITEM_POOL].sort(() => Math.random() - 0.5)
  const target = shuffled.slice(0, 6)
  const distractors = shuffled.slice(6, 12)
  const choices = [...target, ...distractors].sort(() => Math.random() - 0.5)
  return { target, choices }
}

// ─── Stage 2 – Calculation ───────────────────────────────────────────────────

function buildCalcQuestions(): CalcQuestion[] {
  // Use today's date as a deterministic seed so questions are consistent per day
  const seed = getDateKey()
  const rng = seededRng(dateSeed(seed))
  return CALC_LEVELS[0].generate(rng, 4)
}

// ─── Stage 3 – Spatial ───────────────────────────────────────────────────────

const GRID_SIZE = 5
const HIGHLIGHT_COUNT = 7

function buildSpatialPattern(): boolean[][] {
  const grid: boolean[][] = Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(false)
  )
  let count = 0
  while (count < HIGHLIGHT_COUNT) {
    const r = Math.floor(Math.random() * GRID_SIZE)
    const c = Math.floor(Math.random() * GRID_SIZE)
    if (!grid[r][c]) {
      grid[r][c] = true
      count++
    }
  }
  return grid
}

// ─── Countdown hook ───────────────────────────────────────────────────────────

function useCountdown(initial: number, running: boolean, onExpire: () => void) {
  const [remaining, setRemaining] = useState(initial)
  const expiredRef = useRef(false)

  useEffect(() => {
    setRemaining(initial)
    expiredRef.current = false
  }, [initial])

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true
        onExpire()
      }
      return
    }
    const id = setTimeout(() => setRemaining(r => r - 1), 1000)
    return () => clearTimeout(id)
  }, [running, remaining, onExpire])

  return remaining
}

// ─── Main Component ───────────────────────────────────────────────────────────

type AppPhase =
  | 'locked_daily'
  | 'ready'
  | 'stage1_memorize'
  | 'stage1_test'
  | 'stage2_memorize'
  | 'stage2_test'
  | 'stage3_memorize'
  | 'stage3_test'
  | 'completed'

export default function DailyChallengePage() {
  const [phase, setPhase] = useState<AppPhase>('ready')
  const [countdown, setCountdown] = useState('')
  const [stageScore, setStageScore] = useState([0, 0, 0])
  const [dateKey] = useState(() => getDateKey())

  // Stage timers (running flag)
  const [timerRunning, setTimerRunning] = useState(false)

  // ── Stage 1 state ──────────────────────────────────────────────────────────
  const [mgmtRound, setMgmtRound] = useState(() => buildManagementRound())
  const [mgmtSelected, setMgmtSelected] = useState<string[]>([])
  const [mgmtMemorizeLeft, setMgmtMemorizeLeft] = useState(8)

  // ── Stage 2 state ──────────────────────────────────────────────────────────
  const [calcQuestions, setCalcQuestions] = useState<CalcQuestion[]>([])
  const [calcIndex, setCalcIndex] = useState(0)
  const [calcAnswered, setCalcAnswered] = useState(0)
  const [calcMemorizeLeft, setCalcMemorizeLeft] = useState(10)

  // ── Stage 3 state ──────────────────────────────────────────────────────────
  const [spatialPattern, setSpatialPattern] = useState<boolean[][]>([])
  const [userPattern, setUserPattern] = useState<boolean[][]>([])
  const [spatialMemorizeLeft, setSpatialMemorizeLeft] = useState(5)

  // ── Daily countdown ────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => setCountdown(getCountdownToReset())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // ── Initial phase detection ────────────────────────────────────────────────
  useEffect(() => {
    const dk = getDateKey()
    if (isDailyComplete(dk)) {
      setPhase('locked_daily')
    } else {
      setPhase('ready')
    }
  }, [])

  // ── Stage timer (60 s per stage) ───────────────────────────────────────────
  const handleStageExpire = useCallback(() => {
    setTimerRunning(false)
    if (phase === 'stage1_test') {
      // Score stage 1
      const score = mgmtSelected.filter(s => mgmtRound.target.includes(s)).length
      setStageScore(prev => { const n = [...prev]; n[0] = score; return n })
      markDailyMode(dateKey, 'management')
      // Start stage 2
      const qs = buildCalcQuestions()
      setCalcQuestions(qs)
      setCalcIndex(0)
      setCalcAnswered(0)
      setCalcMemorizeLeft(10)
      setPhase('stage2_memorize')
    } else if (phase === 'stage2_test') {
      markDailyMode(dateKey, 'calculation')
      setPhase('stage3_memorize')
      const p = buildSpatialPattern()
      setSpatialPattern(p)
      setUserPattern(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)))
      setSpatialMemorizeLeft(5)
    } else if (phase === 'stage3_test') {
      // Score stage 3
      let correct = 0
      for (let r = 0; r < GRID_SIZE; r++)
        for (let c = 0; c < GRID_SIZE; c++)
          if (userPattern[r][c] === spatialPattern[r][c]) correct++
      const score = correct
      setStageScore(prev => { const n = [...prev]; n[2] = score; return n })
      markDailyMode(dateKey, 'spatial')
      setPhase('completed')
    }
  }, [phase, mgmtSelected, mgmtRound, userPattern, spatialPattern, dateKey])

  const stageRemaining = useCountdown(STAGE_DURATION, timerRunning, handleStageExpire)

  // ── Memorize countdowns ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'stage1_memorize') return
    if (mgmtMemorizeLeft <= 0) {
      setPhase('stage1_test')
      setMgmtSelected([])
      setTimerRunning(true)
      return
    }
    const id = setTimeout(() => setMgmtMemorizeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, mgmtMemorizeLeft])

  useEffect(() => {
    if (phase !== 'stage2_memorize') return
    if (calcMemorizeLeft <= 0) {
      setPhase('stage2_test')
      setTimerRunning(true)
      return
    }
    const id = setTimeout(() => setCalcMemorizeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, calcMemorizeLeft])

  useEffect(() => {
    if (phase !== 'stage3_memorize') return
    if (spatialMemorizeLeft <= 0) {
      setPhase('stage3_test')
      setTimerRunning(true)
      return
    }
    const id = setTimeout(() => setSpatialMemorizeLeft(t => t - 1), 1000)
    return () => clearTimeout(id)
  }, [phase, spatialMemorizeLeft])

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleStart = () => {
    const round = buildManagementRound()
    setMgmtRound(round)
    setMgmtSelected([])
    setMgmtMemorizeLeft(8)
    setStageScore([0, 0, 0])
    setPhase('stage1_memorize')
  }

  const toggleMgmtItem = (item: string) => {
    setMgmtSelected(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    )
  }

  const submitMgmtAnswer = () => {
    setTimerRunning(false)
    const score = mgmtSelected.filter(s => mgmtRound.target.includes(s)).length
    setStageScore(prev => { const n = [...prev]; n[0] = score; return n })
    markDailyMode(dateKey, 'management')
    const qs = buildCalcQuestions()
    setCalcQuestions(qs)
    setCalcIndex(0)
    setCalcAnswered(0)
    setCalcMemorizeLeft(10)
    setPhase('stage2_memorize')
  }

  const handleCalcAnswer = (chosen: number) => {
    const q = calcQuestions[calcIndex]
    const correct = chosen === q.answer ? 1 : 0
    setStageScore(prev => { const n = [...prev]; n[1] += correct; return n })
    setCalcAnswered(a => a + 1)
    if (calcIndex + 1 < calcQuestions.length) {
      setCalcIndex(i => i + 1)
    } else {
      // Stage 2 done early
      setTimerRunning(false)
      markDailyMode(dateKey, 'calculation')
      const p = buildSpatialPattern()
      setSpatialPattern(p)
      setUserPattern(Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)))
      setSpatialMemorizeLeft(5)
      setPhase('stage3_memorize')
    }
  }

  const toggleCell = (r: number, c: number) => {
    setUserPattern(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = !next[r][c]
      return next
    })
  }

  const submitSpatial = () => {
    setTimerRunning(false)
    let correct = 0
    for (let r = 0; r < GRID_SIZE; r++)
      for (let c = 0; c < GRID_SIZE; c++)
        if (userPattern[r][c] === spatialPattern[r][c]) correct++
    setStageScore(prev => { const n = [...prev]; n[2] = correct; return n })
    markDailyMode(dateKey, 'spatial')
    setPhase('completed')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ─────────────────────────────────────────────────────────────────────────

  const StageHeader = ({ stageNum }: { stageNum: number }) => (
    <div className="dc-stage-header">
      <span className="dc-stage-label">ด่านที่ {stageNum}/3: {STAGES[stageNum - 1]}</span>
      {timerRunning && (
        <span className={`dc-timer ${stageRemaining <= 10 ? 'dc-timer-warn' : ''}`}>
          ⏱ {stageRemaining}s
        </span>
      )}
    </div>
  )

  // ── Locked: already played today ──────────────────────────────────────────
  if (phase === 'locked_daily') {
    return (
      <div className="game-page">
        <h1 className="game-title">🌟 ภารกิจรายวัน</h1>
        <div className="dc-card">
          <div className="dc-lock-icon">✅</div>
          <h2>เล่นแล้ววันนี้!</h2>
          <p className="dc-subtitle">คุณได้เล่นภารกิจรายวันแล้วในวันนี้</p>
          <p className="dc-subtitle">รีเซ็ตครั้งถัดไปเมื่อ 00:00 เที่ยงคืน</p>
          <div className="dc-countdown">{countdown}</div>
          <p className="dc-countdown-label">เวลาที่เหลือจนถึงการรีเซ็ต</p>
        </div>
      </div>
    )
  }

  // ── Ready: can play ────────────────────────────────────────────────────────
  if (phase === 'ready') {
    const todaySeed = getDateKey()
    const todayModes = getDailyProgress(dateKey)
    return (
      <div className="game-page">
        <h1 className="game-title">🌟 ภารกิจรายวัน</h1>
        <div className="dc-card">
          <div className="dc-available-badge">✅ พร้อมเล่นวันนี้!</div>
          <p className="dc-subtitle">
            3 ด่าน × 60 วินาที
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', margin: '0.75rem 0', flexWrap: 'wrap' }}>
            <span>{todayModes.management ? '✅' : '⬜'} 📋 การจัดการ</span>
            <span>{todayModes.calculation ? '✅' : '⬜'} 🧮 การคำนวณ</span>
            <span>{todayModes.spatial ? '✅' : '⬜'} 🗺️ พื้นที่</span>
          </div>
          <p className="dc-note">ไม่ใช้กุญแจ &nbsp;|&nbsp; เล่นได้ 1 ครั้งต่อวัน</p>
          <button className="start-button" onClick={handleStart}>
            เริ่มภารกิจรายวัน 🚀
          </button>
          <p className="dc-note" style={{ marginTop: '1rem' }}>
            หรือฝึกเฉพาะโหมดคำนวณ:{' '}
            <Link
              href={`/minigame/calculation?mode=daily&seed=${todaySeed}&level=1`}
              style={{ color: '#ffd700', textDecoration: 'underline' }}
            >
              🔢 เปิดมินิเกมคำนวณ
            </Link>
          </p>
        </div>
      </div>
    )
  }

  // ── Stage 1 – memorize ─────────────────────────────────────────────────────
  if (phase === 'stage1_memorize') {
    return (
      <div className="game-page">
        <StageHeader stageNum={1} />
        <div className="dc-card">
          <h2>จำสิ่งของเหล่านี้ไว้! ({mgmtMemorizeLeft}s)</h2>
          <div className="dc-item-grid">
            {mgmtRound.target.map(item => (
              <div key={item} className="dc-item dc-item-show">{item}</div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Stage 1 – test ─────────────────────────────────────────────────────────
  if (phase === 'stage1_test') {
    return (
      <div className="game-page">
        <StageHeader stageNum={1} />
        <div className="dc-card">
          <h2>เลือกสิ่งของที่คุณเห็น ({mgmtSelected.length}/6)</h2>
          <div className="dc-item-grid">
            {mgmtRound.choices.map(item => (
              <div
                key={item}
                className={`dc-item dc-item-choice ${mgmtSelected.includes(item) ? 'dc-item-selected' : ''}`}
                onClick={() => toggleMgmtItem(item)}
              >
                {item}
              </div>
            ))}
          </div>
          <button className="start-button dc-submit-btn" onClick={submitMgmtAnswer}>
            ยืนยันคำตอบ ✔️
          </button>
        </div>
      </div>
    )
  }

  // ── Stage 2 – memorize ─────────────────────────────────────────────────────
  if (phase === 'stage2_memorize') {
    return (
      <div className="game-page">
        <StageHeader stageNum={2} />
        <div className="dc-card">
          <h2>จำโจทย์เลขเหล่านี้! ({calcMemorizeLeft}s)</h2>
          <div className="dc-calc-list">
            {calcQuestions.map((q, i) => (
              <div key={i} className="dc-calc-row">
                <span className="dc-calc-num">ข้อ {i + 1}:</span> {q.expression} = ?
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Stage 2 – test ─────────────────────────────────────────────────────────
  if (phase === 'stage2_test' && calcQuestions.length > 0) {
    const q = calcQuestions[calcIndex]
    return (
      <div className="game-page">
        <StageHeader stageNum={2} />
        <div className="dc-card">
          <h2>ข้อ {calcIndex + 1} / {calcQuestions.length}</h2>
          <div className="dc-calc-question">{q.expression} = ?</div>
          <div className="dc-choice-grid">
            {q.choices.map(c => (
              <button key={c} className="dc-choice-btn" onClick={() => handleCalcAnswer(c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Stage 3 – memorize ─────────────────────────────────────────────────────
  if (phase === 'stage3_memorize') {
    return (
      <div className="game-page">
        <StageHeader stageNum={3} />
        <div className="dc-card">
          <h2>จำตำแหน่งที่ไฮไลต์ไว้! ({spatialMemorizeLeft}s)</h2>
          <div className="dc-spatial-grid">
            {spatialPattern.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`dc-spatial-cell ${cell ? 'dc-spatial-on' : ''}`}
                />
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── Stage 3 – test ─────────────────────────────────────────────────────────
  if (phase === 'stage3_test') {
    return (
      <div className="game-page">
        <StageHeader stageNum={3} />
        <div className="dc-card">
          <h2>คลิกตำแหน่งที่คุณจำได้</h2>
          <div className="dc-spatial-grid">
            {userPattern.map((row, r) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`dc-spatial-cell dc-spatial-clickable ${cell ? 'dc-spatial-user' : ''}`}
                  onClick={() => toggleCell(r, c)}
                />
              ))
            )}
          </div>
          <button className="start-button dc-submit-btn" onClick={submitSpatial}>
            ยืนยันคำตอบ ✔️
          </button>
        </div>
      </div>
    )
  }

  // ── Completed ──────────────────────────────────────────────────────────────
  if (phase === 'completed') {
    const total = stageScore[0] + stageScore[1] + stageScore[2]
    return (
      <div className="game-page">
        <h1 className="game-title">🌟 ภารกิจรายวัน – สำเร็จ!</h1>
        <div className="dc-card">
          <div className="dc-complete-icon">🏆</div>
          <h2>ยอดเยี่ยม!</h2>
          <div className="dc-score-table">
            <div className="dc-score-row">
              <span>📋 การจัดการ</span>
              <span>{stageScore[0]} / 6</span>
            </div>
            <div className="dc-score-row">
              <span>🧮 การคำนวณ</span>
              <span>{stageScore[1]} / 4</span>
            </div>
            <div className="dc-score-row">
              <span>🗺️ พื้นที่</span>
              <span>{stageScore[2]} / {GRID_SIZE * GRID_SIZE}</span>
            </div>
          </div>
          <p className="dc-subtitle">กลับมาใหม่พรุ่งนี้!</p>
          <div className="dc-countdown">{countdown}</div>
          <p className="dc-countdown-label">รีเซ็ตใน</p>
          <Link href="/" className="cta-button" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
            กลับหน้าแรก 🏠
          </Link>
        </div>
      </div>
    )
  }

  return null
}
