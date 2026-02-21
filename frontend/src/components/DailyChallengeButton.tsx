'use client'

/**
 * DailyChallengeButton
 *
 * Reusable entry-point component for the Daily Challenge.
 * Shows:
 *  - A "play" button when Village 1 is complete and the challenge hasn't been
 *    played yet today.
 *  - A locked state (with Village-1 progress link) when Village 1 is not done.
 *  - A "completed today" banner + live countdown when already played today.
 *
 * Reads availability from localStorage via lib/dailyChallenge.ts and
 * lib/progression.ts; refreshes every second for the countdown.
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { isVillage1Completed, getVillage1Progress, VILLAGE1_TOTAL_LEVELS } from '@/lib/progression'
import { canPlayDailyChallenge, getCountdownToReset } from '@/lib/dailyChallenge'

export default function DailyChallengeButton() {
  const [village1Done, setVillage1Done] = useState(false)
  const [village1Progress, setVillage1Progress] = useState(0)
  const [canPlay, setCanPlay] = useState(false)
  const [countdown, setCountdown] = useState('')

  useEffect(() => {
    const update = () => {
      const done = isVillage1Completed()
      setVillage1Done(done)
      setVillage1Progress(getVillage1Progress())
      if (done) {
        const available = canPlayDailyChallenge()
        setCanPlay(available)
        if (!available) setCountdown(getCountdownToReset())
      }
    }
    update()
    // Refresh every second so countdown stays live
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="dc-home-section">
      <div className="dc-home-card">
        <h2 className="dc-home-title">🌟 ภารกิจรายวัน</h2>

        {!village1Done && (
          <>
            <p className="dc-home-subtitle">
              🔒 ผ่านหมู่บ้าน 1 ให้ครบ {VILLAGE1_TOTAL_LEVELS} ด่านเพื่อปลดล็อค
            </p>
            <div className="dc-home-progress-bar-wrap">
              <div
                className="dc-home-progress-bar"
                style={{ width: `${(village1Progress / VILLAGE1_TOTAL_LEVELS) * 100}%` }}
              />
            </div>
            <p className="dc-home-progress-text">
              {village1Progress} / {VILLAGE1_TOTAL_LEVELS} ด่าน
            </p>
            <Link href="/village" className="cta-button dc-home-btn">
              🏡 เล่นหมู่บ้าน 1
            </Link>
          </>
        )}

        {village1Done && canPlay && (
          <>
            <p className="dc-home-subtitle dc-available-badge">✅ พร้อมเล่นวันนี้!</p>
            <p className="dc-home-note">3 ด่าน × 60 วินาที &nbsp;|&nbsp; ไม่ใช้กุญแจ</p>
            <Link href="/daily-challenge" className="cta-button dc-home-btn">
              🚀 เริ่มภารกิจรายวัน
            </Link>
          </>
        )}

        {village1Done && !canPlay && (
          <>
            <p className="dc-home-subtitle">✅ เล่นแล้ววันนี้!</p>
            <div className="dc-countdown">{countdown}</div>
            <p className="dc-countdown-label">รีเซ็ตใน (เที่ยงคืน 00:00)</p>
          </>
        )}
      </div>
    </section>
  )
}
