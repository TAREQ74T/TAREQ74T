import { useCallback, useEffect, useState } from 'react'
import type { GeoCoords } from '../utils/prayer-times'
import {
  DEFAULT_LOCATION,
  getCurrentPosition,
  isValidCoords,
  readStoredLocation,
  writeStoredLocation,
} from '../utils/location'

export type LocationSource = 'auto' | 'manual' | 'default'

export type LocationStatus = 'idle' | 'locating' | 'done' | 'error'

export interface UseLocationResult {
  coords: GeoCoords
  source: LocationSource
  status: LocationStatus
  error: string | null
  isDefault: boolean
  detect: () => Promise<void>
  setManual: (latitude: number, longitude: number) => boolean
}

export function useLocation(): UseLocationResult {
  const [coords, setCoords] = useState<GeoCoords>(
    () => readStoredLocation() ?? DEFAULT_LOCATION,
  )
  const [source, setSource] = useState<LocationSource>(() =>
    readStoredLocation() != null ? 'auto' : 'default',
  )
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    writeStoredLocation(coords)
  }, [coords])

  const detect = useCallback(async () => {
    setStatus('locating')
    setError(null)
    try {
      const position = await getCurrentPosition()
      setCoords(position)
      setSource('auto')
      setStatus('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحديد الموقع')
      setStatus('error')
    }
  }, [])

  const setManual = useCallback((latitude: number, longitude: number) => {
    if (!isValidCoords(latitude, longitude)) {
      setError('إحداثيات غير صالحة')
      setStatus('error')
      return false
    }
    setCoords({ latitude, longitude })
    setSource('manual')
    setStatus('done')
    setError(null)
    return true
  }, [])

  return {
    coords,
    source,
    status,
    error,
    isDefault: source === 'default',
    detect,
    setManual,
  }
}
