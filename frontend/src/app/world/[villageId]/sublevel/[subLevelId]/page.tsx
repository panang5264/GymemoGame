'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getKeys, consumeKey, recordPlay } from '@/lib/levelSystem'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'

function getMinigameUrl(villageId: number, subId: number): string {
  // ด่านที่ 4 และ ด่านที่ 9 เป็นกล่องสมบัติ
  if (subId === 4 || subId === 9) {
    return `/bonus/chest?villageId=${villageId}&subId=${subId}`
  }

  // 1 map แทน 1 level ความยาก
  let difficulty = Math.min(villageId, 10)

  let modeSelect = 0; // 0=Management, 1=Calculation, 2=Spatial

  if (subId === 1) {
    modeSelect = 0; // Management
    difficulty = 1; // บังคับระดับความยากที่ level 1
  } else if (subId === 2) {
    modeSelect = 1; // Calculation
    difficulty = 1; // บังคับระดับความยากที่ level 1
  } else if (subId === 3) {
    modeSelect = 2; // Spatial
    difficulty = 1; // บังคับระดับความยากที่ level 1
  } else {
    // หลังจากนั้นก็สุ่มโหมด
    const modes = [0, 1, 2]
    modeSelect = modes[Math.floor(Math.random() * modes.length)]
  }

  if (modeSelect === 0) {
    return `/minigame/management?villageId=${villageId}&subId=${subId}&level=${difficulty}&mode=village`
  } else if (modeSelect === 1) {
    return `/minigame/calculation?villageId=${villageId}&subId=${subId}&level=${difficulty}&mode=village`
  } else {
    return `/minigame/spatial?villageId=${villageId}&subId=${subId}&level=${difficulty}&mode=village`
  }
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

    if (subLevelId === 4 || subLevelId === 9) {
      router.replace(getMinigameUrl(villageId, subLevelId));
      return;
    }

    const { currentKeys } = getKeys()
    setKeysLeft(currentKeys)
    setModalOpen(true)
  }, [villageId, subLevelId, router])

  const handleConfirm = () => {
    // ผู้เล่นเลือกใช้กุญแจข้ามด่าน
    const consumed = consumeKey()
    if (!consumed) {
      setModalOpen(false)
      router.back()
      return
    }
    setModalOpen(false)
    // ให้ EXP ถือว่าผ่านไปเลย 1 ครั้ง
    recordPlay(villageId, 50) // ให้แต้มข้ามด่านเล็กน้อย

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
