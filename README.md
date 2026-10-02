# 📚 كتابي الذكي للواقع المعزز (WebAR Smart Book)

مشروع تعليمي مجاني بالكامل للواقع المعزز (WebAR) يعمل مباشرة داخل متصفح الهواتف الذكية (Android Chrome و iOS Safari وغيرها) دون الحاجة لتثبيت أي تطبيق من App Store أو Google Play، ودون أي تكاليف أو خدمات سحابية مدفوعة.

---

## 📑 الفهرس

1. [ما هو المشروع؟](#1-ما-هو-المشروع)
2. [المميزات والتقنيات المستخدمة](#2-المميزات-والتقنيات-المستخدمة)
3. [هيكل المشروع الملفي](#3-هيكل-المشروع-الملفي)
4. [كيفية تثبيت وتشغيل المشروع محلياً](#4-كيفية-تثبيت-وتشغيل-المشروع-محلياً)
5. [كيفية إضافة درس جديد في content.json](#5-كيفية-إضافة-درس-جديد-في-contentjson)
6. [كيفية إضافة أهداف جديدة وتوليد targets.mind](#6-كيفية-إضافة-أهداف-جديدة-وتوليد-targetsmind)
7. [كيفية إضافة فيديو YouTube أو MP4 أو Vimeo](#7-كيفية-إضافة-فيديو-youtube-أو-mp4-أو-vimeo)
8. [كيفية إضافة صور ومقاطع صوتية](#8-كيفية-إضافة-صور-ومقاطع-صوتية)
9. [إعداد Google Sheets لتسجيل أحداث الاستخدام](#9-إعداد-google-sheets-لتسجيل-أحداث-الاستخدام)
10. [كود وخطوات نشر Google Apps Script Web App](#10-كود-وخطوات-نشر-google-apps-script-web-app)
11. [ربط Google Apps Script مع الموقع في Vercel](#11-ربط-google-apps-script-مع-الموقع-في-vercel)
12. [رفع المشروع إلى مستودع GitHub](#12-رفع-المشروع-إلى-مستودع-github)
13. [ربط مستودع GitHub ونشره مجاناً على Vercel](#13-ربط-مستودع-github-ونشره-مجاناً-على-vercel)
14. [دليل اختبار الكاميرا والتعرف على الهاتف](#14-دليل-اختبار-الكاميرا-والتعرف-على-الهاتف)
15. [الأمان والخصوصية](#15-الأمان-والخصوصية)

---

## 1. ما هو المشروع؟

صُمم هذا المشروع للكتب المدرسية والمطبوعات التعليمية:
* يفتح الطالب رابط الموقع من هاتفه: `https://my-ar-book.vercel.app`
* يضغط زر **[ تشغيل الكاميرا ]** ويمنح الإذن للمتصفح.
* تبقى كاميرا الهاتف ظاهرة في الخلفية بشكل كامل (Full Screen).
* يوجّه الطالب الكاميرا إلى صورة الدرس المطبوعة في الكتاب (Target Image).
* يتعرف محرك **MindAR Image Tracking** المفتوح المصدر على صورة الدرس تلقائياً عبر المتصفح.
* تظهر واجهة زجاجية شفافة **(Transparent HTML Overlay)** فوق الكاميرا تحتوي على 4 أزرار كبيرة وسهلة للأطفال:
  - 🎬 **فيديو:** مشغل فيديو منبثق يدعم YouTube و MP4 و Vimeo.
  - 🖼️ **صور:** معرض مخططات وصور توضيحية مع أزرار التنقل.
  - 🔊 **استماع:** مشغل صوتي للدرس مع قراءة صوتية آلية.
  - 📝 **شرح:** شرح تعليمي عربي منسق مع أسئلة تفاعلية فورية.
* يتم تسجيل حركة وتفاعل الطالب تلقائياً في **Google Sheets** كإحصائيات استخدام بدون جمع أي بيانات شخصية حساسة.

---

## 2. المميزات والتقنيات المستخدمة

* **MindAR Image Tracking (1.2.5):** محرك تتبع بصري خفيف يعمل بتقنية WebAssembly داخل المتصفح.
* **React 19 & TypeScript & Vite:** أداء فائق السرعة وخفة وزن للأجهزة الضعيفة.
* **Tailwind CSS:** تصميم Mobile-First زجاجي شفاف (Glassmorphism) بدعم كامل للغة العربية (RTL).
* **Google Apps Script & Google Sheets:** قاعدة بيانات وإحصائيات مجانية 100% بدون خوادم مدفوعة.
* **Zero Cost Architecture:** يعمل على خطة Vercel Hobby المجانية واستضافة GitHub المجانية.

---

## 3. هيكل المشروع الملفي

```text
smart-ar-book/
├── public/
│   ├── targets/
│   │   ├── targets.mind             # خريطة تتبع النقاط لصور الكتاب
│   │   ├── target_lesson_001.jpg    # صورة الهدف: دورة الماء
│   │   ├── target_lesson_002.jpg    # صورة الهدف: المجموعة الشمسية
│   │   ├── target_lesson_003.jpg    # صورة الهدف: الخلية النباتية
│   │   └── target_lesson_004.jpg    # صورة الهدف: طبقات الأرض
│   └── data/
│       └── content.json             # ملف بيانات الدروس والوسائط والشروحات
│
├── google-apps-script/
│   └── Code.gs                      # كود سكريبت Google Apps Script للربط مع Google Sheets
│
├── src/
│   ├── types/
│   │   └── ar.ts                    # تعريفات TypeScript للدروس والأحداث
│   ├── data/
│   │   └── lessons.ts               # محمل وموفر بيانات الدروس
│   ├── services/
│   │   └── analytics.ts             # خدمة تسجيل الأحداث في Google Sheets
│   ├── components/
│   │   ├── WelcomeScreen.tsx        # الشاشة الافتتاحية وزر تشغيل الكاميرا
│   │   ├── ARCameraView.tsx         # شاشة الكاميرا وإطار المسح وتتبع MindAR
│   │   ├── TransparentOverlay.tsx   # واجهة الأزرار الشفافة فوق الكاميرا
│   │   ├── VideoModal.tsx           # نافذة تشغيل الفيديو (YouTube / MP4)
│   │   ├── GalleryModal.tsx         # نافذة معرض الصور والمخططات
│   │   ├── AudioPlayerModal.tsx     # مشغل الصوت والقراءة الصوتية
│   │   ├── ExplanationModal.tsx     # نافذة الشرح المنسق والأسئلة التفاعلية
│   │   ├── TargetCardsModal.tsx     # نافذة بطاقات الأهداف للطباعة والمسح
│   │   ├── TeacherConsoleModal.tsx  # لوحة المعلم وسجل أحداث Google Sheets
│   │   └── MindARCompilerModal.tsx  # دليل تجميع صور الكتاب
│   ├── App.tsx                      # المكون الرئيسي وإدارة الحالة
│   ├── main.tsx                     # نقطة انطلاق التطبيق
│   └── index.css                    # الأنماط والتأثيرات الزجاجية
│
├── index.html                       # صفحة HTML مع استدعاء خط Cairo ومكتبة MindAR
├── package.json
└── README.md
```

---

## 4. كيفية تثبيت وتشغيل المشروع محلياً

### المتطلبات الأساسية:
* تثبيت **Node.js** (الإصدار 18 أو 20 أو 22).

### خطوات التشغيل:
```bash
# 1. الدخول إلى مجلد المشروع
cd smart-ar-book

# 2. تثبيت الحزم المطلوبة
npm install

# 3. تشغيل خادم التطوير
npm run dev
```

افتح المتصفح على: `http://localhost:3000`

> **ملاحظة حول الكاميرا محلياً:** المتصفحات تسمح بتشغيل الكاميرا على `http://localhost`. ولكن عند فتح الموقع من الهاتف، يجب توفير بروتوكول مشفر **HTTPS** (وهذا ما يوفره رابط Vercel تلقائياً).

---

## 5. كيفية إضافة درس جديد في content.json

افتح الملف `public/data/content.json` وأضف كائناً جديداً في مصفوفة `lessons`:

```json
{
  "targetIndex": 4,
  "targetId": "lesson_005",
  "title": "الجهاز الهضمي في الإنسان",
  "subtitle": "رحلة الطعام وتحوله إلى طاقة يستفيد منها الجسم",
  "subject": "العلوم والأحياء",
  "grade": "الصف الخامس الابتدائي",
  "targetImage": "/targets/target_lesson_005.jpg",
  "video": {
    "type": "youtube",
    "url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "embedUrl": "https://www.youtube.com/embed/VIDEO_ID?autoplay=1&rel=0",
    "title": "فيديو الجهاز الهضمي"
  },
  "images": [
    {
      "url": "/targets/target_lesson_005.jpg",
      "title": "مخطط أعضاء الجهاز الهضمي",
      "caption": "الفم، المريء، المعدة، والأمعاء الدقيقة والغليظة."
    }
  ],
  "audio": {
    "url": "https://example.com/audio/digestive.mp3",
    "title": "شرح وظائف أعضاء الهضم",
    "duration": "02:15"
  },
  "description": {
    "summary": "الجهاز الهضمي مسؤول عن تفتيت الطعام وامتصاص العناصر الغذائية.",
    "keyPoints": [
      "يبدأ الهضم في الفم بالأسنان واللعاب.",
      "تفرز المعدة العصارة الهاضمة لتفكيك البروتينات."
    ],
    "fullText": "شرح كامل للدرس بتفاصيله وفقراته...",
    "funFact": "الأمعاء الدقيقة في الإنسان البالغ يصل طولها إلى حوالي 6 أمتار!",
    "quiz": {
      "question": "أين تبدأ أولى مراحل هضم الطعام؟",
      "options": ["المعدة", "الفم", "المريء", "الأمعاء"],
      "correctIndex": 1,
      "explanation": "تبدأ عملية الهضم في الفم من خلال تقطيع الطعام ومزجه بإنزيمات اللعاب."
    }
  }
}
```

---

## 6. كيفية إضافة أهداف جديدة وتوليد targets.mind

1. **التقاط صور صفحات الكتاب:**
   - التقط صورة عالية الوضوح للصفحة المطبوعة.
   - يفضل أن تحتوي الصورة على رسومات أو أشكال ذات تباين جيد وتفاصيل غنية.
2. **استخدام أداة التجميع المجانية:**
   - افتح أداة تجميع MindAR الرسمية على الرابط:
     [https://hiukim.github.io/mind-ar-js-doc/tools/compile](https://hiukim.github.io/mind-ar-js-doc/tools/compile)
   - اسحب صور الدروس بالترتيب:
     - الصورة الأولى تصبح: `targetIndex: 0`
     - الصورة الثانية تصبح: `targetIndex: 1`
     - الصورة الثالثة تصبح: `targetIndex: 2`
     - وهكذا...
3. **تنزيل الملف:**
   - اضغط زر **Compile**.
   - بعد انتهاء المعالجة، اضغط **Download**.
   - سيتم تنزيل ملف اسمه `targets.mind`.
4. **وضع الملف في المشروع:**
   - انقل الملف إلى المسار: `public/targets/targets.mind` (استبدال الملف السابق).

---

## 7. كيفية إضافة فيديو YouTube أو MP4 أو Vimeo

في ملف `content.json`:

### رابط YouTube:
```json
"video": {
  "type": "youtube",
  "url": "https://www.youtube.com/watch?v=ncORPosDrjI",
  "embedUrl": "https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0",
  "title": "فيديو توضيحي"
}
```

### رابط فيديو مباشر بصيغة MP4:
```json
"video": {
  "type": "mp4",
  "url": "https://example.com/videos/lesson_01.mp4",
  "embedUrl": "https://example.com/videos/lesson_01.mp4",
  "title": "فيديو عالي الدقة"
}
```

---

## 8. كيفية إضافة صور ومقاطع صوتية

### الصور:
- يمكنك وضع الصور في مجلد `public/images/` أو `public/targets/` واستدعائها بمسار نسبي مثل `/targets/target_lesson_001.jpg`.
- أو استخدام أي رابط مباشر وموثوق للصورة بصيغة JPG/PNG.

### المقاطع الصوتية:
- يدعم التطبيق صيغ `MP3` و `OGG` و `M4A`.
- في حال عدم توفر مقطع صوتي مخصص، يحتوي التطبيق تلقائياً على زر **قراءة الشرح الصوتي الآلي (TTS)** باللغة العربية.

---

## 9. إعداد Google Sheets لتسجيل أحداث الاستخدام

1. افتح [Google Sheets](https://sheets.new) وأنشئ جدولاً جديداً.
2. سمّ الجدول: **AR_BOOK_DATA**.
3. سمّ الورقة الأولى في الأسفل: **Events**.
4. ضع في الصف الأول (الترويسة) العناوين التالية:
   - العمود A: `timestamp`
   - العمود B: `session_id`
   - العمود C: `target_id`
   - العمود D: `lesson_title`
   - العمود E: `action`
   - العمود F: `device`
   - العمود G: `language`

---

## 10. كود وخطوات نشر Google Apps Script Web App

1. من داخل جدول بيانات Google Sheet، اضغط من القائمة العلوية على:
   **الإضافات (Extensions)** ← **Apps Script**.
2. امسح أي كود موجود في نافذة المحرر، والصق كود السكريبت الموجود كاملاً في ملف `/google-apps-script/Code.gs`:

```javascript
var SHEET_NAME = "Events";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      data.timestamp || Utilities.formatDate(new Date(), "GMT+3", "yyyy-MM-dd HH:mm:ss"),
      data.session_id || "session",
      data.target_id || "target",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter && e.parameter.data) {
    return doPost({ postData: { contents: e.parameter.data } });
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "active" })).setMimeType(ContentService.MimeType.JSON);
}
```

3. اضغط أيقونة الحفظ (💾).
4. اضغط زر **نشر (Deploy)** في أعلى اليمين ثم اختر **نشر جديد (New deployment)**.
5. اضغط على الترس بجانب "Select type" واختر **تطبيق ويب (Web app)**:
   - **الوصف (Description):** WebAR Logger
   - **تنفيذ باسم (Execute as):** أنا (Me)
   - **من يمكنه الوصول (Who has access):** **أي شخص (Anyone)** ⚠️ *شرط ضروري لكي يستطيع متصفح الطلاب إرسال الأحداث دون طلب تسجيل دخول Google*.
6. اضغط **Deploy**.
7. انسخ **رابط تطبيق الويب (Web App URL)** الذي يظهر بالشكل:
   `https://script.google.com/macros/s/AKfycbx.../exec`

---

## 11. ربط Google Apps Script مع الموقع في Vercel

لديك طريقتان للربط:

### الطريقة الأولى (من داخل واجهة الموقع مباشرة):
1. افتح الموقع واضغط أيقونة الجدول الأخضر (لوحة المعلم) في أعلى الشاشة.
2. الصق رابط تطبيق الويب في خانة `رابط نشر Google Apps Script Web App`.
3. اضغط **حفظ الرابط**.
4. اضغط **اختبار إرسال حدث** لتتأكد من ظهوره فوراً في جدول Google Sheets!

### الطريقة الثانية (عبر متغيرات البيئة في Vercel):
- في لوحة تحكم مشروعك على Vercel، اذهب إلى:
  `Settings` ← `Environment Variables`
- أضف متغيراً باسم:
  `VITE_GOOGLE_APPS_SCRIPT_URL`
- قيمته: رابط السكريبت الخاص بك.

---

## 12. رفع المشروع إلى مستودع GitHub

```bash
# 1. تهيئة مستودع Git
git init

# 2. إضافة جميع الملفات
git add .

# 3. تسجيل الحفظ الأول
git commit -m "Initial commit: Free WebAR Educational Book platform"

# 4. تغيير اسم الفرع الرئيسي إلى main
git branch -M main

# 5. ربط المستودع برابط GitHub الخاص بك
git remote add origin https://github.com/USERNAME/smart-ar-book.git

# 6. الرفع
git push -u origin main
```

---

## 13. ربط مستودع GitHub ونشره مجاناً على Vercel

1. سجّل الدخول إلى موقع [Vercel](https://vercel.com) مجاناً بحساب GitHub.
2. اضغط على زر **Add New...** ثم **Project**.
3. اختر مستودع `smart-ar-book` من قائمة مستودعاتك في GitHub واضغط **Import**.
4. سيتعرف Vercel تلقائياً على أن المشروع مبني بـ **Vite**.
5. الإعدادات الافتراضية:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
6. اضغط زر **Deploy**.
7. خلال أقل من دقيقة، سيعطيك Vercel رابطاً آمناً ومجانياً مع شهادة SSL مجانية:
   `https://smart-ar-book.vercel.app`

---

## 14. دليل اختبار الكاميرا والتعرف على الهاتف

1. افتح رابط موقعك المنشور على Vercel من هاتفك (باستخدام Chrome على Android أو Safari على iPhone).
2. اضغط زر **[ 📷 تشغيل الكاميرا الآن ]**.
3. عندما يطلب المتصفح إذن الكاميرا، اضغط **سماح (Allow)**.
4. افتح شاشة كمبيوتر أو اطبع إحدى بطاقات الدروس من زر **[ عرض بطاقات الدروس للتجربة أو الطباعة ]**.
5. وجّه كاميرا الهاتف نحو صورة الدرس (مثلاً دورة الماء).
6. سيتعرف المحرك عليها في جزء من الثانية، وتتحول الشارة إلى:
   `✓ تم التعرف: دورة الماء في الطبيعة`
7. ستظهر الواجهة الشفافة فوق الكاميرا مع الأزرار الأربعة.
8. جرب فتح الفيديو، الصور، الصوت، والشرح.
9. افتح جدول Google Sheets وتأكد من تسجيل كل حركة قمت بها في الجدول مباشرة!

---

## 15. الأمان والخصوصية

* **الخصوصية التامة:** لا يتم إرسال أي صورة أو فيديو من كاميرا الطالب إلى أي خادم خارجي. التتبع البصري يتم محلياً بالكامل 100% داخل معالج هاتف الطالب.
* **بدون بيانات شخصية:** لا يطلب التطبيق أسماء أو أرقام هواتف أو بريد إلكتروني من الطلاب، ويستخدم معرّف جلسة عشوائياً مشفراً (`session_id`) فقط لتمييز العمليات.
* **بدون تكاليف مخفية:** لا يتطلب المشروع أي اشتراكات أو بطاقات ائتمان.
