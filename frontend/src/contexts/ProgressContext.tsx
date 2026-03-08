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

export function ProgressProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth()
    const [progress, setProgress] = useState<GymemoProgressV2>(getDefaultProgress())
    const [isLoading, setIsLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])

    useEffect(() => {
        // Load local history on mount
        const localHistory = localStorage.getItem('gymemo_history')
        if (localHistory) {
            try {
                setHistory(JSON.parse(localHistory))
            } catch (e) {
                console.error('Failed to parse history', e)
            }
        }
    }, [])

    useEffect(() => {
        const initProgress = async () => {
            setIsLoading(true)
            if (token) {
                try {
                    const res = await fetchSyncProgress(token)
                    if (res.success && res.data && Object.keys(res.data).length > 0) {
                        const merged = { ...getDefaultProgress(), ...res.data }
                        setProgress(merged)
                        // Also sync current total score to local history if not exists
                        syncToLocalHistory(merged)
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
                setProgress(getDefaultProgress())
            }
            setIsLoading(false)
        }

        initProgress()
    }, [token])

    const syncToLocalHistory = (p: GymemoProgressV2) => {
        const localHistory = localStorage.getItem('gymemo_history')
        let historyArray = []
        if (localHistory) {
            try { historyArray = JSON.parse(localHistory) } catch (e) { }
        }

        // Add current state as a snapshot if totalScore > 0 or at least one play
        if (p.totalScore > 0) {
            const lastEntry = historyArray[0]
            const currentVillages = p.unlockedVillages.length

            // Only add if it's a new achievement
            if (!lastEntry || lastEntry.score !== p.totalScore || lastEntry.villages !== currentVillages) {
                const newEntry = {
                    date: new Date().toISOString(),
                    score: p.totalScore,
                    villages: currentVillages,
                    userName: p.userName || 'นักสำรวจ',
                    lastVillage: p.unlockedVillages[p.unlockedVillages.length - 1]
                }
                const updatedHistory = [newEntry, ...historyArray].slice(0, 15)
                localStorage.setItem('gymemo_history', JSON.stringify(updatedHistory))
                setHistory(updatedHistory)
            }
        }
    }

    const saveProgress = async (newProgress: GymemoProgressV2) => {
        setProgress(newProgress)
        syncToLocalHistory(newProgress)
        if (token) {
            try {
                await updateSyncProgress(token, newProgress)
            } catch (err) {
                console.error('Failed to sync progress to DB:', err)
            }
        }
    }

    return (
        <ProgressContext.Provider value={{ progress, setProgress, saveProgress, isLoading, history }}>
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
