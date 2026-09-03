import { useCallback, useEffect, useRef, useState } from 'react'

export type OrientationStatus =
  | 'idle'
  | 'active'
  | 'unsupported'
  | 'denied'
  | 'insecure'

interface DeviceOrientationEventLike {
  webkitCompassHeading?: number
  alpha?: number | null
}

export interface UseDeviceOrientationResult {
  heading: number | null
  status: OrientationStatus
  error: string | null
  request: () => Promise<void>
  stop: () => void
}

function hasDeviceOrientation(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
}

export function useDeviceOrientation(): UseDeviceOrientationResult {
  const [heading, setHeading] = useState<number | null>(null)
  const [status, setStatus] = useState<OrientationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const listenerRef = useRef<((event: DeviceOrientationEventLike) => void) | null>(
    null,
  )
  const smoothingRef = useRef<number[]>([])

  const attachListener = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener(
        'deviceorientation',
        listenerRef.current as EventListener,
      )
    }
    const handler = (event: DeviceOrientationEventLike) => {
      let raw: number | null = null
      if (typeof event.webkitCompassHeading === 'number') {
        raw = event.webkitCompassHeading
      } else if (typeof event.alpha === 'number') {
        raw = (360 - event.alpha) % 360
      }
      if (raw == null) {
        return
      }
      const values = smoothingRef.current
      values.push(raw)
      if (values.length > 5) {
        values.shift()
      }
      const average =
        values.reduce((sum, value) => sum + value, 0) / values.length
      setHeading((previous) => {
        if (previous != null && Math.abs(average - previous) < 2) {
          return previous
        }
        return average
      })
    }
    listenerRef.current = handler
    window.addEventListener('deviceorientation', handler as EventListener)
  }, [])

  const stop = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener(
        'deviceorientation',
        listenerRef.current as EventListener,
      )
      listenerRef.current = null
    }
    setHeading(null)
    setStatus('idle')
  }, [])

  const request = useCallback(async () => {
    if (!window.isSecureContext) {
      setStatus('insecure')
      setError('الوصول إلى البوصلة يتطلب اتصالاً آمناً (HTTPS) — استخدم الإدخال اليدوي.')
      return
    }
    if (!hasDeviceOrientation()) {
      setStatus('unsupported')
      setError('جهازك لا يدعم بوصلة الاتجاه (DeviceOrientationEvent) — استخدم الإدخال اليدوي.')
      return
    }
    try {
      const Constructor = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>
      }
      if (typeof Constructor.requestPermission === 'function') {
        const permission = await Constructor.requestPermission()
        if (permission !== 'granted') {
          setStatus('denied')
          setError('تم رفض الإذن بالوصول إلى البوصلة — استخدم الإدخال اليدوي.')
          return
        }
      }
      smoothingRef.current = []
      attachListener()
      setStatus('active')
      setError(null)
    } catch (err) {
      setStatus('denied')
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر الوصول إلى البوصلة — استخدم الإدخال اليدوي.',
      )
    }
  }, [attachListener])

  useEffect(
    () => () => {
      if (listenerRef.current) {
        window.removeEventListener(
          'deviceorientation',
          listenerRef.current as EventListener,
        )
      }
    },
    [],
  )

  return { heading, status, error, request, stop }
}
