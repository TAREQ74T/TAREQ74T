# EXIT_REPORT_BC-010a — Bottom Nav + صفحة «حول» الفرعية + نقل الصلاة/القبلة

**العقد:** BC-010 — إعادة هيكلة UI الكبرى — **المرحلة 1** (تنفيذي).
**المنفذ:** MonkeyCode — منهجية وَثِيق.
**المهارة المفعّلة قبل التقرير:** `verification-before-completion`.
**التاريخ:** 2026-09-15.
**الإصدار:** `1.1.0` (دون تغيير).

---

## نطاق المرحلة 1

- شريط تنقل سفلي ثابت (Bottom Nav) بأربع تبويبات + أيقونات SVG داخلية (بلا مكتبة خارجية).
- إعادة توزيع المسارات: صفحة مستقلة للصلاة (وقت الصلاة + القبلة) وصفحة فرعية لـ«حول».
- الشريط الجانبي للقرآن فقط، وبلا زر الترس/الأذكار ولوحة الصلاة.

## المسارات النهائية

| المسار | الصفحة | المحتوى |
|--------|--------|---------|
| `#/` (و`#/surah/...`) | `QuranPage` | الشريط الجانبي (قائمة السور + البحث) + عارض الآيات |
| `#/prayer` | `PrayerPage` | لوحة أوقات الصلاة (موسّعة افتراضيًا) + بوصلة القبلة |
| `#/adhkar` | `AdhkarPage` | شاشة الأذكار (كما هي) |
| `#/settings` | `SettingsPage` | الإعدادات (بلا قبلة، وبلا قسم «حول» المنفصل) |
| `#/settings/about` | `AboutPage` | صفحة «حول التطبيق» الفرعية |

> المسار القديم `#/about` أُزيل واستُبدل بـ`#/settings/about`.

---

## الملفات

**جديدة:**
- `src/components/nav/BottomNav.tsx`
- `src/pages/PrayerPage.tsx`
- `src/pages/AboutPage.tsx`
- `scripts/verify/bc010a-nav.verify.mjs`

**معدَّلة:**
- `src/App.tsx` — المسارات + تركيب `BottomNav` + `PrayerPage`/`AboutPage`.
- `src/pages/QuranPage.tsx` — حذف `sidebar__toolbar` (ترس + أذكار) و`PrayerTimesPanel`، وتنظيف الواجهة.
- `src/pages/SettingsPage.tsx` — نقل القبلة إلى تبويب الصلاة، واختصار مدخل «حول».
- `src/components/about/AboutScreen.tsx` — خاصية `backLabel` اختيارية.
- `src/index.css` — أنماط `BottomNav` و`prayer-page`، إزاحات التخطيط، وحذف CSS ميت.
- `scripts/verify/{bc003-prayers,bc004-qibla,bc007-visual-polish,bc008-adhkar}.verify.mjs` — ترحيل (انظر الجدول).

---

## جدول الترحيل (before → after)

| المدقّق | قبل | بعد | الضمانة المحفوظة |
|---------|-----|-----|------------------|
| `bc003` | `[aria-label="الإعدادات"]` لفتح الإعدادات | `[data-testid="nav-settings"]` | نفس فحوص الهجري/التعديلات/الحفظ |
| `bc003` | `.settings-back-btn` ثم فحص اللوحة في `.quran-page` | `[data-testid="nav-prayer"]` ثم قراءة `panel-hijri`/`panel-next`/`time-*` مباشرة | قياس اللوحة والصفوف (موسّعة افتراضيًا) |
| `bc004` | فتح الإعدادات عبر `[aria-label="الإعدادات"]` | `[data-testid="nav-settings"]` | فحوص UTC (تلقائي/يدوي ±) |
| `bc004` | القبلة بعد `reload` على صفحة الإعدادات | `[data-testid="nav-prayer"]` ثم `qibla-bearing`/`qibla-needle` من `prayer-page` | نفس المرجع الخارجي 164.9° ±0.5 والصيغة المستقلة |
| `bc004` | القسم 3 يتابع على نفس الصفحة | العودة إلى `[data-testid="nav-settings"]` قبل `.prayer-adjust-editor__value` | حصر خطوة الدقيقة ±30 |
| `bc007` | فحص `.sidebar-gear-btn` (خلفية/حدود/SVG) | فحص `.bottom-nav` (ثابت + 4 تبويبات + 4 SVG) | وضوح مدخل الإعدادات |
| `bc007` | فتح About ثم `.settings-back-btn` → `.quran-page` | About عبر `[data-testid="open-about"]` (بقي)، ثم back → `.settings-page` ثم `nav-quran` → `.quran-page` | فحص زخرفة About والقياس الضيّق |
| `bc008` | `.sidebar-adhkar-btn` + `.sidebar-gear-btn` | `[data-testid="nav-adhkar"]` + `[data-testid="nav-settings"]` | نفس فحوص الأذكار (24 ذكرًا، ليلي، ضيّق) |

---

## الانحرافات الموثّقة

1. **`AboutScreen.tsx` — خاصية `backLabel` اختيارية.**
   أُضيفت لأن الصفحة صارت فرعية من الإعدادات، فصار زر العودة يقرأ «← العودة إلى الإعدادات» بدل «← العودة إلى القراءة». الافتراضي بقي كما هو. (ملف خارج قائمة العقد — إضافة غير كاسرة.)

2. **`SettingsPage` أبقت مدخل «حول» مختصرًا.**
   بدل فصل الصفحة دون أي مدخل (صفحة يتيمة)، بقي زر `[data-testid="open-about"]` («حول التطبيق») موجّهًا إلى `#/settings/about`. أُزيل وصف القسم ونصه التمهيدي (نُقل المحتوى للصفحة الفرعية). يحفظ قابلية الوصول ويبقي مدقّق BC-007 عاملًا.

3. **حذف CSS ميت.**
   أُزيلت قواعد `.sidebar__toolbar` و`.sidebar-gear-btn` و`.sidebar-adhkar-btn` بعد حذف عناصرها من الـDOM.

4. **قرار تنفيذي:** `PrayerTimesPanel` في `PrayerPage` بـ`defaultExpanded` (موسّعة) — الصفحة مخصّصة للصلاة، فالمفروض إظهار الأوقات فورًا. تبعه ترحيل الفحص المقابل في `bc003`.

---

## نتائج الفحوص (fresh — هذا التشغيل)

| الفحص | النتيجة |
|-------|---------|
| `npm run build` | EXIT=0 |
| `npm run lint` | 3 تحذيرات قديمة فقط — صفر جديد |
| `bc010a-nav.verify.mjs` | **8/8 PASS** |
| `bc002-search` | 9/9 |
| `bc003-prayers` | 12/12 |
| `bc004-qibla` | 8/8 |
| `dark-mode` | 5/5 |
| `sidebar-ratio` | 1/1 |
| `text-integrity` | 19/19 |
| `bc007-visual-polish` | 15/15 |
| `bc008-adhkar` | 29/29 |
| `bc009-layout` | 16/16 |
| `quran_full.json` | دون أي تعديل (diff فارغ) |
| preview | 200 |
| الإصدار | `1.1.0` |

### فحوص `bc010a-nav` الثمانية
1. شريط سفلي ثابت (`position:fixed`, `bottom:0px`) بأربع تبويبات وأربع أيقونات SVG.
2. تبويب القرآن: `quran-page` + الشريط الجانبي، بلا ترس/أذكار/لوحة صلاة، والتبويب نشط.
3. تبويب الصلاة: `prayer-page` فيه `prayer-panel` + `qibla-compass`، بلا شريط جانبي.
4. تبويب الأذكار: `.adhkar-screen` (24 بطاقة).
5. تبويب الإعدادات: `.settings-page` بلا قبلة + مدخل «حول».
6. `#/settings/about`: صفحة `about-screen` الفرعية.
7. زر العودة من «حول» → `#/settings`.
8. الشريط الجانبي غائب في `prayer`/`adhkar`/`settings`/`about`.

---

## الأدلة

- **16 لقطة** في `docs/evidence/BC-010/nav/`:
  `{quran,prayer,adhkar,settings}-{390,1440}-{light,dark}.png`.
- **10 ملفات نتائج JSON** في `docs/evidence/BC-010/nav/results/` (bc010a + 9 انحدارات).
- **10 لقطات انحدار** في `docs/evidence/BC-010/nav/regression/`.

---

## بوابات القبول (المرحلة 1)

- [x] Bottom Nav ثابت + 4 تبويبات تعمل.
- [x] `#/settings/about` يعمل كصفحة فرعية.
- [x] الترس محذوف من الشريط الجانبي.
- [x] وقت الصلاة + القبلة داخل تبويب الصلاة.
- [x] الشريط الجانبي في تبويب القرآن فقط.
- [x] `bc010a-nav.verify.mjs` 8/8 PASS.
- [x] 16 لقطة (4 تبويبات × 2 عرض × 2 وضع).
- [x] الانحدارات خضراء.

---

## Commit

```
WATHEEQ_BC-010a: bottom nav + about sub-page + move prayer/qibla
```

---

## ⚠️ توقف إلزامي

المرحلة 1 مكتملة. **لا تبدأ المرحلة 2 (اللوحات اللونية) قبل تأكيد طارق.**
