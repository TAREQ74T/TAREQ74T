import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const QURAN_API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1'
const TAFSIR_API_BASE =
  'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/ar-tafsir-muyassar'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(SCRIPT_DIR, '..', 'src', 'data')

const EXPECTED_TOTAL_AYAHS = 6236
const SURAH_COUNT = 114

async function fetchJson(url) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} لـ ${url}`)
  }
  return response.json()
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true })

  console.log('[1/4] جلب نص القرآن (ara-quranuthmanihaf)...')
  const quranPayload = await fetchJson(
    `${QURAN_API_BASE}/editions/ara-quranuthmanihaf.min.json`,
  )
  const quranTexts = quranPayload.quran
  if (!Array.isArray(quranTexts)) {
    throw new Error('بنية غير متوقعة لـ editions/ara-quranuthmanihaf.min.json')
  }
  if (quranTexts.length !== EXPECTED_TOTAL_AYAHS) {
    throw new Error(
      `عدد الآيات في النص المصدر = ${quranTexts.length}، المتوقع ${EXPECTED_TOTAL_AYAHS}`,
    )
  }

  console.log('[2/4] جلب معلومات السور (info.min.json)...')
  const infoPayload = await fetchJson(`${QURAN_API_BASE}/info.min.json`)
  const chapters = infoPayload.chapters
  if (!Array.isArray(chapters) || chapters.length !== SURAH_COUNT) {
    throw new Error('بنية غير متوقعة لـ info.min.json (chapters)')
  }

  console.log('[3/4] جلب التفسير الميسر للسور الـ 114...')
  const tafseerMap = {}
  for (let surahNumber = 1; surahNumber <= SURAH_COUNT; surahNumber += 1) {
    const url = `${TAFSIR_API_BASE}/${surahNumber}.json`
    const entries = await fetchJson(url)
    if (!Array.isArray(entries)) {
      throw new Error(`بنية غير متوقعة للتفسير: ${url}`)
    }
    const surahTafseer = {}
    for (const entry of entries) {
      if (entry.surah !== surahNumber) {
        throw new Error(
          `سورة ${surahNumber}: مدخل تفسير برقم سورة مخالف (${entry.surah})`,
        )
      }
      if (typeof entry.ayah !== 'number' || typeof entry.text !== 'string') {
        throw new Error(`سورة ${surahNumber}: مدخل تفسير غير صالح`)
      }
      surahTafseer[String(entry.ayah)] = entry.text
    }
    tafseerMap[String(surahNumber)] = surahTafseer
  }

  const totalTafseerEntries = Object.values(tafseerMap).reduce(
    (sum, surahEntries) => sum + Object.keys(surahEntries).length,
    0,
  )
  if (totalTafseerEntries !== EXPECTED_TOTAL_AYAHS) {
    throw new Error(
      `عدد مدخلات التفسير = ${totalTafseerEntries}، المتوقع ${EXPECTED_TOTAL_AYAHS}`,
    )
  }

  console.log('[4/4] بناء ملفات JSON الموحدة...')
  const surahs = []
  for (const chapter of chapters) {
    const number = chapter.chapter
    const ayahs = quranTexts
      .filter((item) => item.chapter === number)
      .sort((a, b) => a.verse - b.verse)
      .map((item) => ({
        number: item.verse,
        number_in_surah: item.verse,
        arabic_text: item.text,
        tafseer: [],
      }))

    if (ayahs.length !== chapter.verses.length) {
      throw new Error(
        `سورة ${number}: عدد الآيات في النص (${ayahs.length}) لا يطابق info.json (${chapter.verses.length})`,
      )
    }

    surahs.push({
      number,
      name_ar: chapter.arabicname,
      name_en: chapter.name,
      ayahs_count: ayahs.length,
      ayahs,
    })
  }

  const totalAyahs = surahs.reduce((sum, surah) => sum + surah.ayahs.length, 0)
  if (totalAyahs !== EXPECTED_TOTAL_AYAHS) {
    throw new Error(
      `مجموع الآيات في الملف النهائي = ${totalAyahs}، المتوقع ${EXPECTED_TOTAL_AYAHS}`,
    )
  }

  const quranFullPath = join(DATA_DIR, 'quran_full.json')
  const tafseerFullPath = join(DATA_DIR, 'tafseer_full.json')

  await writeFile(quranFullPath, JSON.stringify({ surahs }), 'utf8')
  await writeFile(tafseerFullPath, JSON.stringify({ surahs: tafseerMap }), 'utf8')

  console.log('تم.')
  console.log(`  quran_full.json: ${totalAyahs} آية عبر ${surahs.length} سورة`)
  console.log(`  tafseer_full.json: ${totalTafseerEntries} مدخل تفسير`)
}

main().catch((error) => {
  console.error('فشل بناء البيانات:', error.message)
  process.exit(1)
})
