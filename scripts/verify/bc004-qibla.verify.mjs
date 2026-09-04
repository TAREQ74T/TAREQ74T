/**
 * تحقق BC-004 — القبلة (استقلالية)، سلوك UTC التلقائي/اليدوي، خطوة الدقيقة مع الحصر ±30.
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 */

import { openPage, shotPath, makeReporter, parseClockMinutes, toAsciiDigits } from './lib/harness.mjs'

const rep = makeReporter('bc004-qibla')
const { browser, page, errors } = await openPage()

// مرجع خارجي موثوق (Aladhan API v1/qibla) لمدخلات اللاذقية 35.53, 35.79 — سُجّل في المرحلة A:
const EXTERNAL_REF = 164.8738 // انحراف عن الشمال؛ العقد يذكر 164.9 (هامش ±0.5)
const EXTERNAL_MARGIN = 0.5

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector('.quran-page, .sidebar', { timeout: 15000 })
await page.click('[aria-label="الإعدادات"]').catch(() => {})
await page.waitForSelector('.settings-page', { timeout: 8000 })

async function setLocation(lat, lng) {
  const current = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="location-value"]')
    return el ? el.textContent : ''
  })
  const latA = toAsciiDigits(lat).slice(0, 6)
  if (current.includes(latA)) return
  await page.getByRole('button', { name: 'إدخال يدوي' }).click().catch(() => {})
  const inputs = page.locator('.location-form input[type="number"]')
  await inputs.nth(0).fill(String(lat))
  await inputs.nth(1).fill(String(lng))
  await page.getByRole('button', { name: 'حفظ' }).click()
  await page.waitForTimeout(500)
}

const readFajrTime = () =>
  page.evaluate(() => {
    const el = document.querySelector('[data-testid="edit-time-fajr"]')
    return el ? el.textContent.trim() : ''
  })
const effectiveLabel = async () =>
  (await page.textContent('[data-testid="tz-effective"]').catch(() => '')).trim()

// ---- 1) UTC تلقائي (القاهرة ~+2) ثم يدوي +3 / −5 ----
await setLocation(30.0444, 31.2357)
await page.click('[data-testid="tz-auto"]').catch(() => {})
await page.waitForTimeout(300)
const effAuto = await effectiveLabel()
const fajrAutoMin = parseClockMinutes(await readFajrTime())
rep.check('UTC: تلقائي من خط الطول (القاهرة ≈ ٢ UTC)', toAsciiDigits(effAuto).includes('2 UTC'), effAuto)

await page.click('[data-testid="tz-manual"]')
await page.waitForSelector('[data-testid="tz-manual-input"]', { timeout: 5000 })
await page.fill('[data-testid="tz-manual-input"]', '3')
await page.waitForTimeout(350)
const effPlus3 = await effectiveLabel()
const fajrPlus3Min = parseClockMinutes(await readFajrTime())
rep.check(
  'UTC: يدوي +3 يغيّر العرض (تقدّم ~ساعة مقابل التلقائي)',
  /\+3/.test(toAsciiDigits(effPlus3)) && fajrPlus3Min != null && fajrAutoMin != null &&
    Math.abs((fajrPlus3Min - fajrAutoMin + 1440) % 1440 - 60) <= 2,
  `${effPlus3} | فرق=${(fajrPlus3Min - fajrAutoMin + 1440) % 1440}د`,
)

await page.fill('[data-testid="tz-manual-input"]', '-5')
await page.waitForTimeout(350)
const effMinus5 = await effectiveLabel()
const fajrMinus5Min = parseClockMinutes(await readFajrTime())
rep.check(
  'UTC: يدوي −5 يغيّر العرض (تراجع ~7 ساعات)',
  toAsciiDigits(effMinus5).includes('-5') && fajrMinus5Min != null && fajrAutoMin != null &&
    Math.abs((fajrMinus5Min - fajrAutoMin + 1440) % 1440 - 1020) <= 2,
  `${effMinus5} | فرق=${(fajrMinus5Min - fajrAutoMin + 1440) % 1440}د`,
)
await page.screenshot({ path: shotPath('bc005-utc-manual-minus5') })

// العودة إلى تلقائي ثم اللاذقية للقبلة
await page.click('[data-testid="tz-auto"]')
await page.waitForTimeout(300)

// ---- 2) القبلة من اللاذقية 35.53, 35.79 → ~165° مقابل المرجع الخارجي 164.9 ----
// ملاحظة: QiblaCompass يقرأ موقعه الخاص عند التحميل؛ إعادة تحميل الصفحة بعد حفظ
// الموقع تضمن انعكاس اللاذقية على البوصلة (إعادة تركيب المكوّن).
await setLocation(35.53, 35.79)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="qibla-bearing"]', { timeout: 8000 })
await page.waitForTimeout(400)
const bearingText = (await page.textContent('[data-testid="qibla-bearing"]').catch(() => '')).trim()
const needleStyle = await page
  .$eval('[data-testid="qibla-needle"]', (el) => el.getAttribute('style') || '')
  .catch(() => '')
const bearingNum = Number((toAsciiDigits(bearingText).match(/(\d+)/) || [])[1])
const needleDeg = Number((needleStyle.match(/rotate\(([-\d.]+)deg\)/) || [])[1])

rep.check('القبلة: قيمة رقمية تُعرض', Number.isFinite(bearingNum) && bearingNum > 0, bearingText)
rep.check(
  'القبلة: اللاذقية ≈ 165° ضمن هامش ±0.5 من المرجع الخارجي (164.9)',
  Number.isFinite(bearingNum) && Math.abs(bearingNum - 165) <= 1 &&
    Number.isFinite(needleDeg) && Math.abs(needleDeg - EXTERNAL_REF) <= EXTERNAL_MARGIN,
  `عرض=${bearingNum}° إبرة=${Number.isFinite(needleDeg) ? needleDeg.toFixed(2) : needleStyle}° مرجع=${EXTERNAL_REF.toFixed(2)}°`,
)
await page.screenshot({ path: shotPath('bc005-qibla-latakia') })

// مقارنة استقلالية إضافية عبر صيغة مستقلة داخل السكربت (لا تمرّ عبر كود المنتج)
function qiblaIndependent(latDeg, lngDeg, mkLatDeg, mkLngDeg) {
  const toRad = (d) => (d * Math.PI) / 180
  const phi1 = toRad(latDeg)
  const phi2 = toRad(mkLatDeg)
  const dLng = toRad(mkLngDeg - lngDeg)
  const y = Math.sin(dLng)
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}
const indie = qiblaIndependent(35.53, 35.79, 21.4225, 39.8262)
rep.check(
  'القبلة: صيغة مستقلة داخل السكربت تطابق المرجع (±0.5)',
  Math.abs(indie - EXTERNAL_REF) <= EXTERNAL_MARGIN,
  `مستقلة=${indie.toFixed(2)}° مرجع=${EXTERNAL_REF.toFixed(2)}°`,
)

// ---- 3) خطوة الدقيقة مع الحصر ±30 (محرر الإعدادات) ----
const fajrRow = page.locator('[data-prayer="fajr"]').first()
await fajrRow.scrollIntoViewIfNeeded()
await page.waitForTimeout(250)
const readVal = () =>
  page.evaluate(() => {
    const row = document.querySelector('[data-prayer="fajr"]')
    const v = row ? row.querySelector('.prayer-adjust-editor__value') : null
    return v ? v.textContent.trim() : ''
  })
const fajrPlusBtn = fajrRow.locator('[aria-label="زيادة وقت الفجر بدقيقة"]')
const fajrMinusBtn = fajrRow.locator('[aria-label="تقليل وقت الفجر بدقيقة"]')

// -30 سريعاً لنقطة بداية نظيفة ثم تصعيد إلى +30 (نقر مع تمكين فقط — الحصر يعطّل الزر)
let guard = 0
while (!(await fajrMinusBtn.isDisabled()) && guard++ < 40) await fajrMinusBtn.click()
await page.waitForTimeout(200)
const valMinus30 = await readVal()
const disabledAtMinus30 = await fajrMinusBtn.isDisabled()
rep.check('خطوة: الحصر عند −30 (زر معطَّل)', valMinus30 === '-30 دقيقة' && disabledAtMinus30, valMinus30)
guard = 0
while (!(await fajrPlusBtn.isDisabled()) && guard++ < 70) await fajrPlusBtn.click()
await page.waitForTimeout(200)
const valPlus30 = await readVal()
const disabledAtPlus30 = await fajrPlusBtn.isDisabled()
rep.check('خطوة: الحصر عند +30 (زر معطَّل)', valPlus30 === '+30 دقيقة' && disabledAtPlus30, valPlus30)
await page.screenshot({ path: shotPath('bc005-step-clamp') })

rep.addErrors(errors, 'bc004-qibla')
const code = rep.finish()
await browser.close()
process.exit(code)
