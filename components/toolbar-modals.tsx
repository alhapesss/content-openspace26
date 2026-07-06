'use client'

import { useState, useEffect } from 'react'
import { useContentStore } from '@/lib/store'
import { PLATFORMS, TEAM_ROLES } from '@/lib/constants'
import type { TeamMember } from '@/lib/types'
import { toExportRows } from '@/lib/content-utils'
import type { ContentItem, AccountData, AccountsMap } from '@/lib/types'
import * as XLSX from 'xlsx'

/* ─── shared helpers ─── */
const selectCls = 'w-full bg-[#232323] border border-[#3a3a36] text-[#f2efe9] px-2.5 py-2 rounded-sm text-[13px] focus:outline-none focus:border-[#9a9a94]'
const inputCls = selectCls
const textareaCls = `${inputCls} resize-vertical min-h-[60px]`

function ModalWrap({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1c1c1c] border border-[#3a3a36] rounded-md p-5 w-full max-w-[420px] max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  )
}

function ModalTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-extrabold uppercase tracking-wide text-base mb-4">{children}</h3>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#9a9a94] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

/* ─── Team Modal ─── */
const EMPTY_MEMBER: TeamMember = { name: '', role: TEAM_ROLES[0], phone: '' }

export function TeamModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { team, setTeam } = useContentStore()
  const [rows, setRows] = useState<TeamMember[]>([])

  useEffect(() => {
    if (!open) return
    // migrate legacy string[] to TeamMember[]
    if (team.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding local editable rows when modal opens
      setRows([{ ...EMPTY_MEMBER }])
    } else {
      setRows(team.map((m) =>
        typeof m === 'string'
          ? { name: m as unknown as string, role: TEAM_ROLES[0] }
          : { ...m }
      ))
    }
  }, [open, team])

  const updateRow = (idx: number, field: keyof TeamMember, value: string) => {
    setRows((prev) => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_MEMBER }])

  const removeRow = (idx: number) => {
    setRows((prev) => prev.length === 1 ? [{ ...EMPTY_MEMBER }] : prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    setTeam(rows.filter((r) => r.name.trim() !== '').map((r) => ({ name: r.name.trim(), role: r.role, phone: (r.phone || '').trim() })))
    onClose()
  }

  return (
    <ModalWrap open={open} onClose={onClose}>
      <ModalTitle>Tim / PIC Terdaftar</ModalTitle>
      <div className="mb-3 grid grid-cols-[1fr_0.8fr_1fr_32px] gap-x-2 gap-y-0 items-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94] pb-1">Nama</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94] pb-1">Role</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94] pb-1">No. WA</span>
        <span />
      </div>
      <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-0.5">
        {rows.map((row, idx) => (
          <div key={idx} className="grid grid-cols-[1fr_0.8fr_1fr_32px] gap-x-2 items-center">
            <input
              className={inputCls}
              type="text"
              placeholder="Nama"
              value={row.name}
              onChange={(e) => updateRow(idx, 'name', e.target.value)}
            />
            <select
              className={selectCls}
              value={row.role}
              onChange={(e) => updateRow(idx, 'role', e.target.value)}
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input
              className={inputCls}
              type="text"
              placeholder="08xxxx"
              value={row.phone || ''}
              onChange={(e) => updateRow(idx, 'phone', e.target.value)}
            />
            <button
              onClick={() => removeRow(idx)}
              className="w-8 h-8 flex items-center justify-center text-[#9a9a94] hover:text-[#ff00ae] transition-colors rounded-sm border border-[#3a3a36] hover:border-[#ff00ae] text-base leading-none"
              aria-label="Hapus"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addRow}
        className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[#9a9a94] border border-dashed border-[#3a3a36] w-full py-1.5 rounded-sm hover:border-[#9a9a94] hover:text-[#f2efe9] transition-colors"
      >
        + Tambah Anggota
      </button>
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm">Batal</button>
        <button onClick={handleSave} className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] px-4 py-2 rounded-sm">Simpan</button>
      </div>
    </ModalWrap>
  )
}

/* ─── Accounts Modal ─── */
export function AccountsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { accounts, setAccounts } = useContentStore()

  const todayStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  const [vals, setVals] = useState<Record<string, { followers: string; following: string }>>({})

  useEffect(() => {
    if (!open) return
    const init: typeof vals = {}
    PLATFORMS.forEach((p) => {
      init[p] = {
        followers: String(accounts[p]?.followers ?? 0),
        following: String(accounts[p]?.following ?? 0),
      }
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding local editable values when modal opens
    setVals(init)
  }, [open, accounts])

  const handleSave = () => {
    const today = todayStr()
    const updated: AccountsMap = { ...accounts }
    PLATFORMS.forEach((p) => {
      const f = Number(vals[p]?.followers) || 0
      const g = Number(vals[p]?.following) || 0
      const history = [...(updated[p]?.history || [])]
      const existing = history.find((h) => h.date === today)
      if (existing) { existing.followers = f; existing.following = g }
      else history.push({ date: today, followers: f, following: g })
      updated[p] = { followers: f, following: g, history }
    })
    setAccounts(updated)
    onClose()
  }

  return (
    <ModalWrap open={open} onClose={onClose}>
      <ModalTitle>Data Akun per Platform</ModalTitle>
      {PLATFORMS.map((p) => (
        <div key={p} className="flex gap-2">
          <Field label={`${p} - Followers`}>
            <input className={inputCls} type="number" min="0" value={vals[p]?.followers ?? ''} onChange={(e) => setVals((v) => ({ ...v, [p]: { ...v[p], followers: e.target.value } }))} />
          </Field>
          <Field label={`${p} - Following`}>
            <input className={inputCls} type="number" min="0" value={vals[p]?.following ?? ''} onChange={(e) => setVals((v) => ({ ...v, [p]: { ...v[p], following: e.target.value } }))} />
          </Field>
        </div>
      ))}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm">Batal</button>
        <button onClick={handleSave} className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] px-4 py-2 rounded-sm">Simpan</button>
      </div>
    </ModalWrap>
  )
}

/* ─── Export Modal ─── */
type ExportRange = 'all' | 'day' | 'week' | 'month' | 'year' | 'custom'

function rangeOf(preset: ExportRange, from: string, to: string): [string | null, string | null] {
  const d = new Date(); d.setHours(0, 0, 0, 0)
  const fmt = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
  if (preset === 'day') return [fmt(d), fmt(d)]
  if (preset === 'week') {
    const s = new Date(d); s.setDate(d.getDate() - d.getDay())
    const e = new Date(s); e.setDate(s.getDate() + 6)
    return [fmt(s), fmt(e)]
  }
  if (preset === 'month') {
    const s = new Date(d.getFullYear(), d.getMonth(), 1)
    const e = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return [fmt(s), fmt(e)]
  }
  if (preset === 'year') return [`${d.getFullYear()}-01-01`, `${d.getFullYear()}-12-31`]
  if (preset === 'custom') return [from, to]
  return [null, null]
}

export function ExportModal({
  open,
  format,
  onClose,
  onToast,
}: {
  open: boolean
  format: 'csv' | 'xlsx' | null
  onClose: () => void
  onToast: (msg: string) => void
}) {
  const { items } = useContentStore()
  const [range, setRange] = useState<ExportRange>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local form fields when modal opens
    if (open) { setRange('all'); setFrom(''); setTo('') }
  }, [open])

  const handleExport = () => {
    if (range === 'custom' && (!from || !to)) { onToast('Isi tanggal dari & sampai dulu.'); return }
    const [f, t] = rangeOf(range, from, to)
    const filtered = f && t ? items.filter((i) => i.date && i.date >= f && i.date <= t) : items
    if (!filtered.length) { onToast('Tidak ada data di rentang ini.'); return }
    const rows = toExportRows(filtered)
    const suffix = f && t ? `_${f}_${t}` : ''
    if (format === 'csv') {
      const headers = Object.keys(rows[0])
      const csv = [headers.join(',')]
        .concat(rows.map((r) => headers.map((h) => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`).join(',')))
        .join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `content-pipeline${suffix}.csv`; a.click()
      URL.revokeObjectURL(url)
    } else {
      const ws = XLSX.utils.json_to_sheet(rows)
      ws['!cols'] = Array(25).fill({ wch: 20 })
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Content Pipeline')
      XLSX.writeFile(wb, `content-pipeline${suffix}.xlsx`)
    }
    onClose()
  }

  return (
    <ModalWrap open={open} onClose={onClose}>
      <ModalTitle>Export Data</ModalTitle>
      <Field label="Rentang Tanggal (berdasar Tanggal Publish)">
        <select className={selectCls} value={range} onChange={(e) => setRange(e.target.value as ExportRange)}>
          <option value="all">Semua Data</option>
          <option value="day">Hari Ini</option>
          <option value="week">Minggu Ini</option>
          <option value="month">Bulan Ini</option>
          <option value="year">Tahun Ini</option>
          <option value="custom">Custom Range</option>
        </select>
      </Field>
      {range === 'custom' && (
        <div className="flex gap-2">
          <Field label="Dari">
            <input className={inputCls} type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="Sampai">
            <input className={inputCls} type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      )}
      <div className="flex justify-between mt-4 gap-2">
        <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm">Batal</button>
        <button onClick={handleExport} className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] px-4 py-2 rounded-sm">Export</button>
      </div>
    </ModalWrap>
  )
}

/* ─── Done Picker Modal ─── */
export function DonePickerModal({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (id: string) => void
}) {
  const { items } = useContentStore()
  const candidates = items.filter((i) => i.status !== 'Publish').sort((a, b) => (a.date || '').localeCompare(b.date || ''))
  const FORMAT_COLORS: Record<string, string> = {
    Carousel: '#ff00ae',
    'Single Post': '#0036ff',
    'Reels / TikTok': '#c1ff1a',
    Stories: '#ff8c1a',
  }

  return (
    <ModalWrap open={open} onClose={onClose}>
      <ModalTitle>Tandai Konten Selesai</ModalTitle>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9a94] mb-3">
        Pilih konten yang sudah jadi (belum Publish)
      </p>
      <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
        {candidates.length === 0 ? (
          <p className="text-xs text-[#9a9a94] text-center py-4">Gak ada konten Draft/Review/Terjadwal.</p>
        ) : (
          candidates.map((item) => (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); onClose() }}
              className="text-left rounded-sm border border-[#3a3a36] bg-[#232323] p-2.5 hover:border-[#9a9a94] transition-colors"
              style={{ borderLeft: `4px solid ${FORMAT_COLORS[item.format] || '#f2efe9'}` }}
            >
              <div className="font-bold text-[13px] text-[#f2efe9]">{item.title || '(tanpa judul)'}</div>
              <div className="font-mono text-[10px] text-[#9a9a94] uppercase mt-0.5">
                {item.status} · {item.date || '-'} · {item.platform}
              </div>
            </button>
          ))
        )}
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm">Batal</button>
      </div>
    </ModalWrap>
  )
}

/* ─── Reset Confirm Modal ─── */
export function ResetConfirmModal({
  open,
  onClose,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <ModalWrap open={open} onClose={onClose}>
      <div className="text-center">
        <p className="text-[13px] mb-5">Yakin hapus SEMUA data board? Ini tidak bisa dibatalkan.</p>
        <div className="flex gap-2 justify-center">
          <button onClick={onClose} className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm">Batal</button>
          <button onClick={onConfirm} className="font-mono text-xs uppercase tracking-wider border border-[#ff00ae] text-[#ff00ae] px-3 py-2 rounded-sm hover:bg-[#ff00ae]/10 transition-colors">Ya, lanjut</button>
        </div>
      </div>
    </ModalWrap>
  )
}

