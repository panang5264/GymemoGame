'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from './village.module.css'
import {
  getVillageProgress,
  getKeys,
  isVillageUnlocked,
  PLAYS_PER_VILLAGE,
  MAX_KEYS,
} from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'

const TOTAL_VILLAGES = 10

export default function VillagePage({ params }: { params: Promise<{ villageId: string }> }) {
  const router = useRouter()
  const { villageId: villageIdStr } = use(params)
  const villageId = parseInt(villageIdStr, 10)
  const isValid = !isNaN(villageId) && villageId >= 1 && villageId <= TOTAL_VILLAGES

  const [mounted, setMounted] = useState(false)
  const [playsCompleted, setPlaysCompleted] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [currentKeys, setCurrentKeys] = useState(MAX_KEYS)

  useEffect(() => {
    if (!isValid) return
    const vp = getVillageProgress(villageId)
    setPlaysCompleted(vp.playsCompleted)
    setUnlocked(isVillageUnlocked(villageId))
    const { currentKeys: ck } = getKeys()
    setCurrentKeys(ck)
    setMounted(true)
  }, [isValid, villageId])

  if (!isValid) {
    return (
      <div className={styles.villagePage}>
        <Link href="/world" className={styles.backLink}>← กลับแผนที่</Link>
        <div className={styles.card}>
          <div className={styles.cardEmoji}>❌</div>
          <h1 className={styles.cardTitle}>ไม่พบหมู่บ้าน</h1>
          <Link href="/world" className={styles.backBtn}>🗺️ กลับแผนที่</Link>
        </div>
      </div>
    )
  }

  const expPercent = getExpPercent(playsCompleted)

  const sublevels = Array.from({ length: 14 }, (_, i) => i + 1)

  function handlePlay(subId: number) {
    router.push(`/world/${villageId}/sublevel/${subId}`)
  }

  if (!mounted) return null

  if (!unlocked) {
    return (
      <div className={styles.villagePage}>
        <Link href="/world" className={styles.backLink}>← กลับแผนที่</Link>
        <div className={styles.card}>
          <div className={styles.cardEmoji}>🔒</div>
          <h1 className={styles.cardTitle}>หมู่บ้านที่ {villageId}</h1>
          <p className={styles.cardStatus}>🔒 ยังล็อกอยู่</p>
          <p className={styles.cardDesc}>ผ่านหมู่บ้านก่อนหน้าให้ครบก่อน</p>
          <Link href="/world" className={styles.backBtn}>🗺️ กลับแผนที่</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.villagePage}>
      <Link href="/world" className={styles.backLink}>← กลับแผนที่</Link>

      <div className={styles.card} style={{ maxWidth: '640px', width: '100%' }}>
        <div className={styles.cardEmoji}>🏘️</div>
        <h1 className={styles.cardTitle}>หมู่บ้านที่ {villageId}</h1>

        {/* EXP tube */}
        <div style={{ width: '100%', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.35rem', opacity: 0.75 }}>
            EXP: {playsCompleted}/{PLAYS_PER_VILLAGE} ({expPercent}%)
          </p>
          <div
            style={{
              width: '100%',
              height: '12px',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.15)',
            }}
          >
            <div
              style={{
                width: `${expPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#ffd700,#ffed4e)',
                borderRadius: '6px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>

        {/* Keys indicator */}
        <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          🗝️ {currentKeys}/{MAX_KEYS} กุญแจ
          {currentKeys === 0 && (
            <span style={{ color: '#e53e3e', marginLeft: '0.5rem', fontSize: '0.9rem' }}>
              (รอรีเจน 30 นาที)
            </span>
          )}
        </div>

        {/* Sublevel serpentine map */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '520px',
            backgroundColor: '#F6EADB',
            borderRadius: '16px',
            border: '2px solid rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {/* Dashed line connecting nodes exactly using SVG ViewBox */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <path
              d={`M 25 15 L 15 30 L 15 50 L 25 70 L 40 85 L 60 85 L 75 70 L 85 50 L 85 30 L 75 15 L 50 15 L 50 30`}
              stroke="#666"
              strokeWidth="4"
              strokeDasharray="8,8"
              fill="none"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Center text like diagram */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontWeight: 900, textAlign: 'center', opacity: 0.8, color: '#333', fontSize: '1.2rem', zIndex: 1 }}>
            เมื่อเล่นครบ<br />12 ด่าน
          </div>

          {[
            { id: 1, top: '15%', left: '25%', type: 'star' },
            { id: 2, top: '30%', left: '15%', type: 'star' },
            { id: 3, top: '50%', left: '15%', type: 'star' },
            { id: 4, top: '70%', left: '25%', type: 'chest' },
            { id: 5, top: '85%', left: '40%', type: 'star' },
            { id: 6, top: '85%', left: '60%', type: 'star' },
            { id: 7, top: '70%', left: '75%', type: 'star' },
            { id: 8, top: '50%', left: '85%', type: 'star' },
            { id: 9, top: '30%', left: '85%', type: 'chest' },
            { id: 10, top: '15%', left: '75%', type: 'star' },
            { id: 11, top: '15%', left: '50%', type: 'star' },
            { id: 12, top: '30%', left: '50%', type: 'star' },
          ].map((node) => {
            const isChest = node.type === 'chest'

            const currentSubId = (playsCompleted % 12) + 1
            const loops = Math.floor(playsCompleted / 12)
            const isUnlocked = loops > 0 || node.id <= currentSubId
            const isCurrent = node.id === currentSubId

            return (
              <div
                key={node.id}
                onClick={() => {
                  if (isUnlocked) handlePlay(node.id)
                }}
                style={{
                  position: 'absolute',
                  top: node.top,
                  left: node.left,
                  transform: 'translate(-50%, -50%)',
                  width: isChest ? '60px' : '50px',
                  height: isChest ? '55px' : '50px',
                  background: !isUnlocked
                    ? 'linear-gradient(135deg, #d1d5db, #9ca3af)'
                    : isChest
                      ? 'linear-gradient(135deg, #d97706, #f59e0b)'
                      : 'linear-gradient(135deg, #4ade80, #22c55e)',
                  border: isCurrent ? '4px solid #fff' : '3px solid #fff',
                  borderRadius: isChest ? '12px' : '50%',
                  boxShadow: isCurrent
                    ? '0 0 15px rgba(74,222,128,0.9), inset 0 2px 4px rgba(255,255,255,0.4)'
                    : '0 4px 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.4)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  cursor: isUnlocked ? 'pointer' : 'not-allowed',
                  fontSize: isChest ? '1.8rem' : '1.4rem',
                  zIndex: isCurrent ? 10 : 2,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  color: '#fff',
                  opacity: !isUnlocked ? 0.8 : 1,
                  filter: !isUnlocked ? 'grayscale(0.6)' : 'none',
                }}
                title={!isUnlocked ? '🔒 ยังไม่ถึงด่านนี้' : `ด่านที่ ${node.id}`}
                onMouseEnter={(e) => {
                  if (isUnlocked) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)';
                    e.currentTarget.style.boxShadow = '0 6px 10px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isUnlocked) {
                    e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)';
                    e.currentTarget.style.boxShadow = isCurrent
                      ? '0 0 15px rgba(74,222,128,0.9), inset 0 2px 4px rgba(255,255,255,0.4)'
                      : '0 4px 6px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.4)';
                  }
                }}
              >
                {!isUnlocked ? '🔒' :
                  isChest ? '🎁' : '⭐'}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

