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
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center py-10 px-4 font-['Supermarket']">
      <div className="w-full max-w-2xl bg-[var(--card-bg)] rounded-[3rem] shadow-[15px_15px_0_rgba(0,0,0,0.05)] overflow-hidden border-4 border-[var(--border-dark)] p-8 md:p-12 relative">

        {/* Header Section */}
        <div className="text-center mb-10">
          <div className="inline-block px-6 py-2 bg-[var(--bg-warm)] text-[var(--text-main)] border-2 border-[var(--border-dark)] rounded-full font-black text-sm uppercase tracking-widest mb-4">
            Today's Mission
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[var(--text-main)] tracking-tight mb-2 uppercase">
            🌟 ภารกิจรายวัน
          </h1>
          <p className="text-[var(--text-muted)] font-bold">ฝึกฝนทักษะให้ครบ 3 ด้าน เพื่อรับรางวัลพิเศษ</p>
        </div>

        {/* Progress Checklist Area */}
        <div className="bg-[var(--bg-warm)]/30 rounded-[2.5rem] p-6 md:p-8 mb-8 border-2 border-[var(--border-dark)]">
          <h2 className="text-[var(--text-muted)] font-black text-[12px] uppercase tracking-widest mb-6 px-2 opacity-60">Checkpoint Checklist</h2>

          <div className="grid gap-4">
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
              <div className="bg-[var(--border-dark)] rounded-[2.5rem] p-8 text-[var(--text-on-dark)] shadow-xl">
                <div className="text-6xl mb-4">🔑</div>
                <h4 className="text-3xl font-black mb-2 italic uppercase">Congratulation!</h4>
                <p className="opacity-80 font-bold mb-6">คุณทำสำเร็จครบทุกภารกิจแล้ว! รับกุญแจรางวัลของคุณเลย</p>
                <button
                  onClick={handleClaimReward}
                  className="w-full bg-[var(--card-bg)] text-[var(--border-dark)] py-4 rounded-2xl font-black text-2xl hover:translate-y-[-4px] transition-all shadow-[0_8px_0_#000] active:translate-y-0 active:shadow-none border-2 border-black"
                >
                  รับกุญแจ 🗝️ (+1 Key)
                </button>
              </div>
            ) : (
              <div className="bg-[var(--bg-warm)] rounded-[2.5rem] p-8 border-4 border-[var(--border-dark)]">
                <div className="text-5xl mb-4">✨</div>
                <h4 className="text-2xl font-black mb-2 uppercase">ภารกิจวันนี้เสร็จสิ้น</h4>
                <p className="text-[var(--text-muted)] text-sm mb-6 font-bold">คุณได้รับรางวัลของวันไปแล้ว พักผ่อนและกลับมาใหม่ในวันถัดไป!</p>
                <div className="flex flex-col items-center justify-center gap-1 bg-[var(--card-bg)] py-3 px-6 rounded-2xl border-2 border-[var(--border-dark)] inline-flex">
                  <span className="text-[10px] uppercase font-black tracking-widest opacity-50">Resetting In</span>
                  <span className="text-3xl tabular-nums font-black">{countdown}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <button
              onClick={startNextMode}
              className="w-full py-6 bg-[var(--border-dark)] text-[var(--text-on-dark)] rounded-[2rem] font-black text-3xl shadow-[0_10px_0_rgba(0,0,0,0.2)] transition-all hover:-translate-y-1 active:scale-95 border-2 border-black"
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

        <div className="mt-8 pt-8 border-t-2 border-[var(--border-dark)] flex items-center justify-between px-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">Current Keys</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-[var(--text-main)]">{currentKeys}</span>
              <span className="text-2xl">🔑</span>
            </div>
          </div>
          <Link href="/world" className="bg-[var(--bg-warm)] border-2 border-[var(--border-dark)] px-4 py-2 rounded-full font-black text-sm hover:translate-y-[-2px] transition-all shadow-[3px_3px_0_#000]">ไปยังแผนที่โลก 🌏</Link>
        </div>

      </div>
    </div>
  )
}
