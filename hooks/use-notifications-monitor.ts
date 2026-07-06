import { useEffect, useRef } from 'react'
import { useContentStore } from '@/lib/store'
import {
  createNotification,
  checkDuelineNotifications,
  createStatusChangeNotification,
} from '@/lib/notifications-utils'

export function useNotificationsMonitor() {
  const {
    items,
    reminders,
    notifications,
    addNotification,
    addActivity,
    currentFilter,
    setCurrentFilter,
  } = useContentStore()

  const prevItemsRef = useRef(items)
  const lastCheckRef = useRef<string>(new Date().toISOString().split('T')[0])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]

    // Check for deadline notifications daily
    if (today !== lastCheckRef.current) {
      lastCheckRef.current = today
      const deadlineNotifications = checkDuelineNotifications(items, reminders)
      deadlineNotifications.forEach((notif) => {
        // Avoid duplicates
        const exists = notifications.some(
          (n) =>
            n.type === notif.type &&
            n.contentId === notif.contentId &&
            n.createdAt > Date.now() - 86400000
        )
        if (!exists) addNotification(notif)
      })
    }

    // Check for status changes
    prevItemsRef.current.forEach((prevItem) => {
      const currentItem = items.find((i) => i.id === prevItem.id)
      if (currentItem && currentItem.status !== prevItem.status) {
        const statusChangeNotif = createStatusChangeNotification(
          currentItem,
          prevItem.status,
          currentItem.status,
          'System'
        )
        addNotification(statusChangeNotif)

        // Also log as activity
        addActivity({
          id: crypto.getRandomValues(new Uint8Array(16)).join(''),
          type: 'status_changed',
          contentId: currentItem.id,
          actorId: 'System',
          oldValue: prevItem.status,
          newValue: currentItem.status,
          createdAt: Date.now(),
        })
      }
    })

    prevItemsRef.current = items
  }, [items, reminders, notifications, addNotification, addActivity])
}
