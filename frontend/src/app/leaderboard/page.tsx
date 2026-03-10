'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PLAYS_PER_VILLAGE } from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'
import { getLeaderboard, API_BASE_URL } from '@/lib/api'
import BrainRadarChart from '@/components/BrainRadarChart'
import { useProgress } from '@/contexts/ProgressContext'
import { useAuth } from '@/contexts/AuthContext'
import { getAvatarPath } from '@/lib/avatars'

interface LocalEntry {
    villageId: number
    bestScore: number
    playsCompleted: number
    expPercent: number
}

interface GlobalEntry {
    _id?: string
    user: {
        _id?: string
        name: string
        phone?: string
        avatar?: string
    }
    score: number
    moves?: number
    timeTaken: number
    createdAt: string
}

export default function LeaderboardPage() {
    const router = useRouter()
    const [userScore, setUserScore] = useState(0)
    const [userName, setUserName] = useState('')
    const { user } = useAuth()

    const [villageEntries, setVillageEntries] = useState<LocalEntry[]>([])
    const [unlockedCount, setUnlockedCount] = useState(0)
    const [globalEntries, setGlobalEntries] = useState<GlobalEntry[]>([])
    const [loadingGlobal, setLoadingGlobal] = useState(true)
    const [cognitiveData, setCognitiveData] = useState<any>(null)
    const [selectedUserEntry, setSelectedUserEntry] = useState<(GlobalEntry & { displayRank: number }) | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    const { progress, saveProgress, isLoading } = useProgress()

    useEffect(() => {
        if (isLoading || !progress) return
        const p = progress
        setUserScore(p.totalScore || 0)
        setUserName(p.userName || 'นักเดินทาง')
        setUnlockedCount(p.unlockedVillages.length)

        // Fetch cognitive data from backend (same as Home page)
        if (p.guestId) {
            fetch(`${API_BASE_URL}/api/analysis/profile/${p.guestId}`)
                .then(res => res.json())
                .then(res => {
                    if (res.success && res.data) {
                        setCognitiveData(res.data)
                    }
                })
                .catch(err => console.error('Failed to fetch profile analysis:', err))
        }

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

        // Fetch Global Leaderboard (Top 5 only)
        const fetchGlobal = async () => {
            try {
                const res = await getLeaderboard(5)
                if (res.success) {
                    setGlobalEntries(res.data)
                }
            } catch (err) {
                console.error('Failed to fetch global leaderboard:', err)
            } finally {
                setLoadingGlobal(false)
            }
        }
        fetchGlobal()
    }, [isLoading, progress?.guestId, progress?.userName])

    const totalExp = villageEntries.reduce((s, e) => s + e.expPercent, 0)
    const overallExpPct = Math.round(totalExp / 10)

    const filteredEntries = globalEntries.filter(entry =>
        entry.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-[var(--bg-warm)] p-4 md:p-12 font-['Supermarket'] selection:bg-indigo-100">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 md:mb-10 gap-4">
                    <button
                        onClick={() => router.back()}
                        className="w-12 h-12 md:w-14 md:h-14 bg-[var(--card-bg)] border-3 border-[var(--border-dark)] rounded-xl md:rounded-2xl flex items-center justify-center shadow-[4px_4px_0_var(--border-dark)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--border-dark)] transition-all font-black text-xl md:text-2xl self-start md:self-auto"
                    >
                        ←
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black text-[var(--text-main)] uppercase tracking-tight text-center">กระดานผู้นำ</h1>
                    <div className="w-12 h-12 md:w-14 md:h-14 hidden md:block invisible" />
                </div>

                {/* Global Leaderboard Table */}
                <div className="friendly-card mb-8 md:mb-12 shadow-[10px_10px_0_rgba(79,70,229,0.05)] md:shadow-[15px_15px_0_rgba(79,70,229,0.05)] border-4 p-4 md:p-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 md:mb-8 text-center md:text-left">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-xl md:rounded-2xl flex items-center justify-center text-2xl md:text-3xl shadow-sm">🏆</div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800">อันดับทั้งหมด</h2>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-72 group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-sm opacity-40">🔍</div>
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อผู้เล่น..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-2 border-slate-100 rounded-full text-sm font-bold focus:border-indigo-300 focus:bg-white outline-none transition-all"
                            />
                            {searchTerm && filteredEntries.length > 0 && searchTerm !== filteredEntries[0].user?.name && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-100 rounded-2xl shadow-xl z-20 p-2 animate-in slide-in-from-top-2 duration-200">
                                    <p className="text-[9px] font-black text-slate-400 px-3 py-1 uppercase tracking-widest">แนะนำสำหรับคุณ</p>
                                    <button
                                        onClick={() => setSearchTerm(filteredEntries[0].user?.name || '')}
                                        className="w-full text-left px-3 py-2 hover:bg-indigo-50 rounded-xl transition-colors flex items-center gap-2"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px]">👤</div>
                                        <span className="text-xs font-bold text-slate-600">{filteredEntries[0].user?.name}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-y-3">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <th className="px-6 py-2">อันดับ</th>
                                    <th className="px-6 py-2">ชื่อผู้เล่น</th>
                                    <th className="px-6 py-2 text-right">คะแนน</th>
                                    <th className="px-6 py-2 text-right">เวลา/ความไว</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingGlobal ? (
                                    <tr key="loading-row">
                                        <td colSpan={4} className="text-center py-10 text-slate-400 font-bold">กำลังโหลดข้อมูล...</td>
                                    </tr>
                                ) : filteredEntries.length > 0 ? (
                                    filteredEntries.map((entry, idx) => (
                                        <tr
                                            key={entry.user?._id || idx}
                                            className="group hover:translate-x-1 hover:bg-indigo-50 transition-all cursor-pointer"
                                            onClick={() => setSelectedUserEntry({ ...entry, displayRank: idx + 1 })}
                                        >
                                            <td className="px-6 py-4 bg-slate-50 group-hover:bg-indigo-50 border-y-2 border-l-2 border-slate-100 group-hover:border-indigo-100 rounded-l-3xl transition-colors">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-400 text-white shadow-md' : idx === 1 ? 'bg-slate-300 text-white shadow-md' : idx === 2 ? 'bg-orange-300 text-white shadow-md' : 'text-slate-400'}`}>
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 bg-slate-50 group-hover:bg-indigo-50 border-y-2 border-slate-100 group-hover:border-indigo-100 font-black text-slate-700 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <img src={getAvatarPath(entry.user?.avatar)} alt="avatar" className="w-8 h-8 rounded-full object-cover border-2 border-slate-200" />
                                                    {entry.user?.name || 'Unknown User'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 bg-slate-50 group-hover:bg-indigo-50 border-y-2 border-slate-100 group-hover:border-indigo-100 text-right transition-colors">
                                                <span className="text-xl font-black text-indigo-600 tabular-nums">{entry.score.toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-4 bg-slate-50 group-hover:bg-indigo-50 border-y-2 border-r-2 border-slate-100 group-hover:border-indigo-100 rounded-r-3xl text-right font-bold text-slate-400 text-sm transition-colors">
                                                {entry.timeTaken}s
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr key="empty-row">
                                        <td colSpan={4} className="text-center py-10 text-slate-400 font-bold">ไม่พบข้อมูลชื่อที่ค้นหา</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Personal Stats Section Header - Only show if logged in */}
                {user && (
                    <>
                        <div className="h-1 bg-slate-200 w-full mb-12 rounded-full opacity-30" />
                        <div className="flex items-center gap-3 mb-6 ml-4">
                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">👤</div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">สถิติของคุณ</h3>
                        </div>

                        {/* Overall User Card */}
                        <div className="friendly-card mb-8 shadow-[10px_10px_0_rgba(79,70,229,0.1)] md:shadow-[20px_20px_0_rgba(79,70,229,0.1)] border-4 border-indigo-100 bg-white/80 backdrop-blur-sm p-4 md:p-8">
                            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 mb-8">
                                <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-4 border-indigo-200 rounded-[1rem] md:rounded-[1.5rem] flex items-center justify-center shadow-inner relative p-1 mt-2">
                                    <img src={getAvatarPath(user?.avatar || (progress as any)?.avatar)} alt="avatar" className="w-full h-full object-cover rounded-[0.5rem] md:rounded-[1rem]" />
                                    <div className="absolute -bottom-2 -right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 border-4 border-white rounded-full z-10 shadow-sm"></div>
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-1">{userName}</h2>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-4 mt-2">
                                        <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest border-2 border-slate-200">
                                            🗺️ ปลดล็อก {unlockedCount}/10
                                        </span>
                                        <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-black uppercase tracking-widest border-2 border-indigo-100 italic">
                                            {progress?.privacyMode ? '🕵️ โหมดส่วนตัว' : '🌍 สาธารณะ'}
                                        </span>
                                    </div>

                                    {/* PDPA Privacy Toggle */}
                                    <div className="mt-4 flex flex-col items-center md:items-start gap-2">
                                        <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-2xl border-2 border-slate-100 transition-all">
                                            <div className="relative inline-flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={!!progress?.privacyMode}
                                                    onChange={async (e) => {
                                                        if (!progress) return
                                                        const newVal = e.target.checked
                                                        const nextP = { ...progress, privacyMode: newVal }

                                                        // Update Backend for immediate effect if possible
                                                        const { updateProfile } = await import('@/lib/api')
                                                        const token = localStorage.getItem('gymemo_token')
                                                        if (token) {
                                                            try {
                                                                await updateProfile(token, { privacyMode: newVal } as any)
                                                            } catch (err) {
                                                                console.error('Failed to update privacy mode:', err)
                                                            }
                                                        }

                                                        // Update Context
                                                        saveProgress(nextP)
                                                    }}
                                                />
                                                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </div>
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700">
                                                {progress?.privacyMode ? 'ปิดโหมดส่วนตัว (แสดงบนกระดาน)' : 'เปิดโหมดส่วนตัว (PDPA)'}
                                            </span>
                                        </label>
                                        <p className="text-[9px] text-slate-400 font-bold italic ml-2">
                                            * เมื่อเปิดโหมดส่วนตัว คะแนนของคุณจะถูกซ่อนจากกระดานผู้นำสาธารณะ
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white px-6 md:px-10 py-4 md:py-6 rounded-[2rem] md:rounded-[3rem] shadow-xl md:shadow-2xl border-4 border-white/20 transform hover:scale-105 transition-transform w-full md:w-auto text-center">
                                    <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-1 md:mb-2">คะแนนรวมทั้งหมด</p>
                                    <p className="text-4xl md:text-6xl font-black tabular-nums leading-none tracking-tighter">{userScore.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Overall EXP */}
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-base font-black text-[var(--text-muted)] uppercase tracking-widest">⚡ EXP โดยรวม</span>
                                    <span className="text-xl font-black text-indigo-600">{overallExpPct}%</span>
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

                            <div className="flex flex-col xl:flex-row gap-8 items-center bg-slate-50/50 rounded-3xl p-4 md:p-8 border-2 border-slate-100 mt-8">
                                <div className="flex-1 flex justify-center py-2 md:py-4">
                                    <BrainRadarChart
                                        data={[
                                            { label: 'การจัดการ', value: cognitiveData?.averages?.executiveFunction || 0, color: '#4f46e5' },
                                            { label: 'การคำนวณ', value: cognitiveData?.averages?.processingSpeed || 0, color: '#3b82f6' },
                                            { label: 'มิติสัมพันธ์', value: cognitiveData?.averages?.workingMemory || 0, color: '#10b981' },
                                            { label: 'การตอบสนอง', value: cognitiveData?.averages?.attention || 0, color: '#f59e0b' }
                                        ]}
                                        size={220}
                                    />
                                </div>
                                <div className="w-full xl:w-[480px] grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border-2 border-indigo-100/50 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] md:text-[11px] font-black text-indigo-400 uppercase tracking-widest">การบริหารจัดการ</span>
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-indigo-600 leading-tight">โหมดจัดการ</div>
                                        <div className="text-3xl md:text-4xl font-black text-indigo-700 mt-1 tabular-nums">{Math.round(cognitiveData?.averages?.executiveFunction || 0)}%</div>
                                    </div>
                                    <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border-2 border-emerald-100/50 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] md:text-[11px] font-black text-emerald-400 uppercase tracking-widest">ความจำขณะทำงาน</span>
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-emerald-600 leading-tight">โหมดมิติสัมพันธ์</div>
                                        <div className="text-3xl md:text-4xl font-black text-emerald-700 mt-1 tabular-nums">{Math.round(cognitiveData?.averages?.workingMemory || 0)}%</div>
                                    </div>
                                    <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border-2 border-blue-100/50 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] md:text-[11px] font-black text-blue-400 uppercase tracking-widest">ความรวดเร็วในการคิด</span>
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-blue-600 leading-tight">โหมดคำนวณ</div>
                                        <div className="text-3xl md:text-4xl font-black text-blue-700 mt-1 tabular-nums">{Math.round(cognitiveData?.averages?.processingSpeed || 0)}%</div>
                                    </div>
                                    <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border-2 border-orange-100/50 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] md:text-[11px] font-black text-orange-400 uppercase tracking-widest">ความรวดเร็วในการตอบสนอง</span>
                                        </div>
                                        <div className="text-xl md:text-2xl font-black text-orange-600 leading-tight">โหมดตอบสนอง</div>
                                        <div className="text-3xl md:text-4xl font-black text-orange-700 mt-1 tabular-nums">{Math.round(cognitiveData?.averages?.attention || 0)}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Per-village breakdown */}
                        {
                            villageEntries.length > 0 && (
                                <div className="space-y-4 mb-8">
                                    <h3 className="font-black text-[var(--text-main)] uppercase tracking-widest text-[10px] ml-4 mb-2">📊 รายละเอียดรายหมู่บ้าน</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                </div>
                            )
                        }
                    </>
                )}

                <p className="text-center mt-12 text-[#717171] font-black uppercase tracking-[0.2em] text-[10px] opacity-50">
                    ข้อมูลสรุปคะแนนและการผจญภัยของคุณ 🧠
                </p>

                {/* User Profile Modal - Compact Card Version */}
                {selectedUserEntry && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300" onClick={() => setSelectedUserEntry(null)}>
                        <div
                            className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-sm w-full border-[4px] border-[var(--border-dark)] shadow-[12px_12px_0_var(--border-dark)] relative flex flex-col items-center animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setSelectedUserEntry(null)}
                                className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-full flex items-center justify-center text-xl transition-colors font-black z-10"
                            >
                                ✕
                            </button>

                            <div className="relative mb-6 mt-2">
                                <div className={`w-28 h-28 bg-slate-100 rounded-full border-[4px] border-[var(--border-dark)] overflow-hidden shadow-inner mx-auto`}>
                                    <img src={getAvatarPath(selectedUserEntry.user?.avatar)} alt="avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[var(--border-dark)] text-white px-4 py-1.5 rounded-full font-black text-sm border-2 border-white shadow-lg flex items-center gap-1 whitespace-nowrap">
                                    อันดับ {selectedUserEntry.displayRank} 🏆
                                </div>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-black text-slate-800 mb-1 tracking-tighter text-center">{selectedUserEntry.user?.name || 'Unknown User'}</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-6 text-center bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">✨ ผู้เล่นอันดับแนวหน้า</p>

                            <div className="w-full grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100 text-center">
                                    <p className="text-indigo-400 font-black text-[9px] uppercase tracking-widest mb-1">คะแนนรวม</p>
                                    <p className="text-2xl font-black text-indigo-600 tabular-nums">{selectedUserEntry.score.toLocaleString()}</p>
                                </div>
                                <div className="bg-orange-50/50 p-3 rounded-2xl border border-orange-100 text-center">
                                    <p className="text-orange-400 font-black text-[9px] uppercase tracking-widest mb-1">เวลาที่ใช้</p>
                                    <p className="text-2xl font-black text-orange-500 tabular-nums">{selectedUserEntry.timeTaken}<span className="text-xs ml-1">s</span></p>
                                </div>
                            </div>

                            <div className="w-full bg-slate-50/30 rounded-3xl p-4 border border-slate-100/50 relative">
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase text-slate-400 tracking-widest bg-white px-4 py-1 rounded-full border border-slate-200 shadow-sm whitespace-nowrap">🧠 สถิติการเล่น</div>
                                <div className="w-full flex justify-center items-center">
                                    <BrainRadarChart
                                        data={[
                                            { label: 'การจัดการ', value: Math.min(100, 40 + (selectedUserEntry.score % 60)), color: '#f97316' },
                                            { label: 'การคำนวณ', value: Math.min(100, 50 + ((selectedUserEntry.score * 7) % 50)), color: '#3b82f6' },
                                            { label: 'มิติสัมพันธ์', value: Math.min(100, 30 + ((selectedUserEntry.score * 13) % 70)), color: '#22c55e' }
                                        ]}
                                        size={180}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
