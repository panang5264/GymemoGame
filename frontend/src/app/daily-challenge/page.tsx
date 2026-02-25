'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  getCountdownToReset,
  getDateKey,
} from '@/lib/dailyChallenge'
import {
  isDailyComplete,
  getDailyProgress,
  loadProgress,
  addKeys,
  getKeys
} from '@/lib/levelSystem'

export default function DailyChallengePage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState('')
  const [dateKey] = useState(() => getDateKey())
  const [userRank, setUserRank] = useState(1)
  const [isDone, setIsDone] = useState(false)
  const [rewardClaimed, setRewardClaimed] = useState(false)

  // Results from localStorage
  const [scores, setScores] = useState({ management: 0, calculation: 0, spatial: 0 })
  const [todayModes, setTodayModes] = useState({ management: false, calculation: false, spatial: false })

  useEffect(() => {
    const tick = () => setCountdown(getCountdownToReset())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const dk = getDateKey()
    const progress = loadProgress()
    const maxUnlocked = Math.max(...progress.unlockedVillages, 1)
    setUserRank(maxUnlocked)

    const modes = getDailyProgress(dk)
    setTodayModes(modes)

    const done = isDailyComplete(dk)
    setIsDone(done)

    // Check if reward already claimed for today
    const claimed = localStorage.getItem(`gymemo_daily_reward_${dk}`) === 'true'
    setRewardClaimed(claimed)

    if (done) {
      const mgmt = JSON.parse(localStorage.getItem(`gymemo_mgmt_daily_${dk}`) || '{"score":0}')
      const calc = JSON.parse(localStorage.getItem(`gymemo_calc_daily_${dk}`) || '{"score":0}')
      const spatial = JSON.parse(localStorage.getItem(`gymemo_spatial_daily_${dk}`) || '{"score":0}')
      setScores({
        management: mgmt.score,
        calculation: calc.score,
        spatial: spatial.score
      })
    }
  }, [dateKey])

  const handleClaimReward = () => {
    if (rewardClaimed) return
    addKeys(1)
    localStorage.setItem(`gymemo_daily_reward_${dateKey}`, 'true')
    setRewardClaimed(true)
    alert('คุณได้รับกุญแจ 🔑 1 ดอก เป็นรางวัลสำหรับความพยายามวันนี้!')
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
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-[40px] shadow-2xl overflow-hidden border border-white/20 p-8 md:p-12 relative">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block px-6 py-2 bg-indigo-50 text-indigo-600 rounded-full font-black text-sm uppercase tracking-widest mb-4">
            Today's Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight mb-2">
            🌟 ภารกิจรายวัน
          </h1>
          <p className="text-slate-500 font-bold">ฝึกฝนทักษะให้ครบ 3 ด้าน เพื่อรับรางวัลพิเศษ</p>
        </div>

        {/* Progress Checklist Area */}
        <div className="bg-slate-50/50 rounded-[32px] p-6 md:p-8 mb-8 border border-slate-100">
          <h2 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6 px-2">Checkpoint Checklist</h2>

          <div className="grid gap-4">
            {/* Management Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${todayModes.management ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${todayModes.management ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {todayModes.management ? '✅' : '📦'}
                </div>
                <div>
                  <h3 className={`font-black ${todayModes.management ? 'text-green-700' : 'text-slate-700'}`}>📋 การจัดการ</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Management Challenge</p>
                </div>
              </div>
              {todayModes.management && <span className="text-green-500 font-black text-sm">DONE</span>}
            </div>

            {/* Calculation Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${todayModes.calculation ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${todayModes.calculation ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {todayModes.calculation ? '✅' : '🧮'}
                </div>
                <div>
                  <h3 className={`font-black ${todayModes.calculation ? 'text-green-700' : 'text-slate-700'}`}>🧮 การคำนวณ</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Calculation Challenge</p>
                </div>
              </div>
              {todayModes.calculation && <span className="text-green-500 font-black text-sm">DONE</span>}
            </div>

            {/* Spatial Task */}
            <div className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${todayModes.spatial ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${todayModes.spatial ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {todayModes.spatial ? '✅' : '🧭'}
                </div>
                <div>
                  <h3 className={`font-black ${todayModes.spatial ? 'text-green-700' : 'text-slate-700'}`}>🧭 พื้นที่</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Spatial Challenge</p>
                </div>
              </div>
              {todayModes.spatial && <span className="text-green-500 font-black text-sm">DONE</span>}
            </div>
          </div>
        </div>

        {/* Reward Area */}
        {isDone ? (
          <div className="text-center animate-in zoom-in">
            {!rewardClaimed ? (
              <div className="bg-indigo-600 rounded-[28px] p-8 text-white shadow-xl">
                <div className="text-6xl mb-4">🔑</div>
                <h4 className="text-2xl font-black mb-2 italic">Congratulation!</h4>
                <p className="opacity-80 font-bold mb-6">คุณทำสำเร็จครบทุกภารกิจแล้ว! รับกุญแจรางวัลของคุณเลย</p>
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-white text-indigo-600 py-4 rounded-xl font-black text-xl hover:scale-105 transition-all shadow-lg active:scale-95"
                >
                  รับกุญแจ 🗝️ (+1 Key)
                </button>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-[28px] p-8 text-white">
                <div className="text-5xl mb-4">✨</div>
                <h4 className="text-xl font-black mb-2">ภารกิจวันนี้เสร็จสิ้น</h4>
                <p className="text-slate-400 text-sm mb-6">คุณได้รับรางวัลของวันไปแล้ว พักผ่อนและกลับมาใหม่ในวันถัดไป!</p>
                <div className="flex items-center justify-center gap-2 text-yellow-400 font-black">
                  <span className="text-sm uppercase tracking-widest opacity-60">Resetting In</span>
                  <span className="text-2xl tabular-nums">{countdown}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={startNextMode}
              className="w-full py-6 bg-indigo-600 text-white rounded-[24px] font-black text-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95"
            >
              เริ่มภารกิจต่อไป 🚀
            </button>
            <div className="flex items-center justify-center gap-3 text-slate-400 py-4">
              <span className="w-12 h-[1px] bg-slate-200"></span>
              <span className="text-xs font-bold uppercase tracking-widest">Village {userRank} Difficulty</span>
              <span className="w-12 h-[1px] bg-slate-200"></span>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Keys</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-slate-800">{currentKeys}</span>
              <span className="text-xl">🔑</span>
            </div>
          </div>
          <Link href="/world" className="text-indigo-600 font-black text-sm hover:underline">ไปยังแผนที่โลก 🌏</Link>
        </div>

      </div>
    </div>
  )
}
