'use client'

import { useState, useEffect, useCallback, Suspense, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'
import ClockIntro from '@/components/ClockIntro'
import { getDateKey } from '@/lib/dailyChallenge'
import PairMatchingGame from './PairMatchingGame'
import MemoryRecallChallenge from '@/components/MemoryRecallChallenge'

// ── DIP image style: brightness/contrast/sharpness filter ──────────────────
const DIP_STYLE: React.CSSProperties = {
  filter: 'contrast(1.1) brightness(1.05) saturate(1.1)',
  imageRendering: 'crisp-edges' as any,
}

// ── Algorithm การสุ่ม Asset Version ไม่ซ้ำ (Shuffle Bag) ───────────────────
function getUniqueRandomVersion(gameKey: string, versions: string[]) {
  if (typeof window === 'undefined') return versions[0]
  const storageKey = `gymemo_history_${gameKey}`
  let playedList = JSON.parse(sessionStorage.getItem(storageKey) || '[]')

  if (playedList.length >= versions.length) playedList = []

  const available = versions.filter(v => !playedList.includes(v))
  const selected = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : versions[0]

  playedList.push(selected)
  sessionStorage.setItem(storageKey, JSON.stringify(playedList))
  return selected
}

// ── Box Asset Database (from /public/Asset ด้าน/มิติสัมพันธ์/Box) ──────────
//  Each entry: { block: path to main image, correct: correct choice, wrongs: wrong choices }

const BASE = '/Asset_New/spatial'

interface BoxQuestion {
  block: string
  correct: string
  wrongs: string[]
  direction: string
}

// ── ข้อมูลกำหนดคำใบ้ทิศทางเอง ( Village 3-10 ) ───────────────────────────────
// สามารถระบุทิศทางแยกตามหมู่บ้านและรอบได้ที่นี่เลยครับ
const CUSTOM_BOX_DIRECTIONS: Record<string, Record<string, string>> = {
  "3": { "1.1": "มองจากบนลงล่าง ⬇️", "1.2": "มองจากด้านข้าง ↔️", "1.3": "มองจากล่างขึ้นบน ⬆️" },
  "4": { "2.1": "มองจากบนลงล่าง ⬇️", "2.2": "มองจากด้านซ้าย ➡️", "2.3": "มองจากล่างขึ้นบน ⬆️" },
  // คุณสามารถเพิ่มหมู่บ้าน 5, 6, 7... และเลขรอบที่คุณต้องการกำหนดเองได้ที่นี่ครับ
}

function pickBoxQuestion(level: number, villageId: number, version: string): { q: BoxQuestion; numOptions: number } {
  const roundNum = version.replace('v', '')
  const storageKey = `spatial_played_box_v${villageId}_r${roundNum}`
  let playedList: number[] = []
  if (typeof window !== 'undefined') {
    playedList = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
  }

  if (playedList.length >= 3) playedList = []
  const available = [1, 2, 3].filter(n => !playedList.includes(n))
  const subId = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : 1

  if (typeof window !== 'undefined') {
    playedList.push(subId)
    sessionStorage.setItem(storageKey, JSON.stringify(playedList))
  }

  const folderName = `${roundNum}.${subId}`
  const path = `${BASE}/village_${villageId}/${roundNum}/${folderName}`
  const numOptions = level <= 5 ? 2 : level <= 7 ? 3 : 4

  const villageKey = villageId.toString()
  const customDir = CUSTOM_BOX_DIRECTIONS[villageKey]?.[folderName]
  const defaultDir = subId === 1 ? 'มองจากด้านบน ⬇️' : subId === 2 ? 'มองจากด้านข้าง ↔️' : subId === 3 ? 'มองจากด้านล่าง ⬆️' : subId === 4 ? 'มองจากด้านซ้าย ➡️' : 'มองจากด้านขวา ⬅️'

  // ระบบรองรับทั้ง ตัวเล็ก/ตัวใหญ่ และชื่อไทย/อังกฤษ ครับ
  const q: BoxQuestion = {
    block: `${path}/Block.png`, // เดี๋ยวในฝั่ง Component จะมี onerror ช่วยเช็ค block.png ให้ครับ
    correct: `${path}/Correct.png`,
    wrongs: [
      `${path}/Wrong.png`, `${path}/Wrong1.png`, `${path}/Wrong2.png`, 
      `${path}/wrong.png`, `${path}/wrong1.png`, `${path}/wrong2.png`,
      `${path}/ผิด.png`, `${path}/ผิด1.png`, `${path}/ผิด2.png`
    ],
    direction: customDir || defaultDir
  }

  return { q, numOptions }
}

// ──────────────────────────────────────────────────────────────────────────────

function SpatialGameInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')
  const isBonus = searchParams.get('isBonus') === '1'

  // ── Asset Version Mockup ──
  // สุ่มว่าจะใช้ Version 1, 2, 3 หรือ 4 (ดึงภาพจาก Asset_New/spatial/...)
  const [assetVersion, setAssetVersion] = useState<string>('v1')

  const [phase, setPhase] = useState<'intro' | 'memorize' | 'clock' | 'recall' | 'play'>('intro')
  const [memoryWords, setMemoryWords] = useState<string[]>([])
  const [clockTarget] = useState(() => ({
    h: Math.floor(Math.random() * 12) + 1,
    m: [0, 15, 30, 45][Math.floor(Math.random() * 4)]
  }))

  const levelTexts = [
    'จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 1',
    'จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 2',
    'มองภาพบล็อก 3D แล้วเลือกมุมมองที่ถูกต้อง (2 ตัวเลือก)',
    'มองภาพบล็อก 3D แล้วเลือกมุมมองที่ถูกต้อง (2 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับยากขึ้น (2 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับกลาง (3 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับกลาง (3 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับยาก (3 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับยากมาก (4 ตัวเลือก)',
    'มองภาพบล็อก 3D ระดับสูงสุด (4 ตัวเลือก)',
  ]
  const diffDesc = levelTexts[Math.min(Math.max(levelParam - 1, 0), 9)]

  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong'; message: string } | null>(null)
  const [questionText, setQuestionText] = useState<string>('')
  const [isGameOver, setIsGameOver] = useState(false)
  const [errorCount, setErrorCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [questionCount, setQuestionCount] = useState(0)
  const MAX_QUESTIONS = levelParam <= 2 ? 1 : 3

  const isComplete = isGameOver

  const [questionData, setQuestionData] = useState<{
    // For pair matching (levels 1-2)
    isPairMatching?: boolean
    pairs?: { target: string; correct: string }[]
    basePath?: string
    // For box selection (levels 3+)
    targetImage?: string
    options?: string[]
    correctIndex?: number
  } | null>(null)

  const hasSavedRef = useRef(false)
  const nextQuestion = useCallback(() => {
    setFeedback(null)
    if (levelParam <= 2) {
      // Village 1-2: Interactive Image Matching Pair game
      const folderName = assetVersion.replace('v', '')
      const basePath = `/Asset_New/spatial/village_${villageId}/${folderName}`

      // สร้างโจทย์ 10 คู่ตรงๆ เลยครับ (1.png ถึง 10.png)
      const rows = 10
      const pairs = Array.from({ length: rows }, (_, i) => ({
        target: `${i + 1}.png`,
        correct: `${i + 1}(M).png`,
      }))

      setQuestionData({ isPairMatching: true, pairs, basePath })
      setQuestionText('จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 🧩')
    } else {
      // Village 3+: Use Box asset images, fixed by version wrapper logic
      const { q, numOptions } = pickBoxQuestion(levelParam, villageId, assetVersion)
      
      // ฟังก์ชันช่วยสุ่มโดยกรองเอาเฉพาะ WRONG ที่มีอยู่จริง (ผ่านการสุ่มลำดับ)
      const options = [q.correct, ...q.wrongs].sort(() => Math.random() - 0.5)
      
      // เราจะส่ง options ทั้งหมดไป แล้วเดี๋ยวฝั่งแสดงผลจะจัดการ onerror เองหากหาภาพไม่เจอ
      // แต่ในที่นี้เราจะพยายามหยิบมาให้ได้จำนวนตาม numOptions
      const finalOptions = options.slice(0, numOptions) 
      const correctIndex = finalOptions.indexOf(q.correct)

      // กรณีที่บังเอิญ Correct ไม่อยู่ในชุดที่ slice มา (น้อยมาก) ให้ยัด Correct กลับเข้าไป
      if (correctIndex === -1) {
        finalOptions[0] = q.correct
      }

      setQuestionData({ targetImage: q.block, options: finalOptions, correctIndex: finalOptions.indexOf(q.correct) })
      setQuestionText(`ถ้า${q.direction} คุณจะเห็นหน้าตาบล็อกเป็นแบบใด? 📦`)
    }
  }, [levelParam, villageId, assetVersion, questionCount])

  useEffect(() => {
    // ── กำหนด Version ตามเลขด่านย่อย (3, 6, 9, 12 = v1, v2, v3, v4) ──
    let versionForThisRound = 'v1'
    if (subId === 3) versionForThisRound = 'v1'
    else if (subId === 6) versionForThisRound = 'v2'
    else if (subId === 9) versionForThisRound = 'v3'
    else if (subId === 12) versionForThisRound = 'v4'
    else {
      // โบนัสหรือกรณีอื่นๆ ค่อยใช้ Shuffle Bag
      const ALL_VERSIONS = ['v1', 'v2', 'v3', 'v4']
      const uniqueKey = `spatial_village_${villageId}`
      versionForThisRound = getUniqueRandomVersion(uniqueKey, ALL_VERSIONS)
    }
    setAssetVersion(versionForThisRound)

    hasSavedRef.current = false
    setIsGameOver(false)
    setQuestionCount(0)
    nextQuestion()
  }, [levelParam, subId, villageId, nextQuestion])

  const { progress, saveProgress } = useProgress()
  const { recordPlay } = useLevelSystem()

  useEffect(() => {
    let active = true
    if (isComplete && !hasSavedRef.current) {
      hasSavedRef.current = true
      if (mode === 'village') {
        const accuracy = errorCount === 0 ? 100 : Math.max(0, 100 - errorCount * 25)
        const duration = (Date.now() - startTime) / 1000

        // Target: Completion = 100% of Village * 100 base score
        const finalScore = (villageId * 100) * (isBonus ? 2 : 1)

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
          const accuracy = errorCount === 0 ? 100 : Math.max(0, 100 - errorCount * 25)
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
              timeTaken: duration,
            }),
          }).catch(err => console.error('Failed to log daily analytics:', err))
        }
      }
    }
    return () => { active = false }
  }, [isComplete, mode, villageId, subId, errorCount, startTime, progress, saveProgress])

  // Cheat Mode
  useEffect(() => {
    const handleCheat = () => setIsGameOver(true)
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
              setPhase('play')
            }}
            className={`w-full py-4 text-white rounded-[20px] font-black text-xl shadow-xl hover:scale-105 transition-all active:scale-95 ${mode === 'daily' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {mode === 'daily' ? 'เริ่มภารกิจ! 🚀' : 'เริ่มเลย! 🚀'}
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-[calc(100vh-140px)] py-4 sm:py-6 flex flex-col items-center relative overflow-hidden font-['Supermarket']">
      <div className="max-w-4xl w-full px-2 sm:px-4 relative z-10">
        {/* Header */}
        <div className="bg-white p-2.5 sm:p-4 rounded-xl md:rounded-2xl shadow-sm border border-slate-200 mb-2 sm:mb-6">
          <h1 className="text-base sm:text-2xl font-black text-slate-800 text-center mb-1 relative inline-block w-full">
            {mode === 'daily' ? '🌟 ภารกิจรายวัน: พื้นที่' : `📦 มิติสัมพันธ์ — ด่าน ${subId}`}
            <span className="ml-2 sm:ml-4 text-[10px] sm:text-base text-indigo-500 bg-indigo-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border border-indigo-100 italic">
              ข้อ {questionCount + 1} / {MAX_QUESTIONS}
            </span>
            {isBonus && (
              <span className="absolute -top-3 right-0 bg-yellow-400 text-yellow-900 text-[8px] md:text-xs font-black px-2 py-0.5 rounded-full border border-yellow-500 shadow-sm animate-pulse">
                x2 BONUS
              </span>
            )}
          </h1>
          <p className="text-center text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-sm">{diffDesc}</p>
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
            {/* Feedback / Question Text */}
            <div className="mb-3 sm:mb-8 min-h-[30px] sm:min-h-[50px] text-center w-full mt-1 sm:mt-4">
              {feedback && (
                <div className={`inline-block px-3 sm:px-8 py-1.5 sm:py-2.5 rounded-full font-black text-[10px] sm:text-lg shadow-lg border-2 md:border-4 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-300' : 'bg-red-500 text-white border-red-300 animate-shake'}`}>
                  {feedback.message}
                </div>
              )}
              {!feedback && questionText && (
                <div className="inline-block px-4 sm:px-10 py-1.5 sm:py-3 rounded-full font-bold text-slate-600 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-sm text-xs sm:text-base">
                  💡 {questionText}
                </div>
              )}
            </div>

            {/* Pair matching (Level 1-2) */}
            {questionData?.isPairMatching && (
              <PairMatchingGame
                pairs={questionData.pairs || []}
                basePath={questionData.basePath || ''}
                onComplete={() => {
                  setFeedback({ type: 'correct', message: '✨ ถูกต้องทั้งหมด! เก่งมาก' })
                  setTimeout(() => {
                    if (questionCount + 1 >= MAX_QUESTIONS) {
                      setIsGameOver(true)
                    } else {
                      setQuestionCount(prev => prev + 1)
                      nextQuestion()
                    }
                  }, 1500)
                }}
                onError={() => setErrorCount(e => e + 1)}
              />
            )}

            {/* Box Image selection (Level 3+) */}
            {questionData && !questionData.isPairMatching && questionData.options && (
              <div className="w-full flex flex-col items-center">
                {/* Main block image */}
                <div className="mb-3 sm:mb-6 relative p-1.5 sm:p-4 bg-white/60 backdrop-blur-md rounded-xl md:rounded-[1.5rem] border-2 md:border-3 border-indigo-200 shadow-xl flex items-center justify-center w-full max-w-[200px] sm:max-w-[350px]">
                  <div className="text-[7px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-1 sm:top-2 left-2 sm:left-3">โจทย์ 📦</div>
                  <img
                    src={questionData.targetImage}
                    style={DIP_STYLE}
                    className="w-full h-[100px] sm:h-[200px] object-contain mt-2 sm:mt-3"
                    alt="target block"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src.includes('Block.png')) {
                        img.src = img.src.replace('Block.png', 'block.png');
                      }
                    }}
                  />
                </div>
                
                {/* Answer choices */}
                <div className={`grid gap-3 sm:gap-4 md:gap-5 w-full max-w-2xl px-2 sm:px-4 pb-8 ${questionData.options.length === 2
                  ? 'grid-cols-2'
                  : questionData.options.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2 md:grid-cols-4'
                  }`}>
                  {questionData.options.map((opt: string, idx: number) => (
                    <button
                      key={`${idx}-${opt}`}
                      onClick={() => {
                        if (idx === questionData.correctIndex) {
                          setFeedback({ type: 'correct', message: '✨ ถูกต้องแล้ว! เก่งมาก' })
                          setTimeout(() => {
                            if (questionCount + 1 >= MAX_QUESTIONS) {
                              setIsGameOver(true)
                            } else {
                              setQuestionCount(prev => prev + 1)
                              nextQuestion()
                            }
                          }, 1200)
                        } else {
                          setErrorCount(e => e + 1)
                          setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองดูอีกที' })
                          setTimeout(() => setFeedback(null), 1000)
                        }
                      }}
                      className="group relative p-1.5 sm:p-4 bg-white hover:bg-indigo-50 border-b-2 sm:border-b-8 border-slate-200 hover:border-indigo-300 rounded-lg sm:rounded-[2rem] shadow-sm sm:shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center min-h-[70px] sm:min-h-[150px]"
                    >
                      <img
                        src={opt}
                        style={DIP_STYLE}
                        className="max-w-[40px] max-h-[40px] sm:max-w-[100px] sm:max-h-[100px] object-contain group-hover:scale-105 transition-transform"
                        alt={`option ${idx}`}
                        onError={(e) => {
                          const img = e.currentTarget;
                          // ลองเปลี่ยนเป็นชื่ออื่นๆ ที่เป็นไปได้
                          if (img.src.includes('Correct.png')) img.src = img.src.replace('Correct.png', 'correct.png');
                          else if (img.src.includes('Wrong')) img.src = img.src.toLowerCase();
                          else if (img.src.includes('ถูก.png')) img.src = img.src.replace('ถูก.png', '✅.png');
                        }}
                      />
                      <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-7 sm:h-7 bg-slate-100 rounded-full border sm:border-2 border-white text-slate-500 font-black flex items-center justify-center text-[8px] sm:text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow">
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

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
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
