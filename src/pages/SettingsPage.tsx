import { useBookmarks } from '../hooks/useBookmarks'
import { useReadingProgress } from '../hooks/useReadingProgress'
import type { Settings, FontSize, Theme, TimezoneMode } from '../hooks/useSettings'
import { FontSizeControl } from '../components/settings/FontSizeControl'
import { ThemeToggle } from '../components/settings/ThemeToggle'
import { QiblaCompass } from '../components/qibla/QiblaCompass'
import { useLocation } from '../hooks/useLocation'
import { usePrayerTimes } from '../hooks/usePrayerTimes'
import { useHijriDate } from '../hooks/useHijriDate'
import { LocationInput } from '../components/prayer-times/LocationInput'
import { PrayerAdjustmentsEditor } from '../components/prayer-times/PrayerAdjustmentsEditor'
import { HijriDateDisplay } from '../components/prayer-times/HijriDateDisplay'
import { effectiveUtcOffsetMinutes, formatPrayerTime, localTimeShiftMinutes } from '../utils/prayer-times'
import { UTC_OFFSET_MAX, UTC_OFFSET_MIN } from '../storage/settings'
import type { QuranData, Surah } from '../utils/loadQuranData'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
    .join('')
}

interface SettingsPageProps {
  settings: Settings
  onFontSizeChange: (fontSize: FontSize) => void
  onThemeChange: (theme: Theme) => void
  onTimezoneModeChange: (mode: TimezoneMode) => void
  onManualUtcOffsetChange: (hours: number) => void
  quranData: QuranData | null
  onNavigate: (surahNumber: number, ayahNumber: number | null) => void
  onBack: () => void
}

export function SettingsPage({
  settings,
  onFontSizeChange,
  onThemeChange,
  onTimezoneModeChange,
  onManualUtcOffsetChange,
  quranData,
  onNavigate,
  onBack,
}: SettingsPageProps) {
  const { bookmarks, removeBookmark, clearBookmarks } = useBookmarks()
  const { position, clearPosition } = useReadingProgress()
  const location = useLocation()
  const hijri = useHijriDate()
  const utcOffsetMinutes = effectiveUtcOffsetMinutes(
    location.coords,
    settings.timezoneMode,
    settings.manualUtcOffsetHours,
  )
  const prayerTimes = usePrayerTimes(location.coords, utcOffsetMinutes)

  const surahName = (surahNumber: number): string => {
    const surah = quranData?.surahs.find((s: Surah) => s.number === surahNumber)
    return surah?.name_ar ?? `سورة ${toArabicDigits(surahNumber)}`
  }

  const timezoneOffsetLabel =
    settings.timezoneMode === 'manual'
      ? `${settings.manualUtcOffsetHours > 0 ? '+' : ''}${toArabicDigits(settings.manualUtcOffsetHours)} UTC`
      : `${toArabicDigits(Math.round(utcOffsetMinutes / 60))} UTC (تلقائي من خط الطول)`

  return (
    <div className="settings-page">
      <header className="settings-page__header">
        <h2>الإعدادات</h2>
        <button type="button" className="settings-back-btn" onClick={onBack}>
          ← العودة إلى القراءة
        </button>
      </header>

      <QiblaCompass />

      <section className="setting-group">
        <h3 className="setting-group__title">الموقع</h3>
        <LocationInput location={location} utcOffsetMinutes={utcOffsetMinutes} />
      </section>

      <section className="setting-group" data-testid="timezone-group">
        <h3 className="setting-group__title">التوقيت (إزاحة UTC)</h3>
        <div className="timezone-mode-options" role="radiogroup" aria-label="وضع الإزاحة">
          <button
            type="button"
            className={`theme-option${settings.timezoneMode === 'auto' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={settings.timezoneMode === 'auto'}
            data-testid="tz-auto"
            onClick={() => onTimezoneModeChange('auto')}
          >
            تلقائي (من خط الطول)
          </button>
          <button
            type="button"
            className={`theme-option${settings.timezoneMode === 'manual' ? ' is-active' : ''}`}
            role="radio"
            aria-checked={settings.timezoneMode === 'manual'}
            data-testid="tz-manual"
            onClick={() => onTimezoneModeChange('manual')}
          >
            يدوي
          </button>
        </div>

        {settings.timezoneMode === 'manual' && (
          <div className="timezone-manual" data-testid="tz-manual-fields">
            <label className="location-form__field">
              <span>الإزاحة بالساعات ({toArabicDigits(UTC_OFFSET_MIN)} إلى {toArabicDigits(UTC_OFFSET_MAX)})</span>
              <input
                type="number"
                step={1}
                min={UTC_OFFSET_MIN}
                max={UTC_OFFSET_MAX}
                value={settings.manualUtcOffsetHours}
                data-testid="tz-manual-input"
                onChange={(event) => onManualUtcOffsetChange(Number(event.target.value))}
              />
            </label>
            <input
              type="range"
              min={UTC_OFFSET_MIN}
              max={UTC_OFFSET_MAX}
              step={1}
              value={settings.manualUtcOffsetHours}
              data-testid="tz-manual-range"
              aria-label="إزاحة UTC بالساعات"
              onChange={(event) => onManualUtcOffsetChange(Number(event.target.value))}
            />
            <p className="location-msg">
              الوضع اليدوي له الأولوية على الموقع في حساب أوقات الصلاة.
            </p>
          </div>
        )}

        <div className="timezone-preview">
          <span className="timezone-preview__label">الإزاحة الفعلية</span>
          <span className="timezone-preview__value" data-testid="tz-effective">
            {timezoneOffsetLabel}
          </span>
        </div>
        <div className="timezone-preview">
          <span className="timezone-preview__label">معاينة الوقت الحالي</span>
          <span className="timezone-preview__value" data-testid="tz-preview">
            {formatPrayerTime(
              new Date(),
              localTimeShiftMinutes(utcOffsetMinutes, new Date()),
            )}
          </span>
        </div>
      </section>

      <section className="setting-group">
        <h3 className="setting-group__title">أوقات الصلاة (خطوة دقيقة)</h3>
        <PrayerAdjustmentsEditor
          prayerTimes={prayerTimes}
          utcOffsetMinutes={utcOffsetMinutes}
        />
      </section>

      <section className="setting-group">
        <h3 className="setting-group__title">التاريخ الهجري (إزاحة الأيام)</h3>
        <HijriDateDisplay hijri={hijri} />
      </section>

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
