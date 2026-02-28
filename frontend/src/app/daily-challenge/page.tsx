'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getCountdownToReset,
  getDateKey,
} from '@/lib/dailyChallenge'
import { useProgress } from '@/contexts/ProgressContext'
import { useLevelSystem } from '@/hooks/useLevelSystem'

export default function DailyChallengePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState('')
  const [dateKey] = useState(() => getDateKey())
  const [userRank, setUserRank] = useState(1)
  const [isDone, setIsDone] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)
  const [hasSynced, setHasSynced] = useState(false)

  const { progress, isLoading } = useProgress()
  const { saveProgress, getDailyProgress, isDailyComplete, addKeys, getKeys } = useLevelSystem()

  // Results from Context/Backend
  const [scores, setScores] = useState({ management: 0, calculation: 0, spatial: 0 })
  const [todayModes, setTodayModes] = useState({ management: false, calculation: false, spatial: false })

  useEffect(() => {
    const tick = () => setCountdown(getCountdownToReset())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (isLoading || !progress) return

    // 1. Calculations
    const dk = getDateKey()
    const maxUnlocked = Math.max(...(progress.unlockedVillages || [1]), 1)

    // Only update states if they have actually changed to avoid infinite loops
    if (userRank !== maxUnlocked) {
      setUserRank(maxUnlocked)
    }

    const currentLocalModes = getDailyProgress(dk)
    const currentIsDone = isDailyComplete(dk)

    // Initial load from context (only if not synced yet)
    if (!hasSynced) {
      setTodayModes(currentLocalModes)
      setIsDone(currentIsDone)

      if (currentIsDone) {
        const dailyScores = progress.dailyScores?.[dk] || { management: 0, calculation: 0, spatial: 0 }
        setScores({
          management: dailyScores.management || 0,
          calculation: dailyScores.calculation || 0,
          spatial: dailyScores.spatial || 0
        })
      }
    }

    // 2. Asynchronous Sync with Backend (only once)
    if (progress.guestId && !hasSynced) {
      setHasSynced(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

      fetch(`${API_BASE_URL}/api/daily/status/${progress.guestId}?date=${dk}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            const dbModes = res.data.completedModes
            setTodayModes(dbModes)
            setIsDone(res.data.allDone)
            if (res.data.rewardClaimed) setRewardClaimed(true)

            // Sync back to context only if remote is ahead
            if (JSON.stringify(currentLocalModes) !== JSON.stringify(dbModes)) {
              // Note: Use the functional version of path or a careful merge
              const nextP = { ...progress, daily: { ...progress.daily, [dk]: dbModes } }
              saveProgress(nextP)
            }
          }
        })
        .catch(err => console.error('Failed to sync daily status with backend', err))
    }
  }, [isLoading, progress?.guestId, progress?.unlockedVillages, hasSynced])

  const handleClaimReward = () => {
    if (rewardClaimed) return
    addKeys(3) // Match backend reward (3 keys)
    setRewardClaimed(true)

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
    if (progress.guestId) {
      fetch(`${API_BASE_URL}/api/daily/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: progress.guestId, dateKey })
      }).catch(err => console.error(err))
    }

    alert('ยินดีด้วย! คุณได้รับกุญแจ 🗝️ 3 ดอก เป็นรางวัลสำหรับภารกิจวันนี้!')
  }


  const startNextMode = () => {
    if (!todayModes.management) {
      router.push(`/minigame/management?mode=daily&villageId=${userRank}&level=${userRank}&subId=1`)
    } else if (!todayModes.calculation) {
      router.push(`/minigame/calculation?mode=daily&villageId=${userRank}&level=${userRank}&subId=1`)
    } else if (!todayModes.spatial) {
      router.push(`/minigame/spatial?mode=daily&villageId=${userRank}&level=${userRank}&subId=1`)
    }
  }

  const { currentKeys } = getKeys()

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center py-10 px-4 font-['Supermarket']">
      <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-[3rem] shadow-[15px_15px_0_rgba(0,0,0,0.05)] overflow-hidden border-4 border-[var(--border-dark)] p-8 md:p-12 relative">

        {/* Header Section */}
        <div className="text-center mb-6 md:mb-10">
          <div className="inline-block px-4 md:px-6 py-1 md:py-2 bg-[var(--bg-warm)] text-[var(--text-main)] border-2 border-[var(--border-dark)] rounded-full font-black text-xs md:text-sm uppercase tracking-widest mb-4">
            Today's Mission
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[var(--text-main)] tracking-tight mb-2 uppercase">
            🌟 ภารกิจรายวัน
          </h1>
          <p className="text-[var(--text-muted)] font-bold text-sm md:text-base">ฝึกฝนทักษะให้ครบ 3 ด้าน เพื่อรับรางวัลพิเศษ</p>
        </div>

        {/* Progress Checklist Area */}
        <div className="bg-[var(--bg-warm)]/30 rounded-3xl md:rounded-[2.5rem] p-4 md:p-8 mb-6 md:mb-8 border-2 border-[var(--border-dark)]">
          <h2 className="text-[var(--text-muted)] font-black text-[10px] md:text-[12px] uppercase tracking-widest mb-4 md:mb-6 px-2 opacity-60">Checkpoint Checklist</h2>

          <div className="grid gap-3 md:gap-4">
            {/* Management Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-3 transition-all ${todayModes.management ? 'bg-green-100 border-green-600' : 'bg-[var(--card-bg)] border-[var(--border-dark)]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border-2 border-current flex items-center justify-center text-2xl ${todayModes.management ? 'bg-green-500 text-white border-green-700' : 'bg-[var(--bg-warm)] text-[var(--text-muted)] border-[var(--border-dark)]'}`}>
                  {todayModes.management ? '✅' : '📦'}
                </div>
                <div>
                  <h3 className={`font-black text-xl ${todayModes.management ? 'text-green-800' : 'text-[var(--text-main)]'}`}>📋 การจัดการ</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">Management Challenge</p>
                </div>
              </div>
              {todayModes.management && <span className="text-green-600 font-black text-sm">DONE</span>}
            </div>

            {/* Calculation Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-3 transition-all ${todayModes.calculation ? 'bg-green-100 border-green-600' : 'bg-[var(--card-bg)] border-[var(--border-dark)]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border-2 border-current flex items-center justify-center text-2xl ${todayModes.calculation ? 'bg-green-500 text-white border-green-700' : 'bg-[var(--bg-warm)] text-[var(--text-muted)] border-[var(--border-dark)]'}`}>
                  {todayModes.calculation ? '✅' : '🧮'}
                </div>
                <div>
                  <h3 className={`font-black text-xl ${todayModes.calculation ? 'text-green-800' : 'text-[var(--text-main)]'}`}>🧮 การคำนวณ</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">Calculation Challenge</p>
                </div>
              </div>
              {todayModes.calculation && <span className="text-green-600 font-black text-sm">DONE</span>}
            </div>

            {/* Spatial Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-3 transition-all ${todayModes.spatial ? 'bg-green-100 border-green-600' : 'bg-[var(--card-bg)] border-[var(--border-dark)]'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl border-2 border-current flex items-center justify-center text-2xl ${todayModes.spatial ? 'bg-green-500 text-white border-green-700' : 'bg-[var(--bg-warm)] text-[var(--text-muted)] border-[var(--border-dark)]'}`}>
                  {todayModes.spatial ? '✅' : '🧭'}
                </div>
                <div>
                  <h3 className={`font-black text-xl ${todayModes.spatial ? 'text-green-800' : 'text-[var(--text-main)]'}`}>🧭 พื้นที่</h3>
                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest opacity-60">Spatial Challenge</p>
                </div>
              </div>
              {todayModes.spatial && <span className="text-green-600 font-black text-sm">DONE</span>}
            </div>
          </div>
        </div>

        {/* Reward Area */}
        {isDone ? (
          <div className="text-center animate-in zoom-in">
            {!rewardClaimed ? (
              <div className="bg-[var(--border-dark)] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 text-[var(--text-on-dark)] shadow-xl">
                <div className="text-5xl md:text-6xl mb-4">🔑</div>
                <h4 className="text-2xl md:text-3xl font-black mb-2 italic uppercase">Congratulation!</h4>
                <p className="opacity-80 font-bold mb-4 md:mb-6 text-sm md:text-base">คุณทำสำเร็จครบทุกภารกิจแล้ว! รับกุญแจรางวัลของคุณเลย</p>
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-[var(--card-bg)] text-[var(--border-dark)] py-4 rounded-xl md:rounded-2xl font-black text-xl md:text-2xl hover:translate-y-[-4px] transition-all shadow-[0_6px_0_#000] md:shadow-[0_8px_0_#000] active:translate-y-0 active:shadow-none border-2 border-black"
                >
                  รับกุญแจ 🗝️ (+1 Key)
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-warm)] rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border-4 border-[var(--border-dark)]">
                <div className="text-4xl md:text-5xl mb-4">✨</div>
                <h4 className="text-xl md:text-2xl font-black mb-2 uppercase">ภารกิจวันนี้เสร็จสิ้น</h4>
                <p className="text-[var(--text-muted)] text-xs md:text-sm mb-4 md:mb-6 font-bold">คุณได้รับรางวัลของวันไปแล้ว พักผ่อนและกลับมาใหม่ในวันถัดไป!</p>
                <div className="flex flex-col items-center justify-center gap-1 bg-[var(--card-bg)] py-2 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl border-2 border-[var(--border-dark)] inline-flex">
                  <span className="text-[8px] md:text-[10px] uppercase font-black tracking-widest opacity-50">Resetting In</span>
                  <span className="text-2xl md:text-3xl tabular-nums font-black">{countdown}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 md:gap-4">
            <button
              onClick={startNextMode}
              className="w-full py-4 md:py-6 bg-[var(--border-dark)] text-[var(--text-on-dark)] rounded-2xl md:rounded-[2rem] font-black text-xl md:text-3xl shadow-[0_6px_0_rgba(0,0,0,0.2)] md:shadow-[0_10px_0_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 active:scale-95 border-2 border-black"
            >
              เริ่มภารกิจต่อไป 🚀
            </button>
            <div className="flex items-center justify-center gap-3 text-[var(--text-muted)] py-4 opacity-50">
              <span className="w-12 h-[2px] bg-[var(--border-dark)]"></span>
              <span className="text-xs font-black uppercase tracking-widest">Village {userRank} Difficulty</span>
              <span className="w-12 h-[2px] bg-[var(--border-dark)]"></span>
            </div>
          </div>
        )}

        <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t-2 border-[var(--border-dark)] flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[8px] md:text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Current Keys</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-black text-[var(--text-main)]">{currentKeys}</span>
              <span className="text-xl md:text-2xl">🔑</span>
            </div>
          </div>
          <Link href="/world" className="bg-[var(--bg-warm)] border-2 border-[var(--border-dark)] px-3 md:px-4 py-2 rounded-full font-black text-xs md:text-sm hover:translate-y-[-2px] transition-all shadow-[2px_2px_0_#000] md:shadow-[3px_3px_0_#000]">ไปยังแผนที่โลก 🌏</Link>
        </div>

      </div>
    </div>
  )
}
