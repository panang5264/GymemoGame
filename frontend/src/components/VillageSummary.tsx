'use client'

import { useEffect, useState } from 'react'
import { VillageRunRecord, PLAYS_PER_VILLAGE } from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'
import CognitiveTrendChart from './CognitiveTrendChart'
import BrainRadarChart from './BrainRadarChart'
import { useProgress } from '@/contexts/ProgressContext'

interface ScoreBar {
    label: string
    emoji: string
    score: number
    maxScore: number
    color: string
    bgColor: string
}

interface VillageSummaryProps {
    villageId: number
    onContinue: () => void
    /** Override scores to show – if omitted, reads from currentRunScore in progress */
    scores?: { management: number; calculation: number; spatial: number }
}

function AnimatedBar({ percent, color }: { percent: number; color: string }) {
    const [width, setWidth] = useState(0)
    useEffect(() => {
        const t = setTimeout(() => setWidth(percent), 100)
        return () => clearTimeout(t)
    }, [percent])
    return (
        <div className="h-4 bg-black/10 rounded-full overflow-hidden w-full">
            <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${width}%`, background: color }}
            />
        </div>
    )
}

export default function VillageSummary({ villageId, onContinue, scores: propScores }: VillageSummaryProps) {
    const [expPercent, setExpPercent] = useState(0)
    const [runHistory, setRunHistory] = useState<VillageRunRecord[]>([])
    const [scores, setScores] = useState({ management: 0, calculation: 0, spatial: 0 })
    const [showHistory, setShowHistory] = useState(false)
    const { progress, isLoading } = useProgress()

    useEffect(() => {
        if (isLoading || !progress) return
        const p = progress
        const vp = p.villages[String(villageId)]
        const ep = getExpPercent(vp?.playsCompleted ?? 0)
        setExpPercent(ep)
        const hist = vp?.runHistory ?? []
        setRunHistory(hist)

        if (propScores) {
            setScores(propScores)
        } else if (vp?.currentRunScore) {
            setScores(vp.currentRunScore)
        } else if (hist.length > 0) {
            const last = hist[hist.length - 1]
            setScores({ management: last.managementScore, calculation: last.calculationScore, spatial: last.spatialScore })
        }
    }, [villageId, propScores, progress, isLoading])

    const totalScore = scores.management + scores.calculation + scores.spatial
    const maxPerGame = Math.max(100, Math.max(scores.management, scores.calculation, scores.spatial))

    const scoreBars: ScoreBar[] = [
        { label: 'Management', emoji: '📦', score: scores.management, maxScore: maxPerGame, color: '#f97316', bgColor: '#fff7ed' },
        { label: 'Calculation', emoji: '🔢', score: scores.calculation, maxScore: maxPerGame, color: '#3b82f6', bgColor: '#eff6ff' },
        { label: 'Spatial', emoji: '🗺️', score: scores.spatial, maxScore: maxPerGame, color: '#22c55e', bgColor: '#f0fdf4' },
    ]

    const evalLabel = totalScore > 200 ? { text: 'ยอดเยี่ยม!', color: 'text-green-500', emoji: '🏆' }
        : totalScore > 100 ? { text: 'ดีมาก', color: 'text-blue-500', emoji: '⭐' }
            : { text: 'ยังพัฒนาได้', color: 'text-orange-500', emoji: '💪' }

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-xl p-4 animate-in fade-in duration-500">
            <div className="max-w-lg w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">

                {/* Header */}
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 text-white text-center">
                    <div className="text-6xl mb-3">{evalLabel.emoji}</div>
                    <h2 className="text-3xl font-black">สรุปด่านที่ {villageId}</h2>
                    <p className={`text-lg font-black mt-1 ${evalLabel.color.replace('text-', 'text-').replace('500', '200')}`}>{evalLabel.text}</p>
                    <div className="mt-4 bg-white/10 rounded-2xl px-6 py-3 inline-block">
                        <span className="text-white/60 text-xs font-black uppercase tracking-widest">คะแนนรวม</span>
                        <div className="text-4xl font-black tabular-nums">{totalScore.toLocaleString()}</div>
                    </div>
                </div>

                <div className="p-6 space-y-4">

                    {/* EXP Bar */}
                    <div className="bg-slate-50 rounded-2xl p-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">⚡ EXP ด่านนี้</span>
                            <span className="text-sm font-black text-indigo-600">{expPercent}% / 100%</span>
                        </div>
                        <AnimatedBar percent={expPercent} color="linear-gradient(90deg, #6366f1, #8b5cf6)" />
                        <p className="text-xs text-slate-400 font-bold mt-1 text-right">
                            {expPercent >= 100 ? '✅ ปลดล็อกด่านถัดไปแล้ว!' : `เล่นอีก ${Math.ceil(((100 - expPercent) / 100) * PLAYS_PER_VILLAGE)} รอบเพื่อปลดล็อก`}
                        </p>
                    </div>

                    {/* Per-game scores */}
                    <div className="space-y-3">
                        {scoreBars.map((bar) => (
                            <div key={bar.label} className="rounded-2xl p-4" style={{ background: bar.bgColor }}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-slate-700 text-sm">
                                        {bar.emoji} {bar.label}
                                    </span>
                                    <span className="font-black text-slate-800 tabular-nums">{bar.score.toLocaleString()}</span>
                                </div>
                                <AnimatedBar
                                    percent={bar.maxScore > 0 ? Math.round((bar.score / bar.maxScore) * 100) : 0}
                                    color={bar.color}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Run History Trend Chart */}
                    {runHistory.length >= 2 && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white overflow-hidden shadow-xl">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-black uppercase tracking-widest text-indigo-300">📈 แนวโน้มพัฒนาการ</h4>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Last {runHistory.length} runs</span>
                            </div>
                            <CognitiveTrendChart
                                trends={[
                                    { label: 'Management', points: runHistory.map(r => r.managementScore), color: '#f97316' },
                                    { label: 'Calculation', points: runHistory.map(r => r.calculationScore), color: '#3b82f6' },
                                    { label: 'Spatial', points: runHistory.map(r => r.spatialScore), color: '#22c55e' }
                                ]}
                                width={400}
                                height={180}
                            />
                            <div className="mt-4 flex justify-between px-2">
                                <span className="text-[9px] font-bold text-slate-500">PAST</span>
                                <span className="text-[9px] font-bold text-indigo-400">PRESENT</span>
                            </div>
                        </div>
                    )}

                    {/* Previous runs history list */}
                    {runHistory.length > 1 && (
                        <div>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="w-full text-left text-xs font-black text-slate-400 uppercase tracking-widest py-2 hover:text-slate-600 transition-colors flex items-center gap-2"
                            >
                                <span>{showHistory ? '▼' : '▶'}</span>
                                รายละเอียด {runHistory.length} รอบที่ผ่านมา
                            </button>

                            {showHistory && (
                                <div className="space-y-2 animate-in slide-in-from-top duration-300">
                                    {[...runHistory].reverse().slice(0, 5).map((run) => (
                                        <div key={run.runNumber} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                                            <div>
                                                <span className="text-xs font-black text-slate-400">รอบที่ {run.runNumber}</span>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-orange-500">📦 {run.managementScore}</span>
                                                    <span className="text-[10px] font-bold text-blue-500">🔢 {run.calculationScore}</span>
                                                    <span className="text-[10px] font-bold text-green-500">🗺️ {run.spatialScore}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-slate-800 tabular-nums">{run.totalScore.toLocaleString()}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">
                                                    {new Date(run.completedAt).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={onContinue}
                        className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-[2rem] font-black text-xl transition-all active:scale-95 shadow-lg shadow-green-100 mt-4"
                    >
                        ไปต่อ ✨
                    </button>
                </div>
            </div>
        </div>
    )
}
