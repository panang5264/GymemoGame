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
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center py-10 px-4 font-['Supermarket']">
      {/* Scoring Hint */}
      <div className="w-full max-w-2xl bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 mb-4 text-amber-800 text-xs font-bold shadow-sm flex items-center gap-3">
        <span className="text-xl">💡</span>
        <p>
          <span className="font-black">เคล็ดลับการสะสมคะแนน:</span> หากเล่นผ่านด่านโดยไม่ข้าม (กุญแจครบ) จะได้รับโบนัส <span className="text-orange-600 font-black">+50 x จำนวนกุญแจ</span>
          <br />หากใช้กุญแจข้ามจะได้เพียง 50 คะแนนเท่านั้น!
        </p>
      </div>

      <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-[3rem] shadow-[15px_15px_0_rgba(0,0,0,0.05)] overflow-hidden border-4 border-[var(--border-dark)] p-8 md:p-12 relative">
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-1">
              ภารกิจรายวัน 📅
            </h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">DAILY MISSION PROGRESS</p>
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-6 py-3 rounded-2xl border-2 border-slate-100 flex flex-col items-center shadow-inner">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RESET IN</span>
            <span className="text-xl font-black text-blue-600 tabular-nums">{countdown}</span>
          </div>
        </div>

        {/* Mission Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            { id: 'management', label: 'การจัดการ', emoji: '🍱', color: 'blue' },
            { id: 'calculation', label: 'การคำนวณ', emoji: '🧮', color: 'orange' },
            { id: 'spatial', label: 'มิติสัมพันธ์', emoji: '🧩', color: 'indigo' },
          ].map((m) => (
            <div key={m.id} className={`p-6 rounded-3xl border-2 transition-all ${todayModes[m.id as keyof typeof todayModes] ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100 opacity-60'}`}>
              <div className="text-3xl mb-2">{m.emoji}</div>
              <div className="font-black text-slate-800 mb-1">{m.label}</div>
              <div className="flex items-center gap-2">
                {todayModes[m.id as keyof typeof todayModes] ? (
                  <span className="text-green-600 font-black text-sm flex items-center gap-1">
                    <span className="text-lg">✓</span> สำเร็จ
                  </span>
                ) : (
                  <span className="text-slate-400 font-bold text-sm">ยังไม่เริ่ม</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50/50 rounded-3xl p-6 mb-10 border-2 border-slate-100/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-slate-800 flex items-center gap-2 underline decoration-blue-200 decoration-4">
              <span>🏆 คะแนนรวมวันนี้</span>
            </h3>
            <span className="text-3xl font-black text-blue-600">
              {scores.management + scores.calculation + scores.spatial}
            </span>
          </div>
          <div className="space-y-3 text-sm">
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
          <div className="space-y-4">
            {rewardClaimed ? (
              <div className="bg-green-100 border-2 border-green-200 rounded-3xl p-6 text-center animate-in zoom-in duration-300">
                <div className="text-4xl mb-2">🎉</div>
                <p className="text-green-800 font-black text-lg">รับรางวัลเรียบร้อยแล้ว!</p>
                <p className="text-green-600 font-bold text-sm">มาสู้ใหม่ในวันพรุ่งนี้นะ</p>
              </div>
            ) : (
              <button
                onClick={handleClaimReward}
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black py-6 rounded-3xl text-2xl shadow-[0_10px_0_#d97706] hover:translate-y-1 hover:shadow-[0_6px_0_#d97706] active:translate-y-[10px] active:shadow-none transition-all"
              >
                รับรางวัลกุญแจ 🗝️ x3
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={startNextMode}
              className="w-full bg-blue-600 text-white font-black py-6 rounded-3xl text-2xl shadow-[0_10px_0_#1d4ed8] hover:translate-y-1 hover:shadow-[0_6px_0_#1d4ed8] active:translate-y-[10px] active:shadow-none transition-all flex items-center justify-center gap-3"
            >
              ไปทำภารกิจในแผนที่โลก 🗺️
            </button>
            <p className="text-center text-slate-400 font-bold text-sm">ปัจจุบันคุณมีกุญแจ {currentKeys} ดอก</p>
          </div>
        )}
      </div>
    </div>
  )
}
