import type { Comment, Activity } from './types'

export function createComment(
  contentId: string,
  authorId: string,
  text: string,
  threadId?: string
): Comment {
  return {
    id: crypto.getRandomValues(new Uint8Array(16)).join(''),
    contentId,
    authorId,
    text,
    createdAt: Date.now(),
    threadId,
  }
}

export function createActivity(
  type: Activity['type'],
  contentId: string,
  actorId: string,
  field?: string,
  oldValue?: string,
  newValue?: string
): Activity {
  return {
    id: crypto.getRandomValues(new Uint8Array(16)).join(''),
    type,
    contentId,
    actorId,
    field,
    oldValue,
    newValue,
    createdAt: Date.now(),
  }
}

export function getContentComments(
  comments: Comment[],
  contentId: string,
  threadId?: string
): Comment[] {
  return comments.filter(
    (c) => c.contentId === contentId && (threadId ? c.threadId === threadId : !c.threadId)
  )
}

export function getContentActivity(
  activity: Activity[],
  contentId: string
): Activity[] {
  return activity.filter((a) => a.contentId === contentId).sort((a, b) => b.createdAt - a.createdAt)
}

export function getActivitySummary(activities: Activity[], contentId: string): string {
  const contentActivities = getContentActivity(activities, contentId)
  if (contentActivities.length === 0) return 'No activity'

  const grouped = contentActivities.reduce(
    (acc, activity) => {
      const key = `${activity.actorId}-${activity.type}`
      if (!acc[key]) acc[key] = 0
      acc[key]++
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(grouped)
    .slice(0, 3)
    .map(([key, count]) => {
      const [actor, type] = key.split('-')
      const typeLabel =
        {
          created: 'created',
          updated: 'updated',
          status_changed: 'changed status',
          commented: 'commented',
        }[type] || type
      return `${actor} ${typeLabel}`
    })
    .join(', ')
}

export function formatActivityTime(createdAt: number): string {
  const now = Date.now()
  const diff = now - createdAt
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`

  const date = new Date(createdAt)
  return date.toLocaleDateString('id-ID', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  })
}

export function getMentions(text: string): string[] {
  const matches = text.match(/@([a-zA-Z\s]+)/g) || []
  return matches.map((m) => m.slice(1).trim())
}

export const REACTION_EMOJIS = ['✓', '✗', '❤️', '👀']
