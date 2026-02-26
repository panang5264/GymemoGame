'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getKeys, consumeKey, recordPlay, markDailyMode } from '@/lib/levelSystem'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'

function getMinigameUrl(villageId: number, subId: number): string {
  // ด่านที่ 4 และ ด่านที่ 9 เป็นกล่องสมบัติ
  if (subId === 4 || subId === 9) {
    return `/bonus/chest?villageId=${villageId}&subId=${subId}`
  }

  // ความยากยากตาม Main Map (VillageId)
  // Map 1 = Level 1, Map 2 = Level 2 ...
  const difficulty = Math.min(villageId, 10)

  // กำหนดโหมดเกมตามลำดับ subId เพื่อความแน่นอน (ไม่ต้องสุ่ม)
  // 1=M, 2=C, 3=S, 5=M, 6=C, 7=S ...
  // เราใช้สูตรวนลูป 3 โหมด โดยหลบด่านกุญแจ/กล่อง (4, 9)
  const modes = ['management', 'calculation', 'spatial']

  // ปรับ index ให้เหมาะสม:
  // subId 1,2,3 -> 0,1,2
  // subId 5,6,7 -> 0,1,2
  // subId 8,10,11,12 -> วนตามลำดับ
  let modeIndex = 0;
  if (subId < 4) modeIndex = (subId - 1) % 3;
  else if (subId < 9) modeIndex = (subId - 5) % 3;
  else modeIndex = (subId - 10) % 3; // สำหรับ 10, 11, 12

  const modePath = modes[modeIndex]

  return `/minigame/${modePath}?villageId=${villageId}&subId=${subId}&level=${difficulty}&mode=village`
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

    // เช็คภารกิจรายวัน: ถ้าใช้กุญแจข้าม ก็ให้ถือว่าทำภารกิจโหมดนั้นเสร็จด้วย
    const modes = ['management', 'calculation', 'spatial']
    let modeIndex = 0
    if (subLevelId < 4) modeIndex = (subLevelId - 1) % 3
    else if (subLevelId < 9) modeIndex = (subLevelId - 5) % 3
    else modeIndex = (subLevelId - 10) % 3
    const currentMode = modes[modeIndex] as 'management' | 'calculation' | 'spatial'
    const dk = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    markDailyMode(dk, currentMode)

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
