export const STATUSES = ['Ide', 'Draft', 'Review', 'Terjadwal', 'Publish'] as const
export type Status = typeof STATUSES[number]

export const FORMATS = ['Carousel', 'Single Post', 'Reels / TikTok', 'Stories'] as const
export type Format = typeof FORMATS[number]

export const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'Threads', 'X'] as const
export type Platform = typeof PLATFORMS[number]

export const ALL_PLATFORMS = [...PLATFORMS, 'Multi-Platform'] as const
export type AnyPlatform = typeof ALL_PLATFORMS[number]

export const SUBFORMATS: Record<string, string[]> = {
  Carousel: ['Breakdown Rilisan', 'Timeline / History Band', 'Listicle Event', 'Behind The Scene Proses Kreatif'],
  'Single Post': ['Pengumuman Besar', 'Foto Dokumentasi Event', 'Quote / Kutipan Musisi', 'Obituary / Tribute'],
  'Reels / TikTok': ['Cuplikan Lagu + Reaksi', 'Live Moment Event', 'POV/Behind-the-Scene Bergerak', 'Hot Take / Opini Cepat', 'Before You Listen Know This'],
  Stories: ['Polling / Kuis', 'Behind The Scene Cepat', 'Countdown Event', 'Repost Mention', 'Q&A'],
}

export const PILLARS = [
  'Skena Report',
  'Rilisan Baru',
  'Event Coverage',
  'Opini / Hot Take',
  'Behind The Scene',
  'Wawancara / Profil',
]

export const PLATFORM_FORMATS: Record<string, string[]> = {
  Instagram: ['Carousel', 'Single Post', 'Reels / TikTok', 'Stories'],
  TikTok: ['Reels / TikTok'],
  YouTube: ['Reels / TikTok', 'Single Post'],
  Threads: ['Single Post'],
  X: ['Single Post'],
  'Multi-Platform': [...FORMATS],
}

export const PLATFORM_METRICS: Record<string, string[]> = {
  Instagram: ['views', 'likes', 'comments', 'shares', 'saves'],
  TikTok: ['views', 'likes', 'comments', 'shares', 'saves'],
  YouTube: ['views', 'likes', 'comments', 'shares'],
  Threads: ['likes', 'comments', 'shares'],
  X: ['views', 'likes', 'comments', 'shares'],
  'Multi-Platform': ['views', 'likes', 'comments', 'shares', 'saves'],
}

export const METRIC_LABELS: Record<string, { views?: string; shares?: string }> = {
  Instagram: { views: 'Views/Reach', shares: 'Shares' },
  TikTok: { views: 'Views', shares: 'Shares' },
  YouTube: { views: 'Views', shares: 'Shares' },
  X: { views: 'Impressions', shares: 'Reposts' },
  Threads: { shares: 'Reposts' },
}

export const OBJECTIVES = ['Awareness', 'Engagement', 'Conversion'] as const
export type Objective = typeof OBJECTIVES[number]

// Metrics tambahan (di luar views/likes/comments/shares/saves) yang relevan per objective,
// sesuai Social Media Metrics Guideline — biar gak campur metrik antar-objective.
export const OBJECTIVE_METRICS: Record<Objective, string[]> = {
  Awareness: ['reach', 'impressions', 'brandMentions'],
  Engagement: [],
  Conversion: ['clicks', 'leads'],
}

export const OBJECTIVE_METRIC_LABELS: Record<string, string> = {
  reach: 'Reach (jangkauan)',
  impressions: 'Impressions (tayangan)',
  brandMentions: 'Brand Mentions',
  clicks: 'Click-throughs',
  leads: 'Leads Generated',
}

export const FORMAT_COLORS: Record<string, string> = {
  Carousel: '#ff00ae',
  'Single Post': '#0036ff',
  'Reels / TikTok': '#c1ff1a',
  Stories: '#ff8c1a',
}

export const TEAM_ROLES = [
  'Social Media Manager',
  'Content Writer',
  'Graphic Designer',
  'Video Editor',
  'Videografer',
  'Fotografer',
  'Talent / Presenter',
  'Creative Director',
  'Marketing',
  'Admin',
] as const

export const STORAGE_KEY = 'ccc-items'
export const ACCOUNTS_KEY = 'ccc-accounts'
export const TEAM_KEY = 'ccc-team'
