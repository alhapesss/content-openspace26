import type {
  ContentItem, AccountsMap, TeamMember, Notification, Reminder, Comment, Activity, Report,
} from './types'

// ---- ContentItem ----
export function contentToRow(c: ContentItem) {
  return {
    id: c.id,
    title: c.title,
    format: c.format,
    subformat: c.subformat,
    pillar: c.pillar,
    status: c.status,
    date: c.date,
    shoot_date: c.shootDate,
    shoot_location: c.shootLocation,
    pic: c.pic,
    pic_graphic: c.picGraphic,
    pic_video_editor: c.picVideoEditor,
    pic_talent: c.picTalent,
    pic_videographer: c.picVideographer,
    platform: c.platform,
    script: c.script,
    scripts: c.scripts ?? [],
    assets: c.assets,
    drive_link: c.driveLink ?? null,
    brief_posting: c.briefPosting ?? null,
    caption: c.caption,
    notes: c.notes,
    views: c.views,
    likes: c.likes,
    comments: c.comments,
    shares: c.shares,
    saves: c.saves,
    created_at: c.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToContent(r: any): ContentItem {
  return {
    id: r.id,
    title: r.title,
    format: r.format ?? '',
    subformat: r.subformat ?? '',
    pillar: r.pillar ?? '',
    status: r.status,
    date: r.date ?? '',
    shootDate: r.shoot_date ?? '',
    shootLocation: r.shoot_location ?? '',
    pic: r.pic ?? '',
    picGraphic: r.pic_graphic ?? '',
    picVideoEditor: r.pic_video_editor ?? '',
    picTalent: r.pic_talent ?? '',
    picVideographer: r.pic_videographer ?? '',
    platform: r.platform ?? '',
    script: r.script ?? '',
    scripts: r.scripts ?? undefined,
    assets: r.assets ?? '',
    driveLink: r.drive_link ?? undefined,
    briefPosting: r.brief_posting ?? undefined,
    caption: r.caption ?? '',
    notes: r.notes ?? '',
    views: r.views ?? 0,
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    shares: r.shares ?? 0,
    saves: r.saves ?? 0,
    createdAt: r.created_at,
  }
}

// ---- Accounts (keyed by platform name) ----
export function accountsMapToRows(accounts: AccountsMap) {
  return Object.entries(accounts).map(([platform, data]) => ({
    platform,
    followers: data.followers,
    following: data.following,
    history: data.history ?? [],
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowsToAccountsMap(rows: any[]): AccountsMap {
  const map: AccountsMap = {}
  for (const r of rows) {
    map[r.platform] = { followers: r.followers ?? 0, following: r.following ?? 0, history: r.history ?? [] }
  }
  return map
}

// ---- Team ----
export function teamToRow(t: TeamMember & { id: string }) {
  return { id: t.id, name: t.name, role: t.role, phone: t.phone ?? null }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToTeam(r: any): TeamMember & { id: string } {
  return { id: r.id, name: r.name, role: r.role ?? '', phone: r.phone ?? undefined }
}

// ---- Notifications ----
export function notificationToRow(n: Notification) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    content_id: n.contentId ?? null,
    read: n.read,
    created_at: n.createdAt,
    target_date: n.targetDate ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToNotification(r: any): Notification {
  return {
    id: r.id,
    type: r.type,
    title: r.title,
    message: r.message,
    contentId: r.content_id ?? undefined,
    read: r.read,
    createdAt: r.created_at,
    targetDate: r.target_date ?? undefined,
  }
}

// ---- Reminders ----
export function reminderToRow(r: Reminder) {
  return { id: r.id, content_id: r.contentId, days_before_deadline: r.daysBeforeDeadline, enabled: r.enabled }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToReminder(r: any): Reminder {
  return { id: r.id, contentId: r.content_id, daysBeforeDeadline: r.days_before_deadline, enabled: r.enabled }
}

// ---- Comments ----
export function commentToRow(c: Comment) {
  return {
    id: c.id,
    content_id: c.contentId,
    author_id: c.authorId,
    text: c.text,
    created_at: c.createdAt,
    thread_id: c.threadId ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToComment(r: any): Comment {
  return {
    id: r.id,
    contentId: r.content_id,
    authorId: r.author_id,
    text: r.text,
    createdAt: r.created_at,
    threadId: r.thread_id ?? undefined,
  }
}

// ---- Activity ----
export function activityToRow(a: Activity) {
  return {
    id: a.id,
    type: a.type,
    content_id: a.contentId,
    actor_id: a.actorId,
    field: a.field ?? null,
    old_value: a.oldValue ?? null,
    new_value: a.newValue ?? null,
    created_at: a.createdAt,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToActivity(r: any): Activity {
  return {
    id: r.id,
    type: r.type,
    contentId: r.content_id,
    actorId: r.actor_id,
    field: r.field ?? undefined,
    oldValue: r.old_value ?? undefined,
    newValue: r.new_value ?? undefined,
    createdAt: r.created_at,
  }
}

// ---- Reports ----
export function reportToRow(r: Report) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    date_range: r.dateRange,
    filters: r.filters,
    metrics: r.metrics,
    created_at: r.createdAt,
    last_modified: r.lastModified,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToReport(r: any): Report {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    dateRange: r.date_range,
    filters: r.filters,
    metrics: r.metrics,
    createdAt: r.created_at,
    lastModified: r.last_modified,
  }
}
