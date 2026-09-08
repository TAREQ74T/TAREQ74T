/**
 * BC-007 — Polish بصري محدود.
 * قائمة السور سطر واحد + أيقونة ترس واضحة + تدرج Splash وزخرفة + فاصل About متعدد الألوان.
 * يعمل على المعاينة الحية (dist نهائي) — لا يعدّل أي كود.
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openPage, makeReporter } from './lib/harness.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'))
const APP_VERSION = pkg.version

const rep = makeReporter('bc007-visual-polish')

const { browser, page, errors } = await openPage({ viewport: { width: 1440, height: 900 } })

await page.goto(process.env.PREVIEW_URL || 'http://localhost:5199', {
  waitUntil: 'networkidle',
})
await page.waitForSelector('[data-testid="splash-screen"]', { timeout: 15000 })

// قراءة splash دفعة واحدة قبل الاختفاء التلقائي (1.8 ثانية)
const splash = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="splash-screen"]')
  if (!el) return null
  const cs = getComputedStyle(el)
  const icon = document.querySelector('.splash-screen__icon')
  const badge = document.querySelector('.splash-screen__badge')
  const name = document.querySelector('[data-testid="splash-name"]')
  const tagline = document.querySelector('.splash-screen__tagline')
  const version = document.querySelector('[data-testid="splash-version"]')
  return {
    versionText: version?.textContent?.trim() || '',
    nameText: name?.textContent?.trim() || '',
    tagline: tagline?.textContent?.trim() || '',
    iconSrc: icon?.getAttribute('src') || '',
    hasGifImg: !!el.querySelector('img[src$=".gif"], img[src*=".gif?"]'),
    backgroundImage: cs.backgroundImage,
    badgePresent: !!badge,
    badgePointerEvents: badge ? getComputedStyle(badge).pointerEvents : '',
  }
})
rep.check(
  'splash: يعرض الاسم والوسم ورقم الإصدار',
  splash != null &&
    splash.nameText.includes('مصحف الهدى') &&
    splash.tagline.length > 0 &&
    splash.versionText.includes(APP_VERSION),
  `${splash?.nameText} | ${splash?.versionText}`,
)
rep.check('splash: بدون GIF نهائيًا', splash != null && !splash.hasGifImg && !/\.gif/i.test(splash.iconSrc), splash?.iconSrc)
rep.check(
  'splash: خلفية متدرجة (linear + radial) مع لون ثابت احتياطي',
  splash != null &&
    splash.backgroundImage.includes('linear-gradient') &&
    splash.backgroundImage.includes('radial-gradient'),
  splash?.backgroundImage.slice(0, 80),
)
rep.check(
  'splash: زخرفة CSS حول الأيقونة وpointer-events:none',
  splash?.badgePresent && splash.badgePointerEvents === 'none',
  `badge=${splash?.badgePresent} pe=${splash?.badgePointerEvents}`,
)

// التخطي بالنقر
await page.click('[data-testid="splash-screen"]')
await page.waitForSelector('[data-testid="splash-screen"]', { state: 'detached', timeout: 5000 })
rep.check('splash: يُتخطى بالنقر ويختفي', true)

// قائمة السور — سطر واحد
await page.waitForSelector('.surah-item', { timeout: 15000 })
const list = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.surah-item')]
  const dist = {}
  const bad = []
  for (const row of rows) {
    const nameEl = row.querySelector('.surah-name')
    const num = row.querySelector('.surah-number')
    if (!nameEl || !num) {
      bad.push('missing-name-or-num')
      continue
    }
    const r = document.createRange()
    r.selectNodeContents(nameEl)
    const tops = new Set(
      [...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)),
    )
    const n = tops.size
    dist[n] = (dist[n] || 0) + 1
  }
  const enEls = document.querySelectorAll('.surah-name-en').length
  const namesCol = document.querySelectorAll('.surah-names').length
  const first = document.querySelector('.surah-name')
  const cs = first ? getComputedStyle(first) : null
  return {
    rowCount: rows.length,
    dist,
    enEls,
    namesCol,
    whiteSpace: cs?.whiteSpace || '',
    textOverflow: cs?.textOverflow || '',
    overflow: cs?.overflowX || '',
    bad,
  }
})
rep.check('قائمة: 114 سورة في القائمة', list.rowCount === 114, `rows=${list.rowCount}`)
rep.check(
  'قائمة: كل سورة سطر واحد فقط {1:114}',
  list.rowCount === 114 && Object.keys(list.dist).length === 1 && list.dist[1] === 114,
  JSON.stringify(list.dist),
)
rep.check(
  'قائمة: لا عنصر name-en ولا عمود التكديس في القائمة',
  list.enEls === 0 && list.namesCol === 0,
  `name-en=${list.enEls} surah-names=${list.namesCol}`,
)
rep.check(
  'قائمة: حماية ellipsis مفعّلة (nowrap + hidden)',
  list.whiteSpace === 'nowrap' && list.overflow === 'hidden' && list.textOverflow === 'ellipsis',
  `ws=${list.whiteSpace} of=${list.overflow} to=${list.textOverflow}`,
)

// زر الإعدادات — وضوح في النهاري
const gear = await page.evaluate(() => {
  const el = document.querySelector('.sidebar-gear-btn')
  if (!el) return null
  const cs = getComputedStyle(el)
  return {
    bg: cs.backgroundColor,
    border: cs.borderColor,
    size: `${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`,
    iconPath: !!el.querySelector('svg path'),
  }
})
rep.check(
  'الإعدادات: زر ترس ذو خلفية مرئية وحدود ومسار SVG',
  gear != null && gear.bg !== 'rgba(0, 0, 0, 0)' && gear.border !== 'rgba(0, 0, 0, 0)' && gear.iconPath,
  `bg=${gear?.bg} size=${gear?.size}`,
)

// الاسم الإنجليزي يبقى في نتائج البحث (غير محذوف من الوظيفة)
await page.fill('#quran-search', 'Al-Faatiha')
await page.waitForTimeout(350)
const searchEn = await page.evaluate(() => {
  const items = [...document.querySelectorAll('.search-result__text')]
  return items.map((el) => el.textContent || '')
})
rep.check(
  'بحث: name_en يظهر في نتائج البحث بالحروف اللاتينية',
  searchEn.some((t) => /al[- ]?faatiha/i.test(t)),
  searchEn.slice(0, 2).join(' | '),
)
await page.fill('#quran-search', '')
await page.waitForTimeout(150)

// About — فاصل زخرفي دون تغيير نصوص/إصدار
await page.click('[aria-label="الإعدادات"]')
await page.waitForSelector('.settings-page', { timeout: 10000 })
await page.click('[data-testid="open-about"]')
await page.waitForSelector('[data-testid="about-ayah-1"]', { timeout: 10000 })
const about = await page.evaluate(() => {
  const ayah1 = document.querySelector('[data-testid="about-ayah-1"]')
  const ayah2 = document.querySelector('[data-testid="about-ayah-2"]')
  const ornament = document.querySelector('.about-ornament')
  const gem = document.querySelector('.about-ornament__gem')
  const before = ornament ? getComputedStyle(ornament, '::before') : null
  const attr = document.querySelector('[data-testid="about-attribution"]')
  const version = document.querySelector('[data-testid="about-version"]')
  return {
    ayah1: ayah1?.textContent?.trim() || '',
    ayah2: ayah2?.textContent?.trim() || '',
    gem: !!gem,
    lineBg: before?.backgroundImage || '',
    attribution: attr?.textContent || '',
    versionText: version?.textContent || '',
  }
})
rep.check(
  'About: الآيتان حاضِرتان دون تغيير (غير فارغتين)',
  about.ayah1.length > 0 && about.ayah2.length > 0,
  `l1=${about.ayah1.length} l2=${about.ayah2.length}`,
)
rep.check(
  'About: فاصل زخرفي بحبيبة وسطية وتدرج متعدد الألوان',
  about.gem && about.lineBg.includes('linear-gradient'),
  `gem=${about.gem} bg=${about.lineBg.slice(0, 60)}`,
)
rep.check(
  'About: سطر الإنشاء ورقم الإصدار كما هما',
  about.attribution.includes('طارق') && about.versionText.includes(APP_VERSION),
  about.versionText,
)
await page.click('.settings-back-btn')
await page.waitForSelector('.quran-page', { timeout: 10000 })

// شاشة ضيقة — لا تكسير ولا أسطر متعددة
await page.setViewportSize({ width: 390, height: 844 })
await page.waitForTimeout(300)
const narrow = await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.surah-item')]
  const dist = {}
  for (const row of rows) {
    const nameEl = row.querySelector('.surah-name')
    const r = document.createRange()
    r.selectNodeContents(nameEl)
    const tops = new Set(
      [...r.getClientRects()].filter((x) => x.width > 0).map((x) => Math.round(x.top)),
    )
    const n = tops.size
    dist[n] = (dist[n] || 0) + 1
  }
  return { rowCount: rows.length, dist }
})
rep.check(
  'ضيقة 390px: كل سورة تبقى سطرًا واحدًا {1:114}',
  narrow.rowCount === 114 && narrow.dist[1] === 114 && Object.keys(narrow.dist).length === 1,
  JSON.stringify(narrow.dist),
)

rep.addErrors(errors, 'bc007')
const code = rep.finish()
await browser.close()
process.exit(code)
