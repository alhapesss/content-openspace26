'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import {
  calculateMetrics,
  filterItemsForReport,
  PRESET_REPORTS,
  formatMetricLabel,
} from '@/lib/reporting-utils'
import { STATUSES, PLATFORMS, FORMATS, PILLARS } from '@/lib/constants'
import { Button } from './ui/button'
import { PlatformEngagementReport } from './platform-engagement-report'
import type { Report } from '@/lib/types'

const generateId = () => crypto.getRandomValues(new Uint8Array(16)).join('')

export function AdvancedReportView() {
  const { items, team, reports, addReport, deleteReport } = useContentStore()
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [viewMode, setViewMode] = useState<'overview' | 'platform'>('overview')
  const [dateRange, setDateRange] = useState<[string, string]>([
    getMonthStart(),
    getMonthEnd(),
  ])

  const [builderData, setBuilderData] = useState({
    name: '',
    type: 'engagement' as const,
    metrics: ['totalPublished', 'totalViews', 'totalEngagement'],
    filters: {
      statuses: [] as string[],
      platforms: [] as string[],
      formats: [] as string[],
      pillars: [] as string[],
      team: [] as string[],
    },
  })

  const handleCreateReport = () => {
    if (!builderData.name.trim()) return

    const newReport: Report = {
      id: generateId(),
      name: builderData.name,
      type: builderData.type,
      dateRange,
      filters: builderData.filters,
      metrics: builderData.metrics,
      createdAt: Date.now(),
      lastModified: Date.now(),
    }

    addReport(newReport)
    setBuilderData({
      name: '',
      type: 'engagement',
      metrics: ['totalPublished', 'totalViews', 'totalEngagement'],
      filters: { statuses: [], platforms: [], formats: [], pillars: [], team: [] },
    })
    setShowBuilder(false)
  }

  const displayReport = selectedReport || (reports.length > 0 ? reports[0] : null)
  const filteredItems = displayReport ? filterItemsForReport(items, displayReport) : []
  const metrics = displayReport ? calculateMetrics(filteredItems) : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <Button
          onClick={() => setShowBuilder(!showBuilder)}
          className="bg-accent text-background hover:bg-accent/80"
        >
          {showBuilder ? 'Cancel' : 'New Report'}
        </Button>
      </div>

      {/* Report Builder */}
      {showBuilder && (
        <div className="bg-muted/40 border border-border rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-lg">Create Custom Report</h3>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Report Name</label>
            <input
              type="text"
              value={builderData.name}
              onChange={(e) => setBuilderData({ ...builderData, name: e.target.value })}
              placeholder="e.g., October Performance"
              className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange[0]}
                onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">End Date</label>
              <input
                type="date"
                value={dateRange[1]}
                onChange={(e) => setDateRange([dateRange[0], e.target.value])}
                className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Filters</label>
            <div className="space-y-3">
              {STATUSES.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          const newStatuses = builderData.filters.statuses.includes(s)
                            ? builderData.filters.statuses.filter((x) => x !== s)
                            : [...builderData.filters.statuses, s]
                          setBuilderData({
                            ...builderData,
                            filters: { ...builderData.filters, statuses: newStatuses },
                          })
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          builderData.filters.statuses.includes(s)
                            ? 'bg-accent text-background'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {PLATFORMS.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Platform</p>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          const newPlatforms = builderData.filters.platforms.includes(p)
                            ? builderData.filters.platforms.filter((x) => x !== p)
                            : [...builderData.filters.platforms, p]
                          setBuilderData({
                            ...builderData,
                            filters: { ...builderData.filters, platforms: newPlatforms },
                          })
                        }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          builderData.filters.platforms.includes(p)
                            ? 'bg-accent text-background'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleCreateReport}
              disabled={!builderData.name.trim()}
              className="bg-accent text-background"
            >
              Create Report
            </Button>
            <Button
              onClick={() => setShowBuilder(false)}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Reports List */}
      {reports.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground mb-3">Your Reports</h3>
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => setSelectedReport(report)}
              className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                selectedReport?.id === report.id
                  ? 'bg-accent/20 border-accent'
                  : 'border-border hover:border-border/80 bg-background/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{report.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {report.dateRange[0]} to {report.dateRange[1]}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteReport(report.id)
                    if (selectedReport?.id === report.id) setSelectedReport(null)
                  }}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  ✕
                </button>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* View Mode Tabs */}
      {displayReport && (
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setViewMode('overview')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'overview'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setViewMode('platform')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              viewMode === 'platform'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Platform Engagement
          </button>
        </div>
      )}

      {/* Report Display - Overview */}
      {metrics && displayReport && viewMode === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Published</p>
              <p className="text-2xl font-bold text-accent">{metrics.totalPublished}</p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Views</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics.totalViews.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Engagement</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics.totalEngagement.toLocaleString()}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Avg Rate</p>
              <p className="text-2xl font-bold text-foreground">
                {metrics.avgEngagementRate.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Platform Breakdown */}
          {Object.keys(metrics.byPlatform).length > 0 && (
            <div className="bg-muted/30 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">By Platform</h3>
              <div className="space-y-2">
                {Object.entries(metrics.byPlatform).map(([platform, data]) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between p-2 bg-background/50 rounded border border-border/30"
                  >
                    <span className="font-medium text-foreground">{platform}</span>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Published</p>
                        <p className="font-semibold text-foreground">{data.published}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="font-semibold text-foreground">{data.views}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Rate</p>
                        <p className="font-semibold text-foreground">{data.engagementRate.toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Items Count */}
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground mb-2">Items in this report: {filteredItems.length}</p>
            <div className="flex gap-2 flex-wrap">
              {filteredItems.slice(0, 5).map((item) => (
                <span
                  key={item.id}
                  className="text-xs bg-background px-2 py-1 rounded border border-border/30 text-foreground"
                >
                  {item.title}
                </span>
              ))}
              {filteredItems.length > 5 && (
                <span className="text-xs text-muted-foreground px-2 py-1">
                  +{filteredItems.length - 5} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Display - Platform Engagement */}
      {displayReport && viewMode === 'platform' && (
        <PlatformEngagementReport report={displayReport} />
      )}

      {reports.length === 0 && !showBuilder && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="mb-4">No reports yet</p>
          <Button
            onClick={() => setShowBuilder(true)}
            className="bg-accent text-background hover:bg-accent/80"
          >
            Create Your First Report
          </Button>
        </div>
      )}
    </div>
  )
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function getMonthEnd(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}
