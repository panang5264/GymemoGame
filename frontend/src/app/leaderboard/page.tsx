'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadProgress, PLAYS_PER_VILLAGE } from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'

interface LocalEntry {
    villageId: number
    bestScore: number
    playsCompleted: number
    expPercent: number
}

export default function LeaderboardPage() {
    const router = useRouter()
    const [userScore, setUserScore] = useState(0)
    const [userName, setUserName] = useState('')
    const [villageEntries, setVillageEntries] = useState<LocalEntry[]>([])
    const [unlockedCount, setUnlockedCount] = useState(0)

    useEffect(() => {
        const p = loadProgress()
        setUserScore(p.totalScore || 0)
        setUserName(p.userName || 'นักเดินทาง')
        setUnlockedCount(p.unlockedVillages.length)

        // Build per-village stats from local progress
        const entries: LocalEntry[] = []
        for (let i = 1; i <= 10; i++) {
            const vp = p.villages[String(i)]
            if (!vp || vp.playsCompleted === 0) continue
            entries.push({
                villageId: i,
                bestScore: vp.bestScore ?? 0,
                playsCompleted: vp.playsCompleted,
                expPercent: getExpPercent(vp.playsCompleted)
            })
        }
        setVillageEntries(entries)
    }, [])

    const totalExp = villageEntries.reduce((s, e) => s + e.expPercent, 0)
    const overallExpPct = Math.round(totalExp / 10)

    return (
        <div className="min-h-screen bg-[var(--bg-warm)] p-4 md:p-12 font-['Supermarket']">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-2xl flex items-center justify-center shadow-[4px_4px_0_var(--border-dark)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--border-dark)] transition-all font-black text-2xl"
                    >
                        ←
                    </button>
                    <h1 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tight">สรุปคะแนน</h1>
                    <div className="w-14 h-14 invisible" />
                </div>

                {/* Overall User Card */}
                <div className="friendly-card mb-8 shadow-[10px_10px_0_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                        <div className="w-20 h-20 bg-indigo-100 border-4 border-[var(--border-dark)] rounded-full flex items-center justify-center text-4xl shadow-[4px_4px_0_var(--border-dark)]">
                            🧑‍🚀
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-3xl font-black text-[var(--text-main)]">{userName}</h2>
                            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs">นักสำรวจความจำ · ปลดล็อก {unlockedCount}/10 หมู่บ้าน</p>
                        </div>
                        <div className="bg-indigo-600 text-white px-6 py-3 rounded-full">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Score</p>
                            <p className="text-3xl font-black tabular-nums">{userScore.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Overall EXP */}
                    <div>
                        <div className="flex justify-between mb-2">
                            <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">⚡ EXP โดยรวม</span>
                            <span className="text-sm font-black text-indigo-600">{overallExpPct}%</span>
                        </div>
                        <div className="h-3 bg-black/10 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                    width: `${overallExpPct}%`,
                                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Per-village breakdown */}
                {villageEntries.length > 0 ? (
                    <div className="space-y-4 mb-8">
                        <h3 className="font-black text-[var(--text-main)] uppercase tracking-widest text-xs">📊 สถิติรายด่าน</h3>
                        {villageEntries.map((entry) => (
                            <div key={entry.villageId} className="bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-[2rem] p-5 shadow-[6px_6px_0_rgba(0,0,0,0.04)]">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 border-2 border-[var(--border-dark)] rounded-2xl flex items-center justify-center font-black text-indigo-600 text-lg shadow-[2px_2px_0_var(--border-dark)]">
                                            {entry.villageId}
                                        </div>
                                        <div>
                                            <p className="font-black text-[var(--text-main)]">หมู่บ้านที่ {entry.villageId}</p>
                                            <p className="text-[10px] font-bold text-[var(--text-muted)]">เล่น {entry.playsCompleted}/{PLAYS_PER_VILLAGE} รอบ</p>
                                        </div>
                                    </div>
                                    {entry.bestScore > 0 && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-amber-500 uppercase">Best</p>
                                            <p className="font-black text-[var(--text-main)] tabular-nums">{entry.bestScore.toLocaleString()}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-700"
                                        style={{
                                            width: `${entry.expPercent}%`,
                                            background: entry.expPercent >= 100
                                                ? 'linear-gradient(90deg, #22c55e, #4ade80)'
                                                : 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[9px] font-bold text-[var(--text-muted)]">EXP</span>
                                    <span className={`text-[9px] font-black ${entry.expPercent >= 100 ? 'text-green-500' : 'text-indigo-500'}`}>
                                        {entry.expPercent >= 100 ? '✅ เต็มแล้ว' : `${entry.expPercent}%`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="friendly-card text-center py-16 mb-8">
                        <div className="text-6xl mb-4">🗺️</div>
                        <h3 className="text-2xl font-black text-[var(--text-main)] mb-2">ยังไม่มีข้อมูล</h3>
                        <p className="text-[var(--text-muted)] font-bold">เริ่มเล่นเพื่อดูสถิติของคุณที่นี่!</p>
                    </div>
                )}

                <p className="text-center mt-8 text-[#717171] font-black uppercase tracking-[0.2em] text-[10px]">
                    ข้อมูลสถิติส่วนตัวของคุณ 🧠
                </p>

            </div>
        </div>
    )
}
