import { useQuran } from '../hooks/useQuran'
import { SurahList } from '../components/quran/SurahList'
import { AyahViewer } from '../components/quran/AyahViewer'

export function QuranPage() {
  const { surahs, currentSurah, isLoading, error, selectSurah } = useQuran()

  if (isLoading) {
    return <div className="status">جارِ تحميل المصحف…</div>
  }

  if (error) {
    return <div className="status status--error">{error}</div>
  }

  return (
    <div className="quran-page">
      <aside className="sidebar">
        <h2 className="sidebar-title">السور</h2>
        <SurahList
          surahs={surahs}
          currentNumber={currentSurah?.number ?? null}
          onSelect={selectSurah}
        />
      </aside>
      <main className="content">
        {currentSurah ? (
          <AyahViewer surah={currentSurah} />
        ) : (
          <div className="status">اختر سورة من القائمة</div>
        )}
      </main>
    </div>
  )
}
