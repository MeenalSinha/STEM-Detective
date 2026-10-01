'use client'
/**
 * Game-wide context: entitlement state (server-verified) + RevenueCat status + paywall control.
 *
 * Source of truth for gating is the BACKEND (`GET /billing/entitlement`, which asks RevenueCat's
 * REST API with a secret key). The SDK is used for purchase UI and to sync immediately after a
 * purchase. This keeps a tampered client from unlocking Pro and lets web + mobile agree.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { billingApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { initPurchases, type BillingStatus } from '@/lib/purchases'
import Paywall from '@/components/game/Paywall'

export interface Entitlement {
  is_pro: boolean; product_id: string | null; expires_at: string | null; stale: boolean; billing_configured: boolean
}
interface GameCtx {
  isPro: boolean
  entitlement: Entitlement | null
  billing: BillingStatus | 'loading'
  openPaywall: (feature?: string) => void
  /** Re-check with the server; polls briefly after a purchase while RevenueCat propagates. */
  syncEntitlement: (opts?: { poll?: boolean }) => Promise<boolean>
}
const Ctx = createContext<GameCtx>({
  isPro: false, entitlement: null, billing: 'loading', openPaywall: () => {}, syncEntitlement: async () => false,
})
export const useGame = () => useContext(Ctx)

export function GameProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const qc = useQueryClient()
  const [billing, setBilling] = useState<BillingStatus | 'loading'>('loading')
  const [paywall, setPaywall] = useState<{ open: boolean; feature?: string }>({ open: false })

  useEffect(() => {
    let alive = true
    if (!user?.id) return
    initPurchases(user.id).then((s) => alive && setBilling(s))
    return () => { alive = false }
  }, [user?.id])

  const { data: entitlement } = useQuery<Entitlement>({
    queryKey: ['entitlement', user?.id],
    queryFn: async () => (await billingApi.entitlement()).data,
    enabled: !!user?.id,
    staleTime: 60_000,
    retry: 1,
  })

  const syncEntitlement = useCallback(async (opts?: { poll?: boolean }) => {
    const attempts = opts?.poll ? 5 : 1
    for (let i = 0; i < attempts; i++) {
      try {
        const res = (await billingApi.entitlement(true)).data as Entitlement
        qc.setQueryData(['entitlement', user?.id], res)
        if (res.is_pro) { qc.invalidateQueries({ queryKey: ['case'] }); qc.invalidateQueries({ queryKey: ['catalog'] }); return true }
      } catch { /* keep trying */ }
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1500))
    }
    return false
  }, [qc, user?.id])

  const value = useMemo<GameCtx>(() => ({
    isPro: Boolean(entitlement?.is_pro), entitlement: entitlement ?? null, billing, syncEntitlement,
    openPaywall: (feature) => setPaywall({ open: true, feature }),
  }), [entitlement, billing, syncEntitlement])

  return (
    <Ctx.Provider value={value}>
      {children}
      <Paywall open={paywall.open} feature={paywall.feature} onClose={() => setPaywall({ open: false })} />
    </Ctx.Provider>
  )
}
