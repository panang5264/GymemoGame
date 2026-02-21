'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  getVillage1Progress,
  completeVillage1SubLevel,
  isVillage1Completed,
  VILLAGE1_TOTAL_LEVELS,
} from '@/lib/progression'
import { getKeys, consumeKey } from '@/lib/levelSystem'
import ConfirmUseKeyModal from '@/components/ConfirmUseKeyModal'

// ─── Card matching mini-game data ───────────────────────────────────────────

const EMOJI_SETS = [
  ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇'],
  ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊'],
  ['⚽', '🏀', '🎾', '🏈', '🎱', '🏐'],
  ['🚗', '🚕', '🚙', '🚌', '🏎', '🚓'],
  ['🌸', '🌻', '🌺', '🌹', '🌷', '🌼'],
  ['🎸', '🎹', '🥁', '🎺', '🎻', '🪕'],
  ['🍕', '🍔', '🌮', '🍜', '🍣', '🍦'],
  ['✈️', '🚀', '🛸', '🚁', '⛵', '🚂'],
  ['🎃', '🎄', '🎆', '🎇', '🧨', '🎉'],
  ['💎', '🔑', '🗝️', '⚔️', '🛡️', '🏆'],
  ['🦁', '🐯', '🐻', '🐼', '🦊', '🐺'],
  ['🌍', '🌙', '⭐', '☀️', '🌈', '❄️'],
]

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

function shuffleCards(emojis: string[]): Card[] {
  const pairs = emojis.flatMap((emoji, i) => [
    { id: i * 2, emoji, isFlipped: false, isMatched: false },
    { id: i * 2 + 1, emoji, isFlipped: false, isMatched: false },
  ])
  return pairs.sort(() => Math.random() - 0.5)
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function VillagePage() {
  const [progress, setProgress] = useState(0)
  const [village1Done, setVillage1Done] = useState(false)
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matched, setMatched] = useState(0)
  const [moves, setMoves] = useState(0)
  const [phase, setPhase] = useState<'start' | 'playing' | 'level_clear'>('start')
  const [modalOpen, setModalOpen] = useState(false)
  const [keysLeft, setKeysLeft] = useState(0)

  // Current level index (0-based)
  const currentLevel = Math.min(progress, VILLAGE1_TOTAL_LEVELS - 1)
  // Number of pairs in the current level
  const currentLevelPairs = EMOJI_SETS[currentLevel % EMOJI_SETS.length].length

  // Read progress from localStorage on mount
  useEffect(() => {
    const p = getVillage1Progress()
    setProgress(p)
    setVillage1Done(isVillage1Completed())
    const { currentKeys } = getKeys()
    setKeysLeft(currentKeys)
  }, [])

  const startLevel = useCallback(() => {
    const emojis = EMOJI_SETS[currentLevel % EMOJI_SETS.length]
    setCards(shuffleCards(emojis))
    setFlipped([])
    setMatched(0)
    setMoves(0)
    setPhase('playing')
  }, [currentLevel])

  const handleCardClick = (cardId: number) => {
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flipped.length >= 2) return

    const newFlipped = [...flipped, cardId]
    setFlipped(newFlipped)
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, isFlipped: true } : c))

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped
      const cardA = cards.find(c => c.id === a)
      const cardB = cards.find(c => c.id === b)
      const newMoves = moves + 1
      setMoves(newMoves)

      if (cardA && cardB && cardA.emoji === cardB.emoji) {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === a || c.id === b ? { ...c, isMatched: true, isFlipped: false } : c
            )
          )
          setFlipped([])
          const newMatched = matched + 1
          setMatched(newMatched)
          if (newMatched === currentLevelPairs) {
            setTimeout(() => {
              completeVillage1SubLevel()
              const newProgress = getVillage1Progress()
              setProgress(newProgress)
              setVillage1Done(isVillage1Completed())
              setPhase('level_clear')
            }, 400)
          }
        }, 500)
      } else {
        setTimeout(() => {
          setCards(prev =>
            prev.map(c =>
              c.id === a || c.id === b ? { ...c, isFlipped: false } : c
            )
          )
          setFlipped([])
        }, 900)
      }
    }
  }

  // ── Village 1 already completed ───────────────────────────────────────────
  if (village1Done) {
    return (
      <div className="game-page">
        <h1 className="game-title">🏡 หมู่บ้าน 1 – สำเร็จแล้ว!</h1>
        <div className="game-over">
          <p className="village-complete-text">
            🎉 คุณผ่านหมู่บ้าน 1 ครบ {VILLAGE1_TOTAL_LEVELS} ด่านแล้ว!
          </p>
          <p className="village-complete-text">ตอนนี้ภารกิจพิเศษรายวันพร้อมใช้งาน!</p>
          <Link href="/daily-challenge" className="cta-button" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
            🌟 ไปยังภารกิจรายวัน
          </Link>
        </div>
      </div>
    )
  }

  // ── Start screen ──────────────────────────────────────────────────────────
  if (phase === 'start') {
    return (
      <div className="game-page">
        <h1 className="game-title">🏡 หมู่บ้าน 1</h1>
        <div className="village-progress-bar-wrap">
          <div
            className="village-progress-bar"
            style={{ width: `${(progress / VILLAGE1_TOTAL_LEVELS) * 100}%` }}
          />
        </div>
        <p className="village-progress-text">
          ความคืบหน้า: {progress} / {VILLAGE1_TOTAL_LEVELS} ด่าน
        </p>
        <div className="game-over" style={{ marginTop: '1.5rem' }}>
          <h2>ด่านที่ {progress + 1}</h2>
          <p style={{ margin: '1rem 0', opacity: 0.85 }}>
            จับคู่การ์ดให้ครบเพื่อผ่านด่านนี้
          </p>
          <button
            className="start-button"
            onClick={() => setModalOpen(true)}
          >
            เริ่มด่านที่ {progress + 1} 🚀
          </button>
        </div>
        <ConfirmUseKeyModal
          open={modalOpen}
          keysLeft={keysLeft}
          onCancel={() => setModalOpen(false)}
          onConfirm={() => {
            const ok = consumeKey()
            if (ok) {
              setKeysLeft(k => k - 1)
              setModalOpen(false)
              startLevel()
            } else {
              setModalOpen(false)
            }
          }}
        />
      </div>
    )
  }

  // ── Level clear screen ────────────────────────────────────────────────────
  if (phase === 'level_clear') {
    return (
      <div className="game-page">
        <h1 className="game-title">🏡 หมู่บ้าน 1</h1>
        <div className="village-progress-bar-wrap">
          <div
            className="village-progress-bar"
            style={{ width: `${(progress / VILLAGE1_TOTAL_LEVELS) * 100}%` }}
          />
        </div>
        <p className="village-progress-text">
          ความคืบหน้า: {progress} / {VILLAGE1_TOTAL_LEVELS} ด่าน
        </p>
        <div className="game-over" style={{ marginTop: '1.5rem' }}>
          <h2>🎉 ผ่านด่านที่ {progress}!</h2>
          <p style={{ margin: '0.5rem 0' }}>ใช้ {moves} ครั้ง</p>
          {progress < VILLAGE1_TOTAL_LEVELS ? (
            <button className="start-button" onClick={() => setPhase('start')}>
              ด่านถัดไป ➡️
            </button>
          ) : (
            <Link href="/daily-challenge" className="cta-button" style={{ marginTop: '1.5rem', display: 'inline-block' }}>
              🌟 ไปยังภารกิจรายวัน
            </Link>
          )}
        </div>
      </div>
    )
  }

  // ── Playing ───────────────────────────────────────────────────────────────
  return (
    <div className="game-page">
      <h1 className="game-title">🏡 หมู่บ้าน 1 – ด่าน {progress + 1}</h1>
      <p className="village-progress-text" style={{ marginBottom: '1rem' }}>
        ครั้ง: {moves} &nbsp;|&nbsp; คู่ที่จับได้: {matched} / {currentLevelPairs}
      </p>
      <div className="game-board">
        {cards.map(card => (
          <div
            key={card.id}
            className={`game-card ${card.isFlipped || card.isMatched ? 'flipped' : ''} ${card.isMatched ? 'matched' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-inner">
              <div className="card-front">❓</div>
              <div className="card-back">{card.emoji}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
