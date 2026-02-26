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
const RESET_HOUR = 22 // 22:00 or 10 PM

/** 
 * Returns a "YYYY-MM-DD" string for the "game day".
 * If it's before 22:00, it's still the "calendar day".
 * If it's 22:00 or later, it's considered the "next calendar day".
 */
export function getDateKey(now?: Date): string {
  const d = now ?? new Date()
  const dEffective = new Date(d)

  // If we are past 22:00, we're effectively in the "next game day"
  if (d.getHours() >= RESET_HOUR) {
    dEffective.setDate(dEffective.getDate() + 1)
  }

  const y = dEffective.getFullYear()
  const m = String(dEffective.getMonth() + 1).padStart(2, '0')
  const day = String(dEffective.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns a Date object representing the next reset time (22:00:00). */
export function getNextResetTime(now?: Date): Date {
  const d = now ?? new Date()
  const reset = new Date(d)

  reset.setHours(RESET_HOUR, 0, 0, 0)

  // If it's already past 22:00 today, the next reset is 22:00 tomorrow
  if (d.getHours() >= RESET_HOUR) {
    reset.setDate(reset.getDate() + 1)
  }

  return reset
}

/**
 * Returns true if the player has not yet completed the Daily Challenge today.
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
 */
export function markDailyChallengeCompleted(now?: Date): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getDateKey(now) }))
}

/**
 * Returns a "HH:MM:SS" countdown string until the next reset time (22:00).
 */
export function getCountdownToReset(now?: Date): string {
  const current = now ?? new Date()
  const diff = getNextResetTime(current).getTime() - current.getTime()

  if (diff <= 0) return "00:00:00"

  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
