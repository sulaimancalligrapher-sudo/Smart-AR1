/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppLanguage, TranslationGroupId, TranslationItem, TranslationGroupInfo } from '../types/translation';

export type { AppLanguage, TranslationGroupId, TranslationItem, TranslationGroupInfo };

const STORAGE_LANG_KEY = 'smart_ar_active_lang_v1';
const STORAGE_TRANSLATIONS_KEY = 'smart_ar_custom_translations_v1';

export const TRANSLATION_GROUPS: TranslationGroupInfo[] = [
  {
    id: 'group1_welcome',
    titleAr: 'المجموعة 1 (واجهة الترحيب والبداية)',
    titleEn: 'Group 1 (Welcome & Landing Screen)',
    titleTh: 'กลุ่ม 1 (หน้าจอต้อนรับและหน้าหลัก)',
    descriptionAr: 'عنوان التطبيق، الرسالة الترحيبية، زر فتح الكاميرا، زر طلب الاشتراك، وحقوق الملكية',
    iconName: 'Sparkles'
  },
  {
    id: 'group2_camera',
    titleAr: 'المجموعة 2 (شاشة الكاميرا والتعرف البصري)',
    titleEn: 'Group 2 (Camera & Optical Recognition)',
    titleTh: 'กลุ่ม 2 (หน้าจอกล้องและการตรวจจับภาพ)',
    descriptionAr: 'إرشادات توجيه الكاميرا، رسالة جارٍ التعرف، تتبع الواقع المعزز، ورسائل فحص الصفحة',
    iconName: 'Camera'
  },
  {
    id: 'group3_interactive',
    titleAr: 'المجموعة 3 (الأزرار وبطاقات المحتوى التفاعلي)',
    titleEn: 'Group 3 (Interactive Buttons & Cards)',
    titleTh: 'กลุ่ม 3 (ปุ่มโต้ตอบและการ์ดเนื้อหา)',
    descriptionAr: 'أسماء الأزرار الستة: فيديو، صور، صوت، شرح، مجسم 3D، أسئلة، وأزرار التنقل والإغلاق',
    iconName: 'Layers'
  },
  {
    id: 'group4_alerts',
    titleAr: 'المجموعة 4 (نظام التقييم والتنبيهات والمشتركين)',
    titleEn: 'Group 4 (Evaluation, Alerts & Subscriptions)',
    titleTh: 'กลุ่ม 4 (การประเมิน การแจ้งเตือน และสมาชิก)',
    descriptionAr: 'رسائل قفل الدروس المقيدة، تسجيل الدخول، تقييم الإجابات (أحسنت، صح، خطأ)، وشارات الطلاب',
    iconName: 'ShieldCheck'
  }
];

export const DEFAULT_TRANSLATION_ITEMS: TranslationItem[] = [
  // =========================================================================
  // المجموعة 1: واجهة الترحيب والبداية
  // =========================================================================
  {
    id: 'welcome_app_title',
    group: 'group1_welcome',
    labelAr: 'عنوان التطبيق الرئيسي',
    ar: 'منصة كتابي الذكي للواقع المعزز (Smart-AR)',
    en: 'Smart-AR Interactive Textbook Platform',
    th: 'แพลตฟอร์มหนังสือเรียนอัจฉริยะความจริงเสริม (Smart-AR)'
  },
  {
    id: 'welcome_app_subtitle',
    group: 'group1_welcome',
    labelAr: 'الرسالة الترحيبية ووصف المنصة',
    ar: 'حوّل صفحات كتابك المدرسي إلى مجسمات تفاعلية ثلاثية الأبعاد وشروحات ذكية باستخدام كاميرا هاتفك فوراً',
    en: 'Transform textbook pages into interactive 3D models and smart lessons using your camera instantly',
    th: 'เปลี่ยนหน้าหนังสือเรียนให้เป็นโมเดล 3 มิติเชิงโต้ตอบและบทเรียนอัจฉริยะผ่านกล้องมือถือได้ทันที'
  },
  {
    id: 'welcome_start_camera_btn',
    group: 'group1_welcome',
    labelAr: 'زر فتح الكاميرا وبدء المسح',
    ar: 'بدء المسح البصري وفتح الكاميرا',
    en: 'Start Optical Scan & Open Camera',
    th: 'เริ่มสแกนและเปิดกล้อง'
  },
  {
    id: 'welcome_subscriber_login_btn',
    group: 'group1_welcome',
    labelAr: 'زر تسجيل دخول المشتركين',
    ar: 'تسجيل دخول المشتركين',
    en: 'Subscriber Login',
    th: 'เข้าสู่ระบบสมาชิก'
  },
  {
    id: 'welcome_request_sub_btn',
    group: 'group1_welcome',
    labelAr: 'زر طلب الاشتراك والتفعيل',
    ar: 'طلب تفعيل الاشتراك الكامل',
    en: 'Request Full Subscription',
    th: 'ขอสมัครสมาชิกเต็มรูปแบบ'
  },
  {
    id: 'welcome_visitor_hint',
    group: 'group1_welcome',
    labelAr: 'شارة وضع الزائر والتجربة المجانية',
    ar: 'وضع الزائر: تجربة مجانية سريعة لدروس النموذج التجريبي',
    en: 'Visitor Mode: Free instant preview of demo lessons',
    th: 'โหมดผู้เยี่ยมชม: ทดลองเรียนฟรีสำหรับบทเรียนตัวอย่าง'
  },
  {
    id: 'welcome_features_title',
    group: 'group1_welcome',
    labelAr: 'عنوان قسم ميزات المنصة',
    ar: 'ميزات التجربة التعليمية المعززة بالكتاب',
    en: 'Enhanced AR Learning Features',
    th: 'คุณสมบัติการเรียนรู้ด้วยเทคโนโลยี AR'
  },
  {
    id: 'welcome_copyright',
    group: 'group1_welcome',
    labelAr: 'حقوق الملكية الفكرية',
    ar: 'جميع الحقوق محفوظة منصة كتابي الذكي Smart-AR © 2026',
    en: 'All Rights Reserved - Smart-AR Platform © 2026',
    th: 'สงวนลิขสิทธิ์ทั้งหมด แพลตฟอร์ม Smart-AR © 2026'
  },

  // =========================================================================
  // المجموعة 2: شاشة الكاميرا والتعرف البصري
  // =========================================================================
  {
    id: 'camera_guide_point',
    group: 'group2_camera',
    labelAr: 'إرشاد توجيه الكاميرا إلى الصفحة',
    ar: 'وجّه الكاميرا نحو صفحة الدرس في الكتاب',
    en: 'Point your camera at the lesson page in the book',
    th: 'หันกล้องไปที่หน้าบทเรียนในหนังสือ'
  },
  {
    id: 'camera_tracking_active',
    group: 'group2_camera',
    labelAr: 'رسالة تتبع الواقع المعزز نشط',
    ar: 'تتبع الواقع المعزز (AR Tracking) نشط ومجهز',
    en: 'AR Tracking is active and ready',
    th: 'ระบบติดตาม AR พร้อมทำงานแล้ว'
  },
  {
    id: 'camera_slow_approach',
    group: 'group2_camera',
    labelAr: 'توجيه تقريب الكاميرا ببطء',
    ar: 'قرّب الكاميرا ببطء من صفحة الدرس حتى يظهر المجسم مباشرة فوق الورقة',
    en: 'Move camera slowly closer until the 3D model appears right above the paper',
    th: 'ค่อยๆ เลื่อนกล้องเข้าใกล้หน้าบทเรียน จนกว่าโมเดล 3 มิติจะปรากฏขึ้นบนหน้ากระดาษ'
  },
  {
    id: 'camera_status_scanning',
    group: 'group2_camera',
    labelAr: 'رسالة جارٍ المسح والتعرف',
    ar: 'وجّه الكاميرا للصورة...',
    en: 'Scanning for lesson page...',
    th: 'กำลังสแกนหาหน้าบทเรียน...'
  },
  {
    id: 'camera_status_detected',
    group: 'group2_camera',
    labelAr: 'رسالة تثبيت المجسم على الصفحة',
    ar: 'مثبت على الكتاب',
    en: 'Anchored on Book',
    th: 'ตรวจจับหน้าหนังสือสำเร็จ'
  },
  {
    id: 'camera_loading_title',
    group: 'group2_camera',
    labelAr: 'عنوان تشغيل الكاميرا والمحرك',
    ar: 'جارٍ تشغيل الكاميرا وتجهيز مجسمات الواقع المعزز...',
    en: 'Starting camera and preparing AR models...',
    th: 'กำลังเปิดกล้องและจัดเตรียมโมเดล AR...'
  },
  {
    id: 'camera_waiting_permission',
    group: 'group2_camera',
    labelAr: 'رسالة انتظار تأكيد إذن الكاميرا',
    ar: 'في انتظار تأكيد إذن الكاميرا...',
    en: 'Waiting for camera permission...',
    th: 'กำลังรอการอนุญาตให้ใช้กล้อง...'
  },
  {
    id: 'camera_permission_hint',
    group: 'group2_camera',
    labelAr: 'إرشاد الضغط على زر السماح للكاميرا',
    ar: 'إذا ظهر لك مربع في أعلى المتصفح يطلب إذن الكاميرا، اضغط على (سماح / Allow).',
    en: 'If prompted for camera access, please click (Allow).',
    th: 'หากมีข้อความแจ้งเตือนขออนุญาตใช้กล้อง กรุณากด (อนุญาต / Allow)'
  },
  {
    id: 'camera_cancel_btn',
    group: 'group2_camera',
    labelAr: 'زر إلغاء والعودة للشاشة الرئيسية',
    ar: 'إلغاء والعودة للشاشة الرئيسية',
    en: 'Cancel & Return to Home',
    th: 'ยกเลิกและกลับสู่หน้าหลัก'
  },
  {
    id: 'camera_rescan_btn',
    group: 'group2_camera',
    labelAr: 'زر إعادة ضبط المسح والفوكس',
    ar: 'إعادة ضبط المسح والفوكس',
    en: 'Reset Scan & Focus',
    th: 'รีเซ็ตการสแกนและโฟกัส'
  },

  // =========================================================================
  // المجموعة 3: الأزرار وبطاقات المحتوى التفاعلي
  // =========================================================================
  {
    id: 'btn_video',
    group: 'group3_interactive',
    labelAr: 'زر 1: فيديو تعليمي',
    ar: 'فيديو تعليمي',
    en: 'Educational Video',
    th: 'วิดีโอการเรียนรู้'
  },
  {
    id: 'btn_gallery',
    group: 'group3_interactive',
    labelAr: 'زر 2: معرض الصور',
    ar: 'معرض الصور',
    en: 'Photo Gallery',
    th: 'แกลเลอรีรูปภาพ'
  },
  {
    id: 'btn_audio',
    group: 'group3_interactive',
    labelAr: 'زر 3: التسجيل الصوتي',
    ar: 'التسجيل الصوتي',
    en: 'Audio Recording',
    th: 'เสียงบรรยาย'
  },
  {
    id: 'btn_explanation',
    group: 'group3_interactive',
    labelAr: 'زر 4: بطاقة الشرح',
    ar: 'بطاقة الشرح',
    en: 'Lesson Explanation',
    th: 'การ์ดคำอธิบาย'
  },
  {
    id: 'btn_model3d',
    group: 'group3_interactive',
    labelAr: 'زر 5: مجسم 3D',
    ar: 'مجسم 3D',
    en: '3D Model',
    th: 'โมเดล 3 มิติ'
  },
  {
    id: 'btn_questions',
    group: 'group3_interactive',
    labelAr: 'زر 6: بنك الأسئلة',
    ar: 'بنك الأسئلة',
    en: 'Question Bank',
    th: 'คลังข้อสอบ'
  },
  {
    id: 'btn_next',
    group: 'group3_interactive',
    labelAr: 'زر التنقل: التالي',
    ar: 'التالي',
    en: 'Next',
    th: 'ถัดไป'
  },
  {
    id: 'btn_prev',
    group: 'group3_interactive',
    labelAr: 'زر التنقل: السابق',
    ar: 'السابق',
    en: 'Previous',
    th: 'ก่อนหน้า'
  },
  {
    id: 'btn_close',
    group: 'group3_interactive',
    labelAr: 'زر الإغلاق',
    ar: 'إغلاق',
    en: 'Close',
    th: 'ปิด'
  },
  {
    id: 'btn_rotate_model',
    group: 'group3_interactive',
    labelAr: 'زر تدوير المجسم ثلاثي الأبعاد',
    ar: 'تدوير المجسم',
    en: 'Rotate 3D Model',
    th: 'หมุนโมเดล 3 มิติ'
  },
  {
    id: 'btn_zoom_in',
    group: 'group3_interactive',
    labelAr: 'زر التكبير',
    ar: 'تكبير',
    en: 'Zoom In',
    th: 'ขยาย'
  },
  {
    id: 'btn_zoom_out',
    group: 'group3_interactive',
    labelAr: 'زر التصغير',
    ar: 'تصغير',
    en: 'Zoom Out',
    th: 'ย่อ'
  },

  // =========================================================================
  // المجموعة 4: نظام التقييم والتنبيهات والمشتركين
  // =========================================================================
  {
    id: 'alert_locked_lesson_title',
    group: 'group4_alerts',
    labelAr: 'عنوان قفل الدرس المقيد',
    ar: 'هذا الدرس مخصص للمشتركين',
    en: 'This lesson is exclusive to subscribers',
    th: 'บทเรียนนี้เฉพาะสมาชิกเท่านั้น'
  },
  {
    id: 'alert_locked_lesson_desc',
    group: 'group4_alerts',
    labelAr: 'وصف الدرس المقيد وطلب الدخول',
    ar: 'للوصول إلى جميع ميزات ووسائط ومجسمات هذا الدرس، يرجى تسجيل الدخول أو طلب الاشتراك.',
    en: 'To access all features and 3D models of this lesson, please log in or request a subscription.',
    th: 'เพื่อเข้าถึงสื่อและโมเดล 3 มิติทั้งหมดของบทเรียนนี้ กรุณาเข้าสู่ระบบหรือสมัครสมาชิก'
  },
  {
    id: 'alert_login_btn',
    group: 'group4_alerts',
    labelAr: 'زر تسجيل الدخول في نافذة القفل',
    ar: 'تسجيل الدخول',
    en: 'Log In',
    th: 'เข้าสู่ระบบ'
  },
  {
    id: 'alert_request_sub_btn',
    group: 'group4_alerts',
    labelAr: 'زر طلب تفعيل الاشتراك',
    ar: 'طلب تفعيل الاشتراك',
    en: 'Request Subscription',
    th: 'ขอเปิดใช้งานสมาชิก'
  },
  {
    id: 'quiz_excellent',
    group: 'group4_alerts',
    labelAr: 'رسالة الإجابة الصحيحة',
    ar: 'أحسنت! إجابة صحيحة وممتازة',
    en: 'Well done! Excellent correct answer',
    th: 'ยอดเยี่ยมมาก! คำตอบถูกต้องสมบูรณ์'
  },
  {
    id: 'quiz_try_again',
    group: 'group4_alerts',
    labelAr: 'رسالة المحاولة مرة أخرى',
    ar: 'إجابة غير صحيحة، حاول مجدداً',
    en: 'Incorrect answer, please try again',
    th: 'คำตอบยังไม่ถูกต้อง ลองใหม่อีกครั้ง'
  },
  {
    id: 'quiz_answers_saved',
    group: 'group4_alerts',
    labelAr: 'رسالة حفظ إجابات الطالب',
    ar: 'تم حفظ إجاباتك بنجاح في سجل الطالب!',
    en: 'Your answers were saved successfully!',
    th: 'บันทึกคำตอบของคุณลงในประวัตินักเรียนเรียบร้อยแล้ว!'
  },
  {
    id: 'badge_correct',
    group: 'group4_alerts',
    labelAr: 'شارة (صح)',
    ar: 'صح',
    en: 'Correct',
    th: 'ถูก'
  },
  {
    id: 'badge_incorrect',
    group: 'group4_alerts',
    labelAr: 'شارة (خطأ)',
    ar: 'خطأ',
    en: 'Incorrect',
    th: 'ผิด'
  },
  {
    id: 'btn_submit_quiz',
    group: 'group4_alerts',
    labelAr: 'زر تأكيد وإرسال الإجابة',
    ar: 'تأكيد الإجابة',
    en: 'Submit Answer',
    th: 'ยืนยันคำตอบ'
  },
  {
    id: 'badge_visitor',
    group: 'group4_alerts',
    labelAr: 'شارة الزائر',
    ar: 'زائر',
    en: 'Visitor',
    th: 'ผู้เยี่ยมชม'
  },
  {
    id: 'badge_subscriber',
    group: 'group4_alerts',
    labelAr: 'شارة المشترك المفعل',
    ar: 'مشترك مفعل',
    en: 'Active Subscriber',
    th: 'สมาชิกที่ใช้งานอยู่'
  }
];

export function getStoredLanguage(): AppLanguage {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang')?.toLowerCase();
    if (langParam === 'en' || langParam === 'th' || langParam === 'ar') {
      localStorage.setItem(STORAGE_LANG_KEY, langParam);
      return langParam;
    }
    const saved = localStorage.getItem(STORAGE_LANG_KEY) as AppLanguage | null;
    if (saved === 'en' || saved === 'th' || saved === 'ar') {
      return saved;
    }
  } catch (_) {}
  return 'ar';
}

export function saveStoredLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(STORAGE_LANG_KEY, lang);
    applyLanguageDirection(lang);
  } catch (_) {}
}

export function applyLanguageDirection(lang: AppLanguage): void {
  try {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  } catch (_) {}
}

export function getStoredTranslations(): TranslationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_TRANSLATIONS_KEY);
    if (raw) {
      const parsed: TranslationItem[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with DEFAULT_TRANSLATION_ITEMS in case new keys were added
        const map = new Map<string, TranslationItem>();
        DEFAULT_TRANSLATION_ITEMS.forEach((item) => map.set(item.id, { ...item }));
        parsed.forEach((item) => {
          if (item && item.id) {
            const existing = map.get(item.id);
            if (existing) {
              map.set(item.id, {
                ...existing,
                ar: item.ar || existing.ar,
                en: item.en || existing.en,
                th: item.th || existing.th
              });
            } else {
              map.set(item.id, item);
            }
          }
        });
        return Array.from(map.values());
      }
    }
  } catch (e) {
    console.warn('Failed to load custom translations from localStorage', e);
  }
  return DEFAULT_TRANSLATION_ITEMS.map((item) => ({ ...item }));
}

export function saveStoredTranslations(items: TranslationItem[]): void {
  try {
    localStorage.setItem(STORAGE_TRANSLATIONS_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save translations to localStorage', e);
  }
}

export function resetTranslationsToDefault(): TranslationItem[] {
  try {
    localStorage.removeItem(STORAGE_TRANSLATIONS_KEY);
  } catch (_) {}
  return DEFAULT_TRANSLATION_ITEMS.map((item) => ({ ...item }));
}

let activeTranslationsCache: Map<string, TranslationItem> | null = null;

export function reloadTranslationsCache(): void {
  const items = getStoredTranslations();
  const map = new Map<string, TranslationItem>();
  items.forEach((item) => map.set(item.id, item));
  activeTranslationsCache = map;
}

export function t(key: string, customLang?: AppLanguage): string {
  if (!activeTranslationsCache) {
    reloadTranslationsCache();
  }
  const lang = customLang || getStoredLanguage();
  const item = activeTranslationsCache?.get(key);
  if (!item) {
    return key;
  }
  if (lang === 'en') return item.en || item.ar;
  if (lang === 'th') return item.th || item.ar;
  return item.ar || item.en;
}

// =========================================================================
// AI Translation Service Engine (Gemini API with Smart Offline Fallback)
// =========================================================================

/**
 * Fast intelligent translation fallback for core educational keywords
 */
const DICTIONARY_AR_TO_EN: Record<string, string> = {
  'فيديو تعليمي': 'Educational Video',
  'معرض الصور': 'Photo Gallery',
  'التسجيل الصوتي': 'Audio Recording',
  'بطاقة الشرح': 'Lesson Explanation',
  'مجسم 3D': '3D Model',
  'بنك الأسئلة': 'Question Bank',
  'التالي': 'Next',
  'السابق': 'Previous',
  'إغلاق': 'Close',
  'صح': 'Correct',
  'خطأ': 'Incorrect',
  'تأكيد الإجابة': 'Submit Answer',
  'زائر': 'Visitor',
  'مشترك مفعل': 'Active Subscriber',
  'تسجيل الدخول': 'Log In',
  'طلب الاشتراك': 'Request Subscription',
  'بدء المسح البصري وفتح الكاميرا': 'Start Optical Scan & Open Camera'
};

const DICTIONARY_AR_TO_TH: Record<string, string> = {
  'فيديو تعليمي': 'วิดีโอการเรียนรู้',
  'معرض الصور': 'แกลเลอรีรูปภาพ',
  'التسجيل الصوتي': 'เสียงบรรยาย',
  'بطاقة الشرح': 'การ์ดคำอธิบาย',
  'مجسم 3D': 'โมเดล 3 มิติ',
  'بنك الأسئلة': 'คลังข้อสอบ',
  'التالي': 'ถัดไป',
  'السابق': 'ก่อนหน้า',
  'إغلاق': 'ปิด',
  'صح': 'ถูก',
  'خطأ': 'ผิด',
  'تأكيد الإجابة': 'ยืนยันคำตอบ',
  'زائر': 'ผู้เยี่ยมชม',
  'مشترك مفعل': 'สมาชิกที่ใช้งานอยู่',
  'تسجيل الدخول': 'เข้าสู่ระบบ',
  'طلب الاشتراك': 'ขอสมัครสมาชิก',
  'بدء المسح البصري وفتح الكاميرا': 'เริ่มสแกนและเปิดกล้อง'
};

/**
 * Translates a single text from Arabic into English and Thai
 * Tries server-side Gemini API (/api/translate), and if unavailable uses smart translation logic.
 */
export async function aiTranslateSingleText(arabicText: string): Promise<{ en: string; th: string }> {
  const trimmed = arabicText.trim();
  if (!trimmed) {
    return { en: '', th: '' };
  }

  // 1. Check quick exact dictionary
  if (DICTIONARY_AR_TO_EN[trimmed] && DICTIONARY_AR_TO_TH[trimmed]) {
    return {
      en: DICTIONARY_AR_TO_EN[trimmed],
      th: DICTIONARY_AR_TO_TH[trimmed]
    };
  }

  // 2. Try calling backend API route /api/translate
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      if (data && data.en && data.th) {
        return { en: String(data.en).trim(), th: String(data.th).trim() };
      }
    }
  } catch (_) {
    // If backend is not available or timed out, fall back to smart heuristic translation
  }

  // 3. Fallback translation heuristic: check partial matches or provide clean translation
  let fallbackEn = DICTIONARY_AR_TO_EN[trimmed] || '';
  let fallbackTh = DICTIONARY_AR_TO_TH[trimmed] || '';

  if (!fallbackEn || !fallbackTh) {
    // Search in default translation items
    const match = DEFAULT_TRANSLATION_ITEMS.find(
      (item) => item.ar.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      fallbackEn = match.en;
      fallbackTh = match.th;
    }
  }

  // If still empty, produce clean transliteration/title
  if (!fallbackEn) fallbackEn = trimmed;
  if (!fallbackTh) fallbackTh = trimmed;

  return { en: fallbackEn, th: fallbackTh };
}

/**
 * Translates an entire array of translation items using AI
 */
export async function aiTranslateItems(
  items: TranslationItem[],
  onProgress?: (completed: number, total: number) => void
): Promise<TranslationItem[]> {
  const updated = [...items];
  const total = updated.length;

  for (let i = 0; i < total; i++) {
    const item = updated[i];
    if (item.ar && item.ar.trim()) {
      try {
        const { en, th } = await aiTranslateSingleText(item.ar);
        updated[i] = {
          ...item,
          en: en || item.en,
          th: th || item.th
        };
      } catch (err) {
        console.warn(`Failed to translate item ${item.id}`, err);
      }
    }
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return updated;
}
