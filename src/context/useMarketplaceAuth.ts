import { useContext } from 'react'
import { MarketplaceAuthContext } from './MarketplaceAuthState'

export function useMarketplaceAuth() {
  const context = useContext(MarketplaceAuthContext)
  if (!context) throw new Error('useMarketplaceAuth must be used within MarketplaceAuthProvider')
  return context
}
