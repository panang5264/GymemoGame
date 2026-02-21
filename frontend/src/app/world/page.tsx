'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './world.module.css'
import {
  loadProgress,
  saveProgress,
  getDefaultProgress,
  getKeys,
  isVillageUnlocked,
  getVillageProgress,
  PLAYS_PER_VILLAGE,
  MAX_KEYS,
} from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'

const TOTAL_STAGES = 10

const STAGE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 10, y: 70 },
  { x: 20, y: 55 },
  { x: 30, y: 65 },
  { x: 40, y: 50 },
  { x: 50, y: 60 },
  { x: 60, y: 45 },
  { x: 70, y: 55 },
  { x: 80, y: 40 },
  { x: 85, y: 60 },
  { x: 90, y: 45 },
]

const INTRO_SLIDES: Array<{ emoji: string; title: string; desc: string }> = [
  { emoji: '👋', title: 'ยินดีต้อนรับ', desc: 'มาสำรวจแผนที่โลกกัน!' },
  { emoji: '⭐', title: 'ปลดล็อกด่าน', desc: 'เติม EXP ให้เต็มเพื่อปลดล็อกหมู่บ้านถัดไป' },
  { emoji: '🗝️', title: 'กุญแจ', desc: 'ใช้กุญแจเพื่อเล่นแต่ละด่าน (รีเจนทุก 30 นาที)' },
  { emoji: '🚀', title: 'พร้อมเริ่ม', desc: 'กดเริ่มเลยเพื่อไปด่านแรก' },
]

function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `(${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')})`
}

function getStageState(
  stage: number,
  unlockedVillages: number[]
): 'completed' | 'current' | 'locked' {
  if (!unlockedVillages.includes(stage)) return 'locked'
  // "current" = highest unlocked stage that isn't exp-tube-filled
  const maxUnlocked = Math.max(...unlockedVillages)
  if (stage === maxUnlocked) return 'current'
  return 'completed'
}

export default function WorldPage() {
  const router = useRouter()
  const [unlockedVillages, setUnlockedVillages] = useState<number[]>([1])
  const [villageExp, setVillageExp] = useState<Record<number, number>>({})
  const [showIntro, setShowIntro] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [currentKeys, setCurrentKeys] = useState(MAX_KEYS)
  const [nextRegenIn, setNextRegenIn] = useState(0)

  const refreshProgress = useCallback(() => {
    const p = loadProgress()
    setUnlockedVillages(p.unlockedVillages)
    const expMap: Record<number, number> = {}
    for (let i = 1; i <= TOTAL_STAGES; i++) {
      const vp = p.villages[String(i)] ?? { playsCompleted: 0 }
      expMap[i] = getExpPercent(vp.playsCompleted)
    }
    setVillageExp(expMap)
    if (!p.introSeen) setShowIntro(true)
  }, [])

  useEffect(() => {
    refreshProgress()
    setMounted(true)
  }, [refreshProgress])

  // Keys ticker
  useEffect(() => {
    if (!mounted) return
    const tick = () => {
      const { currentKeys: ck, nextRegenIn: nr } = getKeys()
      setCurrentKeys(ck)
      setNextRegenIn(nr)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [mounted])

  function closeIntro() {
    setShowIntro(false)
    setSlideIndex(0)
    const p = loadProgress()
    p.introSeen = true
    saveProgress(p)
  }

  function resetProgress() {
    const fresh = getDefaultProgress()
    fresh.introSeen = true
    saveProgress(fresh)
    setUnlockedVillages(fresh.unlockedVillages)
    setVillageExp({})
    const { currentKeys: ck, nextRegenIn: nr } = getKeys()
    setCurrentKeys(ck)
    setNextRegenIn(nr)
  }

  function handleStageClick(stage: number) {
    if (isVillageUnlocked(stage)) {
      router.push(`/world/${stage}`)
    }
  }

  if (!mounted) return null

  const keysLabel =
    currentKeys >= MAX_KEYS
      ? `🗝️ ${currentKeys}/${MAX_KEYS}`
      : `🗝️ ${currentKeys}/${MAX_KEYS} ${formatCountdown(nextRegenIn)}`

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
              {INTRO_SLIDES.map((_: unknown, i: number) => (
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
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.5)',
              color: '#fff',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {keysLabel}
          </span>
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
          const state = getStageState(stage, unlockedVillages)
          const pos = STAGE_POSITIONS[stage - 1]
          const exp = villageExp[stage] ?? 0
          return (
            <button
              key={stage}
              className={`${styles.stageNode} ${styles[state]}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleStageClick(stage)}
              title={state === 'locked' ? 'ล็อก' : `หมู่บ้าน ${stage}`}
            >
              <span className={styles.stageIcon}>
                {state === 'completed' ? '⭐' : state === 'current' ? '▶' : '🔒'}
              </span>
              <span className={styles.stageLabel}>ด่าน {stage}</span>
              {state !== 'locked' && (
                <div
                  style={{
                    width: '48px',
                    height: '5px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '3px',
                    marginTop: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${exp}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg,#ffd700,#ffed4e)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>▶ ด่านปัจจุบัน</span>
        <span className={styles.legendItem}>⭐ ผ่านแล้ว</span>
        <span className={styles.legendItem}>🔒 ล็อก</span>
        <span className={styles.legendItem}>
          EXP {Object.values(villageExp).filter((v) => v >= 100).length}/{TOTAL_STAGES}
        </span>
      </div>
    </div>
  )
}

