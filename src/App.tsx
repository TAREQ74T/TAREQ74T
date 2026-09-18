import { useCallback, useEffect, useState } from 'react'
import { useSettings } from './hooks/useSettings'
import { QuranPage } from './pages/QuranPage'
import { PrayerPage } from './pages/PrayerPage'
import { SettingsPage } from './pages/SettingsPage'
import { AdhkarPage } from './pages/AdhkarPage'
import { AboutPage } from './pages/AboutPage'
import { PalettePreviewPage } from './pages/PalettePreviewPage'
import { BottomNav } from './components/nav/BottomNav'
import type { NavRoute } from './components/nav/BottomNav'
import { SplashScreen } from './components/splash/SplashScreen'
import { useQuran } from './hooks/useQuran'
import { useNotifications } from './hooks/useNotifications'

type Route = NavRoute | 'about' | 'palette-preview'

function parseHash(): Route {
  const hash = window.location.hash
  if (hash === '#/palette-preview') {
    return 'palette-preview'
  }
  if (hash === '#/prayer') {
    return 'prayer'
  }
  if (hash === '#/adhkar') {
    return 'adhkar'
  }
  if (hash === '#/settings/about') {
    return 'about'
  }
  if (hash === '#/settings') {
    return 'settings'
  }
  return 'quran'
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash)
  const {
    settings,
    setFontSize,
    setTheme,
    setTimezoneMode,
    setManualUtcOffsetHours,
    setHapticsEnabled,
  } = useSettings({ applyTheme: route !== 'palette-preview' })
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
    window.location.hash = '#/settings/about'
  }, [])

  const openQuran = useCallback(() => {
    window.location.hash = '#/'
  }, [])

  const navigateToAyah = useCallback((surahNumber: number, ayahNumber: number | null) => {
    window.location.hash = `#/surah/${surahNumber}${ayahNumber != null ? `/${ayahNumber}` : ''}`
  }, [])

  if (route === 'palette-preview') {
    return <PalettePreviewPage />
  }

  const navActive: NavRoute = route === 'about' ? 'settings' : route

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
          onHapticsChange={setHapticsEnabled}
          quranData={!isLoading && !error ? { surahs } : null}
          onNavigate={navigateToAyah}
          onOpenAbout={openAbout}
          notifications={notifications}
          onBack={openQuran}
        />
      ) : route === 'about' ? (
        <AboutPage onBack={openSettings} />
      ) : route === 'prayer' ? (
        <PrayerPage hapticsEnabled={settings.hapticsEnabled} />
      ) : route === 'adhkar' ? (
        <AdhkarPage onBack={openQuran} />
      ) : (
        <QuranPage />
      )}
      <BottomNav active={navActive} />
    </div>
  )
}
