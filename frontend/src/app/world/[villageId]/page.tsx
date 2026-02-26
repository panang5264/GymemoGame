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

      <div className={styles.card}>
        <div className={styles.cardEmoji}>🏘️</div>
        <h1 className={styles.cardTitle}>หมู่บ้านที่ {villageId}</h1>

        {/* EXP tube */}
        <div className="w-full mb-4">
          <div className="flex justify-between items-end mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Experience Points</p>
            <p className="text-sm font-black text-[var(--text-main)]">
              {playsCompleted}/{PLAYS_PER_VILLAGE} ({expPercent}%)
            </p>
          </div>
          <div className="w-full h-6 bg-white border-3 border-[var(--border-dark)] rounded-full overflow-hidden shadow-[4px_4px_0_rgba(0,0,0,0.05)]">
            <div
              className="h-full bg-yellow-400 border-r-3 border-[var(--border-dark)] transition-all duration-700"
              style={{ width: `${expPercent}%` }}
            />
          </div>
        </div>

        {/* Keys indicator */}
        <div className="mb-8 bg-[var(--bg-warm)] border-3 border-[var(--border-dark)] px-6 py-3 rounded-2xl font-black text-xl flex items-center gap-3 shadow-[4px_4px_0_var(--border-dark)]">
          <span>🗝️</span>
          <span>{currentKeys}/{MAX_KEYS} กุญแจ</span>
          {currentKeys === 0 && (
            <span className="text-red-600 text-[10px] uppercase ml-2 bg-white px-2 py-0.5 rounded-full border-2 border-red-600">
              รอรีเจน 30 นาที
            </span>
          )}
        </div>

        {/* Sublevel serpentine map */}
        <div className="relative w-full aspect-square md:aspect-auto md:h-[500px] bg-[#e5e1d3] rounded-[3rem] border-4 border-[var(--border-dark)] overflow-hidden shadow-[inner_0_4px_10px_rgba(0,0,0,0.1)]">
          {/* Dashed line */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-1">
            <path
              d={`M 25 15 L 15 30 L 15 50 L 25 70 L 40 85 L 60 85 L 75 70 L 85 50 L 85 30 L 75 15 L 50 15 L 50 30`}
              stroke="var(--border-dark)"
              strokeWidth="1.5"
              strokeDasharray="3,3"
              fill="none"
              vectorEffect="non-scaling-stroke"
              opacity="0.3"
            />
          </svg>

          {/* Center text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-center text-[var(--text-muted)] text-sm md:text-lg uppercase tracking-widest opacity-40 z-1 leading-tight">
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
                className={`absolute w-12 h-12 md:w-16 md:h-16 flex items-center justify-center cursor-pointer transition-all duration-300 z-10 
                  ${!isUnlocked
                    ? 'bg-slate-300 opacity-50 grayscale cursor-not-allowed'
                    : isCurrent
                      ? 'bg-white scale-125 z-20 shadow-[0_0_20px_rgba(255,255,255,0.8)]'
                      : 'bg-[var(--card-bg)] hover:scale-110 active:scale-95'
                  } 
                  border-3 border-[var(--border-dark)] rounded-2xl shadow-[4px_4px_0_var(--border-dark)]
                `}
                style={{
                  top: node.top,
                  left: node.left,
                  transform: 'translate(-50%, -50%)',
                }}
                title={!isUnlocked ? '🔒 ยังไม่ถึงด่านนี้' : `ด่านที่ ${node.id}`}
              >
                <div className="text-2xl md:text-3xl">
                  {!isUnlocked ? '🔒' : isChest ? '🎁' : '⭐'}
                </div>
                {isCurrent && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[var(--border-dark)] animate-ping" />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
