import {
  CalculationMethod,
  Coordinates,
  Madhab,
  PrayerTimes,
} from 'adhan'
import type { PrayerKey } from '../storage/adjustments'
import { PRAYER_KEYS } from '../storage/adjustments'

export type CalculationMethodName = keyof typeof CalculationMethod

export interface GeoCoords {
  latitude: number
  longitude: number
}

export const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
}

export const CALCULATION_METHODS: Record<CalculationMethodName, string> = {
  MuslimWorldLeague: 'رابطة العالم الإسلامي (MWL)',
  Egyptian: 'الهيئة المصرية',
  Karachi: 'جامعة كراتشي',
  UmmAlQura: 'أم القرى',
  Dubai: 'دبي',
  MoonsightingCommittee: 'لجنة رؤية الهلال',
  NorthAmerica: 'أمريكا الشمالية',
  Kuwait: 'الكويت',
  Qatar: 'قطر',
  Singapore: 'سنغافورة',
  Tehran: 'طهران',
  Turkey: 'تركيا',
  Other: 'أخرى',
}

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
    .join('')
}

export function longitudeOffsetMinutes(longitude: number): number {
  return Math.round(longitude / 15) * 60
}

export function locationNowShiftMinutes(longitude: number, base: Date): number {
  const deviceOffset = -base.getTimezoneOffset()
  const locationOffset = longitudeOffsetMinutes(longitude)
  return locationOffset - deviceOffset
}

function locationCalendarDate(coords: GeoCoords, base: Date): Date {
  const deviceOffset = -base.getTimezoneOffset()
  const locationOffset = longitudeOffsetMinutes(coords.longitude)
  return new Date(base.getTime() + (locationOffset - deviceOffset) * 60_000)
}

export function formatPrayerTime(
  date: Date | null,
  longitudeOffsetMin?: number,
): string {
  if (!date || !Number.isFinite(date.getTime())) {
    return '—'
  }
  const offset = longitudeOffsetMin ?? 0
  const shifted = new Date(date.getTime() + offset * 60_000)
  const hours = shifted.getUTCHours()
  const minutes = shifted.getUTCMinutes()
  return `${toArabicDigits(hours)}:${toArabicDigits(minutes)}`
}

export function adjustTime(base: Date, minutes: number): Date {
  return new Date(base.getTime() + minutes * 60_000)
}

export function computePrayerTimes(
  coords: GeoCoords,
  date: Date,
  method: CalculationMethodName = 'MuslimWorldLeague',
  madhab: string = 'shafi',
): Record<PrayerKey, Date> {
  const coordinates = new Coordinates(coords.latitude, coords.longitude)
  const params = CalculationMethod[method]()
  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  const locationDate = locationCalendarDate(coords, date)
  const times = new PrayerTimes(coordinates, locationDate, params)
  const result = {} as Record<PrayerKey, Date>
  for (const key of PRAYER_KEYS) {
    const value = times[key]
    result[key] = new Date(value.getTime())
  }
  return result
}

export function getNextPrayer(
  coords: GeoCoords,
  times: Record<PrayerKey, Date>,
  now: Date,
  method: CalculationMethodName = 'MuslimWorldLeague',
  madhab: string = 'shafi',
): { key: PrayerKey; time: Date; isTomorrow: boolean } | null {
  for (const key of PRAYER_KEYS) {
    if (times[key].getTime() > now.getTime()) {
      return { key, time: times[key], isTomorrow: false }
    }
  }
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowTimes = computePrayerTimes(coords, tomorrow, method, madhab)
  return { key: 'fajr', time: tomorrowTimes.fajr, isTomorrow: true }
}

export function getAdjustedPrayerTimes(
  times: Record<PrayerKey, Date>,
  adjustments: Record<PrayerKey, number>,
): Record<PrayerKey, Date> {
  const result = {} as Record<PrayerKey, Date>
  for (const key of PRAYER_KEYS) {
    result[key] = adjustTime(times[key], adjustments[key])
  }
  return result
}
