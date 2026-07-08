'use client'

import { useRef, useState } from 'react'
import { useContentStore } from '@/lib/store'
import { STATUSES, FORMAT_COLORS } from '@/lib/constants'
import { matchesSearch, assetList, crewLine } from '@/lib/content-utils'
import { DriveLinkModal } from './drive-link-modal'
import type { ContentItem } from '@/lib/types'
import { cn } from '@/lib/utils'

interface BoardViewProps {
  items: ContentItem[]
  onOpenItem: (id: string) => void
}

export function BoardView({ items, onOpenItem }: BoardViewProps) {
  const { updateItem, addItem, deleteItem, team } = useContentStore()
  const dragId = useRef<string | null>(null)
  const [pendingItem, setPendingItem] = useState<ContentItem | null>(null)
  const [driveLinkModalOpen, setDriveLinkModalOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkPic, setBulkPic] = useState('')

  const handleDragStart = (id: string) => { dragId.current = id }

  const handleDrop = (status: string) => {
    if (!dragId.current) return
    const item = items.find((i) => i.id === dragId.current)
    if (item && item.status !== status) {
      // Jika move ke "Terjadwal", show drive link modal
      if (status === 'Terjadwal') {
        setPendingItem(item)
        setDriveLinkModalOpen(true)
      } else {
        updateItem(dragId.current, { status })
      }
    }
    dragId.current = null
  }

  const handleDriveLinkSave = (driveLink: string) => {
    if (pendingItem) {
      updateItem(pendingItem.id, { status: 'Terjadwal', driveLink })
      setPendingItem(null)
      setDriveLinkModalOpen(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
    setBulkStatus('')
    setBulkPic('')
  }

  const applyBulkStatus = () => {
    if (!bulkStatus) return
    selectedIds.forEach((id) => updateItem(id, { status: bulkStatus }))
    exitSelectMode()
  }

  const applyBulkPic = () => {
    if (!bulkPic) return
    selectedIds.forEach((id) => updateItem(id, { pic: bulkPic }))
    exitSelectMode()
  }

  const applyBulkDelete = () => {
    if (!window.confirm(`Hapus ${selectedIds.size} konten terpilih? Gak bisa dibatalin.`)) return
    selectedIds.forEach((id) => deleteItem(id))
    exitSelectMode()
  }

  const handleDuplicate = (item: ContentItem) => {
    const clone: ContentItem = {
      ...item,
      id: crypto.getRandomValues(new Uint8Array(16)).join(''),
      title: `${item.title} (copy)`,
      status: 'Ide',
      date: '',
      shootDate: '',
      driveLink: '',
      briefPosting: '',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      reach: 0,
      impressions: 0,
      brandMentions: 0,
      clicks: 0,
      leads: 0,
      metricsUpdatedAt: undefined,
      approvalStatus: undefined,
      approvedBy: undefined,
      approvedAt: undefined,
      rejectionReason: undefined,
      createdAt: Date.now(),
    }
    addItem(clone)
    onOpenItem(clone.id)
  }

  return (
    <>
    <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
      {!selectMode ? (
        <button
          onClick={() => setSelectMode(true)}
          className="font-mono text-[11px] uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-1.5 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
        >
          Pilih Banyak
        </button>
      ) : (
        <div className="flex items-center gap-2 flex-wrap font-mono text-[11px]">
          <span className="text-[#f2efe9]">{selectedIds.size} dipilih</span>
          <select
            className="bg-[#262622] border border-[#4d4d47] text-[#f2efe9] rounded-sm px-2 py-1.5"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="">Ganti status...</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={applyBulkStatus}
            disabled={!bulkStatus || selectedIds.size === 0}
            className="border border-[#4d4d47] px-2 py-1.5 rounded-sm text-[#b8b8b0] hover:text-[#f2efe9] hover:border-[#f2efe9] disabled:opacity-40 disabled:hover:border-[#4d4d47]"
          >
            Terapkan
          </button>
          <select
            className="bg-[#262622] border border-[#4d4d47] text-[#f2efe9] rounded-sm px-2 py-1.5"
            value={bulkPic}
            onChange={(e) => setBulkPic(e.target.value)}
          >
            <option value="">Ganti PIC...</option>
            {team.map((m) => <option key={m.name} value={m.name}>{m.name}</option>)}
          </select>
          <button
            onClick={applyBulkPic}
            disabled={!bulkPic || selectedIds.size === 0}
            className="border border-[#4d4d47] px-2 py-1.5 rounded-sm text-[#b8b8b0] hover:text-[#f2efe9] hover:border-[#f2efe9] disabled:opacity-40 disabled:hover:border-[#4d4d47]"
          >
            Terapkan
          </button>
          <button
            onClick={applyBulkDelete}
            disabled={selectedIds.size === 0}
            className="border border-[#ff00ae]/30 text-[#ff00ae] px-2 py-1.5 rounded-sm hover:border-[#ff00ae] disabled:opacity-40"
          >
            Hapus
          </button>
          <button
            onClick={exitSelectMode}
            className="border border-[#4d4d47] px-2 py-1.5 rounded-sm text-[#b8b8b0] hover:text-[#f2efe9] hover:border-[#f2efe9]"
          >
            Batal
          </button>
        </div>
      )}
    </div>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUSES.map((status) => {
        const colItems = items.filter((i) => i.status === status)
        return (
          <div
            key={status}
            className="min-w-[230px] flex-1 flex flex-col rounded-md border border-[#4d4d47] bg-[#262622]"
          >
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#4d4d47]">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#b8b8b0]">{status}</span>
              <span className="font-mono text-[11px] text-[#b8b8b0]">{colItems.length}</span>
            </div>
            <div
              className="flex-1 p-2.5 min-h-[120px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              {colItems.length === 0 && (
                <p className="text-center text-xs text-[#b8b8b0] py-2">Kosong</p>
              )}
              {colItems.map((item) => (
                <BoardCard
                  key={item.id}
                  item={item}
                  onOpen={() => (selectMode ? toggleSelect(item.id) : onOpenItem(item.id))}
                  onDragStart={() => handleDragStart(item.id)}
                  selectMode={selectMode}
                  selected={selectedIds.has(item.id)}
                  onDuplicate={() => handleDuplicate(item)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>

    {pendingItem && (
      <DriveLinkModal
        open={driveLinkModalOpen}
        contentTitle={pendingItem.title}
        onClose={() => {
          setDriveLinkModalOpen(false)
          setPendingItem(null)
        }}
        onSave={handleDriveLinkSave}
      />
    )}
    </>
  )
}

function BoardCard({
  item,
  onOpen,
  onDragStart,
  selectMode,
  selected,
  onDuplicate,
}: {
  item: ContentItem
  onOpen: () => void
  onDragStart: () => void
  selectMode: boolean
  selected: boolean
  onDuplicate: () => void
}) {
  const borderColor = FORMAT_COLORS[item.format] || '#f2efe9'
  const crew = crewLine(item)
  const assetCount = assetList(item).length

  return (
    <div
      draggable={!selectMode}
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        'mb-2 cursor-pointer rounded-sm border bg-[#2e2e2a] p-2.5 text-sm transition-colors relative',
        selectMode ? 'hover:border-[#0036ff]' : 'cursor-grab active:cursor-grabbing hover:border-[#b8b8b0]',
        selected ? 'border-[#0036ff]' : 'border-[#4d4d47]'
      )}
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-start justify-between gap-2">
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onOpen}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0"
          />
        )}
        <div className="font-bold mb-1 text-[13px] text-[#f2efe9] leading-snug flex-1">
          {item.title || '(tanpa judul)'}
        </div>
        {!selectMode && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDuplicate()
            }}
            title="Duplikat jadi konten baru"
            className="shrink-0 font-mono text-[10px] text-[#b8b8b0] hover:text-[#f2efe9] border border-[#4d4d47] hover:border-[#f2efe9] rounded-sm px-1.5 py-0.5"
          >
            Duplikat
          </button>
        )}
      </div>
      <div className="font-mono text-[10px] uppercase text-[#b8b8b0] tracking-wide">
        {item.format}{item.subformat ? ` · ${item.subformat}` : ''}{item.pillar ? ` · ${item.pillar}` : ''}
      </div>
      <div className="text-[11px] text-[#b8b8b0] mt-1">
        {item.date || 'Belum ada tanggal'}{' · '}{item.pic || 'Belum ada PIC'}
      </div>
      {crew && <div className="text-[11px] text-[#b8b8b0] mt-0.5">{crew}</div>}
      {assetCount > 0 && (
        <div className="text-[11px] text-[#b8b8b0] mt-0.5">{assetCount} aset terlampir</div>
      )}
    </div>
  )
}
