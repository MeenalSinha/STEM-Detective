'use client'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { flagshipApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth'
import { toGameError } from './errors'
import type { CaseView, Catalog } from './types'

/** True once persisted auth has been read from storage (avoids redirect flicker). */
export function useAuthReady() {
  // `persist` is undefined while prerendering on the server (no storage), so guard every access.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const persist = useAuthStore.persist
    if (!persist || persist.hasHydrated()) { setReady(true); return }
    return persist.onFinishHydration(() => setReady(true))
  }, [])
  return ready
}

export function useCatalog() {
  const token = useAuthStore((s) => s.token)
  const q = useQuery<Catalog>({
    queryKey: ['catalog'],
    queryFn: async () => (await flagshipApi.catalog()).data,
    enabled: !!token,
  })
  return { ...q, error: q.error ? toGameError(q.error) : null }
}

export function useCase(id: string | null) {
  const q = useQuery<CaseView>({
    queryKey: ['case', id],
    queryFn: async () => (await flagshipApi.state(id as string)).data,
    enabled: !!id,
    staleTime: 15_000,
  })
  return { ...q, error: q.error ? toGameError(q.error) : null }
}
