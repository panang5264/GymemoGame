'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './world.module.css'

const STORAGE_KEY = 'gymemo_progress_v1'
const TOTAL_STAGES = 12

const STAGE_POSITIONS: { x: number; y: number }[] = [
  { x: 12, y: 82 },
  { x: 30, y: 75 },
  { x: 50, y: 80 },
  { x: 68, y: 70 },
  { x: 80, y: 55 },
  { x: 68, y: 42 },
  { x: 50, y: 35 },
  { x: 30, y: 40 },
  { x: 15, y: 28 },
  { x: 32, y: 18 },
  { x: 55, y: 15 },
  { x: 75, y: 10 },
]

const INTRO_SLIDES = [
  { emoji: '🌍', title: 'ยินดีต้อนรับ!', desc: 'ยินดีต้อนรับสู่ Gymemo Game เกมฝึกสมองและความจำ' },
  { emoji: '🧠', title: 'ฝึกสมอง', desc: 'สะสมคะแนน ฝึกความจำ และพัฒนาสมองของคุณผ่านมินิเกมต่างๆ' },
  { emoji: '🗺️', title: 'แผนที่โลก', desc: 'เลือกด่านบนแผนที่ เปิดล็อกด่านใหม่ด้วยการผ่านด่านเดิม' },
  { emoji: '🏆', title: 'พร้อมแล้ว!', desc: 'มาเริ่มผจญภัยกันเถอะ! เลือกด่าน 1 เพื่อเริ่มต้น' },
]

interface Progress {
  introSeen: boolean
  completed: number[]
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { introSeen: false, completed: [] }
}

function saveProgress(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

function getStageState(stage: number, completed: number[]): 'completed' | 'current' | 'locked' {
  if (completed.includes(stage)) return 'completed'
  const current = completed.length === 0 ? 1 : Math.max(0, ...completed) + 1
  if (stage === current) return 'current'
  return 'locked'
}

export default function WorldPage() {
  const router = useRouter()
  const [progress, setProgress] = useState<Progress>({ introSeen: false, completed: [] })
  const [showIntro, setShowIntro] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const p = loadProgress()
    setProgress(p)
    if (!p.introSeen) setShowIntro(true)
    setMounted(true)
  }, [])

  function closeIntro() {
    const updated = { ...progress, introSeen: true }
    setProgress(updated)
    saveProgress(updated)
    setShowIntro(false)
  }

  function resetProgress() {
    const updated: Progress = { introSeen: true, completed: [] }
    setProgress(updated)
    saveProgress(updated)
  }

  function handleStageClick(stage: number) {
    if (getStageState(stage, progress.completed) !== 'locked') {
      router.push(`/world/${stage}`)
    }
  }

  if (!mounted) return null

  return (
    <div className={styles.worldPage}>
      {showIntro && (
        <div className={styles.introOverlay}>
          <div className={styles.introCard}>
            <button className={styles.skipBtn} onClick={closeIntro}>ข้าม</button>
            <div className={styles.slideContent}>
              <div className={styles.slideEmoji}>{INTRO_SLIDES[slideIndex].emoji}</div>
              <h2 className={styles.slideTitle}>{INTRO_SLIDES[slideIndex].title}</h2>
              <p className={styles.slideDesc}>{INTRO_SLIDES[slideIndex].desc}</p>
            </div>
            <div className={styles.slideDots}>
              {INTRO_SLIDES.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === slideIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
            <div className={styles.slideNav}>
              {slideIndex > 0 && (
                <button className={styles.navBtn} onClick={() => setSlideIndex((i) => i - 1)}>
                  ← ย้อนกลับ
                </button>
              )}
              {slideIndex < INTRO_SLIDES.length - 1 ? (
                <button className={styles.navBtn} onClick={() => setSlideIndex((i) => i + 1)}>
                  ถัดไป →
                </button>
              ) : (
                <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={closeIntro}>
                  เริ่มเลย! 🚀
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <h1 className={styles.mapTitle}>🗺️ แผนที่โลก</h1>
        <div className={styles.topActions}>
          <button
            className={styles.actionBtn}
            onClick={() => {
              setSlideIndex(0)
              setShowIntro(true)
            }}
          >
            📖 บทนำ
          </button>
          <button className={styles.actionBtn} onClick={resetProgress}>
            🔄 รีเซ็ต
          </button>
        </div>
      </div>

      <div className={styles.mapContainer}>
        {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((stage) => {
          const state = getStageState(stage, progress.completed)
          const pos = STAGE_POSITIONS[stage - 1]
          return (
            <button
              key={stage}
              className={`${styles.stageNode} ${styles[state]}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleStageClick(stage)}
              title={state === 'locked' ? 'ล็อก' : `ด่าน ${stage}`}
            >
              <span className={styles.stageIcon}>
                {state === 'completed' ? '⭐' : state === 'current' ? '▶' : '🔒'}
              </span>
              <span className={styles.stageLabel}>ด่าน {stage}</span>
            </button>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>▶ ด่านปัจจุบัน</span>
        <span className={styles.legendItem}>⭐ ผ่านแล้ว</span>
        <span className={styles.legendItem}>🔒 ล็อก</span>
      </div>
    </div>
  )
}
