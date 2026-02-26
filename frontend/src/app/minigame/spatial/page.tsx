'use client'

import Image from 'next/image'
import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { recordPlay, markDailyMode } from '@/lib/levelSystem'
import ClockIntro from '@/components/ClockIntro'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')

  const [phase, setPhase] = useState<'intro' | 'clock' | 'play'>('intro')
  const [clockTarget] = useState(() => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  }))

  const levelTexts = [
    'จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 1',
    'จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 2',
    'การมองภาพตามหัวลูกศร (2 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (2 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (2 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (3 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (3 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (3 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (4 ตัวเลือก)',
    'การมองภาพตามหัวลูกศร (4 ตัวเลือก)'
  ]
  const diffDesc = levelTexts[Math.min(Math.max(levelParam - 1, 0), 9)]

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', message: string } | null>(null)
  const [questionText, setQuestionText] = useState<string>('')
  const [isGameOver, setIsGameOver] = useState(false)

  const isComplete = isGameOver

  const [questionData, setQuestionData] = useState<{
    targetView?: string[] | string;
    options: (string[] | string)[];
    correctIndex: number;
    arrow?: 'N' | 'S' | 'E' | 'W';
    displayGrid?: string[][];
  } | null>(null)

  useEffect(() => {
    let mode: 'match' | 'select' | 'find' = 'match'
    setFeedback(null)
    setIsGameOver(false)

    if (levelParam <= 2) {
      // Level 1-2: Matching Shapes/Emojis
      const emojis = ['🍄', '🌻', '🌵', '🎄', '🎁', '🎈', '🎨', '🎠']
      const target = emojis[Math.floor(Math.random() * emojis.length)]
      const others = emojis.filter(e => e !== target).sort(() => Math.random() - 0.5).slice(0, 3)
      const options = [target, ...others].sort(() => Math.random() - 0.5)

      setQuestionData({
        targetView: target,
        options: options,
        correctIndex: options.indexOf(target)
      })
      setQuestionText('เลือกรูปที่เหมือนกับภาพตัวอย่างด้านบน 🎯')
    } else {
      // Level 3-10: View from Arrow (3D Box image placeholder)
      const gridSize = levelParam > 7 ? 3 : 2
      const blockEmojis = ['📦', '🟫', '🟧', '🟦', '🟩', '🟥']
      const grid: string[][] = []
      for (let r = 0; r < gridSize; r++) {
        grid[r] = []
        for (let c = 0; c < gridSize; c++) {
          grid[r][c] = blockEmojis[Math.floor(Math.random() * blockEmojis.length)]
        }
      }

      const directions: ('N' | 'S' | 'E' | 'W')[] = ['N', 'S', 'E', 'W']
      const arrow = directions[Math.floor(Math.random() * directions.length)]

      let correctView: string[] = []
      if (arrow === 'N') correctView = grid[0]
      else if (arrow === 'S') correctView = grid[gridSize - 1]
      else if (arrow === 'W') correctView = grid.map(row => row[0])
      else if (arrow === 'E') correctView = grid.map(row => row[gridSize - 1])

      // Determine number of choices based on level
      let numOptions = 4;
      if (levelParam >= 3 && levelParam <= 5) numOptions = 2;
      else if (levelParam >= 6 && levelParam <= 8) numOptions = 3;
      else if (levelParam >= 9 && levelParam <= 10) numOptions = 4;

      // Generate wrong options
      const options = [correctView]
      let maxAttempts = 100
      while (options.length < numOptions && maxAttempts > 0) {
        let wrongView = [];
        if (Math.random() > 0.5) {
          // Shuffle correct view
          wrongView = [...correctView].sort(() => Math.random() - 0.5)
        } else {
          // Generate completely random blocks
          for (let i = 0; i < gridSize; i++) {
            wrongView.push(blockEmojis[Math.floor(Math.random() * blockEmojis.length)])
          }
        }

        if (!options.some(opt => JSON.stringify(opt) === JSON.stringify(wrongView))) {
          options.push(wrongView)
        }
        maxAttempts--;
      }

      const shuffledOptions = [...options].sort(() => Math.random() - 0.5)

      setQuestionData({
        displayGrid: grid,
        arrow,
        options: shuffledOptions,
        correctIndex: shuffledOptions.findIndex(opt => JSON.stringify(opt) === JSON.stringify(correctView))
      })
      setQuestionText('มองจากทิศทางของลูกศร คุณจะเห็นภาพใด? 👁️')
    }
  }, [levelParam, subId])

  useEffect(() => {
    if (isComplete) {
      if (mode === 'village') {
        recordPlay(villageId, 100)
      } else if (mode === 'daily') {
        const dateKey = new Date().toISOString().split('T')[0]
        localStorage.setItem(`gymemo_spatial_daily_${dateKey}`, JSON.stringify({ score: 100 }))
        markDailyMode(dateKey, 'spatial')
      }
    }
  }, [isComplete, mode, villageId])

  // ── Cheat Mode ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleCheat = () => {
      setIsGameOver(true)
    }
    window.addEventListener('gymemo:cheat_complete', handleCheat)
    return () => window.removeEventListener('gymemo:cheat_complete', handleCheat)
  }, [])

  if (phase === 'intro' && levelParam === 1) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in">
          <div className="text-9xl mb-8 animate-bounce">🗺️</div>
          <h2 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter">มิติจำลอง</h2>
          <p className="text-slate-500 font-bold mb-10 text-lg">{diffDesc}</p>
          <button
            onClick={() => setPhase('clock')}
            className="w-full py-5 bg-indigo-600 text-white rounded-[24px] font-black text-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
          >
            เริ่มเลย! 🚀
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'clock') {
    return (
      <ClockIntro
        targetHour={clockTarget.h}
        targetMinute={clockTarget.m}
        onComplete={() => setPhase('play')}
      />
    )
  }

  return (
    <div className='min-h-[calc(100vh-140px)] py-6 flex flex-col items-center relative overflow-hidden'>

      <div className="max-w-4xl w-full px-4 relative z-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h1 className="text-3xl font-black text-slate-800 text-center mb-1">
            {mode === 'daily' ? '🌟 ภารกิจรายวัน: พื้นที่' : `🗺️ Spatial — ด่าน ${subId}`}
          </h1>
          <p className="text-center text-slate-500 font-bold uppercase tracking-wider text-sm">
            {diffDesc}
          </p>
        </div>

        {isComplete ? (
          <div className="bg-white/95 backdrop-blur-md border-2 border-white/20 p-12 rounded-[3.5rem] shadow-2xl text-center max-w-xl mx-auto animate-in zoom-in duration-500">
            <div className="text-8xl mb-6">🎯</div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">ประเมินผล: <span className="text-blue-600 underline">ดี</span></h2>
            <p className="text-slate-500 mb-10 text-lg">คุณผ่านความท้าทายนี้ได้อย่างยอดเยี่ยม!</p>
            <div className="grid grid-cols-1 gap-4">
              {mode === 'daily' ? (
                <button
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-lg transition-all active:scale-95"
                  onClick={() => router.push('/daily-challenge')}
                >
                  ดูผลภารกิจรายวัน ✨
                </button>
              ) : (
                <>
                  {subId < 12 ? (
                    <button className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xl shadow-md transition-all active:scale-95" onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}>
                      ด่านต่อไป 🚀
                    </button>
                  ) : villageId < 10 ? (
                    <button className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xl shadow-md transition-all active:scale-95" onClick={() => router.push(`/world/${villageId + 1}`)}>
                      หมู่บ้านถัดไป 🏘️
                    </button>
                  ) : null}
                  <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-lg transition-all" onClick={() => router.push(`/world/${villageId}`)}>
                    กลับสู่แผนที่ 🗺️
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="mb-8 min-h-[50px] text-center w-full">
              {feedback && (
                <div className={`inline-block px-10 py-3 rounded-full font-black text-xl shadow-lg border-4 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-300' : 'bg-red-500 text-white border-red-300 animate-shake'}`}>
                  {feedback.message}
                </div>
              )}
              {!feedback && questionText && (
                <div className="inline-block px-10 py-3 rounded-full font-bold text-slate-600 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm">
                  💡 {questionText}
                </div>
              )}
            </div>

            {questionData && (
              <div className="w-full flex flex-col items-center">
                {/* 1. Target Area (Grid or Single Emoji) */}
                <div className="mb-12 relative p-8 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-white/50 shadow-xl">
                  {levelParam <= 2 ? (
                    <div className="text-9xl drop-shadow-2xl animate-bounce">{questionData.targetView}</div>
                  ) : (
                    <div className="relative flex flex-col items-center">
                      <div className="absolute -top-6 left-0 right-0 text-center">
                        <span className="bg-yellow-300 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                          Image URL Placeholder (3D Box)
                        </span>
                      </div>
                      {/* Grid Display */}
                      <div className={`grid gap-2 p-4 bg-slate-800 rounded-3xl shadow-2xl border-8 border-slate-700 mt-4`}
                        style={{ gridTemplateColumns: `repeat(${questionData.displayGrid?.length || 2}, minmax(0, 1fr))` }}>
                        {questionData.displayGrid?.map((row, ri) =>
                          row.map((cell, ci) => (
                            <div key={`${ri}-${ci}`} className="w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-2xl flex items-center justify-center text-4xl md:text-6xl shadow-inner">
                              {cell}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Arrow Indicators */}
                      {questionData.arrow === 'N' && <div className="absolute top-[-3rem] left-1/2 -translate-x-1/2 text-6xl animate-bounce drop-shadow-lg">⬇️</div>}
                      {questionData.arrow === 'S' && <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-6xl animate-bounce drop-shadow-lg">⬆️</div>}
                      {questionData.arrow === 'W' && <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-6xl animate-bounce drop-shadow-lg">➡️</div>}
                      {questionData.arrow === 'E' && <div className="absolute -right-16 top-1/2 -translate-y-1/2 text-6xl animate-bounce drop-shadow-lg">⬅️</div>}
                    </div>
                  )}
                </div>

                {/* 2. Options Area */}
                <div className={`grid gap-6 w-full max-w-2xl px-4 pb-20 ${questionData.options.length === 2 ? 'grid-cols-2' :
                  questionData.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
                    'grid-cols-2'
                  }`}>
                  {questionData.options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (idx === questionData.correctIndex) {
                          setFeedback({ type: 'correct', message: '✨ ถูกต้องแล้ว! เก่งมาก' })
                          setTimeout(() => setIsGameOver(true), 1200)
                        } else {
                          setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองดูอีกที' })
                          setTimeout(() => setFeedback(null), 1000)
                        }
                      }}
                      className="group relative p-6 bg-white hover:bg-blue-50 border-b-8 border-slate-200 hover:border-blue-200 rounded-[2rem] shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center min-h-[140px]"
                    >
                      <div className="flex gap-2">
                        {Array.isArray(opt) ? opt.map((emoji, i) => (
                          <span key={i} className="text-4xl md:text-6xl drop-shadow-md group-hover:scale-110 transition-transform">{emoji}</span>
                        )) : (
                          <span className="text-6xl md:text-8xl drop-shadow-md group-hover:scale-110 transition-transform">{opt}</span>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-100 rounded-full border-2 border-white text-slate-400 font-black flex items-center justify-center text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
