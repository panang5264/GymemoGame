'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useRef, Suspense } from 'react'
import { MAX_KEYS } from '@/lib/levelSystem'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'

function ChestGameInner() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const villageIdStr = searchParams.get('villageId')
    const subIdStr = searchParams.get('subId')

    const villageId = parseInt(villageIdStr || '1', 10)
    const subId = parseInt(subIdStr || '1', 10)

    const [opened, setOpened] = useState(false)
    const openedRef = useRef(false)
    const [rewardInfo, setRewardInfo] = useState<{ type: 'key' | 'score', amount: number }>({ type: 'key', amount: 1 })

    const { progress, saveProgress } = useProgress()
    const { recordPlay } = useLevelSystem()

    const handleOpenChest = () => {
        if (openedRef.current || !progress) return // Prevent multiple triggers synchronously
        openedRef.current = true
        setOpened(true)

        const currentKeys = progress.keys.currentKeys

        let scoreBase = 50
        let nextP = { ...progress }

        if (currentKeys < MAX_KEYS) {
            nextP.keys = { ...nextP.keys, currentKeys: Math.min(MAX_KEYS, currentKeys + 1) }
            if (nextP.keys.currentKeys >= MAX_KEYS) nextP.keys.lastRegenAt = Date.now()
            setRewardInfo({ type: 'key', amount: 1 })
        } else {
            // Keys are full, reward 50 extra score points
            scoreBase += 50
            setRewardInfo({ type: 'score', amount: 50 })
        }

        saveProgress(nextP)

        // Record play once to mark level completion and add score
        recordPlay(villageId, scoreBase, undefined, subId)
        setOpened(true)
    }

    return (
        <div className="game-page">
            <h1 className="game-title">🎁 Bonus Chest — ด่าน {subId}</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#4338ca', fontWeight: 'bold' }}>
                กล่องสมบัติโบนัส
            </p>

            {!opened ? (
                <div className="dc-card" style={{ marginTop: '2rem' }}>
                    <div
                        style={{ fontSize: '6rem', marginBottom: '1.5rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onClick={handleOpenChest}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="คลิกเพื่อเปิด!"
                    >
                        📦
                    </div>
                    <h2 className="text-2xl font-black text-slate-800">คุณพบกล่องสมบัติ!</h2>
                    <p style={{ marginTop: '1rem', opacity: 0.8, fontWeight: 'bold' }}>ปลดล็อคเพื่อรับรางวัลระดับพรีเมียม! 🔑</p>
                    <button
                        className="start-button"
                        style={{ marginTop: '2rem' }}
                        onClick={handleOpenChest}
                    >
                        เปิดกล่องเลย! ✨
                    </button>
                </div>
            ) : (
                <div className="dc-card" style={{ marginTop: '2rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '2rem' }} className="animate-bounce">
                        {rewardInfo.type === 'key' ? '🗝️' : '💎'}
                    </div>
                    <h2 className="text-3xl font-black text-slate-800">ยินดีด้วย! รับรางวัลสำเร็จ</h2>

                    {rewardInfo.type === 'key' ? (
                        <p style={{ marginTop: '1.5rem', fontSize: '1.5rem', color: '#4338ca', fontWeight: '900' }}>
                            ✨ ได้รับกุญแจเพิ่ม 1 ดอก!
                        </p>
                    ) : (
                        <div className="flex flex-col items-center">
                            <p style={{ marginTop: '1.5rem', fontSize: '1.5rem', color: '#4338ca', fontWeight: '900' }}>
                                ✨ กุญแจเต็มแล้ว!
                            </p>
                            <p style={{ fontSize: '1.2rem', color: '#059669', fontWeight: 'bold' }}>
                                แลกเป็น Score พิเศษ +{rewardInfo.amount} แต้ม! 🎯
                            </p>
                        </div>
                    )}

                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', backgroundColor: 'rgba(67, 56, 202, 0.05)', borderRadius: '24px', border: '2px dashed #4338ca', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                        <p className="text-slate-600 font-bold text-sm">
                            สะสมกุญแจให้ครบ 9 ดอกเพื่อแลกรับสิทธิพิเศษในหมู่บ้านถัดไป!
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', marginTop: '3rem' }}>
                        {subId < 12 ? (
                            <button
                                className="start-button"
                                style={{ marginBottom: 0 }}
                                onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
                            >
                                ด่านต่อไป ✨
                            </button>
                        ) : villageId < 10 ? (
                            <button
                                className="start-button"
                                style={{ marginBottom: 0, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                                onClick={() => router.push(`/world/${villageId + 1}`)}
                            >
                                หมู่บ้านถัดไป 🏘️
                            </button>
                        ) : null}
                        <button
                            className="start-button"
                            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginBottom: 0 }}
                            onClick={() => router.push(`/world/${villageId}`)}
                        >
                            กลับสู่แผนที่ 🗺️
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function ChestPage() {
    return (
        <Suspense fallback={<div className="game-page"><p>กำลังโหลดกล่องสมบัติ...</p></div>}>
            <ChestGameInner />
        </Suspense>
    )
}
