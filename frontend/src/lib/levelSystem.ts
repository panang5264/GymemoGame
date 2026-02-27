const STORAGE_KEY = 'gymemo_progress_v2'

export const PLAYS_PER_VILLAGE = 12
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
  }
  subLevelScores?: Record<number, number>
}

interface KeyState {
  currentKeys: number
  lastRegenAt: number
}

interface DailyModeCompletion {
  management: boolean
  calculation: boolean
  spatial: boolean
}

export interface GymemoProgressV2 {
  introSeen: boolean
  villages: Record<string, VillageProgress>
  unlockedVillages: number[]
  keys: KeyState
  daily: Record<string, DailyModeCompletion>
  totalScore: number
  userName: string
}

export function getDefaultProgress(): GymemoProgressV2 {
  return {
    introSeen: false,
    villages: {},
    unlockedVillages: [1],
    keys: { currentKeys: MAX_KEYS, lastRegenAt: Date.now() },
    daily: {},
    totalScore: 0,
    userName: '',
  }
}

export function loadProgress(): GymemoProgressV2 {
  if (typeof window === 'undefined') return getDefaultProgress()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GymemoProgressV2>
      return { ...getDefaultProgress(), ...parsed }
    }
  } catch { }
  return getDefaultProgress()
}

export function saveProgress(p: GymemoProgressV2): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function getVillageProgress(villageId: number): VillageProgress {
  const p = loadProgress()
  return p.villages[String(villageId)] ?? { playsCompleted: 0, expTubeFilled: false }
}

export function recordPlay(
  villageId: number,
  scoreGained: number,
  gameType?: 'management' | 'calculation' | 'spatial',
  subId?: number
): GymemoProgressV2 {
  const p = loadProgress()
  const key = String(villageId)
  const vp = p.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }
  const newPlays = Math.min(vp.playsCompleted + 1, PLAYS_PER_VILLAGE * 99) // allow replaying beyond max
  const tubeFilled = newPlays >= PLAYS_PER_VILLAGE

  // Accumulate score per game type if provided
  if (gameType) {
    const current = vp.currentRunScore ?? { management: 0, calculation: 0, spatial: 0 }
    current[gameType] = Math.max(current[gameType] || 0, scoreGained)
    vp.currentRunScore = current
  }

  // Save sub-level score
  if (subId) {
    if (subId === 1 && vp.playsCompleted % PLAYS_PER_VILLAGE === 0) {
      vp.subLevelScores = {}
    }
    const scores = vp.subLevelScores ?? {}
    scores[subId] = scoreGained
    vp.subLevelScores = scores
  }

  // Preserve extended fields when updating village progress
  p.villages[key] = { ...vp, playsCompleted: newPlays, expTubeFilled: tubeFilled }

  // Special logic: if this was the last level (12), we might want to archive later, 
  // but for now let's just keep the scores until the next run starts.
  // Actually, if playsCompleted reached a multiple of 12, it's the end of a run.
  if (newPlays % PLAYS_PER_VILLAGE === 0 && newPlays > 0) {
    // End of run - but we might want to keep subLevelScores for the summary view
    // until the user starts a new sub-level in the next run.
  }

  p.totalScore += scoreGained

  if (tubeFilled && villageId < 10 && !p.unlockedVillages.includes(villageId + 1)) {
    p.unlockedVillages = [...p.unlockedVillages, villageId + 1]
  }
  if (tubeFilled && villageId === 10) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gymemo:game_ending'))
    }
  }
  saveProgress(p)
  return p
}

/**
 * Records a completed village run with per-game-type scores.
 * Call this when all 3 sub-games in a village are done.
 */
export function recordVillageRun(
  villageId: number,
  scores: { management: number; calculation: number; spatial: number }
): void {
  const p = loadProgress()
  const key = String(villageId)
  const vp = p.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }
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
  vp.runHistory = [...(vp.runHistory ?? []).slice(-4), newRecord] // Keep last 5 runs
  if (!vp.bestScore || total > vp.bestScore) vp.bestScore = total
  p.villages[key] = vp
  saveProgress(p)
}

/**
 * Accumulates score for a specific game type within the current run of a village.
 */
export function accumulateRunScore(
  villageId: number,
  gameType: 'management' | 'calculation' | 'spatial',
  score: number
): void {
  const p = loadProgress()
  const key = String(villageId)
  const vp = p.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }
  const current = vp.currentRunScore ?? { management: 0, calculation: 0, spatial: 0 }
  current[gameType] = Math.max(current[gameType] || 0, score)
  vp.currentRunScore = current
  p.villages[key] = vp
  saveProgress(p)
}

export function getVillageRunHistory(villageId: number): VillageRunRecord[] {
  const p = loadProgress()
  return p.villages[String(villageId)]?.runHistory ?? []
}

export function getKeys(now?: number): { currentKeys: number; nextRegenIn: number } {
  const p = loadProgress()
  const currentTime = now ?? Date.now()
  const elapsed = currentTime - p.keys.lastRegenAt
  const regenCount = Math.floor(elapsed / REGEN_INTERVAL_MS)
  const newKeys = Math.min(MAX_KEYS, p.keys.currentKeys + regenCount)

  if (regenCount > 0) {
    p.keys.currentKeys = newKeys
    p.keys.lastRegenAt = p.keys.lastRegenAt + regenCount * REGEN_INTERVAL_MS
    saveProgress(p)
  }

  const nextRegenIn =
    newKeys < MAX_KEYS ? REGEN_INTERVAL_MS - (elapsed % REGEN_INTERVAL_MS) : 0

  return { currentKeys: newKeys, nextRegenIn }
}

export function consumeKey(): boolean {
  const { currentKeys } = getKeys()
  if (currentKeys <= 0) return false
  const p = loadProgress()
  p.keys.currentKeys = currentKeys - 1
  saveProgress(p)
  return true
}

export function getDailyProgress(dateKey: string): DailyModeCompletion {
  const p = loadProgress()
  return p.daily[dateKey] ?? { management: false, calculation: false, spatial: false }
}

export function addKeys(count: number): void {
  const p = loadProgress()
  const { currentKeys } = getKeys()
  p.keys.currentKeys = Math.min(MAX_KEYS, currentKeys + count)
  p.keys.lastRegenAt = Date.now() // Reset timer for next regen from this point if full
  saveProgress(p)
}

export function markDailyMode(
  dateKey: string,
  mode: 'management' | 'calculation' | 'spatial'
): void {
  const p = loadProgress()
  const dp = p.daily[dateKey] ?? { management: false, calculation: false, spatial: false }
  dp[mode] = true
  p.daily[dateKey] = dp

  // If this mode completion makes it 100%, reward a key
  if (dp.management && dp.calculation && dp.spatial) {
    // Reward logic is handled in the UI normally, but we can ensure the state is prepped
  }

  saveProgress(p)
}

export function isDailyComplete(dateKey: string): boolean {
  const dp = getDailyProgress(dateKey)
  return dp.management && dp.calculation && dp.spatial
}

export function isVillageUnlocked(villageId: number): boolean {
  const p = loadProgress()
  return p.unlockedVillages.includes(villageId)
}
