import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
    token: string | null
    user: User | null
    isLoggedIn: boolean
    setAuth: (token: string, user: User) => void
    clearAuth: () => void
    updateUser: (user: User) => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            isLoggedIn: false,
            setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
            clearAuth: () => set({ token: null, user: null, isLoggedIn: false }),
            updateUser: (user) => set({ user }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token, user: state.user }),
            onRehydrateStorage: () => (state) => {
                if (state?.token) state.isLoggedIn = true
            },
        },
    ),
)

export function getRoleCode(user: User | null): string {
    return (user?.roleCode || user?.roleName || '').toUpperCase()
}

export function getDefaultRoute(isLoggedIn: boolean, user: User | null): string {
    if (!isLoggedIn) return '/'
    const role = getRoleCode(user)
    if (role === 'ADMIN') return '/admin'
    if (role === 'LANDLORD') return '/landlord'
    return '/user'
}
