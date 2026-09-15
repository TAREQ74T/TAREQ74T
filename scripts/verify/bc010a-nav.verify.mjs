/**
 * BC-010 المرحلة 1 — Bottom Nav + عناوين المسارات + نقل الصلاة/القبلة إلى تبويبها.
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 * يلتقط أيضًا 16 لقطة (4 تبويبات × 2 عرض × 2 وضع) في docs/evidence/BC-010/nav.
 */

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE_DIR = join(ROOT, 'docs', 'evidence', 'BC-010', 'nav')
process.env.RESULT_DIR ||= join(EVIDENCE_DIR, 'results')
process.env.SHOT_DIR ||= EVIDENCE_DIR

const { openPage, makeReporter, skipSplash } = await import('./lib/harness.mjs')

const rep = makeReporter('bc010a-nav')
const { browser, page, errors } = await openPage({ viewport: { width: 1440, height: 900 } })

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await skipSplash(page)

async function goto(hash, readySelector) {
  await page.evaluate((h) => {
    window.location.hash = h
  }, hash)
  if (readySelector) {
    await page.waitForSelector(readySelector, { timeout: 8000 })
  }
  await page.waitForTimeout(250)
}

// 1) Bottom Nav ثابت أسفل + 4 تبويبات بالنصوص الصحيحة
const nav = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="bottom-nav"]')
  const tabs = [...document.querySelectorAll('[data-testid^="nav-"]')]
  return {
    present: !!el,
    position: el ? getComputedStyle(el).position : '',
    bottom: el ? getComputedStyle(el).bottom : '',
    count: tabs.length,
    labels: tabs.map((t) => t.textContent.trim()),
    svg: tabs.filter((t) => t.querySelector('svg')).length,
  }
})
rep.check(
  'التنقل: شريط سفلي ثابت أسفل الشاشة بأربع تبويبات',
  nav.present &&
    nav.position === 'fixed' &&
    nav.bottom === '0px' &&
    nav.count === 4 &&
    nav.svg === 4 &&
    ['القرآن', 'الصلاة', 'الأذكار', 'الإعدادات'].every((l) => nav.labels.includes(l)),
  `pos=${nav.position} bottom=${nav.bottom} tabs=${nav.count} svg=${nav.svg} labels=${nav.labels.join(',')}`,
)

// 2) تبويب القرآن: quran-page + الشريط الجانبي، بلا ترس/أذكار/لوحة صلاة
await goto('#/', '.quran-page')
const quranTab = await page.evaluate(() => ({
  quran: !!document.querySelector('.quran-page'),
  sidebar: !!document.querySelector('.sidebar'),
  gear: !!document.querySelector('.sidebar-gear-btn'),
  adhkar: !!document.querySelector('.sidebar-adhkar-btn'),
  panel: !!document.querySelector('.sidebar .prayer-panel'),
  active: !!document
    .querySelector('[data-testid="nav-quran"]')
    ?.classList.contains('is-active'),
}))
rep.check(
  'القرآن: الشريط الجانبي فقط (بلا ترس/أذكار/لوحة صلاة) والتبويب نشط',
  quranTab.quran &&
    quranTab.sidebar &&
    !quranTab.gear &&
    !quranTab.adhkar &&
    !quranTab.panel &&
    quranTab.active,
  JSON.stringify(quranTab),
)

// 3) تبويب الصلاة: prayer-page يحوي prayer-panel + qibla-compass
await goto('#/prayer', '[data-testid="prayer-page"]')
const prayerTab = await page.evaluate(() => ({
  page: !!document.querySelector('[data-testid="prayer-page"]'),
  panel: !!document.querySelector('.prayer-panel'),
  qibla: !!document.querySelector('[data-testid="qibla-compass"]'),
  sidebar: !!document.querySelector('.sidebar'),
}))
rep.check(
  'الصلاة: وقت الصلاة + القبلة داخل التبويب بلا شريط جانبي',
  prayerTab.page && prayerTab.panel && prayerTab.qibla && !prayerTab.sidebar,
  JSON.stringify(prayerTab),
)

// 4) تبويب الأذكار
await goto('#/adhkar', '.adhkar-screen')
rep.check(
  'الأذكار: تبويب الأذكار يعرض شاشة الأذكار',
  (await page.locator('.adhkar-screen').count()) === 1,
  `cards=${await page.locator('.adhkar-card').count()}`,
)

// 5) تبويب الإعدادات
await goto('#/settings', '.settings-page')
const settingsTab = await page.evaluate(() => ({
  page: !!document.querySelector('.settings-page'),
  qibla: !!document.querySelector('[data-testid="qibla-compass"]'),
  aboutBtn: !!document.querySelector('[data-testid="open-about"]'),
}))
rep.check(
  'الإعدادات: التبويب يعرض الإعدادات (بلا قبلة) مع مدخل «حول»',
  settingsTab.page && !settingsTab.qibla && settingsTab.aboutBtn,
  JSON.stringify(settingsTab),
)

// 6) #/settings/about صفحة فرعية
await goto('#/settings/about', '[data-testid="about-screen"]')
const about = await page.evaluate(() => ({
  screen: !!document.querySelector('[data-testid="about-screen"]'),
  hash: window.location.hash,
}))
rep.check(
  '#/settings/about: صفحة «حول» الفرعية تعمل',
  about.screen && about.hash === '#/settings/about',
  JSON.stringify(about),
)

// 7) زر العودة من About → #/settings
await page.click('.settings-back-btn')
await page.waitForSelector('.settings-page', { timeout: 8000 })
const backHash = await page.evaluate(() => window.location.hash)
rep.check('حول: زر العودة يعيد إلى #/settings', backHash === '#/settings', backHash)

// 8) الشريط الجانبي غائب خارج تبويب القرآن
const sidebarOutside = []
for (const [hash, ready] of [
  ['#/prayer', '[data-testid="prayer-page"]'],
  ['#/adhkar', '.adhkar-screen'],
  ['#/settings', '.settings-page'],
  ['#/settings/about', '[data-testid="about-screen"]'],
]) {
  await goto(hash, ready)
  const count = await page.locator('.sidebar').count()
  if (count > 0) sidebarOutside.push(hash)
}
rep.check(
  'الشريط الجانبي: يظهر في تبويب القرآن فقط',
  sidebarOutside.length === 0,
  sidebarOutside.join(',') || '0 خارج القرآن',
)

// ---- 16 لقطة أدلة: 4 تبويبات × 2 عرض × 2 وضع ----
mkdirSync(EVIDENCE_DIR, { recursive: true })
const TABS = [
  ['quran', '#/', '.quran-page'],
  ['prayer', '#/prayer', '[data-testid="prayer-page"]'],
  ['adhkar', '#/adhkar', '.adhkar-screen'],
  ['settings', '#/settings', '.settings-page'],
]
for (const theme of ['light', 'dark']) {
  await page.evaluate((t) => {
    document.documentElement.dataset.theme = t
    localStorage.setItem(
      'mushaf-al-huda:settings',
      JSON.stringify({ fontSize: 'medium', theme: t }),
    )
  }, theme)
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 })
    for (const [name, hash, ready] of TABS) {
      await goto(hash, ready)
      await page.waitForTimeout(200)
      await page.screenshot({ path: join(EVIDENCE_DIR, `${name}-${width}-${theme}.png`) })
    }
  }
}

rep.addErrors(errors, 'bc010a-nav')
const code = rep.finish()
await browser.close()
process.exit(code)
