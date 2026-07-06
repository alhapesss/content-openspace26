'use client'

import { useEffect } from 'react'
import { useContentStore } from '@/lib/store'

// Panggil sekali di root component (page.tsx). Hydrate data awal dari Supabase,
// lalu subscribe realtime biar semua device liat update tim lain otomatis.
export function useSupabaseSync() {
  const hydrate = useContentStore((s) => s.hydrate)
  const subscribeRealtime = useContentStore((s) => s.subscribeRealtime)
  const hydrated = useContentStore((s) => s.hydrated)

  useEffect(() => {
    hydrate()
    const unsubscribe = subscribeRealtime()
    return unsubscribe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return hydrated
}
