# EXIT_REPORT_BC-010 — إغلاق إعادة هيكلة UI الكبرى

**العقد:** BC-010 — Bottom Nav + هويات لونية + بوصلة + مدن.
**المنفذ:** MonkeyCode — منهجية وَثِيق.
**المستشار الثاني:** Claude.
**التاريخ:** 2026-09-24.
**الإصدار:** `1.1.0` (دون تغيير).

---

## جدول commits

| المرحلة | commit | الوصف |
|---------|--------|-------|
| c.0 | 73511e1 | بحث مرشحي المدن |
| c.1 | 73033d5 | بوصلة + اهتزاز |
| c.2 | 61b3486 | مدن + CityPicker |
| c.2b | e6209fb | توثيق `_meta.notes` |
| c.3 | 15a8b73 | fix compass verifier env |
| c.3 | e6b3d16 | apply A/B via `html[data-theme]` |
| c.3 | e64fa15 | dark-mode active tab per section |
| c.4 | 928c95a | remove preview + finalize |

---

## قرار طارق البصري

«أذكار: a | صلاة: b» — 18/9/2026.

اللوحتان المطبَّقتان:

- **A = Bakery/Cafe (#63)** للأذكار — عبر `.adhkar-page` / `.adhkar-screen`.
- **B = Alarm & World Clock (#117)** للصلاة — عبر `.prayer-page`.

التطبيق عبر selectors مقيَّدة، لا `:root`. الليلي ببادئة `html[data-theme='dark']` (مفوَّض رسميًا في Patch 13).

`--gold` في `:root` (عنبري إسلامي للزخارف) لم يُلمس. `.quran-page` / `.settings-page` / `.about-page` لم تُلمس.

---

## BottomNav `data-active-section`

`BottomNav.tsx` يضبط `data-active-section={active}` (قيم: `quran` | `prayer` | `adhkar` | `settings`).

التبويب النشط نهاريًا/ليليًا يتبع ألوان القسم:

- أذكار A: primary `#92400E` / `#9E5529`، soft `#EFDAAD` / `#3A1A06`.
- صلاة B: primary `#C36B05` / `#D97706`، soft `#F0E2DB` / `#4C341F`.

---

## المدن Tier 1

- 4,677 سجلًا من GeoNames `cities1000` (CC BY 4.0).
- تغطية عربية 67.8% (3,172/4,677).
- `CityPicker` داخل `LocationInput` فوق «تحديد تلقائي».

---

## البوصلة

- القبلة بطلة (رمز كعبة + إبرة ذهبية ثابتة لا تتبع اللوحة).
- مؤشر ثلاثي: ليس الاتجاه / اقترب / الاتجاه صحيح.
- اهتزاز `navigator.vibrate(30)` عند عبور نطاق المحاذاة، قابل للإيقاف من الإعدادات.

---

## مخاطر معروفة

فحص `bc010c-compass` يعتمد على mock صريح لـ
`DeviceOrientationEvent.requestPermission` في بيئة الاختبار
(headless). لم يُتحقق ميدانيًا من سلوك التطبيق الفعلي إن
أرجع متصفح حقيقي قيمة `'prompt'` بدل `'granted'`/`'denied'`
الثنائية التقليدية. التطبيق قد يحتاج مراجعة لاحقة لمسار
`useQibla` عند توفر بيانات ميدانية من أجهزة حقيقية.

- سيناريو `DeviceOrientationEvent.requestPermission` في Chromium headless الحديث يرجع `'prompt'` بدل `'granted'`.
- تم تجاوزه في الـverifier عبر mock صريح (`15a8b73`).
- لم يُختبر على جهاز حقيقي بعد.
- يجب إعادة التحقق في BC-013 (APK) على جهاز طارق الفعلي، خصوصًا مع `@capacitor/motion`.

---

## حذف المعاينة (c.4)

حُذف بالكامل:

- `src/pages/PalettePreviewPage.tsx`
- `src/data/palettes.ts`
- route `#/palette-preview` من `src/App.tsx`
- خيار `applyTheme` من `useSettings` — `useSettings()` بلا وسائط ويطبّق `data-theme` دائمًا
- أنماط `.palette-preview*` من `src/index.css`

دليل الحذف: `grep -rn "palette-preview\|PalettePreview\|palettes" src/` = صفر نتائج.

`bc010b-palettes.verify.mjs` أُعيد توجيهه إلى الشاشات الحقيقية (A أذكار / B صلاة) بعد سقوط صفحة المعاينة.

---

## توقيعات

- **المنفذ:** MonkeyCode — منهجية وَثِيق.
- **المستشار الثاني:** Claude.
