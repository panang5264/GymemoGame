/**
 * Daily Challenge service module
 *
 * Persistence: uses localStorage key "gymemo_daily_challenge".
 * Reset logic: one play allowed per calendar day (local time).
 *   A "day" is identified by the YYYY-MM-DD string in the user's locale.
 *   When the clock ticks past 00:00 local time, getDateKey() returns a new
 *   string, so canPlayDailyChallenge() automatically becomes true again.
 */

const STORAGE_KEY = 'gymemo_daily_challenge'

/** Returns a "YYYY-MM-DD" string for the given date in local time. */
export function getDateKey(now?: Date): string {
  const d = now ?? new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns a Date object representing the next local midnight (00:00:00). */
export function getNextMidnight(now?: Date): Date {
  const d = now ?? new Date()
  const midnight = new Date(d)
  midnight.setDate(midnight.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  return midnight
}

/**
 * Returns true if the player has not yet completed the Daily Challenge today.
 * Returns false when called outside a browser (SSR); client components should
 * call this inside useEffect to read the accurate value.
 */
export function canPlayDailyChallenge(now?: Date): boolean {
  if (typeof window === 'undefined') return false
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return true
  try {
    const { date } = JSON.parse(raw) as { date: string }
    return date !== getDateKey(now)
  } catch {
    return true
  }
}

/**
 * Records that the Daily Challenge was completed today.
 * Call this after all 3 stages are finished.
 */
export function markDailyChallengeCompleted(now?: Date): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getDateKey(now) }))
}

/**
 * Returns a "HH:MM:SS" countdown string until the next local midnight reset.
 */
export function getCountdownToReset(now?: Date): string {
  const current = now ?? new Date()
  const diff = getNextMidnight(current).getTime() - current.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
