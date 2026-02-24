'use client'

import { Suspense, useState, useEffect, type DragEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { recordPlay } from '@/lib/levelSystem'

interface Item {
  id: string
  label: string
  emoji: string
  imageUrl?: string
  color: string
  shape: string
  placedInCategoryId?: string
  initialTop?: string
  initialLeft?: string
}

interface Category {
  id: string
  title: string
  boxImageUrl?: string
  accepts: (item: Item) => boolean
}

function ManagementGameInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const subId = parseInt(searchParams.get('subId') || '1', 10)
  const levelParam = parseInt(searchParams.get('level') || '1', 10)
  const villageId = parseInt(searchParams.get('villageId') || '1', 10)
  const mode = searchParams.get('mode')

  const [score, setScore] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [feedback, setFeedback] = useState<{ type: 'correct' | 'wrong', message: string } | null>(null)

  useEffect(() => {
    switch (levelParam) {
      case 1:
        setCategories([
          { id: 'cat:red', title: 'สีแดง 🔴', accepts: i => i.color === 'red' },
          { id: 'cat:circle', title: 'ทรงกลม 🔵', accepts: i => i.shape === 'circle' },
        ])
        setItems([
          { id: 'i1', label: 'แอปเปิลแดง', emoji: '🍎', color: 'red', shape: 'other', initialTop: '15%', initialLeft: '20%' },
          { id: 'i2', label: 'เหรียญ', emoji: '🪙', color: 'yellow', shape: 'circle', initialTop: '45%', initialLeft: '15%' },
          { id: 'i3', label: 'ลูกบอล', emoji: '⚽', color: 'mixed', shape: 'circle', initialTop: '30%', initialLeft: '80%' },
          { id: 'i4', label: 'เข็มหมุด', emoji: '📌', color: 'red', shape: 'other', initialTop: '10%', initialLeft: '65%' },
          { id: 'i5', label: 'ลูกพีช', emoji: '🍑', color: 'red', shape: 'other', initialTop: '50%', initialLeft: '55%' },
        ])
        break
      default:
        setCategories([
          { id: 'cat:1', title: `หมวดหมู่ A 📦`, accepts: i => i.color === 'red' },
          { id: 'cat:2', title: `หมวดหมู่ B 📦`, accepts: i => i.shape === 'circle' },
        ])
        setItems([
          { id: 'i1', label: `ไอเทม 1`, emoji: '❓', color: 'red', shape: 'circle', initialTop: '25%', initialLeft: '20%' },
          { id: 'i2', label: `ไอเทม 2`, emoji: '❓', color: 'yellow', shape: 'circle', initialTop: '45%', initialLeft: '50%' },
          { id: 'i3', label: `ไอเทม 3`, emoji: '❓', color: 'red', shape: 'square', initialTop: '30%', initialLeft: '80%' },
        ])
        break
    }
  }, [subId, levelParam])

  useEffect(() => {
    if (isGameOver && mode === 'village') {
      recordPlay(villageId, score)
    }
  }, [isGameOver, mode, villageId, score])

  const handleDropItemToCategory = (itemId: string, categoryId: string) => {
    const item = items.find(i => i.id === itemId)
    const category = categories.find(c => c.id === categoryId)
    if (!item || !category) return

    const isCorrect = category.accepts(item)
    if (isCorrect) {
      setFeedback({ type: 'correct', message: '✨ ถูกต้อง!' })
      setScore(s => s + 50)
      setItems(prev => {
        const newItems = prev.map(i =>
          i.id === itemId ? { ...i, placedInCategoryId: categoryId } : i
        )
        if (newItems.every(i => i.placedInCategoryId)) {
          setTimeout(() => setIsGameOver(true), 1000)
        }
        return newItems
      })
    } else {
      setFeedback({ type: 'wrong', message: '❌ ยังไม่ใช่นะ ลองใหม่ดู' })
      setScore(s => Math.max(0, s - 5))
    }
    setTimeout(() => setFeedback(null), 1000)
  }

  const unplacedItems = items.filter(i => !i.placedInCategoryId)

  return (
    <div className="game-page min-h-screen bg-slate-50 flex flex-col items-center p-4">
      {!isGameStarted && !isGameOver && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-5xl md:text-7xl font-black mb-4 text-slate-800">
            Management
          </h1>
          <p className="text-2xl font-bold text-slate-500 mb-12">ด่าน {subId} — ระดับ {levelParam}</p>

          <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 max-w-lg">
            <div className="text-8xl mb-8">📦</div>
            <p className="text-slate-600 text-lg mb-10 leading-relaxed text-center">
              ลากสิ่งของที่กระจายอยู่ ไปวางในกล่องตามหมวดหมู่ที่กำหนดให้ถูกต้อง!
            </p>
            <button
              className="w-full py-5 bg-pink-500 hover:bg-pink-600 text-white rounded-3xl font-black text-2xl shadow-lg active:scale-95 transition-all"
              onClick={() => setIsGameStarted(true)}
            >
              เริ่มระดมสมอง! 🚀
            </button>
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-white p-12 rounded-[3.5rem] shadow-xl border border-slate-100 max-w-md w-full">
          <div className="text-8xl mb-6">🏆</div>
          <h2 className="text-4xl font-black text-slate-800 mb-2">ยอดเยี่ยม!</h2>
          <p className="text-slate-500 font-bold mb-8 text-center">จัดการหมวดหมู่ได้ครบถ้วนแล้ว</p>

          <div className="bg-slate-50 px-8 py-6 rounded-3xl border border-slate-100 mb-10 w-full text-center">
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">Score</p>
            <p className="text-5xl font-black text-blue-600">{score}</p>
          </div>

          <div className="flex flex-col gap-4 w-full">
            {subId < 12 ? (
              <button
                className="w-full py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-xl shadow-md transition-all active:scale-95"
                onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
              >
                ด่านต่อไป 🚀
              </button>
            ) : villageId < 10 ? (
              <button
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-xl shadow-md transition-all active:scale-95"
                onClick={() => router.push(`/world/${villageId + 1}`)}
              >
                หมู่บ้านถัดไป 🏘️
              </button>
            ) : null}
            <button
              className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-lg transition-all"
              onClick={() => router.push(`/world/${villageId}`)}
            >
              กลับสู่แผนที่ 🗺️
            </button>
          </div>
        </div>
      )}

      {isGameStarted && !isGameOver && (
        <div className="w-full max-w-5xl h-[700px] flex flex-col bg-slate-200 rounded-[2.5rem] border-[8px] border-white shadow-2xl overflow-hidden relative">

          {/* Header Bar */}
          <div className="h-24 bg-white border-b-4 border-pink-400 flex justify-between items-center px-10 relative z-20">
            <div className="flex items-center gap-4">
              <span className="text-5xl">🍇</span>
              <h2 className="text-xl font-black text-slate-700">
                จงแยกวัตถุที่มีสีแดง และวัตถุทรงกลม
              </h2>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-pink-500 text-white px-4 py-1 rounded-xl font-bold text-xs uppercase tracking-tighter shadow-sm z-10">Score</div>
              <div className="bg-yellow-400 w-14 h-14 rounded-full border-4 border-white flex items-center justify-center text-white font-black text-2xl shadow-md -mt-3">
                {score}
              </div>
            </div>
          </div>

          {/* Playing Field */}
          <div className="flex-1 relative w-full overflow-hidden">
            {feedback && (
              <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 px-10 py-2 rounded-full font-black text-xl shadow-lg animate-bounce border-2 ${feedback.type === 'correct' ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white border-red-400'
                }`}>
                {feedback.message}
              </div>
            )}

            {/* Scattered Items */}
            {unplacedItems.map(item => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id)
                  e.currentTarget.style.opacity = '0.5'
                }}
                onDragEnd={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
                className="absolute w-24 h-24 flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-110 transition-transform duration-100 z-10"
                style={{
                  top: item.initialTop || '50%',
                  left: item.initialLeft || '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <span className="text-7xl drop-shadow-md select-none">{item.emoji}</span>
              </div>
            ))}

            {/* Drop Zones */}
            <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-20 px-10 z-0 text-center">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onDragLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.currentTarget.style.transform = 'scale(1)'
                    const itemId = e.dataTransfer.getData('text/plain')
                    handleDropItemToCategory(itemId, cat.id)
                  }}
                  className="flex flex-col items-center gap-2 transition-transform duration-200"
                >
                  <div className="relative w-40 h-32 flex items-center justify-center">
                    <span className="text-8xl drop-shadow-lg transition-transform duration-500 hover:scale-110">📦</span>
                  </div>
                  <div className="text-2xl font-black text-slate-500 uppercase tracking-tighter">
                    {cat.title}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ManagementPage() {
  return (
    <Suspense fallback={<div className="game-page"><p>กำลังโหลด...</p></div>}>
      <ManagementGameInner />
    </Suspense>
  )
}
