'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { loadProgress, saveProgress, addKeys, MAX_KEYS } from '@/lib/levelSystem'

export default function CheatOverlay() {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [targetGame, setTargetGame] = useState<'management' | 'calculation' | 'spatial' | 'reaction'>('management')

    useEffect(() => {
        if (pathname.includes('/minigame/calculation')) setTargetGame('calculation')
        else if (pathname.includes('/minigame/spatial')) setTargetGame('spatial')
        else if (pathname.includes('/minigame/reaction')) setTargetGame('reaction')
        else setTargetGame('management')
    }, [pathname])

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.shiftKey && e.altKey && e.key.toLowerCase() === 'c') {
                setIsOpen(prev => !prev)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    const unlockAll = () => {
        const p = loadProgress()
        p.unlockedVillages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        for (let i = 1; i <= 10; i++) {
            p.villages[String(i)] = { playsCompleted: 12, expTubeFilled: true }
        }
        saveProgress(p)
        alert('เดอะแฟลช! ปลดล็อกและเคลียร์ทุกด่านให้แล้วครับ ⚡')
        window.location.reload()
    }

    const fillKeys = () => {
        const p = loadProgress()
        p.keys.currentKeys = MAX_KEYS
        p.keys.lastRegenAt = Date.now()
        saveProgress(p)
        alert('เติมกุญแจให้เต็มแม็กซ์! 🔑')
        window.location.reload()
    }

    const goToLevel = (level: number, mode: 'practice' | 'village' = 'practice') => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('level', level.toString())
        params.set('mode', mode)

        if (mode === 'village') {
            params.set('villageId', level.toString())
            params.set('subId', '1')
        }

        router.push(`/minigame/${targetGame}?${params.toString()}`)
        setIsOpen(false)
    }

    const completeGame = () => {
        window.dispatchEvent(new CustomEvent('gymemo:cheat_complete'))
        setIsOpen(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6 animate-in fade-in">
            <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-md w-full border-4 border-indigo-500 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-slate-600 font-bold">ESC</button>
                </div>

                <h2 className="text-3xl font-black text-slate-800 mb-6 flex items-center gap-3">
                    <span className="text-4xl text-indigo-500">🛠️</span> Debug Cheat
                </h2>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <button onClick={unlockAll} className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl font-bold transition-all border border-indigo-100 flex flex-col items-center gap-2">
                        <span className="text-2xl">🔓</span>
                        <span>ปลดล็อกด่าน</span>
                    </button>
                    <button onClick={fillKeys} className="p-4 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-2xl font-bold transition-all border border-yellow-100 flex flex-col items-center gap-2">
                        <span className="text-2xl">🔑</span>
                        <span>เติมกุญแจ</span>
                    </button>
                    <button onClick={completeGame} className="p-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-2xl font-bold transition-all border border-green-100 flex flex-col items-center gap-2">
                        <span className="text-2xl">🏁</span>
                        <span>ชนะทันที</span>
                    </button>
                    <button onClick={() => { localStorage.clear(); window.location.href = '/' }} className="p-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold transition-all border border-red-100 flex flex-col items-center gap-2">
                        <span className="text-2xl">🗑️</span>
                        <span>ล้างความจำ</span>
                    </button>
                </div>

                <div className="mb-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Target Minigame</label>
                    <div className="flex gap-2 mb-4">
                        {(['management', 'calculation', 'spatial', 'reaction'] as const).map(gm => (
                            <button
                                key={gm}
                                onClick={() => setTargetGame(gm)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${targetGame === gm ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {gm}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jump to Main (Sublevel 1)</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lv => (
                                    <button key={lv} onClick={() => goToLevel(lv, 'village')} className="w-10 h-10 flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-black text-xs transition-all border border-indigo-100">
                                        V{lv}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Jump to Difficulty (Practice)</label>
                            <div className="grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(lv => (
                                    <button key={lv} onClick={() => goToLevel(lv, 'practice')} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-black text-xs transition-all border border-slate-200">
                                        Lv{lv}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <button onClick={() => { router.push('/world'); setIsOpen(false); }} className="w-full py-4 text-slate-500 font-bold hover:text-indigo-600 transition-colors">Go to World Map 🗺️</button>
                    <button onClick={() => { router.push('/daily-challenge'); setIsOpen(false); }} className="w-full py-4 text-slate-500 font-bold hover:text-indigo-600 transition-colors">Go to Daily 🌟</button>
                </div>

                <p className="text-[10px] text-center text-slate-300 mt-6 font-bold uppercase tracking-widest">Gymemo Test Mode Only</p>
            </div>
        </div>
    )
}
