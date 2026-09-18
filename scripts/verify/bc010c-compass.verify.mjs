/**
 * تحقق BC-010c.1 — البوصلة الجديدة: القبلة بطلة + رمز كعبة، الشمال مرجع ثانوي،
 * مؤشر ثلاثي (>15 رمادي / 5–15 أصفر / ≤5 أخضر)، عرض رقمي للانحراف، واهتزاز عند
 * الوصول قابل للإيقاف من الإعدادات.
 * يعمل على المعاينة الحية — لا يعدّل أي كود. يحاكي DeviceOrientationEvent.
 */

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE_DIR = join(ROOT, 'docs', 'evidence', 'BC-010', 'compass')
process.env.RESULT_DIR ||= join(EVIDENCE_DIR, 'results')
process.env.SHOT_DIR ||= EVIDENCE_DIR

const { openPage, makeReporter, skipSplash, toAsciiDigits } = await import('./lib/harness.mjs')

const LAT = 35.53
const LNG = 35.79
const toRad = (d) => (d * Math.PI) / 180
const BEARING = (() => {
  const phi1 = toRad(LAT)
  const phi2 = toRad(21.4225)
  const dLng = toRad(39.8262 - LNG)
  const y = Math.sin(dLng)
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLng)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
})()

mkdirSync(EVIDENCE_DIR, { recursive: true })

const rep = makeReporter('bc010c-compass')
const { browser, page, errors } = await openPage({ viewport: { width: 390, height: 844 } })

await page.addInitScript(
  ({ lat, lng }) => {
    window.__vibrateCalls = []
    if (navigator.vibrate) {
      navigator.vibrate = (pattern) => {
        window.__vibrateCalls.push(pattern)
        return true
      }
    } else {
      Object.defineProperty(navigator, 'vibrate', {
        configurable: true,
        value: (pattern) => {
          window.__vibrateCalls.push(pattern)
          return true
        },
      })
    }
    if (!('DeviceOrientationEvent' in window)) {
      window.DeviceOrientationEvent = function DeviceOrientationEvent() {}
    }
    localStorage.setItem('mushaf-al-huda:location', JSON.stringify({ latitude: lat, longitude: lng }))
    localStorage.setItem('mushaf-al-huda:haptics', 'true')
  },
  { lat: LAT, lng: LNG },
)

const BASE = process.env.PREVIEW_URL || 'http://localhost:5199'

async function setHeading(deg) {
  const alpha = ((360 - deg) % 360 + 360) % 360
  await page.evaluate((a) => {
    for (let i = 0; i < 6; i += 1) {
      const event = new Event('deviceorientation')
      event.alpha = a
      window.dispatchEvent(event)
    }
  }, alpha)
  await page.waitForTimeout(120)
}

async function openCompass() {
  await page.goto(`${BASE}/#/prayer`, { waitUntil: 'networkidle' })
  await skipSplash(page, '[data-testid="qibla-compass"]')
  await page.waitForSelector('[data-testid="qibla-compass"]', { timeout: 15000 })
  const start = page.locator('[data-testid="qibla-start"]')
  if (await start.count()) {
    await start.click()
  }
  await page.waitForFunction(
    () => document.querySelector('[data-testid="qibla-status"]')?.textContent?.includes('مفعّلة'),
    { timeout: 8000 },
  )
}

// 1) البنية: كعبة + شمال + وردة + مؤشر الانحراف
await openCompass()
const structure = await page.evaluate(() => ({
  compass: !!document.querySelector('[data-testid="qibla-compass"]'),
  kaaba: !!document.querySelector('[data-testid="qibla-kaaba"] svg'),
  north: !!document.querySelector('.qibla-compass__dir--n'),
  rose: !!document.querySelector('.qibla-compass__rose'),
  align: !!document.querySelector('[data-testid="qibla-align"]'),
  deviation: !!document.querySelector('[data-testid="qibla-deviation"]'),
}))
rep.check(
  'البنية: قبلة بطلة برمز كعبة + شمال مرجعي + وردة + مؤشر انحراف',
  structure.compass &&
    structure.kaaba &&
    structure.north &&
    structure.rose &&
    structure.align &&
    structure.deviation,
  JSON.stringify(structure),
)

// 2) الحالة 1: انحراف > 15° → رمادي «ليس الاتجاه»
await setHeading(BEARING - 40)
const far = await page.evaluate(() => ({
  cls: document.querySelector('[data-testid="qibla-align"]')?.className || '',
  label: document.querySelector('[data-testid="qibla-align"]')?.textContent || '',
  deviation: document.querySelector('[data-testid="qibla-deviation"]')?.textContent || '',
}))
rep.check(
  'المؤشر: انحراف 40° → «ليس الاتجاه» (رمادي is-far)',
  far.cls.includes('is-far') && far.label.includes('ليس الاتجاه'),
  `${far.cls} | ${far.deviation}`,
)
await page.screenshot({ path: join(EVIDENCE_DIR, 'state-far.png') })

// 3) الحالة 2: انحراف 10° → أصفر «اقترب» + عرض رقمي «يمينًا»
await setHeading(BEARING - 10)
const near = await page.evaluate(() => ({
  cls: document.querySelector('[data-testid="qibla-align"]')?.className || '',
  label: document.querySelector('[data-testid="qibla-align"]')?.textContent || '',
  deviation: document.querySelector('[data-testid="qibla-deviation"]')?.textContent || '',
}))
const nearDev = toAsciiDigits(near.deviation)
rep.check(
  'المؤشر: انحراف 10° → «اقترب» (أصفر is-near) + «10° يمينًا»',
  near.cls.includes('is-near') && near.label.includes('اقترب') && /10/.test(nearDev) && nearDev.includes('يمينًا'),
  `${near.cls} | ${near.deviation}`,
)
await page.screenshot({ path: join(EVIDENCE_DIR, 'state-near.png') })

// 4) الحالة 3: انحراف 0° → أخضر «الاتجاه صحيح ✓»
await setHeading(BEARING)
const aligned = await page.evaluate(() => ({
  cls: document.querySelector('[data-testid="qibla-align"]')?.className || '',
  label: document.querySelector('[data-testid="qibla-align"]')?.textContent || '',
  deviation: document.querySelector('[data-testid="qibla-deviation"]')?.textContent || '',
  vibrateCalls: window.__vibrateCalls.slice(),
}))
rep.check(
  'المؤشر: انحراف 0° → «الاتجاه صحيح ✓» (أخضر is-aligned)',
  aligned.cls.includes('is-aligned') && aligned.label.includes('الاتجاه صحيح'),
  `${aligned.cls} | ${aligned.deviation}`,
)
await page.screenshot({ path: join(EVIDENCE_DIR, 'state-aligned.png') })

// 5) الاهتزاز عند الوصول (مفعّل)
rep.check(
  'الاهتزاز: نبضة واحدة عند الوصول إلى الاتجاه',
  aligned.vibrateCalls.length >= 1 && aligned.vibrateCalls[aligned.vibrateCalls.length - 1] === 30,
  JSON.stringify(aligned.vibrateCalls),
)

// 6) إيقاف الاهتزاز من الإعدادات + انعكاسه على التخزين
await page.goto(`${BASE}/#/settings`, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="haptics-group"]', { timeout: 15000 })
const toggle = page.locator('[data-testid="haptics-toggle"]')
const checkedBefore = await toggle.getAttribute('aria-checked')
await toggle.click()
await page.waitForTimeout(200)
const checkedAfter = await toggle.getAttribute('aria-checked')
const stored = await page.evaluate(() => localStorage.getItem('mushaf-al-huda:haptics'))
rep.check(
  'الإعدادات: مفتاح الاهتزاز يبدأ مفعّلًا ثم يُطفأ ويُحفظ',
  checkedBefore === 'true' && checkedAfter === 'false' && stored === 'false',
  `قبل=${checkedBefore} بعد=${checkedAfter} مخزّن=${stored}`,
)

// 7) مع إيقاف الاهتزاز: الوصول لا يُهزّ الجهاز
await openCompass()
await page.evaluate(() => {
  window.__vibrateCalls = []
})
await setHeading(BEARING - 30)
await setHeading(BEARING)
const muted = await page.evaluate(() => ({
  cls: document.querySelector('[data-testid="qibla-align"]')?.className || '',
  vibrateCalls: window.__vibrateCalls.slice(),
}))
rep.check(
  'الاهتزاز المعطَّل: الوصول لا يُطلق أي نبضة',
  muted.cls.includes('is-aligned') && muted.vibrateCalls.length === 0,
  JSON.stringify(muted.vibrateCalls),
)

rep.addErrors(errors, 'bc010c-compass')
const code = rep.finish()
await browser.close()
process.exit(code)
