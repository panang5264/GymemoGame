const STORAGE_KEY = 'gymemo_progress_v2'

export const PLAYS_PER_VILLAGE = 12
export const MAX_KEYS = 9
export const REGEN_INTERVAL_MS = 30 * 60 * 1000

interface VillageProgress {
  playsCompleted: number
  expTubeFilled: boolean
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

export function recordPlay(villageId: number, scoreGained: number): GymemoProgressV2 {
  const p = loadProgress()
  const key = String(villageId)
  const vp = p.villages[key] ?? { playsCompleted: 0, expTubeFilled: false }
  const newPlays = Math.min(vp.playsCompleted + 1, PLAYS_PER_VILLAGE)
  const tubeFilled = newPlays >= PLAYS_PER_VILLAGE
  p.villages[key] = { playsCompleted: newPlays, expTubeFilled: tubeFilled }
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
