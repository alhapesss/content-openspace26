'use client'

import { useRef, useState } from 'react'
import { useContentStore } from '@/lib/store'
import {
  parseMetaCsv,
  metaRowToContentItem,
  isAlreadyImported,
  guessFormat,
  parseMetaDate,
  titleFromDescription,
  type MetaRow,
} from '@/lib/meta-import'

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onToast: (msg: string) => void
}

export function ImportModal({ open, onClose, onToast }: ImportModalProps) {
  const { items, addItem } = useContentStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<MetaRow[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)

  if (!open) return null

  const handleClose = () => {
    setRows([])
    setChecked(new Set())
    setFileName('')
    onClose()
  }

  const handleFile = async (file: File) => {
    setFileName(file.name)
    const text = await file.text()
    const parsed = parseMetaCsv(text)
    setRows(parsed)
    // Default: centang semua yang belum pernah diimport sebelumnya
    const initial = new Set(
      parsed.filter((r) => !isAlreadyImported(r, items)).map((r) => r.postId)
    )
    setChecked(initial)
  }

  const toggle = (postId: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }

  const handleImport = async () => {
    const toImport = rows.filter((r) => checked.has(r.postId))
    if (toImport.length === 0) return
    setImporting(true)
    for (const row of toImport) {
      await addItem(metaRowToContentItem(row))
    }
    setImporting(false)
    onToast(`${toImport.length} konten berhasil diimport dari Meta Business`)
    handleClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="bg-[#262622] border border-[#4d4d47] rounded-md p-5 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-extrabold uppercase tracking-wide text-base mb-1">Import dari Meta Business</h3>
        <p className="text-[12px] text-[#b8b8b0] mb-4">
          Upload file CSV hasil export Insights dari Meta Business Suite. Konten otomatis masuk sebagai status
          &quot;Publish&quot; lengkap sama metrics-nya, dan langsung kebaca di Board, Calendar, Metrics &amp; Engagement.
        </p>

        {rows.length === 0 ? (
          <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-[#4d4d47] rounded-md py-10 cursor-pointer hover:border-[#f2efe9] transition-colors">
            <span className="font-mono text-xs uppercase tracking-wider text-[#b8b8b0]">
              Klik buat pilih file .csv
            </span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) handleFile(f)
              }}
            />
          </label>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="font-mono text-[11px] text-[#b8b8b0]">
                {fileName} · {rows.length} baris ketemu · {checked.size} dipilih
              </p>
              <button
                onClick={() => { setRows([]); setChecked(new Set()); setFileName('') }}
                className="font-mono text-[11px] text-[#b8b8b0] hover:text-[#f2efe9] underline"
              >
                Ganti file
              </button>
            </div>

            <div className="border border-[#4d4d47] rounded-md overflow-hidden mb-4">
              <div className="max-h-[360px] overflow-y-auto">
                <table className="w-full text-[12px]">
                  <thead className="bg-[#2e2e2a] sticky top-0">
                    <tr className="text-left font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0]">
                      <th className="px-2 py-2 w-8"></th>
                      <th className="px-2 py-2">Judul</th>
                      <th className="px-2 py-2">Format</th>
                      <th className="px-2 py-2">Tanggal</th>
                      <th className="px-2 py-2 text-right">Views</th>
                      <th className="px-2 py-2 text-right">Likes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => {
                      const dup = isAlreadyImported(r, items)
                      return (
                        <tr
                          key={r.postId}
                          className={`border-t border-[#4d4d47]/60 ${dup ? 'opacity-40' : ''}`}
                        >
                          <td className="px-2 py-1.5">
                            <input
                              type="checkbox"
                              checked={checked.has(r.postId)}
                              onChange={() => toggle(r.postId)}
                            />
                          </td>
                          <td className="px-2 py-1.5 text-[#f2efe9]">
                            {titleFromDescription(r.description)}
                            {dup && (
                              <span className="ml-1.5 font-mono text-[9px] text-[#ff00ae]">
                                sudah pernah diimport
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-[#b8b8b0]">{guessFormat(r.postType)}</td>
                          <td className="px-2 py-1.5 text-[#b8b8b0]">{parseMetaDate(r.publishTime) || '-'}</td>
                          <td className="px-2 py-1.5 text-right text-[#b8b8b0]">{r.views.toLocaleString('id-ID')}</td>
                          <td className="px-2 py-1.5 text-right text-[#b8b8b0]">{r.likes.toLocaleString('id-ID')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
          >
            Batal
          </button>
          {rows.length > 0 && (
            <button
              onClick={handleImport}
              disabled={checked.size === 0 || importing}
              className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] px-3 py-2 rounded-sm hover:brightness-105 transition-all disabled:opacity-40"
            >
              {importing ? 'Mengimport...' : `Import ${checked.size} Konten`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
