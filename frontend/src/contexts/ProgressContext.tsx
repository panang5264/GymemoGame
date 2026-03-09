'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { GymemoProgressV2, getDefaultProgress } from '@/lib/levelSystem'
import { fetchSyncProgress, updateSyncProgress } from '@/lib/api'
import { useAuth } from './AuthContext'

interface ProgressContextType {
    progress: GymemoProgressV2
    setProgress: React.Dispatch<React.SetStateAction<GymemoProgressV2>>
    saveProgress: (newProgress: GymemoProgressV2) => Promise<void>
    isLoading: boolean
    history: any[]
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

const STORAGE_KEY = 'gymemo_progress_v2'

export function ProgressProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth()
    const [progress, setProgress] = useState<GymemoProgressV2>(getDefaultProgress())
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // No separate state needed, history is in progress
    }, [])

    useEffect(() => {
        const initProgress = async () => {
            setIsLoading(true)
            if (token) {
                try {
                    const res = await fetchSyncProgress(token)
                    if (res.success && res.data && Object.keys(res.data).length > 0) {
                        let merged = { ...getDefaultProgress(), ...res.data }

                        // Seed history from local storage if DB history is empty
                        if (!merged.history || merged.history.length === 0) {
                            const localHistory = localStorage.getItem('gymemo_history')
                            if (localHistory) {
                                merged.history = JSON.parse(localHistory)
                            }
                        }

                        setProgress(merged)
                        syncHistory(merged)
                    } else {
                        const defaultP = getDefaultProgress()
                        setProgress(defaultP)
                        await updateSyncProgress(token, defaultP)
                    }
                } catch (err) {
                    console.error('Failed to sync progress on mount:', err)
                    setProgress(getDefaultProgress())
                }
            } else {
                // Guest mode: load full state from local storage first
                const saved = localStorage.getItem(STORAGE_KEY)
                let initialP = getDefaultProgress()

                if (saved) {
                    try {
                        const parsed = JSON.parse(saved)
                        initialP = { ...initialP, ...parsed }
                    } catch (e) {
                        console.error('Failed to parse saved guest progress:', e)
                    }
                }

                // Fallback history loading if not in main object
                const localHistory = localStorage.getItem('gymemo_history')
                if (localHistory && (!initialP.history || initialP.history.length === 0)) {
                    try { initialP.history = JSON.parse(localHistory) } catch (e) { }
                }

                setProgress(initialP)
            }
            setIsLoading(false)
        }

        initProgress()
    }, [token])

    const syncHistory = (p: GymemoProgressV2) => {
        let historyArray = p.history || []

        // Add current state as a snapshot if totalScore > 0 or at least one play
        if (p.totalScore > 0) {
            const lastEntry = historyArray[0]
            const currentVillages = p.unlockedVillages.length

            if (!lastEntry || lastEntry.score !== p.totalScore || lastEntry.villages !== currentVillages) {
                const newEntry = {
                    date: new Date().toISOString(),
                    score: p.totalScore,
                    villages: currentVillages,
                    userName: p.userName || 'นักสำรวจ',
                    lastVillage: p.unlockedVillages[p.unlockedVillages.length - 1]
                }
                const updatedHistory = [newEntry, ...historyArray].slice(0, 15)

                // Save to local storage for guest/backup
                localStorage.setItem('gymemo_history', JSON.stringify(updatedHistory))

                // Update progress object (this will be synced to DB on next save)
                setProgress(prev => ({ ...prev, history: updatedHistory }))
                return updatedHistory
            }
        }
        return historyArray
    }

    const saveProgress = async (newProgress: GymemoProgressV2) => {
        // Ensure history is updated in the new progress
        const updatedWithHistory = { ...newProgress }
        if (!updatedWithHistory.history) {
            updatedWithHistory.history = progress.history || []
        }

        setProgress(updatedWithHistory)
        syncHistory(updatedWithHistory)

        if (token) {
            try {
                await updateSyncProgress(token, updatedWithHistory)
            } catch (err) {
                console.error('Failed to sync progress to DB:', err)
            }
        } else {
            // Guest mode: persist to local storage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWithHistory))
        }
    }

    return (
        <ProgressContext.Provider value={{ progress, setProgress, saveProgress, isLoading, history: progress.history || [] }}>
            {children}
        </ProgressContext.Provider>
    )
}

export const useProgress = () => {
    const context = useContext(ProgressContext)
    if (context === undefined) {
        throw new Error('useProgress must be used within a ProgressProvider')
    }
    return context
}
