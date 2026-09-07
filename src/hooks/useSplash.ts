import { useEffect, useState } from 'react'

const AUTO_DISMISS_MS = 1800
const LEAVE_MS = 260

export interface UseSplashResult {
  visible: boolean
  leaving: boolean
  dismiss: () => void
}

/** إدارة شاشة البداية: تخطي فوري بنقرة + اختفاء تلقائي بعد 1.8 ثانية كحد أقصى. */
export function useSplash(): UseSplashResult {
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLeaving(true)
    }, AUTO_DISMISS_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setGone(true)
  }

  useEffect(() => {
    if (!leaving || gone) {
      return
    }
    const timer = window.setTimeout(() => setGone(true), LEAVE_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [leaving, gone])

  return { visible: !gone, leaving, dismiss }
}
