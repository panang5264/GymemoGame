'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { recordPlay } from '@/lib/levelSystem'

function ChestGameInner() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const villageIdStr = searchParams.get('villageId')
    const subIdStr = searchParams.get('subId')

    const villageId = parseInt(villageIdStr || '1', 10)
    const subId = parseInt(subIdStr || '1', 10)

    const [opened, setOpened] = useState(false)

    const handleOpenChest = () => {
        // ให้เปิดกล่องแล้วได้คะแนนพิเศษ 200 คะแนน (เทียบเท่าประสบการณ์เล่น 1-2 ครั้งได้แบบก้าวกระโดด)
        recordPlay(villageId, 200)
        setOpened(true)
    }

    return (
        <div className="game-page">
            <h1 className="game-title">🎁 Bonus Chest — ด่าน {subId}</h1>
            <p style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#ffd700' }}>
                กล่องสมบัติโบนัส
            </p>

            {!opened ? (
                <div className="dc-card" style={{ marginTop: '2rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem', cursor: 'pointer' }} onClick={handleOpenChest} title="คลิกเพื่อเปิด!">
                        📦
                    </div>
                    <h2>คุณพบกล่องสมบัติ!</h2>
                    <p style={{ marginTop: '1rem', opacity: 0.8 }}>มีอะไรซ่อนอยู่ในนี้นะ? ลองเปิดดูสิ!</p>
                    <button
                        className="start-button"
                        style={{ marginTop: '2rem' }}
                        onClick={handleOpenChest}
                    >
                        เปิดกล่อง! ✨
                    </button>
                </div>
            ) : (
                <div className="dc-card" style={{ marginTop: '2rem' }}>
                    <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>
                        🎉
                    </div>
                    <h2>ยินดีด้วย! คุณได้รับ EXP พิเศษ!</h2>
                    <p style={{ marginTop: '1rem', fontSize: '1.2rem', color: '#4ade80', fontWeight: 'bold' }}>
                        +200 คะแนน!
                    </p>
                    <div style={{ padding: '1.5rem', marginTop: '1.5rem', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}>
                        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
                            (นี่คือพื้นที่ Placeholder ที่สามารถใส่ฟังก์ชันเสริมในอนาคต เช่น การดรอปไอเทม สกิน หรือเหรียญพิเศษ)
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', marginTop: '2rem' }}>
                        {subId < 12 ? (
                            <button
                                className="start-button"
                                style={{ marginBottom: 0 }}
                                onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
                            >
                                ด่านต่อไป 🚀
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
                            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginBottom: 0, marginTop: (subId < 12 || villageId < 10) ? '1rem' : 0 }}
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
