import { useBookmarks } from '../hooks/useBookmarks'
import { useReadingProgress } from '../hooks/useReadingProgress'
import type { Settings, FontSize, Theme } from '../hooks/useSettings'
import { FontSizeControl } from '../components/settings/FontSizeControl'
import { ThemeToggle } from '../components/settings/ThemeToggle'
import type { QuranData, Surah } from '../utils/loadQuranData'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join('')
}

interface SettingsPageProps {
  settings: Settings
  onFontSizeChange: (fontSize: FontSize) => void
  onThemeChange: (theme: Theme) => void
  quranData: QuranData | null
  onNavigate: (surahNumber: number, ayahNumber: number | null) => void
  onBack: () => void
}

export function SettingsPage({
  settings,
  onFontSizeChange,
  onThemeChange,
  quranData,
  onNavigate,
  onBack,
}: SettingsPageProps) {
  const { bookmarks, removeBookmark, clearBookmarks } = useBookmarks()
  const { position, clearPosition } = useReadingProgress()

  const surahName = (surahNumber: number): string => {
    const surah = quranData?.surahs.find((s: Surah) => s.number === surahNumber)
    return surah?.name_ar ?? `سورة ${toArabicDigits(surahNumber)}`
  }

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h2>الإعدادات</h2>
        <button type="button" className="settings-back-btn" onClick={onBack}>
          ← العودة إلى القراءة
        </button>
      </header>

      <FontSizeControl fontSize={settings.fontSize} onChange={onFontSizeChange} />
      <ThemeToggle theme={settings.theme} onChange={onThemeChange} />

      <section className="setting-group">
        <h3 className="setting-group__title">آخر موضع قراءة</h3>
        {position ? (
          <div className="progress-info">
            <p>
              {surahName(position.surahNumber)} — الآية{' '}
              {toArabicDigits(position.ayahNumber)}
            </p>
            <div className="progress-actions">
              <button
                type="button"
                className="btn"
                onClick={() => onNavigate(position.surahNumber, position.ayahNumber)}
              >
                استئناف القراءة
              </button>
              <button type="button" className="btn btn--ghost" onClick={clearPosition}>
                مسح الموضع
              </button>
            </div>
          </div>
        ) : (
          <p className="progress-info">لا يوجد موضع قراءة محفوظ بعد.</p>
        )}
      </section>

      <section className="setting-group">
        <h3 className="setting-group__title">الإشارات المرجعية ({bookmarks.length})</h3>
        {bookmarks.length === 0 ? (
          <p className="progress-info">لا توجد إشارات مرجعية بعد.</p>
        ) : (
          <>
            <ul className="bookmark-list">
              {bookmarks.map((bookmark, index) => (
                <li className="bookmark-item" key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`}>
                  <button
                    type="button"
                    className="bookmark-item__link"
                    onClick={() =>
                      onNavigate(bookmark.surahNumber, bookmark.ayahNumber)
                    }
                  >
                    {surahName(bookmark.surahNumber)} — الآية{' '}
                    {toArabicDigits(bookmark.ayahNumber)}
                  </button>
                  <button
                    type="button"
                    className="bookmark-item__remove"
                    aria-label={`حذف الإشارة المرجعية`}
                    onClick={() => removeBookmark(index)}
                  >
                    إزالة
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--danger" onClick={clearBookmarks}>
              مسح جميع الإشارات
            </button>
          </>
        )}
      </section>
    </div>
  )
}
