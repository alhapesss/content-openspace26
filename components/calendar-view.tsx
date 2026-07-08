'use client'

import { useEffect, useState } from 'react'
import { useContentStore } from '@/lib/store'
import { FORMAT_COLORS } from '@/lib/constants'
import { matchesSearch, todayStr } from '@/lib/content-utils'
import { downloadICS } from '@/lib/ics-utils'
import {
  isGoogleCalendarConnected,
  requestGoogleAccessToken,
  disconnectGoogleCalendar,
  syncItemsToGoogleCalendar,
} from '@/lib/google-calendar'
import type { ContentItem } from '@/lib/types'

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const DOWS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

interface CalendarViewProps {
  items: ContentItem[]
  onOpenItem: (id: string) => void
}

export function CalendarView({ items, onOpenItem }: CalendarViewProps) {
  const { updateItem } = useContentStore()
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [gcalConnected, setGcalConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    setGcalConnected(isGoogleCalendarConnected())
  }, [])

  const handleConnectGoogle = async () => {
    try {
      await requestGoogleAccessToken()
      setGcalConnected(true)
      setSyncMsg('Terhubung ke Google Calendar.')
    } catch (err) {
      setSyncMsg(`Gagal connect: ${(err as Error).message}`)
    }
  }

  const handleDisconnectGoogle = () => {
    disconnectGoogleCalendar()
    setGcalConnected(false)
    setSyncMsg('')
  }

  const handleSyncGoogle = async () => {
    setSyncing(true)
    setSyncMsg('')
    try {
      const result = await syncItemsToGoogleCalendar(items, (itemId, googleEventId) => {
        updateItem(itemId, { googleEventId })
      })
      setSyncMsg(
        `Sync selesai: ${result.synced} berhasil${result.failed ? `, ${result.failed} gagal` : ''}.`
      )
      setGcalConnected(true)
    } catch (err) {
      setSyncMsg(`Gagal sync: ${(err as Error).message}`)
    } finally {
      setSyncing(false)
    }
  }

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
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h2 className="text-lg font-extrabold uppercase tracking-tight">
          {MONTH_NAMES[calMonth]} {calYear}
        </h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => downloadICS(items, `content-calendar-${MONTH_NAMES[calMonth].toLowerCase()}-${calYear}.ics`)}
            title="Export jadwal ke Google/Apple/Outlook Calendar"
            className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#c1ff1a] hover:text-[#c1ff1a] transition-colors"
          >
            Export .ics
          </button>
          {!gcalConnected ? (
            <button
              onClick={handleConnectGoogle}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#0036ff] hover:text-[#0036ff] transition-colors"
            >
              Connect Google Calendar
            </button>
          ) : (
            <>
              <button
                onClick={handleSyncGoogle}
                disabled={syncing}
                className="font-mono text-xs uppercase tracking-wider border border-[#0036ff] text-[#0036ff] px-3 py-2 rounded-sm hover:bg-[#0036ff] hover:text-[#f2efe9] transition-colors disabled:opacity-40"
              >
                {syncing ? 'Nyinkron...' : 'Sync ke Google Calendar'}
              </button>
              <button
                onClick={handleDisconnectGoogle}
                title="Putuskan koneksi Google Calendar"
                className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#ff00ae] hover:text-[#ff00ae] transition-colors"
              >
                Disconnect
              </button>
            </>
          )}
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

      {syncMsg && (
        <p className="text-xs font-mono text-[#b8b8b0] mb-3">{syncMsg}</p>
      )}

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
