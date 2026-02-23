'use client'

import { useState, useEffect } from 'react'

interface TimerProps {
  isRunning: boolean
  initialSeconds?: number
  onTimeUp?: () => void
}

export default function Timer({ isRunning, initialSeconds = 60, onTimeUp }: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (!isRunning) {
      // ไม่ reset ถ้าเวลาเป็น 0 (หมดเวลาแล้ว)
      if (seconds !== 0) {
        setSeconds(initialSeconds)
      }
      return
    }

    if (seconds <= 0) {
      onTimeUp?.()
      return
    }

    const interval = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) {
          // onTimeUp?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, seconds, onTimeUp, initialSeconds])

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return (
    <div className="timer">
      <span className="timer-label">เวลา:</span>
      <span className="timer-value" style={{ color: seconds <= 10 ? 'red' : 'inherit' }}>
        {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
      </span>
    </div>
  )
}
