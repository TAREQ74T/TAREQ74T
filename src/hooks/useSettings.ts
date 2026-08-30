import { useCallback, useEffect, useState } from 'react'

export type FontSize = 'small' | 'medium' | 'large'
export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'mushaf-al-huda:settings'

export interface Settings {
  fontSize: FontSize
  theme: Theme
}

const DEFAULTS: Settings = {
  fontSize: 'medium',
  theme: 'light',
}

function isFontSize(value: unknown): value is FontSize {
  return value === 'small' || value === 'medium' || value === 'large'
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function readSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULTS }
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ...DEFAULTS }
    }
    const candidate = parsed as Partial<Settings>
    return {
      fontSize: isFontSize(candidate.fontSize) ? candidate.fontSize : DEFAULTS.fontSize,
      theme: isTheme(candidate.theme) ? candidate.theme : DEFAULTS.theme,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export interface UseSettingsResult {
  settings: Settings
  setFontSize: (fontSize: FontSize) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(readSettings)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }

    const root = document.documentElement
    root.dataset.theme = settings.theme
    root.dataset.fontSize = settings.fontSize
  }, [settings])

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings((previous) => ({ ...previous, fontSize }))
  }, [])

  const setTheme = useCallback((theme: Theme) => {
    setSettings((previous) => ({ ...previous, theme }))
  }, [])

  const toggleTheme = useCallback(() => {
    setSettings((previous) => ({
      ...previous,
      theme: previous.theme === 'light' ? 'dark' : 'light',
    }))
  }, [])

  return { settings, setFontSize, setTheme, toggleTheme }
}
