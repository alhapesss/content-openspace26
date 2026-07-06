import { create } from 'zustand'
import { supabase } from './supabase'
import {
  contentToRow, rowToContent,
  accountsMapToRows, rowsToAccountsMap,
  teamToRow, rowToTeam,
  notificationToRow, rowToNotification,
  reminderToRow, rowToReminder,
  commentToRow, rowToComment,
  activityToRow, rowToActivity,
  reportToRow, rowToReport,
} from './supabase-map'
import type {
  ContentItem,
  AccountsMap,
  TeamMember,
  Notification,
  Reminder,
  Comment,
  Activity,
  Report,
  SearchFilter,
} from './types'

interface ContentStore {
  items: ContentItem[]
  accounts: AccountsMap
  team: TeamMember[]
  notifications: Notification[]
  reminders: Reminder[]
  comments: Comment[]
  activity: Activity[]
  reports: Report[]
  currentFilter: SearchFilter
  hydrated: boolean

  hydrate: () => Promise<void>
  subscribeRealtime: () => () => void

  setItems: (items: ContentItem[]) => Promise<void>
  addItem: (item: ContentItem) => Promise<void>
  updateItem: (id: string, data: Partial<ContentItem>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  resetItems: () => Promise<void>
  setAccounts: (accounts: AccountsMap) => Promise<void>
  setTeam: (team: TeamMember[]) => Promise<void>
  addNotification: (notification: Notification) => Promise<void>
  markNotificationAsRead: (id: string) => Promise<void>
  deleteNotification: (id: string) => Promise<void>
  clearNotifications: () => Promise<void>
  setReminders: (reminders: Reminder[]) => Promise<void>
  addComment: (comment: Comment) => Promise<void>
  deleteComment: (id: string) => Promise<void>
  addActivity: (activity: Activity) => Promise<void>
  addReport: (report: Report) => Promise<void>
  updateReport: (id: string, data: Partial<Report>) => Promise<void>
  deleteReport: (id: string) => Promise<void>
  setCurrentFilter: (filter: SearchFilter) => void
}

// ponytail: gak pake zustand/persist lagi. Source of truth = Supabase.
// currentFilter tetap lokal doang (state UI, gak perlu di-share antar device).
export const useContentStore = create<ContentStore>()((set, get) => ({
  items: [],
  accounts: {},
  team: [],
  notifications: [],
  reminders: [],
  comments: [],
  activity: [],
  reports: [],
  currentFilter: {
    query: '',
    statuses: [],
    platforms: [],
    formats: [],
    pillars: [],
    team: [],
  },
  hydrated: false,

  hydrate: async () => {
    const [itemsRes, accountsRes, teamRes, notifRes, remindersRes, commentsRes, activityRes, reportsRes] =
      await Promise.all([
        supabase.from('content_items').select('*').order('created_at', { ascending: true }),
        supabase.from('accounts').select('*'),
        supabase.from('team_members').select('*'),
        supabase.from('notifications').select('*').order('created_at', { ascending: true }),
        supabase.from('reminders').select('*'),
        supabase.from('comments').select('*').order('created_at', { ascending: true }),
        supabase.from('activity').select('*').order('created_at', { ascending: true }),
        supabase.from('reports').select('*'),
      ])

    for (const [label, res] of [
      ['items', itemsRes], ['accounts', accountsRes], ['team', teamRes], ['notifications', notifRes],
      ['reminders', remindersRes], ['comments', commentsRes], ['activity', activityRes], ['reports', reportsRes],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ] as [string, any][]) {
      if (res.error) console.error(`[supabase] hydrate ${label}`, res.error)
    }

    set({
      items: (itemsRes.data ?? []).map(rowToContent),
      accounts: rowsToAccountsMap(accountsRes.data ?? []),
      team: (teamRes.data ?? []).map(rowToTeam),
      notifications: (notifRes.data ?? []).map(rowToNotification),
      reminders: (remindersRes.data ?? []).map(rowToReminder),
      comments: (commentsRes.data ?? []).map(rowToComment),
      activity: (activityRes.data ?? []).map(rowToActivity),
      reports: (reportsRes.data ?? []).map(rowToReport),
      hydrated: true,
    })
  },

  // Panggil sekali di root (lewat hook use-supabase-sync). Return unsubscribe.
  subscribeRealtime: () => {
    const channel = supabase
      .channel('content-command-center-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'content_items' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') return { items: state.items.filter((i) => i.id !== payload.old.id) }
          const row = rowToContent(payload.new)
          const exists = state.items.some((i) => i.id === row.id)
          return { items: exists ? state.items.map((i) => (i.id === row.id ? row : i)) : [...state.items, row] }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') {
            const next = { ...state.accounts }
            delete next[payload.old.platform]
            return { accounts: next }
          }
          const p = payload.new.platform
          return {
            accounts: {
              ...state.accounts,
              [p]: { followers: payload.new.followers ?? 0, following: payload.new.following ?? 0, history: payload.new.history ?? [] },
            },
          }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') return { team: state.team.filter((t) => t.id !== payload.old.id) }
          const row = rowToTeam(payload.new)
          const exists = state.team.some((t) => t.id === row.id)
          return { team: exists ? state.team.map((t) => (t.id === row.id ? row : t)) : [...state.team, row] }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') return { notifications: state.notifications.filter((n) => n.id !== payload.old.id) }
          const row = rowToNotification(payload.new)
          const exists = state.notifications.some((n) => n.id === row.id)
          return { notifications: exists ? state.notifications.map((n) => (n.id === row.id ? row : n)) : [...state.notifications, row] }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') return { reminders: state.reminders.filter((r) => r.id !== payload.old.id) }
          const row = rowToReminder(payload.new)
          const exists = state.reminders.some((r) => r.id === row.id)
          return { reminders: exists ? state.reminders.map((r) => (r.id === row.id ? row : r)) : [...state.reminders, row] }
        })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          set((state) => ({ comments: state.comments.filter((c) => c.id !== payload.old.id) }))
          return
        }
        const row = rowToComment(payload.new)
        set((state) => (state.comments.some((c) => c.id === row.id) ? state : { comments: [...state.comments, row] }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, (payload) => {
        if (payload.eventType === 'DELETE') return
        const row = rowToActivity(payload.new)
        set((state) => (state.activity.some((a) => a.id === row.id) ? state : { activity: [...state.activity, row] }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (payload) => {
        set((state) => {
          if (payload.eventType === 'DELETE') return { reports: state.reports.filter((r) => r.id !== payload.old.id) }
          const row = rowToReport(payload.new)
          const exists = state.reports.some((r) => r.id === row.id)
          return { reports: exists ? state.reports.map((r) => (r.id === row.id ? row : r)) : [...state.reports, row] }
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },

  setItems: async (items) => {
    set({ items })
    const { error } = await supabase.from('content_items').upsert(items.map(contentToRow))
    if (error) console.error('[supabase] setItems', error)
  },

  addItem: async (item) => {
    set((s) => ({ items: [...s.items, item] }))
    const { error } = await supabase.from('content_items').insert(contentToRow(item))
    if (error) console.error('[supabase] addItem', error)
  },

  updateItem: async (id, data) => {
    set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)) }))
    const merged = get().items.find((i) => i.id === id)
    if (!merged) return
    const { error } = await supabase.from('content_items').update(contentToRow(merged)).eq('id', id)
    if (error) console.error('[supabase] updateItem', error)
  },

  deleteItem: async (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }))
    const { error } = await supabase.from('content_items').delete().eq('id', id)
    if (error) console.error('[supabase] deleteItem', error)
  },

  resetItems: async () => {
    const ids = get().items.map((i) => i.id)
    set({ items: [] })
    if (ids.length) {
      const { error } = await supabase.from('content_items').delete().in('id', ids)
      if (error) console.error('[supabase] resetItems', error)
    }
  },

  setAccounts: async (accounts) => {
    set({ accounts })
    const rows = accountsMapToRows(accounts)
    if (rows.length) {
      const { error } = await supabase.from('accounts').upsert(rows)
      if (error) console.error('[supabase] setAccounts', error)
    }
  },

  setTeam: async (team) => {
    const withIds = team.map((t) => ({ ...t, id: t.id ?? crypto.randomUUID() }))
    const prevIds = get().team.map((t) => t.id).filter(Boolean) as string[]
    const nextIds = withIds.map((t) => t.id) as string[]
    const removedIds = prevIds.filter((id) => !nextIds.includes(id))

    set({ team: withIds })

    if (removedIds.length) {
      const { error } = await supabase.from('team_members').delete().in('id', removedIds)
      if (error) console.error('[supabase] setTeam delete', error)
    }
    const { error } = await supabase
      .from('team_members')
      .upsert(withIds.map((t) => teamToRow(t as TeamMember & { id: string })))
    if (error) console.error('[supabase] setTeam upsert', error)
  },

  addNotification: async (notification) => {
    set((s) => ({ notifications: [...s.notifications, notification] }))
    const { error } = await supabase.from('notifications').insert(notificationToRow(notification))
    if (error) console.error('[supabase] addNotification', error)
  },

  markNotificationAsRead: async (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
    const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    if (error) console.error('[supabase] markNotificationAsRead', error)
  },

  deleteNotification: async (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }))
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) console.error('[supabase] deleteNotification', error)
  },

  clearNotifications: async () => {
    const ids = get().notifications.map((n) => n.id)
    set({ notifications: [] })
    if (ids.length) {
      const { error } = await supabase.from('notifications').delete().in('id', ids)
      if (error) console.error('[supabase] clearNotifications', error)
    }
  },

  setReminders: async (reminders) => {
    set({ reminders })
    if (reminders.length) {
      const { error } = await supabase.from('reminders').upsert(reminders.map(reminderToRow))
      if (error) console.error('[supabase] setReminders', error)
    }
  },

  addComment: async (comment) => {
    set((s) => ({ comments: [...s.comments, comment] }))
    const { error } = await supabase.from('comments').insert(commentToRow(comment))
    if (error) console.error('[supabase] addComment', error)
  },

  deleteComment: async (id) => {
    set((s) => ({ comments: s.comments.filter((c) => c.id !== id) }))
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) console.error('[supabase] deleteComment', error)
  },

  addActivity: async (activity) => {
    set((s) => ({ activity: [...s.activity, activity] }))
    const { error } = await supabase.from('activity').insert(activityToRow(activity))
    if (error) console.error('[supabase] addActivity', error)
  },

  addReport: async (report) => {
    set((s) => ({ reports: [...s.reports, report] }))
    const { error } = await supabase.from('reports').insert(reportToRow(report))
    if (error) console.error('[supabase] addReport', error)
  },

  updateReport: async (id, data) => {
    set((s) => ({ reports: s.reports.map((r) => (r.id === id ? { ...r, ...data } : r)) }))
    const merged = get().reports.find((r) => r.id === id)
    if (!merged) return
    const { error } = await supabase.from('reports').update(reportToRow(merged)).eq('id', id)
    if (error) console.error('[supabase] updateReport', error)
  },

  deleteReport: async (id) => {
    set((s) => ({ reports: s.reports.filter((r) => r.id !== id) }))
    const { error } = await supabase.from('reports').delete().eq('id', id)
    if (error) console.error('[supabase] deleteReport', error)
  },

  setCurrentFilter: (filter) => set({ currentFilter: filter }),
}))
