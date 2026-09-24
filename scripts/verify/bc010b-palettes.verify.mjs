/**
 * BC-010 — اللوحات المطبَّقة (A أذكار / B صلاة) بعد حذف #/palette-preview.
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 */

import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE_DIR = join(ROOT, 'docs', 'evidence', 'BC-010', 'palettes')
process.env.RESULT_DIR ||= join(EVIDENCE_DIR, 'results')
process.env.SHOT_DIR ||= EVIDENCE_DIR

const { openPage, makeReporter, skipSplash } = await import('./lib/harness.mjs')

const BASE = process.env.PREVIEW_URL || 'http://localhost:5199'
const NEUTRAL_DARK = 'rgb(15, 23, 42)'

const ADHKAR_LIGHT = 'rgb(254, 243, 199)'
const ADHKAR_DARK = 'rgb(20, 9, 2)'
const PRAYER_LIGHT = 'rgb(244, 244, 254)'
const PRAYER_DARK = 'rgb(23, 31, 62)'

const rep = makeReporter('bc010b-palettes')
const { browser, page, errors } = await openPage({ viewport: { width: 390, height: 844 } })

await page.goto(`${BASE}/#/`, { waitUntil: 'networkidle' })
await skipSplash(page)

async function setTheme(theme) {
  await page.evaluate((t) => {
    const raw = localStorage.getItem('mushaf-al-huda:settings')
    let s = { fontSize: 'medium', theme: t }
    try {
      if (raw) s = { ...JSON.parse(raw), theme: t }
    } catch {
      /* ignore */
    }
    localStorage.setItem('mushaf-al-huda:settings', JSON.stringify(s))
  }, theme)
  await page.reload({ waitUntil: 'networkidle' })
  await skipSplash(page, null)
}

async function go(hash, ready) {
  await page.evaluate((h) => {
    window.location.hash = h
  }, hash)
  if (ready) await page.waitForSelector(ready, { timeout: 15000 })
  await page.waitForTimeout(250)
}

const isTransparent = (c) => !c || c === 'transparent' || /rgba\(0,\s*0,\s*0,\s*0\)/.test(c)
const bold = (w) => Number(w) >= 600 || w === 'bold'

await setTheme('light')
await go('#/adhkar', '.adhkar-screen')

const adhkarLight = await page.evaluate(() => {
  const pageEl = document.querySelector('.adhkar-page')
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  const active = nav?.querySelector('.bottom-nav__tab.is-active')
  const idle = nav?.querySelector('.bottom-nav__tab:not(.is-active)')
  const a = active ? getComputedStyle(active) : null
  const i = idle ? getComputedStyle(idle) : null
  return {
    bg: pageEl ? getComputedStyle(pageEl).backgroundColor : '',
    cards: document.querySelectorAll('.adhkar-card').length,
    section: nav?.getAttribute('data-active-section') || '',
    nav: a && i
      ? {
          bg: a.backgroundColor,
          idleBg: i.backgroundColor,
          color: a.color,
          idleColor: i.color,
          weight: a.fontWeight,
          idleWeight: i.fontWeight,
        }
      : null,
  }
})
rep.check(
  'الأذكار: سطح A النهاري مطبَّق (Bakery/Cafe #FEF3C7)',
  adhkarLight.bg === ADHKAR_LIGHT && adhkarLight.cards >= 1,
  `bg=${adhkarLight.bg} cards=${adhkarLight.cards}`,
)

rep.check(
  'BottomNav: التبويب النشط بخلفية + لون + وزن على الشاشة الحقيقية',
  !!adhkarLight.nav &&
    !isTransparent(adhkarLight.nav.bg) &&
    adhkarLight.nav.bg !== adhkarLight.nav.idleBg &&
    adhkarLight.nav.color !== adhkarLight.nav.idleColor &&
    bold(adhkarLight.nav.weight) &&
    !bold(adhkarLight.nav.idleWeight),
  JSON.stringify(adhkarLight.nav),
)

await go('#/prayer', '[data-testid="prayer-page"]')
const prayerLight = await page.evaluate(() => {
  const pageEl = document.querySelector('.prayer-page')
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  return {
    bg: pageEl ? getComputedStyle(pageEl).backgroundColor : '',
    panel: !!document.querySelector('.prayer-panel'),
    section: nav?.getAttribute('data-active-section') || '',
  }
})
rep.check(
  'الصلاة: سطح B النهاري مطبَّق (Alarm & World Clock #F4F4FE)',
  prayerLight.bg === PRAYER_LIGHT && prayerLight.panel,
  `bg=${prayerLight.bg} panel=${prayerLight.panel}`,
)

rep.check(
  'BottomNav: data-active-section يتبدل أذكار/صلاة',
  adhkarLight.section === 'adhkar' && prayerLight.section === 'prayer',
  `adhkar=${adhkarLight.section} prayer=${prayerLight.section}`,
)

await setTheme('dark')
await go('#/adhkar', '.adhkar-screen')
const adhkarDarkBg = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.adhkar-page')).backgroundColor,
)
rep.check(
  'الأذكار ليلي: سطح A.dark مطبَّق (#140902)',
  adhkarDarkBg === ADHKAR_DARK,
  adhkarDarkBg,
)

await go('#/prayer', '[data-testid="prayer-page"]')
const prayerDarkBg = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.prayer-page')).backgroundColor,
)
rep.check(
  'الصلاة ليلي: سطح B.dark مُضوّى (tint) خارج الرمادي المحايد #0F172A',
  prayerDarkBg === PRAYER_DARK && prayerDarkBg !== NEUTRAL_DARK,
  `B=${prayerDarkBg}`,
)

rep.check(
  'الوضعان: نهاري ≠ ليلي (تبديل فعلي على الشاشات الحقيقية)',
  adhkarLight.bg !== adhkarDarkBg && prayerLight.bg !== prayerDarkBg,
  `adhkar ${adhkarLight.bg} vs ${adhkarDarkBg} | prayer ${prayerLight.bg} vs ${prayerDarkBg}`,
)

await page.goto(`${BASE}/#/palette-preview`, { waitUntil: 'networkidle' })
await page.waitForTimeout(200)
const previewGone = await page.evaluate(() => ({
  hash: window.location.hash,
  preview: !!document.querySelector('[data-testid="palette-preview"]'),
  app: !!document.querySelector('.app'),
}))
rep.check(
  'حذف المعاينة: #/palette-preview لم يعد صفحة مستقلة',
  !previewGone.preview && previewGone.app,
  JSON.stringify(previewGone),
)

rep.addErrors(errors, 'bc010b-palettes')
const code = rep.finish()
await browser.close()
process.exit(code)
