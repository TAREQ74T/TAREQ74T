const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)] ?? digit)
    .join('')
}

interface AyahMarkerProps {
  ayahNumber: number
  className?: string
}

/**
 * علامة نهاية الآية — حل عرض فقط.
 * النص القرآني المخزن لا يُعدَّل إطلاقاً؛ الرقم يُستخرج من number_in_surah
 * ويُعرض داخل دائرة مرسومة بالـ CSS (نمط علامة المدني الرسمي).
 */
export function AyahMarker({ ayahNumber, className }: AyahMarkerProps) {
  const classes = ['ayah-marker', className].filter(Boolean).join(' ')
  return (
    <span
      className={classes}
      role="note"
      aria-label={`نهاية الآية ${toArabicDigits(ayahNumber)}`}
      data-ayah-marker={ayahNumber}
    >
      <span className="ayah-marker__ring" aria-hidden="true" />
      <span className="ayah-marker__number">{toArabicDigits(ayahNumber)}</span>
    </span>
  )
}
