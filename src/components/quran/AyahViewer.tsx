import { useEffect, useMemo, useRef } from 'react'
import type { Surah } from '../../utils/loadQuranData'
import { fixTanweenDisplay } from '../../utils/fixTanweenDisplay'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join('')
}

interface AyahViewerProps {
  surah: Surah
  targetAyah: number | null
  isBookmarked: (surahNumber: number, ayahNumber: number) => boolean
  onToggleBookmark: (surahNumber: number, ayahNumber: number) => void
  onAyahClick: (ayahNumber: number) => void
  onVisibleAyahChange: (ayahNumber: number) => void
}

export function AyahViewer({
  surah,
  targetAyah,
  isBookmarked,
  onToggleBookmark,
  onAyahClick,
  onVisibleAyahChange,
}: AyahViewerProps) {
  const ayahRefs = useRef(new Map<number, HTMLElement>())
  const targetAyahRef = useRef<number | null>(null)

  const ayahIds = useMemo(() => surah.ayahs.map((ayah) => ayah.number), [surah])

  useEffect(() => {
    if (targetAyah != null && targetAyah !== targetAyahRef.current) {
      targetAyahRef.current = targetAyah
      const target = ayahRefs.current.get(targetAyah)
      if (target) {
        target.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    }
  }, [targetAyah, surah])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const top = visible[0]
          const number = Number((top.target as HTMLElement).dataset.ayahNumber)
          onVisibleAyahChange(number)
        }
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )

    ayahIds.forEach((number) => {
      const element = ayahRefs.current.get(number)
      if (element) {
        observer.observe(element)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [ayahIds, onVisibleAyahChange])

  return (
    <section className="ayah-viewer" aria-label={`سورة ${surah.name_ar}`}>
      <header className="surah-header">
        <h2>{surah.name_ar}</h2>
        <p className="surah-meta">
          {surah.name_en} — {toArabicDigits(surah.ayahs_count)} آيات
        </p>
      </header>
      <div className="ayah-list">
        {surah.ayahs.map((ayah) => {
          const bookmarked = isBookmarked(surah.number, ayah.number_in_surah)
          return (
            <article
              className={`ayah${bookmarked ? ' is-bookmarked' : ''}`}
              key={ayah.number}
              data-ayah-number={ayah.number_in_surah}
              ref={(element) => {
                if (element) {
                  ayahRefs.current.set(ayah.number_in_surah, element)
                } else {
                  ayahRefs.current.delete(ayah.number_in_surah)
                }
              }}
            >
              <div className="ayah-actions">
                <button
                  type="button"
                  className={`bookmark-btn${bookmarked ? ' is-active' : ''}`}
                  aria-label={
                    bookmarked
                      ? `إزالة الإشارة المرجعية للآية ${toArabicDigits(ayah.number_in_surah)}`
                      : `إضافة إشارة مرجعية للآية ${toArabicDigits(ayah.number_in_surah)}`
                  }
                  aria-pressed={bookmarked}
                  onClick={() => onToggleBookmark(surah.number, ayah.number_in_surah)}
                >
                  {bookmarked ? '★' : '☆'}
                </button>
              </div>
              <button
                type="button"
                className="ayah-text-btn"
                aria-label={`عرض التفسير الميسر للآية ${toArabicDigits(ayah.number_in_surah)}`}
                onClick={() => onAyahClick(ayah.number_in_surah)}
              >
                <span className="ayah-text">
                  <span>{fixTanweenDisplay(ayah.arabic_text)}</span>
                  <span
                    className="ayah-number"
                    role="note"
                    aria-label={`نهاية الآية ${toArabicDigits(ayah.number_in_surah)}`}
                  >
                    {'\u06DD'}
                    {toArabicDigits(ayah.number_in_surah)}
                  </span>
                </span>
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
