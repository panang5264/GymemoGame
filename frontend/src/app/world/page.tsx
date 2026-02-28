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
} from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'
import PreviousRunPreview from '@/components/PreviousRunPreview'
import { useProgress } from '@/contexts/ProgressContext'

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
  { emoji: '⭐', title: 'ปลดล็อกด่าน', desc: 'เติม EXP ให้เต็มเพื่อปลดล็อกหมู่บ้านถัดไป' },
  { emoji: '🗝️', title: 'กุญแจ', desc: 'ใช้กุญแจเพื่อเล่นแต่ละด่าน (รีเจนทุก 30 นาที)' },
  { emoji: '🚀', title: 'พร้อมเริ่ม', desc: 'กดเริ่มเลยเพื่อไปด่านแรก' },
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
    return () => clearInterval(id)
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
    const current = progress
    const fresh = getDefaultProgress()

    // Preserve Identity and High Scores
    fresh.userName = current.userName
    fresh.guestId = current.guestId
    fresh.totalScore = current.totalScore
    fresh.introSeen = false // Allow seeing intro again if they reset

    // Preserve best scores for each village
    Object.keys(current.villages).forEach(key => {
      const cv = current.villages[key]
      if (cv && cv.bestScore) {
        fresh.villages[key] = {
          playsCompleted: 0,
          expTubeFilled: false,
          bestScore: cv.bestScore
        }
      }
    })

    saveProgress(fresh)
    setUnlockedVillages(fresh.unlockedVillages)
    setVillageExp({})
    const { currentKeys: ck, nextRegenIn: nr } = getKeys(fresh)
    setCurrentKeys(ck)
    setNextRegenIn(nr)
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
              <div className={styles.slideEmoji}>{INTRO_SLIDES[slideIndex].emoji}</div>
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
                <button className={`${styles.navBtn} ${styles.navBtnPrimary}`} onClick={closeIntro}>
                  เริ่มเลย! 🚀
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
          <div className={`${styles.introCard} ${styles.tutorialCard}`}>
            <div className="flex justify-between items-center mb-8 md:mb-12">
              <div className="text-left">
                <h2 className="text-3xl md:text-5xl font-black text-black tracking-tighter mb-2">คู่มือการเล่น 🧠</h2>
                <div className="h-2 w-24 md:w-32 bg-black rounded-full"></div>
              </div>
              <button
                onClick={() => setShowTutorial(false)}
                className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-black/5 hover:bg-red-500 hover:text-white flex items-center justify-center text-2xl md:text-4xl transition-all duration-300 shadow-[4px_4px_0_rgba(0,0,0,0.1)] hover:translate-y-[-2px]"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
              {/* Management */}
              <div className="group relative bg-[#fcfaf2] p-6 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border-4 border-black text-center shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000] hover:translate-y-[-10px] transition-all duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-orange-50 border-3 border-black rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-8 shadow-[6px_6px_0_#000] group-hover:rotate-6 transition-transform">📦</div>
                <h4 className="font-black text-xl md:text-2xl text-black mb-2 md:mb-4 tracking-tighter">MANAGEMENT</h4>
                <div className="h-1 w-10 md:w-12 bg-orange-400 mx-auto mb-4 md:mb-6 rounded-full"></div>
                <p className="text-sm md:text-lg font-bold text-black/70 leading-relaxed">
                  ฝึกทักษะการแยกแยะและจัดหมวดหมู่สิ่งของตามเงื่อนไขที่กำหนด
                </p>
              </div>

              {/* Calculation */}
              <div className="group relative bg-[#fcfaf2] p-6 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border-4 border-black text-center shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000] hover:translate-y-[-10px] transition-all duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-50 border-3 border-black rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-8 shadow-[6px_6px_0_#000] group-hover:rotate-6 transition-transform">🔢</div>
                <h4 className="font-black text-xl md:text-2xl text-black mb-2 md:mb-4 tracking-tighter">CALCULATION</h4>
                <div className="h-1 w-10 md:w-12 bg-blue-400 mx-auto mb-4 md:mb-6 rounded-full"></div>
                <p className="text-sm md:text-lg font-bold text-black/70 leading-relaxed">
                  ท้าทายความไวในการแก้โจทย์คณิตศาสตร์ภายใต้ความกดดันของเวลา
                </p>
              </div>

              {/* Spatial */}
              <div className="group relative bg-[#fcfaf2] p-6 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border-4 border-black text-center shadow-[8px_8px_0_#000] md:shadow-[12px_12px_0_#000] hover:translate-y-[-10px] transition-all duration-500">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-green-50 border-3 border-black rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-4xl md:text-5xl mx-auto mb-4 md:mb-8 shadow-[6px_6px_0_#000] group-hover:rotate-6 transition-transform">🗺️</div>
                <h4 className="font-black text-xl md:text-2xl text-black mb-2 md:mb-4 tracking-tighter">SPATIAL</h4>
                <div className="h-1 w-10 md:w-12 bg-green-400 mx-auto mb-4 md:mb-6 rounded-full"></div>
                <p className="text-sm md:text-lg font-bold text-black/70 leading-relaxed">
                  ฝึกการวาดภาพในใจ จับคู่มุมมองและรูปทรงให้แม่นยำที่สุด
                </p>
              </div>
            </div>

            <div className="bg-white/60 backdrop-blur-md p-6 md:p-10 rounded-3xl md:rounded-[3rem] mb-8 md:mb-12 text-left border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,0.05)] md:shadow-[8px_8px_0_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl md:text-8xl rotate-12">🎯</div>
              <p className="text-[10px] md:text-xs font-black text-black/40 uppercase tracking-[0.2em] mb-2 md:mb-3">Our Mission Objective</p>
              <p className="text-lg md:text-2xl font-black text-black leading-tight">
                สะสม <span className="text-orange-500 underline decoration-4 underline-offset-4">EXP</span> ในแต่ละหมู่บ้านให้เต็มเพื่อปลดล็อกพื้นที่ถัดไป <br className="hidden md:block" />
                และภารกิจสำคัญคือ <span className="bg-yellow-300 px-2 py-0.5 rounded-lg border-2 border-yellow-400/20 shadow-sm inline-block translate-y-1 mt-1 md:mt-0">กู้คืนความทรงจำที่หายไป</span> กลับคืนมา!
              </p>
            </div>

            <button
              onClick={() => setShowTutorial(false)}
              className={`${styles.navBtn} ${styles.navBtnPrimary} w-full text-xl md:text-3xl py-4 md:py-8 rounded-2xl md:rounded-[2.5rem] border-4 border-black shadow-[0_6px_0_#1a1a1a] md:shadow-[0_12px_0_#1a1a1a] hover:translate-y-2 hover:shadow-[0_4px_0_#1a1a1a] transition-all duration-200 active:translate-y-3 active:shadow-none`}
            >
              เข้าใจแล้ว เริ่มผจญภัย! 🚀
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
        <div className="flex flex-col">
          <h1 className={styles.mapTitle}>🗺️ ยินดีต้อนรับ, {userName}</h1>
          <p className="text-[var(--text-muted)] text-sm font-black ml-1 uppercase tracking-widest">เป้าหมาย: ฟื้นฟูให้ครบ 10 หมู่บ้าน</p>
        </div>
        <div className={styles.topActions}>
          <button className={styles.actionBtn} onClick={() => router.push('/leaderboard')}>
            🏆 อันดับ
          </button>
          <button className={styles.actionBtn} onClick={() => setShowTutorial(true)}>
            ❓ วิธีเล่น
          </button>
          <span className={styles.actionBtn}>
            🔑 {currentKeys}/{MAX_KEYS} {formatCountdown(nextRegenIn)}
          </span>
          <button
            className={styles.actionBtn}
            onClick={() => {
              setSlideIndex(0)
              setShowIntro(true)
            }}
          >
            📖 บทนำ
          </button>

          <button className={styles.actionBtn} onClick={resetProgress}>
            🔄 รีเซ็ต
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
              return 'url("/assets/Assets\'Employer/Background/แผนที่ 10 หมู่บ้าน/พื้นธรรมดา.PNG")';
            }
            return `url("/assets/Assets\'Employer/Background/แผนที่ 10 หมู่บ้าน/ปลดล็อก ${Math.max(1, Math.min(10, maxUnlocked))} .PNG")`;
          })()
        }}
      >
        {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((stage) => {
          const exp = villageExp[stage] ?? 0
          const state = getStageState(stage, unlockedVillages, exp)
          const pos = STAGE_POSITIONS[stage - 1]
          const iconFilename = state === 'locked' ? LOCKED_ICONS[stage - 1] : UNLOCKED_ICONS[stage - 1]
          const iconFolder = state === 'locked' ? 'ไม่มีสี (ยังไม่ปลดล็อก)' : 'มีสี (ปลดล็อกแล้ว)'
          const iconPath = `/assets/Assets'Employer/Background/แผนที่ 10 หมู่บ้าน/ตัวหมู่บ้าน/${iconFolder}/${iconFilename}`

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
              <span className="bg-[var(--card-bg)] text-[var(--text-main)] px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] sm:text-[10px] md:text-xs font-black shadow-[1px_1px_0_var(--border-dark)] sm:shadow-[2px_2px_0_var(--border-dark)] uppercase tracking-widest whitespace-nowrap mt-1">
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

