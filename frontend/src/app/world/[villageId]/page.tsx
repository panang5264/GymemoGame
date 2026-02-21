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

        {/* Sublevel grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
            gap: '0.75rem',
            width: '100%',
          }}
        >
          {sublevels.map((subId) => {
            const isSpecial = subId >= 13
            const noKeys = currentKeys === 0
            return (
              <div
                key={subId}
                style={{
                  background: isSpecial
                    ? 'linear-gradient(135deg,#ffd700,#ffed4e)'
                    : '#fefce8',
                  border: '2px solid #333',
                  borderRadius: '14px',
                  padding: '0.65rem 0.5rem',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: noKeys ? 0.65 : 1,
                  color: '#333',
                }}
              >
                <span style={{ fontSize: '1.3rem' }}>
                  {isSpecial ? '🎁' : subId}
                </span>
                {isSpecial && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7c3aed' }}>
                    พิเศษ
                  </span>
                )}
                <button
                  onClick={() => handlePlay(subId)}
                  disabled={noKeys}
                  title={noKeys ? '🔒 ไม่มีกุญแจ' : `เล่นด่าน ${subId}`}
                  style={{
                    background: noKeys
                      ? '#e5e7eb'
                      : 'linear-gradient(135deg,#667eea,#764ba2)',
                    color: noKeys ? '#999' : '#fff',
                    border: '2px solid #333',
                    borderRadius: '8px',
                    padding: '0.25rem 0.6rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: noKeys ? 'not-allowed' : 'pointer',
                    width: '100%',
                  }}
                >
                  {noKeys ? '🔒' : '▶ เล่น'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

