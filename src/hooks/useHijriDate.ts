import { useCallback, useEffect, useState } from 'react'
import type { HijriOffset } from '../utils/hijri'
import {
  formatHijriDate,
  getAdjustedHijriDate,
  isHijriCalendarSupported,
} from '../utils/hijri'
import {
  clampHijriOffset,
  readHijriOffset,
  resetHijriOffset,
  writeHijriOffset,
} from '../storage/adjustments'

export interface UseHijriDateResult {
  offset: HijriOffset
  adjustedDate: Date
  hijriString: string
  supported: boolean
  atMin: boolean
  atMax: boolean
  increment: () => void
  decrement: () => void
  reset: () => void
}

export function useHijriDate(): UseHijriDateResult {
  const [offset, setOffset] = useState<HijriOffset>(readHijriOffset)
  const [today, setToday] = useState<Date>(() => new Date())

  useEffect(() => {
    writeHijriOffset(offset)
  }, [offset])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday(new Date())
    }, 60_000)
    return () => {
      window.clearInterval(timer)
    }
  }, [])

  const increment = useCallback(() => {
    setOffset((previous) => clampHijriOffset(previous + 1))
  }, [])

  const decrement = useCallback(() => {
    setOffset((previous) => clampHijriOffset(previous - 1))
  }, [])

  const reset = useCallback(() => {
    setOffset(resetHijriOffset())
  }, [])

  const adjustedDate = getAdjustedHijriDate(today, offset)

  return {
    offset,
    adjustedDate,
    hijriString: isHijriCalendarSupported() ? formatHijriDate(adjustedDate) : '',
    supported: isHijriCalendarSupported(),
    atMin: offset <= -3,
    atMax: offset >= 3,
    increment,
    decrement,
    reset,
  }
}
