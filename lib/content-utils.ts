import type { ContentItem } from './types'

export function uid(): string {
  return 'c' + Date.now() + Math.random().toString(36).slice(2, 7)
}

export function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function tomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function engagementOf(i: ContentItem): number {
  return (i.likes || 0) + (i.comments || 0) + (i.shares || 0) + (i.saves || 0)
}

export function engagementRateOf(i: ContentItem): number {
  const v = Number(i.views) || 0
  return v > 0 ? (engagementOf(i) / v) * 100 : 0
}

export function assetList(i: ContentItem): string[] {
  return (i.assets || '').split('\n').map((s) => s.trim()).filter(Boolean)
}

export function crewLine(i: ContentItem): string {
  const parts: string[] = []
  if (i.picGraphic) parts.push(`GD: ${i.picGraphic}`)
  if (i.picVideoEditor) parts.push(`VE: ${i.picVideoEditor}`)
  if (i.picTalent) parts.push(`Talent: ${i.picTalent}`)
  if (i.picVideographer) parts.push(`Cam: ${i.picVideographer}`)
  return parts.join(' · ')
}

export function matchesSearch(i: ContentItem, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return [
    i.title,
    i.pic,
    i.picGraphic,
    i.picVideoEditor,
    i.picTalent,
    i.picVideographer,
    i.subformat,
    i.pillar,
    i.notes,
    i.caption,
    i.briefPosting,
  ].some((v) => (v || '').toLowerCase().includes(q))
}

export function blankItem(): Omit<ContentItem, 'id' | 'createdAt'> {
  return {
    title: '',
    format: 'Carousel',
    subformat: '',
    pillar: '',
    status: 'Ide',
    date: todayStr(),
    deadline: '',
    shootDate: '',
    shootLocation: '',
    pic: '',
    picGraphic: '',
    picVideoEditor: '',
    picTalent: '',
    picVideographer: '',
    platform: 'Instagram',
    script: '',
    scripts: [],
    assets: '',
    caption: '',
    notes: '',
    driveLink: '',
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    objective: 'Engagement',
    reach: 0,
    impressions: 0,
    brandMentions: 0,
    clicks: 0,
    leads: 0,
  }
}

export function toExportRows(list: ContentItem[]) {
  return list.map((i) => ({
    Judul: i.title,
    Format: i.format,
    'Sub-Format': i.subformat,
    'Pilar Konten': i.pillar,
    Status: i.status,
    'Tanggal Deadline': i.deadline || '',
    'Tanggal Publish': i.date,
    'Jadwal Take Content': i.shootDate,
    'Lokasi Take Content': i.shootLocation,
    PIC: i.pic,
    'PIC Graphic Design': i.picGraphic,
    'PIC Video Editor': i.picVideoEditor,
    Talent: i.picTalent,
    Videographer: i.picVideographer,
    Platform: i.platform,
    Views: i.views || 0,
    Likes: i.likes || 0,
    Comments: i.comments || 0,
    Shares: i.shares || 0,
    Saves: i.saves || 0,
    Engagement: engagementOf(i),
    'Engagement Rate (%)': Number(engagementRateOf(i).toFixed(2)),
    Script: i.script,
    'Link Aset': i.assets,
    'Brief Posting': i.briefPosting,
    Caption: i.caption,
    Catatan: i.notes,
  }))
}
