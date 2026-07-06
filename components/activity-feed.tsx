'use client'

import { useContentStore } from '@/lib/store'
import { formatActivityTime, getActivitySummary } from '@/lib/collaboration-utils'
import type { Activity } from '@/lib/types'

interface ActivityFeedProps {
  contentId?: string
}

export function ActivityFeed({ contentId }: ActivityFeedProps) {
  const { activity, items } = useContentStore()

  const filteredActivity = contentId
    ? activity.filter((a) => a.contentId === contentId)
    : activity

  const sortedActivity = [...filteredActivity].sort((a, b) => b.createdAt - a.createdAt)

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'created':
        return '✨'
      case 'updated':
        return '✏️'
      case 'status_changed':
        return '📊'
      case 'commented':
        return '💬'
      default:
        return '📌'
    }
  }

  const getActivityLabel = (activity: Activity): string => {
    const { type, field, oldValue, newValue } = activity
    switch (type) {
      case 'created':
        return 'Created this content'
      case 'commented':
        return 'Added a comment'
      case 'status_changed':
        return `Changed status from "${oldValue}" to "${newValue}"`
      case 'updated':
        return `Updated ${field}`
      default:
        return 'Updated'
    }
  }

  if (sortedActivity.length === 0) {
    return (
      <div className="text-center text-muted-foreground text-sm py-8">
        {contentId ? 'No activity yet' : 'No recent activity'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {sortedActivity.slice(0, 20).map((act) => (
        <div
          key={act.id}
          className="px-3 py-2 bg-muted/30 rounded border border-border/50 hover:border-border transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="text-lg flex-shrink-0">{getActivityIcon(act.type)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm text-foreground">{act.actorId}</span>
                <span className="text-xs text-muted-foreground">
                  {formatActivityTime(act.createdAt)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{getActivityLabel(act)}</p>
              {!contentId && (
                <p className="text-xs text-foreground/60 mt-1">
                  {items.find((i) => i.id === act.contentId)?.title || 'Untitled'}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
