"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Session } from '@supabase/supabase-js'
import { AuthModal } from './auth-modal'

interface AuthContextType {
    session: Session | null
    loading: boolean
    openAuthModal: (type?: 'login' | 'signup') => void
    closeAuthModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ 
    children, 
    initialSession 
}: { 
    children: React.ReactNode, 
    initialSession: Session | null 
}) {
    const [session, setSession] = useState<Session | null>(initialSession)
    const [loading, setLoading] = useState(!initialSession)
    const [modalOpen, setModalOpen] = useState(false)
    const [modalType, setModalType] = useState<'login' | 'signup'>('login')

    const supabase = createClient()

    useEffect(() => {
        // Only fetch if initialSession was missing or might be stale
        if (!initialSession) {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setSession(session)
                setLoading(false)
            })
        } else {
            setLoading(false)
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [initialSession, supabase.auth])

    const openAuthModal = (type: 'login' | 'signup' = 'login') => {
        setModalType(type)
        setModalOpen(true)
    }

    const closeAuthModal = () => setModalOpen(false)

    return (
        <AuthContext.Provider value={{ session, loading, openAuthModal, closeAuthModal }}>
            {children}
            <AuthModal 
                isOpen={modalOpen} 
                onOpenChange={setModalOpen} 
                type={modalType} 
            />
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
