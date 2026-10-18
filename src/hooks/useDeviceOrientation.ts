import { useCallback, useEffect, useRef, useState } from 'react'

export type OrientationStatus =
  | 'idle'
  | 'active'
  | 'unsupported'
  | 'denied'
  | 'insecure'

interface DeviceOrientationEventLike {
  type?: string
  webkitCompassHeading?: number
  alpha?: number | null
  beta?: number | null
  gamma?: number | null
  absolute?: boolean
}

export type OrientationBranch = 'webkit' | 'absolute' | 'relative'

export interface OrientationSample {
  t: number
  type: string
  alpha: number | null
  beta: number | null
  gamma: number | null
  rawHeading: number | null
  heading: number | null
  branch: OrientationBranch
}

export const DEBUG_SAMPLE_LIMIT = 100

export interface OrientationDebugSnapshot {
  alphaRaw: number | null
  beta: number | null
  gamma: number | null
  branch: OrientationBranch | null
  absCount: number
  relCount: number
  screenAngle: number | null
  eventAbsolute: boolean | null
  rawHeading: number | null
  samples: OrientationSample[]
}

export interface UseDeviceOrientationResult extends OrientationDebugSnapshot {
  heading: number | null
  status: OrientationStatus
  error: string | null
  request: () => Promise<void>
  stop: () => void
}

const EMPTY_DEBUG_SNAPSHOT: OrientationDebugSnapshot = {
  alphaRaw: null,
  beta: null,
  gamma: null,
  branch: null,
  absCount: 0,
  relCount: 0,
  screenAngle: null,
  eventAbsolute: null,
  rawHeading: null,
  samples: [],
}

function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  return new URLSearchParams(window.location.search).get('debug') === '1'
}

function readScreenAngle(): number | null {
  if (typeof window === 'undefined' || !window.screen) {
    return null
  }
  const angle = window.screen.orientation?.angle
  return typeof angle === 'number' ? angle : null
}

function hasDeviceOrientation(): boolean {
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
}

function isAndroidUserAgent(): boolean {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)
}

export function useDeviceOrientation(): UseDeviceOrientationResult {
  const [heading, setHeading] = useState<number | null>(null)
  const [status, setStatus] = useState<OrientationStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const listenerRef = useRef<((event: DeviceOrientationEventLike) => void) | null>(
    null,
  )
  const smoothingRef = useRef<number[]>([])
  const hasReceivedAbsoluteRef = useRef<boolean>(false)

  const debugEnabledRef = useRef<boolean>(isDebugEnabled())
  const [debugSnapshot, setDebugSnapshot] =
    useState<OrientationDebugSnapshot>(EMPTY_DEBUG_SNAPSHOT)
  const alphaRawRef = useRef<number | null>(null)
  const betaRef = useRef<number | null>(null)
  const gammaRef = useRef<number | null>(null)
  const branchRef = useRef<OrientationBranch | null>(null)
  const absCountRef = useRef<number>(0)
  const relCountRef = useRef<number>(0)
  const screenAngleRef = useRef<number | null>(null)
  const eventAbsoluteRef = useRef<boolean | null>(null)
  const rawHeadingRef = useRef<number | null>(null)
  const headingRef = useRef<number | null>(null)
  const samplesRef = useRef<OrientationSample[]>([])

  useEffect(() => {
    headingRef.current = heading
  }, [heading])

  const resetDebugRefs = useCallback(() => {
    alphaRawRef.current = null
    betaRef.current = null
    gammaRef.current = null
    branchRef.current = null
    absCountRef.current = 0
    relCountRef.current = 0
    screenAngleRef.current = null
    eventAbsoluteRef.current = null
    rawHeadingRef.current = null
    samplesRef.current = []
  }, [])

  useEffect(() => {
    if (!debugEnabledRef.current) {
      return
    }
    const publish = () => {
      setDebugSnapshot({
        alphaRaw: alphaRawRef.current,
        beta: betaRef.current,
        gamma: gammaRef.current,
        branch: branchRef.current,
        absCount: absCountRef.current,
        relCount: relCountRef.current,
        screenAngle: screenAngleRef.current,
        eventAbsolute: eventAbsoluteRef.current,
        rawHeading: rawHeadingRef.current,
        samples: samplesRef.current.slice(),
      })
    }
    publish()
    const timer = window.setInterval(publish, 250)
    return () => window.clearInterval(timer)
  }, [])

  const attachListener = useCallback(() => {
    hasReceivedAbsoluteRef.current = false
    resetDebugRefs()
    if (listenerRef.current) {
      window.removeEventListener(
        'deviceorientation',
        listenerRef.current as EventListener,
      )
      window.removeEventListener(
        'deviceorientationabsolute',
        listenerRef.current as EventListener,
      )
    }
    const handler = (event: DeviceOrientationEventLike) => {
      let raw: number | null = null
      if (typeof event.webkitCompassHeading === 'number') {
        raw = event.webkitCompassHeading
      }

      if (raw == null && typeof event.alpha === 'number') {
        if (event.type === 'deviceorientationabsolute') {
          const absoluteHeading = event.alpha
          raw = absoluteHeading
        } else {
          raw = isAndroidUserAgent()
            ? (event.alpha + 180) % 360
            : (360 - event.alpha) % 360
        }
      }

      if (debugEnabledRef.current) {
        if (event.type === 'deviceorientationabsolute') {
          absCountRef.current += 1
        } else {
          relCountRef.current += 1
        }
        const alpha =
          typeof event.alpha === 'number' ? event.alpha : null
        const beta = typeof event.beta === 'number' ? event.beta : null
        const gamma = typeof event.gamma === 'number' ? event.gamma : null
        alphaRawRef.current = alpha
        betaRef.current = beta
        gammaRef.current = gamma
        screenAngleRef.current = readScreenAngle()
        eventAbsoluteRef.current =
          typeof event.absolute === 'boolean' ? event.absolute : null
        rawHeadingRef.current = raw
        const branch: OrientationBranch =
          typeof event.webkitCompassHeading === 'number'
            ? 'webkit'
            : event.type === 'deviceorientationabsolute'
              ? 'absolute'
              : 'relative'
        branchRef.current = branch
        const samples = samplesRef.current
        samples.push({
          t: typeof performance !== 'undefined' ? performance.now() : 0,
          type: event.type ?? 'unknown',
          alpha,
          beta,
          gamma,
          rawHeading: raw,
          heading: headingRef.current,
          branch,
        })
        if (samples.length > DEBUG_SAMPLE_LIMIT) {
          samples.shift()
        }
      }

      if (
        event.type === 'deviceorientationabsolute' &&
        typeof event.alpha === 'number'
      ) {
        if (!hasReceivedAbsoluteRef.current) {
          smoothingRef.current = []
        }
        hasReceivedAbsoluteRef.current = true
      } else if (hasReceivedAbsoluteRef.current) {
        return
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
    window.addEventListener(
      'deviceorientationabsolute',
      handler as EventListener,
    )
  }, [resetDebugRefs])

  const stop = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener(
        'deviceorientation',
        listenerRef.current as EventListener,
      )
      window.removeEventListener(
        'deviceorientationabsolute',
        listenerRef.current as EventListener,
      )
      listenerRef.current = null
    }
    hasReceivedAbsoluteRef.current = false
    resetDebugRefs()
    setHeading(null)
    setStatus('idle')
  }, [resetDebugRefs])

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
        window.removeEventListener(
          'deviceorientationabsolute',
          listenerRef.current as EventListener,
        )
      }
    },
    [],
  )

  return {
    heading,
    status,
    error,
    request,
    stop,
    ...debugSnapshot,
  }
}
