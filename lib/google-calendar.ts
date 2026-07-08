'use client'

import type { ContentItem } from './types'

// Client ID publik (bukan secret) — dari Google Cloud Console > Credentials > OAuth Client ID (Web application)
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const TOKEN_STORAGE_KEY = 'gcal_access_token'
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const google: any

let gisLoaded = false
let gisLoadPromise: Promise<void> | null = null

// Muat script Google Identity Services sekali aja
export function loadGIS(): Promise<void> {
  if (gisLoaded) return Promise.resolve()
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('window unavailable'))
    if (document.getElementById('gis-script')) {
      gisLoaded = true
      return resolve()
    }
    const script = document.createElement('script')
    script.id = 'gis-script'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      gisLoaded = true
      resolve()
    }
    script.onerror = () => reject(new Error('Gagal load Google Identity Services'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem(TOKEN_STORAGE_KEY)
  const expiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY) || 0)
  if (!token || Date.now() > expiry) return null
  return token
}

function storeToken(token: string, expiresInSec: number) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
  localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSec * 1000 - 60_000))
}

export function isGoogleCalendarConnected(): boolean {
  return !!getStoredToken()
}

export function disconnectGoogleCalendar() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(TOKEN_EXPIRY_KEY)
}

// Minta access token baru lewat popup consent Google (atau silent kalau udah pernah izinin)
export function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID) {
      reject(new Error('NEXT_PUBLIC_GOOGLE_CLIENT_ID belum di-set di .env.local'))
      return
    }
    loadGIS()
      .then(() => {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPE,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: (resp: any) => {
            if (resp.error) {
              reject(new Error(resp.error))
              return
            }
            storeToken(resp.access_token, resp.expires_in ?? 3600)
            resolve(resp.access_token)
          },
        })
        tokenClient.requestAccessToken({ prompt: getStoredToken() ? '' : 'consent' })
      })
      .catch(reject)
  })
}

// Ambil token valid: pakai yang di storage kalau masih hidup, kalau enggak minta ulang
async function getValidToken(): Promise<string> {
  const existing = getStoredToken()
  if (existing) return existing
  return requestGoogleAccessToken()
}

function eventPayloadFromItem(item: ContentItem, allDay = true) {
  const description = [
    `Format: ${item.format}${item.subformat ? ' - ' + item.subformat : ''}`,
    item.pillar ? `Pilar: ${item.pillar}` : '',
    `Platform: ${item.platform}`,
    item.pic ? `PIC: ${item.pic}` : '',
    item.status ? `Status: ${item.status}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    summary: `[${item.status}] ${item.title || '(tanpa judul)'}`,
    description,
    start: { date: item.date },
    end: { date: item.date },
  }
}

async function apiFetch(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google Calendar API error ${res.status}: ${body}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export interface SyncResult {
  synced: number
  failed: number
  errors: string[]
}

// Sync semua item yang punya tanggal ke Google Calendar (primary).
// Item yang udah punya googleEventId di-update, yang belum dibikin baru.
// onItemSynced dipanggil tiap item berhasil, buat nyimpen googleEventId balik ke store.
export async function syncItemsToGoogleCalendar(
  items: ContentItem[],
  onItemSynced: (itemId: string, googleEventId: string) => void
): Promise<SyncResult> {
  const token = await getValidToken()
  const result: SyncResult = { synced: 0, failed: 0, errors: [] }

  const withDate = items.filter((i) => !!i.date)

  for (const item of withDate) {
    try {
      const payload = eventPayloadFromItem(item)
      if (item.googleEventId) {
        await apiFetch(`/calendars/primary/events/${item.googleEventId}`, token, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
        result.synced++
      } else {
        const created = await apiFetch('/calendars/primary/events', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        onItemSynced(item.id, created.id)
        result.synced++
      }
    } catch (err) {
      result.failed++
      result.errors.push(`${item.title || item.id}: ${(err as Error).message}`)
    }
  }

  return result
}

export async function deleteGoogleCalendarEvent(googleEventId: string): Promise<void> {
  const token = await getValidToken()
  await apiFetch(`/calendars/primary/events/${googleEventId}`, token, { method: 'DELETE' })
}
