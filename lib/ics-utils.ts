import type { ContentItem } from './types'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

// Format tanggal 'YYYY-MM-DD' jadi all-day date iCal 'YYYYMMDD'
function toICSDate(dateStr: string): string {
  return dateStr.replaceAll('-', '')
}

// Timestamp sekarang buat DTSTAMP / UID, format YYYYMMDDTHHmmssZ
function nowStamp(): string {
  const d = new Date()
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  )
}

// Escape karakter khusus sesuai spesifikasi iCalendar (RFC 5545)
function escapeICS(text: string): string {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

// Line folding: baris iCal gak boleh lebih dari 75 oktet
function foldLine(line: string): string {
  if (line.length <= 75) return line
  let result = ''
  let rest = line
  while (rest.length > 75) {
    result += rest.slice(0, 75) + '\r\n '
    rest = rest.slice(75)
  }
  return result + rest
}

interface ICSExportOptions {
  calendarName?: string
  // Pakai shootDate (jadwal take content) sekaligus, bukan cuma tanggal publish
  includeShootDate?: boolean
}

export function generateICS(items: ContentItem[], options: ICSExportOptions = {}): string {
  const { calendarName = 'Sinilah Openspace - Content Calendar', includeShootDate = true } = options

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Openspace Homeless Media//Content Command Center//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(calendarName)}`,
    'X-WR-TIMEZONE:Asia/Jakarta',
  ]

  items.forEach((item) => {
    if (item.deadline) {
      const summary = `[Deadline] ${item.title || '(tanpa judul)'}`
      const descParts = [
        `Format: ${item.format}${item.subformat ? ' - ' + item.subformat : ''}`,
        item.pillar ? `Pilar: ${item.pillar}` : '',
        item.pic ? `PIC: ${item.pic}` : '',
        'Deadline produksi — bukan tanggal publish.',
      ].filter(Boolean)

      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.id}-deadline@openspace-content`,
        `DTSTAMP:${nowStamp()}`,
        `DTSTART;VALUE=DATE:${toICSDate(item.deadline)}`,
        `SUMMARY:${escapeICS(summary)}`,
        `DESCRIPTION:${escapeICS(descParts.join('\\n'))}`,
        'END:VEVENT'
      )
    }

    if (item.date) {
      const summary = `[${item.status}] ${item.title || '(tanpa judul)'}`
      const descParts = [
        `Format: ${item.format}${item.subformat ? ' - ' + item.subformat : ''}`,
        item.pillar ? `Pilar: ${item.pillar}` : '',
        `Platform: ${item.platform}`,
        item.pic ? `PIC: ${item.pic}` : '',
      ].filter(Boolean)

      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.id}-publish@openspace-content`,
        `DTSTAMP:${nowStamp()}`,
        `DTSTART;VALUE=DATE:${toICSDate(item.date)}`,
        `SUMMARY:${escapeICS(summary)}`,
        `DESCRIPTION:${escapeICS(descParts.join('\\n'))}`,
        'END:VEVENT'
      )
    }

    if (includeShootDate && item.shootDate) {
      const summary = `[Take Content] ${item.title || '(tanpa judul)'}`
      const descParts = [
        item.shootLocation ? `Lokasi: ${item.shootLocation}` : '',
        item.pic ? `PIC: ${item.pic}` : '',
      ].filter(Boolean)

      lines.push(
        'BEGIN:VEVENT',
        `UID:${item.id}-shoot@openspace-content`,
        `DTSTAMP:${nowStamp()}`,
        `DTSTART;VALUE=DATE:${toICSDate(item.shootDate)}`,
        `SUMMARY:${escapeICS(summary)}`,
        `DESCRIPTION:${escapeICS(descParts.join('\\n'))}`,
        'END:VEVENT'
      )
    }
  })

  lines.push('END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}

export function downloadICS(items: ContentItem[], filename = 'content-calendar.ics') {
  const ics = generateICS(items)
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
