import tafseerDataUrl from '../data/tafseer_full.json?url'

export interface TafseerData {
  surahs: Record<string, Record<string, string>>
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`tafseer_full.json: ${message}`)
  }
}

function validate(data: unknown): TafseerData {
  assert(typeof data === 'object' && data !== null, 'البيانات يجب أن تكون كائناً')
  const root = data as Record<string, unknown>

  assert(typeof root.surahs === 'object' && root.surahs !== null, 'حقل surahs مفقود')
  const surahsMap = root.surahs as Record<string, unknown>

  const surahKeys = Object.keys(surahsMap)
  assert(surahKeys.length === 114, `عدد السور يجب أن يكون 114، والموجود ${surahKeys.length}`)

  const surahs: Record<string, Record<string, string>> = {}
  for (const [surahNumber, ayahsRaw] of Object.entries(surahsMap)) {
    assert(typeof ayahsRaw === 'object' && ayahsRaw !== null, `سورة ${surahNumber}: بنية غير صالحة`)
    const ayahsMap = ayahsRaw as Record<string, unknown>
    const ayahs: Record<string, string> = {}
    for (const [ayahNumber, textRaw] of Object.entries(ayahsMap)) {
      assert(typeof textRaw === 'string' && textRaw.length > 0, `سورة ${surahNumber} آية ${ayahNumber}: النص مفقود أو فارغ`)
      ayahs[ayahNumber] = textRaw
    }
    surahs[surahNumber] = ayahs
  }

  return { surahs }
}

let cached: TafseerData | null = null

export async function loadTafseerData(): Promise<TafseerData> {
  if (cached) {
    return cached
  }
  const response = await fetch(tafseerDataUrl)
  if (!response.ok) {
    throw new Error(`تعذر تحميل ملف التفسير (${response.status})`)
  }
  const data = validate(await response.json())
  cached = data
  return data
}
