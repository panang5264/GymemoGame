'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadProgress } from '@/lib/levelSystem'

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

    useEffect(() => {
        const p = loadProgress()
        setUserScore(p.totalScore || 0)
        setUserName(p.userName || 'นักเดินทาง')
    }, [])

    // Mock global data
    const mockEntries: LeaderboardEntry[] = [
        { rank: 1, name: 'สมชาย สายจำ', score: 25400, village: 10 },
        { rank: 2, name: 'แอดมินใจดี', score: 21200, village: 9 },
        { rank: 3, name: 'น้องนุ่น เรียนเก่ง', score: 18950, village: 8 },
        { rank: 4, name: 'พี่เบิ้ม จ้ำม่ำ', score: 15600, village: 7 },
        // User entry will be inserted based on score
    ]

    // Insert user and sort
    const allEntries = [
        ...mockEntries,
        { rank: 0, name: userName, score: userScore, village: (loadProgress().unlockedVillages.length), isUser: true }
    ].sort((a, b) => b.score - a.score)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-3xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 hover:bg-slate-100 transition-all font-black text-xl"
                    >
                        ←
                    </button>
                    <h1 className="text-3xl font-black text-slate-800">🏆 อันดับผู้เล่น</h1>
                    <div className="w-12 h-12 invisible" /> {/* Spacer */}
                </div>

                {/* User Card */}
                <div className="bg-indigo-600 rounded-[32px] p-8 mb-8 text-white shadow-2xl shadow-indigo-200 flex items-center justify-between">
                    <div>
                        <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">อันดับปัจจุบันของคุณ</p>
                        <h2 className="text-4xl font-black italic">#{allEntries.find(e => e.isUser)?.rank}</h2>
                    </div>
                    <div className="text-right">
                        <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">คะแนนรวม</p>
                        <h2 className="text-4xl font-black">{userScore.toLocaleString()}</h2>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 bg-slate-50/50 border-b border-slate-100 grid grid-cols-[60px_1fr_100px_80px] font-black text-slate-400 text-[10px] uppercase tracking-widest">
                        <span>RANK</span>
                        <span>PLAYER</span>
                        <span className="text-right">SCORE</span>
                        <span className="text-right">VILLAGE</span>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {allEntries.map((entry) => (
                            <div
                                key={entry.rank}
                                className={`p-6 grid grid-cols-[60px_1fr_100px_80px] items-center transition-colors ${entry.isUser ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${entry.rank === 1 ? 'bg-yellow-400 text-white shadow-lg' :
                                        entry.rank === 2 ? 'bg-slate-300 text-white shadow-md' :
                                            entry.rank === 3 ? 'bg-amber-600/60 text-white shadow-md' :
                                                'text-slate-400'
                                    }`}>
                                    {entry.rank}
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                                        {entry.isUser ? '🧑‍🚀' : '👤'}
                                    </div>
                                    <span className={`font-black tracking-tight ${entry.isUser ? 'text-indigo-600' : 'text-slate-700'}`}>
                                        {entry.name}
                                        {entry.isUser && <span className="ml-2 bg-indigo-100 text-indigo-500 text-[8px] px-2 py-0.5 rounded-full uppercase">You</span>}
                                    </span>
                                </div>

                                <div className={`text-right font-black ${entry.isUser ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {entry.score.toLocaleString()}
                                </div>

                                <div className="text-right font-bold text-slate-400">
                                    🏠 {entry.village}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-center mt-10 text-slate-400 font-bold text-sm">
                    ท้าทายความจำและทำคะแนนเพื่อไต่อันดับโลก! 🌏
                </p>

            </div>
        </div>
    )
}
