'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { useContentStore } from '@/lib/store'
import { ALL_PLATFORMS } from '@/lib/constants'

const BRAND_COLORS = ['#0036ff', '#c1ff1a', '#ff00ae', '#ff8c1a', '#00c2ff', '#a855f7']

// Skor konten disesuaikan objective-nya, biar gak nyampur metrik awareness/engagement/conversion
function scoreContent(item: { objective?: string; reach?: number; views: number; likes: number; comments: number; shares: number; saves: number; leads?: number; clicks?: number }) {
  const objective = item.objective || 'Engagement'
  if (objective === 'Awareness') return item.reach || item.views || 0
  if (objective === 'Conversion') return (item.leads || 0) * 5 + (item.clicks || 0)
  return item.likes + item.comments + item.shares + item.saves
}

function scoreLabel(objective?: string) {
  if (objective === 'Awareness') return 'Reach/Views'
  if (objective === 'Conversion') return 'Leads/Clicks'
  return 'Engagement'
}

export function EngagementDashboard() {
  const { items, accounts } = useContentStore()
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([...ALL_PLATFORMS])
  const [dateRange, setDateRange] = useState<[string, string]>([
    new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
  ])

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const isInDateRange =
        item.date >= dateRange[0] && item.date <= dateRange[1]
      const isPlatformSelected = selectedPlatforms.includes(item.platform)
      const isPublished = item.status === 'Publish'
      return isInDateRange && isPlatformSelected && isPublished
    })
  }, [items, dateRange, selectedPlatforms])

  const platformMetrics = useMemo(() => {
    const metrics: Record<string, {
      count: number
      views: number
      engagement: number
      likes: number
      comments: number
      shares: number
      saves: number
    }> = {}

    ALL_PLATFORMS.forEach((platform) => {
      metrics[platform] = {
        count: 0,
        views: 0,
        engagement: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        saves: 0,
      }
    })

    filteredItems.forEach((item) => {
      const m = metrics[item.platform]
      if (m) {
        m.count += 1
        m.views += item.views || 0
        m.likes += item.likes || 0
        m.comments += item.comments || 0
        m.shares += item.shares || 0
        m.saves += item.saves || 0
        m.engagement += (item.likes || 0) + (item.comments || 0) + (item.shares || 0) + (item.saves || 0)
      }
    })

    return metrics
  }, [filteredItems])

  const totalMetrics = useMemo(() => {
    const totals = {
      published: filteredItems.length,
      views: 0,
      reach: 0,
      engagement: 0,
      avgEngagementRate: 0,
      usedReachForERR: false,
    }

    filteredItems.forEach((item) => {
      totals.views += item.views || 0
      totals.reach += item.reach || 0
      const eng = (item.likes || 0) + (item.comments || 0) + (item.shares || 0) + (item.saves || 0)
      totals.engagement += eng
    })

    // Sesuai Social Media Metrics Guideline: ERR (Engagement Rate by Reach) yang paling
    // direkomendasikan = engagement / reach. Kalau reach belum diisi, fallback ke /views.
    if (totals.reach > 0) {
      totals.avgEngagementRate = (totals.engagement / totals.reach) * 100
      totals.usedReachForERR = true
    } else if (totals.views > 0) {
      totals.avgEngagementRate = (totals.engagement / totals.views) * 100
    }

    return totals
  }, [filteredItems])

  const sortedPlatforms = useMemo(() => {
    return Object.entries(platformMetrics)
      .filter(([_, m]) => m.count > 0)
      .sort((a, b) => b[1].engagement - a[1].engagement)
  }, [platformMetrics])

  // Data buat bar chart distribusi platform
  const platformChartData = useMemo(() => {
    return sortedPlatforms.map(([platform, m]) => ({
      platform,
      Engagement: m.engagement,
      Views: m.views,
    }))
  }, [sortedPlatforms])

  // Data buat line chart audience growth — gabung history semua platform jadi 1 timeline
  const growthChartData = useMemo(() => {
    const dateMap: Record<string, Record<string, number | string>> = {}
    const activePlatforms = new Set<string>()

    Object.entries(accounts).forEach(([platform, data]) => {
      if (!data.history || data.history.length === 0) return
      activePlatforms.add(platform)
      data.history.forEach((entry) => {
        if (entry.date < dateRange[0] || entry.date > dateRange[1]) return
        if (!dateMap[entry.date]) dateMap[entry.date] = { date: entry.date }
        dateMap[entry.date][platform] = entry.followers
      })
    })

    const sortedDates = Object.keys(dateMap).sort()
    return { rows: sortedDates.map((d) => dateMap[d]), platforms: Array.from(activePlatforms) }
  }, [accounts, dateRange])

  // Top 5 konten berdasarkan skor yang relevan sama objective masing-masing
  const topContent = useMemo(() => {
    return [...filteredItems]
      .map((item) => ({ item, score: scoreContent(item) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }, [filteredItems])

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="space-y-4">
        {/* Date Range */}
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs font-mono text-muted-foreground mb-1 block">
              START DATE
            </label>
            <input
              type="date"
              value={dateRange[0]}
              onChange={(e) => setDateRange([e.target.value, dateRange[1]])}
              className="w-full px-3 py-2 bg-muted border border-border rounded text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-mono text-muted-foreground mb-1 block">
              END DATE
            </label>
            <input
              type="date"
              value={dateRange[1]}
              onChange={(e) => setDateRange([dateRange[0], e.target.value])}
              className="w-full px-3 py-2 bg-muted border border-border rounded text-sm"
            />
          </div>
          <button
            onClick={() => {
              const end = new Date()
              const start = new Date(end)
              start.setDate(start.getDate() - 30)
              setDateRange([
                start.toISOString().split('T')[0],
                end.toISOString().split('T')[0],
              ])
            }}
            className="px-3 py-2 text-xs font-mono rounded border border-border hover:bg-muted transition-colors"
          >
            Last 30d
          </button>
        </div>

        {/* Platform Filter */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-muted-foreground block">
            FILTER PLATFORM
          </label>
          <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={`px-3 py-1 text-xs font-mono rounded-sm border transition-colors ${
                  selectedPlatforms.includes(platform)
                    ? 'bg-accent text-background border-accent'
                    : 'border-border text-muted-foreground hover:border-foreground'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground mb-2">PUBLISHED</div>
          <div className="text-2xl font-bold text-foreground">{totalMetrics.published}</div>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground mb-2">TOTAL VIEWS</div>
          <div className="text-2xl font-bold text-foreground">
            {totalMetrics.views.toLocaleString()}
          </div>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground mb-2">TOTAL ENGAGEMENT</div>
          <div className="text-2xl font-bold text-foreground">
            {totalMetrics.engagement.toLocaleString()}
          </div>
        </div>
        <div className="bg-muted border border-border rounded-lg p-4">
          <div className="text-xs font-mono text-muted-foreground mb-2">
            AVG ENGAGEMENT RATE {totalMetrics.usedReachForERR ? '(by Reach)' : '(by Views)'}
          </div>
          <div className="text-2xl font-bold text-foreground">
            {totalMetrics.avgEngagementRate.toFixed(2)}%
          </div>
          {!totalMetrics.usedReachForERR && (
            <div className="text-[10px] text-muted-foreground mt-1">
              Isi metrics Reach di tab Metrics buat pakai rumus ERR yang direkomendasikan.
            </div>
          )}
        </div>
      </div>

      {/* Chart: Distribusi Platform */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-foreground">DISTRIBUSI PLATFORM</h3>
        {platformChartData.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Belum ada data buat ditampilin di chart.
          </div>
        ) : (
          <div className="bg-muted border border-border rounded-lg p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4d4d47" />
                <XAxis dataKey="platform" tick={{ fontSize: 11, fill: '#b8b8b0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#b8b8b0' }} />
                <Tooltip
                  contentStyle={{ background: '#262622', border: '1px solid #4d4d47', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Engagement" fill="#c1ff1a" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Views" fill="#0036ff" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Chart: Audience Growth */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-foreground">AUDIENCE GROWTH</h3>
        {growthChartData.rows.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Belum ada histori followers. Update data akun di menu <span className="text-[#0036ff]">Akun</span> buat mulai nge-track growth.
          </div>
        ) : (
          <div className="bg-muted border border-border rounded-lg p-4" style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthChartData.rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4d4d47" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#b8b8b0' }} />
                <YAxis tick={{ fontSize: 11, fill: '#b8b8b0' }} />
                <Tooltip
                  contentStyle={{ background: '#262622', border: '1px solid #4d4d47', fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {growthChartData.platforms.map((platform, i) => (
                  <Line
                    key={platform}
                    type="monotone"
                    dataKey={platform}
                    stroke={BRAND_COLORS[i % BRAND_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Top 5 Konten */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-foreground">TOP 5 KONTEN</h3>
        {topContent.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Belum ada konten published di rentang tanggal ini.
          </div>
        ) : (
          <div className="space-y-2">
            {topContent.map(({ item, score }, idx) => (
              <div
                key={item.id}
                className="bg-muted border border-border rounded-lg p-3 flex items-center gap-3"
              >
                <div className="font-mono text-lg font-bold text-[#0036ff] w-6 text-center">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{item.title || '(Tanpa judul)'}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.platform} · {item.objective || 'Engagement'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[#c1ff1a]">{score.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">{scoreLabel(item.objective)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Breakdown (detail) */}
      <div className="space-y-3">
        <h3 className="font-mono text-sm font-bold text-foreground">PLATFORM PERFORMANCE</h3>
        {sortedPlatforms.length === 0 ? (
          <div className="bg-muted border border-border rounded-lg p-8 text-center text-muted-foreground">
            No published content in selected date range
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPlatforms.map(([platform, metrics]) => {
              const engagementRate = metrics.views > 0 ? (metrics.engagement / metrics.views) * 100 : 0
              return (
                <div
                  key={platform}
                  className="bg-muted border border-border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="font-mono font-bold text-foreground">{platform}</div>
                        <div className="text-xs text-muted-foreground">
                          {metrics.count} content • {metrics.views.toLocaleString()} views
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">
                        {metrics.engagement.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">engagement</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-background rounded p-2">
                      <div className="text-muted-foreground">Likes</div>
                      <div className="font-bold text-foreground">{metrics.likes.toLocaleString()}</div>
                    </div>
                    <div className="bg-background rounded p-2">
                      <div className="text-muted-foreground">Comments</div>
                      <div className="font-bold text-foreground">{metrics.comments.toLocaleString()}</div>
                    </div>
                    <div className="bg-background rounded p-2">
                      <div className="text-muted-foreground">Shares</div>
                      <div className="font-bold text-foreground">{metrics.shares.toLocaleString()}</div>
                    </div>
                    <div className="bg-background rounded p-2">
                      <div className="text-muted-foreground">Saves</div>
                      <div className="font-bold text-foreground">{metrics.saves.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Engagement Rate Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Engagement Rate</span>
                      <span className="font-mono font-bold">{engagementRate.toFixed(2)}%</span>
                    </div>
                    <div className="h-2 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${Math.min(engagementRate * 5, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
