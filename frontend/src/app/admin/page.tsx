'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { adminGetUsers, adminGetGuests, adminGetStats, adminDeleteUser, adminGetExportScores, adminGetExportAnalysis } from '@/lib/api'

export default function AdminDashboard() {
    const { user, token } = useAuth()
    const router = useRouter()
    const [stats, setStats] = useState<any>(null)
    const [users, setUsers] = useState<any[]>([])
    const [guests, setGuests] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'guests'>('stats')
    const [searchTerm, setSearchTerm] = useState('')
    const [statsLoading, setStatsLoading] = useState(false)

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
            const [s, u, g] = await Promise.all([
                adminGetStats(token),
                adminGetUsers(token),
                adminGetGuests(token)
            ])
            setStats(s.data)
            setUsers(u.data)
            setGuests(g.data)
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

    const handleExportAnalysis = async () => {
        if (!token) return
        try {
            const res = await adminGetExportAnalysis(token)
            if (res.success) {
                exportToCSV(res.data, 'gymemo_cognitive_analysis')
            }
        } catch (err) {
            alert('Export analysis failed')
        }
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

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-['Mali'] text-slate-800">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-indigo-900 mb-2">Admin Dashboard 👑</h1>
                        <p className="text-slate-500 font-bold">จัดการข้อมูลผู้ใช้และส่งออกข้อมูลระบบ</p>
                    </div>
                    <div className="flex items-center gap-4">
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
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-slate-100 min-h-[500px]">
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
                                        onClick={handleExportScores}
                                        className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-700 rounded-3xl font-black hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-md"
                                    >
                                        <span>📜</span> Export All Scores (.csv)
                                    </button>
                                    <button
                                        onClick={handleExportAnalysis}
                                        className="px-8 py-4 bg-white border-2 border-amber-200 text-amber-700 rounded-3xl font-black hover:bg-amber-50 transition-all flex items-center gap-3 shadow-md"
                                    >
                                        <span>🧠</span> Export Analysis Data (.csv)
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
                                                    <img src={`/assets_employer/avatars/${u.avatar || 'avatar-1'}.png`} alt="" className="w-8 h-8 rounded-full bg-indigo-50" />
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
                </div>
            </div>
        </div>
    )
}
