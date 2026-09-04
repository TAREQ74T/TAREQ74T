/**
 * الوضع الليلي — تبديل، حفظ، وقابلية قراءة النصوص والأزرار (على النقيض في الوضع النهاري).
 * يعمل على المعاينة الحية — لا يعدّل أي كود.
 */

import { openPage, shotPath, makeReporter } from './lib/harness.mjs'

const rep = makeReporter('dark-mode')
const { browser, page, errors } = await openPage()

function parseRgb(color) {
  const m = String(color).match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(',').map((x) => Number(x.trim()))
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
}
function luminance(rgb) {
  const chan = (c) => {
    c /= 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b)
}
function contrast(l1, l2) {
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

const analyze = () =>
  page.evaluate(() => {
    const parseRgb = (color) => {
      const m = String(color).match(/rgba?\(([^)]+)\)/)
      if (!m) return null
      const parts = m[1].split(',').map((x) => Number(x.trim()))
      return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
    }
    const luminance = (rgb) => {
      const chan = (c) => {
        c /= 255
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
      }
      return 0.2126 * chan(rgb.r) + 0.7152 * chan(rgb.g) + 0.0722 * chan(rgb.b)
    }
    const contrast = (l1, l2) => {
      const hi = Math.max(l1, l2)
      const lo = Math.min(l1, l2)
      return (hi + 0.05) / (lo + 0.05)
    }
    const nearestBg = (el) => {
      let node = el
      while (node) {
        const bg = getComputedStyle(node).backgroundColor
        const m = bg.match(/rgba?\(([^)]+)\)/)
        if (m) {
          const p = m[1].split(',').map((x) => Number(x.trim()))
          if (p.length < 4 || p[3] > 0) return bg
        }
        node = node.parentElement
      }
      return 'rgb(0,0,0)'
    }
    const pick = (selector) => {
      const el = document.querySelector(selector)
      if (!el) return null
      const color = getComputedStyle(el).color
      const bg = nearestBg(el)
      return { selector, color, bg }
    }
    const samples = [
      '.sidebar-title',
      '.surah-name-en',
      '.surah-name',
      '.prayer-panel__toggle',
      '.ayah-text',
      '.sidebar-gear-btn',
    ]
    const out = {
      theme: document.documentElement.dataset.theme || 'light',
      bodyBg: getComputedStyle(document.body).backgroundColor,
      samples: samples
        .map(pick)
        .filter(Boolean)
        .map((s) => {
          const l = luminance(parseRgb(s.color))
          const b = luminance(parseRgb(s.bg))
          return { selector: s.selector, color: s.color, bg: s.bg, contrast: contrast(l, b) }
        }),
    }
    return out
  })

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector('.quran-page, .sidebar', { timeout: 15000 })

// تفعيل الوضع الليلي عبر الإعدادات
await page.click('[aria-label="الإعدادات"]').catch(() => {})
await page.waitForSelector('.settings-page', { timeout: 8000 })
const curTheme = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
if (curTheme !== 'dark') {
  await page.locator('.theme-option:has-text("ليلي")').first().click()
  await page.waitForTimeout(400)
}
const darkSet = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
rep.check('ليلي: تفعيل الثيم يضبط data-theme=dark', darkSet === 'dark', darkSet)
await page.screenshot({ path: shotPath('bc005-dark-settings') })

// الحفظ بعد reload (تظل الصفحة على الإعدادات بعد إعادة التحميل)
await page.reload({ waitUntil: 'networkidle' })
await page.waitForSelector('.settings-page', { timeout: 15000 })
await page.waitForTimeout(300)
const persisted = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
rep.check('ليلي: الثيم يُحفظ بعد reload', persisted === 'dark', persisted)
await page.click('.settings-back-btn').catch(() => {})
await page.waitForSelector('.quran-page', { timeout: 8000 })
await page.waitForTimeout(300)

// قراءة ألوان الواجهة الرئيسية في الليلي
const darkAnalysis = await analyze()
const darkTexts = darkAnalysis.samples.filter((s) => !s.selector.includes('gear'))
const darkOk =
  darkTexts.length > 0 && darkTexts.every((s) => s.contrast >= 4.0) &&
  darkTexts.every((s) => luminance(parseRgb(s.color)) > 0.25)
rep.check(
  'ليلي: نصوص الواجهة مقروءة (تباين ≥ 4.0 على خلفية داكنة)',
  darkOk,
  darkTexts.map((s) => `${s.selector.split('.').pop()}=${s.contrast.toFixed(2)}`).join(' '),
)
await page.screenshot({ path: shotPath('bc005-dark-quran') })

// العودة للنهاري والتأكد من التباين
await page.click('[aria-label="الإعدادات"]').catch(() => {})
await page.waitForSelector('.settings-page', { timeout: 8000 })
await page.locator('.theme-option:has-text("نهاري")').first().click()
await page.waitForTimeout(350)
const lightSet = await page.evaluate(() => document.documentElement.dataset.theme || 'light')
rep.check('نهاري: العودة للثيم الفاتح تعمل', lightSet === 'light', lightSet)
await page.click('.settings-back-btn').catch(() => {})
await page.waitForSelector('.quran-page', { timeout: 8000 })
await page.waitForTimeout(300)
const lightAnalysis = await analyze()
const lightBgLum = luminance(parseRgb(lightAnalysis.bodyBg) || { r: 255, g: 255, b: 255, a: 1 })
rep.check(
  'نهاري: الخلفية فاتحة بعد العودة',
  lightAnalysis.theme === 'light' && lightBgLum > 0.7,
  `bgLum=${lightBgLum.toFixed(2)}`,
)

rep.addErrors(errors, 'dark-mode')
const code = rep.finish()
await browser.close()
process.exit(code)
