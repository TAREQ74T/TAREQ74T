/**
 * انحدار BC-003 — الهجري (عرض/إزاحة/حفظ) وأوقات الصلاة (حساب/خطوة دقيقة/حفظ/إعادة ضبط).
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 */

import { openPage, shotPath, makeReporter, parseClockMinutes, toAsciiDigits } from './lib/harness.mjs'

const rep = makeReporter('bc003-prayers')
const { browser, page, errors } = await openPage()

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector('.quran-page, .sidebar', { timeout: 15000 })

async function openSettings() {
  await page.click('[aria-label="الإعدادات"]').catch(() => {})
  await page.waitForSelector('.settings-page', { timeout: 8000 })
  await page.waitForTimeout(300)
}

// ---- التاريخ الهجري: عرض + إزاحة + حفظ بعد reload + إعادة ضبط ----
await openSettings()
await page.waitForSelector('[data-testid="hijri-date"]', { timeout: 8000 })
const hijriEl = page.locator('[data-testid="hijri-date"]').first()
const hijriInitial = (await hijriEl.textContent().catch(() => '')).trim()
rep.check('هجري: التاريخ يعرض بصيغة صحيحة', /هـ/.test(hijriInitial) && hijriInitial.length > 8, hijriInitial)

await page.click('[aria-label="زيادة التاريخ الهجري يوماً"]').catch(() => {})
await page.waitForTimeout(350)
const hijriPlusOne = (await hijriEl.textContent().catch(() => '')).trim()
const badge = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="hijri-offset-badge"]')
  return b ? b.textContent.trim() : ''
})
rep.check('هجري: إزاحة +1 تُظهر الشارة وتغيّر اليوم', badge.includes('+1') && hijriPlusOne !== hijriInitial, `شارة=${badge}`)

await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await openSettings()
await page.waitForSelector('[data-testid="hijri-date"]', { timeout: 8000 })
const hijriAfterReload = (await hijriEl.textContent().catch(() => '')).trim()
const badgeAfterReload = await page.evaluate(() => {
  const b = document.querySelector('[data-testid="hijri-offset-badge"]')
  return b ? b.textContent.trim() : ''
})
rep.check(
  'هجري: الإزاحة تحفظ بعد reload',
  hijriAfterReload === hijriPlusOne && /\+1/.test(badgeAfterReload),
  `بعد reload=${hijriAfterReload}`,
)
await page.screenshot({ path: shotPath('bc005-hijri-offset') })

// إعادة ضبط الهجري
await page.click('[data-testid="hijri-reset"]').catch(() => {})
await page.waitForTimeout(300)
const hijriReset = (await hijriEl.textContent().catch(() => '')).trim()
rep.check('هجري: إعادة الضبط ترجع التاريخ الأصلي', hijriReset === hijriInitial, hijriReset)

// ---- أوقات الصلاة: حساب + تعديلات + حفظ + إعادة ضبط ----
const fajrRow = page.locator('[data-prayer="fajr"]').first()
await fajrRow.scrollIntoViewIfNeeded()
await page.waitForTimeout(200)
const readFajrTime = () =>
  page.evaluate(() => {
    const el = document.querySelector('[data-testid="edit-time-fajr"]')
    return el ? el.textContent.trim() : ''
  })
const readFajrVal = () =>
  page.evaluate(() => {
    const row = document.querySelector('[data-prayer="fajr"]')
    const v = row ? row.querySelector('.prayer-adjust-editor__value') : null
    return v ? v.textContent.trim() : ''
  })

const timeBase = await readFajrTime()
const baseMin = parseClockMinutes(timeBase)
rep.check('أوقات: الفجر يُحسب ويعرض بوقت صالح', baseMin != null, `${timeBase} → ${baseMin}د`)

// خطوة دقيقة واحدة
await fajrRow.locator('[aria-label="زيادة وقت الفجر بدقيقة"]').click()
await page.waitForTimeout(250)
const timePlus1 = await readFajrTime()
const plus1Min = parseClockMinutes(timePlus1)
const valPlus1 = await readFajrVal()
rep.check(
  'أوقات: خطوة +1 دقيقة تنقل العرض دقيقة واحدة',
  plus1Min != null && baseMin != null && (plus1Min - baseMin + 1440) % 1440 === 1 && valPlus1 === '+1 دقيقة',
  `${timeBase} → ${timePlus1}`,
)

// حفظ +15 بعد reload
for (let i = 0; i < 14; i++) {
  await fajrRow.locator('[aria-label="زيادة وقت الفجر بدقيقة"]').click()
}
await page.waitForTimeout(250)
const val15 = await readFajrVal()
rep.check('أوقات: +15 دقيقة مطبقة', val15 === '+15 دقيقة', val15)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForTimeout(400)
await openSettings()
await page.waitForSelector('[data-prayer="fajr"]', { timeout: 8000 })
const val15Reload = await readFajrVal()
rep.check('أوقات: تعديل +15 يحفظ بعد reload', val15Reload === '+15 دقيقة', val15Reload)

// إعادة الضبط الكلية
await page.click('[data-testid="settings-reset-all"]').catch(() => {})
await page.waitForTimeout(300)
const valReset = await readFajrVal()
rep.check('أوقات: إعادة الضبط ترجع إلى 0', valReset === '0 دقيقة', valReset)

// خيارا الطريقة والمذهب موجودان
const methodOk = await page.evaluate(() => {
  const m = document.querySelector('[data-testid="settings-method-select"]')
  const h = document.querySelector('[data-testid="settings-madhab-select"]')
  return m != null && h != null && m.value.length > 0
})
rep.check('أوقات: قائمة طريقة الحساب والمذهب موجودة', methodOk)

// ---- اللوحة الرئيسية: ملخص مطوي (هجري + القادمة) والصفوف عند التوسعة ----
await page.click('.settings-back-btn').catch(() => {})
await page.waitForSelector('.quran-page', { timeout: 8000 })
await page.waitForTimeout(500)
const summary = await page.evaluate(() => {
  const h = document.querySelector('[data-testid="panel-hijri"]')
  const n = document.querySelector('[data-testid="panel-next"]')
  return { h: h ? h.textContent.trim() : '', n: n ? n.textContent.trim() : '' }
})
rep.check('اللوحة: مطوية افتراضياً وتعرض ملخصاً (هجري + القادمة)', summary.h.length > 0 && summary.n.length > 0, JSON.stringify(summary))
await page.screenshot({ path: shotPath('bc005-panel-summary') })

await page.click('[data-testid="prayer-panel-toggle"]').catch(() => {})
await page.waitForTimeout(400)
const rows = await page.$$eval('[data-testid^="time-"]', (els) => els.map((e) => e.textContent.trim()))
const timeOk = rows.length >= 5 && rows.every((t) => parseClockMinutes(t) != null)
rep.check('اللوحة: صفوف الصلوات تعرض أوقاتاً صالحة عند التوسعة', timeOk, `${rows.length} صفوف`)

rep.addErrors(errors, 'bc003-prayers')
const code = rep.finish()
await browser.close()
process.exit(code)
