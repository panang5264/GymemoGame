'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getKeys, consumeKey, recordPlay } from '@/lib/levelSystem'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'

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

  const [modalOpen, setModalOpen] = useState(false)
  const [keysLeft, setKeysLeft] = useState(0)

  useEffect(() => {
    if (isNaN(villageId) || isNaN(subLevelId) || subLevelId < 1) {
      router.replace('/world')
      return
    }
    const { currentKeys } = getKeys()
    setKeysLeft(currentKeys)
    setModalOpen(true)
  }, [villageId, subLevelId, router])

  const handleConfirm = () => {
    const consumed = consumeKey()
    if (!consumed) {
      setModalOpen(false)
      router.back()
      return
    }
    setModalOpen(false)
    // v1 stub: record play immediately with 0 score.
    // TODO: integrate actual score from minigame result once a result callback is added.
    recordPlay(villageId, 0)
    router.replace(getMinigameUrl(villageId, subLevelId))
  }

  const handleCancel = () => {
    setModalOpen(false)
    router.back()
  }
  const handlePlayNoKey = () => {
    setModalOpen(false)
    
    router.replace(getMinigameUrl(villageId, subLevelId))
  }
  return (
    <div className="game-page">
      <div className="dc-card">
        <p className="dc-subtitle">กำลังโหลด...</p>
      </div>
      <ConfirmUseKeyModal
        open={modalOpen}
        keysLeft={keysLeft}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        onPlay={handlePlayNoKey} 
      />
    </div>
  )
}
