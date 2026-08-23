import type { Surah } from '../../utils/loadQuranData'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join('')
}

interface AyahViewerProps {
  surah: Surah
}

export function AyahViewer({ surah }: AyahViewerProps) {
  return (
    <section className="ayah-viewer" aria-label={`سورة ${surah.name_ar}`}>
      <header className="surah-header">
        <h2>{surah.name_ar}</h2>
        <p className="surah-meta">
          {surah.name_en} — {toArabicDigits(surah.ayahs_count)} آيات
        </p>
      </header>
      <div className="ayah-list">
        {surah.ayahs.map((ayah) => (
          <article className="ayah" key={ayah.number}>
            <p className="ayah-text">
              <span>{ayah.arabic_text}</span>
              <span
                className="ayah-number"
                role="note"
                aria-label={`نهاية الآية ${toArabicDigits(ayah.number_in_surah)}`}
              >
                {'\u06DD'}
                {toArabicDigits(ayah.number_in_surah)}
              </span>
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}
