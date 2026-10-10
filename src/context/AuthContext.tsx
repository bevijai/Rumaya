import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, ApiError } from '@/lib/api'

export type Role = 'owner' | 'editor' | 'helper'

export interface Member {
  id: string
  name: string
  role: Role
  phone?: string
  preferredLanguage: string
}

export interface Household {
  id: string
  name: string
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  member: Member | null
  household: Household | null
  members: Member[]
  loading: boolean
}

interface AuthContextValue extends AuthState {
  /** Stores tokens after a successful OTP verify, then loads household/member info. */
  completeLogin: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => void
  /** Authenticated fetch that retries once with a refreshed access token on 401. */
  call: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>
  refreshMe: () => Promise<void>
}

const ACCESS_TOKEN_KEY = 'rumaya_access_token'
const REFRESH_TOKEN_KEY = 'rumaya_refresh_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    member: null,
    household: null,
    members: [],
    loading: true,
  })

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setState({
      accessToken: null,
      refreshToken: null,
      member: null,
      household: null,
      members: [],
      loading: false,
    })
  }, [])

  const loadMe = useCallback(async (token: string) => {
    const data = await apiFetch<{ household: Household; member: Member; members: Member[] }>(
      '/household/me',
      { token },
    )
    setState((s) => ({ ...s, household: data.household, member: data.member, members: data.members, loading: false }))
  }, [])

  const tryRefresh = useCallback(async (refreshToken: string) => {
    const data = await apiFetch<{ accessToken: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    setState((s) => ({ ...s, accessToken: data.accessToken }))
    return data.accessToken
  }, [])

  useEffect(() => {
    const access = state.accessToken
    const refresh = state.refreshToken
    if (!access) {
      setState((s) => ({ ...s, loading: false }))
      return
    }
    loadMe(access).catch(async () => {
      if (!refresh) return logout()
      try {
        const newAccess = await tryRefresh(refresh)
        await loadMe(newAccess)
      } catch {
        logout()
      }
    })
    // Only run once on mount — token refresh/logout above updates state directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const completeLogin = useCallback(
    async (accessToken: string, refreshToken: string) => {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      setState((s) => ({ ...s, accessToken, refreshToken }))
      await loadMe(accessToken)
    },
    [loadMe],
  )

  const call = useCallback(
    async <T,>(path: string, options?: { method?: string; body?: unknown }): Promise<T> => {
      try {
        return await apiFetch<T>(path, { ...options, token: state.accessToken })
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && state.refreshToken) {
          try {
            const newAccess = await tryRefresh(state.refreshToken)
            return await apiFetch<T>(path, { ...options, token: newAccess })
          } catch (refreshErr) {
            // Refresh token itself is invalid/expired — stop retrying and force a clean re-login.
            logout()
            throw refreshErr
          }
        }
        throw err
      }
    },
    [state.accessToken, state.refreshToken, tryRefresh, logout],
  )

  const refreshMe = useCallback(async () => {
    if (state.accessToken) await loadMe(state.accessToken)
  }, [state.accessToken, loadMe])

  return (
    <AuthContext.Provider value={{ ...state, completeLogin, logout, call, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
