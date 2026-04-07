'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'
import { getDateKey } from '@/lib/dailyChallenge'
import { useProgress } from '@/contexts/ProgressContext'
import { getKeys, recordPlay as rawRecordPlay, consumeKey } from '@/lib/levelSystem'

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
        // ผู้เล่นเลือกใช้กุญแจเพื่อ "เริ่มเล่น"
        const consumedResult = consumeKey(progress)
        if (!consumedResult) {
            setModalOpen(false)
            router.back()
            return
        }

        saveProgress(consumedResult)
        setModalOpen(false)

        // ไปที่ตัวเกมเลย
        router.replace(getMinigameUrl(villageId, subLevelId))
    }

    const handleSkip = () => {
        // Option to skip (if the modal still provides it)
        const consumedResult = consumeKey(progress)
        if (!consumedResult) return

        let nextP = consumedResult
        nextP = rawRecordPlay(nextP, villageId, 50, undefined, subLevelId)
        saveProgress(nextP)
        setModalOpen(false)

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

    return (
        <div className="game-page">
            <div className="dc-card">
                <p className="dc-subtitle">กำลังโหลด...</p>
            </div>
            <ConfirmUseKeyModal
                open={modalOpen}
                keysLeft={keysLeft}
                villageId={villageId}
                onCancel={handleCancel}
                onConfirm={handleConfirm}
                onSkip={handleSkip}
            />
        </div>
    )
}
