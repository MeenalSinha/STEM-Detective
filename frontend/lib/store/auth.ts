import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  updateUser: (updates: Partial<User>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('stem_detective_token', token)
        }
        set({ user, token, isAuthenticated: true })
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('stem_detective_token')
          localStorage.removeItem('stem_detective_user')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'stem_detective_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)
