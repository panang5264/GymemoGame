/**
 * Village 1 progression tracking
 *
 * Village 1 contains VILLAGE1_TOTAL_LEVELS (12) sub-levels.
 * Progress is stored in localStorage as the count of completed sub-levels.
 * Once all 12 are cleared, isVillage1Completed() returns true and the
 * Daily Challenge becomes accessible.
 */

const VILLAGE1_KEY = 'gymemo_village1_progress'

/** Total number of sub-levels in Village 1. */
export const VILLAGE1_TOTAL_LEVELS = 12

/** Returns the number of sub-levels completed (0–12). */
export function getVillage1Progress(): number {
  if (typeof window === 'undefined') return 0
  const raw = localStorage.getItem(VILLAGE1_KEY)
  if (!raw) return 0
  try {
    const { completed } = JSON.parse(raw) as { completed: number }
    return Math.min(Math.max(completed, 0), VILLAGE1_TOTAL_LEVELS)
  } catch {
    return 0
  }
}

/** Advances progress by one sub-level (no-op if already maxed). */
export function completeVillage1SubLevel(): void {
  if (typeof window === 'undefined') return
  const current = getVillage1Progress()
  if (current < VILLAGE1_TOTAL_LEVELS) {
    localStorage.setItem(VILLAGE1_KEY, JSON.stringify({ completed: current + 1 }))
  }
}

/** Returns true when all 12 sub-levels have been cleared. */
export function isVillage1Completed(): boolean {
  return getVillage1Progress() >= VILLAGE1_TOTAL_LEVELS
}

/** Resets Village 1 progress (useful for development / testing). */
export function resetVillage1Progress(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(VILLAGE1_KEY)
}
