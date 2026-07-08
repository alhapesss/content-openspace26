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

/**
 * Parser CSV manual (bukan lewat lib xlsx) — soalnya xlsx suka nebak tipe kolom
 * "Publish time" jadi angka/tanggal Excel, bikin teks tanggal aslinya rusak.
 * Ini nangani quoted field yang isinya koma/newline (caption Instagram sering gitu).
 */
function parseCsvText(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  const src = text.replace(/^\uFEFF/, '') // buang BOM kalau ada

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field); field = ''
    } else if (c === '\r') {
      // skip, ditangani bareng \n
    } else if (c === '\n') {
      row.push(field); field = ''
      rows.push(row); row = []
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

export function parseMetaCsv(fileText: string): MetaRow[] {
  const rows = parseCsvText(fileText)
  if (rows.length < 2) return []
  const header = rows[0].map((h) => h.trim())
  const idx = (name: string) => header.indexOf(name)

  const col = {
    postId: idx('Post ID'),
    account: idx('Account username'),
    description: idx('Description'),
    publishTime: idx('Publish time'),
    permalink: idx('Permalink'),
    postType: idx('Post type'),
    views: idx('Views'),
    reach: idx('Reach'),
    likes: idx('Likes'),
    shares: idx('Shares'),
    comments: idx('Comments'),
    saves: idx('Saves'),
  }

  return rows
    .slice(1)
    .filter((r) => (col.postId >= 0 ? r[col.postId]?.trim() : ''))
    .map((r) => ({
      postId: r[col.postId] || '',
      accountUsername: r[col.account] || '',
      description: r[col.description] || '',
      publishTime: r[col.publishTime] || '',
      permalink: r[col.permalink] || '',
      postType: r[col.postType] || '',
      views: num(r[col.views]),
      reach: num(r[col.reach]),
      likes: num(r[col.likes]),
      shares: num(r[col.shares]),
      comments: num(r[col.comments]),
      saves: num(r[col.saves]),
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
