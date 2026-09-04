import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * أدوات مساعدة لمشغّلات التحقق في scripts/verify.
 * Playwright يُستورد من بيئة التحقق الخارجية فقط — لا يُضاف إلى package.json.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

export const PREVIEW_URL = process.env.PREVIEW_URL || 'http://localhost:5199'
const RESULT_DIR =
  process.env.RESULT_DIR || join(ROOT, 'docs', 'evidence', 'BC-005', 'results')
const SHOT_DIR =
  process.env.SHOT_DIR || join(ROOT, 'docs', 'evidence', 'BC-005')

export function shotPath(name) {
  return join(SHOT_DIR, `${name}.png`)
}

/** تحميل Playwright من بيئة التحقق الخارجية (انظر scripts/verify/README.md). */
export function loadPlaywright() {
  const require = createRequire(import.meta.url)
  const envPath = process.env.PLAYWRIGHT_PATH
  const candidates = [
    envPath,
    '/tmp/opencode/node_modules',
    join(ROOT, 'node_modules'),
  ].filter(Boolean)
  for (const base of candidates) {
    try {
      const resolved = require.resolve('playwright', { paths: [base] })
      return require(resolved)
    } catch {
      /* جرّب التالي */
    }
  }
  throw new Error(
    'تعذّر العثور على Playwright. شغّل من بيئة تحقق خارجية مع ضبط PLAYWRIGHT_PATH — انظر scripts/verify/README.md',
  )
}

/** فحص مسبق: المعاينة الحية تستجيب 200. */
export async function preflightPreview() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  try {
    const response = await fetch(PREVIEW_URL, {
      signal: controller.signal,
      headers: { 'user-agent': 'bc005-verify' },
    })
    return response.status === 200
  } finally {
    clearTimeout(timer)
  }
}

/** فتح متصفح + التقاط أخطاء console/pageerror. */
export async function openPage({ viewport } = {}) {
  const up = await preflightPreview()
  if (!up) {
    throw new Error(
      `المعاينة الحية لا تستجيب على ${PREVIEW_URL}. أعد تشغيل خادم المعاينة من dist الحالي (لا تُعد البناء).`,
    )
  }
  const { chromium } = loadPlaywright()
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: viewport || { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`)
  })
  return { browser, page, errors }
}

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'
export function toAsciiDigits(value) {
  return String(value).replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
}

/** تحليل وقت HH:MM (قد يكون بأرقام عربية أو لاتينية، والدقائق غير مبطنّة) إلى دقائق. */
export function parseClockMinutes(text) {
  const ascii = toAsciiDigits(text)
  const match = ascii.match(/(\d{1,2}):(\d{1,2})/)
  if (!match) return null
  return Number(match[1]) * 60 + Number(match[2])
}

/** مولّد تقارير: يسجّل الفحوصات ويكتب JSON + رمز خروج. */
export function makeReporter(scriptName) {
  const checks = []
  const out = {
    check(name, cond, info = '') {
      const pass = Boolean(cond)
      checks.push({ name, pass, info: String(info) })
      console.log(`${pass ? 'PASS' : 'FAIL'} | ${name}${info ? ` | ${info}` : ''}`)
      return pass
    },
    addErrors(errors, context) {
      const clean = errors.filter((e) => !/favicon/.test(e))
      for (const error of clean) {
        checks.push({ name: `${context}: لا أخطاء console`, pass: false, info: error })
        console.log(`FAIL | ${context}: لا أخطاء console | ${error}`)
      }
      return clean.length === 0
    },
    finish() {
      const passed = checks.filter((c) => c.pass).length
      const failed = checks.length - passed
      mkdirSync(RESULT_DIR, { recursive: true })
      const payload = {
        script: scriptName,
        preview: PREVIEW_URL,
        timestamp: new Date().toISOString(),
        result: failed ? 'FAIL' : 'PASS',
        passed,
        failed,
        checks,
      }
      writeFileSync(join(RESULT_DIR, `${scriptName}.json`), JSON.stringify(payload, null, 2))
      console.log(`\nRESULT: ${passed} passed, ${failed} failed`)
      return failed ? 1 : 0
    },
  }
  return out
}

/** إغلاق المتصفح مع رمز خروج مناسب. */
export async function closeWith(browser, exitCode) {
  await browser.close()
  process.exit(exitCode)
}
