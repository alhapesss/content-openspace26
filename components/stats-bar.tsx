'use client'

import { STATUSES } from '@/lib/constants'
import type { ContentItem } from '@/lib/types'

interface StatsBarProps {
  items: ContentItem[]
  totalItems: ContentItem[]
}

export function StatsBar({ items, totalItems }: StatsBarProps) {
  const total = items.length
  const published = items.filter((i) => i.status === 'Publish').length
  const pct = total ? Math.round((published / total) * 100) : 0

  return (
    <div className="flex flex-wrap gap-2.5 my-4">
      {STATUSES.map((s) => {
        const n = items.filter((i) => i.status === s).length
        return (
          <div key={s} className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 min-w-[90px]">
            <div className="text-[22px] font-extrabold">{n}</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">{s}</div>
          </div>
        )
      })}
      <div className="bg-[#1c1c1c] border border-[#3a3a36] rounded-sm px-4 py-2.5 flex-1 min-w-[180px]">
        <div className="text-[22px] font-extrabold">{pct}%</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94]">
          Progress Publish ({published}/{total})
        </div>
        <div className="h-1.5 bg-[#232323] rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-[#c1ff1a] rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
