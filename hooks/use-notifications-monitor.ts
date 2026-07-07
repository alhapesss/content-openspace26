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
      if (!currentItem) return

      if (currentItem.status !== prevItem.status) {
        const statusChangeNotif = createStatusChangeNotification(
          currentItem,
          prevItem.status,
          currentItem.status,
          'System'
        )
        addNotification(statusChangeNotif)

        addActivity({
          id: crypto.getRandomValues(new Uint8Array(16)).join(''),
          type: 'status_changed',
          contentId: currentItem.id,
          actorId: 'System',
          oldValue: prevItem.status,
          newValue: currentItem.status,
          createdAt: Date.now(),
        })

        // Masuk stage Review -> kasih notif "perlu di-approve"
        if (currentItem.status === 'Review') {
          addNotification(
            createNotification(
              'approval_needed',
              `Perlu Approval: ${currentItem.title}`,
              `Konten ini masuk stage Review, tunggu persetujuan sebelum lanjut ke Terjadwal.`,
              currentItem.id
            )
          )
        }
      }

      // Log perubahan field penting lainnya (title, caption, notes, link, dsb)
      const trackedFields: Array<keyof typeof currentItem> = [
        'title', 'caption', 'notes', 'driveLink', 'briefPosting', 'date', 'pic', 'platform', 'format',
      ]
      trackedFields.forEach((f) => {
        const oldVal = prevItem[f]
        const newVal = currentItem[f]
        if (oldVal !== newVal && (oldVal || newVal)) {
          addActivity({
            id: crypto.getRandomValues(new Uint8Array(16)).join(''),
            type: 'updated',
            contentId: currentItem.id,
            actorId: 'System',
            field: f as string,
            oldValue: oldVal != null ? String(oldVal) : '',
            newValue: newVal != null ? String(newVal) : '',
            createdAt: Date.now(),
          })
        }
      })
    })

    prevItemsRef.current = items
  }, [items, reminders, notifications, addNotification, addActivity])
}
