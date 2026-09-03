import { useCallback, useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import { QuranPage } from './pages/QuranPage'
import { SettingsPage } from './pages/SettingsPage'
import { useQuran } from './hooks/useQuran'

type Route = 'quran' | 'settings'

function parseHash(): Route {
  const hash = window.location.hash
  if (hash === '#/settings') {
    return 'settings'
  }
  return 'quran'
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const { settings, setFontSize, setTheme, setTimezoneMode, setManualUtcOffsetHours } =
    useSettings()
  const { surahs, isLoading, error } = useQuran()

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash())
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  const openSettings = useCallback(() => {
    window.location.hash = '#/settings'
  }, [])

  const openQuran = useCallback(() => {
    window.location.hash = '#/'
  }, [])

  const navigateToAyah = useCallback((surahNumber: number, ayahNumber: number | null) => {
    window.location.hash = `#/surah/${surahNumber}${ayahNumber != null ? `/${ayahNumber}` : ''}`
  }, [])

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <h1>مصحف الهدى</h1>
        <p className="app-subtitle">مصحف الهدى — يقرأ القرآن الكريم دون اتصال</p>
      </header>
      {route === 'settings' ? (
        <SettingsPage
          settings={settings}
          onFontSizeChange={setFontSize}
          onThemeChange={setTheme}
          onTimezoneModeChange={setTimezoneMode}
          onManualUtcOffsetChange={setManualUtcOffsetHours}
          quranData={!isLoading && !error ? { surahs } : null}
          onNavigate={navigateToAyah}
          onBack={openQuran}
        />
      ) : (
        <QuranPage onOpenSettings={openSettings} />
      )}
    </div>
  )
}
