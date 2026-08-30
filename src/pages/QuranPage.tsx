import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuran } from '../hooks/useQuran'
import { useTafseer } from '../hooks/useTafseer'
import { useBookmarks } from '../hooks/useBookmarks'
import { useReadingProgress } from '../hooks/useReadingProgress'
import type { QuranData } from '../utils/loadQuranData'
import { SurahList } from '../components/quran/SurahList'
import { AyahViewer } from '../components/quran/AyahViewer'
import { TafseerPanel } from '../components/quran/TafseerPanel'
import { SearchBar } from '../components/quran/SearchBar'
import { fixTanweenDisplay } from '../utils/fixTanweenDisplay'

interface QuranPageProps {
  onOpenSettings: () => void
}

interface NavigationTarget {
  surahNumber: number
  ayahNumber: number | null
}

function parseNavigationHash(): NavigationTarget | null {
  const match = window.location.hash.match(/^#\/surah\/(\d+)(?:\/(\d+))?$/)
  if (!match) {
    return null
  }
  const surahNumber = Number(match[1])
  const ayahNumber = match[2] != null ? Number(match[2]) : null
  if (!Number.isFinite(surahNumber) || (ayahNumber != null && !Number.isFinite(ayahNumber))) {
    return null
  }
  return { surahNumber, ayahNumber }
}

export function QuranPage({ onOpenSettings }: QuranPageProps) {
  const { surahs, currentSurah, isLoading, error, selectSurah } = useQuran()
  const { isLoading: isTafseerLoading, error: tafseerError, getTafseer } = useTafseer()
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const { position, savePosition } = useReadingProgress()

  const [navTarget, setNavTarget] = useState<NavigationTarget | null>(
    () => parseNavigationHash(),
  )
  const [selectedAyah, setSelectedAyah] = useState<number | null>(null)
  const resumeDoneRef = useRef<boolean>(navTarget != null)

  const applyNavTarget = useCallback((target: NavigationTarget | null) => {
    if (target) {
      setNavTarget(target)
    }
  }, [])

  const resumeFromProgress = useCallback(() => {
    if (resumeDoneRef.current || !position) {
      return
    }
    resumeDoneRef.current = true
    applyNavTarget({ surahNumber: position.surahNumber, ayahNumber: position.ayahNumber })
  }, [position, applyNavTarget])

  useEffect(() => {
    if (!isLoading && currentSurah) {
      resumeFromProgress()
    }
  }, [isLoading, currentSurah, resumeFromProgress])

  useEffect(() => {
    const handleHashChange = () => {
      const target = parseNavigationHash()
      if (target) {
        resumeDoneRef.current = true
        applyNavTarget(target)
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [applyNavTarget])

  useEffect(() => {
    if (navTarget) {
      selectSurah(navTarget.surahNumber)
    }
  }, [navTarget, selectSurah])

  const handleSurahSelect = useCallback((number: number) => {
    setNavTarget({ surahNumber: number, ayahNumber: null })
  }, [])

  const handleSearchNavigate = useCallback((surahNumber: number, ayahNumber: number | null) => {
    setNavTarget({ surahNumber, ayahNumber })
  }, [])

  const handleAyahClick = useCallback((ayahNumber: number) => {
    setSelectedAyah(ayahNumber)
  }, [])

  const handleVisibleAyahChange = useCallback(
    (ayahNumber: number) => {
      if (currentSurah) {
        savePosition(currentSurah.number, ayahNumber)
      }
    },
    [currentSurah, savePosition],
  )

  if (isLoading || isTafseerLoading) {
    return <div className="status">جارِ تحميل المصحف…</div>
  }

  if (error || tafseerError) {
    return <div className="status status--error">{error ?? tafseerError}</div>
  }

  const selectedAyahData =
    currentSurah != null && selectedAyah != null
      ? currentSurah.ayahs.find((ayah) => ayah.number_in_surah === selectedAyah) ?? null
      : null

  const selectedTafseerText =
    currentSurah != null && selectedAyah != null
      ? getTafseer(currentSurah.number, selectedAyah)
      : null

  return (
    <div className="quran-page">
      <aside className="sidebar">
        <h2 className="sidebar-title">السور</h2>
        <SearchBar quranData={{ surahs } as QuranData} onNavigate={handleSearchNavigate} />
        <div className="surah-list-scroll">
          <SurahList
            surahs={surahs}
            currentNumber={currentSurah?.number ?? null}
            onSelect={handleSurahSelect}
          />
        </div>
        <button type="button" className="sidebar-settings-btn" onClick={onOpenSettings}>
          الإعدادات
        </button>
      </aside>
      <main className="content">
        {currentSurah ? (
          <AyahViewer
            surah={currentSurah}
            targetAyah={
              navTarget?.surahNumber === currentSurah.number
                ? (navTarget.ayahNumber ?? null)
                : null
            }
            isBookmarked={isBookmarked}
            onToggleBookmark={toggleBookmark}
            onAyahClick={handleAyahClick}
            onVisibleAyahChange={handleVisibleAyahChange}
          />
        ) : (
          <div className="status">اختر سورة من القائمة</div>
        )}
      </main>

      {currentSurah != null && selectedAyahData != null && selectedTafseerText != null && (
        <TafseerPanel
          surahName={currentSurah.name_ar}
          ayahNumber={selectedAyahData.number_in_surah}
          ayahText={fixTanweenDisplay(selectedAyahData.arabic_text)}
          tafseerText={selectedTafseerText}
          onClose={() => setSelectedAyah(null)}
        />
      )}
    </div>
  )
}
