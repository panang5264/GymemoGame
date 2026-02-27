'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadProgress } from '@/lib/levelSystem'
import { getLeaderboard } from '@/lib/api'

interface LeaderboardEntry {
    rank: number
    name: string
    score: number
    village: number
    isUser?: boolean
}

export default function LeaderboardPage() {
    const router = useRouter()
    const [userScore, setUserScore] = useState(0)
    const [userName, setUserName] = useState('')
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchBoard = async () => {
            try {
                const p = loadProgress()
                console.log("Progress: ", p);
                const localScore = p.totalScore || 0
                const localName = p.username || 'นักเดินทาง'
                const localVillage = p.unlockedVillages.length

                setUserScore(localScore)
                setUserName(localName)

                const res = await getLeaderboard(20)
                let fetched: LeaderboardEntry[] = []

                if (res.success && res.data) {
                    fetched = res.data.map((item: any) => ({
                        name: item.user?.name || 'Unknown',
                        score: item.score,
                        village: 1, // Optional: default to 1 since backend doesn't natively return village in Score
                        isUser: false
                    }))
                }

                // Append current user to see rank
                const all = [
                    ...fetched.filter(e => e.name !== localName), // Prevent obvious duplicates by name
                    { name: localName, score: localScore, village: localVillage, isUser: true, rank: 0 }
                ]

                const sorted = all.sort((a, b) => b.score - a.score)
                    .map((entry, index) => ({ ...entry, rank: index + 1 }))

                setEntries(sorted)
            } catch (err) {
                console.error('Failed to fetch leaderboard', err)
            } finally {
                setLoading(false)
            }
        }
        fetchBoard()
    }, [])

    return (
        <div className="min-h-screen bg-[var(--bg-warm)] p-4 md:p-12 font-['Outfit']">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.back()}
                        className="w-14 h-14 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-2xl flex items-center justify-center shadow-[4px_4px_0_var(--border-dark)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--border-dark)] transition-all font-black text-2xl"
                    >
                        ←
                    </button>
                    <h1 className="text-4xl font-black text-[var(--text-main)] uppercase tracking-tight">Leaderboard</h1>
                    <div className="w-14 h-14 invisible" />
                </div>

                {/* User Card */}
                <div className="friendly-card mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[10px_10px_0_rgba(0,0,0,0.05)]">
                    <div className="text-center md:text-left">
                        <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-xs mb-1">Your Rank</p>
                        <h2 className="text-5xl font-black text-[var(--text-main)] italic uppercase">#{entries.find(e => e.isUser)?.rank ?? '-'}</h2>
                    </div>
                    <div className="flex items-center gap-4 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] px-8 py-4 rounded-full shadow-[4px_4px_0_var(--border-dark)]">
                        <div className="text-right">
                            <p className="text-[var(--text-muted)] font-black uppercase tracking-widest text-[10px] mb-1">Total Score</p>
                            <h2 className="text-3xl font-black text-[var(--text-main)]">{userScore.toLocaleString()}</h2>
                        </div>
                        <div className="text-4xl">⭐</div>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-[3rem] shadow-[12px_12px_0_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="p-6 bg-[var(--bg-accent)]/30 border-b-3 border-[var(--border-dark)] grid grid-cols-[80px_1fr_100px_80px] font-black text-[var(--text-muted)] text-[10px] uppercase tracking-widest">
                        <span>Rank</span>
                        <span>Player</span>
                        <span className="text-right">Score</span>
                        <span className="text-right">Village</span>
                    </div>

                    <div className="divide-y-3 divide-[#1a1a1a]/10 relative">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-4xl animate-spin inline-block mb-2">⏳</div>
                                    <div className="font-black text-slate-500">กำลังโหลด...</div>
                                </div>
                            </div>
                        )}
                        {entries.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`p-6 grid grid-cols-[80px_1fr_100px_80px] items-center transition-colors ${entry.isUser ? 'bg-orange-50' : 'hover:bg-[#fdf6f0]'}`}
                            >
                                <div className={`w-12 h-12 border-3 border-[#1a1a1a] rounded-2xl flex items-center justify-center font-black text-xl shadow-[3px_3px_0_#1a1a1a] ${entry.rank === 1 ? 'bg-yellow-400' :
                                    entry.rank === 2 ? 'bg-slate-200' :
                                        entry.rank === 3 ? 'bg-orange-200' :
                                            'bg-white'
                                    }`}>
                                    {entry.rank}
                                </div>

                                <div className="flex items-center gap-4 pl-2">
                                    <div className="w-12 h-12 bg-[#f5e6d3] border-2 border-[#1a1a1a] rounded-full flex items-center justify-center text-2xl">
                                        {entry.isUser ? '🧑‍🚀' : '👤'}
                                    </div>
                                    <span className={`font-black tracking-tight text-lg ${entry.isUser ? 'text-[#1a1a1a] underline decoration-indigo-500 decoration-4' : 'text-[#1a1a1a]'}`}>
                                        {entry.name}
                                    </span>
                                </div>

                                <div className={`text-right font-black text-xl ${entry.isUser ? 'text-indigo-600' : 'text-[#1a1a1a]'}`}>
                                    {entry.score.toLocaleString()}
                                </div>

                                <div className="text-right font-black text-[#717171]">
                                    V{entry.village}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-center mt-12 text-[#717171] font-black uppercase tracking-[0.2em] text-[10px]">
                    World Ranking Updates Live 🌏
                </p>

            </div>
        </div>
    )
}
