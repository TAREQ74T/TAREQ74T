import { useEffect, useState } from 'react'
import { fixTanweenDisplay } from '../../utils/fixTanweenDisplay'
import { getAboutSnippets } from '../../utils/quranSelectors'
import type { AboutSnippet } from '../../utils/quranSelectors'
import { APP_VERSION } from '../../utils/version'

interface AboutScreenProps {
  onBack: () => void
}

/**
 * شاشة «حول التطبيق» — تعرض سطرَي دعاء فقط (مقتطف من نوح 71:28 ثم مقتطف من
 * الإسراء 17:24)، مستخرجَين آلياً من quran_full.json عبر getAyahPart دون أي
 * نص مكتوب يدوياً، ثم سطر الإنشاء ثم رقم الإصدار (يُقرأ من package.json).
 */
export function AboutScreen({ onBack }: AboutScreenProps) {
  const [snippets, setSnippets] = useState<AboutSnippet[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getAboutSnippets()
      .then((loaded) => {
        if (!cancelled) {
          setSnippets(loaded)
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) {
          return
        }
        setError(
          cause instanceof Error
            ? cause.message
            : 'تعذر تحميل مقتطفَي الدعاء من المصدر',
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="about-page" data-testid="about-screen">
      <header className="settings-page__header">
        <h2>حول التطبيق</h2>
        <button type="button" className="settings-back-btn" onClick={onBack}>
          ← العودة إلى القراءة
        </button>
      </header>

      {error ? (
        <p className="progress-info" role="alert" data-testid="about-error">
          {error}
        </p>
      ) : !snippets ? (
        <p className="progress-info" data-testid="about-loading">
          جارٍ تحميل المقتطفات من المصدر…
        </p>
      ) : (
        <section className="about-card">
          <p className="about-dua" data-testid="about-ayah-1">
            {fixTanweenDisplay(snippets[0].text)}
          </p>

          <span className="about-ornament" aria-hidden="true" />

          <p className="about-dua" data-testid="about-ayah-2">
            {fixTanweenDisplay(snippets[1].text)}
          </p>

          <p className="about-credit" data-testid="about-attribution">
            تم إنشاء التطبيق بفضل الله بواسطة طارق
          </p>
          <p className="about-version" data-testid="about-version">
            رقم الإصدار: {APP_VERSION}
          </p>
        </section>
      )}
    </div>
  )
}
