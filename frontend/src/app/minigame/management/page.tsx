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
  const [moves, setMoves] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  const [items, setItems] = useState<Item[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    // สมมติตั้งแต่ระดับ 1-10 ให้ใช้ Layout การกระจายไอเทมหามุมแบบในรูป
    switch (levelParam) {
      case 1:
        setCategories([
          // NOTE: หากมีรูปกล่องของจริง ให้ใส่ path รูปภาพลงไปใน boxImageUrl: '/assets/your_box_image.png' ตรงนี้ได้เลย
          // ตอนนี้ไม่ได้ใส่ boxImageUrl ไป เพื่อให้ระบบแสดง emoji 📦 เป็น Placeholder ตามที่ต้องการ
          { id: 'cat:red', title: 'สีแดง', accepts: i => i.color === 'red' },
          { id: 'cat:circle', title: 'ทรงกลม', accepts: i => i.shape === 'circle' },
        ])
        setItems([
          // NOTE: หากมีรูปไอเทมจริง เช่น รูปลูกบอล รูปแอปเปิล ให้ใส่ path ใน imageUrl: '/assets/your_item_image.png' แทนคำว่า '' ด้านล่าง
          // ถ้ามี imageUrl ตัว emoji จะถูกซ่อนอัตโนมัติ
          { id: 'i1', label: 'แอปเปิลแดง', emoji: '🍎', imageUrl: '', color: 'red', shape: 'other', initialTop: '35%', initialLeft: '35%' },
          { id: 'i2', label: 'เหรียญ', emoji: '🪙', imageUrl: '', color: 'yellow', shape: 'circle', initialTop: '25%', initialLeft: '15%' },
          { id: 'i3', label: 'ลูกบอล', emoji: '⚽', imageUrl: '', color: 'mixed', shape: 'circle', initialTop: '30%', initialLeft: '80%' },
          { id: 'i4', label: 'เข็มหมุด', emoji: '📌', imageUrl: '', color: 'red', shape: 'other', initialTop: '50%', initialLeft: '65%' },
          { id: 'i5', label: 'ลูกพีช', emoji: '🍑', imageUrl: '', color: 'red', shape: 'other', initialTop: '28%', initialLeft: '55%' },
        ])
        break
      default:
        // Placeholder สำหรับระดับ 2-10
        setCategories([
          { id: 'cat:1', title: `หมวดหมู่ A (ระดับ ${levelParam})`, accepts: i => i.color === 'red' },
          { id: 'cat:2', title: `หมวดหมู่ B (ระดับ ${levelParam})`, accepts: i => i.shape === 'circle' },
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

    setMoves(moves + 1)
    const isCorrect = category.accepts(item)

    setItems(prev => {
      const newItems = prev.map(i =>
        i.id === itemId ? { ...i, placedInCategoryId: isCorrect ? categoryId : undefined } : i
      )
      if (newItems.every(i => i.placedInCategoryId)) {
        setIsGameOver(true)
      }
      return newItems
    })

    setScore(score + (isCorrect ? 50 : -5))
  }

  const unplacedItems = items.filter(i => !i.placedInCategoryId)

  return (
    <div className="game-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>

      {!isGameStarted && !isGameOver && (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h1 className="game-title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            ด่าน {subId} - จัดหมวดหมู่
          </h1>
          <p style={{ fontSize: '1.4rem', marginBottom: '2rem', color: '#ffd700' }}>
            ความยากระดับ {levelParam}
          </p>
          <button className="start-button" style={{ padding: '1.5rem 4rem', fontSize: '1.5rem' }} onClick={() => setIsGameStarted(true)}>
            เริ่มเกม 🚀
          </button>
        </div>
      )}

      {isGameOver && (
        <div className="dc-card" style={{ marginTop: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '5rem', marginBottom: '0.5rem' }}>🌟</div>
          <h2>ยอดเยี่ยม! แยกหมวดหมู่เสร็จแล้ว</h2>
          <p style={{ marginTop: '1rem', fontSize: '1.5rem' }}>คะแนนของคุณ: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{score}</span></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '2.5rem' }}>
            {subId < 12 ? (
              <button
                className="start-button"
                style={{ marginBottom: 0 }}
                onClick={() => router.push(`/world/${villageId}/sublevel/${subId + 1}`)}
              >
                ด่านต่อไป 🚀
              </button>
            ) : villageId < 10 ? (
              <button
                className="start-button"
                style={{ marginBottom: 0, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
                onClick={() => router.push(`/world/${villageId + 1}`)}
              >
                หมู่บ้านถัดไป 🏘️
              </button>
            ) : null}
            <button
              className="start-button"
              style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', marginBottom: 0, marginTop: (subId < 12 || villageId < 10) ? '1rem' : 0 }}
              onClick={() => router.push(`/world/${villageId}`)}
            >
              กลับสู่แผนที่ 🗺️
            </button>
          </div>
        </div>
      )}

      {isGameStarted && !isGameOver && (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '650px',
          backgroundColor: '#e5e7eb',
          borderRadius: '24px',
          border: '6px solid #fff',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>

          {/* Top Bar matching reference */}
          <div style={{
            height: '80px',
            backgroundColor: '#fff',
            borderBottom: '4px solid #f472b6',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 2rem',
            position: 'relative',
            zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '2.5rem' }}>🍇</div> {/* Placeholder mascot */}
              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#333' }}>
                จงแยกวัตถุที่มีสีแดง และวัตถุทรงกลม
              </h2>
            </div>

            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', transform: 'translateY(15px)' }}>
              <div style={{ background: 'linear-gradient(90deg, #f59e0b, #ec4899)', padding: '0.4rem 1.5rem', borderRadius: '16px', color: '#fff', fontWeight: 900, fontSize: '1.2rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                SCORE
              </div>
              <div style={{
                backgroundColor: '#fbbf24',
                color: '#fff',
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 900,
                fontSize: '1.3rem',
                marginTop: '-10px',
                border: '3px solid #fff',
                zIndex: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {score}
              </div>
            </div>
          </div>

          {/* Playing Field */}
          <div style={{ flex: 1, position: 'relative', width: '100%' }}>

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
                style={{
                  position: 'absolute',
                  top: item.initialTop || '50%',
                  left: item.initialLeft || '50%',
                  transform: 'translate(-50%, -50%)',
                  cursor: 'grab',
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '4rem',
                  userSelect: 'none',
                  transition: 'transform 0.1s',
                  zIndex: 5
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1.15)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translate(-50%, -50%) scale(1)'}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                ) : (
                  <span style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>{item.emoji}</span>
                )}
              </div>
            ))}

            {/* Baskets/Boxes at Bottom */}
            <div style={{ position: 'absolute', bottom: '2rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8rem', zIndex: 2 }}>
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
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'transform 0.2s'
                  }}
                >
                  <div style={{ width: '160px', height: '140px', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', position: 'relative' }}>
                    {cat.boxImageUrl ? (
                      <img src={cat.boxImageUrl} alt={cat.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0px 10px 15px rgba(0,0,0,0.2))' }} />
                    ) : (
                      <div style={{ fontSize: '7rem', filter: 'drop-shadow(0px 10px 10px rgba(0,0,0,0.3))' }}>📦</div>
                    )}
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#4b5563' }}>
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
