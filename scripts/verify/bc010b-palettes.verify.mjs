/**
 * BC-010 المرحلة 2 — الهويات اللونية (3 أذكار + 3 صلاة) وصفحة المعاينة #/palette-preview.
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 * يلتقط 12 لقطة (2 قسم × 2 وضع × 3 لوحات) في docs/evidence/BC-010/palettes.
 */

import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const EVIDENCE_DIR = join(ROOT, 'docs', 'evidence', 'BC-010', 'palettes')
process.env.RESULT_DIR ||= join(EVIDENCE_DIR, 'results')
process.env.SHOT_DIR ||= EVIDENCE_DIR

const { openPage, makeReporter } = await import('./lib/harness.mjs')

const SECTIONS = [
  { key: 'adhkar', label: 'الأذكار', screen: '.adhkar-card' },
  { key: 'prayer', label: 'الصلاة', screen: '.prayer-panel' },
]
const PALETTES = ['A', 'B', 'C']
const MODES = ['light', 'dark']

const rep = makeReporter('bc010b-palettes')
const { browser, page, errors } = await openPage({ viewport: { width: 390, height: 844 } })

const BASE = process.env.PREVIEW_URL || 'http://localhost:5199'
await page.goto(`${BASE}/#/palette-preview`, { waitUntil: 'networkidle' })
await page.waitForSelector('[data-testid="palette-preview"]', { timeout: 15000 })
await page.waitForTimeout(300)

async function select(sectionKey, paletteId, mode) {
  await page.click(`[data-testid="pv-section-${sectionKey}"]`)
  await page.waitForTimeout(80)
  await page.click(`[data-testid="pv-palette-${paletteId}"]`)
  await page.waitForTimeout(80)
  await page.click(`[data-testid="pv-mode-${mode}"]`)
  await page.waitForTimeout(150)
}

// 1) صفحة المعاينة تعمل وتُظهر اللوحة الحالية باسمها ورمزها
const initial = await page.evaluate(() => {
  const root = document.querySelector('[data-testid="palette-preview"]')
  const current = document.querySelector('[data-testid="pv-current"]')
  return {
    present: !!root,
    text: current ? current.textContent.replace(/\s+/g, ' ').trim() : '',
  }
})
rep.check(
  '#/palette-preview: الصفحة تعمل وتُظهر اسم اللوحة ورموزها',
  initial.present && /Bakery\/Cafe/.test(initial.text) && /#63/.test(initial.text),
  initial.text,
)

// 2) التبديل بين 6 تركيبات (قسم × لوحة) بلا أخطاء + الشاشة الحقيقية تظهر
const comboChecks = []
for (const section of SECTIONS) {
  for (const id of PALETTES) {
    await select(section.key, id, 'light')
    const state = await page.evaluate((sel) => {
      const root = document.querySelector('[data-testid="palette-preview"]')
      const currentId = document.querySelector('[data-testid="pv-current-id"]')
      return {
        alive: !!root,
        id: currentId ? currentId.textContent.trim() : '',
        screen: document.querySelectorAll(sel).length,
        errorState: !!document.querySelector('.status--error'),
      }
    }, section.screen)
    if (!state.alive || !state.id.includes(`· ${id}`) || state.screen < 1 || state.errorState) {
      comboChecks.push(`${section.key}/${id}: ${JSON.stringify(state)}`)
    }
  }
}
rep.check(
  'التبديل: 6 تركيبات (قسم × لوحة) تعمل وتعرض الشاشة الحقيقية بلا خطأ',
  comboChecks.length === 0,
  comboChecks.join(' | ') || '6/6',
)

// 3) التبويب النشط (أزرار التحكم): خلفية + لون + وزن — لا لون فقط
const activeStyle = await page.evaluate(() => {
  const pick = (group) => {
    const active = document.querySelector(`.pv-group [data-testid^="${group}"].is-active`)
    const idle = document.querySelector(`.pv-group [data-testid^="${group}"]:not(.is-active)`)
    if (!active || !idle) return null
    const a = getComputedStyle(active)
    const i = getComputedStyle(idle)
    return {
      bg: a.backgroundColor,
      idleBg: i.backgroundColor,
      color: a.color,
      idleColor: i.color,
      weight: a.fontWeight,
      idleWeight: i.fontWeight,
    }
  }
  return { section: pick('pv-section-'), palette: pick('pv-palette-'), mode: pick('pv-mode-') }
})
const isTransparent = (c) => !c || c === 'transparent' || /rgba\(0,\s*0,\s*0,\s*0\)/.test(c)
const bold = (w) => Number(w) >= 600 || w === 'bold'
const groupOk = (s) =>
  !!s &&
  !isTransparent(s.bg) &&
  s.bg !== s.idleBg &&
  s.color !== s.idleColor &&
  bold(s.weight) &&
  !bold(s.idleWeight)
rep.check(
  'أزرار التحكم: التبويب النشط يتميّز بخلفية + لون + وزن',
  groupOk(activeStyle.section) && groupOk(activeStyle.palette) && groupOk(activeStyle.mode),
  JSON.stringify(activeStyle),
)

// 4) BottomNav داخل الصفحة + التبويب النشط فيه: خلفية + لون + وزن
await select('adhkar', 'A', 'light')
const navStyle = await page.evaluate(() => {
  const nav = document.querySelector('[data-testid="bottom-nav"]')
  const active = nav?.querySelector('.bottom-nav__tab.is-active')
  const idle = nav?.querySelector('.bottom-nav__tab:not(.is-active)')
  if (!nav || !active || !idle) return null
  const n = getComputedStyle(nav)
  const a = getComputedStyle(active)
  const i = getComputedStyle(idle)
  return {
    inPreview: !!document.querySelector('.palette-preview [data-testid="bottom-nav"]'),
    position: n.position,
    bg: a.backgroundColor,
    idleBg: i.backgroundColor,
    color: a.color,
    idleColor: i.color,
    weight: a.fontWeight,
    idleWeight: i.fontWeight,
  }
})
rep.check(
  'BottomNav: مدمج داخل المعاينة والتبويب النشط بخلفية + لون + وزن',
  !!navStyle &&
    navStyle.inPreview &&
    navStyle.position === 'fixed' &&
    !isTransparent(navStyle.bg) &&
    navStyle.bg !== navStyle.idleBg &&
    navStyle.color !== navStyle.idleColor &&
    bold(navStyle.weight) &&
    !bold(navStyle.idleWeight),
  JSON.stringify(navStyle),
)

// 5) اللوحات الثلاث مختلفة فعليًا (3 أسطح مميزة لكل قسم × وضع) + tint ليلي لصلاة B/C
async function surfacesOf(sectionKey, mode) {
  const list = []
  for (const id of PALETTES) {
    await select(sectionKey, id, mode)
    list.push(
      await page.evaluate(() =>
        getComputedStyle(document.querySelector('.palette-preview')).backgroundColor,
      ),
    )
  }
  return list
}

const NEUTRAL_DARK = 'rgb(15, 23, 42)' // #0F172A — سطح الليل الأساسي قبل tint
const surfaces = { adhkar: {}, prayer: {} }
for (const section of SECTIONS) {
  for (const mode of MODES) {
    surfaces[section.key][mode] = await surfacesOf(section.key, mode)
  }
}

const badSurfaces = []
for (const section of SECTIONS) {
  for (const mode of MODES) {
    if (new Set(surfaces[section.key][mode]).size !== 3) {
      badSurfaces.push(`${section.key}/${mode}: ${surfaces[section.key][mode].join(',')}`)
    }
  }
}
rep.check(
  'الأذكار: سطح مختلف فعليًا لكل من A/B/C (نهاري وليلي)',
  new Set(surfaces.adhkar.light).size === 3 && new Set(surfaces.adhkar.dark).size === 3,
  badSurfaces.filter((v) => v.startsWith('adhkar')).join(' | ') || '3 ألوان مميزة × وضعين',
)
rep.check(
  'الصلاة: سطح مختلف فعليًا لكل من A/B/C (نهاري وليلي)',
  new Set(surfaces.prayer.light).size === 3 && new Set(surfaces.prayer.dark).size === 3,
  badSurfaces.filter((v) => v.startsWith('prayer')).join(' | ') || '3 ألوان مميزة × وضعين',
)

const prayerDark = surfaces.prayer.dark
const tinted = prayerDark[1] !== NEUTRAL_DARK && prayerDark[2] !== NEUTRAL_DARK && prayerDark[1] !== prayerDark[2]
rep.check(
  'الصلاة ليلي: سطح B/C مُضوّى (tint) خارج الرمادي المحايد #0F172A',
  tinted,
  `B=${prayerDark[1]} C=${prayerDark[2]}`,
)

// 6) الوضعان مختلفان (خلفية نهاري ≠ ليلي)
await select('adhkar', 'A', 'light')
const lightBg = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.palette-preview')).backgroundColor,
)
await select('adhkar', 'A', 'dark')
const darkBg = await page.evaluate(() =>
  getComputedStyle(document.querySelector('.palette-preview')).backgroundColor,
)
rep.check('الوضعان: نهاري ≠ ليلي (تبديل فعلي)', lightBg !== darkBg, `${lightBg} vs ${darkBg}`)

// ---- 12 لقطة: 2 قسم × 2 وضع × 3 لوحات ----
mkdirSync(EVIDENCE_DIR, { recursive: true })
for (const mode of MODES) {
  for (const section of SECTIONS) {
    for (const id of PALETTES) {
      await select(section.key, id, mode)
      await page.waitForTimeout(120)
      await page.screenshot({
        path: join(EVIDENCE_DIR, `${section.key}-${mode}-${id}.png`),
      })
    }
  }
}

rep.addErrors(errors, 'bc010b-palettes')
const code = rep.finish()
await browser.close()
process.exit(code)
