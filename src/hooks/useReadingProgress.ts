import { useCallback, useEffect, useState } from 'react'

export interface ReadingPosition {
  surahNumber: number
  ayahNumber: number
}

const STORAGE_KEY = 'mushaf-al-huda:reading-progress'

function readPosition(): ReadingPosition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as ReadingPosition).surahNumber === 'number' &&
      typeof (parsed as ReadingPosition).ayahNumber === 'number'
    ) {
      return parsed as ReadingPosition
    }
    return null
  } catch {
    return null
  }
}

export interface UseReadingProgressResult {
  position: ReadingPosition | null
  savePosition: (surahNumber: number, ayahNumber: number) => void
  clearPosition: () => void
}

export function useReadingProgress(): UseReadingProgressResult {
  const [position, setPosition] = useState<ReadingPosition | null>(readPosition)

  useEffect(() => {
    try {
      if (position) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(position))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  }, [position])

  const savePosition = useCallback((surahNumber: number, ayahNumber: number) => {
    setPosition({ surahNumber, ayahNumber })
  }, [])

  const clearPosition = useCallback(() => {
    setPosition(null)
  }, [])

  return { position, savePosition, clearPosition }
}
