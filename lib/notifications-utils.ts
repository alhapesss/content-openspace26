import type { ContentItem, Notification, Reminder } from './types'

export function createNotification(
  type: Notification['type'],
  title: string,
  message: string,
  contentId?: string,
  targetDate?: string
): Notification {
  return {
    id: crypto.getRandomValues(new Uint8Array(16)).join(''),
    type,
    title,
    message,
    contentId,
    read: false,
    createdAt: Date.now(),
    targetDate,
  }
}

export function checkDuelineNotifications(
  items: ContentItem[],
  reminders: Reminder[]
): Notification[] {
  const notifications: Notification[] = []
  const today = new Date().toISOString().split('T')[0]

  reminders.forEach((reminder) => {
    if (!reminder.enabled) return

    const item = items.find((i) => i.id === reminder.contentId)
    if (!item || !item.date) return

    const daysUntilDue = Math.floor(
      (new Date(item.date).getTime() - new Date(today).getTime()) /
        (1000 * 60 * 60 * 24)
    )

    // Create notification if deadline matches reminder setting
    if (daysUntilDue === reminder.daysBeforeDeadline) {
      const message =
        daysUntilDue === 0
          ? 'Content is due today!'
          : daysUntilDue === 1
            ? 'Content is due tomorrow'
            : `Content is due in ${daysUntilDue} days`

      notifications.push(
        createNotification('deadline', 'Deadline Reminder', message, item.id, item.date)
      )
    }
  })

  return notifications
}

export function createStatusChangeNotification(
  item: ContentItem,
  oldStatus: string,
  newStatus: string,
  actorName: string
): Notification {
  return createNotification(
    'status_change',
    `Status Updated: ${item.title}`,
    `${actorName} changed status from "${oldStatus}" to "${newStatus}"`,
    item.id
  )
}

export function formatNotificationTime(createdAt: number): string {
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

export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.read).length
}
