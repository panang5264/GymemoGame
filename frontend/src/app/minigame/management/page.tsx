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
        // เลเวล 1: แยกสี/รูปทรง
        setCategories([
          { id: 'cat:red', title: 'สีแดง 🔴', accepts: i => i.color === 'red' },
          { id: 'cat:circle', title: 'ทรงกลม 🔵', accepts: i => i.shape === 'circle' },
        ])
        setItems([
          { id: 'i1', label: 'แอปเปิลแดง', emoji: '🍎', color: 'red', shape: 'other', initialTop: '15%', initialLeft: '20%' },
          { id: 'i2', label: 'เหรียญ', emoji: '🪙', color: 'yellow', shape: 'circle', initialTop: '45%', initialLeft: '15%' },
          { id: 'i3', label: 'ลูกบอล', emoji: '⚽', color: 'mixed', shape: 'circle', initialTop: '30%', initialLeft: '80%' },
          { id: 'i4', label: 'เข็มหมุด', emoji: '📌', color: 'red', shape: 'other', initialTop: '10%', initialLeft: '65%' },
          { id: 'i5', label: 'พริกแดง', emoji: '🌶️', color: 'red', shape: 'other', initialTop: '50%', initialLeft: '55%' },
        ])
        break
      case 2:
        // เลเวล 2: แยกสิ่งมีชีวิต / สิ่งของ
        setCategories([
          { id: 'cat:living', title: 'สิ่งมีชีวิต 🦋', accepts: i => i.color === 'living' },
          { id: 'cat:object', title: 'สิ่งของ 📦', accepts: i => i.color === 'object' },
        ])
        setItems([
          { id: 'i2-1', label: 'แมว', emoji: '🐱', color: 'living', shape: 'any', initialTop: '20%', initialLeft: '15%' },
          { id: 'i2-2', label: 'กล่อง', emoji: '📦', color: 'object', shape: 'any', initialTop: '15%', initialLeft: '75%' },
          { id: 'i2-3', label: 'นก', emoji: '🐦', color: 'living', shape: 'any', initialTop: '50%', initialLeft: '20%' },
          { id: 'i2-4', label: 'นาฬิกา', emoji: '⏰', color: 'object', shape: 'any', initialTop: '10%', initialLeft: '45%' },
          { id: 'i2-5', label: 'ต้นไม้', emoji: '🌲', color: 'living', shape: 'any', initialTop: '55%', initialLeft: '70%' },
        ])
        break
      case 3:
        // เลเวล 3: แยกตามสี / ขนาด
        setCategories([
          { id: 'cat:yellow', title: 'สีเหลือง 🟡', accepts: i => i.color === 'yellow' },
          { id: 'cat:large', title: 'ขนาดใหญ่ 🐘', accepts: i => i.shape === 'large' },
        ])
        setItems([
          { id: 'L3-1', label: 'รถเมล์', emoji: '🚌', color: 'yellow', shape: 'large', initialTop: '20%', initialLeft: '15%' },
          { id: 'L3-2', label: 'เลมอน', emoji: '🍋', color: 'yellow', shape: 'any', initialTop: '15%', initialLeft: '75%' },
          { id: 'L3-3', label: 'เรือใบ', emoji: '⛵', color: 'white', shape: 'large', initialTop: '50%', initialLeft: '20%' },
          { id: 'L3-4', label: 'เครื่องบิน', emoji: '✈️', color: 'white', shape: 'large', initialTop: '10%', initialLeft: '45%' },
          { id: 'L3-5', label: 'กล้วย', emoji: '🍌', color: 'yellow', shape: 'any', initialTop: '55%', initialLeft: '70%' },
        ])
        break
      case 4:
        // เลเวล 4: กินได้ / กินไม่ได้
        setCategories([
          { id: 'cat:edible', title: 'ของกิน 🍕', accepts: i => i.color === 'edible' },
          { id: 'cat:inedible', title: 'ของใช้ 🛠️', accepts: i => i.color === 'inedible' },
        ])
        setItems([
          { id: 'L4-1', label: 'พิซซ่า', emoji: '🍕', color: 'edible', shape: 'any', initialTop: '20%', initialLeft: '20%' },
          { id: 'L4-2', label: 'ค้อน', emoji: '🔨', color: 'inedible', shape: 'any', initialTop: '45%', initialLeft: '15%' },
          { id: 'L4-3', label: 'พริก', emoji: '🌶️', color: 'edible', shape: 'any', initialTop: '30%', initialLeft: '80%' },
          { id: 'L4-4', label: 'กุญแจ', emoji: '🔑', color: 'inedible', shape: 'any', initialTop: '10%', initialLeft: '65%' },
          { id: 'L4-5', label: 'โดนัท', emoji: '🍩', color: 'edible', shape: 'any', initialTop: '55%', initialLeft: '50%' },
        ])
        break
      case 5:
        // เลเวล 5: เสื้อผ้า / เครื่องใช้ไฟฟ้า
        setCategories([
          { id: 'cat:clot', title: 'เสื้อผ้า 👕', accepts: i => i.color === 'cloth' },
          { id: 'cat:elec', title: 'เครื่องใช้ไฟฟ้า 💻', accepts: i => i.color === 'elec' },
        ])
        setItems([
          { id: 'L5-1', label: 'หมวก', emoji: '🧢', color: 'cloth', shape: 'any', initialTop: '20%', initialLeft: '20%' },
          { id: 'L5-2', label: 'พัดลม', emoji: '🌀', color: 'elec', shape: 'any', initialTop: '45%', initialLeft: '15%' },
          { id: 'L5-3', label: 'กระโปรง', emoji: '👗', color: 'cloth', shape: 'any', initialTop: '30%', initialLeft: '80%' },
          { id: 'L5-4', label: 'มือถือ', emoji: '📱', color: 'elec', shape: 'any', initialTop: '10%', initialLeft: '35%' },
          { id: 'L5-5', label: 'ถุงเท้า', emoji: '🧦', color: 'cloth', shape: 'any', initialTop: '55%', initialLeft: '55%' },
        ])
        break
      case 6:
        // เลเวล 6: จับคู่สิ่งที่ใช้ร่วมกัน
        setCategories([
          { id: 'cat:study', title: 'เครื่องเขียน ✏️', accepts: i => i.color === 'study' },
          { id: 'cat:chef', title: 'เครื่องครัว 🍳', accepts: i => i.color === 'chef' },
        ])
        setItems([
          { id: 'L6-1', label: 'ดินสอ', emoji: '✏️', color: 'study', shape: 'any', initialTop: '20%', initialLeft: '25%' },
          { id: 'L6-2', label: 'กระทะ', emoji: '🍳', color: 'chef', shape: 'any', initialTop: '45%', initialLeft: '55%' },
          { id: 'L6-3', label: 'ยางลบ', emoji: '�', color: 'study', shape: 'any', initialTop: '30%', initialLeft: '75%' },
          { id: 'L6-4', label: 'ตะหลิว', emoji: '🥄', color: 'chef', shape: 'any', initialTop: '10%', initialLeft: '45%' },
          { id: 'L6-5', label: 'ไม้บรรทัด', emoji: '📏', color: 'study', shape: 'any', initialTop: '55%', initialLeft: '20%' },
        ])
        break
      case 7:
        // เลเวล 7: แยกหลายหมวดพร้อมกัน
        setCategories([
          { id: 'cat:r', title: 'แดง 🔴', accepts: i => i.color === 'red' },
          { id: 'cat:b', title: 'ฟ้า 🔵', accepts: i => i.color === 'blue' },
          { id: 'cat:g', title: 'เขียว 🟢', accepts: i => i.color === 'green' },
        ])
        setItems([
          { id: 'L7-1', label: 'กุหลาบ', emoji: '🌹', color: 'red', shape: 'any', initialTop: '20%', initialLeft: '10%' },
          { id: 'L7-2', label: 'คลื่น', emoji: '🌊', color: 'blue', shape: 'any', initialTop: '45%', initialLeft: '25%' },
          { id: 'L7-3', label: 'มรกต', emoji: '🐍', color: 'green', shape: 'any', initialTop: '30%', initialLeft: '85%' },
          { id: 'L7-4', label: 'น้ำเงิน', emoji: '�', color: 'blue', shape: 'any', initialTop: '10%', initialLeft: '50%' },
          { id: 'L7-5', label: 'แตงโม', emoji: '�', color: 'red', shape: 'any', initialTop: '55%', initialLeft: '40%' },
        ])
        break
      case 8:
        // เลเวล 8: ใช้กฎห้าม (เช่น ห้ามเลือกสีแดง)
        setCategories([
          { id: 'cat:ok', title: 'เลือกได้ ✅', accepts: i => i.color !== 'red' },
          { id: 'cat:no', title: 'ห้ามเลือก 🚫', accepts: i => i.color === 'red' },
        ])
        setItems([
          { id: 'L8-1', label: 'ใบไม้', emoji: '🍃', color: 'green', shape: 'any', initialTop: '20%', initialLeft: '20%' },
          { id: 'L8-2', label: 'ไฟจราจร', emoji: '🚥', color: 'red', shape: 'any', initialTop: '45%', initialLeft: '15%' },
          { id: 'L8-3', label: 'ท้องฟ้า', emoji: '🌈', color: 'blue', shape: 'any', initialTop: '30%', initialLeft: '80%' },
          { id: 'L8-4', label: 'สตรอว์เบอร์รี', emoji: '🍓', color: 'red', shape: 'any', initialTop: '10%', initialLeft: '65%' },
          { id: 'L8-5', label: 'กล้วย', emoji: '🍌', color: 'yellow', shape: 'any', initialTop: '55%', initialLeft: '50%' },
        ])
        break
      case 9:
        // เลเวล 9: หาสิ่งที่แตกต่าง
        setCategories([
          { id: 'cat:cold', title: 'กลุ่มของเย็น ❄️', accepts: i => i.color === 'cold' },
        ])
        setItems([
          { id: 'L9-1', label: 'น้ำแข็ง', emoji: '🧊', color: 'cold', shape: 'any', initialTop: '30%', initialLeft: '20%' },
          { id: 'L9-2', label: 'ไอศกรีม', emoji: '🍦', color: 'cold', shape: 'any', initialTop: '50%', initialLeft: '40%' },
          { id: 'L9-3', label: 'หิมะ', emoji: '❄️', color: 'cold', shape: 'any', initialTop: '20%', initialLeft: '70%' },
          { id: 'L9-4', label: 'ภูเขาไฟ', emoji: '🌋', color: 'hot', shape: 'any', initialTop: '40%', initialLeft: '80%' },
          { id: 'L9-5', label: 'เพนกวิน', emoji: '🐧', color: 'cold', shape: 'any', initialTop: '15%', initialLeft: '45%' },
        ])
        break
      case 10:
        // เลเวล 10: จับคู่คำพูด/วลีเข้าหมวดหมู่
        setCategories([
          { id: 'cat:polite', title: 'คำพูดดี 😊', accepts: i => i.color === 'good' },
          { id: 'cat:rude', title: 'คำไม่ดี ☹️', accepts: i => i.color === 'bad' },
        ])
        setItems([
          { id: 'L10-1', label: 'ขอบคุณ', emoji: '�', color: 'good', shape: 'any', initialTop: '20%', initialLeft: '20%' },
          { id: 'L10-2', label: 'ว่าร้าย', emoji: '👿', color: 'bad', shape: 'any', initialTop: '45%', initialLeft: '15%' },
          { id: 'L10-3', label: 'รักนะ', emoji: '�', color: 'good', shape: 'any', initialTop: '30%', initialLeft: '80%' },
          { id: 'L10-4', label: 'ตะคอก', emoji: '😤', color: 'bad', shape: 'any', initialTop: '10%', initialLeft: '65%' },
          { id: 'L10-5', label: 'สู้ๆ นะ', emoji: '✌️', color: 'good', shape: 'any', initialTop: '55%', initialLeft: '50%' },
        ])
        break
      default:
        setCategories([
          { id: 'cat:1', title: `หมดด่านแล้ว 🎉`, accepts: i => true },
        ])
        setItems([
          { id: 'i-end', label: `เก่งมาก`, emoji: '🌟', color: 'any', shape: 'any', initialTop: '40%', initialLeft: '50%' },
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
          <div className="h-24 bg-white border-b-4 border-pink-400 flex justify-between items-center px-6 md:px-10 relative z-20">
            <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
              <span className="text-3xl md:text-5xl shrink-0">📦</span>
              <h2 className="text-sm md:text-xl font-black text-slate-700 leading-tight">
                {levelParam === 8 ? "แยกของเล่นบนพื้น และของเล่นที่บินได้" :
                  levelParam === 9 ? "ทิ้งสิ่งของที่ไม่เข้าพวกออกไป!" :
                    levelParam === 10 ? "แยกคำขอบคุณ/ขอโทษ ออกจากคำไม่ดี" :
                      "ลากสิ่งของใส่กล่องให้ถูกต้องตามหมวดหมู่"}
              </h2>
            </div>
            <div className="flex flex-col items-center shrink-0">
              <div className="bg-pink-500 text-white px-3 py-1 rounded-xl font-bold text-[10px] md:text-xs uppercase tracking-tighter shadow-sm z-10">Score</div>
              <div className="bg-yellow-400 w-10 h-10 md:w-14 md:h-14 rounded-full border-4 border-white flex items-center justify-center text-white font-black text-lg md:text-2xl shadow-md -mt-3">
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
