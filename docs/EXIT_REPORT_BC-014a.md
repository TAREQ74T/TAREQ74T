# EXIT_REPORT_BC-014a — ترس + أرقام هجري/صلاة + بوصلة Android

## 1) قرار طارق البصري النهائي

- **التاريخ:** 2026-10-07
- **نص طارق الحرفي:** "⏸️ لا commit قبل: diff جديد + لقطات 1.5rem + اعتمادك النهائي الشامل. اعتمدته."
- **الاعتماد:** نهائي لهذه الجولة — لا تعديل إضافي على البنود الثلاثة قبل الإغلاق.

## 2) التعديلات الثلاثة + الملفات

| البند | الملف | المحتوى |
|-------|--------|---------|
| ترس | `src/components/nav/BottomNav.tsx` | `SettingsIcon`: blob مملوء `fill="currentColor"` → SVG خطي 2D (`fill="none"` + `stroke` 1.7 + دائرة مركزية) |
| أرقام | `src/index.css` | ست قيم `font-size` فقط (انظر الجدول أدناه) |
| بوصلة | `src/hooks/useDeviceOrientation.ts` | Android فقط عبر `/Android/i.test(navigator.userAgent)`: `(alpha + 180) % 360`؛ iOS يبقى `webkitCompassHeading` أولًا؛ غير Android يبقى `(360 - alpha) % 360` |

قيم CSS (قبل → بعد):

| المحدّد | قبل | بعد |
|---------|-----|-----|
| `.step-btn` | 0.9rem | 1.15rem |
| `.hijri-date__value` | 0.92rem | 1.2rem |
| `.hijri-badge` | 0.72rem | 1.5rem |
| `.prayer-panel__date-value` | 0.85rem | 1.2rem |
| `.prayer-panel__toggle-next` | 0.75rem | 1.5rem |
| `.prayer-row__time` | 1.05rem | 1.35rem |

أدلة: `docs/evidence/BC-014a/` (baseline + after + shots).

لم يُلمس: `scripts/verify/`، `src/hooks/useSplash.ts`، `src/data/quran_full.json`، `src/data/adhkar.json`، `--gold` في `:root`.

## 3) after — 13 مدققًا

آخر تشغيل after: 2026-10-06T22:49–22:50Z على `http://127.0.0.1:5199`.

| مدقق | baseline | after | ملاحظة |
|------|----------|-------|--------|
| bc002-search | 9/9 | 9/9 | مطابق |
| bc003-prayers | 12/12 | 12/12 | فرق `info` زمني فقط (pass=true) |
| bc004-qibla | 8/8 | 8/8 | مطابق |
| bc007-visual-polish | 15/15 | 15/15 | مطابق |
| bc008-adhkar | 29/29 | 29/29 | مطابق |
| bc009-layout | 16/16 | 16/16 | مطابق |
| bc010a-nav | 8/8 | 8/8 | مطابق |
| bc010b-palettes | 8/8 | 8/8 | مطابق |
| bc010c-cities | 8/8 | 8/8 | مطابق |
| bc010c-compass | 7/7 | 7/7 | مطابق في Playwright (ليس Android) |
| dark-mode | 5/5 | 5/5 | مطابق |
| sidebar-ratio | 1/1 | 1/1 | مطابق |
| text-integrity | 18/19 | 18/19 | كاش مصدر بيئي `/tmp/bc005-src` |

النتيجة: **12/13 PASS** + text-integrity FAIL بيئي معروف (`13a4668ca04e… / 44bd3c056492…`) — نفس فحص الباسلاين.

تفسير فرق bc003 (زمني، ليس من `font-size`):

- هجري: الأحد ٢٣ ربيع الآخر ١٤٤٨ → الثلاثاء ٢٥ ربيع الآخر ١٤٤٨
- الفجر: ٤:٥٩ → ٥:٠
- القادمة: الظهر ١٢:١٠ → الفجر ٥:٠ (ساعة التشغيل)

## 4) الدَّين التقني المُوثَّق رسميًا

1. **alpha سالب محتمل على Android قديم.** مسار Android الحالي `(alpha + 180) % 360` لا يطبّع قيمة سالبة قبل الجمع. أجهزة قديمة قد تُرجع `alpha` سالبًا.
2. **البوصلة غير مستقرة (3/4 محاولات) — BC-014c.** سلوك Android غير متسق على أجهزة حقيقية (Xiaomi / Chrome/Mi). لا ثقة إنتاج حتى تحقيق BC-014c.
3. **أرقام الآيات (`.ayah-marker__number`) لم تُلمَس — BC-014b.** خارج نطاق 014a بقرار صريح. كذلك `.surah-number`.

`bc010c-compass` يحاكي `alpha = ((360 - deg) % 360)` على Chromium بلا UA أندرويد؛ لذلك checks IDENTICAL في 014a. فرق متوقَّع مستقبلًا في BC-014c إن تغيّر مسار alpha — ليس انحدار 014a. لم يُلمس `scripts/verify/bc010c-compass.verify.mjs`.

## 5) الحالة

- BC-014a مغلق.
- BC-014b (أرقام الآيات / تدفق القراءة) غير مُصاغ في هذا الإغلاق.
- BC-014c (تحقيق بوصلة Android) مطلوب قبل ثقة إنتاج.
- BC-013 (APK) يبقى موقّفًا مؤقتًا حتى استقرار البوصلة حسب عقد 013.

## 6) التوقيعات

- المنفذ: MonkeyCode
- المعماري: طارق (اعتماد 2026-10-07: «اعتمدته.»)
