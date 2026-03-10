const STORAGE_KEY = 'gymemo_progress_v2'
import { getDateKey } from './dailyChallenge'

export const PLAYS_PER_VILLAGE = 12;
export const MAX_KEYS = 9
export const REGEN_INTERVAL_MS = 30 * 60 * 1000

export interface VillageRunRecord {
  runNumber: number
  totalScore: number
  managementScore: number
  calculationScore: number
  spatialScore: number
  completedAt: number // timestamp
  subLevelScores?: Record<number, number>
}

export interface VillageProgress {
  playsCompleted: number
  expTubeFilled: boolean
  bestScore?: number
  runHistory?: VillageRunRecord[]
  currentRunScore?: {
    management: number
    calculation: number
    spatial: number
    reaction?: number
  }
  subLevelScores?: Record<number, number>
}

interface KeyState {
  currentKeys: number
  lastRegenAt: number
}

export interface DailyModeCompletion {
  management: boolean
  calculation: boolean
  spatial: boolean
  reaction?: boolean
}

export interface GymemoProgressV2 {
  introSeen: boolean
  villages: Record<string, VillageProgress>
  unlockedVillages: number[]
  keys: KeyState
  daily: Record<string, DailyModeCompletion>
  dailyScores: Record<string, { management: number, calculation: number, spatial: number, reaction?: number }>
  totalScore: number
  userName: string
  guestId?: string
  privacyMode?: boolean
  history?: any[]
}

import { getGuestId } from './guestId'

export function getDefaultProgress(): GymemoProgressV2 {
  return {
    introSeen: false,
    villages: {},
    unlockedVillages: [1],
    keys: { currentKeys: MAX_KEYS, lastRegenAt: Date.now() },
    daily: {},
    dailyScores: {},
    totalScore: 0,
    userName: '',
    guestId: getGuestId(),
    privacyMode: false,
    history: []
  }
}

export function getVillageProgress(p: GymemoProgressV2, villageId: number): VillageProgress {
  return p.villages[String(villageId)] ?? { playsCompleted: 0, expTubeFilled: false }
}

export function recordPlay(
  p: GymemoProgressV2,
  villageId: number,
  scoreGained: number,
  gameType?: 'management' | 'calculation' | 'spatial' | 'reaction',
  subId?: number,
  accuracy?: number,
  timeTaken?: number
): GymemoProgressV2 {
  let nextP = { ...p, villages: { ...p.villages } }
  const key = String(villageId)
  const vp = { ...(nextP.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }) }
  const newPlays = Math.min(vp.playsCompleted + 1, PLAYS_PER_VILLAGE * 99)
  const tubeFilled = newPlays >= PLAYS_PER_VILLAGE

  // SCORING LOGIC REFINEMENT:
  // 1. Play Normally (gameType provided): 
  //    Score = Performance Score + (50 * Current Keys)
  // 2. Skip with Key (gameType undefined):
  //    Score = Fixed 50 points

  let bonus = 0;
  const { currentKeys } = getKeys(nextP);

  if (gameType) {
    // Manual Play bonus: reward players for NOT using keys
    // Scale bonus with village level to prevent early-game score inflation (max 90% boost)
    bonus = 10 * currentKeys * villageId;
    const current = { ...(vp.currentRunScore ?? { management: 0, calculation: 0, spatial: 0, reaction: 0 }) }
    current[gameType] = Math.max(current[gameType] || 0, scoreGained + bonus)
    vp.currentRunScore = current

    // Auto-mark Daily Progress
    const dk = getDateKey()
    const dp = { ...(nextP.daily[dk] ?? { management: false, calculation: false, spatial: false, reaction: false }) }

    if (gameType === 'reaction') {
      dp.management = true
      nextP = saveDailyScore(nextP, dk, 'management', scoreGained + bonus)
    } else {
      dp[gameType] = true
      nextP = saveDailyScore(nextP, dk, gameType, scoreGained + bonus)
    }
    nextP.daily[dk] = dp
  } else {
    // Skip logic: only 0 points
    scoreGained = 0;
  }

  const finalScoreToAdd = scoreGained + bonus;
  nextP.totalScore += finalScoreToAdd;
  vp.playsCompleted = newPlays;
  vp.expTubeFilled = tubeFilled;
  nextP.villages[key] = vp;


  if (subId) {
    if (subId === 1 && vp.playsCompleted % PLAYS_PER_VILLAGE === 0) {
      vp.subLevelScores = {}
    }
    const scores = { ...(vp.subLevelScores ?? {}) }
    scores[subId] = scoreGained
    vp.subLevelScores = scores
  }

  if (tubeFilled && villageId < 10 && !nextP.unlockedVillages.includes(villageId + 1)) {
    nextP.unlockedVillages = [...nextP.unlockedVillages, villageId + 1]
  }

  if (tubeFilled && villageId === 10) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gymemo:game_ending'))
    }
  }

  return nextP
}

export function recordVillageRun(
  p: GymemoProgressV2,
  villageId: number,
  scores: { management: number; calculation: number; spatial: number }
): GymemoProgressV2 {
  const nextP = { ...p, villages: { ...p.villages } }
  const key = String(villageId)
  const vp = { ...(nextP.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }) }
  const total = scores.management + scores.calculation + scores.spatial
  const runNum = ((vp.runHistory ?? []).length) + 1
  const newRecord: VillageRunRecord = {
    runNumber: runNum,
    totalScore: total,
    managementScore: scores.management,
    calculationScore: scores.calculation,
    spatialScore: scores.spatial,
    completedAt: Date.now(),
    subLevelScores: vp.subLevelScores
  }
  vp.runHistory = [...(vp.runHistory ?? []).slice(-4), newRecord]
  if (!vp.bestScore || total > vp.bestScore) vp.bestScore = total
  nextP.villages[key] = vp
  return nextP
}

export function accumulateRunScore(
  p: GymemoProgressV2,
  villageId: number,
  gameType: 'management' | 'calculation' | 'spatial' | 'reaction',
  score: number
): GymemoProgressV2 {
  const nextP = { ...p, villages: { ...p.villages } }
  const key = String(villageId)
  const vp = { ...(nextP.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }) }
  const current = { ...(vp.currentRunScore ?? { management: 0, calculation: 0, spatial: 0, reaction: 0 }) }
  current[gameType] = Math.max(current[gameType] || 0, score)
  vp.currentRunScore = current
  nextP.villages[key] = vp
  return nextP
}

export function getVillageRunHistory(p: GymemoProgressV2, villageId: number): VillageRunRecord[] {
  return p.villages[String(villageId)]?.runHistory ?? []
}

export function getKeys(p: GymemoProgressV2, now?: number): { currentKeys: number; nextRegenIn: number; updatedProgress?: GymemoProgressV2 } {
  const currentTime = now ?? Date.now()
  const elapsed = currentTime - p.keys.lastRegenAt
  const regenCount = Math.floor(elapsed / REGEN_INTERVAL_MS)
  const newKeys = Math.min(MAX_KEYS, p.keys.currentKeys + regenCount)

  let updatedProgress
  if (regenCount > 0 && newKeys > p.keys.currentKeys) {
    updatedProgress = {
      ...p,
      keys: {
        currentKeys: newKeys,
        lastRegenAt: p.keys.lastRegenAt + regenCount * REGEN_INTERVAL_MS
      }
    }
  }

  const nextRegenIn = newKeys < MAX_KEYS ? REGEN_INTERVAL_MS - (elapsed % REGEN_INTERVAL_MS) : 0
  return { currentKeys: newKeys, nextRegenIn, updatedProgress }
}

export function consumeKey(p: GymemoProgressV2): GymemoProgressV2 | false {
  const { currentKeys } = getKeys(p)
  if (currentKeys <= 0) return false
  const nextP = { ...p, keys: { ...p.keys, currentKeys: currentKeys - 1 } }
  return nextP
}

export function getDailyProgress(p: GymemoProgressV2, dateKey: string): DailyModeCompletion {
  return p.daily[dateKey] ?? { management: false, calculation: false, spatial: false, reaction: false }
}

export function addKeys(p: GymemoProgressV2, count: number): GymemoProgressV2 {
  const { currentKeys } = getKeys(p)
  const nextP = { ...p, keys: { ...p.keys } }
  nextP.keys.currentKeys = Math.min(MAX_KEYS, currentKeys + count)
  if (nextP.keys.currentKeys >= MAX_KEYS) {
    nextP.keys.lastRegenAt = Date.now()
  }
  return nextP
}

export function markDailyMode(
  p: GymemoProgressV2,
  dateKey: string,
  mode: 'management' | 'calculation' | 'spatial' | 'reaction'
): GymemoProgressV2 {
  const nextP = { ...p, daily: { ...p.daily } }
  const dp = { ...(nextP.daily[dateKey] ?? { management: false, calculation: false, spatial: false, reaction: false }) }
  dp[mode] = true
  nextP.daily[dateKey] = dp
  return nextP
}

export function saveDailyScore(
  p: GymemoProgressV2,
  seed: string,
  minigame: 'management' | 'calculation' | 'spatial' | 'reaction',
  score: number,
  total: number = 0
): GymemoProgressV2 {
  const nextP = { ...p, dailyScores: { ...(p.dailyScores || {}) } }
  if (!nextP.dailyScores[seed]) {
    nextP.dailyScores[seed] = { management: 0, calculation: 0, spatial: 0, reaction: 0 }
  } else {
    nextP.dailyScores[seed] = { ...nextP.dailyScores[seed] }
  }
  nextP.dailyScores[seed][minigame] = score
  return nextP
}

export function isDailyComplete(p: GymemoProgressV2, dateKey: string): boolean {
  const dp = getDailyProgress(p, dateKey)
  return dp.management && dp.calculation && dp.spatial
}

export function isVillageUnlocked(p: GymemoProgressV2, villageId: number): boolean {
  return p.unlockedVillages.includes(villageId)
}

export function resetGameProgress(p: GymemoProgressV2): GymemoProgressV2 {
  const fresh = getDefaultProgress()

  // 1. Preserve Identity
  fresh.userName = p.userName
  fresh.guestId = p.guestId
  fresh.privacyMode = p.privacyMode

  // 2. Preserve Daily Progress (IMPORTANT)
  fresh.daily = p.daily || {}
  fresh.dailyScores = p.dailyScores || {}

  // 3. Preserve Global Stats & History
  fresh.totalScore = p.totalScore
  fresh.history = p.history || []

  // 4. Preserve Keys (Don't penalize user for resetting)
  fresh.keys = p.keys

  // 5. Preserve Village Best Scores & History, but reset current progress
  Object.keys(p.villages).forEach(key => {
    const cv = p.villages[key]
    if (cv) {
      fresh.villages[key] = {
        playsCompleted: 0,
        expTubeFilled: false,
        bestScore: cv.bestScore,
        runHistory: cv.runHistory || [],
        subLevelScores: {} // Reset current run sub-levels
      }
    }
  })

  // 6. Reset World Progress
  fresh.unlockedVillages = [1]
  fresh.introSeen = false // Let them see intro again if they want

  return fresh
}

