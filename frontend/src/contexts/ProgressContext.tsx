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
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined)

export function ProgressProvider({ children }: { children: ReactNode }) {
    const { token } = useAuth()
    const [progress, setProgress] = useState<GymemoProgressV2>(getDefaultProgress())
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const initProgress = async () => {
            if (token) {
                try {
                    const res = await fetchSyncProgress(token)
                    if (res.success && res.data && Object.keys(res.data).length > 0) {
                        setProgress({ ...getDefaultProgress(), ...res.data })
                    } else {
                        // User exists but no progress, initialize in DB
                        const defaultP = getDefaultProgress()
                        setProgress(defaultP)
                        await updateSyncProgress(token, defaultP)
                    }
                } catch (err) {
                    console.error('Failed to sync progress on mount:', err)
                }
            } else {
                setProgress(getDefaultProgress())
            }
            setIsLoading(false)
        }

        initProgress()
    }, [token])

    const saveProgress = async (newProgress: GymemoProgressV2) => {
        setProgress(newProgress)
        if (token) {
            try {
                await updateSyncProgress(token, newProgress)
            } catch (err) {
                console.error('Failed to sync progress to DB:', err)
            }
        }
    }

    return (
        <ProgressContext.Provider value={{ progress, setProgress, saveProgress, isLoading }}>
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
