import type { ContentItem, SearchFilter } from './types'

export function matchesSearchQuery(item: ContentItem, query: string): boolean {
  if (!query.trim()) return true
  const lowerQuery = query.toLowerCase()
  return (
    item.title.toLowerCase().includes(lowerQuery) ||
    item.pic.toLowerCase().includes(lowerQuery) ||
    item.notes.toLowerCase().includes(lowerQuery) ||
    item.caption.toLowerCase().includes(lowerQuery) ||
    item.script.toLowerCase().includes(lowerQuery)
  )
}

export function filterContent(
  items: ContentItem[],
  filter: SearchFilter
): ContentItem[] {
  return items.filter((item) => {
    // Text search
    if (!matchesSearchQuery(item, filter.query)) return false

    // Status filter
    if (filter.statuses.length > 0 && !filter.statuses.includes(item.status)) {
      return false
    }

    // Platform filter
    if (filter.platforms.length > 0 && !filter.platforms.includes(item.platform)) {
      return false
    }

    // Format filter
    if (filter.formats.length > 0 && !filter.formats.includes(item.format)) {
      return false
    }

    // Pillar filter
    if (filter.pillars.length > 0 && !filter.pillars.includes(item.pillar)) {
      return false
    }

    // Team filter (any of the team members)
    if (filter.team.length > 0) {
      const itemTeam = [
        item.pic,
        item.picGraphic,
        item.picVideoEditor,
        item.picTalent,
        item.picVideographer,
      ].filter(Boolean)
      const hasTeamMember = filter.team.some((member) => itemTeam.includes(member))
      if (!hasTeamMember) return false
    }

    // Date range filter
    if (filter.dateRange) {
      const [startDate, endDate] = filter.dateRange
      const itemDate = item.date
      if (itemDate < startDate || itemDate > endDate) return false
    }

    // Engagement range filter
    if (filter.engagementRange) {
      const [minEngagement, maxEngagement] = filter.engagementRange
      const engagement = item.likes + item.comments + item.shares + item.saves
      if (engagement < minEngagement || engagement > maxEngagement) return false
    }

    return true
  })
}

export function getFilteredStats(
  items: ContentItem[],
  filter: SearchFilter
): Record<string, number> {
  const filtered = filterContent(items, filter)
  const statuses: Record<string, number> = {}

  filtered.forEach((item) => {
    statuses[item.status] = (statuses[item.status] || 0) + 1
  })

  return statuses
}

export const SEARCH_PRESETS = [
  {
    name: 'In Review',
    filter: {
      query: '',
      statuses: ['Review'],
      platforms: [],
      formats: [],
      pillars: [],
      team: [],
    } as SearchFilter,
  },
  {
    name: 'This Week',
    filter: {
      query: '',
      statuses: [],
      platforms: [],
      formats: [],
      pillars: [],
      team: [],
      dateRange: [getStartOfWeek(), getEndOfWeek()] as [string, string],
    } as SearchFilter,
  },
  {
    name: 'High Engagement',
    filter: {
      query: '',
      statuses: [],
      platforms: [],
      formats: [],
      pillars: [],
      team: [],
      engagementRange: [100, Infinity],
    } as SearchFilter,
  },
  {
    name: 'Scheduled',
    filter: {
      query: '',
      statuses: ['Terjadwal'],
      platforms: [],
      formats: [],
      pillars: [],
      team: [],
    } as SearchFilter,
  },
]

function getStartOfWeek(): string {
  const now = new Date()
  const first = now.getDate() - now.getDay()
  const start = new Date(now.setDate(first))
  return start.toISOString().split('T')[0]
}

function getEndOfWeek(): string {
  const now = new Date()
  const first = now.getDate() - now.getDay()
  const end = new Date(now.setDate(first + 6))
  return end.toISOString().split('T')[0]
}
