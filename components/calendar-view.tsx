'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import { FORMAT_COLORS } from '@/lib/constants'
import { matchesSearch, todayStr } from '@/lib/content-utils'
import type { ContentItem } from '@/lib/types'

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DOWS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface CalendarViewProps {
  items: ContentItem[]
  onOpenItem: (id: string) => void
}

export function CalendarView({ items, onOpenItem }: CalendarViewProps) {
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  const first = new Date(calYear, calMonth, 1)
  const startDow = first.getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const today = todayStr()

  const cells: Array<{ day: number | null; dateStr: string }> = []
  for (let i = 0; i < startDow; i++) cells.push({ day: null, dateStr: '' })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ day: d, dateStr })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold uppercase tracking-tight">
          {MONTH_NAMES[calMonth]} {calYear}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
          >
            &larr; Sebelumnya
          </button>
          <button
            onClick={nextMonth}
            className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
          >
            Berikutnya &rarr;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {DOWS.map((d) => (
          <div key={d} className="font-mono text-[10px] uppercase text-[#b8b8b0] text-center pb-1">
            {d}
          </div>
        ))}
        {cells.map((cell, idx) => {
          if (!cell.day) {
            return <div key={`empty-${idx}`} className="min-h-[88px]" />
          }
          const dayItems = items.filter(
            (i) => i.date === cell.dateStr
          )
          const isToday = cell.dateStr === today
          return (
            <div
              key={cell.dateStr}
              className={`min-h-[88px] rounded-sm border p-1.5 text-[11px] transition-colors ${
                isToday
                  ? 'border-[#c1ff1a] border-2 bg-[#262622]'
                  : 'border-[#4d4d47] bg-[#262622]'
              }`}
            >
              <div
                className={`font-mono mb-1 ${
                  isToday ? 'text-[#c1ff1a] font-extrabold' : 'text-[#b8b8b0]'
                }`}
              >
                {cell.day}
              </div>
              {dayItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onOpenItem(item.id)}
                  className="block w-full text-left rounded-sm px-1 py-0.5 mb-0.5 text-[10px] truncate text-[#f2efe9] hover:brightness-110 transition-all"
                  style={{ borderLeft: `3px solid ${FORMAT_COLORS[item.format] || '#f2efe9'}`, background: '#2a2a2a' }}
                >
                  {item.title || '(tanpa judul)'}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
