'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'
import { getDateKey } from '@/lib/dailyChallenge'
import { useProgress } from '@/contexts/ProgressContext'
import { getKeys, recordPlay as rawRecordPlay } from '@/lib/levelSystem'

function getMinigameUrl(villageId: number, subId: number): string {
  const difficulty = Math.min(villageId, 10)
  const modes = ['management', 'calculation', 'spatial']
  const modePath = modes[(subId - 1) % 3]

  const bonuses: Record<number, number[]> = {
    1: [4, 9],
    2: [2, 7],
    3: [3, 8],
    4: [4, 9],
    5: [5, 10],
    6: [3, 11],
    7: [7, 12],
    8: [2, 10],
    9: [3, 8],
    10: [7, 12]
  }
  const isBonus = bonuses[villageId]?.includes(subId) ? '&isBonus=1' : ''

  return `/minigame/${modePath}?villageId=${villageId}&subId=${subId}&level=${difficulty}&mode=village${isBonus}`
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

  const { progress, saveProgress, isLoading } = useProgress()

  useEffect(() => {
    if (isNaN(villageId) || isNaN(subLevelId) || subLevelId < 1 || isLoading || !progress) {
      if (isNaN(villageId) || isNaN(subLevelId) || subLevelId < 1) router.replace('/world')
      return
    }

    // Remove chest special handling

    const { currentKeys } = getKeys(progress)
    setKeysLeft(currentKeys)
    setModalOpen(true)
  }, [villageId, subLevelId, router, progress, isLoading])

  const handleConfirm = () => {
    // ผู้เล่นเลือกใช้กุญแจข้ามด่าน
    if (!progress) return
    const { currentKeys } = getKeys(progress)
    if (currentKeys <= 0) {
      setModalOpen(false)
      router.back()
      return
    }
    let nextP = { ...progress, keys: { ...progress.keys, currentKeys: currentKeys - 1 } }

    // SKIP LOGIC: 50 points, Key count decreases
    // Note: recordPlay handles point calculation (50 pts for skips)
    nextP = rawRecordPlay(nextP, villageId, 50, undefined, subLevelId)

    saveProgress(nextP)
    setModalOpen(false)

    // กระโดดไปยังด่านถัดไป หรือกลับไปหน้าหน้าหมู่บ้านถ้าเป็นด่านสุดท้าย
    if (subLevelId < 12) {
      router.replace(`/world/${villageId}/sublevel/${subLevelId + 1}`)
    } else {
      router.replace(`/world/${villageId}`)
    }
  }

  const handleCancel = () => {
    setModalOpen(false)
    router.back()
  }

  const handlePlayNoKey = () => {
    setModalOpen(false)
    // เข้าไปเล่นเกมได้เลยแบบฟรีๆ ไม่เสียกุญแจ
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
