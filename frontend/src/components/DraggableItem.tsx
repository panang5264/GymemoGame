'use client'

import { useState, type DragEvent } from 'react'

type Color = 'red' | 'yellow' | 'green'
type Shape = 'circle' | 'square' | 'triangle'

export interface Item {
  id: string
  label: string
  emoji: string
  color: Color
  shape: Shape
  placedInCategoryId?: string
}

export default function DraggableItem({ item }: { item: Item }) {
  const [isDragging, setIsDragging] = useState(false)

  const onDragStart = (e: DragEvent<HTMLDivElement>) => {
    setIsDragging(true)
    e.dataTransfer.setData('text/plain', item.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragEnd = () => setIsDragging(false)

  return (
    <div
      className={`draggable-item ${isDragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      aria-label={item.label}
      title="ลากไปวางในกล่องที่ถูกต้อง"
    >
      <div className="item-emoji">{item.emoji}</div>
      <div className="item-text">
        <div className="item-label">{item.label}</div>
        <div className="item-meta">
          สี: {item.color} • รูปทรง: {item.shape}
        </div>
      </div>
    </div>
  )
}