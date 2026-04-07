'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './world.module.css'
import {
  getDefaultProgress,
  getKeys,
  isVillageUnlocked,
  PLAYS_PER_VILLAGE,
  MAX_KEYS,
  resetGameProgress,
} from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'
import PreviousRunPreview from '@/components/PreviousRunPreview'
import { useProgress } from '@/contexts/ProgressContext'
import { getDateKey, getCountdownToReset } from '@/lib/dailyChallenge'
import { getDailyProgress, isDailyComplete } from '@/lib/levelSystem'
import Link from 'next/link'

const TOTAL_STAGES = 10

const STAGE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 50, y: 80 }, // 1: Bottom center
  { x: 30, y: 65 }, // 2
  { x: 57, y: 60 }, // 3
  { x: 32, y: 49 }, // 4
  { x: 55, y: 45 }, // 5
  { x: 29, y: 36 }, // 6
  { x: 39, y: 27 }, // 7
  { x: 54, y: 26 }, // 8
  { x: 80, y: 25 }, // 9
  { x: 83, y: 44 }, // 10
]

const LOCKED_ICONS = ['IMG_0665.PNG', 'IMG_0666.PNG', 'IMG_0667.PNG', 'IMG_0668.PNG', 'IMG_0669.PNG', 'IMG_0670.PNG', 'IMG_0671.PNG', 'IMG_0672.PNG', 'IMG_0673.PNG', 'IMG_0674.PNG'];
const UNLOCKED_ICONS = ['1.PNG', '2.PNG', '3.PNG', '4.PNG', '5.PNG', '6.PNG', '7.PNG', '8.PNG', '9.PNG', '10.PNG'];

const INTRO_SLIDES: Array<{ emoji: string; title: string; desc: string }> = [
  { emoji: '👋', title: 'ยินดีต้อนรับ', desc: 'มาสำรวจแผนที่โลกกัน!' },
  { emoji: '⭐', title: 'ปลดล็อกด่าน', desc: 'เติมประสบการณ์ ให้เต็มเพื่อปลดล็อกหมู่บ้านถัดไป' },
  { emoji: '🗝️', title: 'กุญแจ', desc: 'ใช้กุญแจเพื่อเล่นแต่ละด่าน (รีเจนทุก 30 นาที)' },
  { emoji: '✨', title: 'พร้อมเริ่ม', desc: 'กดเริ่มเลยเพื่อไปด่านแรก' },
]

function formatCountdown(ms: number): string {
  if (ms <= 0) return ''
  const totalSec = Math.ceil(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return `(${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')})`
}

function getStageState(
  stage: number,
  unlockedVillages: number[],
  exp: number
): 'completed' | 'current' | 'locked' {
  if (!unlockedVillages.includes(stage)) return 'locked'
  if (exp >= 100) return 'completed'
  const maxUnlocked = Math.max(...unlockedVillages)
  if (stage === maxUnlocked) return 'current'
  return 'completed'
}

export default function WorldPage() {
  const router = useRouter()
  const [unlockedVillages, setUnlockedVillages] = useState<number[]>([1])
  const [villageExp, setVillageExp] = useState<Record<number, number>>({})
  const [showIntro, setShowIntro] = useState(false)
  const [slideIndex, setSlideIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [currentKeys, setCurrentKeys] = useState(MAX_KEYS)
  const [nextRegenIn, setNextRegenIn] = useState(0)
  const [showEnding, setShowEnding] = useState(false)
  const [selectedVillage, setSelectedVillage] = useState<number | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)
  const [userName, setUserName] = useState('')
  const [dailyStatus, setDailyStatus] = useState({ management: false, calculation: false, spatial: false })
  const [isDailyDone, setIsDailyDone] = useState(false)
  const [dailyCountdown, setDailyCountdown] = useState('')

  const { progress, saveProgress, isLoading } = useProgress()

  const refreshProgress = useCallback(() => {
    if (isLoading || !progress) return
    const p = progress
    setUserName(p.userName || 'นักเดินทาง')
    setUnlockedVillages(p.unlockedVillages)
    const expMap: Record<number, number> = {}
    for (let i = 1; i <= TOTAL_STAGES; i++) {
      const vp = p.villages[String(i)] ?? { playsCompleted: 0 }
      expMap[i] = getExpPercent(vp.playsCompleted)
    }
    setVillageExp(expMap)
    if (!p.introSeen) setShowIntro(true)

    // Ending check
    if (expMap[10] >= 100) {
      setShowEnding(true)
    }
    // Daily Check
    const dk = getDateKey()
    setDailyStatus(getDailyProgress(p, dk))
    setIsDailyDone(isDailyComplete(p, dk))
  }, [progress, isLoading])

  useEffect(() => {
    refreshProgress()
    setMounted(true)
  }, [refreshProgress])

  // Keys ticker
  useEffect(() => {
    if (!mounted || isLoading || !progress) return
    const tick = () => {
      const { currentKeys: ck, nextRegenIn: nr } = getKeys(progress)
      setCurrentKeys(ck)
      setNextRegenIn(nr)
    }
    tick()
    const id = setInterval(tick, 1000)

    const dTick = () => setDailyCountdown(getCountdownToReset())
    dTick()
    const dId = setInterval(dTick, 1000)

    return () => {
      clearInterval(id)
      clearInterval(dId)
    }
  }, [mounted, progress, isLoading])

  function closeIntro() {
    if (!progress) return
    setShowIntro(false)
    setSlideIndex(0)
    const p = { ...progress }
    p.introSeen = true
    saveProgress(p)
  }

  function resetProgress() {
    if (!progress) return
    if (!confirm('ต้องการเริ่มการเดินทางครั้งใหม่เพื่อฝึกฝนอีกรอบใช่หรือไม่? (ความสำเร็จและเควสรายวันจะยังคงถูกเก็บไว้)')) return
    const fresh = resetGameProgress(progress)
    saveProgress(fresh)
    setUnlockedVillages(fresh.unlockedVillages)
    setVillageExp({})
    const { currentKeys: ck, nextRegenIn: nr } = getKeys(fresh)
    setCurrentKeys(ck)
    setNextRegenIn(nr)
  }

  function unlockAllCheat() {
    if (!progress) return
    const p = { ...progress }
    p.unlockedVillages = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    for (let i = 1; i <= 10; i++) {
      p.villages[String(i)] = {
        playsCompleted: 12,
        expTubeFilled: true,
        runHistory: p.villages[String(i)]?.runHistory || []
      }
    }
    saveProgress(p)
    refreshProgress()
    alert('⚡ ปลดล็อกทุกด่านแล้ว! ขอให้สนุกกับการทดสอบครับ')
  }

  function handleStageClick(stage: number) {
    if (progress && isVillageUnlocked(progress, stage)) {
      setSelectedVillage(stage)
    }
  }

  if (!mounted) return null

  const keysLabel =
    currentKeys >= MAX_KEYS
      ? `🗝️ ${currentKeys}/${MAX_KEYS}`
      : `🗝️ ${currentKeys}/${MAX_KEYS} ${formatCountdown(nextRegenIn)}`

  return (
    <div className={styles.worldPage}>
      {showIntro && (
        <div className={styles.introOverlay}>
          <div className={styles.introCard}>
            <button className={styles.skipBtn} onClick={closeIntro}>ข้าม</button>
            <div className={styles.slideContent}>
              <div className={styles.slideEmoji}>✨</div>
              <h2 className={styles.slideTitle}>{INTRO_SLIDES[slideIndex].title}</h2>
              <p className={styles.slideDesc}>{INTRO_SLIDES[slideIndex].desc}</p>
            </div>
            <div className={styles.slideDots}>
              {INTRO_SLIDES.map((_: unknown, i: number) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === slideIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
            <div className={styles.slideNav}>
              {slideIndex > 0 && (
                <button className={styles.navBtn} onClick={() => setSlideIndex((i) => i - 1)}>
                  ← ย้อนกลับ
                </button>
              )}
              {slideIndex < INTRO_SLIDES.length - 1 ? (
                <button className={styles.navBtn} onClick={() => setSlideIndex((i) => i + 1)}>
                  ถัดไป →
                </button>
              ) : (
                <button className={`${styles.navBtn} !bg-green-500 !text-white !border-green-600 shadow-[0_4px_0_#166534] hover:shadow-[0_2px_0_#166534] hover:translate-y-0.5 transition-all`} onClick={closeIntro}>
                  เริ่มเลย! ✨
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Previous Run Preview Modal */}
      {selectedVillage && (
        <PreviousRunPreview
          villageId={selectedVillage}
          onStart={() => router.push(`/world/${selectedVillage}`)}
          onBack={() => setSelectedVillage(null)}
        />
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className={styles.introOverlay} style={{ zIndex: 11000 }}>
          <div className={`${styles.introCard} ${styles.compactTutorialCard}`}>
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-black text-black tracking-tighter mb-1">คู่มือการเล่น 🧠</h2>
                <div className="h-1.5 w-16 md:w-20 bg-black rounded-full"></div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="w-10 h-10 rounded-xl bg-black/5 hover:bg-red-500 hover:text-white flex items-center justify-center text-xl transition-all duration-300 shadow-[4px_4px_0_rgba(0,0,0,0.1)]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              {/* Management */}
              <button
                onClick={() => router.push('/minigame/management?mode=practice&level=1')}
                className="group relative bg-[#fcfaf2] p-5 md:p-6 rounded-[2rem] border-4 border-black text-center shadow-[6px_6px_0_#000] hover:translate-y-[-5px] transition-all hover:bg-orange-50/50"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-orange-50 border-2 border-black rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[4px_4px_0_#000]">📦</div>
                <h4 className="font-black text-lg text-black mb-1 tracking-tighter uppercase">โหมดจัดการ</h4>
                <div className="h-0.5 w-8 bg-orange-400 mx-auto mb-3 rounded-full"></div>
                <p className="text-xs md:text-sm font-bold text-black/70 leading-relaxed">
                  ฝึกทักษะการแยกแยะและจัดหมวดหมู่สิ่งของ
                </p>
                <div className="mt-3 text-[10px] font-black text-orange-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">คลิกเพื่อลองเล่น ➔</div>
              </button>

              {/* Calculation */}
              <button
                onClick={() => router.push('/minigame/calculation?mode=practice&level=1')}
                className="group relative bg-[#fcfaf2] p-5 md:p-6 rounded-[2rem] border-4 border-black text-center shadow-[6px_6px_0_#000] hover:translate-y-[-5px] transition-all hover:bg-blue-50/50"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 border-2 border-black rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[4px_4px_0_#000]">🔢</div>
                <h4 className="font-black text-lg text-black mb-1 tracking-tighter uppercase">โหมดคำนวณ</h4>
                <div className="h-0.5 w-8 bg-blue-400 mx-auto mb-3 rounded-full"></div>
                <p className="text-xs md:text-sm font-bold text-black/70 leading-relaxed">
                  ท้าทายความไวในการแก้โจทย์คณิตศาสตร์
                </p>
                <div className="mt-3 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">คลิกเพื่อลองเล่น ➔</div>
              </button>

              {/* Spatial */}
              <button
                onClick={() => router.push('/minigame/spatial?mode=practice&level=1')}
                className="group relative bg-[#fcfaf2] p-5 md:p-6 rounded-[2rem] border-4 border-black text-center shadow-[6px_6px_0_#000] hover:translate-y-[-5px] transition-all hover:bg-green-50/50"
              >
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 border-2 border-black rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-[4px_4px_0_#000]">🗺️</div>
                <h4 className="font-black text-lg text-black mb-1 tracking-tighter uppercase">โหมดมิติสัมพันธ์</h4>
                <div className="h-0.5 w-8 bg-green-400 mx-auto mb-3 rounded-full"></div>
                <p className="text-xs md:text-sm font-bold text-black/70 leading-relaxed">
                  ฝึกการวาดภาพในใจ จับคู่มุมมองและรูปทรง
                </p>
                <div className="mt-3 text-[10px] font-black text-green-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">คลิกเพื่อลองเล่น ➔</div>
              </button>
            </div>

            <div className="bg-white/60 backdrop-blur-md p-5 md:p-6 rounded-3xl mb-6 md:mb-8 text-left border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl rotate-12">🎯</div>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-1">ภารกิจสำรวจส่วนตัว</p>
              <p className="text-sm md:text-base font-black text-black leading-tight">
                สะสม <span className="text-orange-500 underline decoration-2 underline-offset-2">EXP</span> เพื่อปลดล็อกพื้นที่ถัดไป <br />
                และ <span className="bg-yellow-300 px-2 py-0.5 rounded-lg border-2 border-yellow-400/20 inline-block">กู้คืนความทรงจำที่หายไป</span> กลับคืนมา!
              </p>
            </div>

            <button
              onClick={() => setShowTutorial(false)}
              className={`${styles.navBtn} ${styles.navBtnPrimary} w-full text-lg md:text-xl py-3 md:py-4 rounded-xl md:rounded-2xl border-4 border-black !bg-green-500 !text-white !border-black shadow-[0_6px_0_#166534] hover:translate-y-1 hover:shadow-[0_4px_0_#166534] transition-all`}
            >
              เข้าใจแล้ว เริ่มผจญภัย! ✨
            </button>
          </div>
        </div>
      )}

      {showEnding && (
        <div className={styles.introOverlay} style={{ zIndex: 99999 }}>
          <div className={styles.introCard} style={{ borderColor: '#FFD700', borderWidth: '6px' }}>
            <div className={styles.slideContent}>
              <div className={styles.slideEmoji}>🏥 ✨</div>
              <h2 className={styles.slideTitle}>ความจริงที่ค้นพบ</h2>
              <p className={styles.slideDesc}>
                ณ แหล่งสร้างยาที่เชื่อว่าเป็นจุดหมายสุดท้าย... คุณได้ค้นพบความจริงว่า <b>"ยาป้องกันสมองเสื่อม"</b> ที่แท้จริงไม่ได้อยู่ในรูปแบบของตัวยา
                หากแต่คือ <b>ประสบการณ์ การเรียนรู้ และการฝึกสมอง</b> ที่คุณได้ตรากตรำทำมาตลอดเส้นทางนี้เอง
              </p>
              <p className="text-black/60 text-sm mt-4 font-bold uppercase tracking-widest leading-loose">
                ความตระหนักรู้นี้ช่วยให้คุณนำสิ่งที่คุณเรียนรู้กลับไปฟื้นฟูหมู่บ้านทั้ง 10 ให้กลับมามีชีวิตชีวาอีกครั้ง!
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                className={`${styles.navBtn} ${styles.navBtnPrimary} w-full shadow-[0_10px_30px_rgba(79,70,229,0.3)] text-xl py-4`}
                onClick={() => setShowEnding(false)}
              >
                ฟื้นฟูหมู่บ้านด้วยใจ 🏘️
              </button>
              <button
                className="text-red-600/80 font-black text-xs uppercase tracking-widest hover:text-red-600 hover:scale-105 transition-all py-2 mt-2"
                onClick={() => { if (confirm('ต้องการเริ่มการเดินทางครั้งใหม่เพื่อฝึกฝนอีกรอบใช่หรือไม่?')) { resetProgress(); setShowEnding(false); } }}
              >
                เริ่มการเดินทางใหม่ 🔄
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {/* Keys - On the left as requested */}
          <div className="bg-white px-3 py-2 rounded-xl border-2 border-black font-black text-xs md:text-sm shadow-[2px_2px_0_#000] flex items-center gap-2">
            <span>🗝️</span>
            <span>{currentKeys}</span>
          </div>
        </div>

        {/* Logo - Centered with branding */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-400 rounded-xl flex items-center justify-center text-xl md:text-2xl shadow-[2px_2px_0_#000] border-2 border-black">🧠</div>
          <div className="flex flex-col items-start">
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter leading-none">Gymemo</h1>
            <span className="text-[8px] md:text-[10px] font-black text-indigo-600 uppercase tracking-widest opacity-80">ฝึกสมองรายวัน</span>
          </div>
        </div>

        {/* Global Progress Header (Daily/Keys/Signout) */}
        <div className="flex items-center gap-2 md:gap-4 ml-auto shrink-0">
          <button
            onClick={() => router.push('/')}
            className="hidden md:flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-100 font-black text-xs hover:bg-rose-100 transition-all shadow-[2px_2px_0_#fecdd3]"
          >
            ออกจากระบบ 🚪
          </button>
          <button
            onClick={() => router.push('/')}
            className="md:hidden w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-600 rounded-xl border-2 border-rose-100 font-black text-base transition-all active:scale-95 shadow-[2px_2px_0_#be123c]"
          >
            🚪
          </button>
        </div>
      </div>

      {/* Main Action Hub - Mobile Optimized & Compact (Based on Sketch) */}
      <div className="w-full max-w-4xl mx-auto px-4 mt-0.5 md:mt-4 space-y-1.5 relative z-10 animate-in slide-in-from-bottom duration-700">
        
        {/* Row 1: Daily Mission (Pill Shape) */}
        <Link href="/daily-challenge" className="w-full h-10 md:h-16 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl border-[3px] border-black shadow-[2px_2px_0_#000] flex items-center justify-between px-4 group active:translate-y-1 active:shadow-none transition-all">
          <div className="flex items-center gap-2">
            <span className="text-lg md:text-2xl">🎯</span>
            <div className="text-left font-black text-slate-900 text-xs md:text-lg uppercase">ภารกิจรายวัน</div>
          </div>
          <div className="flex gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white/30 ${dailyStatus.management ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`} />
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white/30 ${dailyStatus.calculation ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`} />
            <div className={`w-2.5 h-2.5 rounded-full border-2 border-white/30 ${dailyStatus.spatial ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`} />
          </div>
        </Link>

        {/* Row 2: Profile & Leaderboard (Compact) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => router.push('/')} className="bg-white py-1.5 md:py-3 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] font-black text-[10px] md:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 active:translate-y-0.5 transition-all">
            <span className="text-xs md:text-lg">👤</span> โปรไฟล์
          </button>
          <button onClick={() => router.push('/leaderboard')} className="bg-white py-1.5 md:py-3 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] font-black text-[10px] md:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 active:translate-y-0.5 transition-all">
            <span className="text-xs md:text-lg">🏆</span> อันดับ
          </button>
        </div>

        {/* Combined Row 3 & 4 for better compactness */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => { setSlideIndex(0); setShowIntro(true); }} className="bg-white py-1.5 md:py-3 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] font-black text-[10px] md:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 active:translate-y-0.5 transition-all">
            <span className="text-xs md:text-lg">📖</span> บทนำ
          </button>
          <button
            onClick={() => setShowTutorial(true)}
            className="bg-white py-1.5 md:py-3 rounded-lg border-2 border-black shadow-[2px_2px_0_#000] font-black text-[10px] md:text-sm flex items-center justify-center gap-1.5 hover:bg-slate-50 active:translate-y-0.5 transition-all"
          >
            <span className="text-xs md:text-lg">🎓</span> สอนเล่น
          </button>
        </div>

        {/* BIG GREEN START BUTTON - More Compact */}
        {(() => {
          const unlocked_villages_safe = unlockedVillages.length ? unlockedVillages : [1];
          const currentVillageId = Math.max(...unlocked_villages_safe);
          const currentVillageProgress = progress?.villages[String(currentVillageId)];
          const plays = currentVillageProgress?.playsCompleted ?? 0;
          const currentSubId = Math.min(12, (plays % 12) + 1);

          return (
            <button
              onClick={() => router.push(`/world/${currentVillageId}/sublevel/${currentSubId}`)}
              className="w-full py-2.5 md:py-6 bg-green-500 hover:bg-green-600 text-white rounded-xl md:rounded-[2rem] border-[3px] border-black shadow-[0_4px_0_#166534] flex items-center justify-center gap-3 group active:translate-y-1 active:shadow-none transition-all overflow-hidden relative"
            >
              <span className="text-lg md:text-4xl font-black uppercase tracking-tighter leading-none relative z-10">เริ่มผจญภัย ➔</span>
              <span className="text-[9px] md:text-sm font-bold text-black/50 relative z-10">{currentVillageId}-{currentSubId}</span>
            </button>
          )
        })()}

        {/* Bottom Options (Cheat/Reset) */}
        <div className="flex justify-center gap-12 py-2 mt-1">
          <button 
            onClick={resetProgress} 
            className="text-[11px] font-black text-slate-500 opacity-70 hover:opacity-100 hover:text-red-600 transition-all uppercase tracking-widest border-b border-transparent hover:border-red-600/30"
          >
            ล้างข้อมูล
          </button>
          <button 
            onClick={unlockAllCheat} 
            className="text-[11px] font-black text-slate-400 opacity-60 hover:opacity-100 hover:text-indigo-600 transition-all uppercase tracking-widest border-b border-transparent hover:border-indigo-600/30"
          >
            ปลดล็อก
          </button>
        </div>
      </div>

      <div
        className={styles.mapContainer}
        style={{
          backgroundImage: (() => {
            const maxUnlocked = Math.max(...(unlockedVillages.length ? unlockedVillages : [1]));
            const exp1 = villageExp[1] ?? 0;
            if (maxUnlocked === 1 && exp1 === 0) {
              return 'url("/assets_employer/background/map/plain.PNG")';
            }
            return `url("/assets_employer/background/map/unlocked-${Math.max(1, Math.min(10, maxUnlocked))}.PNG")`;
          })()
        }}
      >
        {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((stage) => {
          const exp = villageExp[stage] ?? 0
          const state = getStageState(stage, unlockedVillages, exp)
          const pos = STAGE_POSITIONS[stage - 1]
          const iconFilename = state === 'locked' ? LOCKED_ICONS[stage - 1] : UNLOCKED_ICONS[stage - 1]
          const iconFolder = state === 'locked' ? 'locked' : 'unlocked'
          const iconPath = `/assets_employer/background/map/villages/${iconFolder}/${iconFilename}`

          return (
            <button
              key={stage}
              className={`${styles.stageNode} ${styles[state]}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleStageClick(stage)}
              title={state === 'locked' ? 'ล็อก' : `หมู่บ้าน ${stage}`}
            >
              <div
                className={styles.stageIcon}
                style={{ backgroundImage: `url("${iconPath}")` }}
              />
              <span className="bg-[var(--card-bg)] text-[var(--text-main)] px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-xs font-black shadow-[2px_2px_0_var(--border-dark)] uppercase tracking-widest whitespace-nowrap mt-0.5">
                ด่าน {stage}
              </span>
              {state !== 'locked' && (
                <div
                  style={{
                    width: '48px',
                    height: '5px',
                    background: 'rgba(0,0,0,0.15)',
                    borderRadius: '3px',
                    marginTop: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${exp}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg,#ffd700,#ffed4e)',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className={styles.legend}>
        <span className={styles.legendItem}>▶ ด่านปัจจุบัน</span>
        <span className={styles.legendItem}>⭐ ผ่านแล้ว</span>
        <span className={styles.legendItem}>🔒 ล็อก</span>
        <span className={styles.legendItem}>
          ด่าน {Object.values(villageExp).filter((v) => v >= 100).length}/{TOTAL_STAGES}
        </span>
      </div>
    </div >
  )
}

