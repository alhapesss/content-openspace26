import type { ContentItem, TeamMember, Notification } from './types'

/**
 * Normalisasi nomor HP Indonesia ke format internasional tanpa simbol,
 * biar cocok dipakai di link wa.me (wa.me/62xxxxxxxxxx).
 * '08123456789' -> '628123456789'
 * '+62 812-3456-789' -> '628123456789'
 * '62812...' -> '62812...' (dibiarkan)
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return null
  if (digits.startsWith('0')) return `62${digits.slice(1)}`
  if (digits.startsWith('62')) return digits
  return `62${digits}` // asumsi nomor lokal tanpa 0 di depan
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone)
  if (!normalized) return null
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

/**
 * Cari nama-nama yang terlibat di satu ContentItem (semua slot PIC),
 * dedupe, buang yang kosong.
 */
export function getInvolvedNames(item: ContentItem): string[] {
  const names = [item.pic, item.picGraphic, item.picVideoEditor, item.picTalent, item.picVideographer]
  return Array.from(new Set(names.map((n) => n?.trim()).filter((n): n is string => !!n)))
}

/**
 * Dari daftar nama, cocokkan ke data tim buat ambil nomor WA-nya.
 * Nama yang gak ketemu di tim (atau belum punya nomor) otomatis kelewat.
 */
export function getInvolvedTeamMembers(names: string[], team: TeamMember[]): TeamMember[] {
  return names
    .map((name) => team.find((m) => m.name === name))
    .filter((m): m is TeamMember => !!m && !!m.phone)
}

/** Susun pesan WA default dari isi notifikasi + judul konten */
export function buildNotificationMessage(notification: Notification, item?: ContentItem): string {
  const lines = [notification.title, notification.message]
  if (item) lines.push(`Konten: ${item.title}`)
  return lines.filter(Boolean).join('\n')
}
