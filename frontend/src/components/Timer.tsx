'use client'

import { useState, useEffect } from 'react'

interface TimerProps {
  isRunning: boolean
  onReset?: () => void
}

export default function Timer({ isRunning, onReset }: TimerProps) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0)
      return
    }

    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  useEffect(() => {
    if (onReset) {
      setSeconds(0)
    }
  }, [onReset])

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return (
    <div className="timer">
      <span className="timer-label">เวลา:</span>
      <span className="timer-value">
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </span>
    </div>
  )
}
