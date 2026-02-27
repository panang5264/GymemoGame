/**
 * Village 1 progression tracking (Legacy wrapper for levelSystem)
 */
import { getVillageProgress, PLAYS_PER_VILLAGE, GymemoProgressV2 } from './levelSystem'

/** Total number of sub-levels in Village 1. */
export const VILLAGE1_TOTAL_LEVELS = PLAYS_PER_VILLAGE

/** Returns the number of sub-levels completed (0–12). */
export function getVillage1Progress(progress: GymemoProgressV2): number {
  const vp = getVillageProgress(progress, 1)
  return vp.playsCompleted
}

/** Returns true when all 12 sub-levels have been cleared. */
export function isVillage1Completed(progress: GymemoProgressV2): boolean {
  return getVillage1Progress(progress) >= VILLAGE1_TOTAL_LEVELS
}

/** Advances progress by one sub-level - handled by recordPlay in components */
export function completeVillage1SubLevel(): void {
  // This is now handled by recordPlay(1, score) in the games
}

/** Resets Village 1 progress - handled by clearing localStorage or reset button */
export function resetVillage1Progress(): void {
  // Handled structurally now
}
