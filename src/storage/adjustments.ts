export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'

export type PrayerAdjustments = Record<PrayerKey, number>

export const PRAYER_KEYS: readonly PrayerKey[] = [
  'fajr',
  'sunrise',
  'dhuhr',
  'asr',
  'maghrib',
  'isha',
]

export const HIJRI_OFFSET_KEY = 'mushaf-al-huda:hijriOffset'
export const PRAYER_ADJUSTMENTS_KEY = 'mushaf-al-huda:prayerAdjustments'

const PRAYER_MIN = -30
const PRAYER_MAX = 30
const HIJRI_MIN = -3
const HIJRI_MAX = 3

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function clampHijriOffset(value: number): number {
  return clamp(value, HIJRI_MIN, HIJRI_MAX)
}

export function clampPrayerAdjustment(value: number): number {
  return clamp(value, PRAYER_MIN, PRAYER_MAX)
}

function emptyAdjustments(): PrayerAdjustments {
  return { fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 }
}

function isValidAdjustments(value: unknown): value is PrayerAdjustments {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Partial<PrayerAdjustments>
  return PRAYER_KEYS.every((key) => typeof candidate[key] === 'number')
}

export function readHijriOffset(): number {
  try {
    const raw = localStorage.getItem(HIJRI_OFFSET_KEY)
    if (raw === null) {
      return 0
    }
    const parsed = Number(JSON.parse(raw))
    if (!Number.isFinite(parsed)) {
      return 0
    }
    return clampHijriOffset(parsed)
  } catch {
    return 0
  }
}

export function writeHijriOffset(offset: number): void {
  try {
    localStorage.setItem(HIJRI_OFFSET_KEY, JSON.stringify(clampHijriOffset(offset)))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function readPrayerAdjustments(): PrayerAdjustments {
  try {
    const raw = localStorage.getItem(PRAYER_ADJUSTMENTS_KEY)
    if (raw === null) {
      return emptyAdjustments()
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isValidAdjustments(parsed)) {
      return emptyAdjustments()
    }
    const result = emptyAdjustments()
    for (const key of PRAYER_KEYS) {
      result[key] = clampPrayerAdjustment(parsed[key])
    }
    return result
  } catch {
    return emptyAdjustments()
  }
}

export function writePrayerAdjustments(adjustments: PrayerAdjustments): void {
  try {
    const sanitized = emptyAdjustments()
    for (const key of PRAYER_KEYS) {
      sanitized[key] = clampPrayerAdjustment(adjustments[key])
    }
    localStorage.setItem(PRAYER_ADJUSTMENTS_KEY, JSON.stringify(sanitized))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function resetPrayerAdjustments(): PrayerAdjustments {
  writePrayerAdjustments(emptyAdjustments())
  return emptyAdjustments()
}

export function resetHijriOffset(): number {
  writeHijriOffset(0)
  return 0
}
