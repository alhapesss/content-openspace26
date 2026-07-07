'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

// Nunjukin nama-nama orang lain yang lagi buka modal konten yang sama, real-time.
export function usePresence(contentId: string | null, viewerName: string) {
  const [others, setOthers] = useState<string[]>([])

  useEffect(() => {
    if (!contentId) {
      setOthers([])
      return
    }

    const channel = supabase.channel(`presence-content-${contentId}`, {
      config: { presence: { key: viewerName } },
    })

    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      setOthers(Object.keys(state).filter((name) => name !== viewerName))
    })

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({ name: viewerName, at: Date.now() })
      }
    })

    return () => {
      supabase.removeChannel(channel)
      setOthers([])
    }
  }, [contentId, viewerName])

  return others
}
