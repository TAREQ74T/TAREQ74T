import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PrayerKey, PrayerAdjustments } from '../storage/adjustments'
import {
  clampPrayerAdjustment,
  readPrayerAdjustments,
  resetPrayerAdjustments,
  writePrayerAdjustments,
} from '../storage/adjustments'
import type { CalculationMethodName, GeoCoords } from '../utils/prayer-times'
import {
  computePrayerTimes,
  getAdjustedPrayerTimes,
  getNextPrayer,
} from '../utils/prayer-times'

export interface UsePrayerTimesResult {
  times: Record<PrayerKey, Date>
  adjustedTimes: Record<PrayerKey, Date>
  adjustments: PrayerAdjustments
  method: CalculationMethodName
  madhab: 'shafi' | 'hanafi'
  nextPrayer: { key: PrayerKey; time: Date; isTomorrow: boolean } | null
  setAdjustment: (key: PrayerKey, minutes: number) => void
  setMethod: (method: CalculationMethodName) => void
  setMadhab: (madhab: 'shafi' | 'hanafi') => void
  resetAdjustments: () => void
}

export function usePrayerTimes(
  coords: GeoCoords,
  utcOffsetMinutes?: number,
): UsePrayerTimesResult {
  const [method, setMethod] = useState<CalculationMethodName>('MuslimWorldLeague')
  const [madhab, setMadhab] = useState<'shafi' | 'hanafi'>('shafi')
  const [adjustments, setAdjustments] = useState<PrayerAdjustments>(
    readPrayerAdjustments,
  )
  const [now, setNow] = useState<Date>(() => new Date())

  useEffect(() => {
    writePrayerAdjustments(adjustments)
  }, [adjustments])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date())
    }, 30_000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const times = useMemo<Record<PrayerKey, Date>>(
    () => computePrayerTimes(coords, now, method, madhab, utcOffsetMinutes),
    [coords, now, method, madhab, utcOffsetMinutes],
  )

  const adjustedTimes = useMemo<Record<PrayerKey, Date>>(
    () => getAdjustedPrayerTimes(times, adjustments),
    [times, adjustments],
  )

  const nextPrayer = useMemo(
    () =>
      getNextPrayer(coords, adjustedTimes, now, method, madhab, utcOffsetMinutes),
    [coords, adjustedTimes, now, method, madhab, utcOffsetMinutes],
  )

  const setAdjustment = useCallback((key: PrayerKey, minutes: number) => {
    setAdjustments((previous) => ({
      ...previous,
      [key]: clampPrayerAdjustment(minutes),
    }))
  }, [])

  const resetAdjustments = useCallback(() => {
    setAdjustments(resetPrayerAdjustments())
  }, [])

  return {
    times,
    adjustedTimes,
    adjustments,
    method,
    madhab,
    nextPrayer,
    setAdjustment,
    setMethod,
    setMadhab,
    resetAdjustments,
  }
}
