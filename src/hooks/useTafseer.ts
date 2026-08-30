import { useCallback, useEffect, useState } from 'react'
import { loadTafseerData } from '../utils/loadTafseerData'
import type { TafseerData } from '../utils/loadTafseerData'

export interface UseTafseerResult {
  isLoading: boolean
  error: string | null
  getTafseer: (surahNumber: number, ayahNumber: number) => string | null
}

export function useTafseer(): UseTafseerResult {
  const [data, setData] = useState<TafseerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    loadTafseerData()
      .then((loaded) => {
        if (cancelled) {
          return
        }
        setData(loaded)
        setIsLoading(false)
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return
        }
        setError(cause instanceof Error ? cause.message : 'تعذر تحميل بيانات التفسير')
        setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const getTafseer = useCallback(
    (surahNumber: number, ayahNumber: number): string | null => {
      if (!data) {
        return null
      }
      const surahTafseer = data.surahs[String(surahNumber)]
      if (!surahTafseer) {
        return null
      }
      return surahTafseer[String(ayahNumber)] ?? null
    },
    [data],
  )

  return { isLoading, error, getTafseer }
}
