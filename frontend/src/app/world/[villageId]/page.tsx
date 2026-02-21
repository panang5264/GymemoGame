'use client'

import { use, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import styles from './village.module.css'

const STORAGE_KEY = 'gymemo_progress_v1'
const TOTAL_STAGES = 12

interface Progress {
  introSeen: boolean
  completed: number[]
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { introSeen: true, completed: [] }
}

function saveProgress(p: Progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export default function VillagePage({ params }: { params: Promise<{ villageId: string }> }) {
  const router = useRouter()
  const { villageId: villageIdStr } = use(params)
  const villageId = parseInt(villageIdStr, 10)
  const isValid = !isNaN(villageId) && villageId >= 1 && villageId <= TOTAL_STAGES

  const [progress, setProgress] = useState<Progress>({ introSeen: true, completed: [] })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (isValid) {
      setProgress(loadProgress())
      setMounted(true)
    }
  }, [isValid])

  if (!isValid) {
    notFound()
  }

  function simulateComplete() {
    const updated: Progress = {
      ...progress,
      completed: [...new Set([...progress.completed, villageId])],
    }
    saveProgress(updated)
    router.push('/world')
  }

  const isCompleted = progress.completed.includes(villageId)
  const currentStage =
    progress.completed.length === 0 ? 1 : Math.max(0, ...progress.completed) + 1
  const isLocked = villageId > currentStage && !isCompleted
  const statusLabel = isCompleted ? '⭐ ผ่านแล้ว' : isLocked ? '🔒 ล็อก' : '▶ ด่านปัจจุบัน'

  return (
    <div className={styles.villagePage}>
      <Link href="/world" className={styles.backLink}>
        ← กลับแผนที่
      </Link>
      <div className={styles.card}>
        <div className={styles.cardEmoji}>🏘️</div>
        <h1 className={styles.cardTitle}>ด่าน {villageId}</h1>
        <p className={styles.cardStatus}>{statusLabel}</p>
        <p className={styles.cardDesc}>
          {isLocked
            ? 'ด่านนี้ยังล็อกอยู่ กรุณาผ่านด่านก่อนหน้าเสียก่อน'
            : isCompleted
            ? 'คุณผ่านด่านนี้แล้ว! เล่นอีกครั้งหรือกลับแผนที่'
            : 'เตรียมพร้อมรับมือกับความท้าทาย!'}
        </p>
        {!isLocked && (
          <div className={styles.cardActions}>
            <button className={styles.startBtn} disabled>
              ▶ เริ่มเกม (เร็วๆ นี้)
            </button>
            {!isCompleted && mounted && (
              <button className={styles.completeBtn} onClick={simulateComplete}>
                ✅ จำลองผ่านด่าน (ทดสอบ)
              </button>
            )}
          </div>
        )}
        {isLocked && (
          <Link href="/world" className={styles.backBtn}>
            🗺️ กลับแผนที่
          </Link>
        )}
      </div>
    </div>
  )
}
