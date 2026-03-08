/**
 * Daily Challenge service module
 *
 * Reset logic: one play allowed per calendar day (local time).
 *   A "day" is identified by the YYYY-MM-DD string in the user's locale.
 *   When the clock ticks past 00:00 local time, getDateKey() returns a new
 *   string, so canPlayDailyChallenge() automatically becomes true again.
 */

const RESET_HOUR = 0 // 00:00 or Midnight

/** 
 * Returns a "YYYY-MM-DD" string for the "game day".
 */
export function getDateKey(now?: Date): string {
  const d = now ?? new Date()

  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Returns a Date object representing the next reset time (Midnight of the next day). */
export function getNextResetTime(now?: Date): Date {
  const d = now ?? new Date()
  const reset = new Date(d)

  // Set to midnight (00:00:00) of the NEXT calendar day
  reset.setDate(reset.getDate() + 1)
  reset.setHours(0, 0, 0, 0)

  return reset
}

/**
 * Returns true if the player has not yet completed the Daily Challenge today.
 */
export function canPlayDailyChallenge(isCompletedPattern: boolean): boolean {
  return !isCompletedPattern
}

/**
 * Returns a "HH:MM:SS" countdown string until the next reset time (Midnight).
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
