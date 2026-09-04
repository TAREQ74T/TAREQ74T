# سجل التحقق — WATHEEQ_BC-005

> عقد: **التحقق النهائي من المرشح 1.0 (Release Candidate) على المعاينة الحية**
> الحالة: **مكتمل — GO** (64/64 PASS) | قاعدة التجميد: `314efe3`
> التاريخ: 2026-09-04

## 1. النطاق

مرحلة BC-005 **تحقق فقط**: لا تعديل تحت `src/` أو `public/` أو `index.html` أو `package.json` —
كل الاختبارات تجري على معاينة حية (`localhost:5199`) من `dist` الحالي (PWA v1.3.0، precache 13 entries).

## 2. السويتات (7) — 64/64 PASS

| السويت | الملف | النتيجة |
|---|---|---|
| سلامة النص (خط/حركات/شرارات) | `text-integrity.verify.mjs` | 19/19 PASS |
| بحث BC-002 | `bc002-search.verify.mjs` | 9/9 PASS |
| هجري + أوقات + لوحة BC-003 | `bc003-prayers.verify.mjs` | 12/12 PASS |
| قبلة + UTC + خطوة ±30 (BC-004) | `bc004-qibla.verify.mjs` | 8/8 PASS |
| الوضع الليلي/النهاري + تباين | `dark-mode.verify.mjs` | 5/5 PASS |
| نسبة قائمة السور ≥ 60% | `sidebar-ratio.verify.mjs` | 1/1 PASS |
| مخرجات البناء + تجميد | `release-candidate.verify.mjs` | 10/10 PASS |

النتائج الكاملة لكل فحص: `docs/evidence/BC-005/results/*.json` (سجَّلها كاتب التقارير `lib/harness.mjs`).
اللقطات: `docs/evidence/BC-005/*.png`.

## 3. بوابة الإصدار (release candidate)

| الفحص | النتيجة |
|---|---|
| `dist/index.html`, `sw.js`, `manifest.webmanifest` موجودة | PASS |
| أصول js/css في `index.html` موجودة على القرص | PASS |
| `quran_full` / `tafseer_full` / خط `ttf` ضمن `assets` وprecache | PASS |
| المعاينة الحية تستجيب HTTP 200 | PASS |
| لا تغيير على كود المنتج/البيانات منذ المرشح `314efe3` | PASS |

## 4. ملاحظة استشارية (غير حاجبة)

- عرض الدقائق في صفوف الصلوات غير مبطنّ بصفر (مثال: الشروق يُعرض «٦:٥» عوض «٦:٠٥»).
  تأثير تجميلي فقط، والقيمة صحيحة؛ **لم يُعدَّل** احتراماً لتجميد `src/`.

## 5. الحالة

المرشح 1.0 مثبَّت عند `314efe3` — **توصية GO**. التفاصيل في `EXIT_REPORT_BC-005.md`.
