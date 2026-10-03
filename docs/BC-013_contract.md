# عقد البناء BC-013 — تحويل PWA إلى APK (Capacitor)

**المشروع:** مصحف الهدى (منهجية وَثِيق)
**العنوان:** تغليف التطبيق كـ APK لأندرويد عبر Capacitor
**النوع:** عقد بناء (8 أقسام + تقرير خروج إلزامي)
**الحالة:** v1.1 — موقَّع من طارق (3/10/2026) + المستشارَين
**المنفذ:** طارق (على جهازه الفعلي) + توجيه المستشارَين

---

## 0) تذكير إلزامي — دروس BC-010/011

**قبل أي عمل، اقرأ docs/handover.md قسمَي "درس مستفاد":
- BC-010 (b.4c): عند أي تعارض داخلي → توقف وأبلغ حرفيًا.
- BC-011 (VM): بعد أي عمل جوهري → git commit محلي فورًا.**

**قواعد إجرائية إضافية لهذا العقد:**

1. **بيئة العمل:** جهاز طارق الفعلي — لا VM.
2. **مفتاح التوقيع لا رجعة فيه:** D1 منفصل تمامًا عن D2.
3. **عقد تغليف صافٍ:** صفر تعديل على src/.
4. **الإصدار يبقى 1.1.0.**
5. **@capacitor/motion مؤجل إلى BC-013b** — يُفتح فقط بناءً على نتيجة E.

---

## 1) Context

- المشروع: PWA (React + TS + Vite) — V1.0 مكتمل.
- آخر commit: ac6a816 على main.
- BC-001..BC-011 مقفلة.
- بيئة طارق: Node.js + Android Studio + VS Code.
- **الفجوة:** PWA يعمل، لكنه لا يُثبَّت كتطبيق أندرويد.

---

## 2) Assumptions

- Node.js v18+ وnpm v9+ على جهاز طارق.
- Android Studio حديث (Hedgehog 2023.1.1+) + SDK 33+.
- اتصال إنترنت مستقر لتنزيل Gradle dependencies.
- مفتاح التوقيع سيُخزَّن خارج المشروع + نسخة سحابية.

---

## 3) Mission

تحويل PWA إلى APK موقَّع يعمل على أندرويد بسلوك مطابق
لـPWA:
- نفس الميزات (القرآن، الأذكار، الصلاة، القبلة، الإعدادات).
- نفس الواجهة.
- Offline-First.
- **البوصلة:** تعمل كما هي (DeviceOrientationEvent) — لا
  إضافة plugin في هذا العقد. القرار بشأن @capacitor/motion
  يُتخذ في E.

---

## 4) Scope (7 مراحل)

### A0 — بوابة تأكيد (مكتملة)

**الإجابات المعتمدة من طارق (3/10/2026):**

| # | السؤال | الإجابة |
|---|---|---|
| 1 | الإصدار | 1.1.0 (يبقى) |
| 2 | مسار Keystore على الجهاز | D:\2026\projects\Mushaf-Al-Huda.keystore |
| 3 | مسار Keystore السحابي | Google Drive/mushaf-keys/mushaf-al-huda.keystore |
| 4 | النسخة الاحتياطية 1 | D:\2026\projects\Mushaf-Al-Huda.keystore |
| 5 | النسخة الاحتياطية 2 | E:\Backup-Keys\mushaf-al-huda.keystore (قرص خارجي) |
| 6 | إضافي | إرسال بالبريد الإلكتروني عند الإنشاء |
| 7 | آلية المراجعة | نسخ-لصق + لقطات + ملفات |

**A0 مغلق رسميًا.**

### A — اختبار PWA يدوي على هاتف طارق (30 دقيقة)

طارق يفتح:
https://5199-4f310d339217544d.monkeycode-ai.live/

**يفحص 8 عناصر:**
1. Splash.
2. التنقل (4 تبويبات).
3. القرآن.
4. الأذكار.
5. الصلاة.
6. **البوصلة** — فحص أولي على متصفح الهاتف العادي
   (للمقارنة فقط، لا يُبنى عليه قرار BC-013b).
7. الوضع الليلي.
8. الإعدادات.

**يُنتج:** ملاحظات مكتوبة (حتى لو "لا مشاكل").

**⚠️ تنبيه:** نتيجة فحص البوصلة في A تخبر عن متصفح الهاتف
العادي فقط — لا عن WebView لاحقًا. الفحص الحاسم هو E.

**لا commit في A.**

### B — Capacitor Setup + add android

cd ~/projects
git clone https://github.com/TAREQ74T/TAREQ74T mushaf-al-huda
cd mushaf-al-huda
npm install
npm install @capacitor/core @capacitor/cli
npx cap init "مصحف الهدى" com.tareq.mushaf --web-dir=dist
npm run build
npm install @capacitor/android
npx cap add android
npx cap sync android

**تنتهي B عند:**
- npx cap sync android نجح بدون أخطاء.
- مجلد android/ تولَّد.
- مشروع Android Studio يفتح بلا مشاكل.

**commit 1:** WATHEEQ_BC-013: capacitor setup + android platform

### C — AndroidManifest + Permissions

في android/app/src/main/AndroidManifest.xml أضف:
- uses-permission android:name="android.permission.INTERNET"
- uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"
- uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"

**لا @capacitor/motion.**

**commit 2:** WATHEEQ_BC-013: android permissions

### D1 — إنشاء Keystore فقط (لا build)

keytool -genkey -v -keystore mushaf-al-huda.keystore \
  -alias mushaf -keyalg RSA -keysize 2048 -validity 10000

**ينتهي D1 عند:**
1. الملف أُنشئ.
2. نسخة 1: D:\2026\projects\Mushaf-Al-Huda.keystore
3. نسخة 2: E:\Backup-Keys\mushaf-al-huda.keystore
4. نسخة 3: Google Drive/mushaf-keys/mushaf-al-huda.keystore
5. نسخة 4: البريد الإلكتروني
6. .gitignore يستثني *.keystore و *.jks
7. تأكيد كتابي من طارق يذكر كل موقع باسمه.

**لا commit بعد D1.**

### D2 — أول APK build

في android/app/build.gradle أضف signing config.

في Android Studio: Build → Generate Signed Bundle / APK.

**commit 3:** WATHEEQ_BC-013: signing config + first APK build

### E — تثبيت + اختبار حر

طارق يثبّت APK ويفحص:
- Splash / التنقل / القرآن / الأذكار / الصلاة / الوضع الليلي / الإعدادات.
- **البوصلة — الفحص الحاسم:**
  - تعمل بشكل كامل → BC-013b لا يُفتح.
  - تعمل جزئيًا → BC-013b يُفتح لتحسين.
  - لا تعمل إطلاقًا → BC-013b يُفتح لإضافة @capacitor/motion.

**لا commit في E.**

---

## 5) Forbidden

| البند | السبب |
|---|---|
| تعديل أي ملف في src/ | عقد تغليف صافٍ |
| تعديل أي ملف في scripts/verify/ | قاعدة BC-010 |
| إضافة @capacitor/motion | مؤجل لـBC-013b |
| رفع الـkeystore إلى GitHub | خطر أمني |
| تخزين كلمة المرور في الكود | خطر أمني |
| git commit للـkeystore أو local.properties | خطر أمني |
| تعديل quran_full.json / adhkar.json | قاعدة النزاهة |
| رفع الإصدار | يبقى 1.1.0 |
| git push --force | خطر فقدان |
| تجاهل أي فشل في npx cap sync | يبني على أساس غير مؤكَّد |
| فتح BC-013b بناءً على نتيجة A | A يختبر متصفحًا عاديًا — لا WebView |

---

## 6) Deliverables

| المرحلة | المخرج |
|---|---|
| A0 | مكتمل |
| A | ملاحظات PWA مكتوبة |
| B | android/ مولَّد + commit 1 |
| C | AndroidManifest.xml محدَّث + commit 2 |
| D1 | Keystore + 4 نسخ مؤكدة (لا commit) |
| D2 | APK موقَّع + commit 3 |
| E | APK مثبَّت + ملاحظات + نتيجة البوصلة |
| نهائي | EXIT_REPORT_BC-013.md + تحديث handover.md |

---

## 7) Acceptance Tests

### A0
- [x] الإجابات مكتوبة بالاسم + معتمدة من طارق بتاريخ.

### A
- ☐ كل الميزات الثمانية مُختبرة.
- ☐ البوصلة — نتيجة على متصفح الهاتف العادي (للمقارنة).
- ☐ ملاحظات مكتوبة مُرسَلة.

### B
- ☐ npm install نجح.
- ☐ npx cap init نجح.
- ☐ npm run build نجح.
- ☐ npx cap add android نجح.
- ☐ npx cap sync android نجح بدون أخطاء.
- ☐ مشروع Android Studio يفتح بلا مشاكل.
- ☐ commit 1 مدفوع.

### C
- ☐ 3 permissions مضافة.
- ☐ npx cap sync android نجح.
- ☐ لا @capacitor/motion.
- ☐ commit 2 مدفوع.

### D1
- ☐ keystore أُنشئ.
- ☐ 4 نسخ في 4 وسطاء (D + E + Google Drive + Email).
- ☐ .gitignore محدَّث.
- ☐ تأكيد كتابي يذكر كل موقع.
- ☐ لا commit.

### D2
- ☐ signing config مضاف.
- ☐ APK موقَّع مُنتَج.
- ☐ commit 3 مدفوع.
- ☐ لا keystore في commit.

### E
- ☐ APK مثبَّت على الهاتف.
- ☐ كل الفحوص تعمل.
- ☐ البوصلة — نتيجة ثلاثية داخل WebView (تحسم BC-013b).

### نهائي
- ☐ EXIT_REPORT_BC-013.md (مع سبب إبقاء 1.1.0).
- ☐ handover.md محدَّث.
- ☐ APK محفوظ بنسخة احتياطية.
- ☐ لا Critical.

---

## 8) Completion Policy

- أي غموض → توقف وأبلغ.
- أي تعارض داخلي → توقف (بند 0).
- أي تجاوز → توقف.
- لا commit للـkeystore.
- D1 وD2 منفصلان.
- B تنتهي فقط عند npx cap sync ناجح.
- لا فتح BC-013b قبل نتيجة E.
- قبل EXIT_REPORT_BC-013.md: بدّل Skill إلى
  verification-before-completion.
- commit بعد B/C/D2.
- توقف بعد E. لا BC-014.

---

## تقرير الخروج (EXIT_REPORT_BC-013.md)

يشمل:
- commit hashes (1, 2, 3).
- مسار APK + حجمه.
- لقطات من التطبيق المثبَّت.
- نتائج اختبار E.
- نتيجة البوصلة داخل WebView — ثلاثية صريحة.
- قرار BC-013b بناءً على نتيجة E فقط.
- مسار keystore + تأكيد النسخ بالاسم.
- سبب إبقاء الإصدار 1.1.0.
- توقيعات: طارق + Claude + DeepSeek.

---

**عقد 7 مراحل + بوابة A0 + فصل D1/D2 + البوصلة محسومة في E.**
**نهاية العقد.**
