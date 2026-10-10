import { createContext } from 'react'

export interface MarketplaceAccount {
  id: string
  name: string
  phone: string
  email: string | null
  phoneVerifiedAt: string | null
  emailVerifiedAt: string | null
  platformRole: 'user' | 'validator' | 'admin'
  helperProfile: { id: string; status: string } | null
  agencyMember: boolean
  requirementsCompleted: boolean
}

export interface MarketplaceAuthValue {
  account: MarketplaceAccount | null
  loading: boolean
  registerEmployer: (details: { name: string; phone: string; email: string }) => Promise<void>
  startEmployerPhoneVerification: (phone: string) => Promise<{ existingAccount: boolean }>
  completeEmployerRegistration: (details: { name: string; phone: string; email: string; code: string }) => Promise<void>
  startPhoneVerification: (phone: string) => Promise<void>
  verifyPhone: (phone: string, code: string) => Promise<void>
  startEmailVerification: (email: string) => Promise<void>
  verifyEmail: (code: string) => Promise<void>
  refreshAccount: () => Promise<void>
  call: <T>(path: string, options?: { method?: string; body?: unknown }) => Promise<T>
  logout: () => void
}

export const MarketplaceAuthContext = createContext<MarketplaceAuthValue | undefined>(undefined)
