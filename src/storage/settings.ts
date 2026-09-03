export type TimezoneMode = 'auto' | 'manual'

export const TIMEZONE_MODE_KEY = 'mushaf-al-huda:timezoneMode'
export const MANUAL_UTC_OFFSET_KEY = 'mushaf-al-huda:manualUtcOffset'

export const UTC_OFFSET_MIN = -12
export const UTC_OFFSET_MAX = 14

export function clampUtcOffsetHours(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(UTC_OFFSET_MAX, Math.max(UTC_OFFSET_MIN, Math.round(value)))
}

export function isTimezoneMode(value: unknown): value is TimezoneMode {
  return value === 'auto' || value === 'manual'
}

export function readTimezoneMode(): TimezoneMode {
  try {
    const raw = localStorage.getItem(TIMEZONE_MODE_KEY)
    if (raw === null) {
      return 'auto'
    }
    const parsed: unknown = JSON.parse(raw)
    return isTimezoneMode(parsed) ? parsed : 'auto'
  } catch {
    return 'auto'
  }
}

export function writeTimezoneMode(mode: TimezoneMode): void {
  try {
    localStorage.setItem(TIMEZONE_MODE_KEY, JSON.stringify(mode))
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function readManualUtcOffsetHours(): number {
  try {
    const raw = localStorage.getItem(MANUAL_UTC_OFFSET_KEY)
    if (raw === null) {
      return 0
    }
    const parsed = Number(JSON.parse(raw))
    if (!Number.isFinite(parsed)) {
      return 0
    }
    return clampUtcOffsetHours(parsed)
  } catch {
    return 0
  }
}

export function writeManualUtcOffsetHours(hours: number): void {
  try {
    localStorage.setItem(
      MANUAL_UTC_OFFSET_KEY,
      JSON.stringify(clampUtcOffsetHours(hours)),
    )
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function resetTimezone(): { mode: TimezoneMode; hours: number } {
  writeTimezoneMode('auto')
  writeManualUtcOffsetHours(0)
  return { mode: 'auto', hours: 0 }
}
