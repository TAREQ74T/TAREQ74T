/**
 * تحقق BC-010c.2 — المدن (الطبقة 1): بنية cities.json + التغطية العربية + منتقي المدينة.
 * يعمل على المعاينة الحية — لا يعدّل أي كود ولا بيانات.
 */

import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE_DIR = join(ROOT, 'docs', 'evidence', 'BC-010', 'cities')
process.env.RESULT_DIR ||= join(EVIDENCE_DIR, 'results')
process.env.SHOT_DIR ||= EVIDENCE_DIR

const { openPage, makeReporter, skipSplash } = await import('./lib/harness.mjs')

const ARAB = [
  'DZ', 'BH', 'KM', 'DJ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'MR',
  'OM', 'PS', 'QA', 'SA', 'SO', 'SD', 'SY', 'TN', 'AE', 'YE',
]
const EXPECTED_SHA =
  'f41428b58b25cae0f339c7f7fe5e9ad84bdcd70fc447fa913c09b7190729cfc3'
const LAT_GEONAMEID = '173576' // Latakia

mkdirSync(EVIDENCE_DIR, { recursive: true })

const data = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'cities.json'), 'utf8'))
const cities = data.cities
const rep = makeReporter('bc010c-cities')
const BASE = process.env.PREVIEW_URL || 'http://localhost:5199'

// 1) البنية والبيانات الوصفية
const meta = data._meta ?? {}
rep.check(
  'البيانات الوصفية: المصدر والترخيص والإسناد وsha256 وcount',
  meta.source === 'GeoNames cities1000' &&
    meta.license === 'CC BY 4.0' &&
    String(meta.attribution).includes('GeoNames') &&
    meta.source_sha256 === EXPECTED_SHA &&
    meta.count === cities.length,
  JSON.stringify({ source: meta.source, license: meta.license, count: meta.count }),
)

// 2) عدد السجلات
rep.check('عدد السجلات ≥ 4,500', cities.length >= 4500, `count=${cities.length}`)

// 3) اكتمال الحقول في كل سجل
const incomplete = cities.filter(
  (c) =>
    typeof c.n !== 'string' ||
    c.n.length === 0 ||
    !('ar' in c) ||
    typeof c.lat !== 'number' ||
    typeof c.lon !== 'number' ||
    !Number.isFinite(c.lat) ||
    !Number.isFinite(c.lon) ||
    typeof c.cc !== 'string' ||
    c.cc.length === 0 ||
    typeof c.country_ar !== 'string' ||
    c.country_ar.length === 0,
)
rep.check(
  'كل سجل يحوي n/ar/lat/lon/cc/country_ar صالحة',
  incomplete.length === 0,
  `غير مكتمل=${incomplete.length}`,
)

// 4) التغطية العربية (العتبة المعتمدة 67%)
const arabicCount = cities.filter((c) => c.ar != null).length
const arabicPercent = (arabicCount / cities.length) * 100
rep.check(
  'تغطية الأسماء العربية ≥ 67%',
  arabicPercent >= 67,
  `${arabicCount}/${cities.length} = ${arabicPercent.toFixed(1)}%`,
)

const { browser, page, errors } = await openPage({ viewport: { width: 390, height: 844 } })

async function openSettings() {
  await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' })
  await skipSplash(page, '[data-testid="city-picker"]', )
  await page.waitForSelector('[data-testid="city-picker"]', { timeout: 15000 })
  await page.waitForSelector('[data-testid="city-picker-list"]', { timeout: 15000 })
}

await openSettings()
await page.screenshot({ path: join(EVIDENCE_DIR, 'cities-picker.png') })

// 5) البحث يجد «اللاذقية»
await page.fill('[data-testid="city-picker-search"]', 'اللاذقية')
await page.waitForSelector(`[data-testid="city-option-${LAT_GEONAMEID}"]`, { timeout: 8000 })
const foundText = await page.textContent(`[data-testid="city-option-${LAT_GEONAMEID}"]`)
rep.check(
  'البحث يجد «اللاذقية»',
  foundText != null && foundText.includes('لاذقية'),
  `${foundText}`,
)
await page.screenshot({ path: join(EVIDENCE_DIR, 'cities-search-latakia.png') })

// 6) منسدلة الدولة تعرض 22 دولة عربية
const arabOptionCount = await page.$$eval(
  '[data-testid="city-picker-country"] option',
  (options, arab) => options.filter((option) => arab.includes(option.value)).length,
  ARAB,
)
rep.check(
  'منسدلة الدولة تعرض 22 دولة عربية',
  arabOptionCount === 22,
  `عدد الخيارات العربية=${arabOptionCount}`,
)

// 7) اختيار مدينة يضبط الإحداثيات في localStorage
await page.fill('[data-testid="city-picker-search"]', '')
await page.selectOption('[data-testid="city-picker-country"]', 'SY')
await page.waitForSelector(`[data-testid="city-option-${LAT_GEONAMEID}"]`, { timeout: 8000 })
await page.screenshot({ path: join(EVIDENCE_DIR, 'cities-country-sy.png') })
await page.click(`[data-testid="city-option-${LAT_GEONAMEID}"]`)
await page.waitForFunction(
  () => {
    const raw = localStorage.getItem('mushaf-al-huda:location')
    if (!raw) return false
    try {
      const v = JSON.parse(raw)
      return Math.abs(v.latitude - 35.5313) < 0.01 && Math.abs(v.longitude - 35.7909) < 0.01
    } catch {
      return false
    }
  },
  { timeout: 8000 },
)
const stored = await page.evaluate(() => localStorage.getItem('mushaf-al-huda:location'))
rep.check(
  'اختيار مدينة يضبط lat/lon في localStorage',
  stored != null && stored.includes('35.5313'),
  `${stored}`,
)
await page.screenshot({ path: join(EVIDENCE_DIR, 'cities-selected.png') })

// 8) صفر أخطاء console
const cleanErrors = errors.filter((entry) => !/favicon/.test(entry))
rep.check('صفر أخطاء console', cleanErrors.length === 0, cleanErrors.join(' | ') || 'clean')

const code = rep.finish()
await browser.close()
process.exit(code)
