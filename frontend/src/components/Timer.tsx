'use client'

import { useState, useEffect } from 'react'

interface TimerProps {
  isRunning: boolean
  initialSeconds?: number
  onTimeUp?: () => void
  mode?: 'up' | 'down'
}

export default function Timer({ isRunning, initialSeconds = 60, onTimeUp, mode = 'down' }: TimerProps) {
  const [seconds, setSeconds] = useState(mode === 'down' ? initialSeconds : 0)

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (mode === 'down') {
          if (prev <= 1) {
            onTimeUp?.()
            clearInterval(interval)
            return 0
          }
          return prev - 1
        } else {
          return prev + 1
        }
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, onTimeUp, mode])

  useEffect(() => {
    if (!isRunning && mode === 'down') {
      setSeconds(initialSeconds)
    }
    if (!isRunning && mode === 'up') {
      setSeconds(0)
    }
  }, [isRunning, initialSeconds, mode])

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return (
    <div className="timer">
      <span className="timer-label">เวลา:</span>
      <span className="timer-value" style={{ color: mode === 'down' && seconds <= 10 ? 'red' : 'inherit' }}>
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </span>
    </div>
  )
}
