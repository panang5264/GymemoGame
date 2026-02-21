'use client'

import { useEffect, useMemo, useState } from 'react'
import CategoryBox from './CategoryBox'
import DraggableItem from './DraggableItem'

type Color = 'red' | 'yellow' | 'green'
type Shape = 'circle' | 'square' | 'triangle'

interface Item {
  id: string
  label: string
  emoji: string
  color: Color
  shape: Shape
  placedInCategoryId?: string
}

interface Category {
  id: string
  title: string
  accepts: (item: Item) => boolean
}

interface GameBoardProps {
  onGameOver: (score: number, moves: number) => void
  onScoreChange: (score: number) => void
  onMovesChange: (moves: number) => void
}

// Mockup: Level 1 แยกสีและรูปทรง (1 ด่าน = 1 ชุด)
export default function GameBoard({ onGameOver, onScoreChange, onMovesChange }: GameBoardProps) {
  const categories: Category[] = useMemo(
    () => [
      { id: 'color:red', title: 'สีแดง', accepts: item => item.color === 'red' },
      { id: 'color:yellow', title: 'สีเหลือง', accepts: item => item.color === 'yellow' },
      { id: 'color:green', title: 'สีเขียว', accepts: item => item.color === 'green' },

      { id: 'shape:circle', title: 'วงกลม', accepts: item => item.shape === 'circle' },
      { id: 'shape:square', title: 'สี่เหลี่ยม', accepts: item => item.shape === 'square' },
      { id: 'shape:triangle', title: 'สามเหลี่ยม', accepts: item => item.shape === 'triangle' }
    ],
    []
  )

  const initialItems: Item[] = useMemo(
    () =>
      ([
        { id: 'i1', label: 'แอปเปิลแดง (วงกลม)', emoji: '🍎', color: 'red', shape: 'circle' },
        { id: 'i2', label: 'เลมอน (วงกลม)', emoji: '🍋', color: 'yellow', shape: 'circle' },
        { id: 'i3', label: 'กีวี (วงกลม)', emoji: '🥝', color: 'green', shape: 'circle' },
        { id: 'i4', label: 'สี่เหลี่ยมแดง', emoji: '🟥', color: 'red', shape: 'square' },
        { id: 'i5', label: 'สี่เหลี่ยมเหลือง', emoji: '🟨', color: 'yellow', shape: 'square' },
        { id: 'i6', label: 'สามเหลี่ยมเขียว', emoji: '🔺', color: 'green', shape: 'triangle' }
      ] as const).map(i => ({ ...i })) as Item[],
    []
  )

  const [items, setItems] = useState<Item[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const initializeGame = () => {
    setItems(initialItems.map(i => ({ ...i, placedInCategoryId: undefined })))
    setMoves(0)
    setScore(0)
    onMovesChange(0)
    onScoreChange(0)
  }

  const totalCount = items.length
  const placedCount = items.filter(i => i.placedInCategoryId).length

  const handleDropItemToCategory = (itemId: string, categoryId: string) => {
    const item = items.find(i => i.id === itemId)
    const category = categories.find(c => c.id === categoryId)
    if (!item || !category) return

    const newMoves = moves + 1
    setMoves(newMoves)
    onMovesChange(newMoves)

    const isCorrect = category.accepts(item)

    // วางถูก -> เข้า category, วางผิด -> กลับไปกองกลาง (undefined)
    setItems(prev =>
      prev.map(i =>
        i.id === itemId ? { ...i, placedInCategoryId: isCorrect ? categoryId : undefined } : i
      )
    )

    const nextScore = Math.max(0, score + (isCorrect ? 50 : -10))
    setScore(nextScore)
    onScoreChange(nextScore)

    // คำนวณจำนวนที่วาง (แบบคาดการณ์หลังอัปเดต)
    const nextPlacedCount =
      placedCount + (isCorrect ? 1 : 0) - (item.placedInCategoryId ? 1 : 0)

    if (totalCount > 0 && nextPlacedCount === totalCount) {
      onGameOver(nextScore, newMoves)
    }
  }

  const unplacedItems = items.filter(i => !i.placedInCategoryId)

  return (
  <div className="management-board">
    <div className="topbar">
      <div className="instructions">
        <div className="title">เกมแยกสิ่งของ (Management Mode)</div>
        <div className="subtitle">ด่าน 1: แยก “สี” และ “รูปทรง” — ลากของไปวางในกล่องที่ถูกต้อง</div>
      </div>

      <div className="stats">
        <div className="stat">คะแนน: <b>{score}</b></div>
        <div className="stat">ครั้งที่ลาก: <b>{moves}</b></div>
        <div className="stat">จัดแล้ว: <b>{placedCount}/{totalCount}</b></div>
      </div>
    </div>

    <div className="board">
      <section className="pool">
        <div className="section-title">ของที่ต้องจัด</div>
        <div className="pool-grid">
          {unplacedItems.map(item => (
            <DraggableItem key={item.id} item={item} />
          ))}
        </div>
      </section>

      <section className="categories">
        <div className="section-title">หมวดหมู่</div>
        <div className="categories-grid">
          {categories.map(cat => (
            <CategoryBox
              key={cat.id}
              category={cat}
              items={items.filter(i => i.placedInCategoryId === cat.id)}
              onDropItem={(itemId) => handleDropItemToCategory(itemId, cat.id)}
            />
          ))}
        </div>
      </section>
    </div>
  </div>
)
}