import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { getStoredAuth, setStoredAuth, type StoredAuth } from '../api/client'

interface AuthContextValue {
  auth: StoredAuth | null
  login: (auth: StoredAuth) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => getStoredAuth())

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      login: (next) => {
        setStoredAuth(next)
        setAuth(next)
      },
      logout: () => {
        setStoredAuth(null)
        setAuth(null)
      },
    }),
    [auth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
