/**
 * Admin session.
 *
 * The backend issues a JWT on login and also sets it as an httpOnly cookie.
 * The dashboard uses the bearer token so it works unchanged when the API is
 * served from another origin, and re-validates it against `/api/auth/me` on
 * mount — a token that has expired server-side never leaves a stale UI behind.
 */
/* eslint-disable react-refresh/only-export-components -- the provider and its hook belong together; splitting them buys a file, not clarity. */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, ApiError, tokenStore, type AdminUser } from './api'

interface AuthState {
  user: AdminUser | null
  /** True until the stored token has been checked, so routes do not flash. */
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    api.auth
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        tokenStore.set(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await api.auth.login(email, password)
    tokenStore.set(result.token)
    setUser(result.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.auth.logout()
    } catch (err) {
      // A dead session is still a successful logout from the user's side.
      if (!(err instanceof ApiError)) throw err
    }
    tokenStore.set(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}

/** Route guard: anonymous visitors are sent to the login screen. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted text-ui">
        Checking your session…
      </div>
    )
  }
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  return <>{children}</>
}
