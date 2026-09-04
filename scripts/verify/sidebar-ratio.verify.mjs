/**
 * إعادة توازن الشريط الجانبي — نسبة قائمة السور ≥ 60% في العرض الافتراضي.
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 */

import { openPage, shotPath, makeReporter } from './lib/harness.mjs'

const rep = makeReporter('sidebar-ratio')
const { browser, page, errors } = await openPage()

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector('.sidebar', { timeout: 15000 })
await page.waitForSelector('.surah-list-scroll', { timeout: 15000 })
await page.waitForTimeout(600)

const measure = await page.evaluate(() => {
  const list = document.querySelector('.surah-list-scroll')
  const sidebar = document.querySelector('.sidebar')
  if (!list || !sidebar) return null
  const lr = list.getBoundingClientRect()
  const sr = sidebar.getBoundingClientRect()
  const listH = lr.height
  const sidebarH = sr.height
  return { listH: Math.round(listH), sidebarH: Math.round(sidebarH), ratio: (listH / sidebarH) * 100 }
})

rep.check(
  'الشريط: نسبة قائمة السور ≥ 60% في العرض الافتراضي',
  measure != null && measure.ratio >= 60,
  measure ? `${measure.listH}/${measure.sidebarH}px = ${measure.ratio.toFixed(2)}%` : 'لا قياس',
)

if (measure) {
  await page.evaluate((m) => {
    const tag = document.createElement('div')
    tag.textContent = `قائمة السور: ${m.listH}/${m.sidebarH}px = ${m.ratio.toFixed(2)}% (≥60%)`
    tag.style.cssText =
      'position:fixed;bottom:10px;left:10px;z-index:99999;background:#0c3b2e;color:#fff;font:13px/1.4 system-ui,sans-serif;padding:6px 12px;border-radius:8px;direction:rtl;'
    document.body.appendChild(tag)
  }, measure)
  await page.waitForTimeout(250)
  await page.screenshot({ path: shotPath('bc005-sidebar-ratio') })
  await page.evaluate(() => {
    document.querySelectorAll('div').forEach((d) => {
      if (d.textContent && d.textContent.includes('≥60%')) d.remove()
    })
  })
}

rep.addErrors(errors, 'sidebar-ratio')
const code = rep.finish()
await browser.close()
process.exit(code)
