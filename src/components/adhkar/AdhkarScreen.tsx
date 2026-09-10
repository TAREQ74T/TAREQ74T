import adhkarData from '../../data/adhkar.json'

interface AdhkarItem {
  id: number | string
  text: string
  count?: number
}

interface AdhkarChapter {
  id: number | string
  category: string
  items: AdhkarItem[]
}

function isAdhkarChapter(value: unknown): value is AdhkarChapter {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const chapter = value as Record<string, unknown>
  if (typeof chapter.category !== 'string' || chapter.category.length === 0) {
    return false
  }
  if (!Array.isArray(chapter.items) || chapter.items.length === 0) {
    return false
  }
  return chapter.items.every((rawItem) => {
    if (typeof rawItem !== 'object' || rawItem === null) {
      return false
    }
    const item = rawItem as Record<string, unknown>
    return typeof item.text === 'string' && item.text.length > 0 && !item.text.includes('\uFFFD')
  })
}

const chapter = adhkarData as unknown

function hasInvalidText(): boolean {
  if (!isAdhkarChapter(chapter)) {
    return true
  }
  return chapter.items.some((item) => typeof item.text !== 'string' || item.text.trim().length === 0)
}

export function AdhkarScreen() {
  if (hasInvalidText()) {
    return (
      <div className="adhkar-screen" data-testid="adhkar-error">
        <p className="status status--error">
          تعذر تحميل الأذكار — بيانات المصدر غير صالحة.
        </p>
      </div>
    )
  }

  const validChapter = chapter as AdhkarChapter

  return (
    <section className="adhkar-screen" aria-label={validChapter.category}>
      <h3 className="adhkar-screen__title">{validChapter.category}</h3>
      <ul className="adhkar-list">
        {validChapter.items.map((item) => (
          <li className="adhkar-card" key={String(item.id)}>
            <p className="adhkar-card__text">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
