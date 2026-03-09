'use client'

import { useState, useRef } from 'react'

interface ClockIntroProps {
    onComplete: () => void
    targetHour?: number
    targetMinute?: number
}

export default function ClockIntro({ onComplete, targetHour = 10, targetMinute = 30 }: ClockIntroProps) {
    const [hourAngle, setHourAngle] = useState(0)
    const [minuteAngle, setMinuteAngle] = useState(0)
    const [activeHand, setActiveHand] = useState<'hour' | 'minute' | null>(null)
    const [hasMovedHour, setHasMovedHour] = useState(false)
    const [hasMovedMinute, setHasMovedMinute] = useState(false)
    const [attempts, setAttempts] = useState(0)
    const [feedback, setFeedback] = useState<string | null>(null)
    const [isDone, setIsDone] = useState(false)
    const clockRef = useRef<SVGSVGElement>(null)

    const handleInteraction = (e: React.MouseEvent | React.TouchEvent) => {
        if (isDone || !activeHand || !clockRef.current) return

        const rect = clockRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

        const dx = clientX - centerX
        const dy = clientY - centerY
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90
        if (angle < 0) angle += 360

        if (activeHand === 'minute') {
            const snappedMinute = Math.round(angle / 6) * 6
            setMinuteAngle(snappedMinute)
            setHasMovedMinute(true)
        } else {
            const snappedHour = Math.round(angle / 30) * 30
            setHourAngle(snappedHour)
            setHasMovedHour(true)
        }
        setFeedback(null)
    }

    const checkResult = () => {
        setAttempts(prev => prev + 1)
        const currentHour = (Math.round(hourAngle / 30) % 12) || 12
        const currentMinute = Math.round(minuteAngle / 6) % 60
        if (currentHour === targetHour && Math.abs(currentMinute - targetMinute) < 2) {
            setIsDone(true)
            setFeedback('ถูกต้องยอดเยี่ยม!')
        } else {
            setFeedback('ยังไม่ถูกต้อง ลองตรวจสอบเข็มนาฬิกาอีกครั้ง')
        }
    }

    const getEvaluation = () => {
        if (attempts <= 1) {
            return {
                title: 'ดีมาก',
                score: 5,
                text: 'สมองของคุณตอนนี้ไม่มีภาวะการรู้คิดบกพร่อง แต่อย่าชะล่าใจไป ในอนาคตทุกคนสามารถมีภาวะเสี่ยงความรู้คิดบกพร่องได้ทุกคน เมื่ออายุมากขึ้น คุณลองมาเล่นกับเกมกับเราสิ มาบริหารสมองเพื่อป้องกันภาวะความรู้คิดบกพร่องกัน',
                color: 'text-green-400'
            }
        }
        return {
            title: 'โอ้ !',
            score: 3,
            text: 'คุณมีความเสี่ยงที่จะเกิดภาวะความรู้คิดบกพร่อง แต่ไม่ต้องตกใจไป ในอนาคตเมื่ออายุมากขึ้นทุกคนมีความเสี่ยงมากขึ้นอยู่แล้ว มาเล่นเกมกับเราสิ่ มาบริหารสมองเพื่อป้องกันภาวะความรู้คิดบกพร่องกันเถอะ !',
            color: 'text-amber-400'
        }
    }

    const evalResult = getEvaluation()

    const numbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-700 p-6">
            <div className="max-w-md w-full text-center">
                <div className="inline-block px-4 py-1 bg-amber-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3 shadow-lg">
                    Brain Warm-up
                </div>
                <h2 className="text-2xl font-black text-white mb-2">ตั้งเวลาวอร์มอัพ</h2>
                <p className="text-blue-200 font-bold mb-6 text-xs md:text-sm">
                    เลือกเข็มและหมุนไปที่ <span className="text-white text-xl underline decoration-amber-400">{targetHour}:{targetMinute < 10 ? `0${targetMinute}` : targetMinute}</span>
                </p>

                <div className="flex gap-4 justify-center mb-10">
                    <button
                        onClick={() => setActiveHand('hour')}
                        className={`group relative px-6 py-3 rounded-2xl font-black transition-all shadow-lg text-sm md:text-base ${activeHand === 'hour' ? 'bg-indigo-600 text-white scale-110' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        🕘 เข็มชั่วโมง {hasMovedHour && '✅'}
                    </button>
                    <button
                        onClick={() => setActiveHand('minute')}
                        className={`group relative px-6 py-3 rounded-2xl font-black transition-all shadow-lg text-sm md:text-base ${activeHand === 'minute' ? 'bg-blue-600 text-white scale-110' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                        🕒 เข็มนาที {hasMovedMinute && '✅'}
                    </button>
                </div>

                <div className="relative group mx-auto w-fit">
                    <svg
                        ref={clockRef}
                        viewBox="0 0 200 200"
                        className="w-64 h-64 md:w-72 md:h-72 drop-shadow-[0_15px_40px_rgba(0,0,0,0.5)] touch-none select-none"
                        onMouseMove={handleInteraction}
                        onTouchMove={handleInteraction}
                        onClick={() => setActiveHand(null)}
                    >
                        {/* Clock Face */}
                        <circle cx="100" cy="100" r="95" fill="white" stroke="#1e293b" strokeWidth="6" />

                        {/* 30-min markers (ticks) */}
                        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => {
                            const isHalf = deg % 180 === 180 || deg === 180 || deg === 0;
                            return (
                                <line
                                    key={deg}
                                    x1="100" y1="8" x2="100" y2={isHalf ? "24" : "18"}
                                    stroke={isHalf ? "#334155" : "#cbd5e1"}
                                    strokeWidth={isHalf ? "4" : "2"}
                                    transform={`rotate(${deg}, 100, 100)`}
                                />
                            )
                        })}

                        {/* Numbers 1-12 */}
                        {numbers.map((n, i) => {
                            const angle = i * 30
                            const x = 100 + 72 * Math.sin((angle * Math.PI) / 180)
                            const y = 100 - 72 * Math.cos((angle * Math.PI) / 180)
                            return (
                                <text key={n} x={x} y={y} textAnchor="middle" alignmentBaseline="middle" className="text-[14px] font-black fill-slate-800 select-none">
                                    {n}
                                </text>
                            )
                        })}

                        {/* Center point */}
                        <circle cx="100" cy="100" r="5" fill="#1e293b" />

                        {/* Hour Hand */}
                        <line
                            x1="100" y1="100"
                            x2="100" y2="55"
                            stroke="#312e81"
                            strokeWidth="10"
                            strokeLinecap="round"
                            transform={`rotate(${hourAngle}, 100, 100)`}
                            className={`transition-transform duration-200 cursor-pointer ${activeHand === 'hour' ? 'stroke-indigo-600 filter drop-shadow-md' : 'opacity-40'}`}
                            onClick={() => setActiveHand('hour')}
                        />

                        {/* Minute Hand */}
                        <line
                            x1="100" y1="100"
                            x2="100" y2="25"
                            stroke="#6366f1"
                            strokeWidth="6"
                            strokeLinecap="round"
                            transform={`rotate(${minuteAngle}, 100, 100)`}
                            className={`transition-transform duration-200 cursor-pointer ${activeHand === 'minute' ? 'stroke-blue-600 filter drop-shadow-md' : 'opacity-40'}`}
                            onClick={() => setActiveHand('minute')}
                        />
                    </svg>

                    {isDone && (
                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in pointer-events-none">
                            <div className="bg-green-500 text-white w-28 h-28 rounded-full flex items-center justify-center text-6xl shadow-2xl border-4 border-white animate-bounce">
                                ✅
                            </div>
                        </div>
                    )}

                    {!activeHand && !isDone && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                            <div className="bg-amber-400 text-slate-900 px-6 py-3 rounded-2xl font-black shadow-2xl animate-pulse border-4 border-white">
                                👆 เลือกเข็มที่จะหมุนก่อน
                            </div>
                        </div>
                    )}
                </div>

                {feedback && !isDone && (
                    <p className="mt-4 text-red-400 font-bold animate-shake">{feedback}</p>
                )}

                {isDone && (
                    <div className="mt-4 md:mt-6 p-4 md:p-6 bg-white/10 rounded-2xl md:rounded-3xl border border-white/20 animate-in zoom-in duration-500 text-center shadow-lg">
                        <div className={`text-2xl md:text-4xl font-black mb-3 ${evalResult.color} drop-shadow-sm`}>
                            {evalResult.title} <span className="text-lg md:text-2xl opacity-90">(คะแนน: {evalResult.score}/5)</span>
                        </div>
                        <p className="text-white text-[15px] md:text-lg font-bold leading-relaxed opacity-95">
                            {evalResult.text}
                        </p>
                    </div>
                )}
                {/* Dynamic Hint */}
                <div className="mt-4 h-8 flex items-center justify-center">
                    {activeHand && !isDone && (
                        <div className="bg-amber-400 text-slate-900 px-4 py-1 rounded-full text-xs font-black animate-bounce border-2 border-white shadow-lg">
                            📍 ปรับตำแหน่งที่ต้องการแล้ว "คลิกปุ่มด้านล่าง" เพื่อวางเข็ม
                        </div>
                    )}
                    {!activeHand && hasMovedHour && hasMovedMinute && !isDone && (
                        <div className="bg-green-500/20 text-green-400 px-4 py-1 rounded-full text-xs font-black animate-pulse border border-green-500/30">
                            ✨ วางเข็มครบแล้ว ตรวจสอบอีกครั้งก่อนส่ง
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        if (isDone) onComplete();
                        else if (activeHand) setActiveHand(null);
                        else checkResult();
                    }}
                    disabled={(!hasMovedHour && !hasMovedMinute && !isDone)}
                    className={`mt-4 w-full py-4 rounded-[1.5rem] font-black text-xl transition-all shadow-2xl ${isDone
                        ? 'bg-green-500 text-white scale-105 hover:bg-green-400'
                        : activeHand
                            ? 'bg-amber-500 text-white hover:scale-105 shadow-amber-500/50 border-b-4 border-amber-700 active:border-b-0'
                            : (!hasMovedHour || !hasMovedMinute)
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed border-2 border-slate-600'
                                : 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white hover:shadow-indigo-500/50 animate-pulse-gentle shadow-[0_0_20px_rgba(79,70,229,0.4)] border-b-4 border-indigo-900 active:border-b-0'
                        }`}
                >
                    {isDone
                        ? 'เริ่มการทดสอบถัดไป 🚀'
                        : activeHand
                            ? '📍 เลือกวางเข็มตรงนี้'
                            : (!hasMovedHour || !hasMovedMinute)
                                ? 'กรุณาขยับเข็มให้ครบ'
                                : '✨ ส่งคำตอบ (เลือกตรงนี้)'}
                </button>
            </div>
            <style jsx>{`
                @keyframes pulse-gentle {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .animate-pulse-gentle {
                    animation: pulse-gentle 2s ease-in-out infinite;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
            `}</style>
        </div>
    )
}
