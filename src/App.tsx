import { useCallback, useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import { QuranPage } from './pages/QuranPage'
import { SettingsPage } from './pages/SettingsPage'
import { AboutScreen } from './components/about/AboutScreen'
import { SplashScreen } from './components/splash/SplashScreen'
import { useQuran } from './hooks/useQuran'
import { useNotifications } from './hooks/useNotifications'

type Route = 'quran' | 'settings' | 'about'

function parseHash(): Route {
  const hash = window.location.hash
  if (hash === '#/settings') {
    return 'settings'
  }
  if (hash === '#/about') {
    return 'about'
  }
  return 'quran'
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const { settings, setFontSize, setTheme, setTimezoneMode, setManualUtcOffsetHours } =
    useSettings()
  const { surahs, isLoading, error } = useQuran()
  const notifications = useNotifications()

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

  const openAbout = useCallback(() => {
    window.location.hash = '#/about'
  }, [])

  const openQuran = useCallback(() => {
    window.location.hash = '#/'
  }, [])

  const navigateToAyah = useCallback((surahNumber: number, ayahNumber: number | null) => {
    window.location.hash = `#/surah/${surahNumber}${ayahNumber != null ? `/${ayahNumber}` : ''}`
  }, [])

  return (
    <div className="app" dir="rtl">
      <SplashScreen />
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
          onOpenAbout={openAbout}
          notifications={notifications}
          onBack={openQuran}
        />
      ) : route === 'about' ? (
        <AboutScreen onBack={openQuran} />
      ) : (
        <QuranPage onOpenSettings={openSettings} />
      )}
    </div>
  )
}
