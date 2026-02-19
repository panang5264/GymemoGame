'use client'

import { useState, useEffect } from 'react'
import GameCard from './GameCard'

interface Card {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

interface GameBoardProps {
  onGameOver: (score: number, moves: number) => void
  onScoreChange: (score: number) => void
  onMovesChange: (moves: number) => void
}

// 8 คู่ emoji ผลไม้
const EMOJIS = ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🥝']

export default function GameBoard({ onGameOver, onScoreChange, onMovesChange }: GameBoardProps) {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [matchedPairs, setMatchedPairs] = useState(0)

  // Initialize cards
  useEffect(() => {
    initializeGame()
  }, [])

  const initializeGame = () => {
    // สร้างการ์ด 8 คู่ (16 ใบ)
    const cardPairs = EMOJIS.flatMap((emoji, index) => [
      { id: index * 2, emoji, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, emoji, isFlipped: false, isMatched: false }
    ])
    
    // Shuffle cards
    const shuffled = cardPairs.sort(() => Math.random() - 0.5)
    setCards(shuffled)
    setFlippedCards([])
    setMoves(0)
    setMatchedPairs(0)
    onMovesChange(0)
    onScoreChange(0)
  }

  const handleCardClick = (cardId: number) => {
    // ถ้าการ์ดถูก flip หรือ match แล้ว หรือมีการ์ด 2 ใบที่กำลัง flip อยู่แล้ว ไม่ทำอะไร
    const card = cards.find(c => c.id === cardId)
    if (!card || card.isFlipped || card.isMatched || flippedCards.length >= 2) {
      return
    }

    const newFlippedCards = [...flippedCards, cardId]
    setFlippedCards(newFlippedCards)

    // Update card state
    setCards(cards.map(c => 
      c.id === cardId ? { ...c, isFlipped: true } : c
    ))

    // ถ้า flip การ์ดครบ 2 ใบแล้ว
    if (newFlippedCards.length === 2) {
      const newMoves = moves + 1
      setMoves(newMoves)
      onMovesChange(newMoves)

      const [firstId, secondId] = newFlippedCards
      const firstCard = cards.find(c => c.id === firstId)
      const secondCard = cards.find(c => c.id === secondId)

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        // Match!
        setTimeout(() => {
          setCards(cards.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isMatched: true, isFlipped: false } 
              : c
          ))
          setFlippedCards([])
          
          const newMatchedPairs = matchedPairs + 1
          setMatchedPairs(newMatchedPairs)
          
          // คำนวณคะแนน (ยิ่งใช้ครั้งน้อยยิ่งได้คะแนนสูง)
          const score = Math.max(1000 - (newMoves * 10), 100)
          onScoreChange(score)

          // ถ้าจับคู่ครบทั้งหมด
          if (newMatchedPairs === EMOJIS.length) {
            setTimeout(() => {
              onGameOver(score, newMoves)
            }, 500)
          }
        }, 500)
      } else {
        // ไม่ Match
        setTimeout(() => {
          setCards(cards.map(c => 
            c.id === firstId || c.id === secondId 
              ? { ...c, isFlipped: false } 
              : c
          ))
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  return (
    <div className="game-board">
      {cards.map(card => (
        <GameCard
          key={card.id}
          emoji={card.emoji}
          isFlipped={card.isFlipped}
          isMatched={card.isMatched}
          onClick={() => handleCardClick(card.id)}
        />
      ))}
    </div>
  )
}
