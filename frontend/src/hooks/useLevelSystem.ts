import { useProgress } from '@/contexts/ProgressContext'
import * as LevelSystem from '@/lib/levelSystem'
import { DailyModeCompletion, GymemoProgressV2, VillageRunRecord } from '@/lib/levelSystem'

export function useLevelSystem() {
    const { progress, saveProgress } = useProgress()

    const getVillageProgress = (villageId: number) => {
        return LevelSystem.getVillageProgress(progress, villageId)
    }

    const recordPlay = async (
        villageId: number,
        scoreGained: number,
        gameType?: 'management' | 'calculation' | 'spatial' | 'reaction',
        subId?: number,
        accuracy?: number,
        timeTaken?: number
    ) => {
        const nextProgress = LevelSystem.recordPlay(progress, villageId, scoreGained, gameType, subId, accuracy, timeTaken)
        await saveProgress(nextProgress)

        // Additionally sync to analysis backend if guestId exists
        if (nextProgress.guestId && gameType) {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
            try {
                // Ensure we use a conservative normalized score if needed, or the backend handles it
                // Based on analysisService.js, it expects raw score and normalizes it there.
                await fetch(`${API_BASE_URL}/analysis/record`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        guestId: nextProgress.guestId,
                        gameType: gameType,
                        level: villageId,
                        subLevelId: subId || 0,
                        score: scoreGained,
                        accuracy: accuracy || 100,
                        timeTaken: timeTaken || 0
                    })
                })
            } catch (err) {
                console.error('Failed to sync to analysis backend:', err)
            }
        }
    }

    const recordVillageRun = async (
        villageId: number,
        scores: { management: number; calculation: number; spatial: number }
    ) => {
        const nextProgress = LevelSystem.recordVillageRun(progress, villageId, scores)
        await saveProgress(nextProgress)
    }

    const accumulateRunScore = async (
        villageId: number,
        gameType: 'management' | 'calculation' | 'spatial',
        score: number
    ) => {
        const nextProgress = LevelSystem.accumulateRunScore(progress, villageId, gameType, score)
        await saveProgress(nextProgress)
    }

    const getVillageRunHistory = (villageId: number): VillageRunRecord[] => {
        return LevelSystem.getVillageRunHistory(progress, villageId)
    }

    const getKeys = (now?: number) => {
        const result = LevelSystem.getKeys(progress, now)
        if (result.updatedProgress) {
            saveProgress(result.updatedProgress)
        }
        return { currentKeys: result.currentKeys, nextRegenIn: result.nextRegenIn }
    }

    const consumeKey = async (): Promise<boolean> => {
        const result = LevelSystem.consumeKey(progress)
        if (result) {
            await saveProgress(result)
            return true
        }
        return false
    }

    const getDailyProgress = (dateKey: string): DailyModeCompletion => {
        return LevelSystem.getDailyProgress(progress, dateKey)
    }

    const addKeys = async (count: number) => {
        const nextProgress = LevelSystem.addKeys(progress, count)
        await saveProgress(nextProgress)
    }

    const markDailyMode = async (
        dateKey: string,
        mode: 'management' | 'calculation' | 'spatial'
    ) => {
        const nextProgress = LevelSystem.markDailyMode(progress, dateKey, mode)
        await saveProgress(nextProgress)
    }

    const saveDailyScore = async (seed: string, minigame: 'management' | 'calculation' | 'spatial', score: number, total: number = 0) => {
        const nextProgress = LevelSystem.saveDailyScore(progress, seed, minigame, score, total)
        await saveProgress(nextProgress)
    }

    const isDailyComplete = (dateKey: string): boolean => {
        return LevelSystem.isDailyComplete(progress, dateKey)
    }

    const isVillageUnlocked = (villageId: number): boolean => {
        return LevelSystem.isVillageUnlocked(progress, villageId)
    }

    return {
        progress,
        saveProgress,
        getVillageProgress,
        recordPlay,
        recordVillageRun,
        accumulateRunScore,
        getVillageRunHistory,
        getKeys,
        consumeKey,
        getDailyProgress,
        addKeys,
        markDailyMode,
        saveDailyScore,
        isDailyComplete,
        isVillageUnlocked
    }
}
