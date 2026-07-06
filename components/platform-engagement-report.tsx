'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import { calculateMetrics, filterItemsForReport } from '@/lib/reporting-utils'
import { PLATFORMS } from '@/lib/constants'
import type { Report } from '@/lib/types'

interface PlatformEngagementReportProps {
  report: Report | null
}

export function PlatformEngagementReport({ report }: PlatformEngagementReportProps) {
  const { items } = useContentStore()
  const [sortBy, setSortBy] = useState<'engagement' | 'views' | 'published'>('engagement')

  if (!report) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Pilih report untuk melihat engagement per platform
      </div>
    )
  }

  const filteredItems = filterItemsForReport(items, report)
  const metrics = calculateMetrics(filteredItems)

  if (!metrics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Tidak ada data untuk report ini
      </div>
    )
  }

  const platformData = PLATFORMS.map((platform) => {
    const platformMetrics = metrics.byPlatform[platform] || {
      published: 0,
      views: 0,
      engagement: 0,
      engagementRate: 0,
      topFormat: '-',
    }
    return {
      platform,
      ...platformMetrics,
    }
  })

  // Sort platform data
  const sortedData = [...platformData].sort((a, b) => {
    if (sortBy === 'engagement') return b.engagement - a.engagement
    if (sortBy === 'views') return b.views - a.views
    return b.published - a.published
  })

  // Get the max engagement for chart scaling
  const maxEngagement = Math.max(...sortedData.map((d) => d.engagement), 1)

  // Calculate total metrics
  const totalPublished = sortedData.reduce((sum, d) => sum + d.published, 0)
  const totalViews = sortedData.reduce((sum, d) => sum + d.views, 0)
  const totalEngagement = sortedData.reduce((sum, d) => sum + d.engagement, 0)
  const avgEngagementRate = totalPublished > 0 ? (totalEngagement / totalViews) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL PUBLISHED</p>
          <p className="text-3xl font-bold text-accent">{totalPublished}</p>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL VIEWS</p>
          <p className="text-3xl font-bold text-foreground">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">TOTAL ENGAGEMENT</p>
          <p className="text-3xl font-bold text-foreground">{totalEngagement.toLocaleString()}</p>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <p className="text-xs font-mono text-muted-foreground mb-1">AVG ENGAGEMENT RATE</p>
          <p className="text-3xl font-bold text-foreground">{avgEngagementRate.toFixed(2)}%</p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setSortBy('engagement')}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
            sortBy === 'engagement'
              ? 'bg-accent text-background border-accent'
              : 'border-border text-muted-foreground hover:border-foreground'
          }`}
        >
          By Engagement
        </button>
        <button
          onClick={() => setSortBy('views')}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
            sortBy === 'views'
              ? 'bg-accent text-background border-accent'
              : 'border-border text-muted-foreground hover:border-foreground'
          }`}
        >
          By Views
        </button>
        <button
          onClick={() => setSortBy('published')}
          className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
            sortBy === 'published'
              ? 'bg-accent text-background border-accent'
              : 'border-border text-muted-foreground hover:border-foreground'
          }`}
        >
          By Published
        </button>
      </div>

      {/* Platform Breakdown */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-foreground">Platform Breakdown</h3>

        <div className="space-y-3">
          {sortedData.map((data) => {
            const engagementPercent = (data.engagement / maxEngagement) * 100
            const isActive = data.published > 0

            return (
              <div
                key={data.platform}
                className="border border-border rounded-lg p-4 bg-muted/30"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-foreground min-w-24">
                      {data.platform}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded font-mono ${
                        isActive
                          ? 'bg-accent text-background'
                          : 'bg-border text-muted-foreground'
                      }`}
                    >
                      {data.published} konten
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-accent">
                      {data.engagement.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {data.engagementRate.toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Engagement Bar */}
                <div className="mb-2">
                  <div className="bg-border rounded h-2 overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all"
                      style={{ width: `${engagementPercent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground">Views</p>
                    <p className="font-bold text-foreground">{data.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="font-bold text-foreground">
                      {data.engagement.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Top Format</p>
                    <p className="font-bold text-foreground">{data.topFormat}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h4 className="text-sm font-bold text-foreground mb-3">Performance Summary</h4>
        <div className="space-y-2 text-xs">
          <p className="text-muted-foreground">
            <span className="text-foreground font-mono">
              {sortedData.filter((d) => d.published > 0).length}
            </span>{' '}
            platform(s) dengan konten aktif
          </p>
          <p className="text-muted-foreground">
            Platform dengan engagement tertinggi:{' '}
            <span className="text-foreground font-mono font-bold">
              {sortedData[0]?.platform} ({sortedData[0]?.engagement.toLocaleString()})
            </span>
          </p>
          <p className="text-muted-foreground">
            Rata-rata views per konten:{' '}
            <span className="text-foreground font-mono">
              {totalPublished > 0
                ? Math.round(totalViews / totalPublished).toLocaleString()
                : 0}
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}
