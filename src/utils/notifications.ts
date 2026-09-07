import { loadQuranData } from './loadQuranData'
import type { Ayah, Surah } from './loadQuranData'
import { readPrayerAdjustments } from '../storage/adjustments'
import { readManualUtcOffsetHours, readTimezoneMode } from '../storage/settings'
import {
  adjustTime,
  computePrayerTimes,
  effectiveUtcOffsetMinutes,
  getAdjustedPrayerTimes,
  PRAYER_LABELS,
} from './prayer-times'
import type { PrayerKey } from '../storage/adjustments'
import { readStoredLocation, DEFAULT_LOCATION } from './location'
import type { GeoCoords } from './prayer-times'

/**
 * إشعارات المرحلة (المنصة) — Web Notifications API فقط.
 * الجدولة تعمل في الصفحة، والعرض عبر الـService Worker المولّد (registration.showNotification)
 * مع تراجع إلى new Notification() عند غياب تسجيل SW نشط.
 * تُستبدل بإشعارات Capacitor الأصلية في مرحلة APK فقط (لا خلط بين الطبقتين).
 */

export type PrayerReminderKind = 'approaching' | 'entered' | 'both'

export interface NotificationPrefs {
  verseOfDayEnabled: boolean
  prayerReminderEnabled: boolean
  prayerReminderKind: PrayerReminderKind
}

export type PermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export interface NotificationEvent {
  type: 'verse-of-day' | 'prayer-approaching' | 'prayer-entered'
  at: Date
  title: string
  body: string
  tag: string
  id: string
}

const PREFS_KEY = 'mushaf-al-huda:notifications'
const LOG_KEY = 'mushaf-al-huda:notification-log'

export const APPROACH_MINUTES = 15
export const VERSE_DELIVERY_HOUR = 9
export const WAKE_START_HOUR = 6
export const WAKE_END_HOUR = 23

const DEFAULT_PREFS: NotificationPrefs = {
  verseOfDayEnabled: false,
  prayerReminderEnabled: false,
  prayerReminderKind: 'approaching',
}

export const PRAYER_REMINDER_KEYS: PrayerKey[] = [
  'fajr',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
]

function isReminderKind(value: unknown): value is PrayerReminderKind {
  return value === 'approaching' || value === 'entered' || value === 'both'
}

export function readNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw === null) {
      return { ...DEFAULT_PREFS }
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULT_PREFS }
    }
    const candidate = parsed as Partial<NotificationPrefs>
    return {
      verseOfDayEnabled: Boolean(candidate.verseOfDayEnabled),
      prayerReminderEnabled: Boolean(candidate.prayerReminderEnabled),
      prayerReminderKind: isReminderKind(candidate.prayerReminderKind)
        ? candidate.prayerReminderKind
        : DEFAULT_PREFS.prayerReminderKind,
    }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function writeNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

function supportsNotifications(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): PermissionStatus {
  if (!supportsNotifications()) {
    return 'unsupported'
  }
  if (typeof Notification.permission === 'string') {
    return Notification.permission as 'granted' | 'denied' | 'default'
  }
  return 'unsupported'
}

/** طلب إذن إشعارات الويب — يُعرض طلب واحد من المتصفح. */
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (!supportsNotifications()) {
    return false
  }
  try {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  } catch {
    return getNotificationPermission() === 'granted'
  }
}

function readCoordinates(): GeoCoords {
  return readStoredLocation() ?? DEFAULT_LOCATION
}

/** آخر إرسال يُسجَّل لمنع تكرار الإشعارات. */
interface LogEntry {
  id: string
  at: number
}

function readLog(): LogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) {
      return []
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(
      (entry): entry is LogEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as LogEntry).id === 'string' &&
        typeof (entry as LogEntry).at === 'number',
    )
  } catch {
    return []
  }
}

export function wasSent(id: string): boolean {
  return readLog().some((entry) => entry.id === id)
}

export function markSent(id: string): void {
  try {
    const log = readLog()
    log.push({ id, at: Date.now() })
    while (log.length > 80) {
      log.shift()
    }
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

function dateStamp(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function todayAt(hour: number, now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0, 0)
}

/** سجّل صغير داخل النطاق الزمني: هل نحن في ساعات الاستيقاظ الافتراضية؟ */
function isWithinWakeWindow(at: Date): boolean {
  const hour = at.getHours()
  return hour >= WAKE_START_HOUR && hour < WAKE_END_HOUR
}

/** آية اليوم المحددة آلياً — كل يوم آية مختلفة من الـ 6236 عبر بذرة ثابتة. */
async function pickVerseOfDay(now: Date): Promise<{ surah: Surah; ayah: Ayah }> {
  const data = await loadQuranData()
  const all: { surah: Surah; ayah: Ayah }[] = []
  for (const surah of data.surahs) {
    for (const ayah of surah.ayahs) {
      all.push({ surah, ayah })
    }
  }
  const daySeed = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86_400_000,
  )
  const selected = all[daySeed % all.length] ?? { surah: data.surahs[0], ayah: data.surahs[0].ayahs[0] }
  if (selected.ayah.arabic_text.trim().length === 0) {
    return { surah: data.surahs[0], ayah: data.surahs[0].ayahs[0] }
  }
  return selected
}

function shortText(text: string, max = 130): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

async function buildVerseEvent(now: Date): Promise<NotificationEvent | null> {
  const id = `verse:${dateStamp(now)}`
  if (wasSent(id)) {
    return null
  }
  const deliveryAt = todayAt(VERSE_DELIVERY_HOUR, now)
  if (now.getTime() < deliveryAt.getTime()) {
    return { type: 'verse-of-day', at: deliveryAt, title: '', body: '', tag: 'verse-of-day', id }
  }
  const { surah, ayah } = await pickVerseOfDay(now)
  return {
    type: 'verse-of-day',
    at: now,
    title: 'آية اليوم',
    body: `${surah.name_ar} — ${shortText(ayah.arabic_text)}`,
    tag: 'verse-of-day',
    id,
  }
}

function prayerEventId(key: PrayerKey, kind: 'approaching' | 'entered', at: Date): string {
  return `prayer:${key}:${kind}:${dateStamp(at)}`
}

function prayerEventTitle(key: PrayerKey, kind: 'approaching' | 'entered'): string {
  const label = PRAYER_LABELS[key]
  return kind === 'approaching' ? `اقترب وقت ${label}` : `حان الآن وقت ${label}`
}

function prayerEventBody(key: PrayerKey, kind: 'approaching' | 'entered'): string {
  const label = PRAYER_LABELS[key]
  return kind === 'approaching'
    ? `موعد صلاة ${label} بعد ${APPROACH_MINUTES} دقائق تقريباً.`
    : `حان الآن وقت صلاة ${label}.`
}

function buildPrayerEvent(
  key: PrayerKey,
  kind: 'approaching' | 'entered',
  at: Date,
  now: Date,
): NotificationEvent | null {
  if (now.getTime() - at.getTime() > 60_000) {
    return null
  }
  const id = prayerEventId(key, kind, at)
  if (wasSent(id)) {
    return null
  }
  return {
    type: kind === 'approaching' ? 'prayer-approaching' : 'prayer-entered',
    at: at.getTime() <= now.getTime() ? now : at,
    title: prayerEventTitle(key, kind),
    body: prayerEventBody(key, kind),
    tag: `prayer:${kind}:${key}`,
    id,
  }
}

/** التالي المستحق من كل أحداث الإشعارات (اليوم ثم الغد) أو null. */
export async function planNextNotification(
  prefs: NotificationPrefs,
  now: Date,
): Promise<NotificationEvent | null> {
  const candidates: NotificationEvent[] = []

  if (prefs.verseOfDayEnabled) {
    const verse = await buildVerseEvent(now)
    if (verse) {
      candidates.push(verse)
    }
  }

  if (prefs.prayerReminderEnabled) {
    const coords = readCoordinates()
    const utcOffsetMinutes = effectiveUtcOffsetMinutes(
      coords,
      readTimezoneMode(),
      readManualUtcOffsetHours(),
    )
    const adjustments = readPrayerAdjustments()

    const collectForDay = (day: Date) => {
      const times = computePrayerTimes(
        coords,
        day,
        'MuslimWorldLeague',
        'shafi',
        utcOffsetMinutes,
      )
      const adjusted = getAdjustedPrayerTimes(times, adjustments)
      for (const key of PRAYER_REMINDER_KEYS) {
        const enteredAt = adjusted[key]
        if (
          (prefs.prayerReminderKind === 'entered' ||
            prefs.prayerReminderKind === 'both') &&
          isWithinWakeWindow(enteredAt)
        ) {
          const event = buildPrayerEvent(key, 'entered', enteredAt, now)
          if (event) {
            candidates.push(event)
          }
        }
        const approachingAt = adjustTime(enteredAt, -APPROACH_MINUTES)
        if (
          (prefs.prayerReminderKind === 'approaching' ||
            prefs.prayerReminderKind === 'both') &&
          isWithinWakeWindow(approachingAt)
        ) {
          const event = buildPrayerEvent(key, 'approaching', approachingAt, now)
          if (event) {
            candidates.push(event)
          }
        }
      }
    }

    collectForDay(now)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    collectForDay(tomorrow)
  }

  if (candidates.length === 0) {
    return null
  }
  const due = candidates
    .filter((candidate) => candidate.at.getTime() >= now.getTime() - 60_000)
    .sort((a, b) => a.at.getTime() - b.at.getTime())[0]
  return due ?? null
}

/** عرض إشعار ويب عبر الـSW الموجود مع تراجع لصفحة Notification. */
export async function showWebNotification(
  title: string,
  body: string,
  tag: string,
): Promise<boolean> {
  const options: NotificationOptions = {
    body,
    icon: '/app-icon.svg',
    badge: '/favicon.svg',
    tag,
    dir: 'rtl',
    lang: 'ar',
  }
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && typeof registration.showNotification === 'function') {
        await registration.showNotification(title, options)
        return true
      }
    } catch {
      // انتقل إلى المسار التراجعي
    }
  }
  if (supportsNotifications() && Notification.permission === 'granted') {
    try {
      new Notification(title, options)
      return true
    } catch {
      return false
    }
  }
  return false
}
