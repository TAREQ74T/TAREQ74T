/**
 * BC-009 — تخطيط القائمة ومحاذاة الآيات.
 * 1) قائمة السور: سورة واحدة لكل صف على 390px و1440px (قياس boundingBox().y).
 * 2) الآيات: كل سطر = عرض الحاوية ما عدا السطر الأخير (justify فعّالة).
 * 3) النجمة لا تتراكب مع أول سطر.
 * يعمل على المعاينة الحية (dist) — لا يعدّل أي كود.
 */

import { openPage, makeReporter, skipSplash } from './lib/harness.mjs'

const rep = makeReporter('bc009-layout')

async function setTheme(page, theme) {
  await page.evaluate((t) => {
    localStorage.setItem(
      'mushaf-al-huda:settings',
      JSON.stringify({ fontSize: 'medium', theme: t }),
    )
  }, theme)
  await page.reload({ waitUntil: 'networkidle' })
  await skipSplash(page)
}

async function surahRows(page) {
  return page.evaluate(() => {
    const items = [...document.querySelectorAll('.surah-item')]
    const rows = new Map()
    for (const el of items) {
      const y = Math.round(el.getBoundingClientRect().top)
      rows.set(y, (rows.get(y) || 0) + 1)
    }
    const counts = [...rows.values()]
    return {
      count: items.length,
      rowCount: rows.size,
      maxPerRow: counts.length ? Math.max(...counts) : 0,
    }
  })
}

async function ayahLines(page) {
  return page.evaluate(() => {
    const el = document.querySelector('.ayah[data-ayah-number="255"] .ayah-text')
    if (!el) return null
    const span = el.querySelector('span')
    const cs = getComputedStyle(el)
    const contentWidth =
      el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
    const range = document.createRange()
    range.selectNodeContents(span)
    const widths = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => r.width)
    const nonLast = widths.slice(0, -1)
    const maxDiff = nonLast.length
      ? Math.max(...nonLast.map((w) => Math.abs(w - contentWidth)))
      : Infinity
    return {
      display: cs.display,
      textAlign: cs.textAlign,
      contentWidth: Math.round(contentWidth),
      totalLines: widths.length,
      lineWidths: widths.map((w) => Math.round(w)),
      nonLastMaxDiff: Math.round(maxDiff),
    }
  })
}

async function bookmarkOverlap(page) {
  return page.evaluate(() => {
    const ayah = document.querySelector('.ayah[data-ayah-number="255"]')
    const actions = ayah.querySelector('.ayah-actions')
    const text = ayah.querySelector('.ayah-text')
    const span = text.querySelector('span')
    const range = document.createRange()
    range.selectNodeContents(span)
    const first = [...range.getClientRects()].filter((r) => r.width > 0)[0]
    if (!actions || !first) return null
    const a = actions.getBoundingClientRect()
    return !(a.right <= first.left || a.left >= first.right || a.bottom <= first.top || a.top >= first.bottom)
  })
}

async function gotoAyah(page) {
  await page.evaluate(() => {
    window.location.hash = '#/surah/2/255'
  })
  await page.waitForSelector('.ayah[data-ayah-number="255"]', { timeout: 15000 })
  await page.waitForTimeout(500)
}

const { browser, page, errors } = await openPage({ viewport: { width: 1440, height: 900 } })
await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', { waitUntil: 'networkidle' })
await skipSplash(page)

for (const { theme, width, height } of [
  { theme: 'light', width: 1440, height: 900 },
  { theme: 'light', width: 390, height: 844 },
  { theme: 'dark', width: 1440, height: 900 },
  { theme: 'dark', width: 390, height: 844 },
]) {
  await setTheme(page, theme)
  await page.setViewportSize({ width, height })
  await page.waitForTimeout(250)

  const rows = await surahRows(page)
  rep.check(
    `قائمة ${theme} ${width}: سورة واحدة لكل صف (114 صفًا)`,
    rows.count === 114 && rows.rowCount === 114 && rows.maxPerRow === 1,
    `count=${rows.count} rows=${rows.rowCount} maxPerRow=${rows.maxPerRow}`,
  )

  await gotoAyah(page)
  const lines = await ayahLines(page)
  rep.check(
    `آيات ${theme} ${width}: العنصر block وjustify فعّالة`,
    lines != null && lines.display === 'block' && lines.textAlign === 'justify',
    `display=${lines?.display} align=${lines?.textAlign}`,
  )
  rep.check(
    `آيات ${theme} ${width}: كل الأسطر = عرض الحاوية عدا الأخير`,
    lines != null && lines.totalLines > 1 && lines.nonLastMaxDiff <= 2,
    `content=${lines?.contentWidth} lines=${JSON.stringify(lines?.lineWidths)} maxDiff=${lines?.nonLastMaxDiff}`,
  )
  const overlap = await bookmarkOverlap(page)
  rep.check(
    `نجمة ${theme} ${width}: لا تراكب مع أول سطر`,
    overlap === false,
    `overlap=${overlap}`,
  )
}

rep.addErrors(errors, 'bc009')
const code = rep.finish()
await browser.close()
process.exit(code)
