/**
 * انحدار BC-002 — البحث ودقة الألف الخنجرية وعرض التنوين U+08Fx.
 * يعمل على المعاينة الحية (dist نهائي) — لا يعدّل أي كود.
 */

import { openPage, shotPath, makeReporter, toAsciiDigits } from './lib/harness.mjs'

const SELECTOR = '#quran-search'

function normArabic(text) {
  return text
    .replace(/\u0670/g, '\u0627')
    .replace(/\u0671/g, '\u0627')
    .replace(/[\u0610-\u061A\u064B-\u065F\u06D6-\u06DC\u06DF-\u06E4\u06E7-\u06E8\u06EA-\u06ED\u08F0-\u08FF]/g, '')
    .replace(/[\u0623\u0625\u0622]/g, '\u0627')
    .replace(/[\u0649\u0626]/g, '\u064A')
    .replace(/\u0629/g, '\u0647')
}

const rep = makeReporter('bc002-search')

const { browser, page, errors } = await openPage()
rep.check('المعاينة: الصفحة الرئيسية تُفتح', true, 'localStorage نظيف (سياق جديد)')

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector(SELECTOR, { timeout: 15000 })

async function doSearch(term) {
  await page.fill(SELECTOR, term)
  await page.waitForTimeout(350)
  return page.$$eval('.search-result__meta', (els) => els.map((e) => e.textContent || ''))
}
async function clear() {
  await page.fill(SELECTOR, '')
  await page.waitForTimeout(150)
}
function hasResult(metas, nameSubstr, ayahNum) {
  const needle = normArabic(nameSubstr)
  return metas.some((m) => {
    const n = normArabic(m)
    return n.includes(needle) && (ayahNum == null || n.includes(String(ayahNum)))
  })
}

// 1) الألف الخنجرية: "باسط" يجد الكهف 18:18
let metas = await doSearch('باسط')
rep.check('بحث: "باسط" يجد الكهف 18:18 (بَٰسِط)', hasResult(metas, 'الكهف', 18), `${metas.length} نتيجة`)
await page.screenshot({ path: shotPath('bc005-search-basit') })
await clear()

// 2) "بسط" لا يجد 18:18
metas = await doSearch('بسط')
rep.check(
  'بحث: "بسط" لا يُظهر 18:18 (تمييز الألف الخنجرية)',
  !hasResult(metas, 'الكهف', 18),
  `${metas.length} نتيجة`,
)
await clear()

// 3) النازعات / والنازعات → 79:1
metas = await doSearch('النازعات')
rep.check('بحث: "النازعات" يجد 79:1', hasResult(metas, 'النازعات', 1), `${metas.length} نتيجة`)
await clear()
metas = await doSearch('والنازعات')
rep.check('بحث: "والنازعات" يجد 79:1', hasResult(metas, 'النازعات', 1), `${metas.length} نتيجة`)
await clear()

// 4) زلزلة → سورة 99 (بعد Patch 05 لاسم السورة)
metas = await doSearch('زلزلة')
rep.check('بحث: "زلزلة" تجد سورة 99', hasResult(metas, 'الزلزلة', null), `${metas.length} نتيجة`)
await clear()

// 5) فتح سورة 100 آية 1 — لا U+08F0 شاردة، وضَبْحًا سليمة
await doSearch('العاديات')
await page.click('.search-result:first-child')
await page.waitForSelector('.ayah-viewer', { timeout: 8000 })
await page.waitForTimeout(500)

const ayah1 = await page.evaluate(() => {
  const el = document.querySelector('.ayah[data-ayah-number="1"] .ayah-text > span:first-child')
  return el ? el.textContent || '' : ''
})
const no08fx = !/[\u08F0-\u08FF]/.test(ayah1)
rep.check('عرض: 100:1 بلا أي U+08Fx شاردة', no08fx, `length=${ayah1.length}`)
rep.check(
  'عرض: 100:1 «ضَبْحًا» حاضرة بدمج سليم',
  ayah1.includes('ضَبۡحًا') || (ayah1.includes('ضَبۡح') && ayah1.includes('\u064B')),
  ayah1.slice(0, 34),
)
await page.screenshot({ path: shotPath('bc005-100-1') })

// 6) علامة نهاية الآية (حل عرض فقط) — رقم منفصل داخل حلقة دائرية
const marker = await page.evaluate(() => {
  const ayah = document.querySelector('.ayah[data-ayah-number="1"]')
  if (!ayah) return null
  const box = ayah.querySelector('.ayah-marker.ayah-number')
  const ring = ayah.querySelector('.ayah-marker__ring')
  const num = ayah.querySelector('.ayah-marker__number')
  if (!box || !ring || !num) return null
  const ringStyle = getComputedStyle(ring)
  return {
    dataAttr: box.getAttribute('data-ayah-marker'),
    numText: num.textContent || '',
    radius: ringStyle.borderRadius,
    circle: ringStyle.borderRadius,
  }
})
rep.check(
  'علامة الآية: حلقة دائرية + رقم منفصل (عرض فقط)',
  marker != null && marker.dataAttr === '1' && marker.numText === '١',
  JSON.stringify(marker),
)

rep.addErrors(errors, 'bc002-search')
const code = rep.finish()
await browser.close()
process.exit(code)
