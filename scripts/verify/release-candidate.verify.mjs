/**
 * مرشح الإصدار — سلامة مخرجات البناء (PWA) والمعاينة الحية وتجميد المنتج.
 * يعمل دون متصفح — لا يعدّل أي كود.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeReporter, PREVIEW_URL } from './lib/harness.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DIST = join(ROOT, 'dist')
const rep = makeReporter('release-candidate')

// 1) مخرجات البناء (PWA)
const requiredDist = ['index.html', 'sw.js', 'manifest.webmanifest']
for (const file of requiredDist) {
  rep.check(`PWA: dist/${file} موجود`, existsSync(join(DIST, file)))
}

const indexHtml = existsSync(join(DIST, 'index.html'))
  ? readFileSync(join(DIST, 'index.html'), 'utf8')
  : ''
const assetRefs = [...indexHtml.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1])
const assetsOk = assetRefs.length > 0 && assetRefs.every((p) => existsSync(join(DIST, p.slice(1))))
rep.check('PWA: أصول index.html (js/css) موجودة على القرص', assetsOk, assetRefs.join(', '))

const distAssets = existsSync(join(DIST, 'assets')) ? readdirSync(join(DIST, 'assets')) : []
rep.check(
  'PWA: بيانات quran_full ضمن assets',
  distAssets.some((n) => n.startsWith('quran_full')),
  distAssets.filter((n) => n.startsWith('quran_full')).join('') || 'مفقود',
)
rep.check(
  'PWA: بيانات tafseer_full ضمن assets',
  distAssets.some((n) => n.startsWith('tafseer_full')),
  distAssets.filter((n) => n.startsWith('tafseer_full')).join('') || 'مفقود',
)
rep.check(
  'PWA: خط القرآن (ttf) ضمن assets',
  distAssets.some((n) => n.endsWith('.ttf')),
  distAssets.filter((n) => n.endsWith('.ttf')).join('') || 'مفقود',
)

const swText = existsSync(join(DIST, 'sw.js')) ? readFileSync(join(DIST, 'sw.js'), 'utf8') : ''
rep.check(
  'PWA: sw.js يسبق تخزين ملفات البيانات (precache)',
  /quran_full/.test(swText) && /tafseer_full/.test(swText) && /\.ttf/.test(swText),
  `مدخلات precache: ${(swText.match(/url:"/g) || []).length}`,
)

// 2) المعاينة الحية
try {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10_000)
  const res = await fetch(PREVIEW_URL, { signal: controller.signal })
  clearTimeout(timer)
  rep.check(`المعاينة: ${PREVIEW_URL} تستجيب 200`, res.status === 200, `HTTP ${res.status}`)
} catch {
  rep.check(`المعاينة: ${PREVIEW_URL} تستجيب 200`, false, 'غير متاحة')
}

// 3) تجميد المنتج: لا تغيير تحت src/ أو public/ أو index.html أو package.json منذ المرشح 314efe3
try {
  const diff = execFileSync(
    'git',
    ['diff', '--stat', '314efe3', '--', 'src/', 'public/', 'index.html', 'package.json', 'package-lock.json'],
    { cwd: ROOT, encoding: 'utf8' },
  )
  rep.check(
    'التجميد: لا تغيير على كود المنتج/البيانات منذ المرشح 314efe3',
    diff.trim() === '',
    diff.trim().split('\n')[0] || 'نظيف',
  )
} catch (error) {
  rep.check('التجميد: لا تغيير على كود المنتج منذ المرشح 314efe3', false, error.message)
}

const code = rep.finish()
process.exit(code)
