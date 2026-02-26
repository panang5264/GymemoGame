'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import styles from './world.module.css'
import {
  loadProgress,
  saveProgress,
  getDefaultProgress,
  getKeys,
  isVillageUnlocked,
  getVillageProgress,
  PLAYS_PER_VILLAGE,
  MAX_KEYS,
} from '@/lib/levelSystem'
import { getExpPercent } from '@/lib/scoring'

const TOTAL_STAGES = 10

const STAGE_POSITIONS: Array<{ x: number; y: number }> = [
  { x: 10, y: 70 },
  { x: 20, y: 55 },
  { x: 30, y: 65 },
  { x: 40, y: 50 },
  { x: 50, y: 60 },
  { x: 60, y: 45 },
  { x: 70, y: 55 },
  { x: 80, y: 40 },
  { x: 85, y: 60 },
  { x: 90, y: 45 },
]

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
  unlockedVillages: number[]
): 'completed' | 'current' | 'locked' {
  if (!unlockedVillages.includes(stage)) return 'locked'
  // "current" = highest unlocked stage that isn't exp-tube-filled
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

  const refreshProgress = useCallback(() => {
    const p = loadProgress()
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
  }, [])

  useEffect(() => {
    refreshProgress()
    setMounted(true)
  }, [refreshProgress])

  // Keys ticker
  useEffect(() => {
    if (!mounted) return
    const tick = () => {
      const { currentKeys: ck, nextRegenIn: nr } = getKeys()
      setCurrentKeys(ck)
      setNextRegenIn(nr)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [mounted])

  function closeIntro() {
    setShowIntro(false)
    setSlideIndex(0)
    const p = loadProgress()
    p.introSeen = true
    saveProgress(p)
  }

  function resetProgress() {
    const fresh = getDefaultProgress()
    fresh.introSeen = true
    saveProgress(fresh)
    setUnlockedVillages(fresh.unlockedVillages)
    setVillageExp({})
    const { currentKeys: ck, nextRegenIn: nr } = getKeys()
    setCurrentKeys(ck)
    setNextRegenIn(nr)
  }

  function handleStageClick(stage: number) {
    if (isVillageUnlocked(stage)) {
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

      {/* Mission Briefing Modal */}
      {selectedVillage && (
        <div className={styles.introOverlay} style={{ zIndex: 10000 }}>
          <div className={`${styles.introCard} max-w-lg border-t-8 border-indigo-500`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Village Mission</span>
                <h2 className="text-4xl font-black text-slate-800 mt-2">หมู่บ้านที่ {selectedVillage}</h2>
              </div>
              <button onClick={() => setSelectedVillage(null)} className="text-slate-300 hover:text-red-500 text-2xl font-black transition-colors">✕</button>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 mb-8 border border-slate-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">🚩</div>
                <div>
                  <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Difficulty</div>
                  <div className="text-slate-800 font-black">{selectedVillage <= 3 ? 'ระดับเริ่มต้น 🌱' : selectedVillage <= 7 ? 'ระดับกลาง ⚔️' : 'ระดับสูง 🔥'}</div>
                </div>
              </div>
              <p className="text-slate-500 font-bold leading-relaxed">
                หมู่บ้านนี้ต้องการความช่วยเหลือในการจัดการทรัพยากรและการคำนวณที่แม่นยำ
                {selectedVillage === 10 ? ' นี่คือภารกิจสุดท้ายของเรา ทุกอย่างตัดสินกันที่นี่!' : ' ยิ่งระดับสูงขึ้น โจทย์จะยิ่งท้าทายความสามารถของคุณมากขึ้น'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className={`${styles.navBtn} ${styles.navBtnPrimary} w-full`}
                onClick={() => router.push(`/world/${selectedVillage}`)}
              >
                เข้าสู่ภารกิจ 🏹
              </button>
              <button
                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all"
                onClick={() => setSelectedVillage(null)}
              >
                ย้อนกลับ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Modal */}
      {showTutorial && (
        <div className={styles.introOverlay} style={{ zIndex: 11000 }}>
          <div className={`${styles.introCard} max-w-2xl`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black text-slate-800">คู่มือแนะนำการเล่น 🧠</h2>
              <button onClick={() => setShowTutorial(false)} className="text-slate-300 text-2xl">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <div className="text-4xl mb-4">📦</div>
                <h4 className="font-black text-blue-800 mb-2">Management</h4>
                <p className="text-xs font-bold text-blue-600/70 leading-relaxed">แยกแยะหมวดหมู่สิ่งของ และจัดการทรัพยากรให้ถูกต้องตามเงื่อนไข (เช่น สี, รูปทรง)</p>
              </div>
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                <div className="text-4xl mb-4">🔢</div>
                <h4 className="font-black text-amber-800 mb-2">Calculation</h4>
                <p className="text-xs font-bold text-amber-600/70 leading-relaxed">ฝึกทักษะความไวในการคิดเลข แก้โจทย์คณิตศาสตร์ให้แม่นยำที่สุดภายใต้ความกดดัน</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-3xl border border-purple-100">
                <div className="text-4xl mb-4">🗺️</div>
                <h4 className="font-black text-purple-800 mb-2">Spatial</h4>
                <p className="text-xs font-bold text-purple-600/70 leading-relaxed">ฝึกการมองทัศนียภาพในแบบ 3 มิติ จับคู่มุมมองและรอยแหว่งของวัตถุให้ถูกต้อง</p>
              </div>
            </div>
            <button onClick={() => setShowTutorial(false)} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-xl shadow-xl">
              เข้าใจแล้ว ลุยกันเลย! 🚀
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
              <p className="text-slate-400 text-[10px] mt-4 font-bold uppercase tracking-widest leading-loose">
                ความตระหนักรู้นี้ช่วยให้คุณนำสิ่งที่คุณเรียนรู้กลับไปฟื้นฟูหมู่บ้านทั้ง 10 ให้กลับมามีชีวิตชีวาอีกครั้ง!
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                className={`${styles.navBtn} ${styles.navBtnPrimary} w-full shadow-[0_10px_30px_rgba(79,70,229,0.3)]`}
                onClick={() => setShowEnding(false)}
              >
                ฟื้นฟูหมู่บ้านด้วยใจ 🏘️
              </button>
              <button
                className="text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors py-2"
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
          <p className="text-white/60 text-xs font-bold ml-1">เป้าหมาย: ฟื้นฟูให้ครบ 10 หมู่บ้าน</p>
        </div>
        <div className={styles.topActions}>
          <button className={styles.actionBtn} onClick={() => router.push('/leaderboard')}>
            🏆 อันดับ
          </button>
          <button className={styles.actionBtn} onClick={() => setShowTutorial(true)}>
            ❓ วิธีเล่น
          </button>
          <span
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '2px solid rgba(255,255,255,0.5)',
              color: '#fff',
              fontWeight: 700,
              padding: '0.5rem 1rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {keysLabel}
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
          <button
            className={styles.actionBtn}
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', {
                key: 'c',
                altKey: true,
                shiftKey: true,
                bubbles: true
              }))
            }}
            style={{ borderColor: '#667eea', color: '#818cf8', background: 'rgba(255,255,255,0.9)' }}
          >
            🛠️ Debug Cheat
          </button>
          <button className={styles.actionBtn} onClick={resetProgress}>
            🔄 รีเซ็ต
          </button>
        </div>
      </div>

      <div className={styles.mapContainer}>
        {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map((stage) => {
          const state = getStageState(stage, unlockedVillages)
          const pos = STAGE_POSITIONS[stage - 1]
          const exp = villageExp[stage] ?? 0
          return (
            <button
              key={stage}
              className={`${styles.stageNode} ${styles[state]}`}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              onClick={() => handleStageClick(stage)}
              title={state === 'locked' ? 'ล็อก' : `หมู่บ้าน ${stage}`}
            >
              <span className={styles.stageIcon}>
                {state === 'completed' ? '⭐' : state === 'current' ? '▶' : '🔒'}
              </span>
              <span className={styles.stageLabel}>ด่าน {stage}</span>
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
          EXP {Object.values(villageExp).filter((v) => v >= 100).length}/{TOTAL_STAGES}
        </span>
      </div>
    </div>
  )
}

