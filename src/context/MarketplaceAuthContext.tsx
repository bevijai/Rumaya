import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { apiFetch, ApiError } from '@/lib/api'
import { MarketplaceAuthContext, type MarketplaceAccount } from './MarketplaceAuthState'

const ACCESS_TOKEN_KEY = 'rumaya_marketplace_access_token'
const REFRESH_TOKEN_KEY = 'rumaya_marketplace_refresh_token'

export function MarketplaceAuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<MarketplaceAccount | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    setAccessToken(null)
    setRefreshToken(null)
    setAccount(null)
    setLoading(false)
  }, [])

  const refreshAccessToken = useCallback(async () => {
    if (!refreshToken) throw new Error('No marketplace refresh token')
    const data = await apiFetch<{ accessToken: string }>('/marketplace/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    })
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    setAccessToken(data.accessToken)
    return data.accessToken
  }, [refreshToken])

  const call = useCallback(
    async <T,>(path: string, options?: { method?: string; body?: unknown }): Promise<T> => {
      try {
        return await apiFetch<T>(path, { ...options, token: accessToken })
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && refreshToken) {
          const refreshed = await refreshAccessToken()
          return apiFetch<T>(path, { ...options, token: refreshed })
        }
        throw error
      }
    },
    [accessToken, refreshToken, refreshAccessToken],
  )

  const refreshAccount = useCallback(async () => {
    const data = await call<{ account: MarketplaceAccount }>('/marketplace/auth/me')
    setAccount(data.account)
  }, [call])

  useEffect(() => {
    if (!accessToken && !refreshToken) {
      setLoading(false)
      return
    }
    refreshAccount()
      .catch(() => logout())
      .finally(() => setLoading(false))
    // Session bootstrap runs once; refreshAccount handles token rotation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const registerEmployer = useCallback(async (details: { name: string; phone: string; email: string }) => {
    await apiFetch('/marketplace/auth/register-employer', {
      method: 'POST',
      body: {
        ...details,
        preferredLanguage: 'en',
        consentVersion: '2026-10-02',
        acceptDataProcessing: true,
      },
    })
  }, [])

  const startEmployerPhoneVerification = useCallback(async (phone: string) => {
    return apiFetch<{ existingAccount: boolean }>('/marketplace/auth/register-employer/otp/start', {
      method: 'POST',
      body: { phone },
    })
  }, [])

  const completeEmployerRegistration = useCallback(
    async (details: { name: string; phone: string; email: string; code: string }) => {
      const data = await apiFetch<{
        accessToken: string
        refreshToken: string
        account: MarketplaceAccount
      }>('/marketplace/auth/register-employer/otp/verify', {
        method: 'POST',
        body: {
          ...details,
          preferredLanguage: 'en',
          consentVersion: '2026-10-02',
          acceptDataProcessing: true,
        },
      })
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
      setAccessToken(data.accessToken)
      setRefreshToken(data.refreshToken)
      setAccount({ ...data.account, requirementsCompleted: false })
    },
    [],
  )

  const startPhoneVerification = useCallback(async (phone: string) => {
    await apiFetch('/marketplace/auth/otp/start', { method: 'POST', body: { phone } })
  }, [])

  const verifyPhone = useCallback(async (phone: string, code: string) => {
    const data = await apiFetch<{
      accessToken: string
      refreshToken: string
      account: MarketplaceAccount
    }>('/marketplace/auth/otp/verify', { method: 'POST', body: { phone, code } })
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken)
    setAccessToken(data.accessToken)
    setRefreshToken(data.refreshToken)
    setAccount({ ...data.account, requirementsCompleted: false })
  }, [])

  const startEmailVerification = useCallback(
    async (email: string) => {
      await call('/marketplace/auth/email/start', { method: 'POST', body: { email } })
    },
    [call],
  )

  const verifyEmail = useCallback(
    async (code: string) => {
      await call('/marketplace/auth/email/verify', { method: 'POST', body: { code } })
      await refreshAccount()
    },
    [call, refreshAccount],
  )

  return (
    <MarketplaceAuthContext.Provider
      value={{
        account,
        loading,
        registerEmployer,
        startEmployerPhoneVerification,
        completeEmployerRegistration,
        startPhoneVerification,
        verifyPhone,
        startEmailVerification,
        verifyEmail,
        refreshAccount,
        call,
        logout,
      }}
    >
      {children}
    </MarketplaceAuthContext.Provider>
  )
}
