'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getDateKey } from '@/lib/dailyChallenge'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'

// ─── Maze Generation Logic (Recursive Backtracker) ──────────────────────────

type Cell = { r: number; c: number }

function generateMaze(rows: number, cols: number) {
    const maze = Array.from({ length: rows }, () => Array(cols).fill(1)) // 1 = Wall, 0 = Path
    const visited = Array.from({ length: rows }, () => Array(cols).fill(false))

    function walk(r: number, c: number) {
        visited[r][c] = true
        maze[r][c] = 0

        const directions = [
            [0, 2], [0, -2], [2, 0], [-2, 0]
        ].sort(() => Math.random() - 0.5)

        for (const [dr, dc] of directions) {
            const nr = r + dr
            const nc = c + dc

            if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && !visited[nr][nc]) {
                maze[r + dr / 2][c + dc / 2] = 0 // Remove wall between
                walk(nr, nc)
            }
        }
    }

    walk(1, 1)
    maze[rows - 2][cols - 2] = 2 // Exit
    return maze
}

// ─── Main Component ──────────────────────────────────────────────────────────

function MazeGameInner() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const villageIdParam = searchParams.get('villageId') || '1'
    const subId = parseInt(searchParams.get('subId') || '1', 10)
    const mode = searchParams.get('mode') || 'practice'
    const levelParam = parseInt(searchParams.get('level') || (mode === 'village' ? villageIdParam : '1'), 10)

    const [phase, setPhase] = useState<'intro' | 'play' | 'done'>('intro')
    const [maze, setMaze] = useState<number[][]>([])
    const [playerPos, setPlayerPos] = useState<Cell>({ r: 1, c: 1 })
    const [startTime, setStartTime] = useState(0)
    const [endTime, setEndTime] = useState(0)
    const [moves, setMoves] = useState(0)

    const { progress } = useProgress()
    const { recordPlay, markDailyMode } = useLevelSystem()

    // Maze sizing based on level
    const rows = 11 + Math.min(levelParam, 5) * 2
    const cols = 11 + Math.min(levelParam, 5) * 2

    const initGame = useCallback(() => {
        const newMaze = generateMaze(rows, cols)
        setMaze(newMaze)
        setPlayerPos({ r: 1, c: 1 })
        setMoves(0)
        setStartTime(Date.now())
        setPhase('play')
    }, [rows, cols])

    const movePlayer = (dr: number, dc: number) => {
        if (phase !== 'play') return
        const nr = playerPos.r + dr
        const nc = playerPos.c + dc

        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return
        if (maze[nr][nc] === 1) return // Wall

        setPlayerPos({ r: nr, c: nc })
        setMoves(m => m + 1)

        if (maze[nr][nc] === 2) {
            setEndTime(Date.now())
            setPhase('done')
            if (mode === 'village') {
                const timeTaken = (Date.now() - startTime) / 1000
                const score = Math.max(10, Math.floor(1000 / (timeTaken + 1)))
                recordPlay(parseInt(villageIdParam), score, undefined, subId)

                // ถือว่าทำภารกิจรายวันโหมด management ควบคู่ไปด้วย (เนื่องจาก Reaction เป็นส่วนหนึ่งของหมู่บ้าน)
                const dk = getDateKey()
                markDailyMode(dk, 'management')
            }
        }
    }

    // Keyboard controls
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (phase !== 'play') return
            switch (e.key) {
                case 'ArrowUp': case 'w': movePlayer(-1, 0); break
                case 'ArrowDown': case 's': movePlayer(1, 0); break
                case 'ArrowLeft': case 'a': movePlayer(0, -1); break
                case 'ArrowRight': case 'd': movePlayer(0, 1); break
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [phase, playerPos, maze])

    // Cheat Win
    useEffect(() => {
        const handleCheat = () => {
            setPhase('done')
            setEndTime(Date.now())
        }
        window.addEventListener('gymemo:cheat_complete', handleCheat)
        return () => window.removeEventListener('gymemo:cheat_complete', handleCheat)
    }, [])

    return (
        <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4 font-['Supermarket']">
            <div className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[600px] relative border border-slate-100">

                {/* Header Bar */}
                <div className="h-20 bg-white border-b-2 border-slate-50 flex items-center justify-between px-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl">🧭</div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Maze Runner — ด่าน {levelParam}</h1>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moves</span>
                            <span className="text-3xl font-black text-indigo-600 tabular-nums">{moves}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative flex items-center justify-center bg-slate-50/50 p-6">
                    {phase === 'intro' && (
                        <div className="text-center animate-in zoom-in">
                            <div className="text-9xl mb-8 animate-jiggle">🧭</div>
                            <h2 className="text-3xl font-black text-slate-800 mb-6 uppercase tracking-tighter">เขาวงกตพรีเมียม</h2>
                            <p className="text-slate-500 font-bold mb-12 text-lg max-w-sm">ใช้ปุ่มลูกศรหรือ WASD เพื่อหาทางออกให้เร็วที่สุด!</p>
                            <button
                                onClick={initGame}
                                className="px-16 py-5 bg-indigo-600 text-white rounded-[24px] font-black text-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
                            >
                                เริ่มเดินทาง 🚀
                            </button>
                        </div>
                    )}

                    {phase === 'play' && (
                        <div className="flex flex-col items-center">
                            <div
                                className="bg-slate-800 p-3 rounded-[32px] shadow-2xl border-8 border-slate-700 overflow-hidden"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                                    gap: '2px',
                                    width: 'fit-content'
                                }}
                            >
                                {maze.map((row, r) => row.map((cell, c) => (
                                    <div
                                        key={`${r}-${c}`}
                                        className={`w-6 h-6 md:w-8 md:h-8 rounded-[4px] flex items-center justify-center text-lg ${cell === 1 ? 'bg-slate-700/80 shadow-inner' : 'bg-slate-900/30'
                                            }`}
                                    >
                                        {playerPos.r === r && playerPos.c === c && (
                                            <span className="animate-pulse">🧍</span>
                                        )}
                                        {cell === 2 && (
                                            <span className="drop-shadow-xl animate-bounce">🚪</span>
                                        )}
                                    </div>
                                )))}
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-6 md:hidden">
                                <div /><button onClick={() => movePlayer(-1, 0)} className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">🔼</button><div />
                                <button onClick={() => movePlayer(0, -1)} className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">◀️</button>
                                <button onClick={() => movePlayer(1, 0)} className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">🔽</button>
                                <button onClick={() => movePlayer(0, 1)} className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-2xl border-b-4 border-slate-200 active:scale-95 transition-transform">▶️</button>
                            </div>
                        </div>
                    )}

                    {phase === 'done' && (
                        <div className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl border border-slate-100 text-center animate-in zoom-in">
                            <div className="text-8xl mb-8">🎯</div>
                            <h3 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">ทางออกพบแล้ว!</h3>
                            <p className="text-slate-400 font-bold mb-8 uppercase tracking-widest text-xs">คุณจัดการเวลาและเส้นทางได้ดีเยี่ยม</p>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Time</span>
                                    <div className="text-3xl font-black text-indigo-600 tabular-nums">
                                        {((endTime - startTime) / 1000).toFixed(1)}s
                                    </div>
                                </div>
                                <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100">
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Moves</span>
                                    <div className="text-3xl font-black text-indigo-600 tabular-nums">{moves}</div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {mode === 'village' ? (
                                    <>
                                        {subId < 12 ? (
                                            <button
                                                onClick={() => router.push(`/world/${villageIdParam}/sublevel/${subId + 1}`)}
                                                className="w-full py-5 bg-green-500 hover:bg-green-600 text-white rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-95"
                                            >
                                                ด่านต่อไป 🚀
                                            </button>
                                        ) : parseInt(villageIdParam) < 10 ? (
                                            <button
                                                onClick={() => router.push(`/world/${parseInt(villageIdParam) + 1}`)}
                                                className="w-full py-5 bg-orange-500 hover:bg-orange-600 text-white rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-95"
                                            >
                                                หมู่บ้านต่อไป 🏘️
                                            </button>
                                        ) : null}
                                        <button
                                            onClick={() => router.push(`/world/${villageIdParam}`)}
                                            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-[24px] font-black text-lg transition-all"
                                        >
                                            กลับสู่แผนที่ 🗺️
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => router.push('/world')}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-xl shadow-xl transition-all active:scale-95"
                                    >
                                        ตกลง ✨
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style jsx global>{`
        @keyframes jiggle { 0%, 100% { transform: rotate(-3deg); } 50% { transform: rotate(3deg); } }
        .animate-jiggle { animation: jiggle 2s ease-in-out infinite; }
      `}</style>
        </div>
    )
}

export default function MazePage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white font-black text-2xl">กำลังสร้างเขาวงกต...</div>}>
            <MazeGameInner />
        </Suspense>
    )
}
