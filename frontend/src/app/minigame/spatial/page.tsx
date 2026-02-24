'use client'

import Image from 'next/image'
import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { recordPlay } from '@/lib/levelSystem'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')

  const levelTexts = [
    'จับคู่รอยแหว่งกับชิ้นส่วน 1',
    'จับคู่รอยแหว่งกับชิ้นส่วน 2',
    'เลือกภาพที่ต้นไม้อยู่หลังเก้าอี้',
    'เลือกภาพที่แก้วกาแฟอยู่ใต้โต๊ะ',
    'เลือกสิ่งของที่ใช้กับทะเล',
    'เลือกของใช้ในห้องน้ำ (คล้ายกันมากขึ้น)',
    'เลือกเครื่องใช้ในครัว (โทนสีเดียวกัน, มีซ้ำ)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (4 ชิ้น)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (6 ชิ้น)',
    'ทายวัตถุจากภาพเงาซ้อนกัน (ซับซ้อนขึ้น)'
  ]
  const diffDesc = levelTexts[Math.min(Math.max(levelParam - 1, 0), 9)]

  const [gameMode, setGameMode] = useState<'match' | 'select' | 'find'>('match')
  const [leftImages, setLeftImages] = useState<string[]>([])
  const [rightImages, setRightImages] = useState<string[]>([])
  const [matches, setMatches] = useState<Record<string, string>>({})
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', message: string } | null>(null)
  const [assetPath, setAssetPath] = useState<string>('/assets/level1/relation1-1/')
  const [questionText, setQuestionText] = useState<string>('')
  const [correctSelections, setCorrectSelections] = useState<Set<string>>(new Set())
  const [currentSelections, setCurrentSelections] = useState<Set<string>>(new Set())
  const [isGameOver, setIsGameOver] = useState(false)

  const isComplete = gameMode === 'match'
    ? (leftImages.length > 0 && Object.keys(matches).length === leftImages.length)
    : isGameOver

  useEffect(() => {
    let path = '/assets/level1/relation1-1/'
    let lefts: string[] = []
    let rights: string[] = []
    let mode: 'match' | 'select' | 'find' = 'match'
    let qText = ''
    let correctSet = new Set<string>()

    switch (levelParam) {
      case 1:
        mode = 'match'
        path = '/assets/level1/relation1-1/'
        lefts = ['left1.PNG', 'left2.PNG', 'left3.PNG', 'left4.PNG', 'left5.PNG']
        rights = ['right1.PNG', 'right2.PNG', 'right3.PNG', 'right4.PNG', 'right5.PNG']
        break
      case 2:
        mode = 'match'
        path = '/assets/level1/relation1-2/'
        lefts = ['left1.PNG', 'left2.PNG', 'left3.PNG', 'left4.PNG', 'left5.PNG']
        rights = ['right1.PNG', 'right2.PNG', 'right3.PNG', 'right4.PNG', 'right5.PNG']
        break
      case 3:
        mode = 'find'
        path = '/assets/FindObject1/'
        qText = 'เลือกภาพที่ต้นไม้อยู่ "ข้างหลัง" เก้าอี้ 🌳🪑'
        lefts = ['image1.PNG', 'image2.PNG']
        correctSet = new Set(['image2.PNG']) // Mock: image2 has tree behind chair
        break
      case 4:
        mode = 'find'
        path = '/assets/FindObject1/'
        qText = 'เลือกภาพที่แก้วกาแฟอยู่ "ใต้" โต๊ะ ☕️ table'
        lefts = ['image1.PNG', 'image2.PNG']
        correctSet = new Set(['image1.PNG']) // Mock: image1 has cup under table
        break
      case 5:
        mode = 'select'
        path = '/assets/IsObject/1/'
        qText = 'เลือกสิ่งของที่ใช้หรือเกี่ยวข้องกับทะเล 🌊'
        lefts = [
          'ball.PNG', 'calculator.PNG', 'car_key.PNG', 'glasses.PNG',
          'ice_bucket.PNG', 'image.PNG', 'lego.PNG', 'medicine.PNG',
          'mouse.PNG', 'mug.PNG', 'plant_pot.PNG', 'slipper.PNG',
          'stapler.PNG', 'swimsuit.PNG', 'tape_measure.PNG', 'tools.PNG'
        ]
        correctSet = new Set(["ball.PNG", "swimsuit.PNG", "slipper.PNG", "ice_bucket.PNG"])
        break
      case 6:
        mode = 'select'
        path = '/assets/IsObject/1/' // Replace with bathroom assets later
        qText = 'เลือกของใช้ที่อยู่ในห้องน้ำ 🛀'
        lefts = ['soap.PNG', 'shampoo.PNG', 'towel.PNG', 'hammer.PNG', 'laptop.PNG', 'toothbrush.PNG']
        correctSet = new Set(['soap.PNG', 'shampoo.PNG', 'towel.PNG', 'toothbrush.PNG'])
        break
      case 7:
        mode = 'select'
        path = '/assets/IsObject/1/' // Replace with kitchen assets later
        qText = 'เลือกเครื่องใช้ในครัว (สีโทนเดียวกัน) 🍳'
        lefts = ['pan.PNG', 'pot.PNG', 'knife.PNG', 'car.PNG', 'cat.PNG', 'spoon.PNG']
        correctSet = new Set(['pan.PNG', 'pot.PNG', 'knife.PNG', 'spoon.PNG'])
        break
      case 8:
        mode = 'find'
        path = '/assets/FindObject1/'
        qText = 'ทายว่ามีวัตถุอะไรซ้อนกันอยู่ (4 ชิ้น) 🔍'
        lefts = ['silhouette_4.PNG'] // Placeholder asset
        correctSet = new Set(['silhouette_4.PNG'])
        break
      case 9:
        mode = 'find'
        path = '/assets/FindObject1/'
        qText = 'ทายว่ามีวัตถุอะไรซ้อนกันอยู่ (6 ชิ้น) 🔍'
        lefts = ['silhouette_6.PNG'] // Placeholder asset
        correctSet = new Set(['silhouette_6.PNG'])
        break
      case 10:
        mode = 'find'
        path = '/assets/FindObject1/'
        qText = 'ทายวัตถุจากภาพเงาที่ซับซ้อนที่สุด 🎭'
        lefts = ['silhouette_complex.PNG'] // Placeholder asset
        correctSet = new Set(['silhouette_complex.PNG'])
        break
    }

    setGameMode(mode)
    setAssetPath(path)
    setLeftImages(lefts)
    setRightImages([...rights].sort(() => Math.random() - 0.5))
    setQuestionText(qText)
    setCorrectSelections(correctSet)
    setMatches({})
    setSelectedLeft(null)
    setFeedback(null)
    setCurrentSelections(new Set())
    setIsGameOver(false)
  }, [levelParam])

  useEffect(() => {
    if (isComplete && mode === 'village') {
      recordPlay(villageId, 100)
    }
  }, [isComplete, mode, villageId])

  // --- Handlers for Match Mode ---
  const handleLeftClick = (name: string) => {
    if (gameMode !== 'match') return
    if (!matches[name]) {
      setSelectedLeft(name)
      setFeedback(null)
    }
  }

  // Define matching pairs for each level
  // You can easily add more levels here by adding a new case
  const getLevelMatchMap = (level: number): Record<string, string> => {
    switch (level) {
      case 1:
        return {
          'left1.PNG': 'right4.PNG',
          'left2.PNG': 'right3.PNG',
          'left3.PNG': 'right1.PNG',
          'left4.PNG': 'right5.PNG',
          'left5.PNG': 'right2.PNG',
        }
      case 2:
        return {
          'left1.PNG': 'right2.PNG', // Mock: L1 matches R2
          'left2.PNG': 'right5.PNG', // Mock: L2 matches R5
          'left3.PNG': 'right4.PNG', // Mock: L3 matches R4
          'left4.PNG': 'right1.PNG', // Mock: L4 matches R1
          'left5.PNG': 'right3.PNG', // Mock: L5 matches R3
        }
      default:
        // Default mapping if level not specified: L1 matches R1, etc.
        return {
          'left1.PNG': 'right1.PNG',
          'left2.PNG': 'right2.PNG',
          'left3.PNG': 'right3.PNG',
          'left4.PNG': 'right4.PNG',
          'left5.PNG': 'right5.PNG',
        }
    }
  }

  const matchMap = getLevelMatchMap(levelParam)

  const handleRightClick = (rightName: string) => {
    if (gameMode !== 'match') return
    if (selectedLeft) {
      const expectedRight = matchMap[selectedLeft]
      if (rightName === expectedRight) {
        setMatches(prev => ({ ...prev, [selectedLeft]: rightName }))
        setFeedback({ type: 'correct', message: '✨ ถูกต้อง!' })
      } else {
        setFeedback({ type: 'wrong', message: '❌ ยังไม่ถูกนะ ลองจับคู่อื่นดู' })
      }
      setSelectedLeft(null)
    }
  }

  // --- Handlers for Selection & Find Mode ---
  const handleItemSelect = (name: string) => {
    if (gameMode === 'select') {
      const next = new Set(currentSelections)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      setCurrentSelections(next)
      setFeedback(null)
    } else if (gameMode === 'find') {
      if (correctSelections.has(name)) {
        setFeedback({ type: 'correct', message: '✨ ถูกต้องแล้ว!' })
        setTimeout(() => setIsGameOver(true), 1000)
      } else {
        setFeedback({ type: 'wrong', message: '❌ ไม่ใช่ภาพนี้ ลองใหม่อีกที' })
      }
    }
  }

  const validateSelection = () => {
    const isCorrect = currentSelections.size === correctSelections.size &&
      [...currentSelections].every(x => correctSelections.has(x))
    if (isCorrect) {
      setFeedback({ type: 'correct', message: '🎊 เก่งมาก! เลือกได้ถูกต้องทั้งหมด' })
      setTimeout(() => setIsGameOver(true), 1200)
    } else {
      setFeedback({ type: 'wrong', message: '❌ ยังเลือกไม่ครบ หรือมีจุดที่ผิดนะ' })
    }
  }

  const [lines, setLines] = useState<{ x1: number, y1: number, x2: number, y2: number }[]>([])
  const leftRefs = useState<Record<string, HTMLDivElement | null>>({})[0]
  const rightRefs = useState<Record<string, HTMLDivElement | null>>({})[0]
  const containerRef = useState<HTMLDivElement | null>(null)[0]

  useEffect(() => {
    const updateLines = () => {
      const newLines: { x1: number, y1: number, x2: number, y2: number }[] = []
      Object.entries(matches).forEach(([left, right]) => {
        const leftEl = leftRefs[left]
        const rightEl = rightRefs[right]
        if (leftEl && rightEl) {
          const lRect = leftEl.getBoundingClientRect()
          const rRect = rightEl.getBoundingClientRect()
          // We need coordinates relative to the game-page or match-container
          // For simplicity, let's just use window-relative but we'll need an absolute SVG
          newLines.push({
            x1: lRect.right,
            y1: lRect.top + lRect.height / 2,
            x2: rRect.left,
            y2: rRect.top + rRect.height / 2
          })
        }
      })
      setLines(newLines)
    }

    updateLines()
    window.addEventListener('resize', updateLines)
    return () => window.removeEventListener('resize', updateLines)
  }, [matches, leftRefs, rightRefs, gameMode])

  return (
    <div className='game-page min-h-screen py-10 flex flex-col items-center relative overflow-hidden'>
      {/* SVG Overlay for Lines */}
      {gameMode === 'match' && (
        <svg className="fixed inset-0 pointer-events-none z-0 overflow-visible" style={{ width: '100vw', height: '100vh' }}>
          {lines.map((line, i) => (
            <line key={i} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke="#3b82f6" strokeWidth="4" strokeLinecap="round" strokeDasharray="8,8" className="animate-in fade-in duration-500" />
          ))}
        </svg>
      )}

      <div className="max-w-4xl w-full px-4 relative z-10">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
          <h1 className="text-3xl font-black text-slate-800 text-center mb-1">
            🗺️ Spatial — ด่าน {subId}
          </h1>
          <p className="text-center text-slate-500 font-bold uppercase tracking-wider text-sm">
            {diffDesc}
          </p>
        </div>

        {isComplete ? (
          <div className="bg-white/95 backdrop-blur-md border-2 border-white/20 p-12 rounded-[3rem] shadow-2xl text-center max-w-xl mx-auto animate-in zoom-in duration-500">
            <div className="text-8xl mb-6">🏆</div>
            <h2 className="text-3xl font-black text-slate-800 mb-4">ยอดเยี่ยมที่สุด!</h2>
            <p className="text-slate-500 mb-10 text-lg">คุณมีความสามารถในการมองเห็นพื้นที่ได้ดีเยี่ยม</p>
            <div className="grid grid-cols-1 gap-4">
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
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center">
            <div className="mb-8 min-h-[50px] text-center w-full">
              {feedback && (
                <div className={`inline-block px-10 py-3 rounded-full font-black text-xl shadow-sm border-2 ${feedback.type === 'correct' ? 'bg-green-100 text-green-600 border-green-200' : 'bg-red-100 text-red-600 border-red-200 animate-shake'}`}>
                  {feedback.message}
                </div>
              )}
              {!feedback && (
                <div className="inline-block px-10 py-3 rounded-full font-bold text-slate-500 bg-white border border-slate-200 shadow-sm">
                  {gameMode === 'match' ? '💡 คลิกรูปฝั่งซ้าย แล้วหาคู่ที่แมตช์กันที่ฝั่งขวา' : `💡 ${questionText}`}
                </div>
              )}
            </div>

            {gameMode === 'match' && (
              <div className='flex justify-center gap-10 md:gap-20 mt-2 mb-16'>
                <div className="flex flex-col gap-5">
                  <h3 className="text-center font-black text-slate-400 uppercase tracking-widest text-xs">ต้นแบบ</h3>
                  {leftImages.map(name => {
                    const matchedTo = matches[name]
                    const isSelected = selectedLeft === name
                    return (
                      <div key={name} ref={el => { leftRefs[name] = el }} onClick={() => handleLeftClick(name)} className={`relative p-2 bg-white rounded-2xl border-4 transition-all duration-200 ${matchedTo ? 'opacity-40 grayscale pointer-events-none' : 'hover:shadow-md cursor-pointer'} ${isSelected ? 'border-blue-500 scale-105' : 'border-slate-100'}`}>
                        <Image src={`${assetPath}${name}`} alt={name} width={130} height={130} className="rounded-xl" />
                        {matchedTo && <div className="absolute inset-0 flex items-center justify-center text-4xl">✅</div>}
                      </div>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-5">
                  <h3 className="text-center font-black text-slate-400 uppercase tracking-widest text-xs">คู่ที่หายไป</h3>
                  {rightImages.map(name => {
                    const isMatched = Object.values(matches).includes(name)
                    const canClick = selectedLeft && !isMatched
                    return (
                      <div key={name} ref={el => { rightRefs[name] = el }} onClick={() => handleRightClick(name)} className={`relative p-2 bg-white rounded-2xl border-4 transition-all duration-200 ${isMatched ? 'opacity-40 grayscale pointer-events-none' : canClick ? 'cursor-pointer hover:border-blue-300 hover:shadow-md' : 'border-slate-100'}`}>
                        <Image src={`${assetPath}${name}`} alt={name} width={130} height={130} className="rounded-xl" />
                        {isMatched && <div className="absolute inset-0 flex items-center justify-center text-4xl">✅</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {gameMode === 'select' && (
              <div className="max-w-4xl mx-auto flex flex-col items-center pb-20">
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 mb-12">
                  {leftImages.map(name => {
                    const isSelected = currentSelections.has(name)
                    return (
                      <div key={name} onClick={() => handleItemSelect(name)} className={`cursor-pointer p-2 rounded-2xl border-4 bg-white transition-all ${isSelected ? 'border-blue-500 shadow-lg scale-110' : 'border-slate-100 hover:border-blue-200'}`}>
                        <Image src={`${assetPath}${name}`} width={80} height={80} alt={name} className="rounded-lg" />
                      </div>
                    )
                  })}
                </div>
                <button onClick={validateSelection} className="px-16 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-all">
                  ยืนยันการเลือก
                </button>
              </div>
            )}

            {gameMode === 'find' && (
              <div className="flex gap-6 justify-center mt-6 mb-20 flex-wrap">
                {leftImages.map(name => (
                  <div key={name} onClick={() => handleItemSelect(name)} className="cursor-pointer p-3 bg-white border-4 border-slate-100 hover:border-blue-400 rounded-3xl transition-all shadow-sm hover:shadow-md">
                    <Image src={`${assetPath}${name}`} width={320} height={320} alt={name} className="rounded-2xl" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
