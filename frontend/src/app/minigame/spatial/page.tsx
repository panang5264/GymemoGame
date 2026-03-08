'use client'

import Image from 'next/image'
import { useState, useEffect, use, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'
import ClockIntro from '@/components/ClockIntro'
import { getDateKey } from '@/lib/dailyChallenge'
import PairMatchingGame from './PairMatchingGame'

function SpatialGameInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')
  const isBonus = searchParams.get('isBonus') === '1'

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
  const [errorCount, setErrorCount] = useState(0)
  const [startTime] = useState(Date.now())

  const isComplete = isGameOver

  const [questionData, setQuestionData] = useState<{
    targetView?: string[] | string;
    targetImage?: string;
    options?: (string[] | string)[];
    correctIndex?: number;
    arrow?: 'N' | 'S' | 'E' | 'W';
    displayGrid?: string[][];
    isPairMatching?: boolean;
    pairs?: { target: string, correct: string }[];
    basePath?: string;
  } | null>(null)

  const hasSavedRef = useRef(false)

  useEffect(() => {
    hasSavedRef.current = false
    let mode: 'match' | 'select' | 'find' = 'match'
    setFeedback(null)
    setIsGameOver(false)

    const CHOICES_BASE = "/assets_employer/assess/spatial/choices_cropped"
    const TARGETS_BASE = "/assets_employer/assess/spatial"

    if (levelParam <= 2) {
      // Village 1-2: Interactive Image Matching Pair game
      const isLevel1 = levelParam === 1
      const basePath = `/assets/level1andlevel2/relation1-${isLevel1 ? '1' : '2'}`

      const pairs = isLevel1 ? [
        { target: 'left1.PNG', correct: 'right4.PNG' },
        { target: 'left2.PNG', correct: 'right3.PNG' },
        { target: 'left3.PNG', correct: 'right1.PNG' },
        { target: 'left4.PNG', correct: 'right5.PNG' },
        { target: 'left5.PNG', correct: 'right2.PNG' }
      ] : [
        { target: 'left1.PNG', correct: 'right3.PNG' },
        { target: 'left2.PNG', correct: 'right5.PNG' },
        { target: 'left3.PNG', correct: 'right4.PNG' },
        { target: 'left4.PNG', correct: 'right2.PNG' },
        { target: 'left5.PNG', correct: 'right1.PNG' }
      ]

      setQuestionData({
        isPairMatching: true,
        pairs: pairs,
        basePath: basePath
      })
      setQuestionText('โยงเส้นจับคู่ภาพที่สัมพันธ์กันให้ถูกต้อง 🎯')
    } else if (levelParam <= 4) {
      // Village 3-4: Box unfolding Level 1 (easy Q1-Q4, 2 choices)
      const EASY_BANK = [
        {
          target: `${TARGETS_BASE}/q1.png`,
          correct: `${CHOICES_BASE}/q1_correct.png`,
          wrongs: [`${CHOICES_BASE}/q1_wrong1.png`],
          direction: 'มองจากบนลงล่าง ⬇️'
        },
        {
          target: `${TARGETS_BASE}/q2.png`,
          correct: `${CHOICES_BASE}/q2_correct.png`,
          wrongs: [`${CHOICES_BASE}/q2_wrong1.png`],
          direction: 'มองจากล่างขึ้นบน ⬆️'
        },
        {
          target: `${TARGETS_BASE}/q3.png`,
          correct: `${CHOICES_BASE}/q3_correct.png`,
          wrongs: [`${CHOICES_BASE}/q3_wrong1.png`],
          direction: 'มองจากด้านข้างซ้าย ➡️'
        },
        {
          target: `${TARGETS_BASE}/q4.png`,
          correct: `${CHOICES_BASE}/q4_correct.png`,
          wrongs: [`${CHOICES_BASE}/q4_wrong1.png`, `${CHOICES_BASE}/q4_wrong2.png`],
          direction: 'มองจากบนลงล่าง ⬇️'
        },
      ]
      const q = EASY_BANK[Math.floor(Math.random() * EASY_BANK.length)]
      const options = [q.correct, q.wrongs[0]].sort(() => Math.random() - 0.5)

      setQuestionData({
        targetImage: q.target,
        options,
        correctIndex: options.indexOf(q.correct)
      })
      setQuestionText(`ถ้า${q.direction} คุณจะเห็นรูปไหน? 📦`)

    } else {
      // Village 5+: Box unfolding Level 2 (harder Q5-Q8, 3-4 choices)
      const HARD_BANK = [
        {
          target: `${TARGETS_BASE}/q5.png`,
          correct: `${CHOICES_BASE}/q5_correct.png`,
          wrongs: [`${CHOICES_BASE}/q5_wrong1.png`, `${CHOICES_BASE}/q5_wrong2.png`],
          direction: 'มองจากบนลงล่าง ⬇️'
        },
        {
          target: `${TARGETS_BASE}/q6.png`,
          correct: `${CHOICES_BASE}/q6_correct.png`,
          wrongs: [`${CHOICES_BASE}/q6_wrong1.png`, `${CHOICES_BASE}/q6_wrong2.png`],
          direction: 'มองจากล่างขึ้นบน ⬆️'
        },
        {
          target: `${TARGETS_BASE}/q7.png`,
          correct: `${CHOICES_BASE}/q7_correct.png`,
          wrongs: [`${CHOICES_BASE}/q7_wrong1.png`, `${CHOICES_BASE}/q7_wrong2.png`, `${CHOICES_BASE}/q7_wrong3.png`],
          direction: 'มองจากด้านข้าง ↔️'
        },
        {
          target: `${TARGETS_BASE}/q8.png`,
          correct: `${CHOICES_BASE}/q8_correct.png`,
          wrongs: [`${CHOICES_BASE}/q8_wrong1.png`, `${CHOICES_BASE}/q8_wrong2.png`, `${CHOICES_BASE}/q8_wrong3.png`],
          direction: 'มองจากบนลงล่าง ⬇️'
        },
      ]

      const numOptions = levelParam <= 7 ? 3 : 4
      const eligible = HARD_BANK.filter(q => q.wrongs.length >= numOptions - 1)
      const q = eligible[Math.floor(Math.random() * eligible.length)]
      const wrongPool = [...q.wrongs].sort(() => Math.random() - 0.5).slice(0, numOptions - 1)
      const options = [q.correct, ...wrongPool].sort(() => Math.random() - 0.5)

      setQuestionData({
        targetImage: q.target,
        options,
        correctIndex: options.indexOf(q.correct)
      })
      setQuestionText(`ถ้า${q.direction} คุณจะเห็นรูปไหน? 📦`)
    }

  }, [levelParam, subId])

  const { progress, saveProgress } = useProgress()
  const { recordPlay } = useLevelSystem()

  useEffect(() => {
    let active = true
    if (isComplete && !hasSavedRef.current) {
      hasSavedRef.current = true
      if (mode === 'village') {
        const accuracy = errorCount === 0 ? 100 : Math.max(0, 100 - (errorCount * 25))
        const duration = (Date.now() - startTime) / 1000
        const finalScore = 100 * (isBonus ? 2 : 1)
        recordPlay(villageId, finalScore, 'spatial', subId, accuracy, duration)
      } else if (mode === 'daily') {
        const dateKey = getDateKey()

        if (progress && active) {
          import('@/lib/levelSystem').then(({ saveDailyScore: rawSaveDailyScore, markDailyMode: rawMarkDailyMode }) => {
            let nextP = { ...progress }
            nextP = rawSaveDailyScore(nextP, dateKey, 'spatial', 100)
            nextP = rawMarkDailyMode(nextP, dateKey, 'spatial')
            saveProgress(nextP)
          })
        }

        if (progress?.guestId && active) {
          const accuracy = errorCount === 0 ? 100 : Math.max(0, 100 - (errorCount * 25))
          const duration = (Date.now() - startTime) / 1000
          const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
          fetch(`${API_BASE_URL}/api/analysis/record`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              guestId: progress.guestId,
              gameType: 'spatial',
              level: 0,
              subLevelId: 0,
              score: 100,
              accuracy,
              timeTaken: duration
            })
          }).catch(err => console.error('Failed to log daily analytics:', err))
        }
      }
    }
    return () => { active = false }
  }, [isComplete, mode, villageId, subId, errorCount, startTime, progress, saveProgress])

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
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-4 font-['Supermarket']">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl border border-white/20 text-center animate-in zoom-in duration-500">
          <div className="text-7xl md:text-8xl mb-6 md:mb-8 animate-bounce drop-shadow-xl">🗺️</div>
          {mode === 'daily' ? (
            <>
              <h2 className="text-2xl md:text-3xl font-black text-orange-500 mb-2 md:mb-4 uppercase tracking-tighter">🌟 ภารกิจรายวัน</h2>
              <p className="text-slate-600 font-bold mb-6 md:mb-8 text-sm md:text-base px-2 bg-orange-50 py-2 border-2 border-orange-200 rounded-full">ด่านที่ 3/3: โหมดแผนที่และมิติ</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 md:mb-4 uppercase tracking-tighter">มิติจำลอง</h2>
              <p className="text-slate-500 font-bold mb-6 md:mb-8 text-sm md:text-base px-2">{diffDesc}</p>
            </>
          )}
          <button
            onClick={() => {
              if (mode === 'village') setPhase('play')
              else setPhase('clock')
            }}
            className={`w-full py-4 text-white rounded-[20px] font-black text-xl shadow-xl hover:scale-105 transition-all active:scale-95 ${mode === 'daily' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {mode === 'daily' ? 'เริ่มภารกิจ! 🚀' : 'เริ่มเลย! 🚀'}
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
    <div className="min-h-[calc(100vh-140px)] py-6 flex flex-col items-center relative overflow-hidden font-['Supermarket']">

      <div className="max-w-4xl w-full px-4 relative z-10">
        <div className="bg-white p-3 md:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-black text-slate-800 text-center mb-1 relative inline-block w-full">
            {mode === 'daily' ? '🌟 ภารกิจรายวัน: พื้นที่' : `🗺️ Spatial — ด่าน ${subId}`}
            {isBonus && (
              <span className="absolute -top-3 right-0 bg-yellow-400 text-yellow-900 text-[10px] md:text-xs font-black px-2 py-0.5 rounded-full border border-yellow-500 shadow-sm animate-pulse">
                x2 BONUS
              </span>
            )}
          </h1>
          <p className="text-center text-slate-500 font-bold uppercase tracking-wider text-xs md:text-sm">
            {diffDesc}
          </p>
        </div>

        {isComplete ? (
          <div className="bg-white/95 backdrop-blur-md border-2 border-white/20 p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl text-center max-w-xl mx-auto animate-in zoom-in duration-500">
            <div className="text-5xl md:text-7xl mb-4 md:mb-6">🎯</div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-3 md:mb-4">คะแนนที่ทำได้</h2>
            <p className="text-slate-500 mb-6 md:mb-8 text-xs md:text-base">คุณผ่านความท้าทายนี้ได้อย่างยอดเยี่ยม!</p>
            <div className="grid grid-cols-1 gap-3 md:gap-4">
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
                    <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-lg shadow-md transition-all active:scale-95" onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}>
                      ด่านต่อไป 🚀
                    </button>
                  ) : villageId < 10 ? (
                    <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg shadow-md transition-all active:scale-95" onClick={() => router.push(`/world/${villageId + 1}`)}>
                      หมู่บ้านถัดไป 🏘️
                    </button>
                  ) : null}
                  <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-lg transition-all" onClick={() => router.push(`/world/${villageId}?showSummary=1`)}>

                    กลับสู่แผนที่ 🗺️
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center h-full">
            <div className="mb-6 md:mb-8 min-h-[40px] md:min-h-[50px] text-center w-full mt-2 md:mt-4">
              {feedback && (
                <div className={`inline-block px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 rounded-full font-black text-xs sm:text-sm md:text-lg shadow-lg border-2 md:border-4 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-300' : 'bg-red-500 text-white border-red-300 animate-shake'}`}>
                  {feedback.message}
                </div>
              )}
              {!feedback && questionText && (
                <div className="inline-block px-4 sm:px-6 md:px-10 py-2 sm:py-3 rounded-full font-bold text-slate-600 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm text-sm sm:text-base">
                  💡 {questionText}
                </div>
              )}
            </div>

            {questionData && questionData.isPairMatching ? (
              <PairMatchingGame
                pairs={questionData.pairs || []}
                basePath={questionData.basePath || ''}
                onComplete={() => {
                  setFeedback({ type: 'correct', message: '✨ ถูกต้องทั้งหมด! เก่งมาก' })
                  setTimeout(() => setIsGameOver(true), 1500)
                }}
                onError={() => setErrorCount(e => e + 1)}
              />
            ) : questionData && questionData.options ? (
              <div className="w-full flex flex-col items-center">
                {/* 1. Target Area (Image or Emoji) */}
                <div className="mb-6 md:mb-8 relative p-4 md:p-6 bg-white/40 backdrop-blur-md rounded-2xl md:rounded-[2rem] border-2 md:border-4 border-white/50 shadow-xl flex items-center justify-center min-h-[140px] md:min-h-[200px] w-full max-w-[240px] sm:max-w-[280px] md:max-w-sm">
                  {questionData.targetView ? (
                    <div className="text-5xl sm:text-6xl md:text-8xl drop-shadow-2xl animate-bounce">{questionData.targetView}</div>
                  ) : questionData.targetImage ? (
                    <img src={questionData.targetImage} className="w-full h-[120px] sm:h-[160px] md:h-[220px] object-contain drop-shadow-md" alt="target" />
                  ) : null}
                </div>

                {/* 2. Options Area */}
                <div className={`grid gap-3 sm:gap-4 md:gap-6 w-full max-w-2xl px-2 sm:px-4 pb-20 ${questionData.options.length === 2 ? 'grid-cols-2' :
                  questionData.options.length === 3 ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2'
                  }`}>
                  {questionData.options.map((opt: (string[] | string), idx: number) => (
                    <button
                      key={idx}
                      onClick={() => {
                        if (idx === questionData.correctIndex) {
                          setFeedback({ type: 'correct', message: '✨ ถูกต้องแล้ว! เก่งมาก' })
                          setTimeout(() => setIsGameOver(true), 1200)
                        } else {
                          setErrorCount(e => e + 1)
                          setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองดูอีกที' })
                          setTimeout(() => setFeedback(null), 1000)
                        }
                      }}
                      className="group relative p-2 sm:p-3 md:p-6 bg-white hover:bg-blue-50 border-b-4 md:border-b-8 border-slate-200 hover:border-blue-200 rounded-xl md:rounded-[2rem] shadow-md md:shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center min-h-[100px] sm:min-h-[120px] md:min-h-[160px]"
                    >
                      <div className="flex gap-1 sm:gap-2 w-full h-full items-center justify-center">
                        {typeof opt === 'string' && opt.startsWith('/') ? (
                          <img src={opt as string} className="max-w-[60px] max-h-[60px] sm:max-w-[80px] sm:max-h-[80px] md:max-w-[120px] md:max-h-[120px] object-contain drop-shadow-sm group-hover:scale-105 transition-transform" alt={`option ${idx}`} />
                        ) : Array.isArray(opt) ? opt.map((emoji, i) => (
                          <span key={i} className="text-xl sm:text-2xl md:text-4xl drop-shadow-md group-hover:scale-110 transition-transform">{emoji}</span>
                        )) : (
                          <span className="text-3xl sm:text-4xl md:text-6xl drop-shadow-md group-hover:scale-110 transition-transform">{opt as string}</span>
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-slate-100 rounded-full border-2 border-white text-slate-400 font-black flex items-center justify-center text-xs group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        {String.fromCharCode(65 + idx)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6]" />}>
      <SpatialGameInner />
    </Suspense>
  )
}
