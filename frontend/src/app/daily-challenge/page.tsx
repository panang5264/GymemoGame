'use client'

import { useState, useEffect } from 'react'
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

  const { progress, isLoading, saveProgress } = useProgress()
  const { getDailyProgress, isDailyComplete, addKeys, getKeys } = useLevelSystem()

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

    const dk = getDateKey()
    const maxUnlocked = Math.max(...(progress.unlockedVillages || [1]), 1)

    if (userRank !== maxUnlocked) {
      setUserRank(maxUnlocked)
    }

    const currentLocalModes = getDailyProgress(dk)
    const currentIsDone = isDailyComplete(dk)

    // Initial load from local context
    if (!hasSynced) {
      setTodayModes(currentLocalModes)
      setIsDone(currentIsDone)

      const dailyScores = progress.dailyScores?.[dk] || { management: 0, calculation: 0, spatial: 0 }
      setScores({
        management: dailyScores.management || 0,
        calculation: dailyScores.calculation || 0,
        spatial: dailyScores.spatial || 0
      })
    }

    // Async sync with backend
    if (progress.guestId && !hasSynced) {
      setHasSynced(true)
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
      fetch(`${API_BASE_URL}/daily/status/${progress.guestId}?date=${dk}`)
        .then(res => res.json())
        .then(res => {
          if (res.success && res.data) {
            const dbModes = res.data.completedModes

            // Merge logic: prefer completed status from either source
            const mergedModes = {
              management: currentLocalModes.management || dbModes.management,
              calculation: currentLocalModes.calculation || dbModes.calculation,
              spatial: currentLocalModes.spatial || dbModes.spatial
            }

            setTodayModes(mergedModes)
            setIsDone(res.data.allDone || currentIsDone)
            if (res.data.rewardClaimed) setRewardClaimed(true)

            // If backend has more info, sync it to local
            const dbCount = Object.values(dbModes).filter(v => v).length
            const localCount = Object.values(currentLocalModes).filter(v => v).length

            if (dbCount > localCount) {
              const nextP = { ...progress, daily: { ...progress.daily, [dk]: mergedModes } }
              saveProgress(nextP)
            }
          }
        })
        .catch(err => console.error('Failed to sync daily status:', err))
    }
  }, [isLoading, progress?.guestId, progress?.unlockedVillages, hasSynced])

  const handleClaimReward = () => {
    if (rewardClaimed) return
    addKeys(3)
    setRewardClaimed(true)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
    if (progress.guestId) {
      fetch(`${API_BASE_URL}/daily/claim-reward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestId: progress.guestId, dateKey })
      }).catch(err => console.error(err))
    }

    alert('ยินดีด้วย! คุณได้รับกุญแจ 🗝️ 3 ดอก เป็นรางวัลสำหรับภารกิจวันนี้!')
  }

  const startNextMode = () => {
    router.push('/world')
  }

  useEffect(() => {
    if (!isLoading && progress) {
      getKeys()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, progress])

  const currentKeys = progress?.keys?.currentKeys ?? 0

  return (
    <div className="h-screen flex flex-col items-center py-2 px-4 font-['Supermarket'] overflow-hidden">
      {/* Scoring Hint */}
      <div className="w-full max-w-2xl bg-amber-50 border-2 border-amber-200 rounded-xl p-2.5 mb-3 text-amber-800 text-[10px] font-bold shadow-sm flex items-center gap-2 shrink-0">
        <span className="text-base">💡</span>
        <p>
          <span className="font-black">เคล็ดลับการสะสมคะแนน:</span> หากเล่นผ่านด่านโดยไม่ข้ามจะได้โบนัส <span className="text-orange-600 font-black">+50 x กุญแจ</span>
        </p>
      </div>

      <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-[2.5rem] shadow-[10px_10px_0_rgba(0,0,0,0.05)] overflow-hidden border-4 border-[var(--border-dark)] p-6 md:p-12 relative flex-1 min-h-0 flex flex-col">
        <div className="flex flex-row justify-between items-center mb-6 gap-2 shrink-0">
          <div>
            <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-1">
              ภารกิจรายวัน 📅
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px] md:text-sm">DAILY MISSION PROGRESS</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-xl border-2 border-slate-100 flex flex-col items-center shadow-inner">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">RESET IN</span>
            <span className="text-sm md:text-xl font-black text-blue-600 tabular-nums leading-none mt-0.5">{countdown}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1 custom-scrollbar">

          {/* Mission Status Grid */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            {[
              { id: 'management', label: 'จัดการ', emoji: '🍱', color: 'blue' },
              { id: 'calculation', label: 'คำนวณ', emoji: '🧮', color: 'orange' },
              { id: 'spatial', label: 'พื้นที่', emoji: '🧩', color: 'indigo' },
            ].map((m) => (
              <div key={m.id} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${todayModes[m.id as keyof typeof todayModes] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 opacity-60'}`}>
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className="font-black text-slate-800 text-[11px] leading-tight mb-1">{m.label}</div>
                <div className="flex items-center gap-1">
                  {todayModes[m.id as keyof typeof todayModes] ? (
                    <span className="text-green-600 font-black text-[9px] flex items-center">
                      ✓ สำเร็จ
                    </span>
                  ) : (
                    <span className="text-slate-300 font-bold text-[9px]">รอคอย</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50/50 rounded-[1.5rem] p-4 mb-6 border-2 border-slate-100/50">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-sm">
                <span>🏆 รวมวันนี้</span>
              </h3>
              <span className="text-2xl font-black text-blue-600">
                {scores.management + scores.calculation + scores.spatial}
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 font-bold">
                <span>การจัดการ:</span> <span className="text-slate-800">{scores.management}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>การคำนวณ:</span> <span className="text-slate-800">{scores.calculation}</span>
              </div>
              <div className="flex justify-between text-slate-500 font-bold">
                <span>มิติสัมพันธ์:</span> <span className="text-slate-800">{scores.spatial}</span>
              </div>
            </div>
          </div>

          {isDone ? (
            <div className="space-y-3">
              {rewardClaimed ? (
                <div className="bg-green-100 border-2 border-green-200 rounded-2xl p-4 text-center animate-in zoom-in duration-300">
                  <div className="text-3xl mb-1">🎉</div>
                  <p className="text-green-800 font-black text-base">รับรางวัลเรียบร้อยแล้ว!</p>
                  <p className="text-green-600 font-bold text-xs">มาสู้ใหม่ในวันพรุ่งนี้นะ</p>
                </div>
              ) : (
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-4 rounded-[1.5rem] text-xl shadow-[0_6px_0_#d97706] hover:translate-y-1 hover:shadow-[0_4px_0_#d97706] active:translate-y-[6px] active:shadow-none transition-all"
                >
                  รับรางวัลกุญแจ 🗝️ x3
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={startNextMode}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-[1.5rem] text-lg shadow-[0_6px_0_#1d4ed8] hover:translate-y-1 hover:shadow-[0_4px_0_#1d4ed8] active:translate-y-[6px] active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                ไปทำภารกิจที่แผนที่ 🗺️
              </button>
              <p className="text-center text-slate-400 font-bold text-xs">ปัจจุบันคุณมีกุญแจ {currentKeys} ดอก</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
