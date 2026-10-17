import { useMemo } from 'react'
import { useDeviceOrientation } from './useDeviceOrientation'
import type {
  OrientationBranch,
  OrientationStatus,
} from './useDeviceOrientation'
import { useLocation } from './useLocation'
import type { LocationSource } from './useLocation'
import type { GeoCoords } from '../utils/prayer-times'
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
  coords: GeoCoords
  locationSource: LocationSource
  alphaRaw: number | null
  beta: number | null
  gamma: number | null
  branch: OrientationBranch | null
  absCount: number
  relCount: number
  screenAngle: number | null
  eventAbsolute: boolean | null
  rawHeading: number | null
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
    coords: location.coords,
    locationSource: location.source,
    alphaRaw: orientation.alphaRaw,
    beta: orientation.beta,
    gamma: orientation.gamma,
    branch: orientation.branch,
    absCount: orientation.absCount,
    relCount: orientation.relCount,
    screenAngle: orientation.screenAngle,
    eventAbsolute: orientation.eventAbsolute,
    rawHeading: orientation.rawHeading,
  }
}
