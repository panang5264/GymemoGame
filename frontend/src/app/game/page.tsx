'use client'

import { useState } from 'react'
import GameBoard from '@/components/GameBoard'
import ScoreBoard from '@/components/ScoreBoard'
import Timer from '@/components/Timer'

export default function GamePage() {
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [isGameStarted, setIsGameStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)
  const [timerReset, setTimerReset] = useState(0)

  const handleGameOver = (finalScore: number, finalMoves: number) => {
    setIsGameOver(true)
    setIsGameStarted(false)
  }

  const handleStartGame = () => {
    setScore(0)
    setMoves(0)
    setIsGameStarted(true)
    setIsGameOver(false)
    setTimerReset(prev => prev + 1)
  }

  return (
    <div className="game-page">
      <h1 className="game-title">🎮 เกมจับคู่การ์ด</h1>

      <div className="game-stats">
        <ScoreBoard score={score} moves={moves} />
        <Timer isRunning={isGameStarted} onReset={() => setTimerReset(prev => prev + 1)} />
      </div>

      {!isGameStarted && !isGameOver && (
        <button className="start-button" onClick={handleStartGame}>
          เริ่มเกม 🚀
        </button>
      )}

      {isGameOver && (
        <div className="game-over">
          <h2>🎉 เยี่ยมมาก!</h2>
          <p>คุณทำได้ {moves} ครั้ง</p>
          <p>คะแนน: {score}</p>
          <button className="start-button" onClick={handleStartGame}>
            เล่นอีกครั้ง 🔄
          </button>
        </div>
      )}

      {isGameStarted && (
        <GameBoard
          onGameOver={handleGameOver}
          onScoreChange={setScore}
          onMovesChange={setMoves}
        />
      )}
    </div>
  )
}
