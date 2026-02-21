'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getKeys, consumeKey, recordPlay } from '@/lib/levelSystem'

function getMinigameUrl(villageId: number, subId: number): string {
  if (subId <= 4) {
    return `/minigame/Management?villageId=${villageId}&subId=${subId}&mode=village`
  }
  if (subId <= 8) {
    return `/minigame/calculation?level=${villageId}&villageId=${villageId}&subId=${subId}&mode=village`
  }
  if (subId <= 12) {
    return `/minigame/spatial?villageId=${villageId}&subId=${subId}&mode=village`
  }
  // subId 13-14: distribute across the 3 minigame types based on subId % 3
  // 13 % 3 = 1 → calculation, 14 % 3 = 2 → spatial
  const pick = subId % 3
  if (pick === 0) {
    return `/minigame/Management?villageId=${villageId}&subId=${subId}&mode=village`
  }
  if (pick === 1) {
    return `/minigame/calculation?level=${villageId}&villageId=${villageId}&subId=${subId}&mode=village`
  }
  return `/minigame/spatial?villageId=${villageId}&subId=${subId}&mode=village`
}

export default function SubLevelPage({
  params,
}: {
  params: Promise<{ villageId: string; subLevelId: string }>
}) {
  const router = useRouter()
  const { villageId: villageIdStr, subLevelId: subLevelIdStr } = use(params)
  const villageId = parseInt(villageIdStr, 10)
  const subLevelId = parseInt(subLevelIdStr, 10)

  const [status, setStatus] = useState<'loading' | 'no_keys' | 'redirecting'>('loading')

  useEffect(() => {
    if (isNaN(villageId) || isNaN(subLevelId) || subLevelId < 1) {
      router.replace('/world')
      return
    }
    const { currentKeys } = getKeys()
    if (currentKeys <= 0) {
      setStatus('no_keys')
      return
    }
    const consumed = consumeKey()
    if (!consumed) {
      setStatus('no_keys')
      return
    }
    // v1 stub: record play immediately with 0 score as placeholder;
    // actual score integration happens when minigame result callback is added
    recordPlay(villageId, 0)
    setStatus('redirecting')
    router.replace(getMinigameUrl(villageId, subLevelId))
  }, [villageId, subLevelId, router])

  if (status === 'no_keys') {
    return (
      <div className="game-page">
        <div className="dc-card">
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔒</div>
          <h2 style={{ marginBottom: '0.75rem' }}>ไม่มีกุญแจ</h2>
          <p className="dc-subtitle">กุญแจหมดแล้ว รอรีเจนทุก 30 นาที</p>
          <Link
            href={`/world/${villageId}`}
            className="cta-button"
            style={{ marginTop: '1.5rem', display: 'inline-block' }}
          >
            ← กลับหมู่บ้าน
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="game-page">
      <div className="dc-card">
        <p className="dc-subtitle">กำลังโหลด...</p>
      </div>
    </div>
  )
}

