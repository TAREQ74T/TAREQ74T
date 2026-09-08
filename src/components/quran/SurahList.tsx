import type { Surah } from '../../utils/loadQuranData'

interface SurahListProps {
  surahs: Surah[]
  currentNumber: number | null
  onSelect: (number: number) => void
}

export function SurahList({ surahs, currentNumber, onSelect }: SurahListProps) {
  return (
    <nav className="surah-list" aria-label="قائمة السور">
      <ul>
        {surahs.map((surah) => (
          <li key={surah.number}>
            <button
              type="button"
              className={surah.number === currentNumber ? 'surah-item is-active' : 'surah-item'}
              onClick={() => onSelect(surah.number)}
            >
              <span className="surah-number">{surah.number}</span>
              <span className="surah-name">{surah.name_ar}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
