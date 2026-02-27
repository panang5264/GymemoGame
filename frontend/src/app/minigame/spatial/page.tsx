'use client'

import Image from 'next/image'
import { useState, useEffect, use, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'
import ClockIntro from '@/components/ClockIntro'
import { getDateKey } from '@/lib/dailyChallenge'

function SpatialGameInner() {
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
  const [errorCount, setErrorCount] = useState(0)
  const [startTime] = useState(Date.now())

  const isComplete = isGameOver

  const [questionData, setQuestionData] = useState<{
    targetView?: string[] | string;
    targetImage?: string;
    options: (string[] | string)[];
    correctIndex: number;
    arrow?: 'N' | 'S' | 'E' | 'W';
    displayGrid?: string[][];
  } | null>(null)

  const hasSavedRef = useRef(false)

  useEffect(() => {
    hasSavedRef.current = false
    let mode: 'match' | 'select' | 'find' = 'match'
    setFeedback(null)
    setIsGameOver(false)

    if (levelParam <= 2) {
      // Level 1-2: Box folding / Unfolding (Using custom assets)
      // โจทย์ข้อ 1 เป็นกล่องคลี่
      const targetImage = "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 1.png"
      const options = [
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อยข้อ 1.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อยข้อ 2.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อยข้อ 3.jpeg",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อยท์ข้อ 4.png"
      ]

      const shuffledOptions = [...options].sort(() => Math.random() - 0.5)

      setQuestionData({
        targetImage,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(options[0]) // สมมติว่าไฟล์แรกคือข้อที่ถูกที่สุด
      })
      setQuestionText('เลือกรูปกล่องที่ประกอบแล้วตรงกับภาพคลี่ด้านบน 📦')
    } else {
      // Level 3-10: 3D Box views (Using custom assets)
      const targetImages = [
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 2.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ3.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 4.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 5.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 6.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 7.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/โจทย์ข้อ 8.png"
      ]
      const choiceImages = [
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อย 5.jpg",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อย 6.png",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อย 7.PNG",
        "/assets/Assets'Employer/Assess ด้าน/มิติสัมพันธ์/ช้อย 8.jpg"
      ]

      const targetImage = targetImages[Math.floor(Math.random() * targetImages.length)]
      const correctChoice = choiceImages[Math.floor(Math.random() * choiceImages.length)] // สมมติว่าอันที่สุ่มมาคือคำตอบ
      const wrongChoices = choiceImages.filter(img => img !== correctChoice).sort(() => Math.random() - 0.5)

      let numOptions = 4;
      if (levelParam >= 3 && levelParam <= 5) numOptions = 2;
      else if (levelParam >= 6 && levelParam <= 8) numOptions = 3;
      else if (levelParam >= 9 && levelParam <= 10) numOptions = 4;

      const options = [correctChoice, ...wrongChoices.slice(0, numOptions - 1)]
      const shuffledOptions = [...options].sort(() => Math.random() - 0.5)

      setQuestionData({
        targetImage,
        options: shuffledOptions,
        correctIndex: shuffledOptions.indexOf(correctChoice)
      })
      setQuestionText('มองจากทิศทางของลูกศร คุณจะเห็นภาพใด? 👁️')
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
        recordPlay(villageId, 100, 'spatial', subId, accuracy, duration)
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
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-slate-100 text-center animate-in zoom-in">
          <div className="text-9xl mb-8 animate-bounce">🗺️</div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase tracking-tighter">มิติจำลอง</h2>
          <p className="text-slate-500 font-bold mb-12 text-lg">{diffDesc}</p>
          <button
            onClick={() => {
              if (mode === 'village') setPhase('play')
              else setPhase('clock')
            }}
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
    <div className="min-h-[calc(100vh-140px)] py-6 flex flex-col items-center relative overflow-hidden font-['Supermarket']">

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
            <h2 className="text-4xl font-black text-slate-800 mb-4">คะแนนที่ทำได้</h2>
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
                  <button className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-lg transition-all" onClick={() => router.push(`/world/${villageId}?showSummary=1`)}>

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
                {/* 1. Target Area (Image) */}
                <div className="mb-12 relative p-4 md:p-8 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-white/50 shadow-xl flex items-center justify-center min-h-[200px] min-w-[200px] w-full max-w-md">
                  {questionData.targetImage && (
                    <img src={questionData.targetImage} className="w-full h-[300px] object-contain drop-shadow-md" alt="target" />
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
                          setErrorCount(e => e + 1)
                          setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองดูอีกที' })
                          setTimeout(() => setFeedback(null), 1000)
                        }
                      }}
                      className="group relative p-6 bg-white hover:bg-blue-50 border-b-8 border-slate-200 hover:border-blue-200 rounded-[2rem] shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center min-h-[140px]"
                    >
                      <div className="flex gap-2 w-full h-full items-center justify-center">
                        {typeof opt === 'string' && opt.startsWith('/') ? (
                          <img src={opt as string} className="max-w-[120px] max-h-[120px] object-contain drop-shadow-sm group-hover:scale-110 transition-transform" alt={`option ${idx}`} />
                        ) : Array.isArray(opt) ? opt.map((emoji, i) => (
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

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f3f4f6]" />}>
      <SpatialGameInner />
    </Suspense>
  )
}
