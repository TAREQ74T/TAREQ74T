import { useCallback, useEffect, useRef } from 'react'

export function useHoldStep(
  onStep: () => void,
  disabled: boolean,
): { start: () => void; stop: () => void } {
  const timerRef = useRef<number | null>(null)
  const onStepRef = useRef(onStep)
  const disabledRef = useRef(disabled)

  useEffect(() => {
    onStepRef.current = onStep
  }, [onStep])

  useEffect(() => {
    disabledRef.current = disabled
  }, [disabled])

  const stop = useCallback(() => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const start = useCallback(() => {
    if (disabledRef.current) {
      return
    }
    onStepRef.current()
    timerRef.current = window.setInterval(() => {
      if (disabledRef.current) {
        stop()
        return
      }
      onStepRef.current()
    }, 250)
  }, [stop])

  useEffect(() => () => stop(), [stop])

  return { start, stop }
}
