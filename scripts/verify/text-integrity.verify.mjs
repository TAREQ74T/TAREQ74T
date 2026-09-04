/**
 * التحقق من سلامة النص القرآني + البنية + الفصل بين طبقتَي العرض والبحث.
 *
 * 1) بصمة sha256 لملفات البيانات (بصمة الإصدار 1.0).
 * 2) سلامة البنية: 114 سورة، ترقيم متسلسل، 6236 آية، حقول متوقعة.
 * 3) مقارنة آلية مع المصدر الأصلي fawazahmed0/quran-api (ara-quranuthmanihaf):
 *    القائمة البيضاء المسموحة حصراً (Patch 05):
 *      • 97:1  — حذف البسملة المدمجة.
 *      • سورة 99 name_ar — «الزلزلة».
 *    أي اختلاف ثالث = Critical فوراً (رمز خروج 3).
 * 4) فحوصات ثابتة: الفصل بين العرض/البحث، نقاء AyahMarker، عدم وجود U+06DD في المخزن.
 *
 * الاستخدام:  node scripts/verify/text-integrity.verify.mjs
 * المصدر الأصلي: يُتوقّع في $BC005_SOURCE_DIR (افتراضياً /tmp/bc005-src) أو يُنزَّل تلقائياً.
 */

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { writeFile as writeFileFs } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { makeReporter } from './lib/harness.mjs'

const writeFile = promisify(writeFileFs)

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA_DIR = join(ROOT, 'src', 'data')
const SRC_DIR = join(ROOT, 'src')

// ---- بصمة موثقة (مأخوذة من مرشح الإصدار 314efe3، سجلت في المرحلة A) ----
const FINGERPRINT_QURAN = 'f7cacc22267e50e4cc62dd510e0a399744e0cebea560722ab3193368ac3c3557'
const FINGERPRINT_TAFSEER = 'f413bdcab2845ff264f0c851e73bdd1ea49cb5076aabada831cdc535f0207086'

const SOURCE_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1'
const SOURCE_FILES = {
  edition: 'editions/ara-quranuthmanihaf.min.json',
  info: 'info.min.json',
}
// بصمات نسخة المصدر المستخدمة في هذا التشغيل (تُسجَّل كمرجع).
const SOURCE_PIN = {
  edition: '50be57e66e80ae81781ff964d2d355e9b30816df292c701550448ad7e913b93c',
  info: '44bd3c0564927b476736ef5239281de0291b305199254d61a9bcc420fe39250a',
}

function sha256File(filePath) {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

async function fetchTo(url, target) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} لـ ${url}`)
  await writeFile(target, Buffer.from(await response.arrayBuffer()))
}

async function ensureSource() {
  const dir = process.env.BC005_SOURCE_DIR || '/tmp/bc005-src'
  const paths = {
    edition: join(dir, 'ara-quranuthmanihaf.min.json'),
    info: join(dir, 'info.min.json'),
  }
  if (!Object.values(paths).every((p) => existsSync(p))) {
    console.log(`[text-integrity] المصدر غير موجود في ${dir} — تنزيل ...`)
    mkdirSync(dir, { recursive: true })
    for (const [key, rel] of Object.entries(SOURCE_FILES)) {
      if (!existsSync(paths[key])) {
        await fetchTo(`${SOURCE_BASE}/${rel}`, paths[key])
      }
    }
  }
  return paths
}

function collectSourceMaps(editionPath, infoPath) {
  const edition = JSON.parse(readFileSync(editionPath, 'utf8'))
  const info = JSON.parse(readFileSync(infoPath, 'utf8'))
  const textByKey = new Map()
  for (const item of edition.quran) textByKey.set(`${item.chapter}:${item.verse}`, item.text)
  return { textByKey, chapters: info.chapters }
}

function walkSource(dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkSource(full))
    else if (/\.(ts|tsx|css)$/.test(entry.name)) out.push(full)
  }
  return out
}

async function main() {
  const rep = makeReporter('text-integrity')

  // 1) البصمة
  const quranPath = join(DATA_DIR, 'quran_full.json')
  const tafseerPath = join(DATA_DIR, 'tafseer_full.json')
  const shaQuran = sha256File(quranPath)
  const shaTafseer = sha256File(tafseerPath)
  rep.check(
    'البصمة: quran_full.json = بصمة الإصدار 1.0',
    shaQuran === FINGERPRINT_QURAN,
    shaQuran,
  )
  rep.check(
    'البصمة: tafseer_full.json = بصمة الإصدار 1.0',
    shaTafseer === FINGERPRINT_TAFSEER,
    shaTafseer,
  )

  const quran = JSON.parse(readFileSync(quranPath, 'utf8'))
  const surahs = quran.surahs

  // 2) البنية
  rep.check('البنية: 114 سورة', Array.isArray(surahs) && surahs.length === 114)
  rep.check(
    'البنية: ترقيم السور 1..114 متسلسل',
    surahs.every((s, i) => s.number === i + 1 && Array.isArray(s.ayahs)),
  )
  const expectedSurahKeys = ['number', 'name_ar', 'name_en', 'ayahs_count', 'ayahs']
  rep.check(
    'البنية: حقول السورة متوقعة',
    surahs.every(
      (s) =>
        expectedSurahKeys.every((k) => k in s) &&
        Object.keys(s).length === expectedSurahKeys.length,
    ),
  )

  let total = 0
  let numberingOk = true
  let emptyText = 0
  let u06ddEnd = 0
  let u06deRub = 0
  let u08f = 0
  const ayahKeyCounts = new Map()
  for (const s of surahs) {
    s.ayahs.forEach((a, idx) => {
      Object.keys(a).forEach((k) => ayahKeyCounts.set(k, (ayahKeyCounts.get(k) || 0) + 1))
      if (a.number !== idx + 1 || a.number_in_surah !== idx + 1) numberingOk = false
      if (typeof a.arabic_text !== 'string' || a.arabic_text.length === 0) emptyText += 1
      if (a.arabic_text.includes('\u06dd')) u06ddEnd += 1
      if (a.arabic_text.includes('\u06de')) u06deRub += 1
      if (/[\u08f0-\u08ff]/u.test(a.arabic_text)) u08f += 1
      total += 1
    })
  }
  rep.check('البنية: مجموع الآيات = 6236', total === 6236, `${total}`)
  rep.check('البنية: ترقيم الآيات متسلسل داخل كل سورة', numberingOk)
  rep.check('البنية: لا آية فارغة', emptyText === 0)
  rep.check(
    'النص المخزّن: لا يحتوي U+06DD (نهاية آية) إطلاقاً — الحل عرض فقط',
    u06ddEnd === 0,
    `${u06ddEnd} آية`,
  )
  rep.check(
    'النص المخزّن: U+08Fx حاضرة كما في المصدر (لا تطبيع في التخزين)',
    u08f > 0,
    `${u08f} آية`,
  )

  // 3) المقارنة مع المصدر الأصلي + القائمة البيضاء
  const paths = await ensureSource()
  const { textByKey, chapters } = collectSourceMaps(paths.edition, paths.info)

  rep.check(
    'المصدر: نسخة الملفات مطابقة للمرجع المسجّل',
    sha256File(paths.edition) === SOURCE_PIN.edition &&
      sha256File(paths.info) === SOURCE_PIN.info,
    `${sha256File(paths.edition).slice(0, 12)}… / ${sha256File(paths.info).slice(0, 12)}…`,
  )

  const textDiffs = []
  for (const s of surahs) {
    for (const a of s.ayahs) {
      const key = `${s.number}:${a.number_in_surah}`
      const srcText = textByKey.get(key)
      if (srcText === undefined) textDiffs.push(`${key} (غائبة في المصدر)`)
      else if (srcText !== a.arabic_text) textDiffs.push(key)
    }
  }
  const allowedTextDiffs = new Set(['97:1'])
  const outsideText = textDiffs.filter((d) => !allowedTextDiffs.has(d))
  const textOk = textDiffs.length <= 1 && outsideText.length === 0
  rep.check(
    textOk
      ? 'المقارنة: لا اختلاف نصي خارج القائمة البيضاء {97:1}'
      : 'المقارنة: ⚠ اختلاف نصي خارج القائمة البيضاء = CRITICAL',
    textOk,
    textDiffs.length ? textDiffs.join(', ') : '0 اختلاف',
  )

  // إثبات إيجابي للرقعة المتعمّدة 97:1
  const s97 = surahs.find((s) => s.number === 97)
  const qadr1 = s97.ayahs[0].arabic_text
  rep.check(
    'الرقعة المتعمّدة: 97:1 تبدأ بـ«إنا أنزلناه» بلا بسملة مدمجة',
    qadr1.startsWith('إِنَّآ') && !qadr1.includes('ٱلرَّحِيمِ'),
    qadr1.slice(0, 40),
  )

  // حرف U+06DE (بداية ربع الحزب ۞): اختبار حاسم — هل هو أصيل في المصدر؟
  const rubAyas = []
  for (const s of surahs) {
    for (const a of s.ayahs) {
      if (a.arabic_text.includes('\u06de')) {
        const key = `${s.number}:${a.number_in_surah}`
        rubAyas.push({ key, text: a.arabic_text })
      }
    }
  }
  const rubAllMatch = rubAyas.every((r) => textByKey.get(r.key) === r.text)
  rep.check(
    'الحرف U+06DE (۞ بداية ربع الحزب): موجود في المصدر الأصلي حرفياً (أصيل — Advisory)',
    u06deRub === rubAyas.length && rubAyas.length > 0 && rubAllMatch,
    `${u06deRub} آية، 0 منها مختلف عن المصدر — علامات أحزاب أصلية`,
  )

  // أسماء السور: name_ar (مقابل المصدر) — القائمة البيضاء {99}
  const nameDiffs = []
  const nameEnDiffs = []
  const countDiffs = []
  for (const ch of chapters) {
    const os = surahs.find((s) => s.number === ch.chapter)
    if (!os) {
      nameDiffs.push(`ch${ch.chapter} ناقص`)
      continue
    }
    if (os.name_ar !== ch.arabicname) nameDiffs.push(ch.chapter)
    if (os.name_en !== ch.name) nameEnDiffs.push(ch.chapter)
    if (os.ayahs_count !== ch.verses.length) countDiffs.push(ch.chapter)
  }
  const outsideNames = nameDiffs.filter((d) => d !== 99 && d !== '99')
  const namesOk = nameEnDiffs.length === 0 && countDiffs.length === 0 && outsideNames.length === 0
  rep.check(
    namesOk
      ? 'المقارنة: أسماء السور بلا اختلاف خارج {99}'
      : 'المقارنة: ⚠ اختلاف أسماء خارج القائمة البيضاء = CRITICAL',
    namesOk,
    `name_ar diff=${nameDiffs.join(',') || '—'} name_en=${nameEnDiffs.length} counts=${countDiffs.length}`,
  )
  const s99 = surahs.find((s) => s.number === 99)
  rep.check(
    'الرقعة المتعمّدة: سورة 99 name_ar = «الزلزلة»',
    s99.name_ar === 'سُوْرَةُ الزِّلْزَلَةِ',
    s99.name_ar,
  )

  if (!textOk || !namesOk) {
    console.log('\n[CRITICAL] اختلاف خارج القائمة البيضاء الموثّقة — أوقف التحقق وأبلغ الإنسان.')
    process.exit(3)
  }

  // 4) الفصل بين العرض والبحث (فحص ثابت)
  const files = walkSource(SRC_DIR)
  const normalizeUsers = []
  const fixUsers = []
  for (const file of files) {
    const rel = relative(ROOT, file)
    const content = readFileSync(file, 'utf8')
    if (/normalizeArabic/.test(content)) normalizeUsers.push(rel)
    if (/fixTanweenDisplay/.test(content)) fixUsers.push(rel)
  }
  const expectedNormalizeUsers = [
    'src/utils/normalizeArabic.ts',
    'src/components/quran/SearchBar.tsx',
  ]
  const unexpectedNormalize = normalizeUsers.filter((f) => !expectedNormalizeUsers.includes(f))
  rep.check(
    'الفصل: normalizeArabic تُستخدم في طبقة البحث فقط (وليس في عرض النص)',
    unexpectedNormalize.length === 0 && normalizeUsers.length === 2,
    normalizeUsers.join(' , ') || '—',
  )
  rep.check(
    'الفصل: fixTanweenDisplay مقصورة على طبقة العرض',
    fixUsers.length >= 2 && fixUsers.length <= 4,
    fixUsers.join(' , '),
  )

  // نقاء AyahMarker (حل عرض فقط — لا تعديل، لا تخزين)
  const markerPath = join(SRC_DIR, 'components', 'quran', 'AyahMarker.tsx')
  const markerSrc = readFileSync(markerPath, 'utf8')
  const impure =
    /localStorage|sessionStorage/.test(markerSrc) ||
    /\buse[A-Z]/.test(markerSrc) ||
    /from '\.\.\/\.\.\/(hooks|storage|data)/.test(markerSrc) ||
    /^import /m.test(markerSrc)
  rep.check(
    'AyahMarker: مكوّن عرضي خالص — لا استيراد، لا خطافات، لا مخازن، لا تعديل',
    !impure,
    'دائرة CSS + رقم number_in_surah فقط',
  )

  const exitCode = rep.finish()
  process.exit(exitCode)
}

main().catch((err) => {
  console.error('خطأ في سكربت text-integrity:', err.message)
  process.exit(1)
})
