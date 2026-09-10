# توثيق BC-008 — أذكار الصباح والمساء (المصدر والبيانات والعرض)

## 1) المصدر المعتمد

| البند | القيمة |
|---|---|
| المستودع | `YousefAsalya/Islamic-Pro-azkar-API` |
| الترخيص | MIT (Copyright (c) 2026 Islamic Pro - Azkar API Contributors) |
| الملف | `data/ar.json` |
| الباب المستهدف | `id = 27` — «أذكار الصباح والمساء» — 24 ذكرًا |

**سبب الاعتماد:** بنية مسطّحة نظيفة (مصفوفة أبواب، كل باب يحتوي مصفوفة أذكار)، ترخيص MIT صريح،
حقول نصية مفردة في `text` مع حقل `count` اختياري، ولا حاجة لأي صوت.

## 2) التثبيت (Pin) — commit SHA وليس `@main`

- **commit_sha:** `d793023e3b69c91674023f692425950c8ebbb64d`
- **download_url (مثبّت على الـSHA):**
  `https://raw.githubusercontent.com/YousefAsalya/Islamic-Pro-azkar-API/d793023e3b69c91674023f692425950c8ebbb64d/data/ar.json`
- لا يُستخدم الفرع المتحرك `main` كمرجع تثبيت.

## 3) sha256 — التوثيق والتجميد

| الملف | sha256 |
|---|---|
| التنزيل الأصلي = `src/data/adhkar-source.json` | `7affdd9c1356f66f77057b631ac239cc41bde68f9bdc85d344a852a0a6ff6732` |
| `src/data/adhkar.json` (باب id=27 المستخرج) | `bd4d38c9dcef1a0c570b0ec3db7e282b5209f749e628e676477169f6e6bbb48f` |

`adhkar-source.json` هو نسخة حرفية من التنزيل المثبّت (166,566 بايت)؛ تمت مطابقته بايتًا-ببايت.

## 4) بنية الملف المصدري

- مستوى أعلى: مصفوفة من **132 بابًا**، مفاتيح كل باب: `id, category, audio, filename, array`.
- مفاتيح كل ذكر داخل `array`: `id, text, transliteration, count, audio, filename`.
- لا تقسيم صباح/مساء داخل المصدر؛ «أذكار الصباح والمساء» باب واحد (`id=27`) بقائمة مسطّحة من 24 ذكرًا.

## 5) فحص بوابة النزاهة — U+FFFD

- فحص على مستوى النص (تضمين UTF-8) وعلى مستوى البايت (`EF BF BD`) للملف المثبّت كاملًا:
  **العدد = 0** (لا في المتون، ولا في أسماء الأبواب، ولا في أي حقل).
- النتيجة: لا يلزم أي تصحيح `before → after`؛ لم يوجد ما يُصحَّح.
  هذه نتيجة فحص فعلية للملف المثبّت على `d793023e…` — أنظف مما كان مفترضًا في مسودة العقد
  (التي افترضت وجود 6 أحرف في أسماء الأبواب بناءً على فحص استكشافي سابق غير مثبّت).
- `src/data/adhkar.json` كذلك خالٍ تمامًا من U+FFFD.

## 6) قرار بنية الواجهة (نتيجة المرحلة 0)

- المصدر لا يفصل صباحًا عن مساء في بنيته (لا أبواب فرعية).
- **القرار:** قائمة واحدة بعنوان «أذكار الصباح والمساء» — بدون تبويبات.
- تطبيقًا لقاعدة العقد: «إن لا → قائمة واحدة بعنوان أذكار الصباح والمساء».

## 7) حقول الاستخراج

`src/data/adhkar.json` (باب id=27) بنية:

```ts
type AdhkarItem = {
  id: number;
  text: string;
  count?: number;
};

type AdhkarChapter = {
  id: number;
  category: string;
  items: AdhkarItem[];
};
```

- الحقول المستخرجة فقط: `id`, `text`, `count` (الموجود لجميع الأذكار الـ24).
- الحقول المستبعدة نهائيًا: `transliteration`, `audio`, `filename`.
- `category` منقولة كما وردت في المصدر.
- `count` محفوظ في البيانات ولا يُعرض في الواجهة (V1).
- مطابقة نصية: كل `text` في `adhkar.json` مطابق حرفيًا لنظيره في `adhkar-source.json` (تحقق 24/24، لا اختلاف).

## 8) منهجية العرض (V1)

- شاشة أذكار بسيطة: قائمة واحدة بعنوان «أذكار الصباح والمساء»، كل ذكر في بطاقة نصية هادئة.
- بدون عدادات، بدون تذكيرات، بدون صوت، بدون مشاركة، بدون أي تخصيص.
- نص الأذكار يُقرأ من `src/data/adhkar.json` حصرًا (مضمّن محليًا — لا طلبات شبكة وقت التشغيل).
- لا نص مكتوب يدويًا في الكود؛ لا توليد من الذاكرة؛ لا تعديل على أي `text`.
- الوصول: زر «الأذكار» في شريط أدوات السور (بجانب زر الإعدادات) عبر المسار `#/adhkar`.

## 9) ضوابط الحالات

- `adhkar.json` مفقود/تالف أو `text` فارغ → إيقاف الشاشة وعرض رسالة خطأ واضحة (لا انهيار).
- دفاع إضافي وقت التشغيل: وجود U+FFFD داخل أي نص ذكر → عرض حالة الخطأ (لا يحدث مع البيانات المقفلة).
- الوضع الليلي/النهاري: الألوان عبر متغيرات CSS الحالية (`--paper`, `--ink`, `--green-*`).

## 10) نص ترخيص MIT (مرفق حرفيًا من المصدر)

```
MIT License

Copyright (c) 2026 Islamic Pro - Azkar API Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
