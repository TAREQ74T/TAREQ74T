# EXIT_REPORT — WATHEEQ_BC-004 v1.1

> العقد: **Qibla Compass + Settings Center + UTC Offset + Display Fixes + Sidebar Polish**
> الحالة: **مكتمل — جاهز للدمج**
> الفرع: `main` | آخر commit سابق: `a6e2dca`

---

## 1. Mode / المنهجية

- عقد حرفي بالعربية، ثلاث مراحل متتالية مع توقف تحقق ذاتي بينها، والإنسان يقرر عند الفشل فقط.
- قيود ملزمة طُبقت: لا تعديل على النص القرآني المخزَّن (علامة الآية = حل عرض فقط بفلسفة `fixTanweenDisplay`)؛ لا مساس بمحرك البحث/الخط (انحدار BC-002/BC-003 إلزامي وكلاهما أخضر)؛ لا commit قبل اكتمال المراحل؛ لا اختبارات Playwright عامة (تحقق موجّه عبر نصوص `/tmp/opencode/*.js` على المعاينة الحية)؛ لا مساس بوحدات BC-003 دون ضرورة.

## 2. ملخص المراحل الثلاث

### المرحلة 1 — بوصلة القبلة (مكتملة ومتحقق منها حياً)
- `utils/qibla.ts`: صيغة bearing كروية داخلية بلا مكتبة (مكة 0°، القاهرة 136.1°، نيويورك 58.5°).
- `hooks/useDeviceOrientation.ts` + `hooks/useQibla.ts`: بوصلة حية مع smoothing (5 عينات) وطلب إذن iOS.
- `components/qibla/QiblaCompass.tsx` + CSS: بوصلة حية/يدوية/Fallback تلقائي عند denied/unsupported/insecure.
- تحقق حي: `alpha=0 → إبرة 136°`، `alpha=90 → 226°` بلا أخطاء.

### المرحلة 2 — مركز الإعدادات + UTC (مكتملة)
- `storage/settings.ts`: وضعا UTC (تلقائي/يدوي −12..+14) بمفاتيح مستقلة.
- `utils/prayer-times.ts`: `effectiveUtcOffsetMinutes` + معامل `utcOffsetMinutes` في الحسابات؛ الوضع اليدوي له الأولوية.
- `useSettings` موسّعة (تخزين `:settings` لـ fontSize/theme فقط)، `usePrayerTimes(coords, utcOffsetMinutes)`.
- خطوة تعديل دقيقة واحدة: `hooks/useHoldStep.ts` + `components/prayer-times/StepControl.tsx` (تكرار 250ms)، في اللوحة ومحرر الإعدادات.
- `PrayerAdjustmentsEditor.tsx` (صفوف ±1 لكل صلاة + method/madhab + إعادة ضبط كلّية).
- `SettingsPage.tsx` أعيدت كتابتها: 8 مجموعات؛ توقيت بـ `tz-auto/tz-manual/tz-effective/tz-preview`؛ موقع؛ قبلة؛ خط؛ ثيم؛ آخر موضع؛ إشارات.
- `PrayerTimesPanel` بخطوة 1 وطي افتراضي وملخص هجري/قادمة. `HijriDateDisplay` داخل الجسم الموسّع + في الإعدادات.

### المرحلة 3 — الشريط الجانبي + علامة الآية + الإصلاحات (مكتملة)
- `QuranPage`: شريط جانبي = ترس (`sidebar-gear-btn`) + لوحة مطوية + عنوان + بحث + `.surah-list-scroll>SurahList`؛ شريط تمرير مخصص؛ tooltip نجمة الإشارة؛ `aria-pressed` و`focus-visible`.
- `AyahMarker.tsx`: رقم الآية داخل دائرة CSS (نمط مدني) بدل «۝ + رقم» — **النص المخزن لم يُمس** (0/6236 يحتوي U+06DD).
- **إصلاحات dark mode:** 8 نصوص باهتة رُفعت (`#a9b8b1`) + `prayer-row__original` (`#8a958e`) + أزرار خطوة واضحة في الليلي.
- تحقق حي: نسبة قائمة السور **63.08% (487/772)** ≥ 60% PASS؛ الطي الافتراضي يعرض «٢٠ ربيع الأول ١٤٤٨ هـ • القادمة: الفجر ٤:٤٩».

## 3. الأدلة واللقطات

`docs/evidence/BC-004/` — **23 لقطة** (4 BEFORE + 19 AFTER):

| الملف | المضمون |
|---|---|
| `sidebar-before.png` | الشريط قبل (لوحة مفتوحة، بلا ترس) |
| `dark-before.png` | ليلي قبل |
| `ayah-marker-before.png` | نهاية آية قبل (رقم شارد بجانب U+06DD) |
| `prayer-step-before.png` | الخطوة قبل (±1/±5) |
| `qibla-compass.png` | بوصلة القبلة (القاهرة) |
| `qibla-manual-180.png` | يدوي 180° → جنوب |
| `qibla-live.png` | بوصلة حية مفعّلة (rotate 146.137deg) |
| `settings-full.png` | مركز الإعدادات كاملاً |
| `utc-auto.png` | تلقائي (القاهرة ٢ UTC) |
| `utc-manual-plus3.png` | يدوي +3 |
| `utc-manual-minus5.png` | يدوي −5 |
| `minute-step-before.png` | الفجر 0 دقيقة — ٤:١١ |
| `minute-step-plus1.png` | بعد +1 — «+1 دقيقة» ٤:١٢ |
| `ayah-marker-after.png` | دائرة العلامة الجديدة (نهاري) |
| `dark-after-settings.png` | مركز الإعدادات ليلي |
| `dark-main-after.png` | الواجهة ليلي (قراءة + شريط جديد) |
| `dark-ayah-marker-after.png` | آية بالعلامة الجديدة ليلي |
| `sidebar-after.png` | الشريط مطوي بعد |
| `sidebar-expanded-after.png` | الشريط موسّع بعد |
| `sidebar-with-gear.png` | الشريط مع الترس |
| `sidebar-ratio.png` | قياس 63.1% (487/772) |
| `bookmark-tooltip.png` | hover نجمة الإشارة |
| `mobile-sidebar.png` | موبايل — الشريط الجديد |

## 4. انحرافان موثقان فوق العقد (تحسينات)

1. **إصلاح `font: inherit` في `.step-btn`** — خُصِّص `font-family: inherit` مع `font-size: 0.9rem` و`width: 2.1rem` لضبط محاذاة زر ±1 في الشريط/الصفحات (قاعدة CSS العامة كانت تكسر عرض الزر).
2. **تحسين وضوح حالة disabled** — بدل `opacity: 0.6` العامة، أزرار الخطوة المعطَّلة عند الحصر (±30) تحافظ على `opacity: 1` بنمط باهت واضح مع تباين حدودي في الوضع الليلي أيضاً، فتبقى الحالة مقروءة لا «مختفية».

## 5. نتيجة الاختبارات

| السويت | النتيجة |
|---|---|
| قبول BC-004 (`bc004-acceptance.js`) | **13/13 PASS** — بلا أخطاء console |
| انحدار BC-002/BC-003 (`bc004-regression.js`) | **14/14 PASS** — بلا أخطاء console |
| `npm run lint` (oxlint) | نظيف |
| `npm run build` (`tsc -b && vite build`) | ناجح (PWA v1.3.0، precache 13 entries) |

## 6. حالة Open Items الثلاثة

| البند | الحالة |
|---|---|
| إزاحة UTC (تلقائي/يدوي) له الأولوية في الحساب والعرض | **مغلق** — `effectiveUtcOffsetMinutes` + معامل اختياري في كل الحسابات؛ اليدوي −12..+14 بخطوة ساعة |
| خطوة تعديل دقيقة واحدة لكل الصلوات مع حصر ±30 | **مغلق** — `StepControl` + `useHoldStep` موحّدان في اللوحة والمحرر |
| إزاحة الهجري −3..+3 بلا تغيير (إبقاء BC-003) | **مغلق** — لم يُمس، انحدار أخضر |
| **إضافة:** علامة نهاية الآية تعرض بشكل صحيح | **مغلق (عرض فقط)** — `AyahMarker` بدائرة CSS؛ النص المخزن لم يُمس |

## 7. ملاحظات

- خادم المعاينة يعمل على `localhost:5199` والرابط الحي يستجيب **HTTP 200**.
- حالة التطبيق عند التسليم: ثيم نهاري، موقع القاهرة (30.0444، 31.2357)، UTC تلقائي، إزاحة هجري 0، تعديلات 0.
- ملفات الإثبات القابلة للتشغيل محفوظة خارج المستودع (`/tmp/opencode/*.js`) كي لا تُدرج في المنتج النهائي.
