'use client'

import { useState, useRef, useEffect } from 'react'

interface DriveLinkModalProps {
  open: boolean
  contentTitle: string
  onClose: () => void
  onSave: (driveLink: string) => void
}

export function DriveLinkModal({ open, contentTitle, onClose, onSave }: DriveLinkModalProps) {
  const [driveLink, setDriveLink] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2200)
  }

  const handleSave = () => {
    if (!driveLink.trim()) {
      showToast('Link Google Drive wajib diisi')
      return
    }
    
    // Validate if it's a valid Google Drive URL
    if (!driveLink.includes('drive.google.com') && !driveLink.includes('docs.google.com')) {
      showToast('Link harus dari Google Drive atau Google Docs')
      return
    }

    onSave(driveLink)
    setDriveLink('')
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1c1c1c] border border-[#3a3a36] rounded-md p-6 w-full max-w-[400px]">
        <h3 className="text-base font-extrabold uppercase tracking-wide mb-4 text-[#c1ff1a]">
          Link Konten/Design
        </h3>

        <div className="mb-4">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9a9a94] mb-2">
            Konten
          </label>
          <p className="text-[13px] text-[#f2efe9] mb-4 p-2.5 bg-[#232323] border border-[#3a3a36] rounded-sm">
            {contentTitle}
          </p>
        </div>

        <div className="mb-4">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-[#9a9a94] mb-2">
            Link Google Drive
          </label>
          <input
            type="text"
            placeholder="https://drive.google.com/..."
            value={driveLink}
            onChange={(e) => setDriveLink(e.target.value)}
            className="w-full bg-[#232323] border border-[#3a3a36] text-[#f2efe9] px-2.5 py-2 rounded-sm text-[13px] focus:outline-none focus:border-[#9a9a94] transition-colors"
          />
          <p className="text-[11px] text-[#9a9a94] mt-1.5">
            Paste link folder/file dari Google Drive atau Google Docs yang berisi design/konten final
          </p>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-wider border border-[#3a3a36] text-[#9a9a94] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            className="font-mono text-xs uppercase tracking-wider border border-[#c1ff1a] text-[#c1ff1a] px-3 py-2 rounded-sm hover:bg-[#c1ff1a]/10 transition-colors"
          >
            Simpan
          </button>
        </div>

        {toast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#232323] border border-[#ff00ae] text-[#ff00ae] px-4 py-2 rounded-sm text-[13px] whitespace-nowrap">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
