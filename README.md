# 🚀 VideoPilot Pro (Universal Downloader PC Edition)

<div align="center">

![VideoPilot Pro](https://img.shields.io/badge/Platform-Windows%20x64-0078D6?style=for-the-badge&logo=windows&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-35.7.5-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![yt-dlp](https://img.shields.io/badge/Engine-yt--dlp-red?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**تطبيق سطح مكتب متكامل واحترافي لتحميل الفيديوهات والصوتيات بأعلى جودة من مختلف منصات التواصل الاجتماعي مع واجهة مستخدم عصرية ودعم التحديثات التلقائية.**

[المميزات](#-المميزات-الرئيسية--key-features) • [المنصات المدعومة](#-المنصات-المدعومة--supported-platforms) • [الهيكل التقني](#-الهيكل-التقني--tech-stack) • [التثبيت والتشغيل](#-التثبيت-والتشغيل--installation--setup) • [بناء النسخة التنفيذية](#-بناء-ملف-التثبيت-exe--building-executable) • [واجهة البرمجة API](#-توثيق-واجهة-api)

---

</div>

## 📖 نظرة عامة (Overview)

**VideoPilot Pro** هو تطبيق سطح مكتب قوي مبني باستخدام تقنيات الويب الحديثة (Electron + React 19 + Express)، يتيح للمستخدمين استخراج وتحميل مقاطع الفيديو والموسيقى وقوائم التشغيل (Playlists) بسهولة وسرعة فائقة. يعتمد التطبيق على محرك `yt-dlp` و `ffmpeg` لضمان أعلى جودة ممكنة للصوت والصورة بدون علامات مائية وبخيارات تخصيص مرنة.

---

## ✨ المميزات الرئيسية (Key Features)

- **⚡ تحميل مباشر وسريع (Direct Downloader):** استخراج فوري لمعلومات الفيديو (العنوان، القناة، المدة، الصورة المصغرة، وصيغ التحميل المتاحة).
- **📂 تحميل متعدد دفعة واحدة (Batch Downloader):** إمكانية إدخال روابط متعددة في وقت واحد وتحليلها وتنزيلها تلقائياً.
- **🎵 استخراج صوتي فائق الدقة (320kbps MP3):** تحويل ومعالجة الصوتيات باستخدام مكتبة `ffmpeg` للحصول على أفضل نقاء صوتي.
- **📑 دعم قوائم التشغيل (Playlists):** استكشاف وتحميل قوائم التشغيل الكاملة من YouTube مع خيار اختيار مسارات معينة أو تحميل الكل.
- **🎨 تخصيص المظهر (Themes):** 4 أنماط ألوان عصرية:
  - **Emerald Cyber** (الوضع الافتراضي الأخضر النيوني)
  - **Electric Violet** (البنفسجي الجذاب)
  - **Cyberpunk Cyan** (الأزرق والسيان المستقبلي)
  - **Sunset Crimson** (الأحمر والذهبي الدافئ)
- **💾 اختيار مجلد الحفظ المخصص:** تحديد مسار حفظ الفيديوهات والصوتيات في أي مكان على جهاز الكمبيوتر عبر نافذة اختيار المجلدات الأصلية لنظام Windows.
- **📜 سجل التحميلات (Download History):** تتبع جميع العمليات السابقة محلياً لسهولة الرجوع إليها.
- **🔄 التحديث التلقائي (Auto-Updater):** نظام متصل بـ GitHub Releases للتحقق من وجود تحديثات وتنزيلها وتثبيتها بسلاسة.
- **🛡️ أمان واستقرار عالي:** خادم Express مدمج ومحمي برمز وصول سري (`x-app-secret`) لمنع الطلبات غير المصرح بها.

---

## 🌐 المنصات المدعومة (Supported Platforms)

| المنصة | نوع المحتوى المدعوم | الجودة المدعومة |
| :--- | :--- | :--- |
| **YouTube** | فيديوهات عادية، Shorts، قوائم تشغيل (Playlists) | Best MP4 / MP3 320kbps |
| **TikTok** | مقاطع فيديو بدون علامة مائية | أقصى جودة متاحة |
| **Instagram** | Reels، منشورات الفيديو | أقصى جودة متاحة |
| **Facebook** | فيديوهات عامة، Watch، Reels | أقصى جودة متاحة |
| **Twitter / X** | تغريدات الفيديو والوسائط | أقصى جودة متاحة |

---

## 🛠️ الهيكل التقني (Tech Stack)

### 1. واجهة سطح المكتب (Desktop Engine)
- **Electron (v35.7.5):** بيئة تشغيل سطح المكتب بنظام النوافذ المخصصة بدون إطار (Frameless Window).
- **Electron Builder & Electron Updater:** تجميع التطبيق وإنشاء ملف التثبيت والتحديث التلقائي عبر GitHub.

### 2. واجهة المستخدم (Frontend)
- **React 19 + TypeScript:** أحدث إصدارات React لكفاءة استثنائية وإدارة الحالة.
- **Vite 8:** أداة بناء وتطوير فائقة السرعة.
- **Tailwind CSS v4:** تنسيقات CSS حديثة مع سمات قابلة للتخصيص.
- **Lucide React:** أيقونات عصرية موحدة.
- **Framer Motion:** مؤثرات وانتقالات حركية سلسة.

### 3. الواجهة الخلفية ومحرك المعالجة (Backend & Processing)
- **Node.js & Express:** خادم محلي مدمج لإدارة عمليات الاستخراج والتحميل.
- **yt-dlp:** محرك استخراج الوسائط الأقوى عالمياً.
- **ffmpeg-static:** معالجة ودمج وتحويل مسارات الفيديو والصوت إلى صيغة MP3 / MP4.
- **جاهز للنشر السحابي (Vercel Serverless Ready):** يحتوي على ملفات `vercel.json` و `api/index.js` للتشغيل كخدمة ويب.

---

## 📁 هيكل مجلدات المشروع (Project Structure)

```text
VideoPilot Pro/
├── api/                    # معالجات بدون خادم متوافقة مع Vercel (Serverless)
│   └── index.js
├── client/                 # تطبيق الواجهة الأمامية (React + Vite + Tailwind v4)
│   ├── src/
│   │   ├── components/     # مكونات الواجهة (Downloader, Batch, History, Settings, ...)
│   │   ├── types.ts        # تعريفات TypeScript المشتركة
│   │   ├── App.tsx         # المكون الرئيسي للتطبيق
│   │   └── main.tsx
│   └── package.json
├── desktop/                # عمليات Electron لسطح المكتب
│   ├── main.js             # نقطة دخول تطبيق Electron وإدارة النوافذ والـ IPC
│   └── dev-app-update.yml  # إعدادات التحديث التلقائي في بيئة التطوير
├── dist_installer/         # مخرجات ملف التثبيت النهائي (NSIS Setup .exe)
├── server/                 # خادم Express المحلي المدمج
│   ├── utils/
│   │   └── yt.js           # منطق التفاعل مع yt-dlp ومكتبة FFmpeg
│   ├── index.js            # خادم Express ومسارات الـ API
│   └── package.json
├── package.json            # ملف التبعيات والسكربتات الرئيسي للمشروع
└── vercel.json             # تكوين النشر السحابي على منصة Vercel
```

---

## 💻 متطلبات التشغيل (Prerequisites)

قبل البدء، تأكد من تثبيت الأدوات التالية على جهازك:
1. **[Node.js](https://nodejs.org/)** (الإصدار 18 أو أحدث)
2. **[Python](https://www.python.org/)** (الإصدار 3.9 أو أحدث)
3. **yt-dlp** مثبت ومضاف إلى متغيرات النظام (PATH):
   ```bash
   pip install -U yt-dlp
   ```

---

## 🚀 التثبيت والتشغيل (Installation & Setup)

### 1. استنساخ المستودع (Clone Repository)
```bash
git clone https://github.com/PhelobaterFady/VideoPilotPRO.git
cd VideoPilotPRO
```

### 2. تثبيت الحزم (Install Dependencies)
قم بتثبيت الحزم للمشروع الرئيسي، الخادم، والعميل:
```bash
# تثبيت حزم المجلد الرئيسي
npm install

# تثبيت حزم الخادم
npm --prefix server install

# تثبيت حزم الواجهة الأمامية
npm --prefix client install
```

### 3. تشغيل وضع التطوير (Development Mode)

- **لتشغيل الواجهة والخادم معاً في المتصفح:**
  ```bash
  npm run dev
  ```
  سيعمل الخادم على المنفذ `http://localhost:5000` وواجهة Vite على `http://localhost:5173`.

- **لتشغيل تطبيق سطح المكتب (Electron):**
  ```bash
  npm run desktop
  ```

---

## 📦 بناء ملف التثبيت (Building Executable .exe)

لإنشاء ملف التثبيت الاحترافي الخاص بنظام Windows (`.exe` NSIS Installer):

```bash
npm run build:exe
```

- سيتم بناء الواجهة المجمعة في `client/dist`.
- سيتم إنشاء ملف التثبيت التلقائي داخل مجلد `dist_installer/`.
- يحتوي التثبيت على إنشاء اختصار على سطح المكتب وقائمة ابدأ وتفعيل التحديث التلقائي.

---

## 🔌 توثيق واجهة API (API Endpoints)

جميع الطلبات الحساسة تتطلب إرسال الهيدر التالي للمصادقة:
`x-app-secret: VP_PRO_APP_SECRET_2026`

| المسار | الطريقة | الوصف | Body / المعاملات |
| :--- | :--- | :--- | :--- |
| `/api/version` | `GET` | الاستعلام عن أحدث إصدار ورابط التحميل | لا يوجد |
| `/api/info` | `POST` | استخراج بيانات رابط فيديو أو قائمة تشغيل | `{ "url": "https://..." }` |
| `/api/batch-info` | `POST` | استخراج بيانات روابط متعددة دفعة واحدة | `{ "urls": ["https://...", "https://..."] }` |
| `/api/download` | `POST` | بدء عملية تحميل وحفظ الملف على القرص | `{ "url": "...", "format": "...", "audioOnly": false, "outputDir": "..." }` |

---

## 🔒 الأمان والملاحظات (Security & Best Practices)

- التطبيق مخصص للاستخدام الشخصي وتحميل المحتوى المصرح به قانونياً وفق سياسات المنصات.
- يتم حفظ إعدادات المستخدم ومسارات التخزين محلياً باستخدام `localStorage` ولا يتم إرسالها إلى أي خوادم خارجية.
- يُنصح بتحديث مكتبة `yt-dlp` بصفة دورية عبر تشغيل `pip install -U yt-dlp` لضمان توافق التنزيل مع التحديثات المستمرة لمنصات الفيديو.

---

## 👤 المطور والمساهمة (Author & Credits)

- **المطور:** Phelobater Fady ([GitHub](https://github.com/PhelobaterFady))
- **المشروع:** [VideoPilotPRO](https://github.com/PhelobaterFady/VideoPilotPRO)
- **الترخيص:** MIT License
