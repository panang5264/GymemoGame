'use client'

import { useEffect, useState } from 'react'
import { getVillageRunHistory, VillageRunRecord, getVillageProgress } from '@/lib/levelSystem'
import { useProgress } from '@/contexts/ProgressContext'

interface PreviousRunPreviewProps {
    villageId: number
    onStart: () => void
    onBack: () => void
}

function MiniBar({ value, total, color }: { value: number; total: number; color: string }) {
    const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
    return (
        <div className="flex items-center gap-2 w-full">
            <div className="flex-1 h-2 bg-black/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-[10px] font-black text-slate-500 w-8 text-right tabular-nums">{value}</span>
        </div>
    )
}

export default function PreviousRunPreview({ villageId, onStart, onBack }: PreviousRunPreviewProps) {
    const [history, setHistory] = useState<VillageRunRecord[]>([])
    const [bestScore, setBestScore] = useState(0)

    const { progress, isLoading } = useProgress()

    useEffect(() => {
        if (isLoading || !progress) return
        const hist = getVillageRunHistory(progress, villageId)
        setHistory(hist)
        const vp = getVillageProgress(progress, villageId)
        setBestScore(vp.bestScore ?? 0)
    }, [villageId, progress, isLoading])

    const hasHistory = history.length > 0
    const lastRun = hasHistory ? history[history.length - 1] : null
    const maxScore = lastRun ? Math.max(lastRun.managementScore, lastRun.calculationScore, lastRun.spatialScore, 1) : 1

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">

                {/* Header */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl rotate-12">🏘️</div>
                    <img
                        src={`/assets_employer/background/map/villages/unlocked/${villageId}.PNG`}
                        className="w-24 h-24 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-in slide-in-from-bottom duration-700"
                        alt="Village"
                    />
                    <h2 className="text-2xl font-black">หมู่บ้านที่ {villageId}</h2>
                    {hasHistory ? (
                        <p className="text-white/50 text-sm font-bold mt-1">คุณเคยเล่นมาแล้ว {history.length} รอบ</p>
                    ) : (
                        <p className="text-white/50 text-sm font-bold mt-1">ยังไม่มีประวัติการเล่น</p>
                    )}
                </div>

                <div className="p-6 space-y-5">

                    {hasHistory && lastRun && (
                        <>
                            {/* Best Score */}
                            <div className="flex items-center justify-between bg-amber-100/50 border-2 border-amber-300 rounded-2xl p-4">
                                <span className="text-sm font-black text-amber-800">🏆 คะแนนสูงสุด</span>
                                <span className="text-2xl font-black text-amber-600 tabular-nums">{bestScore.toLocaleString()}</span>
                            </div>

                            {/* Last run detail */}
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                    🕐 รอบล่าสุด (รอบที่ {lastRun.runNumber})
                                </p>
                                <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-black text-orange-500">📦 Management</span>
                                        </div>
                                        <MiniBar value={lastRun.managementScore} total={maxScore} color="#f97316" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-black text-blue-500">🔢 Calculation</span>
                                        </div>
                                        <MiniBar value={lastRun.calculationScore} total={maxScore} color="#3b82f6" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[11px] font-black text-green-500">🗺️ Spatial</span>
                                        </div>
                                        <MiniBar value={lastRun.spatialScore} total={maxScore} color="#22c55e" />
                                    </div>
                                    <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                                        <span className="text-xs font-black text-slate-400 uppercase">รวม</span>
                                        <span className="text-xl font-black text-slate-700 tabular-nums">{lastRun.totalScore.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* All runs mini chart */}
                            {history.length > 1 && (
                                <div>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📈 คะแนนทุกรอบ</p>
                                    <div className="bg-slate-50 rounded-2xl p-4">
                                        <div className="flex items-end gap-2 h-16">
                                            {history.map((run) => {
                                                const maxH = Math.max(...history.map(r => r.totalScore), 1)
                                                const heightPct = (run.totalScore / maxH) * 100
                                                const isLast = run.runNumber === lastRun.runNumber
                                                return (
                                                    <div key={run.runNumber} className="flex-1 flex flex-col items-center gap-1">
                                                        <div
                                                            className="w-full rounded-t-lg transition-all duration-500"
                                                            style={{
                                                                height: `${Math.max(8, heightPct)}%`,
                                                                background: isLast ? '#6366f1' : '#e2e8f0',
                                                                minHeight: '8px'
                                                            }}
                                                        />
                                                        <span className="text-[8px] font-black text-slate-400">{run.runNumber}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        <p className="text-[9px] text-slate-400 font-bold text-center mt-2">รอบที่ (ม่วง = ล่าสุด)</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!hasHistory && (
                        <div className="text-center py-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-yellow-400/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                                <img
                                    src={`/assets_employer/background/map/villages/unlocked/${villageId}.PNG`}
                                    className="w-32 h-32 relative z-10 mx-auto"
                                    alt="Village"
                                />
                            </div>
                            <p className="font-black text-xl text-indigo-900">เริ่มต้นการเดินทาง! ✨</p>
                            <p className="text-sm text-slate-400 font-black mt-2 max-w-[200px] mx-auto leading-relaxed">
                                ประวัติการพัฒนาของคุณ<br />จะปรากฏที่นี่หลังเล่นรอบแรก
                            </p>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            onClick={onBack}
                            className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black transition-all"
                        >
                            ← ย้อนกลับ
                        </button>
                        <button
                            onClick={onStart}
                            className="flex-2 flex-grow-[2] py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black transition-all active:scale-95 shadow-lg shadow-green-100/50"
                        >
                            {hasHistory ? '🔄 เล่นอีกรอบ' : 'เริ่มเล่น! ✨'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
