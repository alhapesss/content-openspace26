'use client'

import { useEffect, useRef, useState } from 'react'
import { useContentStore } from '@/lib/store'
import { CommentsPanel } from './comments-panel'
import { ActivityFeed } from './activity-feed'
import { DriveLinkModal } from './drive-link-modal'
import { usePresence } from '@/hooks/use-presence'
import { getViewerName } from '@/lib/viewer'
import { createApprovalResultNotification } from '@/lib/notifications-utils'
import {
  STATUSES,
  FORMATS,
  SUBFORMATS,
  PILLARS,
  PLATFORM_FORMATS,
  ALL_PLATFORMS,
  OBJECTIVES,
} from '@/lib/constants'
import { uid, todayStr, blankItem } from '@/lib/content-utils'
import type { ContentItem } from '@/lib/types'

interface ContentModalProps {
  item: ContentItem | null
  onClose: () => void
}

function Field({ label, children, extra }: { label: React.ReactNode; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0] mb-1.5">{label}</label>
      {children}
      {extra}
    </div>
  )
}

const inputCls = 'w-full bg-[#2e2e2a] border border-[#4d4d47] text-[#f2efe9] px-2.5 py-2 rounded-sm text-[13px] focus:outline-none focus:border-[#b8b8b0] transition-colors'
const textareaCls = `${inputCls} resize-vertical min-h-[60px]`
const selectCls = `${inputCls} cursor-pointer`

export function ContentModal({ item, onClose }: ContentModalProps) {
  const { addItem, updateItem, deleteItem, team, items, addActivity, addNotification } = useContentStore()

  const [form, setForm] = useState<Omit<ContentItem, 'id' | 'createdAt'>>(blankItem())
  const [toast, setToast] = useState<string | null>(null)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [scriptCopied, setScriptCopied] = useState<number | boolean>(false)
  const [captionCopied, setCaptionCopied] = useState(false)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [showActivity, setShowActivity] = useState(false)
  const [carouselSlideCount, setCarouselSlideCount] = useState(3)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const viewerName = getViewerName()
  const otherViewers = usePresence(item?.id ?? null, viewerName)

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => {
    if (item === undefined) return
    if (item === null) {
      // New content
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting local form state when the `item` prop identity changes (modal open/target switch)
      setForm(blankItem())
      setCarouselSlideCount(3)
    } else {
      // Editing existing
      const { id, createdAt, ...rest } = item
      setForm({ ...rest })
      // Sinkron jumlah slide dgn data asli (min 3), biar slide yg udah ada gak "ketutup"/ke-truncate
      setCarouselSlideCount(Math.max(3, item.scripts?.length || 0))
    }
    setShowConfirmDelete(false)
    setScriptCopied(false)
    setCaptionCopied(false)
    setShowRejectBox(false)
    setRejectReason('')
  }, [item])

  const set = (key: keyof typeof form, val: string | number | string[]) =>
    setForm((prev) => ({ ...prev, [key]: val }))

  const handlePlatformChange = (platform: string) => {
    const allowedFormats = PLATFORM_FORMATS[platform] || FORMATS
    const newFormat = allowedFormats.includes(form.format) ? form.format : allowedFormats[0]
    setForm((prev) => ({ ...prev, platform, format: newFormat, subformat: '' }))
  }

  const handleFormatChange = (format: string) => {
    setForm((prev) => ({ ...prev, format, subformat: '' }))
  }

  const handleSave = () => {
    if (!form.title.trim()) { showToast('Judul wajib diisi.'); return }
    if (!form.date) { showToast('Tanggal publish wajib diisi.'); return }
    // Pangkas/rapikan scripts sesuai jumlah slide yg terakhir di-set user, baru di sini
    // (bukan realtime saat ngetik angka) biar gak ada data ke-hapus gak sengaja.
    const finalForm =
      form.format === 'Carousel'
        ? { ...form, scripts: Array.from({ length: carouselSlideCount }, (_, i) => form.scripts?.[i] || '') }
        : form
    if (item) {
      updateItem(item.id, finalForm)
    } else {
      addItem({ id: uid(), createdAt: Date.now(), ...finalForm })
    }
    onClose()
  }

  const handleDelete = () => {
    if (!item) return
    if (!showConfirmDelete) { setShowConfirmDelete(true); return }
    deleteItem(item.id)
    onClose()
  }

  const [showApproveDriveModal, setShowApproveDriveModal] = useState(false)

  const finalizeApprove = (driveLink: string) => {
    if (!item) return
    const now = Date.now()
    updateItem(item.id, {
      status: 'Terjadwal',
      driveLink,
      approvalStatus: 'approved',
      approvedBy: viewerName,
      approvedAt: now,
      rejectionReason: '',
    })
    addActivity({
      id: uid(),
      type: 'approved',
      contentId: item.id,
      actorId: viewerName,
      createdAt: now,
    })
    addNotification(createApprovalResultNotification({ ...item, title: item.title }, true, viewerName))
    showToast('Disetujui, lanjut ke Terjadwal.')
    onClose()
  }

  const handleApprove = () => {
    if (!item) return
    // Konsisten sama drag-kanban ke "Terjadwal": link Google Drive wajib diisi dulu,
    // gak boleh ke-bypass lewat tombol approve.
    if (!item.driveLink) {
      setShowApproveDriveModal(true)
      return
    }
    finalizeApprove(item.driveLink)
  }

  const handleReject = () => {
    if (!item) return
    if (!showRejectBox) { setShowRejectBox(true); return }
    if (!rejectReason.trim()) { showToast('Isi alasan penolakan dulu.'); return }
    const now = Date.now()
    updateItem(item.id, {
      status: 'Draft',
      approvalStatus: 'rejected',
      rejectionReason: rejectReason.trim(),
    })
    addActivity({
      id: uid(),
      type: 'rejected',
      contentId: item.id,
      actorId: viewerName,
      newValue: rejectReason.trim(),
      createdAt: now,
    })
    addNotification(createApprovalResultNotification(item, false, viewerName, rejectReason.trim()))
    showToast('Ditolak, balik ke Draft.')
    onClose()
  }

  const copyText = async (text: string, onOk: () => void) => {
    if (!text.trim()) { showToast('Teks kosong.'); return }
    try {
      await navigator.clipboard.writeText(text)
      onOk()
      setTimeout(onOk, 1600) // reset
    } catch {
      showToast('Clipboard tidak tersedia di browser ini.')
    }
  }

  const openAllAssets = () => {
    const links = form.assets.split('\n').map((s) => s.trim()).filter(Boolean)
    if (!links.length) { showToast('Belum ada link aset.'); return }
    links.forEach((l) => window.open(l, '_blank'))
  }

  // Build filtered PIC options by role(s)
  const byRole = (...roles: string[]) => {
    const fromTeam = team
      .filter((m) => roles.some((r) => m.role === r))
      .map((m) => m.name)
    return ['', ...fromTeam]
  }

  // Fallback: all team names (for PIC Umum — covers any role)
  const allNames = ['', ...team.map((m) => (typeof m === 'string' ? m : m.name))]

  const pillarOptions = [
    ...new Set([...PILLARS, ...items.map((i) => i.pillar).filter(Boolean)]),
  ]

  const subformatOptions = [
    ...new Set([
      ...(SUBFORMATS[form.format] || []),
      ...items.filter((i) => i.format === form.format).map((i) => i.subformat).filter(Boolean),
    ]),
  ]

  const allowedFormats = PLATFORM_FORMATS[form.platform] || [...FORMATS]
  const showShootDate = form.format === 'Reels / TikTok'

  if (!open) return null

  if (item === undefined) return null

  return (
    <>
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#262622] border border-[#4d4d47] rounded-md p-6 w-full max-w-[640px] max-h-[92vh] overflow-y-auto relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold uppercase tracking-wide">
            {item && item.id ? 'Edit Konten' : 'Konten Baru'}
          </h3>
          {item && item.id && (
            <div className="flex gap-2">
              <button
                onClick={() => setCommentsOpen(true)}
                className="text-xs px-2 py-1 rounded border border-[#4d4d47] hover:border-[#b8b8b0] transition-colors"
                title="Comments"
              >
                💬
              </button>
              <button
                onClick={() => setShowActivity(!showActivity)}
                className="text-xs px-2 py-1 rounded border border-[#4d4d47] hover:border-[#b8b8b0] transition-colors"
                title="Activity"
              >
                📊
              </button>
            </div>
          )}
        </div>

        {item && item.id && otherViewers.length > 0 && (
          <div className="mb-3 px-3 py-1.5 bg-[#0036ff]/10 border border-[#0036ff]/40 rounded text-[11px] text-[#0036ff]">
            👀 Sedang dilihat juga oleh: {otherViewers.join(', ')}
          </div>
        )}

        {item && item.id && form.status === 'Review' && (
          <div className="mb-4 p-3 bg-[#2e2e2a] rounded border border-[#4d4d47]">
            <p className="text-xs font-mono text-[#b8b8b0] mb-2">PERSETUJUAN — konten ini nunggu di-approve</p>
            {item.approvalStatus === 'rejected' && item.rejectionReason && (
              <p className="text-xs text-[#ff00ae] mb-2">Alasan penolakan sebelumnya: {item.rejectionReason}</p>
            )}
            {!showRejectBox ? (
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  className="flex-1 font-mono text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-sm bg-[#c1ff1a] text-[#0a0a0a] hover:brightness-105 transition-all"
                >
                  ✅ Setujui
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 font-mono text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-sm bg-[#ff00ae] text-white hover:brightness-110 transition-all"
                >
                  ⛔ Tolak
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  className={textareaCls}
                  placeholder="Alasan penolakan (wajib diisi)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleReject}
                    className="flex-1 font-mono text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-sm bg-[#ff00ae] text-white hover:brightness-110 transition-all"
                  >
                    Kirim Penolakan
                  </button>
                  <button
                    onClick={() => { setShowRejectBox(false); setRejectReason('') }}
                    className="text-xs px-3 py-1.5 rounded border border-[#4d4d47] hover:border-[#b8b8b0] transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showActivity && item && item.id && (
          <div className="mb-4 p-3 bg-[#2e2e2a] rounded border border-[#4d4d47]">
            <p className="text-xs font-mono text-[#b8b8b0] mb-2">ACTIVITY</p>
            <ActivityFeed contentId={item.id} />
          </div>
        )}

        <Field label="Judul">
          <input
            className={inputCls}
            type="text"
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="cth. GME - Salah - Breakdown Rilisan"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Platform">
            <select className={selectCls} value={form.platform} onChange={(e) => handlePlatformChange(e.target.value)}>
              {ALL_PLATFORMS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Format">
            <select className={selectCls} value={form.format} onChange={(e) => handleFormatChange(e.target.value)}>
              {allowedFormats.map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Objective Konten">
            <select
              className={selectCls}
              value={form.objective || 'Engagement'}
              onChange={(e) => set('objective', e.target.value as 'Awareness' | 'Engagement' | 'Conversion')}
            >
              {OBJECTIVES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Pilar Konten">
            <input
              className={inputCls}
              list="pillarList"
              value={form.pillar}
              onChange={(e) => set('pillar', e.target.value)}
              placeholder="pilih atau ketik baru..."
            />
            <datalist id="pillarList">
              {pillarOptions.map((p) => <option key={p} value={p} />)}
            </datalist>
          </Field>

          <Field label="Sub-Format">
            <input
              className={inputCls}
              list="subList"
              value={form.subformat}
              onChange={(e) => set('subformat', e.target.value)}
              placeholder="pilih atau ketik baru..."
            />
            <datalist id="subList">
              {subformatOptions.map((s) => <option key={s} value={s} />)}
            </datalist>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Field label="Tanggal Deadline">
            <input className={inputCls} type="date" value={form.deadline || ''} onChange={(e) => set('deadline', e.target.value)} />
          </Field>
          <Field label="Tanggal Publish *">
            <input className={inputCls} type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </Field>
          <Field label="PIC (Umum)">
            <select className={selectCls} value={form.pic} onChange={(e) => set('pic', e.target.value)}>
              {allNames.map((n) => <option key={n} value={n}>{n || '— pilih —'}</option>)}
            </select>
          </Field>
        </div>

        {showShootDate && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Field label="Jadwal Take Content (video)">
              <input className={inputCls} type="datetime-local" value={form.shootDate} onChange={(e) => set('shootDate', e.target.value)} />
            </Field>
            <Field label="Lokasi">
              <input className={inputCls} type="text" value={form.shootLocation} onChange={(e) => set('shootLocation', e.target.value)} placeholder="cth. Studio A, Outdoor Rooftop" />
            </Field>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="PIC Graphic Design">
            <select className={selectCls} value={form.picGraphic} onChange={(e) => set('picGraphic', e.target.value)}>
              {byRole('Graphic Designer').map((n) => <option key={n} value={n}>{n || '— pilih —'}</option>)}
            </select>
          </Field>
          <Field label="PIC Video Editor">
            <select className={selectCls} value={form.picVideoEditor} onChange={(e) => set('picVideoEditor', e.target.value)}>
              {byRole('Video Editor').map((n) => <option key={n} value={n}>{n || '— pilih —'}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Talent">
            <select className={selectCls} value={form.picTalent} onChange={(e) => set('picTalent', e.target.value)}>
              {byRole('Talent / Presenter').map((n) => <option key={n} value={n}>{n || '— pilih —'}</option>)}
            </select>
          </Field>
          <Field label="Videographer">
            <select className={selectCls} value={form.picVideographer} onChange={(e) => set('picVideographer', e.target.value)}>
              {byRole('Videografer', 'Fotografer').map((n) => <option key={n} value={n}>{n || '— pilih —'}</option>)}
            </select>
          </Field>
        </div>

        {/* Script for non-carousel or single script */}
        {form.format !== 'Carousel' && (
          <Field
            label={
              <span className="flex items-center gap-2">
                Script / Brief untuk GD
                {scriptCopied && <span className="text-[#c1ff1a] normal-case">Ke-copy ✓</span>}
              </span>
            }
          >
            <textarea
              className={textareaCls}
              style={{ minHeight: '100px' }}
              value={form.script}
              onChange={(e) => set('script', e.target.value)}
              placeholder="Tempel breakdown slide / caption / beat-by-beat..."
            />
            <button
              type="button"
              onClick={() => copyText(form.script, () => setScriptCopied(true))}
              className="mt-1.5 font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#f2efe9] px-3 py-2 rounded-sm hover:border-[#b8b8b0] transition-colors"
            >
              Copy Script
            </button>
          </Field>
        )}

        {/* Carousel scripts - individual slide inputs */}
        {form.format === 'Carousel' && (
          <div className="space-y-3">
            <Field label="Jumlah Slide">
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={carouselSlideCount}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => {
                    const count = Math.max(1, parseInt(e.target.value) || 1)
                    setCarouselSlideCount(count)
                    // Cuma nambah slide baru (pad) kalau count naik. Kalau count turun,
                    // JANGAN motong data di sini — bisa ke-trigger tanpa sengaja pas lagi
                    // ngetik angka 2 digit (mis. "10" sempat lewat "1" dulu) atau scroll wheel
                    // di atas input. Data slide yang udah diisi tetap aman, baru beneran
                    // dipangkas pas klik Simpan (lihat handleSave).
                    if (count > (form.scripts?.length || 0)) {
                      const newScripts = [...(form.scripts || [])]
                      while (newScripts.length < count) newScripts.push('')
                      set('scripts', newScripts)
                    }
                  }}
                  className={`${inputCls} w-20`}
                />
                <span className="text-[11px] text-[#b8b8b0]">slide</span>
              </div>
            </Field>

            <div className="border border-[#4d4d47] rounded-sm p-3 bg-[#2e2e2a]/50">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0] mb-3">
                Script Per Slide - Enak copy paste untuk graphic design
              </p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))` }}>
                {Array.from({ length: carouselSlideCount }).map((_, idx) => (
                  <div key={idx} className="border border-[#4d4d47] rounded-sm overflow-hidden flex flex-col">
                    <div className="bg-[#262622] px-2.5 py-1.5 border-b border-[#4d4d47]">
                      <span className="font-mono text-[11px] text-[#c1ff1a]">SLIDE {idx + 1}</span>
                    </div>
                    <textarea
                      className={`${textareaCls} flex-1 rounded-none border-0 resize-none`}
                      style={{ minHeight: '120px' }}
                      value={form.scripts?.[idx] || ''}
                      onChange={(e) => {
                        const newScripts = [...(form.scripts || [])]
                        newScripts[idx] = e.target.value
                        set('scripts', newScripts)
                      }}
                      placeholder={`Script untuk slide ${idx + 1}...`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = form.scripts?.[idx] || ''
                        copyText(text, () => setScriptCopied(idx))
                      }}
                      className="bg-[#262622] border-t border-[#4d4d47] px-2.5 py-1.5 font-mono text-[10px] text-[#f2efe9] hover:bg-[#2e2e2a] transition-colors"
                    >
                      {scriptCopied === idx ? 'COPIED ✓' : 'COPY'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <Field label="Link Aset Visual (1 per baris — Drive/Figma/dsb)">
          <textarea
            className={textareaCls}
            style={{ minHeight: '70px' }}
            value={form.assets}
            onChange={(e) => set('assets', e.target.value)}
            placeholder={'https://drive.google.com/...\nhttps://figma.com/...'}
          />
          <button
            type="button"
            onClick={openAllAssets}
            className="mt-1.5 font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#f2efe9] px-3 py-2 rounded-sm hover:border-[#b8b8b0] transition-colors"
          >
            Buka Semua Link
          </button>
        </Field>

        {/* Drive Link - readonly, set saat move ke Terjadwal */}
        {form.driveLink && (
          <Field label="Link Google Drive (Konten/Design)">
            <div className="bg-[#2e2e2a] border border-[#4d4d47] rounded-sm p-2.5 text-[13px] break-all">
              <a 
                href={form.driveLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#c1ff1a] hover:underline"
              >
                {form.driveLink}
              </a>
            </div>
            <p className="text-[11px] text-[#b8b8b0] mt-1.5">
              Link ini di-set saat Anda move konten ke status &quot;Terjadwal&quot;
            </p>
          </Field>
        )}

        <details open className="mb-3">
          <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-wider text-[#b8b8b0] py-1.5">
            Konten Siap Posting (caption, link, dll)
          </summary>
          <div className="mt-2">
            <Field
              label={
                <span className="flex items-center gap-2">
                  Caption
                  {captionCopied && <span className="text-[#c1ff1a] normal-case">Ke-copy ✓</span>}
                </span>
              }
            >
              <textarea
                className={textareaCls}
                value={form.caption}
                onChange={(e) => set('caption', e.target.value)}
                placeholder="Caption siap posting..."
              />
              <button
                type="button"
                onClick={() => copyText(form.caption, () => setCaptionCopied(true))}
                className="mt-1.5 font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#f2efe9] px-3 py-2 rounded-sm hover:border-[#b8b8b0] transition-colors"
              >
                Copy Caption
              </button>
            </Field>
          </div>
        </details>

        <Field label="Catatan">
          <textarea className={textareaCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </Field>

        <div className="flex items-center justify-between mt-4 gap-2">
          {item && item.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className={`font-mono text-xs uppercase tracking-wider px-3 py-2 rounded-sm border transition-colors ${
                showConfirmDelete
                  ? 'bg-[#ff00ae] text-white border-[#ff00ae]'
                  : 'border-[#ff00ae] text-[#ff00ae] bg-transparent hover:bg-[#ff00ae]/10'
              }`}
            >
              {showConfirmDelete ? 'Konfirmasi Hapus' : 'Hapus'}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#b8b8b0] transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] px-4 py-2 rounded-sm hover:brightness-105 transition-all"
            >
              Simpan
            </button>
          </div>
        </div>

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#2e2e2a] border border-[#c1ff1a] text-[#f2efe9] px-4 py-2 rounded-sm text-[13px] whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </div>

    {item && item.id && (
      <CommentsPanel
        contentId={item.id}
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
      />
    )}

    <DriveLinkModal
      open={showApproveDriveModal}
      contentTitle={item?.title || ''}
      onClose={() => setShowApproveDriveModal(false)}
      onSave={(driveLink) => {
        setShowApproveDriveModal(false)
        finalizeApprove(driveLink)
      }}
    />
  </>
)
}
