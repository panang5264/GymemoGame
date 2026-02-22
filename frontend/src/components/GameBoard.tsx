'use client'

import { useEffect, useMemo, useState } from 'react'
import CategoryBox from './CategoryBox'
import DraggableItem from './DraggableItem'

type Color = 'red' | 'yellow' | 'green'
type Shape = 'circle' | 'square' | 'triangle'
type CategoryMode = 'color' | 'shape' | 'both'

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

interface LevelConfig {
  categoryMode: CategoryMode
  itemIds: string[]
  pointsPerCorrect: number
  penaltyPerMistake: number
  subtitle: string
}

interface GameBoardProps {
  onGameOver: (score: number, moves: number) => void
  onScoreChange: (score: number) => void
  onMovesChange: (moves: number) => void
  level?: number
}

const ALL_ITEMS: Omit<Item, 'placedInCategoryId'>[] = [
  { id: 'i1', label: 'แอปเปิลแดง (วงกลม)', emoji: '🍎', color: 'red', shape: 'circle' },
  { id: 'i2', label: 'เลมอน (วงกลม)', emoji: '🍋', color: 'yellow', shape: 'circle' },
  { id: 'i3', label: 'กีวี (วงกลม)', emoji: '🥝', color: 'green', shape: 'circle' },
  { id: 'i4', label: 'สี่เหลี่ยมแดง', emoji: '🟥', color: 'red', shape: 'square' },
  { id: 'i5', label: 'สี่เหลี่ยมเหลือง', emoji: '🟨', color: 'yellow', shape: 'square' },
  { id: 'i6', label: 'สามเหลี่ยมเขียว', emoji: '🔺', color: 'green', shape: 'triangle' },
]

// 14 level configs – levels 1-4 are reached from world sublevel navigation (subId 1-4).
// Higher levels increase difficulty via more items, harder scoring, or both category modes.
const LEVEL_CONFIGS: LevelConfig[] = [
  // 1 – easy: color only, 3 items
  { categoryMode: 'color', itemIds: ['i1','i2','i3'],         pointsPerCorrect: 50, penaltyPerMistake: 5,  subtitle: 'ด่าน 1: แยกสี (3 ชิ้น) — ลากของไปวางในกล่องสีที่ถูกต้อง' },
  // 2 – easy: shape only, 3 items
  { categoryMode: 'shape', itemIds: ['i1','i4','i6'],         pointsPerCorrect: 50, penaltyPerMistake: 5,  subtitle: 'ด่าน 2: แยกรูปทรง (3 ชิ้น) — ลากของไปวางในกล่องรูปทรงที่ถูกต้อง' },
  // 3 – medium: color only, all 6 items
  { categoryMode: 'color', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 50, penaltyPerMistake: 10, subtitle: 'ด่าน 3: แยกสี (6 ชิ้น) — ระวังโทษ!' },
  // 4 – medium: shape only, all 6 items
  { categoryMode: 'shape', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 50, penaltyPerMistake: 10, subtitle: 'ด่าน 4: แยกรูปทรง (6 ชิ้น) — ระวังโทษ!' },
  // 5 – medium: both modes, 4 items
  { categoryMode: 'both',  itemIds: ['i1','i2','i4','i6'],    pointsPerCorrect: 40, penaltyPerMistake: 10, subtitle: 'ด่าน 5: แยกสีและรูปทรง (4 ชิ้น)' },
  // 6 – medium: both modes, all 6 items
  { categoryMode: 'both',  itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 40, penaltyPerMistake: 15, subtitle: 'ด่าน 6: แยกสีและรูปทรง (6 ชิ้น)' },
  // 7 – hard: color only, penalty increases
  { categoryMode: 'color', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 30, penaltyPerMistake: 20, subtitle: 'ด่าน 7: แยกสี — โหมดยาก' },
  // 8 – hard: shape only
  { categoryMode: 'shape', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 30, penaltyPerMistake: 20, subtitle: 'ด่าน 8: แยกรูปทรง — โหมดยาก' },
  // 9 – hard: both modes
  { categoryMode: 'both',  itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 30, penaltyPerMistake: 20, subtitle: 'ด่าน 9: แยกสีและรูปทรง — โหมดยาก' },
  // 10 – very hard: both modes, high penalty
  { categoryMode: 'both',  itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 20, penaltyPerMistake: 25, subtitle: 'ด่าน 10: ผู้เชี่ยวชาญ — โทษสูง' },
  // 11 – expert: color, very high penalty
  { categoryMode: 'color', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 20, penaltyPerMistake: 30, subtitle: 'ด่าน 11: ผู้เชี่ยวชาญ — แยกสี' },
  // 12 – expert: shape, very high penalty
  { categoryMode: 'shape', itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 20, penaltyPerMistake: 30, subtitle: 'ด่าน 12: ผู้เชี่ยวชาญ — แยกรูปทรง' },
  // 13 – master: both, near-max penalty
  { categoryMode: 'both',  itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 15, penaltyPerMistake: 35, subtitle: 'ด่าน 13: มาสเตอร์' },
  // 14 – grandmaster: both, max penalty
  { categoryMode: 'both',  itemIds: ['i1','i2','i3','i4','i5','i6'], pointsPerCorrect: 10, penaltyPerMistake: 40, subtitle: 'ด่าน 14: แกรนด์มาสเตอร์' },
]

function getLevelConfig(level: number): LevelConfig {
  const idx = Math.max(1, Math.min(14, level)) - 1
  return LEVEL_CONFIGS[idx]
}

export default function GameBoard({ onGameOver, onScoreChange, onMovesChange, level = 1 }: GameBoardProps) {
  const config = useMemo(() => getLevelConfig(level), [level])

  const categories: Category[] = useMemo(() => {
    const colorCats: Category[] = [
      { id: 'color:red',    title: 'สีแดง',    accepts: item => item.color === 'red' },
      { id: 'color:yellow', title: 'สีเหลือง', accepts: item => item.color === 'yellow' },
      { id: 'color:green',  title: 'สีเขียว',  accepts: item => item.color === 'green' },
    ]
    const shapeCats: Category[] = [
      { id: 'shape:circle',   title: 'วงกลม',     accepts: item => item.shape === 'circle' },
      { id: 'shape:square',   title: 'สี่เหลี่ยม', accepts: item => item.shape === 'square' },
      { id: 'shape:triangle', title: 'สามเหลี่ยม', accepts: item => item.shape === 'triangle' },
    ]
    if (config.categoryMode === 'color') return colorCats
    if (config.categoryMode === 'shape') return shapeCats
    return [...colorCats, ...shapeCats]
  }, [config])

  const initialItems: Item[] = useMemo(
    () => ALL_ITEMS.filter(i => config.itemIds.includes(i.id)).map(i => ({ ...i })),
    [config]
  )

  const [items, setItems] = useState<Item[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    initializeGame()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialItems])

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

    const nextScore = Math.max(0, score + (isCorrect ? config.pointsPerCorrect : -config.penaltyPerMistake))
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
        <div className="subtitle">{config.subtitle}</div>
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