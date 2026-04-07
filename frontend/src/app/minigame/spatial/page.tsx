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
  "3": {
    "1.1": "มองจากบนลงล่าง ⬇️",
    "1.2": "มองจากบนลงล่าง ⬇️",
    "1.3": "มองจากล่างขึ้นบน ⬆️",
    "2.1": "มองจากด้านหน้า",
    "2.2": "มองจากด้านข้าง",
    "2.3": "มองจากด้านหน้า",
    "3.1": "มองจากด้านหน้า",
    "3.2": "มองจากด้านหน้า",
    "3.3": "มองจากด้านหน้า",
    "4.1": "มองจากบนลงล่าง ⬇️",
    "4.2": "มองจากบนลงล่าง ⬇️",
    "4.3": "มองจากบนลงล่าง ⬇️",
  },
  "4": {
    "1.1": "มองจากด้านบน⬇️",
    "1.2": "มองจากด้านหน้า",
    "1.3": "มองจากด้านซ้าย",
    "2.1": "มองจากด้านขวา",
    "2.2": "มองจากด้านหน้า",
    "2.3": "มองจากด้านซ้าย",
    "3.1": "มองจากด้านล่าง",
    "3.2": "มองจากด้านข้าง",
    "3.3": "มองจากด้านล่าง",
    "4.1": "มองจากด้านบนลงล่าง",
    "4.2": "มองจากด้านหน้า",
    "4.3": "มองจากด้านหน้า",
  },
  "5": {
    "1.1": "มองจากด้านหน้า",
    "1.2": "มองจากด้านหน้า",
    "1.3": "มองจากด้านขวาของตัวโมเดล",
    "2.1": "มองจากด้านข้างฝั่งซ้าย",
    "2.2": "มองจากด้านบนลงล่าง",
    "2.3": "มองจากด้านซ้าย",
    "3.1": "มองจากด้านขวา",
    "3.2": "มองจากด้านขวา",
    "3.3": "มองจากด้านซ้าย",
    "4.1": "มองจากด้านบนลงล่าง",
    "4.2": "มองจากด้านขวา",
    "4.3": "มองจากด้านบนลงล่าง",
  },
  "6": {
    "1.1": "มองจากด้านขวา",
    "1.2": "มองจากด้านขวา",
    "1.3": "มองจากด้านขวา",
    "2.1": "มองจากด้านขวา",
    "2.2": "มองจากด้านขวา",
    "2.3": "มองจากด้านขวา",
    "3.1": "มองจากด้านล่างขิ้นบน",
    "3.2": "มองจากด้านบนลงล่าง",
    "3.3": "มองจากด้านซ้าย",
    "4.1": "มองจากด้านซ้าย",
    "4.2": "มองจากด้านซ้าย",
    "4.3": "มองจากด้านล่างขิ้นบน",
  },
  "7": {
    "1.1": "มองจากด้านขวา",
    "1.2": "มองจากด้านขวา",
    "1.3": "มองจากด้านซ้าย",
    "2.1": "มองจากด้านขวา",
    "2.2": "มองจากด้านขวา",
    "2.3": "มองจากด้านซ้าย",
    "3.1": "มองจากด้านบนลงล่าง",
    "3.2": "มองจากด้านซ้าย",
    "3.3": "มองจากด้านหน้า",
    "4.1": "มองจากด้านขวา",
    "4.2": "มองจากด้านขวา",
    "4.3": "มองจากด้านขวา",
  },
  "8": {
    "1.1": "มองจากด้านบนลงล่าง",
    "1.2": "มองจากด้านบนลงล่าง",
    "1.3": "มองจากด้านซ้าย",
    "2.1": "มองจากด้านบนลงล่าง",
    "2.2": "มองจากด้านบนลงล่าง",
    "2.3": "มองจากด้านขวา",
    "3.1": "มองจากด้านบนลงล่าง",
    "3.2": "มองจากด้านล่างขึ้นบน",
    "3.3": "มองจากด้านซ้าย",
    "4.1": "มองจากด้านหลัง",
    "4.2": "มองจากด้านหลัง",
    "4.3": "มองจากด้านหน้า",
  },
  "9": {
    "1.1": "มองจากด้านขวา",
    "1.2": "มองจากด้านซ้าย",
    "1.3": "มองจากด้านบนลงล่าง",
    "2.1": "มองจากด้านขวา",
    "2.2": "มองจากด้านขวา",
    "2.3": "มองจากด้านขวา",
    "3.1": "มองจากด้านบนลงล่าง",
    "3.2": "มองจากด้านบนลงล่าง",
    "3.3": "มองจากด้านหลัง",
    "4.1": "มองจากด้านหน้า",
    "4.2": "มองจากด้านล่างขึ้นบน",
    "4.3": "มองจากด้านหลัง",
  },
  "10": {
    "1.1": "มองจากด้านบนลงล่าง",
    "1.2": "มองจากด้านบนลงล่าง",
    "1.3": "มองจากด้านซ้าย",
    "2.1": "มองจากด้านบนลงล่าง",
    "2.2": "มองจากด้านขวา",
    "2.3": "มองจากด้านหลัง",
    "3.1": "มองจากด้านบนลงล่าง",
    "3.2": "มองจากด้านซ้าย",
    "3.3": "มองจากด้านบนลงล่าง",
    "4.1": "มองจากด้านหน้า",
    "4.2": "มองจากด้านบนลงล่าง",
    "4.3": "มองจากด้านหน้า",
  },
  // คุณสามารถเพิ่มหมู่บ้าน 5, 6, 7... และเลขรอบที่คุณต้องการกำหนดเองได้ที่นี่ครับ
}

function pickBoxQuestion(level: number, villageId: number, version: string, qCount: number): { q: BoxQuestion; numOptions: number, index: number } {
  const roundNum = version.replace('v', '')

  // Selection logic: Sequential based on question count (0, 1, 2)
  const variantIndex = (qCount % 3) + 1
  const subId = variantIndex

  const folderName = `${roundNum}.${subId}`
  const path = `${BASE}/village_${villageId}/${roundNum}/${folderName}`
  const numOptions = level <= 5 ? 2 : level <= 7 ? 3 : 4

  const villageKey = villageId.toString()
  const customDir = CUSTOM_BOX_DIRECTIONS[villageKey]?.[folderName]
  const defaultDir = subId === 1 ? 'มองจากด้านบน ⬇️' : subId === 2 ? 'มองจากด้านข้าง ↔️' : subId === 3 ? 'มองจากด้านล่าง ⬆️' : subId === 4 ? 'มองจากด้านซ้าย ➡️' : 'มองจากด้านขวา ⬅️'
  let wrongs: string[] = []
  if (villageId <= 5) {
    wrongs = [`${path}/Wrong.png`]
  } else if (villageId <= 8) {
    wrongs = [`${path}/Wrong.png`, `${path}/Wrong1.png`]
  } else {
    wrongs = [`${path}/Wrong.png`, `${path}/Wrong1.png`, `${path}/Wrong2.png`]
  }

  // ระบบรองรับทั้ง ตัวเล็ก/ตัวใหญ่ และชื่อไทย/อังกฤษ ครับ
  const q: BoxQuestion = {
    block: `${path}/Block.png`, // เดี๋ยวในฝั่ง Component จะมี onerror ช่วยเช็ค block.png ให้ครับ
    correct: `${path}/Correct.png`,
    wrongs: wrongs,
    direction: customDir || defaultDir
  }
  const index = subId

  return { q, numOptions, index }
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

  const [showExitConfirm, setShowExitConfirm] = useState(false)
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

  // const [questionIndex, setQuestionIndex] = useState<number[]>([1, 2, 3])
  const lastQuestionIndexRef = useRef<number[]>([1, 2, 3])
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
  const nextQuestion = useCallback((qCount: number = 0) => {
    setFeedback(null)
    if (levelParam <= 2) {
      // Village 1-2: Interactive Image Matching Pair game
      // สำหรับ Village 1-2 จะใช้โฟลเดอร์ชื่อ v1, v2 เสมอ (มี v นำหน้า)
      const folderName = assetVersion // 'v1', 'v2', etc.
      const basePath = `/Asset_New/spatial/village_${villageId}/${folderName}`
      let pairs: { target: string; correct: string }[] = []

      // ปรับจูนจำนวนข้อและเส้นทางไฟล์ตามโครงสร้างจริงของแต่ละ Version ครับ
      if (villageId === 1) {
        if (assetVersion === 'v1') {
          // Village 1/v1 มี 9 คู่ (1.png - 9.png) อยู่ในโฟลเดอร์หลักโดยตรง
          pairs = Array.from({ length: 9 }, (_, i) => ({
            id: `v1-${i + 1}`,
            target: `${i + 1}.png`,
            correct: `${i + 1}M.png`,
          }))
        } else if (assetVersion === 'v2') {
          // v2: round1(1-5).png, round2(6-10).png
          const p1 = Array.from({ length: 5 }, (_, i) => ({ id: `r1-${i + 1}`, target: `round1/${i + 1}.png`, correct: `round1/${i + 1}M.png` }))
          const p2 = Array.from({ length: 5 }, (_, i) => ({ id: `r2-${i + 6}`, target: `round2/${i + 6}.png`, correct: `round2/${i + 6}M.png` }))
          pairs = [...p1, ...p2]
        } else if (assetVersion === 'v3') {
          // v3: round1(1-5).png, round2(1-5).PNG (นับ 1 ใหม่และใช้ตัวใหญ่)
          const p1 = Array.from({ length: 5 }, (_, i) => ({ id: `r1-${i + 1}`, target: `round1/${i + 1}.png`, correct: `round1/${i + 1}M.png` }))
          const p2 = Array.from({ length: 5 }, (_, i) => ({ id: `r2-${i + 1}`, target: `round2/${i + 1}.PNG`, correct: `round2/${i + 1}M.PNG` }))
          pairs = [...p1, ...p2]
        } else if (assetVersion === 'v4') {
          // v4: round1(1-5).PNG, round2(6-10).PNG (ใช้ตัวใหญ่ทั้งหมด)
          const p1 = Array.from({ length: 5 }, (_, i) => ({ id: `r1-${i + 1}`, target: `round1/${i + 1}.PNG`, correct: `round1/${i + 1}M.PNG` }))
          const p2 = Array.from({ length: 5 }, (_, i) => ({ id: `r2-${i + 6}`, target: `round2/${i + 6}.PNG`, correct: `round2/${i + 6}M.PNG` }))
          pairs = [...p1, ...p2]
        }
      } else if (villageId === 2) {
        // Village 2: ทุก Version ใช้ round1(1-6) และ round2(1-6) และ .PNG ทั้งหมด
        const p1 = Array.from({ length: 6 }, (_, i) => ({ id: `r1-${i + 1}`, target: `round1/${i + 1}.PNG`, correct: `round1/${i + 1}M.PNG` }))
        const p2 = Array.from({ length: 6 }, (_, i) => ({ id: `r2-${i + 1}`, target: `round2/${i + 1}.PNG`, correct: `round2/${i + 1}M.PNG` }))
        pairs = [...p1, ...p2]
      } else {
        // Default fallback
        pairs = Array.from({ length: 10 }, (_, i) => ({
          id: `f-${i + 1}`,
          target: `${i + 1}.png`,
          correct: `${i + 1}M.png`,
        }))
      }

      setQuestionData({ isPairMatching: true, pairs, basePath })
      setQuestionText('จับคู่รูปทรงต้นแบบที่มีรอยแหว่งกับชิ้นส่วนที่หายไป 🧩')
    } else {
      // Village 3+: Use Box asset images, fixed by version wrapper logic
      const { q, numOptions, index } = pickBoxQuestion(levelParam, villageId, assetVersion, qCount)

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
      lastQuestionIndexRef.current = lastQuestionIndexRef.current.filter((value) => value != index)
      setQuestionData({ targetImage: q.block, options: finalOptions, correctIndex: finalOptions.indexOf(q.correct) })
      setQuestionText(`ถ้า${q.direction} คุณจะเห็นหน้าตาบล็อกเป็นแบบใด? 📦`)
    }
  }, [levelParam, villageId, assetVersion])

  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // ── กำหนด Group (Round) ตามเลขด่านย่อยของโลก (1-4, 5-8, 9-12 จะวนลูป) ──
    const roundIdx = ((subId - 1) % 4) + 1
    const versionForThisRound = `v${roundIdx}`

    setAssetVersion(versionForThisRound)
    hasSavedRef.current = false
    lastQuestionIndexRef.current = [1, 2, 3]
    setIsGameOver(false)
    setQuestionCount(0)
    setIsInitialized(true)
  }, [levelParam, subId, villageId])

  useEffect(() => {
    if (isInitialized) {
      nextQuestion(0)
      setIsInitialized(false)
    }
  }, [isInitialized, nextQuestion])

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

  if (phase === 'intro') {
    const isPairLevels = levelParam <= 2
    const introIcon = isPairLevels ? '🧩' : '📦'
    const introTitle = isPairLevels ? 'จับคู่มิติสัมพันธ์' : 'มุมมองบล็อก 3D'
    const villageNum = villageId // เอาไว้แสดงหมู่บ้าน

    return (
      <div className="h-screen flex flex-col items-center justify-center p-1.5 md:p-4 font-['Supermarket'] overflow-hidden">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-md rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl border border-white/20 text-center animate-in zoom-in duration-500 max-h-[90%] overflow-y-auto">
          <div className="text-6xl md:text-8xl mb-4 md:mb-8 animate-bounce drop-shadow-xl">{introIcon}</div>
          {mode === 'daily' ? (
            <>
              <h2 className="text-2xl md:text-3xl font-black text-orange-500 mb-2 md:mb-4 uppercase tracking-tighter">🌟 ภารกิจรายวัน</h2>
              <p className="text-slate-600 font-bold mb-4 md:mb-8 text-sm md:text-base px-2 bg-orange-50 py-2 border-2 border-orange-200 rounded-full">ด่านที่ 3/3: มิติสัมพันธ์</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-black text-slate-800 mb-2 md:mb-4 uppercase tracking-tighter">{introTitle}</h2>
              <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-3 mb-5 md:mb-8">
                <p className="text-indigo-600 font-black text-[10px] md:text-sm uppercase tracking-widest mb-1">หมู่บ้านที่ {villageNum}</p>
                <p className="text-slate-500 font-bold text-xs md:text-base leading-relaxed">{diffDesc}</p>
              </div>
            </>
          )}
          <button
            onClick={() => {
              if (levelParam >= 3) {
                setPhase('memorize')
              } else {
                setPhase('play')
              }
            }}
            className={`w-full py-4 text-white rounded-[20px] font-black text-lg md:text-xl shadow-xl hover:scale-105 transition-all active:scale-95 ${mode === 'daily' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {mode === 'daily' ? 'เริ่มภารกิจ! ✨' : 'เริ่มเลย! ✨'}
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="h-screen flex flex-col items-center justify-center p-1 md:p-4 font-['Supermarket'] overflow-hidden">
      <div className="w-full max-w-4xl bg-white rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-full md:h-[calc(100vh-140px)] relative border border-slate-100">
        {/* Header */}
        <div className="min-h-[3rem] md:min-h-[5.5rem] py-1.5 md:py-4 bg-white border-b border-slate-100 flex flex-row items-center justify-between px-2.5 md:px-8 shrink-0 z-20 rounded-t-[24px] md:rounded-t-[40px] shadow-sm relative">
          <div className="flex flex-1 items-center gap-2 md:gap-5 pr-1.5 min-w-0">
            {phase === 'play' && (
              <button
                onClick={() => setShowExitConfirm(true)}
                className="w-7 h-7 md:w-10 md:h-10 shrink-0 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center font-black shadow-md border-2 border-red-300 transition-all active:scale-90"
              >
                <span className="text-sm md:text-xl relative -top-[1px]">×</span>
              </button>
            )}
            <div className="w-9 h-9 md:w-14 md:h-14 shrink-0 bg-indigo-50/80 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-3xl relative border border-indigo-100 shadow-inner">
              🧩
              {isBonus && (
                <div className="absolute -top-1.5 -right-2 bg-yellow-400 text-yellow-900 text-[8px] md:text-xs font-black px-1.5 py-0.5 rounded-full border border-yellow-500 shadow-sm">
                  x2
                </div>
              )}
            </div>
            <h1 className="text-lg md:text-3xl font-black text-slate-800 tracking-tight leading-none min-w-0 flex flex-col pt-0.5">
              ด่าน {levelParam}
              <span className="text-[9px] md:text-xs text-slate-400 mt-0.5 truncate flex-1">{questionText || diffDesc}</span>
            </h1>
          </div>
        </div>

        {isComplete ? (
          <div className="bg-white p-6 md:p-12 rounded-[2rem] shadow-2xl text-center max-w-sm mx-auto animate-in zoom-in duration-500 my-auto">
            <div className="text-4xl md:text-7xl mb-3">🎯</div>
            <h2 className="text-xl md:text-3xl font-black text-slate-800 mb-1">ยินดีด้วย!</h2>
            <p className="text-slate-500 mb-6 text-[10px] md:text-base font-bold uppercase tracking-widest leading-none">ความท้าทายสำเร็จแล้ว</p>
            <div className="grid grid-cols-1 gap-2">
              {mode === 'daily' ? (
                <button
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#c2410c] transition-all active:scale-95"
                  onClick={() => router.push('/daily-challenge')}
                >
                  สรุปผลรายวัน ✨
                </button>
              ) : (
                <>
                  {subId < 12 ? (
                    <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#166534] transition-all active:scale-95" onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}>
                      ด่านต่อไป ✨
                    </button>
                  ) : villageId < 10 ? (
                    <button className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black text-lg shadow-[0_4px_0_#c2410c] transition-all active:scale-95" onClick={() => router.push(`/world/${villageId + 1}`)}>
                      หมู่บ้านถัดไป 🏘️
                    </button>
                  ) : null}
                  <button className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl font-black text-base transition-all" onClick={() => router.push(`/world/${villageId}?showSummary=1`)}>
                    กลับสู่แผนที่ 🗺️
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 relative overflow-hidden bg-slate-50 flex flex-col">
            {feedback && (
              <div className={`absolute top-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-3 rounded-full font-black text-xl shadow-2xl transition-all border-4 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-300' : 'bg-red-500 text-white border-red-300 animate-shake'
                }`}>
                {feedback.message}
              </div>
            )}

            {/* Exit Confirm Modal */}
            {showExitConfirm && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-[40px] shadow-2xl p-8 max-w-sm w-full border-4 border-red-500 animate-in zoom-in duration-300 text-center">
                  <h3 className="text-2xl font-black text-slate-800 mb-4">
                    ⚠️ ยืนยันการออกจากด่าน
                  </h3>
                  <p className="text-slate-600 font-bold mb-6">
                    หากออกจากด่านตอนนี้ คุณจะได้คะแนนเท่าที่ทำได้ และจะไม่สามารถผ่านไปยังด่านย่อยถัดไปได้ (ต้องใช้กุญแจใหม่เพื่อเริ่มตีด่านนี้) ยืนยันหรือไม่?
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowExitConfirm(false)}
                      className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-2xl font-black shadow-sm transition-all active:scale-95"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() => {
                        if (mode === 'village') {
                          router.push(`/world/${villageId || 1}`);
                        } else if (mode === 'daily') {
                          router.push('/daily-challenge');
                        } else {
                          router.push('/minigame');
                        }
                      }}
                      className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-black shadow-lg hover:bg-red-600 transition-all active:scale-95"
                    >
                      ออกเลย
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 overflow-hidden">
              {/* Feedback / Question Text */}
              <div className="mb-2 md:mb-8 min-h-[25px] md:min-h-[50px] text-center w-full mt-0.5 md:mt-4 shrink-0">
                {!feedback && questionText && (
                  <div className="inline-block px-3 md:px-10 py-1 md:py-3 rounded-full font-bold text-slate-600 bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm text-xs md:text-base">
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
                    setQuestionCount((prevCount) => {
                      const nextCount = prevCount + 1
                      if (nextCount >= MAX_QUESTIONS) {
                        setIsGameOver(true)
                        return prevCount
                      }
                      nextQuestion(nextCount)
                      return nextCount
                    })
                  }, 1500)
                }}
                onError={() => setErrorCount(e => e + 1)}
              />
            )}

            {/* Box Image selection (Level 3+) */}
            {questionData && !questionData.isPairMatching && questionData.options && (
              <div className="w-full flex flex-col items-center">
                {/* Main block image */}
                <div className="mb-2 md:mb-6 relative p-1.5 md:p-4 bg-white/60 backdrop-blur-md rounded-xl md:rounded-[1.5rem] border-2 md:border-3 border-indigo-200 shadow-xl flex items-center justify-center w-full max-w-[160px] md:max-w-[350px] shrink-0">
                  <div className="text-[6px] md:text-[10px] font-black text-indigo-400 uppercase tracking-widest absolute top-1 md:top-2 left-2 md:left-3 leading-none">โจทย์ 📦</div>
                  <img
                    src={questionData.targetImage}
                    style={DIP_STYLE}
                    className="w-full h-[80px] md:h-[200px] object-contain mt-1 md:mt-3"
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
                <div className={`grid gap-1.5 md:gap-5 w-full max-w-2xl px-1.5 md:px-4 pb-2 md:pb-8 mt-1.5 md:mt-2 shrink-0 ${questionData.options.length === 2
                    ? 'grid-cols-2'
                    : questionData.options.length === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-4'
                  }`}>
                  {questionData.options.map((opt: string, idx: number) => (
                    <button
                      key={`${idx}-${opt}`}
                      onClick={() => {
                        if (idx === questionData.correctIndex) {
                          setFeedback({ type: 'correct', message: '✨ ถูกต้องแล้ว! เก่งมาก' })
                          setTimeout(() => {
                            setQuestionCount((prevCount) => {
                              const nextCount = prevCount + 1
                              if (nextCount >= MAX_QUESTIONS) {
                                setIsGameOver(true)
                                return prevCount
                              }
                              nextQuestion(nextCount)
                              return nextCount
                            })
                          }, 1200)
                        } else {
                          setErrorCount(e => e + 1)
                          setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองดูอีกที' })
                          setTimeout(() => setFeedback(null), 1000)
                        }
                      }}
                      className="group relative p-1 md:p-3 bg-white hover:bg-indigo-50 border-b-2 md:border-b-8 border-slate-200 hover:border-indigo-300 rounded-lg md:rounded-[2rem] shadow-sm md:shadow-lg transition-all active:scale-95 flex flex-col items-center justify-center min-h-[60px] md:min-h-[130px]"
                    >
                      <img
                        src={opt}
                        style={DIP_STYLE}
                        className="w-[40px] h-[40px] md:max-w-[100px] md:max-h-[100px] object-contain group-hover:scale-105 transition-transform"
                        alt={`option ${idx}`}
                        onError={(e) => {
                          const img = e.currentTarget;
                          // ลองเปลี่ยนเป็นชื่ออื่นๆ ที่เป็นไปได้
                          if (img.src.includes('Correct.png')) {
                            img.src = img.src.toLowerCase();
                          }
                          else if (img.src.includes('Wrong')) {
                            img.src = img.src;
                          }
                          else if (img.src.includes('ถูก.png')) {
                            img.src = img.src.replace('ถูก.png', '✅.png');
                          }
                        }}
                      />
                      <div className="absolute -top-1 -right-1 md:-top-2 md:-right-2 w-4 h-4 md:w-7 md:h-7 bg-slate-100 rounded-full border md:border-2 border-white text-slate-500 font-black flex items-center justify-center text-[7px] md:text-xs group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow">
                        {String.fromCharCode(65 + idx)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
