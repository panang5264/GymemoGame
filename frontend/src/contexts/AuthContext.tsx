'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import { getUserProfile } from '@/lib/api'
import { fetchAndMergeProgress } from '@/lib/levelSystem'

interface User {
    _id: string
    name: string
    phone: string
    highScore: number
    createdAt: string
}

interface AuthContextType {
    user: User | null
    token: string | null
    loading: boolean
    login: (token: string, userData: User) => Promise<void>
    logout: () => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    token: null,
    loading: true,
    login: async () => { },
    logout: () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Check for token on mount
        const storedToken = Cookies.get('token')
        if (storedToken) {
            setToken(storedToken)
            fetchUser(storedToken)
        } else {
            setLoading(false)
        }
    }, [])

    const fetchUser = async (authToken: string) => {
        try {
            const data = await getUserProfile(authToken)
            if (data.success) {
                setUser(data.data)
                // Sync progression data from server
                await fetchAndMergeProgress(authToken)
            } else {
                logout()
            }
        } catch (error) {
            console.error('Error fetching user profile:', error)
            logout()
        } finally {
            setLoading(false)
        }
    }

    const login = async (authToken: string, userData: User) => {
        Cookies.set('token', authToken, { expires: 7 }) // 7 days
        setToken(authToken)
        setUser(userData)
        // Sync progression on initial login
        await fetchAndMergeProgress(authToken)
    }

    const logout = () => {
        Cookies.remove('token')
        setToken(null)
        setUser(null)
        // Ensure log out resets game progress to prevent next guest from seeing it
        if (typeof window !== 'undefined') {
            localStorage.removeItem('gymemo_progress_v2')
        }
    }

    return (
        <AuthContext.Provider value={{ user, token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
