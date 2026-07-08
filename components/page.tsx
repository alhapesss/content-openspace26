'use client'

import { useState, useEffect } from 'react'
import { useContentStore } from '@/lib/store'
import { useNotificationsMonitor } from '@/hooks/use-notifications-monitor'
import { useSupabaseSync } from '@/hooks/use-supabase-sync'
import { BoardView } from '@/components/board-view'
import { CalendarView } from '@/components/calendar-view'
import { AdvancedReportView } from '@/components/advanced-report-view'
import { WorkloadMonitor } from '@/components/workload-monitor'
import { EngagementDashboard } from '@/components/engagement-dashboard'
import { MetricsTable } from '@/components/metrics-table'
import { StatsBar } from '@/components/stats-bar'
import { TeamModal, AccountsModal, ExportModal, ResetConfirmModal } from '@/components/toolbar-modals'
import { ContentModal } from '@/components/content-modal'
import { ImportModal } from '@/components/import-modal'
import { NotificationCenter } from '@/components/notification-center'
import { FilterPanel } from '@/components/filter-panel'
import { Button } from '@/components/ui/button'
import { filterContent } from '@/lib/search-utils'

type ViewMode = 'board' | 'calendar' | 'report' | 'workload' | 'engagement' | 'metrics'

export default function Page() {
  const { items, currentFilter, setCurrentFilter } = useContentStore()
  const [viewMode, setViewMode] = useState<ViewMode>('board')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [teamOpen, setTeamOpen] = useState(false)
  const [accountsOpen, setAccountsOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | null>('csv')
  const [resetOpen, setResetOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!toastMsg) return
    const t = setTimeout(() => setToastMsg(null), 3000)
    return () => clearTimeout(t)
  }, [toastMsg])

  // Monitor for notifications
  useNotificationsMonitor()
  const hydrated = useSupabaseSync()

  // Update filter query when search input changes
  useEffect(() => {
    setCurrentFilter({
      ...currentFilter,
      query: searchInput,
    })
  }, [searchInput])

  // Buka modal konten otomatis kalau app diakses dari link WA (?content=id)
  useEffect(() => {
    if (!hydrated) return
    const params = new URLSearchParams(window.location.search)
    const contentId = params.get('content')
    if (contentId && items.some((i) => i.id === contentId)) {
      setSelectedItemId(contentId)
      params.delete('content')
      const rest = params.toString()
      window.history.replaceState({}, '', rest ? `?${rest}` : window.location.pathname)
    }
  }, [hydrated, items])

  const filteredItems = filterContent(items, currentFilter)

  const selectedItem = selectedItemId === 'NEW' ? null : items.find((i) => i.id === selectedItemId)

  const handleNewContent = () => {
    setSelectedItemId('NEW')
  }

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Memuat data tim…
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-[#0036ff]">Social Media Openspace!</h1>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleNewContent}
              className="font-mono text-xs font-extrabold uppercase tracking-wider bg-[#c1ff1a] text-[#0a0a0a] hover:brightness-105 transition-all"
              size="sm"
            >
              + New Content
            </Button>
            <button
              onClick={() => setImportOpen(true)}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
            >
              + Import
            </button>
            <NotificationCenter />
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search content... (⌘K)"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTeamOpen(true)}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
            >
              Tim
            </button>
            <button
              onClick={() => setAccountsOpen(true)}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
            >
              Akun
            </button>
            <button
              onClick={() => setExportOpen(true)}
              className="font-mono text-xs uppercase tracking-wider border border-[#4d4d47] text-[#b8b8b0] px-3 py-2 rounded-sm hover:border-[#f2efe9] hover:text-[#f2efe9] transition-colors"
            >
              Ekspor
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="font-mono text-xs uppercase tracking-wider border border-[#ff00ae]/30 text-[#ff00ae] px-3 py-2 rounded-sm hover:border-[#ff00ae] transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </header>

      {/* Filter Panel */}
      <FilterPanel />

      {/* Stats Bar */}
      <StatsBar
        items={filteredItems}
        totalItems={items}
      />

      {/* View Mode Selector */}
      <div className="border-b border-border px-6 py-3 flex gap-2">
        <Button
          onClick={() => setViewMode('board')}
          variant={viewMode === 'board' ? 'default' : 'outline'}
          size="sm"
        >
          Board
        </Button>
        <Button
          onClick={() => setViewMode('calendar')}
          variant={viewMode === 'calendar' ? 'default' : 'outline'}
          size="sm"
        >
          Calendar
        </Button>
        <Button
          onClick={() => setViewMode('report')}
          variant={viewMode === 'report' ? 'default' : 'outline'}
          size="sm"
        >
          Reports
        </Button>
        <Button
          onClick={() => setViewMode('workload')}
          variant={viewMode === 'workload' ? 'default' : 'outline'}
          size="sm"
        >
          Workload
        </Button>
        <Button
          onClick={() => setViewMode('engagement')}
          variant={viewMode === 'engagement' ? 'default' : 'outline'}
          size="sm"
        >
          Engagement
        </Button>
        <Button
          onClick={() => setViewMode('metrics')}
          variant={viewMode === 'metrics' ? 'default' : 'outline'}
          size="sm"
        >
          Metrics
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {viewMode === 'board' && (
          <div className="flex-1 overflow-auto p-6">
            <BoardView
              items={filteredItems}
              onOpenItem={setSelectedItemId}
            />
          </div>
        )}

        {viewMode === 'calendar' && (
          <div className="flex-1 overflow-auto p-6">
            <CalendarView
              items={filteredItems}
              onOpenItem={setSelectedItemId}
            />
          </div>
        )}

        {viewMode === 'report' && (
          <div className="flex-1 overflow-auto p-6">
            <AdvancedReportView />
          </div>
        )}

        {viewMode === 'workload' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-4xl">
              <WorkloadMonitor />
            </div>
          </div>
        )}

        {viewMode === 'engagement' && (
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-6xl">
              <EngagementDashboard />
            </div>
          </div>
        )}

        {viewMode === 'metrics' && (
          <div className="flex-1 overflow-auto p-6">
            <MetricsTable onOpenItem={setSelectedItemId} />
          </div>
        )}
      </main>

      {/* Content Modal */}
      {selectedItem !== undefined && (
        <ContentModal
          item={selectedItem}
          onClose={() => setSelectedItemId(null)}
        />
      )}

      {/* Toolbar Modals */}
      <TeamModal open={teamOpen} onClose={() => setTeamOpen(false)} />
      <AccountsModal open={accountsOpen} onClose={() => setAccountsOpen(false)} />
      <ExportModal
        open={exportOpen}
        format={exportFormat}
        onClose={() => setExportOpen(false)}
        onToast={setToastMsg}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onToast={setToastMsg}
      />
      {toastMsg && (
        <div className="fixed bottom-4 right-4 font-mono text-xs bg-[#262622] border border-[#4d4d47] text-[#f2efe9] px-4 py-2 rounded-sm z-50">
          {toastMsg}
        </div>
      )}
      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          const { resetItems } = useContentStore.getState()
          resetItems()
          setResetOpen(false)
        }}
      />
    </div>
  )
}
