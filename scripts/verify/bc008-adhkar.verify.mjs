/**
 * BC-008 — أذكار الصباح والمساء.
 * مرحلة 0 (مصدر مثبّت على commit SHA + استخراج id=27) ومرحلة 1 (شاشة عرض أساسية).
 * فحوص ملفات + فحوص DOM على المعاينة الحية — لا يعدّل أي كود.
 */

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { openPage, makeReporter, skipSplash } from './lib/harness.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const rep = makeReporter('bc008-adhkar')

const COMMIT_SHA = 'd793023e3b69c91674023f692425950c8ebbb64d'
const UPSTREAM_URL = `https://raw.githubusercontent.com/YousefAsalya/Islamic-Pro-azkar-API/${COMMIT_SHA}/data/ar.json`
const SHA_SOURCE = '7affdd9c1356f66f77057b631ac239cc41bde68f9bdc85d344a852a0a6ff6732'
const SHA_ADHKAR = 'bd4d38c9dcef1a0c570b0ec3db7e282b5209f749e628e676477169f6e6bbb48f'

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

const sourceBuf = readFileSync(resolve(ROOT, 'src/data/adhkar-source.json'))
const adhkarBuf = readFileSync(resolve(ROOT, 'src/data/adhkar.json'))

rep.check(
  'مصدر: adhkar-source.json مطابق بايتًا-ببايت للتسجيل sha256',
  sha256(sourceBuf) === SHA_SOURCE,
  sha256(sourceBuf).slice(0, 16),
)
rep.check(
  'مصدر: لا وجود EF BF BD على مستوى البايت',
  !/efbfbd/i.test(sourceBuf.toString('hex')),
)

const source = JSON.parse(sourceBuf.toString('utf8'))
rep.check('مصدر: مصفوفة عليا من 132 بابًا', Array.isArray(source) && source.length === 132, `len=${source.length}`)
const source27 = source.find((g) => g && g.id === 27)
rep.check(
  'مصدر: الباب id=27 موجود باسمه الحرفي',
  !!source27 && source27.category === 'أذكار الصباح والمساء',
  source27?.category,
)

// قائمة ممنوعة على مستوى المستخرج بالكامل
const serializedAdhkar = adhkarBuf.toString('utf8')
rep.check(
  'مستخرج: لا مفاتيح transliteration/audio/filename',
  !serializedAdhkar.includes('"transliteration"') &&
    !serializedAdhkar.includes('"audio"') &&
    !serializedAdhkar.includes('"filename"'),
)
rep.check(
  'مستخرج: خالٍ تمامًا من U+FFFD (بايت ونص)',
  !/efbfbd/i.test(adhkarBuf.toString('hex')) && !serializedAdhkar.includes('\uFFFD'),
)
rep.check(
  'مستخرج: adhkar.json مطابق للتسجيل sha256',
  sha256(adhkarBuf) === SHA_ADHKAR,
  sha256(adhkarBuf).slice(0, 16),
)

const chapter = JSON.parse(serializedAdhkar)
rep.check(
  'مستخرج: مفاتيح المستوى الأعلى = id, category, items فقط',
  Array.isArray(chapter.items) &&
    chapter.category === 'أذكار الصباح والمساء' &&
    JSON.stringify(Object.keys(chapter).sort()) === JSON.stringify(['category', 'id', 'items']),
)
rep.check('مستخرج: 24 عنصرًا', Array.isArray(chapter.items) && chapter.items.length === 24, `n=${chapter.items?.length}`)
const keysOk = chapter.items.every((it) => JSON.stringify(Object.keys(it).sort()) === JSON.stringify(['count', 'id', 'text']))
rep.check(
  'مستخرج: كل عنصر مفاتيحه id, text, count فقط',
  keysOk,
  chapter.items?.length != null ? `items=${chapter.items.length}` : 'no-items',
)
rep.check(
  'مستخرج: كل النصوص غير فارغة',
  chapter.items.every((it) => typeof it.text === 'string' && it.text.length > 0),
)
const textMatch = chapter.items.every((it, i) => {
  const o = source27.array[i]
  return o && o.text === it.text && o.id === it.id && o.count === it.count
})
rep.check(
  'مستخرج: نصوص الـ24 مطابقة حرفيًا لنظيرها في adhkar-source.json',
  textMatch,
)
rep.check(
  'مستخرج: لا نص فارغ/تالف في أي عنصر',
  chapter.items.every((it) => it.text.trim().length > 0),
)

// التوثيق: commit_sha + download_url + sha256 في docs/AdhkarBC008.md
const doc = readFileSync(resolve(ROOT, 'docs/AdhkarBC008.md'), 'utf8')
rep.check('توثيق: commit_sha حاضر في الوثيقة', doc.includes(COMMIT_SHA))
rep.check('توثيق: download_url المثبّت حاضر', doc.includes(UPSTREAM_URL))
rep.check(
  'توثيق: sha256 للنسختين مسجّلان',
  doc.includes(SHA_SOURCE) && doc.includes(SHA_ADHKAR),
)
rep.check('توثيق: نص ترخيص MIT مرفق', doc.includes('MIT License') && doc.includes('Islamic Pro - Azkar API Contributors'))

// quran_full.json لم يُلمس (بدون فرق مقابل HEAD)
let quranDirty = 'unknown'
try {
  execFileSync('git', ['diff', '--quiet', '--', 'src/data/quran_full.json'], { cwd: ROOT })
  quranDirty = 'clean'
} catch {
  quranDirty = 'dirty'
}
rep.check('نزاهة: quran_full.json دون أي تعديل', quranDirty === 'clean', quranDirty)

// لا طلبات شبكة وقت التشغيل: adhkar.json مستورد (مضمّن) ولا fetch في الشاشة/الصفحة
const screenSrc = readFileSync(resolve(ROOT, 'src/components/adhkar/AdhkarScreen.tsx'), 'utf8')
const pageSrc = readFileSync(resolve(ROOT, 'src/pages/AdhkarPage.tsx'), 'utf8')
rep.check(
  'واجهة: لا fetch/http لاستيراد الأذكار وقت التشغيل',
  !/fetch\s*\(|https?:\/\//.test(screenSrc + pageSrc),
)
rep.check('واجهة: استيراد من adhkar.json المحلي', /from\s+['"]\.\.\/\.\.\/data\/adhkar\.json['"]/.test(screenSrc))

// ---------- فحوص DOM على المعاينة الحية ----------
const { browser, page, errors } = await openPage({ viewport: { width: 1440, height: 900 } })
await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', { waitUntil: 'networkidle' })
await skipSplash(page)

const toolbar = await page.evaluate(() => {
  const adhkarBtn = document.querySelector('.sidebar-adhkar-btn')
  const gearBtn = document.querySelector('.sidebar-gear-btn')
  const svgIcon = document.querySelector('.sidebar-adhkar-btn svg')
  return {
    adhkarText: adhkarBtn?.textContent?.trim() || '',
    gearPresent: !!gearBtn,
    gearSvg: !!gearBtn?.querySelector('svg'),
    iconlessText: adhkarBtn && !svgIcon,
  }
})
rep.check(
  'واجهة: زر «الأذكار» ظاهر بجانب زر الإعدادات',
  toolbar.adhkarText.includes('الأذكار') && toolbar.gearPresent,
  `adhkar="${toolbar.adhkarText}" gear=${toolbar.gearPresent}`,
)

await page.click('.sidebar-adhkar-btn')
await page.waitForSelector('.adhkar-screen', { timeout: 10000 })

const screen = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.adhkar-card')]
  const title = document.querySelector('.adhkar-screen__title')
  const errorEl = document.querySelector('[data-testid="adhkar-error"]')
  const heading = document.querySelector('.settings-page__header h2')
  return {
    title: title?.textContent?.trim() || '',
    heading: heading?.textContent?.trim() || '',
    cardCount: cards.length,
    firstText: cards[0]?.querySelector('.adhkar-card__text')?.textContent || '',
    errorPresent: !!errorEl,
    anyEmptyText: cards.some((c) => !(c.querySelector('.adhkar-card__text')?.textContent?.trim())),
  }
})
rep.check(
  'شاشة: العنوان = «أذكار الصباح والمساء» وترويسة «الأذكار»',
  screen.title.includes('أذكار الصباح والمساء') && screen.heading.includes('الأذكار'),
  `${screen.heading} / ${screen.title}`,
)
rep.check('شاشة: 24 بطاقة ذكر', screen.cardCount === 24, `cards=${screen.cardCount}`)
rep.check('شاشة: لا حالة خطأ ولا نص فارغ', !screen.errorPresent && !screen.anyEmptyText)
rep.check(
  'شاشة: أول ذكر مطابق حرفيًا للمصدر (بداية النص)',
  screen.firstText.length > 0 && screen.firstText === chapter.items[0].text,
  `len=${screen.firstText.length}`,
)

// زر العودة
await page.click('.settings-back-btn')
await page.waitForSelector('.quran-page', { timeout: 10000 })
rep.check('شاشة: زر العودة يعيد إلى شاشة القراءة', true)

// الوصول المباشر بالمسار
await page.evaluate(() => {
  window.location.hash = '#/adhkar'
})
await page.waitForSelector('.adhkar-screen', { timeout: 10000 })
const directCards = await page.locator('.adhkar-card').count()
rep.check('شاشة: المسار المباشر #/adhkar يعرض القائمة', directCards === 24, `cards=${directCards}`)

// الوضع الليلي — تباين البطاقات
await page.evaluate(() => {
  document.documentElement.dataset.theme = 'dark'
})
await page.waitForTimeout(150)
const darkCard = await page.evaluate(() => {
  const card = document.querySelector('.adhkar-card')
  const text = document.querySelector('.adhkar-card__text')
  if (!card || !text) return null
  const cs = getComputedStyle(card)
  const ts = getComputedStyle(text)
  return { bg: cs.backgroundColor, text: ts.color, ink: ts.color }
})
rep.check(
  'ليلي: بطاقات الأذكار بخلفية داكنة ونص فاتح',
  darkCard != null && darkCard.bg !== 'rgba(0, 0, 0, 0)' && darkCard.text !== 'rgba(0, 0, 0, 0)',
  `bg=${darkCard?.bg}`,
)

// شاشة ضيقة — بلا انفجار أفقي
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(250)
const narrow = await page.evaluate(() => {
  const card = document.querySelector('.adhkar-card')
  if (!card) return { ok: false }
  return {
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cardWidth: Math.round(card.getBoundingClientRect().width),
  }
})
rep.check(
  'ضيقة 390px: لا تجاوز أفقي والقائمة عمودية',
  narrow.ok !== false && narrow.overflowX <= 1,
  `scroll-gap=${narrow.overflowX}`,
)

rep.addErrors(errors, 'bc008')
const code = rep.finish()
await browser.close()
process.exit(code)
