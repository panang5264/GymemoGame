'use client'

import { useState, useEffect } from 'react'

interface TrainingModalProps {
    mode: 'management' | 'calculation' | 'spatial'
    onClose: () => void
}

export default function TrainingModal({ mode, onClose }: TrainingModalProps) {
    const [score, setScore] = useState(0)
    const [subPhase, setSubPhase] = useState<'intro' | 'play' | 'result'>('intro')

    // Shared Management State
    const [mgmtStep, setMgmtStep] = useState(0) // 0: sorting, 1: cooking, 2: maze
    const [sortIdx, setSortIdx] = useState(0)
    const [cookCollected, setCookCollected] = useState<string[]>([])
    const [mazePos, setMazePos] = useState({ r: 0, c: 0 })

    // Calculation State
    const [calcIdx, setCalcIdx] = useState(0)
    const [calcInput, setCalcInput] = useState('')

    // Spatial State
    const [spatialStep, setSpatialStep] = useState(0) // 0: match, 1: arrow

    const titles = {
        management: 'ฟื้นฟูการจัดการ ✨',
        calculation: 'ฟื้นฟูการคำนวณ 🔢',
        spatial: 'ฟื้นฟูมิติสัมพันธ์ 🗺️'
    }

    const handleFinish = () => {
        setSubPhase('result')
    }

    // --- Handlers ---
    const handleSort = (cat: string) => {
        const items = [
            { emoji: '🍎', cat: 'food' },
            { emoji: '⚽', cat: 'toy' },
            { emoji: '🍔', cat: 'food' }
        ]
        if (cat === items[sortIdx].cat) setScore(s => s + 1)
        if (sortIdx < items.length - 1) {
            setSortIdx(prev => prev + 1)
        } else {
            setMgmtStep(1) // Move to cooking
        }
    }

    const handleCookPick = (ing: string) => {
        const recipe = ['🥒', '🥚']
        if (ing === recipe[cookCollected.length]) {
            const next = [...cookCollected, ing]
            setCookCollected(next)
            if (next.length === recipe.length) {
                setScore(s => s + 1)
                setTimeout(() => setMgmtStep(2), 500) // Move to maze
            }
        }
    }

    const handleMazeMove = (dr: number, dc: number) => {
        const maze = [
            [0, 0, 1, 0],
            [1, 0, 0, 0],
            [0, 1, 1, 0],
            [0, 0, 0, 2]
        ]
        const nr = mazePos.r + dr, nc = mazePos.c + dc
        if (nr >= 0 && nr < 4 && nc >= 0 && nc < 4 && maze[nr][nc] !== 1) {
            if (maze[nr][nc] === 2) {
                setScore(s => s + 1)
                handleFinish()
            } else {
                setMazePos({ r: nr, c: nc })
            }
        }
    }

    const handleCalcSubmit = () => {
        const questions = [
            { q: '15 + 7', a: 22 },
            { q: '24 - 9', a: 15 },
            { q: '6 x 4', a: 24 }
        ]
        if (parseInt(calcInput) === questions[calcIdx].a) setScore(s => s + 1)
        if (calcIdx < questions.length - 1) {
            setCalcIdx(prev => prev + 1)
            setCalcInput('')
        } else {
            handleFinish()
        }
    }

    const handleSpatialMatch = (correct: boolean) => {
        if (correct) setScore(s => s + 1)
        setSpatialStep(1)
    }

    const handleSpatialArrow = (correct: boolean) => {
        if (correct) setScore(s => s + 1)
        handleFinish()
    }

    return (
        <div className="fixed inset-0 z-[20000] flex items-center justify-center p-2 min-[400px]:p-4 bg-black/80 backdrop-blur-xl animate-in fade-in">
            <div className="bg-[#fcfaf2] w-full max-w-2xl rounded-[2.5rem] min-[400px]:rounded-[4rem] border-[4px] min-[400px]:border-[6px] border-black shadow-[10px_10px_0_#000] min-[400px]:shadow-[20px_20px_0_#000] overflow-hidden relative flex flex-col max-h-[90vh] font-['Supermarket']">

                {/* Header */}
                <div className="p-4 min-[400px]:p-8 border-b-2 min-[400px]:border-b-4 border-black flex justify-between items-center bg-white shrink-0">
                    <div>
                        <span className="text-[7px] min-[400px]:text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Onboarding Training</span>
                        <h2 className="text-lg min-[400px]:text-2xl font-black text-black leading-tight">{titles[mode]}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 min-[400px]:w-12 min-[400px]:h-12 rounded-xl min-[400px]:rounded-2xl bg-black/5 hover:bg-black hover:text-white flex items-center justify-center font-black transition-all"
                    >✕</button>
                </div>

                {/* Content Area */}
                <div className="flex-1 p-5 min-[400px]:p-10 flex flex-col items-center justify-center overflow-y-auto custom-scrollbar">
                    {subPhase === 'intro' && (
                        <div className="text-center animate-in zoom-in">
                            <div className="text-5xl min-[400px]:text-7xl mb-4 min-[400px]:mb-6">
                                {mode === 'management' ? '📦' : mode === 'calculation' ? '🔢' : '🗺️'}
                            </div>
                            <p className="text-slate-500 font-bold mb-6 min-[400px]:mb-8 text-xs min-[400px]:text-base leading-relaxed max-w-sm mx-auto">
                                {mode === 'management' ? 'พร้อมที่จะฝึกทักษะการจัดการหรือยัง? คุณจะต้องผ่านบททดสอบสั้นๆ 3 หัวข้อ (คัดแยก, ปรุงอาหาร, เขาวงกต)' :
                                    mode === 'calculation' ? 'ท้าทายสมองด้วยการคิดเลขเร็วแบบสั้นๆ เพื่อกู้คืนเซลล์สมองที่หายไป' :
                                        'ฝึกวางตัวในพื้นที่มิติจำลองเพื่อค้นหาความลับที่ซ่อนอยู่'}
                            </p>
                            <button
                                onClick={() => setSubPhase('play')}
                                className="pill-button px-8 min-[400px]:px-12 py-3 min-[400px]:py-4 text-lg min-[400px]:text-xl"
                            >
                                เริ่มฝึกฝนทันที ⚡
                            </button>
                        </div>
                    )}

                    {subPhase === 'play' && (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                            {/* MANAGEMENT CONTENT */}
                            {mode === 'management' && (
                                <>
                                    {mgmtStep === 0 && (
                                        <div className="text-center animate-in zoom-in">
                                            <p className="text-slate-500 font-bold mb-6">แยกหมวดหมู่สิ่งของ (ของกิน vs ของเล่น)</p>
                                            <div className="text-7xl mb-8 animate-bounce">
                                                {[{ e: '🍎', c: 'food' }, { e: '⚽', c: 'toy' }, { e: '🍔', c: 'food' }][sortIdx].e}
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <button onClick={() => handleSort('food')} className="pill-button py-3 text-lg bg-orange-100 !text-orange-900 border-orange-200">ของกิน 🥪</button>
                                                <button onClick={() => handleSort('toy')} className="pill-button py-3 text-lg bg-blue-100 !text-blue-900 border-blue-200">ของเล่น 🧸</button>
                                            </div>
                                        </div>
                                    )}
                                    {mgmtStep === 1 && (
                                        <div className="text-center animate-in slide-in-from-right">
                                            <p className="text-slate-500 font-bold mb-4">ฟื้นฟูการทำอาหาร: แตงกวาผัดไข่ 🍳</p>
                                            <div className="flex justify-center gap-4 mb-8 bg-slate-100 p-4 rounded-2xl min-h-[80px] border-2 border-dashed border-slate-300">
                                                {cookCollected.map((c, i) => <span key={i} className="text-5xl">{c}</span>)}
                                                {cookCollected.length < 2 && <span className="text-5xl opacity-20">?</span>}
                                            </div>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['🥒', '🥚', '🧂', '🥩', '🥦', '🌶️'].map(ing => (
                                                    <button key={ing} onClick={() => handleCookPick(ing)} className="w-16 h-16 bg-white border-2 border-slate-200 rounded-2xl text-3xl hover:scale-110 active:scale-90 transition-all">{ing}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {mgmtStep === 2 && (
                                        <div className="flex flex-col items-center animate-in slide-in-from-bottom">
                                            <p className="text-slate-500 font-bold mb-3 min-[400px]:mb-4 text-[10px] min-[400px]:text-sm">การวางแผน: เดินหาทางออกไปยังธง 🏁</p>
                                            <div className="grid grid-cols-4 gap-0.5 min-[400px]:gap-1 bg-slate-800 p-1.5 min-[400px]:p-2 rounded-xl min-[400px]:rounded-2xl mb-4 min-[400px]:mb-6 border-2 min-[400px]:border-4 border-slate-700">
                                                {[0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 2].map((cell, idx) => {
                                                    const r = Math.floor(idx / 4), c = idx % 4;
                                                    return (
                                                        <div key={idx} className={`w-8 h-8 min-[400px]:w-12 min-[400px]:h-12 rounded-md min-[400px]:rounded-lg flex items-center justify-center text-sm min-[400px]:text-xl ${cell === 1 ? 'bg-slate-600' : 'bg-slate-900/40'}`}>
                                                            {mazePos.r === r && mazePos.c === c ? '🧍' : cell === 2 ? '🏁' : ''}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                <div /><button onClick={() => handleMazeMove(-1, 0)} className="w-10 h-10 min-[400px]:w-14 min-[400px]:h-14 bg-white rounded-lg min-[400px]:rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center text-xl min-[400px]:text-2xl">🔼</button><div />
                                                <button onClick={() => handleMazeMove(0, -1)} className="w-10 h-10 min-[400px]:w-14 min-[400px]:h-14 bg-white rounded-lg min-[400px]:rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center text-xl min-[400px]:text-2xl">◀️</button>
                                                <button onClick={() => handleMazeMove(1, 0)} className="w-10 h-10 min-[400px]:w-14 min-[400px]:h-14 bg-white rounded-lg min-[400px]:rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center text-xl min-[400px]:text-2xl">🔽</button>
                                                <button onClick={() => handleMazeMove(0, 1)} className="w-10 h-10 min-[400px]:w-14 min-[400px]:h-14 bg-white rounded-lg min-[400px]:rounded-xl border-2 border-slate-200 shadow-sm flex items-center justify-center text-xl min-[400px]:text-2xl">▶️</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* CALCULATION CONTENT */}
                            {mode === 'calculation' && (
                                <div className="text-center animate-in zoom-in w-full max-w-sm">
                                    <p className="text-slate-500 font-bold mb-4 min-[400px]:mb-6 italic text-[10px] min-[400px]:text-sm">ตอบโจทย์เลขต่อไปนี้ (ด่านทดสอบความไว)</p>
                                    <div className="text-3xl min-[400px]:text-5xl font-black mb-6 min-[400px]:mb-8 text-slate-800 tracking-tighter">
                                        {['15 + 7', '24 - 9', '6 x 4'][calcIdx]} = ?
                                    </div>
                                    <input
                                        autoFocus
                                        className="w-full text-center text-2xl min-[400px]:text-4xl font-black border-2 min-[400px]:border-3 border-black rounded-xl min-[400px]:rounded-2xl py-3 min-[400px]:py-4 mb-4 min-[400px]:mb-5 outline-none focus:bg-indigo-50 transition-colors"
                                        type="number"
                                        value={calcInput}
                                        onChange={e => setCalcInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCalcSubmit()}
                                    />
                                    <button onClick={handleCalcSubmit} className="pill-button w-full py-3 min-[400px]:py-4 text-lg min-[400px]:text-xl">ถัดไป ✨</button>
                                </div>
                            )}

                            {/* SPATIAL CONTENT */}
                            {mode === 'spatial' && (
                                <>
                                    {spatialStep === 0 && (
                                        <div className="text-center animate-in zoom-in">
                                            <p className="text-slate-500 font-bold mb-4">เลือกภาพที่เหมือนด้านบน (การจดจำมิติ)</p>
                                            <div className="text-8xl mb-10 drop-shadow-xl animate-pulse">🎨</div>
                                            <div className="grid grid-cols-3 gap-4">
                                                {['⚽', '🎨', '🧶'].map(e => (
                                                    <button key={e} onClick={() => handleSpatialMatch(e === '🎨')} className="p-6 bg-white border-2 border-slate-200 rounded-[1.5rem] text-5xl hover:scale-110 active:scale-95 transition-all shadow-md">{e}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {spatialStep === 1 && (
                                        <div className="text-center animate-in slide-in-from-right">
                                            <p className="text-slate-500 font-bold mb-6">มองจากทิศทางลูกศร จะเห็นสีอะไร? 👁️</p>
                                            <div className="relative inline-block mb-12 p-6 bg-slate-800 rounded-3xl border-8 border-slate-700">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="w-16 h-16 bg-red-500 rounded-xl shadow-inner"></div>
                                                    <div className="w-16 h-16 bg-blue-500 rounded-xl shadow-inner"></div>
                                                </div>
                                                <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-6xl animate-bounce">➡️</div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6 w-full max-w-md mx-auto">
                                                <button onClick={() => handleSpatialArrow(false)} className="py-6 px-10 bg-blue-100 border-4 border-blue-200 rounded-[2rem] text-blue-800 font-black text-xl hover:scale-105 transition-all">น้ำเงิน 🟦</button>
                                                <button onClick={() => handleSpatialArrow(true)} className="py-6 px-10 bg-red-100 border-4 border-red-200 rounded-[2rem] text-red-800 font-black text-xl hover:scale-105 transition-all">แดง 🟥</button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {subPhase === 'result' && (
                        <div className="text-center animate-in zoom-in duration-700">
                            <div className="text-6xl min-[400px]:text-8xl mb-4 min-[400px]:mb-6">🏆</div>
                            <h3 className="text-2xl min-[400px]:text-4xl font-black text-black mb-1.5 min-[400px]:mb-3 leading-none uppercase tracking-tighter">สุดยอดไปเลย!</h3>
                            <p className="text-slate-500 font-bold mb-6 min-[400px]:mb-8 text-base min-[400px]:text-lg">คุณผ่านการฝึกฝนระดับต้นแล้ว ✨</p>

                            <div className="bg-white border-2 min-[400px]:border-3 border-black p-4 min-[400px]:p-6 rounded-2xl min-[400px]:rounded-[2rem] mb-6 min-[400px]:mb-8 shadow-[8px_8px_0_rgba(0,0,0,0.05)]">
                                <p className="text-[7px] min-[400px]:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 min-[400px]:mb-2">Training Performance</p>
                                <div className="text-xl min-[400px]:text-3xl font-black text-indigo-600">Perfect! คมกริบ</div>
                            </div>

                            <button
                                onClick={onClose}
                                className="pill-button w-full py-4 min-[400px]:py-6 text-xl min-[400px]:text-2xl !bg-green-500 !text-white border-2 min-[400px]:border-4 border-black shadow-[0_4px_0_#166534] min-[400px]:shadow-[0_8px_0_#166534] hover:translate-y-1 hover:shadow-[0_2px_0_#166534] transition-all"
                            >
                                ไปลุยของจริงกัน! ✨
                            </button>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                {subPhase === 'play' && (
                    <div className="px-5 min-[400px]:px-10 py-3 min-[400px]:py-6 border-t-2 min-[400px]:border-t-4 border-black/5 bg-slate-50 flex justify-between items-center text-[7px] min-[400px]:text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                        <div className="flex items-center gap-1 min-[400px]:gap-2">
                            <span className="w-1.5 h-1.5 min-[400px]:w-2 min-[400px]:h-2 rounded-full bg-green-500 animate-pulse"></span>
                            LIVE: {mode}
                        </div>
                        <div className="flex gap-2 min-[400px]:gap-4">
                            <span>XP: +50 / TRY</span>
                            <span className="text-indigo-500">READY</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
