'use client'

import { useState } from 'react'
import { useContentStore } from '@/lib/store'
import { formatNotificationTime, getUnreadCount } from '@/lib/notifications-utils'
import { getInvolvedNames, getInvolvedTeamMembers, buildWhatsAppLink, buildNotificationMessage } from '@/lib/whatsapp-utils'
import { Button } from './ui/button'

export function NotificationCenter() {
  const { notifications, markNotificationAsRead, deleteNotification, clearNotifications, items, team } =
    useContentStore()
  const [isOpen, setIsOpen] = useState(false)

  const unreadCount = getUnreadCount(notifications)
  const sortedNotifications = [...notifications].sort((a, b) => b.createdAt - a.createdAt)

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    markNotificationAsRead(id)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(id)
  }

  const getWaContacts = (notification: import('@/lib/types').Notification) => {
    if (!notification.contentId) return []
    const item = items.find((i) => i.id === notification.contentId)
    if (!item) return []
    const names = getInvolvedNames(item)
    const members = getInvolvedTeamMembers(names, team)
    const message = buildNotificationMessage(notification, item)
    return members
      .map((m) => ({ name: m.name, link: buildWhatsAppLink(m.phone!, message) }))
      .filter((c): c is { name: string; link: string } => !!c.link)
  }

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'deadline':
        return 'text-orange-400'
      case 'status_change':
        return 'text-blue-400'
      case 'team_mention':
        return 'text-purple-400'
      case 'approval_needed':
        return 'text-[#0036ff]'
      case 'approval_result':
        return 'text-[#c1ff1a]'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <svg
          className="w-5 h-5 text-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-background text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-background border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">Notifications</h3>
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearNotifications()}
                  className="text-xs"
                >
                  Clear All
                </Button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sortedNotifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-muted transition-colors cursor-pointer ${
                      !notification.read ? 'bg-muted/50' : ''
                    }`}
                    onClick={() => !notification.read && markNotificationAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          notification.read ? 'bg-muted-foreground' : 'bg-accent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold ${getTypeColor(notification.type)}`}>
                            {notification.type === 'deadline'
                              ? '⏰'
                              : notification.type === 'status_change'
                                ? '📝'
                                : notification.type === 'team_mention'
                                  ? '@'
                                  : notification.type === 'approval_needed'
                                    ? '🔍'
                                    : notification.type === 'approval_result'
                                      ? '✅'
                                      : '📢'}
                          </span>
                          <p className="text-sm font-medium text-foreground truncate">
                            {notification.title}
                          </p>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                        {getWaContacts(notification).length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {getWaContacts(notification).map((c) => (
                              <a
                                key={c.name}
                                href={c.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10px] font-mono uppercase tracking-wider border border-[#c1ff1a]/40 text-[#c1ff1a] px-2 py-1 rounded-sm hover:bg-[#c1ff1a]/10 transition-colors"
                              >
                                WA {c.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => handleDelete(notification.id, e)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 ml-2"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
