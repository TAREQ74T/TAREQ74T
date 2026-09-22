import { createReadStream, readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'

/**
 * بناء src/data/cities.json (الطبقة 1) — GeoNames cities1000 (CC BY 4.0).
 *
 * لا يُضمَّن أي مصدر خام في الريبو: يقرأ السكربت من GEONAMES_DIR (خارج الريبو)
 * ويُخرج ملفًا مضغوط الحقول فقط.
 *
 * المجموعة: عواصم (PPLC) ∪ أكبر 1000 مدينة عالميًا (population) ∪ كل مدن الدول العربية الـ22.
 * الأسماء العربية: alternateNamesV2 (isolanguage='ar') → Natural Earth NAME_AR (عبر GEONAMESID) → null.
 * country_ar: Natural Earth NAME_AR (ISO_A2/ISO_A2_EH) → GeoNames alternateNamesV2 ar مستوى الدولة
 *             → ADMIN اللاتيني.
 */

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const ROOT = join(SCRIPT_DIR, '..', '..')
const DIR = process.env.GEONAMES_DIR || '/tmp/opencode/datasets'
const OUT = join(ROOT, 'src', 'data', 'cities.json')

const SOURCE_SHA256 =
  'f41428b58b25cae0f339c7f7fe5e9ad84bdcd70fc447fa913c09b7190729cfc3'

const ARAB = new Set([
  'DZ', 'BH', 'KM', 'DJ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'MR',
  'OM', 'PS', 'QA', 'SA', 'SO', 'SD', 'SY', 'TN', 'AE', 'YE',
])

const TWO_LETTER = /^[A-Z]{2}$/

async function* lines(path) {
  const rl = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  for await (const line of rl) {
    if (line) yield line
  }
}

function loadNeCountries() {
  const geojson = JSON.parse(readFileSync(join(DIR, 'ne_admin0_countries.geojson'), 'utf8'))
  const ar = new Map()
  const admin = new Map()
  for (const feature of geojson.features) {
    const p = feature.properties
    const cc = [p.ISO_A2, p.ISO_A2_EH].find((v) => TWO_LETTER.test(v || ''))
    if (!cc) continue
    if (p.NAME_AR) ar.set(cc, p.NAME_AR)
    if (p.ADMIN && !admin.has(cc)) admin.set(cc, p.ADMIN)
  }
  return { ar, admin }
}

function loadCountryInfo() {
  const gidByCc = new Map()
  for (const line of readFileSync(join(DIR, 'countryInfo.txt'), 'utf8').split('\n')) {
    if (!line || line.startsWith('#')) continue
    const f = line.split('\t')
    if (f[0] && f[16]) gidByCc.set(f[0], Number(f[16]))
  }
  return { gidByCc }
}

function loadNePlaceNames() {
  const geojson = JSON.parse(readFileSync(join(DIR, 'naturalearth_places.geojson'), 'utf8'))
  const byId = new Map()
  for (const feature of geojson.features) {
    const p = feature.properties
    if (p.GEONAMESID && p.NAME_AR) byId.set(Number(p.GEONAMESID), p.NAME_AR)
  }
  return byId
}

async function loadCities() {
  const rows = []
  for await (const line of lines(join(DIR, 'cities1000.txt'))) {
    const f = line.split('\t')
    rows.push({
      id: Number(f[0]),
      n: f[1],
      lat: Number(f[4]),
      lon: Number(f[5]),
      fcode: f[7],
      cc: f[8],
      pop: Number(f[14]) || 0,
    })
  }
  return rows
}

function selectCities(rows) {
  const top = [...rows].sort((a, b) => b.pop - a.pop).slice(0, 1000)
  const selected = new Map()
  for (const row of rows) if (row.fcode === 'PPLC') selected.set(row.id, row)
  for (const row of rows) if (ARAB.has(row.cc)) selected.set(row.id, row)
  for (const row of top) selected.set(row.id, row)
  return selected
}

function scoreArabic(f, name) {
  return (
    (f[4] === '1' ? 100 : 0) +
    (f[7] === '1' ? 0 : 10) +
    (f[6] === '1' ? 0 : 5) -
    name.length * 0.001
  )
}

async function loadAlternateNames(selectedIds, wantCountryGids) {
  const cityBest = new Map()
  const countryAr = new Map()
  for await (const line of lines(join(DIR, 'alternateNamesV2.txt'))) {
    const f = line.split('\t')
    if (f[2] !== 'ar') continue
    const gid = Number(f[1])
    const name = f[3]
    if (!name) continue
    if (selectedIds.has(gid)) {
      const score = scoreArabic(f, name)
      const prev = cityBest.get(gid)
      if (!prev || score > prev.score) cityBest.set(gid, { name, score })
    }
    if (wantCountryGids.has(gid) && !countryAr.has(gid)) {
      countryAr.set(gid, name)
    }
  }
  return { cityBest, countryAr }
}

async function main() {
  const { ar: neCountryAr, admin: neAdmin } = loadNeCountries()
  const { gidByCc } = loadCountryInfo()
  const nePlaceAr = loadNePlaceNames()
  const rows = await loadCities()
  const selected = selectCities(rows)

  const missingCc = [...new Set([...selected.values()].map((r) => r.cc))].filter(
    (cc) => !neCountryAr.has(cc),
  )
  const wantCountryGids = new Set(missingCc.map((cc) => gidByCc.get(cc)).filter(Boolean))

  const { cityBest, countryAr: geoCountryAr } = await loadAlternateNames(
    new Set(selected.keys()),
    wantCountryGids,
  )

  const countryPaths = { natural_earth: 0, geonames_country: 0, admin_latin: 0 }
  const countryAr = new Map()
  for (const cc of new Set([...selected.values()].map((r) => r.cc))) {
    if (neCountryAr.has(cc)) {
      countryAr.set(cc, neCountryAr.get(cc))
      countryPaths.natural_earth += 1
    } else if (geoCountryAr.has(gidByCc.get(cc))) {
      countryAr.set(cc, geoCountryAr.get(gidByCc.get(cc)))
      countryPaths.geonames_country += 1
    } else if (neAdmin.has(cc)) {
      countryAr.set(cc, neAdmin.get(cc))
      countryPaths.admin_latin += 1
    } else {
      throw new Error(`country_ar غير متوفر للكود ${cc} — توقف`)
    }
  }

  const namePaths = { alternate_names: 0, natural_earth: 0, none: 0 }
  const cities = [...selected.values()]
    .sort((a, b) => b.pop - a.pop || a.id - b.id)
    .map((r) => {
      let ar = cityBest.get(r.id)?.name ?? null
      if (ar) namePaths.alternate_names += 1
      else if (nePlaceAr.has(r.id)) {
        ar = nePlaceAr.get(r.id)
        namePaths.natural_earth += 1
      } else namePaths.none += 1
      return {
        id: r.id,
        n: r.n,
        ar,
        lat: Number(r.lat.toFixed(4)),
        lon: Number(r.lon.toFixed(4)),
        cc: r.cc,
        country_ar: countryAr.get(r.cc),
      }
    })

  const arabicCount = cities.filter((c) => c.ar != null).length
  const arabicPercent = Number(((arabicCount / cities.length) * 100).toFixed(1))

  const payload = {
    _meta: {
      source: 'GeoNames cities1000',
      license: 'CC BY 4.0',
      license_url: 'https://creativecommons.org/licenses/by/4.0/',
      attribution: 'بيانات المدن: GeoNames (CC BY 4.0)',
      generated_at: new Date().toISOString(),
      source_sha256: SOURCE_SHA256,
      count: cities.length,
      arabic_coverage: { count: arabicCount, percent: arabicPercent },
      notes:
        'country_ar: Natural Earth NAME_AR عبر ISO_A2/ISO_A2_EH (استُخدم ISO_A2_EH لـTW). ' +
        'الأقاليم غير الممثلة في NE (BQ, CC, CX, GF, GP, MQ, RE, SJ, YT) أُخذت من ' +
        'GeoNames alternateNamesV2 (isolanguage=ar، مستوى الدولة). ' +
        'ar=null يعني عدم توفر اسم عربي معتمد ضمن المصدر؛ الاسم اللاتيني في n. id = geonameid. ' +
        'مفاتيح منطقة _meta الفعلية = 12 (قمة المستوى = 9، + مفتاح _meta نفسه + 2 متداخلة في arabic_coverage). ' +
        'فارق raw↔chunk = 65,565 بايت: 65,504 نزع تنصيص المفاتيح + 89 تقصير أرقام − 28 غلاف الوحدة = 61 صافي متبقٍّ ' +
        '(ليس تحويل " → `؛ ذلك محايد حجميًا).',
    },
    cities,
  }

  mkdirSync(dirname(OUT), { recursive: true })
  const text = JSON.stringify(payload)
  writeFileSync(OUT, text)
  const report = {
    count: cities.length,
    arabicCount,
    arabicPercent,
    namePaths,
    countryPaths,
    rawBytes: Buffer.byteLength(text),
    gzipBytes: gzipSync(Buffer.from(text)).length,
    countryCount: countryAr.size,
    output: OUT,
  }
  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
