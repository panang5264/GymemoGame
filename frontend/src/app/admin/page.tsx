'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { adminGetUsers, adminGetGuests, adminGetStats, adminDeleteUser, adminGetExportScores, adminGetExportAnalysis, adminGetAnalysisSummary } from '@/lib/api'
import { getAvatarPath } from '@/lib/avatars'

export default function AdminDashboard() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [guests, setGuests] = useState<any[]>([])
    const [analysisData, setAnalysisData] = useState<any[]>([])
    const [analysisSummary, setAnalysisSummary] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'guests' | 'analysis'>('stats')
    const [analysisView, setAnalysisView] = useState<'individual' | 'grouped'>('grouped')
    const [searchTerm, setSearchTerm] = useState('')
    const [statsLoading, setStatsLoading] = useState(false)
    const [isGuideOpen, setIsGuideOpen] = useState(false)

    useEffect(() => {
        // Redirect if not logged in or not admin
        if (!token) {
            router.push('/')
            return
        }

        if (user && user.role !== 'admin') {
            router.push('/')
            return
        }

        fetchData()
    }, [token, user])

    const fetchData = async () => {
        if (!token) return
        try {
            setLoading(true)
            const [s, u, g, a, as] = await Promise.all([
                adminGetStats(token),
                adminGetUsers(token),
                adminGetGuests(token),
                adminGetExportAnalysis(token),
                adminGetAnalysisSummary(token)
            ])
            setStats(s.data)
            setUsers(u.data)
            setGuests(g.data)
            setAnalysisData(a.data)
            setAnalysisSummary(as.data)
        } catch (err) {
            console.error('Failed to fetch admin data:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!token || !confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้นี้?')) return
        try {
            await adminDeleteUser(token, userId)
            setUsers(users.filter(u => u._id !== userId))
        } catch (err) {
            alert('ลบผู้ใช้ไม่สำเร็จ')
        }
    }

    const handleExportScores = async () => {
        if (!token) return
        try {
            const res = await adminGetExportScores(token)
            if (res.success) {
                // Flatten data for CSV
                const flattened = res.data.map((s: any) => ({
                    _id: s._id,
                    score: s.score,
                    moves: s.moves,
                    timeTaken: s.timeTaken,
                    userName: s.user?.name || 'Unknown',
                    userPhone: s.user?.phone || 'Unknown',
                    date: s.createdAt
                }))
                exportToCSV(flattened, 'gymemo_all_scores')
            }
        } catch (err) {
            alert('Export scores failed')
        }
    }

    const handleExportAnalysis = async (gameFilter?: string) => {
        if (!token) return
        try {
            const res = await adminGetExportAnalysis(token)
            if (res.success) {
                let data = res.data
                if (gameFilter && gameFilter !== 'all') {
                    data = data.filter((a: any) => a.gameType === gameFilter)
                }
                exportToCSV(data, `gymemo_analysis_${gameFilter || 'all'}`)
            }
        } catch (err) {
            alert('Export analysis failed')
        }
    }

    const handleExportSummary = () => {
        if (analysisSummary.length === 0) return
        const flattened = analysisSummary.map(s => ({
            date: s.day,
            player_info: s.identifier,
            player_name: s.userName,
            game_type: s.gameType,
            main_level: `Village ${s.level}`,
            sub_levels_played: s.subLevelCount,
            total_time_seconds: s.totalTime.toFixed(1),
            avg_accuracy: `${Math.round(s.avgAccuracy)}%`
        }))
        exportToCSV(flattened, 'gymemo_daily_summary')
    }

    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) return

        const headers = Object.keys(data[0]).filter(k => k !== 'password' && k !== '__v')
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const val = row[header]
                    return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
                }).join(',')
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `${filename}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const filteredUsers = users.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone?.includes(searchTerm)
    )

    const filteredGuests = guests.filter(g =>
        g.guestId?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 font-['Mali']">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-indigo-600 font-bold">กำลังโหลดข้อมูลระบบ...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 lg:p-16 pt-20 md:pt-24 lg:pt-32 font-['Mali'] text-slate-800">
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-indigo-900 mb-2">Admin Dashboard 👑</h1>
                        <p className="text-slate-500 font-bold">จัดการข้อมูลผู้ใช้และส่งออกข้อมูลระบบ</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsGuideOpen(true)}
                            className="px-6 py-3 bg-indigo-50 border-2 border-indigo-100 rounded-2xl font-black text-indigo-600 hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
                        >
                            <span>📘</span> คู่มือการใช้งาน
                        </button>
                        <button
                            onClick={fetchData}
                            className="px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-slate-600 hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm"
                        >
                            🔄 รีเฟรชข้อมูล
                        </button>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อหรือไอดี..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-3 bg-white border-2 border-slate-200 rounded-2xl w-64 focus:border-indigo-500 outline-none transition-all shadow-sm font-bold"
                            />
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30">🔍</span>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-3xl w-fit border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                    >
                        📊 สถิติระบบ
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                    >
                        👥 ผู้ใช้ที่ลงทะเบียน
                    </button>
                    <button
                        onClick={() => setActiveTab('guests')}
                        className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'guests' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                    >
                        🆔 เซสชัน Guest
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`px-8 py-3 rounded-2xl font-black transition-all ${activeTab === 'analysis' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white hover:text-slate-800'}`}
                    >
                        🎯 Log ด่าน
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[3.5rem] p-8 md:p-16 shadow-2xl shadow-indigo-100/50 border border-slate-100 min-h-[600px]">
                    {activeTab === 'stats' && stats && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                                <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100">
                                    <span className="text-4xl mb-4 block">👤</span>
                                    <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Registered</h3>
                                    <p className="text-5xl font-black text-indigo-900">{stats.totalUsers}</p>
                                </div>
                                <div className="bg-emerald-50 p-8 rounded-[2.5rem] border-2 border-emerald-100">
                                    <span className="text-4xl mb-4 block">👻</span>
                                    <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Active Guests</h3>
                                    <p className="text-5xl font-black text-emerald-900">{stats.totalGuests}</p>
                                </div>
                                <div className="bg-amber-50 p-8 rounded-[2.5rem] border-2 border-amber-100">
                                    <span className="text-4xl mb-4 block">🏆</span>
                                    <h3 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-2">Total Scores</h3>
                                    <p className="text-5xl font-black text-amber-900">{stats.totalScores}</p>
                                </div>
                            </div>

                            <h3 className="text-2xl font-black text-slate-800 mb-6">คะแนนเฉลี่ยแยกตามประเภทเกม</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                {stats.averageScores.map((item: any) => (
                                    <div key={item._id} className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-1">{item._id}</p>
                                        <p className="text-2xl font-black text-indigo-600">{Math.round(item.avgScore)}</p>
                                        <p className="text-xs text-slate-400 font-bold">จาก {item.count} ครั้ง</p>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-8 border-t border-slate-100">
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <span>📤</span> ส่งออกข้อมูลดิบ (Full Export)
                                </h3>
                                <div className="flex flex-wrap gap-4">
                                    <button
                                        onClick={() => handleExportSummary()}
                                        className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-700 rounded-3xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-md"
                                    >
                                        <span>📊</span> Export Daily Summary
                                    </button>
                                    <button
                                        onClick={() => handleExportScores()}
                                        className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-700 rounded-3xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-md"
                                    >
                                        <span>📜</span> Export All Scores (.csv)
                                    </button>
                                    <button
                                        onClick={() => handleExportAnalysis('all')}
                                        className="px-8 py-4 bg-white border-2 border-amber-200 text-amber-700 rounded-3xl font-black hover:bg-amber-50 transition-all flex items-center gap-3 shadow-md"
                                    >
                                        <span>🧠</span> Export Analysis (All)
                                    </button>
                                    <button
                                        onClick={() => handleExportScores()}
                                        className="px-8 py-4 bg-indigo-600 text-white rounded-3xl font-black hover:bg-indigo-700 transition-all flex items-center gap-3 shadow-xl"
                                    >
                                        <span>📅</span> Weekly Report Backup
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-800">รายชื่อผู้ที่ลงทะเบียน ({filteredUsers.length})</h3>
                                <button
                                    onClick={() => exportToCSV(users, 'gymemo_registered_users')}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                                >
                                    📥 Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                                            <th className="px-6 py-4 font-black">ชื่อ</th>
                                            <th className="px-6 py-4 font-black">ชื่อผู้ใช้</th>
                                            <th className="px-6 py-4 font-black">High Score</th>
                                            <th className="px-6 py-4 font-black">Keys</th>
                                            <th className="px-6 py-4 font-black">บทบาท</th>
                                            <th className="px-6 py-4 font-black">สมัครเมื่อ</th>
                                            <th className="px-6 py-4 font-black">จัดการ</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-bold text-sm">
                                        {filteredUsers.map((u: any) => (
                                            <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 flex items-center gap-3">
                                                    <img src={getAvatarPath(u.avatar)} alt="" className="w-8 h-8 rounded-full bg-indigo-50 object-cover" />
                                                    {u.name}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">{u.username}</td>
                                                <td className="px-6 py-4 text-indigo-600 font-black">{u.highScore?.toLocaleString()}</td>
                                                <td className="px-6 py-4">🔑 {u.totalKeys}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] ${u.role === 'admin' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {u.role.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(u.createdAt).toLocaleDateString('th-TH')}</td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => handleDeleteUser(u._id)}
                                                        className="text-rose-400 hover:text-rose-600 transition-colors"
                                                        title="ลบผู้ใช้"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredUsers.length === 0 && (
                                <div className="py-20 text-center opacity-30 font-black">ไม่พบข้อมูลที่ค้นหา</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'guests' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-800">เซสชันผู้เล่นทั่วไป ({filteredGuests.length})</h3>
                                <button
                                    onClick={() => exportToCSV(guests, 'gymemo_guest_sessions')}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                                >
                                    📥 Export CSV
                                </button>
                            </div>
                            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                                            <th className="px-6 py-4 font-black">Guest ID</th>
                                            <th className="px-6 py-4 font-black">ด่านปัจจุบัน</th>
                                            <th className="px-6 py-4 font-black">หมู่บ้านที่ปลดล็อก</th>
                                            <th className="px-6 py-4 font-black">อัปเดตล่าสุด</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 font-bold text-sm">
                                        {filteredGuests.map((g: any) => (
                                            <tr key={g._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 text-xs font-mono text-indigo-500">{g.guestId}</td>
                                                <td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg">Village {g.currentVillageId}</span></td>
                                                <td className="px-6 py-4">🏘️ {g.villages?.length || 0}</td>
                                                <td className="px-6 py-4 text-slate-400 text-xs">{new Date(g.updatedAt).toLocaleString('th-TH')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {filteredGuests.length === 0 && (
                                <div className="py-20 text-center opacity-30 font-black">ไม่พบข้อมูลเซสชันหลัก</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analysis' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-slate-800">บันทึกการเล่นรายด่าน (Analysis Log)</h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleExportSummary()}
                                        className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2"
                                    >
                                        📥 Export Summary
                                    </button>
                                    <button
                                        onClick={() => handleExportAnalysis('all')}
                                        className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2"
                                    >
                                        📥 Export Raw
                                    </button>
                                </div>
                            </div>

                            {/* View Switcher */}
                            <div className="flex gap-4 mb-8">
                                <button 
                                    onClick={() => setAnalysisView('grouped')}
                                    className={`px-6 py-2 rounded-2xl font-black text-sm transition-all ${analysisView === 'grouped' ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-200' : 'bg-slate-50 text-slate-400 border-2 border-transparent hover:bg-slate-100'}`}
                                >
                                    📑 สรุปรายด่านหลัก (ID Grouped)
                                </button>
                                <button 
                                    onClick={() => setAnalysisView('individual')}
                                    className={`px-6 py-2 rounded-2xl font-black text-sm transition-all ${analysisView === 'individual' ? 'bg-indigo-100 text-indigo-600 border-2 border-indigo-200' : 'bg-slate-50 text-slate-400 border-2 border-transparent hover:bg-slate-100'}`}
                                >
                                    🕒 ประวัติรายครั้ง (Real-time Log)
                                </button>
                            </div>

                            <div className="overflow-x-auto rounded-3xl border border-slate-100 shadow-sm custom-scrollbar">
                                {analysisView === 'grouped' ? (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                                                <th className="px-6 py-4 font-black">วันที่</th>
                                                <th className="px-6 py-4 font-black">ผู้เล่น (เบอร์โทร/ID)</th>
                                                <th className="px-6 py-4 font-black">ประเภทเกม</th>
                                                <th className="px-6 py-4 font-black text-center">ด่านหลัก</th>
                                                <th className="px-6 py-4 font-black text-center">ด่านย่อยที่เล่น</th>
                                                <th className="px-6 py-4 font-black text-right">เวลารวม (s)</th>
                                                <th className="px-6 py-4 font-black text-right">แม่นยำเฉลี่ย</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-bold text-sm">
                                            {analysisSummary.filter(s => 
                                                s.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                s.gameType?.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).map((s: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-indigo-600">{new Date(s.day).toLocaleDateString('th-TH')}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-slate-700">{s.userName}</span>
                                                            <span className="text-[10px] font-mono text-slate-400">{s.identifier}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] ${
                                                            s.gameType === 'management' ? 'bg-rose-100 text-rose-600' :
                                                            s.gameType === 'spatial' ? 'bg-indigo-100 text-indigo-600' :
                                                            s.gameType === 'calculation' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                            {s.gameType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-black">Village {s.level}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs">
                                                            {s.subLevelCount} Sub-levels
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-slate-600">{s.totalTime?.toFixed(1)}s</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`font-black ${s.avgAccuracy >= 80 ? 'text-emerald-500' : s.avgAccuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {Math.round(s.avgAccuracy)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-widest">
                                                <th className="px-6 py-4 font-black">เวลาเข้าเล่น</th>
                                                <th className="px-6 py-4 font-black">ผู้เล่น (ID)</th>
                                                <th className="px-6 py-4 font-black">ประเภทเกม</th>
                                                <th className="px-6 py-4 font-black text-center">ด่าน / Sub</th>
                                                <th className="px-6 py-4 font-black text-right">คะแนน</th>
                                                <th className="px-6 py-4 font-black text-right">เวลา (วินาที)</th>
                                                <th className="px-6 py-4 font-black text-right">ความแม่นยำ</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-bold text-sm">
                                            {analysisData.filter(a => 
                                                a.guestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                a.gameType?.toLowerCase().includes(searchTerm.toLowerCase())
                                            ).slice(0, 100).map((a: any) => (
                                                <tr key={a._id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-xs text-indigo-600">
                                                        {new Date(a.date).toLocaleString('th-TH', { 
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            day: 'numeric',
                                                            month: 'short'
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-mono text-slate-500">{a.guestId}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-lg text-[10px] ${
                                                            a.gameType === 'management' ? 'bg-rose-100 text-rose-600' :
                                                            a.gameType === 'spatial' ? 'bg-indigo-100 text-indigo-600' :
                                                            a.gameType === 'calculation' ? 'bg-amber-100 text-amber-600' :
                                                            'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                            {a.gameType.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className="font-black">{a.level}</span>
                                                        <span className="text-slate-300 mx-1">/</span>
                                                        <span className="text-indigo-400">{a.subLevelId || '-'}</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-indigo-600 font-black">{a.score}</td>
                                                    <td className="px-6 py-4 text-right text-slate-500 font-mono">{a.timeTaken?.toFixed(2)}s</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`font-black ${a.accuracy >= 80 ? 'text-emerald-500' : a.accuracy >= 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                            {a.accuracy}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {analysisData.length === 0 && (
                                <div className="py-20 text-center opacity-30 font-black">ไม่พบข้อมูลการวิเคราะห์</div>
                            )}
                            {analysisData.length > 100 && (
                                <p className="mt-4 text-center text-xs text-slate-400 font-bold italic">แสดงข้อมูล 100 รายการล่าสุด (ต้องการข้อมูลทั้งหมดกรุณากด Export)</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Admin Guide Modal */}
            {isGuideOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pt-24 md:pt-32 lg:pt-40">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsGuideOpen(false)}></div>
                    <div className="relative bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 border-[6px] border-white ring-1 ring-slate-200">
                        <div className="sticky top-0 bg-white border-b border-slate-100 p-8 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <span className="text-4xl">📘</span>
                                <div>
                                    <h2 className="text-2xl font-black text-indigo-900">คู่มือและข้อแนะนำระบบ Admin</h2>
                                    <p className="text-slate-500 font-bold">Gymemo Administrative Guide</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsGuideOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500 transition-all font-black text-2xl"
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="p-8 md:p-12 space-y-10">
                            {/* Section 1 */}
                            <section>
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">1</span>
                                    สรุปประเภทข้อมูลการส่งออก (Export)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-6 rounded-3xl bg-indigo-50 border border-indigo-100 flex flex-col gap-2">
                                        <h4 className="font-black text-indigo-900 mb-1 flex items-center gap-2">
                                            <span>📊</span> Daily Summary
                                        </h4>
                                        <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                            สรุปยอดรวม <strong>"รายวัน"</strong> (ID/เบอร์โทร, ด่านหลัก, จำนวนด่านย่อย, เวลารวม) เมื่อขึ้นวันใหม่จะแยกแถวใหม่ให้อัตโนมัติ เหมาะสำหรับทำรายงานสรุปประจำวัน
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 flex flex-col gap-2">
                                        <h4 className="font-black text-slate-800 mb-1 flex items-center gap-2">
                                            <span>📜</span> All Scores (.csv)
                                        </h4>
                                        <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                            ข้อมูลคะแนนดิบ <strong>"ทั้งหมด"</strong> ในฐานข้อมูล ใช้สำหรับตรวจสอบ Traffic การเล่นโดยรวม และดึงข้อมูลไปวิเคราะห์ต่อใน Excel
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-amber-50 border border-amber-100 flex flex-col gap-2">
                                        <h4 className="font-black text-amber-900 mb-1 flex items-center gap-2">
                                            <span>🧠</span> Analysis (Raw)
                                        </h4>
                                        <p className="text-xs text-amber-700 font-bold leading-relaxed">
                                            ข้อมูล <strong>"คุณภาพการเล่น"</strong> เจาะลึกรายครั้ง (ความแม่นยำ, เวลารายครั้ง, จำนวนการขยับ) สำหรับใช้วิเคราะห์ประสิทธิภาพสมองขั้นสูง
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-violet-50 border border-violet-100 flex flex-col gap-2">
                                        <h4 className="font-black text-violet-900 mb-1 flex items-center gap-2">
                                            <span>📅</span> Weekly Backup
                                        </h4>
                                        <p className="text-xs text-violet-700 font-bold leading-relaxed">
                                            ปุ่มลัดสำหรับ <strong>"สำรองข้อมูลประจำสัปดาห์"</strong> แนะนำให้แอดมินหมั่นกดโหลดเก็บไว้ทุกอาทิตย์เพื่อป้องกันข้อมูลสูญหาย
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Section 2: Log Details */}
                            <section>
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">2</span>
                                    การใช้งานระบบ Log ด่าน (Analysis Log)
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex gap-4 items-start p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-2xl">📑</span>
                                        <div>
                                            <p className="font-black text-slate-800 mb-1">สลับมุมมอง (View Switcher)</p>
                                            <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                คุณสามารถสลับระหว่าง <strong>สรุปรายวัน</strong> (เพื่อดูภาพรวมกิจกรรมต่อคน) 
                                                หรือ <strong>ประวัติรายครั้ง</strong> (เพื่อดูรายละเอียดการเล่นแต่ละด่านย่อย) ได้ทันที
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start p-5 rounded-3xl bg-slate-50 border border-slate-100">
                                        <span className="text-2xl">📞</span>
                                        <div>
                                            <p className="font-black text-slate-800 mb-1">การติดตามรายคน (ID Matching)</p>
                                            <p className="text-xs text-slate-500 font-bold leading-relaxed">
                                                ระบบจะพยายามดึง <strong>ชื่อและเบอร์โทรศัพท์</strong> มาแสดงแทน Guest ID 
                                                หากผู้เล่นคนนั้นเป็นสมาชิก คุณสามารถค้นหาด้วย "เบอร์โทร" ในช่องค้นหาด้านบนได้เลย
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">3</span>
                                    คำแนะนำสำหรับแอดมิน (Best Practices)
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xl">💡</span>
                                        <div>
                                            <p className="font-bold text-slate-800">การวิเคราะห์ความแม่นยำ (Accuracy)</p>
                                            <p className="text-sm text-slate-500">หาก Moves เยอะแต่เวลานานสั้น แปลว่าผู้เล่นอาจกดมั่ว (Spam) ข้อมูลส่วนนี้อาจมีความแม่นยำต่ำ</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                        <span className="text-xl">🔍</span>
                                        <div>
                                            <p className="font-bold text-slate-800">ติดตาม Guest ID</p>
                                            <p className="text-sm text-slate-500">ใช้ตรวจเช็คว่าผู้เล่นที่ยังไม่สมัครสมาชิก มักจะ "ติด" หรือ "เลิกเล่น" ที่ด่านไหนเป็นพิเศษเพื่อปรับปรุงเกม</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 items-start p-4 rounded-2xl bg-rose-50 border border-rose-100">
                                        <span className="text-xl">⚠️</span>
                                        <div>
                                            <p className="font-bold text-rose-900">ข้อควรระวังเรื่องความเร็ว</p>
                                            <p className="text-sm text-rose-700/70">หากข้อมูล &gt; 10,000 รายการ แนะนำให้รีเฟรชข้อมูลก่อน Export เสมอเพื่อให้ได้ยอดล่าสุด</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section 3 */}
                            <section>
                                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm">3</span>
                                    แนวทางการนำข้อมูลไปพัฒนาต่อ
                                </h3>
                                <ul className="list-none space-y-4 font-bold text-slate-600">
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                        <p>ด่านไหนยากไปให้นำค่า <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600">timeTaken</code> มาวิเคราะห์ร่วมกับความแม่นยำ</p>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                        <p>พฤติกรรมสมาชิก: นำเบอร์โทรในไฟล์ Scores ไป Map กับไฟล์ Registered Users เพื่อดูพฤติกรรมกลุ่ม VIP</p>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                        <p>การสำรองข้อมูล: แนะนำให้กด Export รายสัปดาห์ (Weekly Report) เพื่อป้องกันข้อมูลสูญหาย</p>
                                    </li>
                                </ul>
                            </section>
                        </div>
                        
                        <div className="p-8 bg-slate-50 flex justify-end">
                            <button 
                                onClick={() => setIsGuideOpen(false)}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg"
                            >
                                รับทราบและเข้าใจแล้ว
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
