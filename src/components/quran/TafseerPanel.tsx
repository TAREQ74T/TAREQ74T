import { useEffect } from 'react'
import { parseTafseerText } from '../../utils/formatTafseer'
import type { TafseerBlock } from '../../utils/formatTafseer'

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

function toArabicDigits(value: number): string {
  return String(value)
    .split('')
    .map((digit) => ARABIC_DIGITS[Number(digit)])
    .join('')
}

interface TafseerPanelProps {
  surahName: string
  ayahNumber: number
  ayahText: string
  tafseerText: string
  onClose: () => void
}

export function TafseerPanel({ surahName, ayahNumber, ayahText, tafseerText, onClose }: TafseerPanelProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const blocks: TafseerBlock[] = parseTafseerText(tafseerText)

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="tafseer-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={`التفسير الميسر للآية ${toArabicDigits(ayahNumber)} من سورة ${surahName}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="tafseer-sheet__header">
          <div className="tafseer-sheet__title">
            <span className="tafseer-sheet__surah">{surahName}</span>
            <span className="tafseer-sheet__ayah">
              الآية {toArabicDigits(ayahNumber)}
            </span>
          </div>
          <button type="button" className="sheet-close" aria-label="إغلاق" onClick={onClose}>
            ×
          </button>
        </header>

        <blockquote className="tafseer-sheet__ayah-text">{ayahText}</blockquote>

        <div className="tafseer-sheet__body">
          {blocks.map((block, index) => {
            if (block.kind === 'heading') {
              return (
                <h3 className="tafseer-sheet__heading" key={index}>
                  {block.text}
                </h3>
              )
            }
            if (block.kind === 'divider') {
              return (
                <div className="tafseer-sheet__divider" key={index}>
                  {block.text}
                </div>
              )
            }
            return (
              <p className="tafseer-sheet__paragraph" key={index}>
                {block.text}
              </p>
            )
          })}
        </div>
      </section>
    </div>
  )
}
