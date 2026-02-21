'use client'

import { useState, type DragEvent } from 'react'
import type { Item } from './DraggableItem'

export interface Category {
  id: string
  title: string
  accepts: (item: Item) => boolean
}

export default function CategoryBox({
  category,
  items,
  onDropItem
}: {
  category: Category
  items: Item[]
  onDropItem: (itemId: string) => void
}) {
  const [isOver, setIsOver] = useState(false)

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(true)
  }

  const onDragLeave = () => setIsOver(false)

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsOver(false)
    const itemId = e.dataTransfer.getData('text/plain')
    if (!itemId) return
    onDropItem(itemId)
  }

  return (
    <div
      className={`category-box ${isOver ? 'is-over' : ''}`}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="category-title">{category.title}</div>

      <div className="category-droparea">
        {items.length === 0 ? (
          <div className="category-placeholder">ลากของมาวางที่นี่</div>
        ) : (
          <div className="placed-grid">
            {items.map(item => (
              <div key={item.id} className="placed-chip" title={item.label}>
                <span className="emoji">{item.emoji}</span>
                <span className="chip-text">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}