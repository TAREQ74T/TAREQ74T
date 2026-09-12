# EXIT_REPORT_BC-009 — إصلاح قائمة السور + محاذاة الآيات

**العقد:** BC-009 (تنفيذي — بعد اعتماد التشخيص).
**المنفذ:** MonkeyCode — منهجية وَثِيق.
**المهارات:** `ui-ux-pro-max` أثناء التنفيذ، ثم `verification-before-completion` قبل التقرير.

---

## نطاق العمل (حصرًا)

- الإصلاح 1: قائمة السور على الموبايل.
- الإصلاح 2: محاذاة الآيات.
- الإصلاح 3: تراكب النجمة (bookmark).
- خارج النطاق (لم يُلمس): Bottom Nav / ألوان الأقسام (BC-010)، Splash (BC-011)، أي شيء آخر.

**الملفات المتغيرة:** `src/index.css` فقط + سكربت فحص جديد + أدلة. **لا تغيير على إصدار التطبيق** (ما زال `1.1.0`).

---

## الإصلاح 1 — قائمة السور على الموبايل

**التغييرات (`src/index.css`):**
- حذف تجاوز الموبايل `.surah-list ul { flex-direction: row; flex-wrap: wrap }` (كان عند 1735-1738) → رجوع القائمة إلى `column` من الأساس.
- إضافة ضمان مزدوج: `.surah-list ul > li { width: 100% }`.
- رفع `max-height` لـ`.surah-list-scroll` من `260px` إلى `50vh`.

**الأدلة (قبل/بعد) — نهاري وليلي:**
- `docs/evidence/BC-009/before/light/surah-list-390.png` → `docs/evidence/BC-009/after/light/surah-list-390.png`
- `docs/evidence/BC-009/before/light/surah-list-1440.png` → `docs/evidence/BC-009/after/light/surah-list-1440.png`
- نسخ الوضع الليلي تحت `before/dark` و`after/dark`.

**القياس الآلي:** 114 عنصرًا = 114 صفًا (`maxPerRow=1`) على 390px و1440px، نهاري وليلي.

---

## الإصلاح 2 — محاذاة الآيات

**التغييرات (`src/index.css`, `.ayah-text`):**
- `display: block` (بدل inline) → تفعيل `text-align`.
- حذف `text-align-last: center` (كان غير فعّال).
- `line-height` من `2.3` إلى `2.1` (بانتظار قرار طارق).

**السبب الجذري المؤكد سابقًا:** العنصر كان `<span>` inline فتُهمَل خصائص المحاذاة؛ الآن `display:block` و`text-align:justify` فعّالة.

**الأدلة (قبل/بعد):**
- `docs/evidence/BC-009/before/{light,dark}/ayah-2-255-{390,1440}.png`
- `docs/evidence/BC-009/after/{light,dark}/ayah-2-255-{390,1440}.png`

**القياس الآلي:** كل الأسطر = عرض الحاوية عدا الأخير (`nonLastMaxDiff=0`) على 390px و1440px، نهاري وليلي.

---

## الإصلاح 3 — تراكب النجمة (bookmark)

**التغيير:** إضافة `padding-inline-start: 2.5rem` لحاوية النص `.ayah-text` (عرض `.ayah-actions` ≈ 2rem + هامش).

**الأدلة (قبل/بعد):**
- `docs/evidence/BC-009/before/{light,dark}/bookmark-{390,1440}.png`
- `docs/evidence/BC-009/after/{light,dark}/bookmark-{390,1440}.png`

**القياس الآلي:** `overlap=false` على 390px و1440px، نهاري وليلي.

---

## قرار طارق النهائي (2026-09-12)

- محاذاة الآيات: **justify** (المطبَّق)
- line-height: **2.1** (المطبَّق)

مصدر القرار: مراجعة طارق للقطات
`docs/evidence/BC-009/after/{light,dark}/compare-*.png`
على 390px و1440px، بالوضعين (نهاري/ليلي).

ملاحظة: الكود المطبَّق في `src/index.css` يطابق
القرار — لا حاجة لأي تعديل إضافي على الكود.

---

## الفحص الآلي الجديد

`scripts/verify/bc009-layout.verify.mjs` → **16 / 16 PASS** (`docs/evidence/BC-009/results/bc009-layout.json`):
- قائمة السور: قياس `boundingBox().y` → سورة واحدة لكل صف (390px + 1440px).
- الآيات: عرض كل سطر مقابل عرض الحاوية → كل الأسطر = الحاوية عدا الأخير.
- إضافةً: النجمة لا تتراكب + التحقق على الوضعين الليلي والنهاري.

## الانحدارات (نحو `docs/evidence/BC-009/results/`)

| السويتة | النتيجة |
|---|---|
| BC-002 بحث+خنجرية | 9 / 9 |
| BC-003 صلوات+هجري | 12 / 12 |
| BC-004 قبلة+UTC+ليلي | 8 / 8 |
| dark-mode | 5 / 5 |
| sidebar-ratio | 1 / 1 |
| text-integrity | 19 / 19 |
| BC-007 Polish بصري | 15 / 15 |
| BC-008 أذكار | 29 / 29 |

---

## بوابة التحقق (verification-before-completion)

- `npm run build` → **EXIT=0**.
- `npm run lint` → لا تحذيرات جديدة (3 تحذيرات قديمة في سكربتات سابقة فقط).
- `scripts/verify/bc009-layout.verify.mjs` → **16/16 PASS**.
- المعاينة `http://localhost:5199` → **200**.
- `quran_full.json` → دون أي تعديل.

---

## الحالة

- لا Critical.
- نطاق BC-009 منفّذ بالكامل؛ طارق حسم الخيارات نهائيًا (justify + line-height 2.1).
- تم تنفيذ الـcommit والدفع ضمن إغلاق BC-009.
