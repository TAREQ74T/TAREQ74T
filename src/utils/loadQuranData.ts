export interface TafseerEntry {
  tafseer_id: string
  text: string
}

export interface Ayah {
  number: number
  number_in_surah: number
  arabic_text: string
  tafseer: TafseerEntry[]
}

export interface Surah {
  number: number
  name_ar: string
  name_en: string
  ayahs_count: number
  ayahs: Ayah[]
}

export interface QuranData {
  surahs: Surah[]
}

import quranSample from '../data/quran_sample.json'

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`quran_sample.json: ${message}`)
  }
}

function validate(data: unknown): QuranData {
  assert(typeof data === 'object' && data !== null, 'البيانات يجب أن تكون كائناً')
  const root = data as Record<string, unknown>

  assert(Array.isArray(root.surahs) && root.surahs.length > 0, 'حقل surahs مفقود أو فارغ')
  const surahs = (root.surahs as unknown[]).map((surahRaw, index) => {
    assert(typeof surahRaw === 'object' && surahRaw !== null, `سورة ${index + 1}: بنية غير صالحة`)
    const surah = surahRaw as Record<string, unknown>

    assert(typeof surah.number === 'number', `سورة ${index + 1}: حقل number غير موجود`)
    assert(typeof surah.name_ar === 'string' && surah.name_ar.length > 0, `سورة ${surah.number}: حقل name_ar غير موجود`)
    assert(typeof surah.name_en === 'string' && surah.name_en.length > 0, `سورة ${surah.number}: حقل name_en غير موجود`)
    assert(typeof surah.ayahs_count === 'number', `سورة ${surah.number}: حقل ayahs_count غير موجود`)
    assert(Array.isArray(surah.ayahs), `سورة ${surah.number}: حقل ayahs غير موجود`)
    assert(surah.ayahs_count === surah.ayahs.length, `سورة ${surah.number}: عدد الآيات غير مطابق (المعلن ${surah.ayahs_count}، الفعلي ${surah.ayahs.length})`)

    const ayahs = (surah.ayahs as unknown[]).map((ayahRaw, ayahIndex) => {
      assert(typeof ayahRaw === 'object' && ayahRaw !== null, `سورة ${surah.number} آية ${ayahIndex + 1}: بنية غير صالحة`)
      const ayah = ayahRaw as Record<string, unknown>

      assert(typeof ayah.number === 'number', `سورة ${surah.number} آية ${ayahIndex + 1}: حقل number غير موجود`)
      assert(typeof ayah.number_in_surah === 'number', `سورة ${surah.number} آية ${ayahIndex + 1}: حقل number_in_surah غير موجود`)
      assert(ayah.number_in_surah === ayahIndex + 1, `سورة ${surah.number}: ترقيم number_in_surah غير متسلسل عند ${ayahIndex + 1}`)
      assert(typeof ayah.arabic_text === 'string' && ayah.arabic_text.length > 0, `سورة ${surah.number} آية ${ayah.number_in_surah}: حقل arabic_text مفقود`)
      assert(Array.isArray(ayah.tafseer), `سورة ${surah.number} آية ${ayah.number_in_surah}: حقل tafseer غير موجود`)

      const tafseer = (ayah.tafseer as unknown[]).map((tafseerRaw, tafseerIndex) => {
        assert(typeof tafseerRaw === 'object' && tafseerRaw !== null, `سورة ${surah.number} آية ${ayah.number_in_surah} تفسير ${tafseerIndex + 1}: بنية غير صالحة`)
        const entry = tafseerRaw as Record<string, unknown>
        assert(typeof entry.tafseer_id === 'string' && entry.tafseer_id.length > 0, `سورة ${surah.number} آية ${ayah.number_in_surah}: حقل tafseer_id غير موجود`)
        assert(typeof entry.text === 'string' && entry.text.length > 0, `سورة ${surah.number} آية ${ayah.number_in_surah}: حقل text غير موجود`)
        return { tafseer_id: entry.tafseer_id, text: entry.text }
      })

      return {
        number: ayah.number,
        number_in_surah: ayah.number_in_surah,
        arabic_text: ayah.arabic_text,
        tafseer
      }
    })

    return {
      number: surah.number,
      name_ar: surah.name_ar,
      name_en: surah.name_en,
      ayahs_count: surah.ayahs_count,
      ayahs
    }
  })

  return { surahs }
}

let cached: QuranData | null = null

export async function loadQuranData(): Promise<QuranData> {
  if (cached) {
    return cached
  }
  const data = validate(quranSample)
  cached = data
  return data
}
