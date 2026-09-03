import { useCallback, useEffect, useState } from 'react'
import {
  readManualUtcOffsetHours,
  readTimezoneMode,
  resetTimezone as resetStoredTimezone,
  writeManualUtcOffsetHours,
  writeTimezoneMode,
  type TimezoneMode,
} from '../storage/settings'

export type FontSize = 'small' | 'medium' | 'large'
export type Theme = 'light' | 'dark'
export type { TimezoneMode } from '../storage/settings'

const STORAGE_KEY = 'mushaf-al-huda:settings'

export interface Settings {
  fontSize: FontSize
  theme: Theme
  timezoneMode: TimezoneMode
  manualUtcOffsetHours: number
}

const DEFAULTS: Settings = {
  fontSize: 'medium',
  theme: 'light',
  timezoneMode: 'auto',
  manualUtcOffsetHours: 0,
}

function isFontSize(value: unknown): value is FontSize {
  return value === 'small' || value === 'medium' || value === 'large'
}

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark'
}

function readBaseSettings(): Pick<Settings, 'fontSize' | 'theme'> {
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

function readSettings(): Settings {
  return {
    ...readBaseSettings(),
    timezoneMode: readTimezoneMode(),
    manualUtcOffsetHours: readManualUtcOffsetHours(),
  }
}

export interface UseSettingsResult {
  settings: Settings
  setFontSize: (fontSize: FontSize) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setTimezoneMode: (mode: TimezoneMode) => void
  setManualUtcOffsetHours: (hours: number) => void
  resetTimezone: () => void
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<Settings>(readSettings)

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ fontSize: settings.fontSize, theme: settings.theme }),
      )
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
    writeTimezoneMode(settings.timezoneMode)
    writeManualUtcOffsetHours(settings.manualUtcOffsetHours)

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

  const setTimezoneMode = useCallback((timezoneMode: TimezoneMode) => {
    setSettings((previous) => ({ ...previous, timezoneMode }))
  }, [])

  const setManualUtcOffsetHours = useCallback((manualUtcOffsetHours: number) => {
    setSettings((previous) => ({ ...previous, manualUtcOffsetHours }))
  }, [])

  const resetTimezone = useCallback(() => {
    setSettings((previous) => ({ ...previous, ...resetStoredTimezone() }))
  }, [])

  return {
    settings,
    setFontSize,
    setTheme,
    toggleTheme,
    setTimezoneMode,
    setManualUtcOffsetHours,
    resetTimezone,
  }
}
