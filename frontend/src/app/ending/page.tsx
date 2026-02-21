'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadProgress, getVillageProgress, PLAYS_PER_VILLAGE } from '@/lib/levelSystem'

const FINAL_VILLAGE_ID = 10

export default function EndingPage() {
  const router = useRouter()
  const [totalScore, setTotalScore] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const vp10 = getVillageProgress(FINAL_VILLAGE_ID)
    if (vp10.playsCompleted < PLAYS_PER_VILLAGE) {
      router.replace('/world')
      return
    }
    const p = loadProgress()
    setTotalScore(p.totalScore)
    setMounted(true)
  }, [router])

  if (!mounted) return null

  return (
    <div className="game-page">
      <h1 className="game-title">🎉 ยินดีด้วย!</h1>
      <div className="dc-card">
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>
          คุณสำเร็จแล้ว! 🎉
        </h2>
        <p className="dc-subtitle">
          <strong>ยาป้องกันสมองเสื่อม</strong> = ประสบการณ์และการเรียนรู้
        </p>
        <p className="dc-subtitle" style={{ marginTop: '0.5rem' }}>
          คุณได้ฝึกสมองผ่านหมู่บ้านทั้ง 10 แห่งแล้ว ขอแสดงความยินดี!
        </p>

        <div
          style={{
            background: 'rgba(255,215,0,0.15)',
            border: '2px solid rgba(255,215,0,0.5)',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            margin: '1.5rem 0',
            fontSize: '1.4rem',
            fontWeight: 700,
          }}
        >
          ⭐ คะแนนรวม: {totalScore.toLocaleString()}
        </div>

        <Link href="/world" className="cta-button" style={{ display: 'inline-block' }}>
          🗺️ กลับแผนที่โลก
        </Link>
      </div>
    </div>
  )
}
