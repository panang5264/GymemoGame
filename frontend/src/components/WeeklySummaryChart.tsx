'use client'

import React, { useEffect, useState } from 'react'

interface WeeklyData {
    label: string
    management: number
    calculation: number
    spatial: number
}

interface Props {
    guestId: string
}

export default function WeeklySummaryChart({ guestId }: Props) {
    const [data, setData] = useState<WeeklyData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!guestId) return
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
        fetch(`${API_BASE_URL}/analysis/weekly/${guestId}`)
            .then(res => res.json())
            .then(res => {
                if (res.success) {
                    setData(res.data)
                }
                setLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch weekly summary', err)
                setLoading(false)
            })
    }, [guestId])

    if (loading) return <div className="h-48 flex items-center justify-center font-black animate-pulse opacity-50">กำลังคำนวณสถิติรายสัปดาห์...</div>
    if (data.length === 0) return null

    const maxVal = 100
    const chartHeight = 120
    const barWidth = 10 // Slightly reduced to prevent overflow

    return (
        <div className="bg-white border-3 border-[#1a1a1a] rounded-[2.5rem] p-5 md:p-6 shadow-[8px_8px_0_#1a1a1a] mt-6 overflow-hidden">
            <h3 className="text-xl font-black text-[#1a1a1a] mb-6 flex items-center gap-2">
                📈 สรุปพัฒนาการรายสัปดาห์
            </h3>

            <div className="flex items-end justify-between gap-1 h-36 border-b-2 border-slate-100 pb-2 overflow-x-auto no-scrollbar">
                {data.map((day, i) => {
                    const h1 = (day.management / maxVal) * chartHeight
                    const h2 = (day.calculation / maxVal) * chartHeight
                    const h3 = (day.spatial / maxVal) * chartHeight

                    return (
                        <div key={i} className="flex flex-col items-center min-w-[40px] flex-1 group">
                            <div className="flex items-end gap-0.5 mb-2">
                                <div
                                    className="bg-orange-400 border-2 border-[#1a1a1a] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                    style={{ height: `${Math.max(4, h1)}px`, width: `${barWidth}px` }}
                                    title={`การจัดการ: ${day.management}`}
                                />
                                <div
                                    className="bg-blue-400 border-2 border-[#1a1a1a] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                    style={{ height: `${Math.max(4, h2)}px`, width: `${barWidth}px` }}
                                    title={`การคำนวณ: ${day.calculation}`}
                                />
                                <div
                                    className="bg-indigo-400 border-2 border-[#1a1a1a] rounded-t-md transition-all duration-500 group-hover:brightness-110"
                                    style={{ height: `${Math.max(4, h3)}px`, width: `${barWidth}px` }}
                                    title={`มิติสัมพันธ์: ${day.spatial}`}
                                />
                            </div>
                            <span className="text-[10px] font-black uppercase text-slate-400">{day.label}</span>
                        </div>
                    )
                })}
            </div>

            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-orange-400 border-2 border-[#1a1a1a] rounded-sm" />
                    <span className="text-[9px] font-black opacity-60">การจัดการ</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-400 border-2 border-[#1a1a1a] rounded-sm" />
                    <span className="text-[9px] font-black opacity-60">การคำนวณ</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-indigo-400 border-2 border-[#1a1a1a] rounded-sm" />
                    <span className="text-[9px] font-black opacity-60">มิติสัมพันธ์</span>
                </div>
            </div>
        </div>
    )
}
