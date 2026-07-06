import type { ContentItem, Report } from './types'

export interface ReportMetrics {
  totalPublished: number
  totalViews: number
  totalEngagement: number
  avgEngagementRate: number
  byPlatform: Record<string, PlatformMetrics>
  byFormat: Record<string, FormatMetrics>
  byStatus: Record<string, number>
  timeline: TimelinePoint[]
}

export interface PlatformMetrics {
  published: number
  views: number
  engagement: number
  engagementRate: number
  topFormat: string
}

export interface FormatMetrics {
  published: number
  views: number
  engagement: number
  engagementRate: number
}

export interface TimelinePoint {
  date: string
  published: number
  views: number
  engagement: number
}

export function filterItemsForReport(
  items: ContentItem[],
  report: Report
): ContentItem[] {
  const [startDate, endDate] = report.dateRange
  const filters = report.filters

  return items.filter((item) => {
    // Date range
    if (item.date < startDate || item.date > endDate) return false

    // Status filter
    if (filters.statuses?.length && !filters.statuses.includes(item.status)) {
      return false
    }

    // Platform filter
    if (filters.platforms?.length && !filters.platforms.includes(item.platform)) {
      return false
    }

    // Format filter
    if (filters.formats?.length && !filters.formats.includes(item.format)) {
      return false
    }

    // Pillar filter
    if (filters.pillars?.length && !filters.pillars.includes(item.pillar)) {
      return false
    }

    // Team filter
    if (filters.team?.length) {
      const itemTeam = [
        item.pic,
        item.picGraphic,
        item.picVideoEditor,
        item.picTalent,
        item.picVideographer,
      ].filter(Boolean)
      const hasTeamMember = filters.team.some((member) => itemTeam.includes(member))
      if (!hasTeamMember) return false
    }

    return true
  })
}

export function calculateMetrics(items: ContentItem[]): ReportMetrics {
  const byPlatform: Record<string, PlatformMetrics> = {}
  const byFormat: Record<string, FormatMetrics> = {}
  const byStatus: Record<string, number> = {}
  const timeline: TimelinePoint[] = []

  let totalViews = 0
  let totalEngagement = 0
  let totalPublished = 0

  // Group by date for timeline
  const byDate: Record<string, ContentItem[]> = {}

  items.forEach((item) => {
    const engagement = item.likes + item.comments + item.shares + item.saves
    const engagementRate = item.views > 0 ? (engagement / item.views) * 100 : 0

    // Accumulate totals
    totalViews += item.views
    totalEngagement += engagement
    if (item.status === 'Publish') totalPublished++

    // By platform
    if (!byPlatform[item.platform]) {
      byPlatform[item.platform] = {
        published: 0,
        views: 0,
        engagement: 0,
        engagementRate: 0,
        topFormat: '',
      }
    }
    byPlatform[item.platform].views += item.views
    byPlatform[item.platform].engagement += engagement
    if (item.status === 'Publish') byPlatform[item.platform].published++

    // By format
    if (!byFormat[item.format]) {
      byFormat[item.format] = {
        published: 0,
        views: 0,
        engagement: 0,
        engagementRate: 0,
      }
    }
    byFormat[item.format].views += item.views
    byFormat[item.format].engagement += engagement
    if (item.status === 'Publish') byFormat[item.format].published++

    // By status
    byStatus[item.status] = (byStatus[item.status] || 0) + 1

    // Timeline
    if (!byDate[item.date]) byDate[item.date] = []
    byDate[item.date].push(item)
  })

  // Calculate engagement rates
  Object.keys(byPlatform).forEach((platform) => {
    const p = byPlatform[platform]
    p.engagementRate = p.views > 0 ? (p.engagement / p.views) * 100 : 0
  })

  Object.keys(byFormat).forEach((format) => {
    const f = byFormat[format]
    f.engagementRate = f.views > 0 ? (f.engagement / f.views) * 100 : 0
  })

  // Build timeline
  Object.keys(byDate)
    .sort()
    .forEach((date) => {
      const dayItems = byDate[date]
      const published = dayItems.filter((i) => i.status === 'Publish').length
      const views = dayItems.reduce((sum, i) => sum + i.views, 0)
      const engagement = dayItems.reduce(
        (sum, i) => sum + (i.likes + i.comments + i.shares + i.saves),
        0
      )
      timeline.push({ date, published, views, engagement })
    })

  const avgEngagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0

  return {
    totalPublished,
    totalViews,
    totalEngagement,
    avgEngagementRate,
    byPlatform,
    byFormat,
    byStatus,
    timeline,
  }
}

export const PRESET_REPORTS: Omit<Report, 'id' | 'createdAt' | 'lastModified'>[] = [
  {
    name: 'All Content Performance',
    type: 'engagement',
    dateRange: [getMonthStart(), getMonthEnd()],
    filters: {},
    metrics: ['totalPublished', 'totalViews', 'totalEngagement', 'avgEngagementRate'],
  },
  {
    name: 'Team Workload',
    type: 'workload',
    dateRange: [getMonthStart(), getMonthEnd()],
    filters: { statuses: ['Ide', 'Draft', 'Review', 'Terjadwal'] },
    metrics: ['totalPublished'],
  },
  {
    name: 'Platform Performance',
    type: 'engagement',
    dateRange: [getMonthStart(), getMonthEnd()],
    filters: {},
    metrics: ['byPlatform'],
  },
]

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function getMonthEnd(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
}

export function formatMetricLabel(metric: string): string {
  const labels: Record<string, string> = {
    totalPublished: 'Total Published',
    totalViews: 'Total Views',
    totalEngagement: 'Total Engagement',
    avgEngagementRate: 'Avg Engagement Rate',
    byPlatform: 'By Platform',
    byFormat: 'By Format',
    byStatus: 'By Status',
  }
  return labels[metric] || metric
}
