import { useMemo } from 'react'
import { useDeviceOrientation } from './useDeviceOrientation'
import type { OrientationStatus } from './useDeviceOrientation'
import { useLocation } from './useLocation'
import { qiblaBearing } from '../utils/qibla'

export interface UseQiblaResult {
  bearing: number
  heading: number | null
  relativeBearing: number | null
  status: OrientationStatus
  error: string | null
  request: () => Promise<void>
  stop: () => void
  canUseCompass: boolean
}

export function useQibla(): UseQiblaResult {
  const location = useLocation()
  const orientation = useDeviceOrientation()

  const bearing = useMemo(
    () => qiblaBearing(location.coords),
    [location.coords],
  )

  const relativeBearing =
    orientation.heading != null
      ? (bearing - orientation.heading + 360) % 360
      : null

  const canUseCompass =
    orientation.status === 'active' && orientation.heading != null

  return {
    bearing,
    heading: orientation.heading,
    relativeBearing,
    status: orientation.status,
    error: orientation.error,
    request: orientation.request,
    stop: orientation.stop,
    canUseCompass,
  }
}
