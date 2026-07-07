'use client'

import { useMemo, useState } from 'react'
import { useContentStore } from '@/lib/store'
import { OBJECTIVE_METRICS, OBJECTIVE_METRIC_LABELS } from '@/lib/constants'
import type { ContentItem } from '@/lib/types'

// Cell angka yang bisa di-klik langsung buat edit, auto-save ke store (debounced blur/enter).
function EditableCell({
  value,
  onChange,
}: {
  value: number
  onChange: (val: number) => void
}) {
  const [local, setLocal] = useState(String(value ?? 0))

  const commit = () => {
    const num = Number(local)
    if (!Number.isNaN(num) && num !== value) onChange(num)
  }

  return (
    <input
      type="number"
      min="0"
      className="w-24 bg-transparent border border-transparent hover:border-[#4d4d47] focus:border-[#0036ff] rounded-sm px-2 py-1 text-sm text-right font-mono focus:outline-none"
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
      }}
    />
  )
}

function formatUpdatedAt(ts?: number): string {
  if (!ts) return '—'
  const diffMs = Date.now() - ts
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Hari ini'
  if (days === 1) return 'Kemarin'
  if (days < 7) return `${days} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

export function MetricsTable({ onOpenItem }: { onOpenItem: (id: string) => void }) {
  const { items, updateItem } = useContentStore()

  const publishedItems = useMemo(
    () => items.filter((i) => i.status === 'Publish').sort((a, b) => b.createdAt - a.createdAt),
    [items]
  )

  const handleUpdate = (id: string, field: keyof ContentItem, value: number) => {
    updateItem(id, { [field]: value, metricsUpdatedAt: Date.now() } as Partial<ContentItem>)
  }

  if (publishedItems.length === 0) {
    return (
      <div className="text-center text-sm text-[#b8b8b0] py-16">
        Belum ada konten dengan status <span className="text-[#c1ff1a] font-semibold">Publish</span>.
        <br />
        Metrics baru bisa diisi setelah konten dipublish.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-[#4d4d47] text-left text-[10px] font-mono uppercase tracking-wider text-[#b8b8b0]">
            <th className="py-2 pr-4">Konten</th>
            <th className="py-2 pr-4">Objective</th>
            <th className="py-2 pr-4 text-right">Views</th>
            <th className="py-2 pr-4 text-right">Likes</th>
            <th className="py-2 pr-4 text-right">Comments</th>
            <th className="py-2 pr-4 text-right">Shares</th>
            <th className="py-2 pr-4 text-right">Saves</th>
            <th className="py-2 pr-4 text-right">Metrics Objective</th>
            <th className="py-2 pr-4">Terakhir Update</th>
          </tr>
        </thead>
        <tbody>
          {publishedItems.map((item) => {
            const objective = item.objective || 'Engagement'
            const extraKeys = OBJECTIVE_METRICS[objective] || []
            return (
              <tr key={item.id} className="border-b border-[#2e2e2a] hover:bg-[#2e2e2a]/50">
                <td className="py-2 pr-4 max-w-[220px]">
                  <button
                    onClick={() => onOpenItem(item.id)}
                    className="text-left font-semibold hover:text-[#0036ff] transition-colors truncate block w-full"
                    title={item.title}
                  >
                    {item.title || '(Tanpa judul)'}
                  </button>
                  <span className="text-[10px] text-[#b8b8b0]">{item.platform}</span>
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-sm border ${
                      objective === 'Awareness'
                        ? 'border-[#0036ff] text-[#0036ff]'
                        : objective === 'Conversion'
                          ? 'border-[#ff00ae] text-[#ff00ae]'
                          : 'border-[#c1ff1a] text-[#c1ff1a]'
                    }`}
                  >
                    {objective}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right">
                  <EditableCell value={item.views} onChange={(v) => handleUpdate(item.id, 'views', v)} />
                </td>
                <td className="py-2 pr-4 text-right">
                  <EditableCell value={item.likes} onChange={(v) => handleUpdate(item.id, 'likes', v)} />
                </td>
                <td className="py-2 pr-4 text-right">
                  <EditableCell value={item.comments} onChange={(v) => handleUpdate(item.id, 'comments', v)} />
                </td>
                <td className="py-2 pr-4 text-right">
                  <EditableCell value={item.shares} onChange={(v) => handleUpdate(item.id, 'shares', v)} />
                </td>
                <td className="py-2 pr-4 text-right">
                  <EditableCell value={item.saves} onChange={(v) => handleUpdate(item.id, 'saves', v)} />
                </td>
                <td className="py-2 pr-4">
                  {extraKeys.length === 0 ? (
                    <span className="text-[#b8b8b0] text-xs">—</span>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {extraKeys.map((key) => (
                        <div key={key} className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#b8b8b0]">{OBJECTIVE_METRIC_LABELS[key] || key}</span>
                          <EditableCell
                            value={(item as unknown as Record<string, number>)[key] ?? 0}
                            onChange={(v) => handleUpdate(item.id, key as keyof ContentItem, v)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-2 pr-4 text-xs text-[#b8b8b0]">{formatUpdatedAt(item.metricsUpdatedAt)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
