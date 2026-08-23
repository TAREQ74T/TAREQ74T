import { useCallback, useEffect, useState } from 'react'
import { loadQuranData } from '../utils/loadQuranData'
import type { QuranData, Surah } from '../utils/loadQuranData'

export interface UseQuranResult {
  surahs: Surah[]
  currentSurah: Surah | null
  isLoading: boolean
  error: string | null
  selectSurah: (number: number) => void
}

export function useQuran(): UseQuranResult {
  const [data, setData] = useState<QuranData | null>(null)
  const [currentNumber, setCurrentNumber] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadQuranData()
      .then((loaded) => {
        if (cancelled) {
          return
        }
        setData(loaded)
        setCurrentNumber((previous) => previous ?? loaded.surahs[0]?.number ?? null)
        setIsLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return
        }
        setError(cause instanceof Error ? cause.message : 'تعذر تحميل بيانات المصحف')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectSurah = useCallback((number: number) => {
    setCurrentNumber(number)
  }, [])

  const currentSurah = data?.surahs.find((surah) => surah.number === currentNumber) ?? null

  return { surahs: data?.surahs ?? [], currentSurah, isLoading, error, selectSurah }
}
