'use client'

import { useContentStore } from '@/lib/store'
import { todayStr, tomorrowStr } from '@/lib/content-utils'

interface RemindersProps {
  onOpenItem: (id: string) => void
}

export function Reminders({ onOpenItem }: RemindersProps) {
  const { items } = useContentStore()
  const today = todayStr()
  const tomorrow = tomorrowStr()

  const pending = (i: (typeof items)[0]) => i.status !== 'Publish'
  const overdue = items.filter((i) => pending(i) && i.date && i.date < today)
  const dueTomorrow = items.filter((i) => pending(i) && i.date === tomorrow)

  if (!overdue.length && !dueTomorrow.length) return null

  return (
    <div className="mt-4 flex flex-col gap-2">
      {overdue.length > 0 && (
        <div className="border border-[#ff00ae] bg-[#ff00ae]/[0.08] rounded-sm px-3.5 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0] mb-1.5">
            Lewat Tanggal Publish ({overdue.length})
          </div>
          {overdue.map((i) => (
            <button
              key={i.id}
              onClick={() => onOpenItem(i.id)}
              className="block w-full text-left text-[12px] py-0.5 hover:underline text-[#f2efe9]"
            >
              {i.title || '(tanpa judul)'} — {i.date} · {i.status}
            </button>
          ))}
        </div>
      )}
      {dueTomorrow.length > 0 && (
        <div className="border border-[#c1ff1a] bg-[#c1ff1a]/[0.06] rounded-sm px-3.5 py-2.5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0] mb-1.5">
            Jatuh Tempo Besok ({dueTomorrow.length})
          </div>
          {dueTomorrow.map((i) => (
            <button
              key={i.id}
              onClick={() => onOpenItem(i.id)}
              className="block w-full text-left text-[12px] py-0.5 hover:underline text-[#f2efe9]"
            >
              {i.title || '(tanpa judul)'} — {i.status}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
