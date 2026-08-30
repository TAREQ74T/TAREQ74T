import { useMemo, useState } from 'react'
import type { QuranData, Surah } from '../../utils/loadQuranData'
import { normalizeArabic } from '../../utils/normalizeArabic'
import { fixTanweenDisplay } from '../../utils/fixTanweenDisplay'

export interface SearchResult {
  kind: 'surah' | 'ayah'
  surah: Surah
  ayahNumber: number | null
  matchText: string
}

interface SearchBarProps {
  quranData: QuranData
  onNavigate: (surahNumber: number, ayahNumber: number | null) => void
}

const MAX_RESULTS = 40

export function SearchBar({ quranData, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('')

  const normalizedCorpus = useMemo(
    () =>
      quranData.surahs.map((surah) => ({
        surah,
        name: normalizeArabic(surah.name_ar),
        ayahs: surah.ayahs.map((ayah) => ({
          ayah,
          text: normalizeArabic(ayah.arabic_text),
        })),
      })),
    [quranData],
  )

  const results = useMemo<SearchResult[]>(() => {
    const term = query.trim()
    if (term.length < 2) {
      return []
    }
    const normalizedTerm = normalizeArabic(term)
    const lowerTerm = term.toLowerCase()
    const out: SearchResult[] = []

    for (const { surah, name } of normalizedCorpus) {
      if (
        surah.name_ar.includes(term) ||
        name.includes(normalizedTerm) ||
        surah.name_en.toLowerCase().includes(lowerTerm)
      ) {
        out.push({ kind: 'surah', surah, ayahNumber: null, matchText: surah.name_ar })
      }
    }

    if (out.length < MAX_RESULTS) {
      for (const { surah, ayahs } of normalizedCorpus) {
        for (const { ayah, text } of ayahs) {
          if (ayah.arabic_text.includes(term) || text.includes(normalizedTerm)) {
            out.push({
              kind: 'ayah',
              surah,
              ayahNumber: ayah.number_in_surah,
              matchText: fixTanweenDisplay(ayah.arabic_text),
            })
            if (out.length >= MAX_RESULTS) {
              break
            }
          }
        }
        if (out.length >= MAX_RESULTS) {
          break
        }
      }
    }

    return out
  }, [query, normalizedCorpus])

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.surah.number, result.ayahNumber)
  }

  return (
    <div className="search-bar">
      <label htmlFor="quran-search" className="search-bar__label">
        البحث في القرآن الكريم
      </label>
      <input
        id="quran-search"
        type="search"
        className="search-bar__input"
        placeholder="اكتب كلمة أو اسم سورة…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoComplete="off"
      />
      {query.trim().length >= 2 && (
        <ul className="search-results" role="listbox" aria-label="نتائج البحث">
          {results.length === 0 && (
            <li className="search-results__empty">لا نتائج مطابقة</li>
          )}
          {results.map((result, index) => (
            <li key={`${result.surah.number}-${result.ayahNumber ?? 0}-${index}`}>
              <button
                type="button"
                className="search-result"
                onClick={() => handleSelect(result)}
              >
                <span className="search-result__meta">
                  {result.surah.name_ar}
                  {result.ayahNumber != null && ` — ${result.ayahNumber}`}
                </span>
                <span className="search-result__text">
                  {result.kind === 'ayah' ? result.matchText : result.surah.name_en}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
