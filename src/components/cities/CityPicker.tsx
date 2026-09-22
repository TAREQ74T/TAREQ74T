import { useEffect, useMemo, useState } from 'react'
import { normalizeArabic } from '../../utils/normalizeArabic'

interface CityRow {
  id: number
  n: string
  ar: string | null
  lat: number
  lon: number
  cc: string
  country_ar: string
}

export interface CitySelection {
  lat: number
  lon: number
  name_ar: string
  country_ar: string
}

interface CityPickerProps {
  onSelect: (city: CitySelection) => void
}

const ARAB_COUNTRIES = new Set([
  'DZ', 'BH', 'KM', 'DJ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'MR',
  'OM', 'PS', 'QA', 'SA', 'SO', 'SD', 'SY', 'TN', 'AE', 'YE',
])

const MAX_RESULTS = 50

/** إزالة «ال» التعريف من بداية كل كلمة (بحث متسامح: «اللاذقية» يطابق «لاذقية»). */
function stripDefiniteArticle(text: string): string {
  return text
    .split(' ')
    .map((word) => (word.length > 3 && word.startsWith('ال') ? word.slice(2) : word))
    .join(' ')
}

function matches(city: CityRow, needle: string): boolean {
  const arabic = stripDefiniteArticle(normalizeArabic(city.ar ?? city.n))
  const latin = stripDefiniteArticle(normalizeArabic(city.n))
  return arabic.includes(needle) || latin.includes(needle)
}

/**
 * منتقي المدينة (الطبقة 1): بحث مباشر عبر كل المدن + منسدلة الدول العربية الـ22 + «أخرى».
 * يحمّل src/data/cities.json عند الطلب (chunk منفصل) ولا يلمس منطق الموقع.
 */
export function CityPicker({ onSelect }: CityPickerProps) {
  const [cities, setCities] = useState<CityRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [selected, setSelected] = useState<CitySelection | null>(null)

  useEffect(() => {
    let cancelled = false
    import('../../data/cities.json')
      .then((module) => {
        if (cancelled) return
        const rows = (module.default as { cities: CityRow[] }).cities
        setCities(rows)
      })
      .catch(() => {
        if (!cancelled) setError('تعذر تحميل قائمة المدن')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const countryOptions = useMemo(() => {
    if (!cities) return []
    const seen = new Map<string, string>()
    for (const city of cities) {
      if (ARAB_COUNTRIES.has(city.cc) && !seen.has(city.cc)) {
        seen.set(city.cc, city.country_ar)
      }
    }
    return [...seen.entries()]
      .map(([cc, name]) => ({ cc, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'))
  }, [cities])

  const needle = stripDefiniteArticle(normalizeArabic(query.trim()))

  const results = useMemo(() => {
    if (!cities) return []
    let base = cities
    if (country && country !== '__other__') {
      base = cities.filter((city) => city.cc === country)
    } else if (country === '__other__') {
      base = cities.filter((city) => !ARAB_COUNTRIES.has(city.cc))
    }
    if (!needle) {
      return base.slice(0, MAX_RESULTS)
    }
    const matched: CityRow[] = []
    for (const city of base) {
      if (matches(city, needle)) {
        matched.push(city)
        if (matched.length >= MAX_RESULTS) break
      }
    }
    return matched
  }, [cities, country, needle])

  const handleSelect = (city: CityRow) => {
    const selection: CitySelection = {
      lat: city.lat,
      lon: city.lon,
      name_ar: city.ar ?? city.n,
      country_ar: city.country_ar,
    }
    setSelected(selection)
    onSelect(selection)
  }

  return (
    <div className="city-picker" data-testid="city-picker">
      <label className="city-picker__field">
        <span>البحث عن مدينة</span>
        <input
          type="search"
          className="city-picker__search"
          data-testid="city-picker-search"
          value={query}
          placeholder="اكتب اسم المدينة…"
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>

      <label className="city-picker__field">
        <span>الدولة</span>
        <select
          className="city-picker__country"
          data-testid="city-picker-country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        >
          <option value="">كل الدول</option>
          {countryOptions.map((option) => (
            <option key={option.cc} value={option.cc}>
              {option.name}
            </option>
          ))}
          <option value="__other__">أخرى</option>
        </select>
      </label>

      {selected && (
        <p className="city-picker__selected" data-testid="city-picker-selected">
          الموقع المختار: {selected.name_ar} — {selected.country_ar}
        </p>
      )}

      {error ? (
        <p className="location-msg location-msg--error" role="alert" data-testid="city-picker-error">
          {error}
        </p>
      ) : !cities ? (
        <p className="location-msg" data-testid="city-picker-loading">
          جارٍ تحميل قائمة المدن…
        </p>
      ) : (
        <ul className="city-picker__list" data-testid="city-picker-list">
          {results.length === 0 ? (
            <li className="city-picker__empty">لا نتائج مطابقة</li>
          ) : (
            results.map((city) => (
              <li key={city.id}>
                <button
                  type="button"
                  className="city-option"
                  data-testid={`city-option-${city.id}`}
                  onClick={() => handleSelect(city)}
                >
                  <span className="city-option__name">{city.ar ?? city.n}</span>
                  {city.ar && <span className="city-option__latin">{city.n}</span>}
                  <span className="city-option__country">{city.country_ar}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
