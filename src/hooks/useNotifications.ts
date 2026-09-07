import { useEffect, useRef, useState } from 'react'
import {
  getNotificationPermission,
  markSent,
  planNextNotification,
  readNotificationPrefs,
  requestWebNotificationPermission,
  showWebNotification,
  writeNotificationPrefs,
  type NotificationPrefs,
  type PermissionStatus,
  type PrayerReminderKind,
} from '../utils/notifications'

export interface UseNotificationsResult {
  prefs: NotificationPrefs
  permission: PermissionStatus
  canNotify: boolean
  hasActivePlan: boolean
  toggleVerseOfDay: () => Promise<void>
  togglePrayerReminder: () => Promise<void>
  setReminderKind: (kind: PrayerReminderKind) => void
  requestPermission: () => Promise<boolean>
  refreshPermission: () => void
}

/**
 * جدولة إشعارات الويب: تعمل والصفحة مفتوحة/في الخلفية عبر الـService Worker.
 * تُجدول (setTimeout/setInterval) في الصفحة ثم تُعرض عبر registration.showNotification().
 */
export function useNotifications(): UseNotificationsResult {
  const [prefs, setPrefs] = useState<NotificationPrefs>(readNotificationPrefs)
  const [permission, setPermission] = useState<PermissionStatus>(
    getNotificationPermission,
  )
  const timeoutRef = useRef<number | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const hasActivePlan = prefs.verseOfDayEnabled || prefs.prayerReminderEnabled

  const updatePrefs = (next: NotificationPrefs) => {
    setPrefs(next)
    writeNotificationPrefs(next)
  }

  const toggleVerseOfDay = async () => {
    let nextPermission = permission
    if (!prefs.verseOfDayEnabled && permission !== 'granted') {
      nextPermission = (await requestPermission()) ? 'granted' : getNotificationPermission()
    }
    if (!prefs.verseOfDayEnabled && nextPermission !== 'granted') {
      return
    }
    updatePrefs({ ...prefs, verseOfDayEnabled: !prefs.verseOfDayEnabled })
  }

  const togglePrayerReminder = async () => {
    let nextPermission = permission
    if (!prefs.prayerReminderEnabled && permission !== 'granted') {
      nextPermission = (await requestPermission()) ? 'granted' : getNotificationPermission()
    }
    if (!prefs.prayerReminderEnabled && nextPermission !== 'granted') {
      return
    }
    updatePrefs({
      ...prefs,
      prayerReminderEnabled: !prefs.prayerReminderEnabled,
    })
  }

  const setReminderKind = (kind: PrayerReminderKind) => {
    updatePrefs({ ...prefs, prayerReminderKind: kind })
  }

  const refreshPermission = () => {
    setPermission(getNotificationPermission())
  }

  const requestPermission = async (): Promise<boolean> => {
    const granted = await requestWebNotificationPermission()
    setPermission(granted ? 'granted' : getNotificationPermission())
    return granted
  }

  // مجدول مركزي (سلسلة متجددة): فعّال فقط عند وجود خطة مفعّلة مع إذن ممنوح.
  // لا يوجد مؤقت دوري يلغي مؤقت الحدث المقرَّر؛ كل دورة تجدِّد جدولتها بنفسها،
  // مما يمنع فقدان الموعد حتى عند تقدم زمن المحاكاة في الاختبارات.
  useEffect(() => {
    if (!hasActivePlan || permission !== 'granted') {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    let cancelled = false

    const clearTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const schedule = async () => {
      if (cancelled || !mountedRef.current) {
        return
      }
      const event = await planNextNotification(prefs, new Date())
      if (!event || cancelled) {
        return
      }
      const delay = Math.max(150, event.at.getTime() - Date.now())
      timeoutRef.current = window.setTimeout(async () => {
        timeoutRef.current = null
        if (cancelled) {
          return
        }
        // أحداث فاتت موعدها بأكثر من دقيقة (مثلاً نوم الجهاز) لا تُعرض متأخرة؛
        // الدورة التالية تلتقط ما تبقى (وتعرض آية اليوم كمتابعة إن لزم).
        const stale = Date.now() - event.at.getTime() > 60_000
        if (!stale) {
          await showWebNotification(event.title, event.body, event.tag)
        }
        // تُسجَّل المحاولة دائماً لمنع تكرار الحدث ذاته أو حلقات إعادة فورية.
        markSent(event.id)
        if (!cancelled) {
          void schedule()
        }
      }, delay)
    }

    void schedule()

    return () => {
      cancelled = true
      clearTimer()
    }
  }, [hasActivePlan, permission, prefs])

  return {
    prefs,
    permission,
    canNotify: permission === 'granted',
    hasActivePlan,
    toggleVerseOfDay,
    togglePrayerReminder,
    setReminderKind,
    requestPermission,
    refreshPermission,
  }
}
