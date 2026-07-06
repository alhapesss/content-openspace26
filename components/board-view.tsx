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
  const { updateItem } = useContentStore()
  const dragId = useRef<string | null>(null)
  const [pendingItem, setPendingItem] = useState<ContentItem | null>(null)
  const [driveLinkModalOpen, setDriveLinkModalOpen] = useState(false)

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

  return (
    <>
    <div className="flex gap-3 overflow-x-auto pb-2">
      {STATUSES.map((status) => {
        const colItems = items.filter((i) => i.status === status)
        return (
          <div
            key={status}
            className="min-w-[230px] flex-1 flex flex-col rounded-md border border-[#3a3a36] bg-[#1c1c1c]"
          >
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-[#3a3a36]">
              <span className="font-mono text-[11px] uppercase tracking-widest text-[#9a9a94]">{status}</span>
              <span className="font-mono text-[11px] text-[#9a9a94]">{colItems.length}</span>
            </div>
            <div
              className="flex-1 p-2.5 min-h-[120px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
            >
              {colItems.length === 0 && (
                <p className="text-center text-xs text-[#9a9a94] py-2">Kosong</p>
              )}
              {colItems.map((item) => (
                <BoardCard
                  key={item.id}
                  item={item}
                  onOpen={() => onOpenItem(item.id)}
                  onDragStart={() => handleDragStart(item.id)}
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
}: {
  item: ContentItem
  onOpen: () => void
  onDragStart: () => void
}) {
  const borderColor = FORMAT_COLORS[item.format] || '#f2efe9'
  const crew = crewLine(item)
  const assetCount = assetList(item).length

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="mb-2 cursor-grab active:cursor-grabbing rounded-sm border border-[#3a3a36] bg-[#232323] p-2.5 text-sm hover:border-[#9a9a94] transition-colors"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="font-bold mb-1 text-[13px] text-[#f2efe9] leading-snug">
        {item.title || '(tanpa judul)'}
      </div>
      <div className="font-mono text-[10px] uppercase text-[#9a9a94] tracking-wide">
        {item.format}{item.subformat ? ` · ${item.subformat}` : ''}{item.pillar ? ` · ${item.pillar}` : ''}
      </div>
      <div className="text-[11px] text-[#9a9a94] mt-1">
        {item.date || 'Belum ada tanggal'}{' · '}{item.pic || 'Belum ada PIC'}
      </div>
      {crew && <div className="text-[11px] text-[#9a9a94] mt-0.5">{crew}</div>}
      {assetCount > 0 && (
        <div className="text-[11px] text-[#9a9a94] mt-0.5">{assetCount} aset terlampir</div>
      )}
    </div>
  )
}
