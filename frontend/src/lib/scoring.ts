import { PLAYS_PER_VILLAGE as _PLAYS_PER_VILLAGE } from './levelSystem'

// Re-export for consumers that import only from scoring
export const PLAYS_PER_VILLAGE = _PLAYS_PER_VILLAGE

/**
 * Calculates score for a completed run.
 * Only awards score when run is 100% correct (perfect=true).
 * timePercent = (timeUsed * 100) / timeLimit
 * baseMaxScore = villageIndex * 100 (village 1 => 100, village 2 => 200, ...)
 * finalScore = (timePercent/100) * baseMaxScore
 */
export function calculateScore(params: {
  villageIndex: number
  timeUsed: number
  timeLimit: number
  perfect: boolean
}): number {
  if (!params.perfect) return 0
  const timePercent = (params.timeUsed * 100) / params.timeLimit
  const baseMaxScore = params.villageIndex * 100
  return Math.round((timePercent / 100) * baseMaxScore)
}

export function getExpPercent(playsCompleted: number): number {
  return Math.min(100, Math.round((playsCompleted / PLAYS_PER_VILLAGE) * 100))
}
