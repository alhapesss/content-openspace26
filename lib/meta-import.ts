import * as XLSX from 'xlsx'
import type { ContentItem } from './types'

// Kolom yang keluar dari export Meta Business Suite (Insights > Export)
export interface MetaRow {
  postId: string
  accountUsername: string
  description: string
  publishTime: string // "06/09/2026 06:08"
  permalink: string
  postType: string // "IG reel" | "IG carousel" | "IG image" | dst
  views: number
  reach: number
  likes: number
  shares: number
  comments: number
  saves: number
}

const POST_TYPE_TO_FORMAT: Record<string, string> = {
  'IG reel': 'Reels / TikTok',
  'IG carousel': 'Carousel',
  'IG image': 'Single Post',
  'IG story': 'Stories',
  reel: 'Reels / TikTok',
  carousel: 'Carousel',
  image: 'Single Post',
  story: 'Stories',
}

export function guessFormat(postType: string): string {
  return POST_TYPE_TO_FORMAT[postType.trim()] || 'Single Post'
}

export function guessPlatform(accountUsername: string, postType: string): string {
  if (/tiktok/i.test(postType)) return 'TikTok'
  if (accountUsername) return 'Instagram'
  return 'Instagram'
}

/** Ambil kalimat pertama caption buat jadi judul, biar gak sepanjang captionnya */
export function titleFromDescription(description: string): string {
  const firstLine = description.split('\n').find((l) => l.trim().length > 0) || description
  const clean = firstLine.replace(/["']/g, '').trim()
  return clean.length > 80 ? `${clean.slice(0, 80)}…` : clean || '(tanpa judul)'
}

/** "06/09/2026 06:08" (MM/DD/YYYY dari Meta) -> "2026-06-09" */
export function parseMetaDate(publishTime: string): string {
  const [datePart] = publishTime.trim().split(' ')
  const [mm, dd, yyyy] = (datePart || '').split('/')
  if (!mm || !dd || !yyyy) return ''
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`
}

const num = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function parseMetaCsv(fileText: string): MetaRow[] {
  const wb = XLSX.read(fileText, { type: 'string' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  return raw
    .filter((r) => String(r['Post ID'] || '').trim())
    .map((r) => ({
      postId: String(r['Post ID'] || ''),
      accountUsername: String(r['Account username'] || ''),
      description: String(r['Description'] || ''),
      publishTime: String(r['Publish time'] || ''),
      permalink: String(r['Permalink'] || ''),
      postType: String(r['Post type'] || ''),
      views: num(r['Views']),
      reach: num(r['Reach']),
      likes: num(r['Likes']),
      shares: num(r['Shares']),
      comments: num(r['Comments']),
      saves: num(r['Saves']),
    }))
}

/** Konten yang link permalink-nya udah kepake di item lain dianggap udah pernah diimport */
export function isAlreadyImported(row: MetaRow, existingItems: ContentItem[]): boolean {
  if (!row.permalink) return false
  return existingItems.some((i) => i.driveLink === row.permalink)
}

export function metaRowToContentItem(row: MetaRow): ContentItem {
  return {
    id: crypto.getRandomValues(new Uint8Array(16)).join(''),
    title: titleFromDescription(row.description),
    format: guessFormat(row.postType),
    subformat: '',
    pillar: '',
    status: 'Publish',
    date: parseMetaDate(row.publishTime),
    shootDate: '',
    shootLocation: '',
    pic: '',
    picGraphic: '',
    picVideoEditor: '',
    picTalent: '',
    picVideographer: '',
    platform: guessPlatform(row.accountUsername, row.postType),
    script: '',
    assets: '',
    driveLink: row.permalink, // dipake juga buat cek duplikat pas import ulang
    briefPosting: '',
    caption: row.description,
    notes: `Diimport dari Meta Business (@${row.accountUsername})`,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    saves: row.saves,
    reach: row.reach,
    objective: 'Engagement',
    metricsUpdatedAt: Date.now(),
    createdAt: Date.now(),
  }
}
