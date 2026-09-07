import { loadQuranData } from './loadQuranData'
import { fixTanweenDisplay } from './fixTanweenDisplay'

/**
 * مقتطفا دعاء صفحة «حول التطبيق» — يُقرآن آلياً من الحقل arabic_text في
 * المصدر المقفل src/data/quran_full.json. لا يُكتب أي نص قرآني في هذا الملف:
 * حدود المقتطفين أرقام صحيحة (begin/end) اشتُقت من نص العرض نفسه، مع شرط
 * إلزامي أن يكون المقطع الأول صدر الآية والثاني خاتمتها. أي تغيير مستقبلي في
 * النص المصدر يكسر هذه الحدود فيُوقف الاستخراج فوراً (رمي خطأ) بدل عرض مقطع
 * غير مطابق لمصدره.
 */

export type AboutPart = 'first' | 'second'

interface AboutPartSpec {
  part: AboutPart
  surahNumber: number
  ayahNumber: number
  /** بداية المقتطف (بعد معالجة العرض) */
  begin: number
  /** نهاية المقتطف (بعد معالجة العرض) */
  end: number
  /** المقتطف يجب أن يكون صدر الآية */
  mustBePrefix: boolean
  /** المقتطف يجب أن يكون خاتمة الآية */
  mustBeSuffix: boolean
}

// مقتطف دعاء من نوح 71:28 — صدر الآية كاملاً حتى وَلِوَٰلِدَيَّ
const FIRST_PART: AboutPartSpec = {
  part: 'first',
  surahNumber: 71,
  ayahNumber: 28,
  begin: 0,
  end: 33,
  mustBePrefix: true,
  mustBeSuffix: false,
}

// مقتطف دعاء من الإسراء 17:24 — خاتمة الآية من رَّبِّ ٱرۡحَمۡهُمَا إلى نهايتها
const SECOND_PART: AboutPartSpec = {
  part: 'second',
  surahNumber: 17,
  ayahNumber: 24,
  begin: 58,
  end: 104,
  mustBePrefix: false,
  mustBeSuffix: true,
}

const PARTS: AboutPartSpec[] = [FIRST_PART, SECOND_PART]

export interface AboutSnippet {
  part: AboutPart
  surahNumber: number
  ayahNumber: number
  text: string
}

function getSpec(part: AboutPart): AboutPartSpec {
  const spec = PARTS.find((item) => item.part === part)
  if (!spec) {
    throw new Error(`مقطع غير معروف: ${part}`)
  }
  return spec
}

/**
 * استخراج مقتطف الدعاء آلياً:
 * getAyahPart(71, 28, 'first') ← صدر الآية 71:28
 * getAyahPart(17, 24, 'second') ← خاتمة الآية 17:24
 */
export async function getAyahPart(
  surahNumber: number,
  ayahNumber: number,
  part: AboutPart,
): Promise<string> {
  const spec = getSpec(part)
  if (spec.surahNumber !== surahNumber || spec.ayahNumber !== ayahNumber) {
    throw new Error(
      `مصدر غير متطابق للمقطع «${part}»: المتوقع ${spec.surahNumber}:${spec.ayahNumber}`,
    )
  }

  const data = await loadQuranData()
  const surah = data.surahs.find((item) => item.number === surahNumber)
  const ayah = surah?.ayahs.find((item) => item.number_in_surah === ayahNumber)
  if (!surah || !ayah) {
    throw new Error(`آية غير موجودة في المصدر: ${surahNumber}:${ayahNumber}`)
  }

  const full = fixTanweenDisplay(ayah.arabic_text)

  // فحص سلامة الحدود مقابل المصدر — أي اختلاف = إيقاف فوري
  const valid =
    Number.isInteger(spec.begin) &&
    Number.isInteger(spec.end) &&
    spec.begin >= 0 &&
    spec.end <= full.length &&
    spec.begin < spec.end &&
    (!spec.mustBePrefix || spec.begin === 0) &&
    (!spec.mustBeSuffix || spec.end === full.length)

  if (!valid) {
    throw new Error(
      `عدم تطابق حدود المقطع «${part}» مع المصدر المقفل (الطول ${full.length})`,
    )
  }

  const snippet = full.slice(spec.begin, spec.end)
  if (snippet.trim().length === 0) {
    throw new Error(`مقتطف فارغ: ${surahNumber}:${ayahNumber}`)
  }
  return snippet
}

/** المقطعان بالترتيب الحرفي للعرض: نوح 71:28 ثم الإسراء 17:24. */
export async function getAboutSnippets(): Promise<AboutSnippet[]> {
  const pairs: { spec: AboutPartSpec }[] = [
    { spec: FIRST_PART },
    { spec: SECOND_PART },
  ]
  const snippets: AboutSnippet[] = []
  for (const { spec } of pairs) {
    const text = await getAyahPart(spec.surahNumber, spec.ayahNumber, spec.part)
    snippets.push({
      part: spec.part,
      surahNumber: spec.surahNumber,
      ayahNumber: spec.ayahNumber,
      text,
    })
  }
  return snippets
}
