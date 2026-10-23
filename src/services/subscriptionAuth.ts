import { analytics } from './analytics';
import { getClientDeviceId } from './deviceFingerprint';
import { getCachedSubscribers, saveCachedSubscribers } from './subscribersManagement';

export interface SubscriberInfo {
  name: string;
  phone: string;
  loginAt: string;
  allowedLessons?: string[]; // قائمة عناوين الدروس المخصصة لهذا المشترك
  isCustomSubscriber?: boolean; // هل هو مشترك خاص بمهام ودروس محددة
  isAllowed?: boolean; // حالة السماح بالدخول
  maxDevices?: number; // عدد الأجهزة المسموحة
  deviceCount?: number; // عدد الأجهزة المسجلة
}

const STORAGE_KEY_SUBSCRIBER = 'smart_ar_active_subscriber';
const STORAGE_KEY_EXTERNAL_URL = 'smart_ar_subscription_external_url';
export const DEFAULT_SUBSCRIPTION_URL =
  'https://wa.me/?text=' +
  encodeURIComponent('مرحباً، أود الاشتراك في منصة الواقع المعزز التعليمية وتفعيل حسابي.');

/**
 * تحويل الأرقام العربية المشرقية (٠-٩) إلى أرقام لاتينية (0-9)
 * بصورة آمنة تماماً ضد أي نوع بيانات (نصوص، أرقام، null)
 */
export function normalizeArabicDigits(input: unknown): string {
  if (input == null) return '';
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let output = String(input);
  for (let i = 0; i < 10; i++) {
    output = output.replace(new RegExp(arabicNumerals[i], 'g'), i.toString());
  }
  return output.trim();
}

const STORAGE_KEY_VISITOR_NAME = 'smart_ar_visitor_name';

/**
 * جلب اسم الزائر المخزن محلياً في المتصفح لاستخدامه في كافة الدروس المفتوحة
 */
export function getStoredVisitorName(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_VISITOR_NAME) || '';
  } catch {
    return '';
  }
}

/**
 * حفظ اسم الزائر في المتصفح ليبقى مسجلاً في الصفحة وكافة الدروس المفتوحة
 */
export function saveStoredVisitorName(name: string): void {
  try {
    const trimmed = String(name || '').trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_VISITOR_NAME, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY_VISITOR_NAME);
    }
  } catch (err) {
    console.warn('تعذر حفظ اسم الزائر:', err);
  }
}

/**
 * تسجيل خروج الزائر ومسح اسمه لإتاحة إدخال اسم جديد
 */
export function clearStoredVisitorName(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_VISITOR_NAME);
  } catch (err) {
    console.warn('تعذر مسح اسم الزائر:', err);
  }
}

/**
 * جلب بيانات المشترك المخزنة محلياً في المتصفح
 */
export function getStoredSubscriber(): SubscriberInfo | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIBER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    return {
      name: String(parsed.name || '').trim(),
      phone: String(parsed.phone || '').trim(),
      loginAt: parsed.loginAt,
      allowedLessons: Array.isArray(parsed.allowedLessons) ? parsed.allowedLessons : undefined,
      isCustomSubscriber: Boolean(parsed.isCustomSubscriber),
      isAllowed: parsed.isAllowed !== false,
      maxDevices: typeof parsed.maxDevices === 'number' ? parsed.maxDevices : 1,
      deviceCount: typeof parsed.deviceCount === 'number' ? parsed.deviceCount : 1
    };
  } catch {
    return null;
  }
}

/**
 * حفظ جلسة المشترك في المتصفح (تسجيل لمرة واحدة)
 */
export function saveStoredSubscriber(sub: SubscriberInfo): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIBER, JSON.stringify(sub));
  } catch (err) {
    console.warn('تعذر حفظ بيانات المشترك في localStorage:', err);
  }
}

/**
 * مسح جلسة المشترك (تسجيل الخروج)
 */
export function clearStoredSubscriber(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_SUBSCRIBER);
  } catch (err) {
    console.warn('تعذر مسح بيانات المشترك:', err);
  }
}

/**
 * رابط الاشتراك الخارجي المخصص (واتساب / متجر / صفحة دفع)
 */
export function getSubscriptionExternalUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY_EXTERNAL_URL) || DEFAULT_SUBSCRIPTION_URL;
  } catch {
    return DEFAULT_SUBSCRIPTION_URL;
  }
}

export function setSubscriptionExternalUrl(url: string): void {
  try {
    const trimmed = String(url || '').trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY_EXTERNAL_URL, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY_EXTERNAL_URL);
    }
  } catch (err) {
    console.warn('تعذر حفظ رابط الاشتراك الخارجي:', err);
  }
}

/**
 * التحقق من المشترك في ورقة SubData عبر Google Apps Script
 * يفحص:
 * 1. صحة الاسم ورقم الهاتف
 * 2. حالة السماح بالدخول في العمود AB (نعم / لا)
 * 3. عدد الأجهزة المسموحة في العمود AC ومطابقة بصمة الجهاز في العمود AD+
 * 4. الدروس المخصصة للمشترك في العمود C
 */
export async function verifySubscriberWithSheet(
  name: unknown,
  phone: unknown,
  webAppUrl?: string
): Promise<{ success: boolean; message: string; subscriber?: SubscriberInfo }> {
  const cleanName = String(name || '').trim();
  const cleanPhone = normalizeArabicDigits(String(phone || '').replace(/[\s\-\(\)]/g, ''));
  const currentDeviceId = getClientDeviceId();

  if (!cleanName || !cleanPhone) {
    return {
      success: false,
      message: 'يرجى إدخال كلٍ من اسم المشترك ورقم الهاتف/المشترك.'
    };
  }

  // 1. حساب تجريبي سريع (123: مشترك مفعل عام)
  if (cleanPhone === '123' || cleanPhone === '000') {
    const demoSub: SubscriberInfo = {
      name: cleanName,
      phone: cleanPhone,
      loginAt: new Date().toISOString(),
      isCustomSubscriber: false,
      allowedLessons: [],
      isAllowed: true,
      maxDevices: 1,
      deviceCount: 1
    };
    saveStoredSubscriber(demoSub);
    return {
      success: true,
      message: '✓ تم تفعيل الاشتراك بنجاح (وضع التجربة السريع: مشترك عام)!',
      subscriber: demoSub
    };
  }

  // 2. حساب تجريبي سريع (999: مشترك خاص بدروس محددة)
  if (cleanPhone === '999') {
    const demoCustomSub: SubscriberInfo = {
      name: cleanName || 'طالب مخصص',
      phone: cleanPhone,
      loginAt: new Date().toISOString(),
      isCustomSubscriber: true,
      allowedLessons: ['الخلية النباتية والحيوانية', 'المجموعة الشمسية', 'درس رقم 1'],
      isAllowed: true,
      maxDevices: 1,
      deviceCount: 1
    };
    saveStoredSubscriber(demoCustomSub);
    return {
      success: true,
      message: '✓ تم تفعيل الاشتراك بنجاح (وضع التجربة السريع: مشترك خاص)!',
      subscriber: demoCustomSub
    };
  }

  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  // 3. التحقق محلياً في الكاش إذا لم يتم ربط رابط Google Apps Script بعد
  if (!targetUrl) {
    const cachedSubs = getCachedSubscribers();
    const foundSub = cachedSubs.find((s) => s.phone === cleanPhone);

    if (foundSub) {
      // فحص الحظر (العمود AB)
      if (!foundSub.isAllowed) {
        return {
          success: false,
          message: '⚠️ عذراً، هذا الحساب موقوف حالياً (تم حظر الدخول: لا). يرجى مراجعة المعلم أو الإدارة.'
        };
      }

      // فحص حد الأجهزة (العمود AC و AD+)
      const registered = foundSub.registeredDevices || [];
      if (!registered.includes(currentDeviceId)) {
        if (registered.length >= (foundSub.maxDevices || 1)) {
          return {
            success: false,
            message: `⚠️ عذراً، لا يمكن الدخول: تم الوصول للحد الأقصى لعدد الأجهزة المسموحة (${foundSub.maxDevices} جهاز). يرجى طلب تصفير الأجهزة من المعلم.`
          };
        }
        // تسجيل الجهاز الجديد
        registered.push(currentDeviceId);
        foundSub.registeredDevices = registered;
        saveCachedSubscribers(cachedSubs);
      }

      const allowedList = foundSub.allowedLessons
        ? foundSub.allowedLessons.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      const isCustom = allowedList.length > 0;

      const confirmedSub: SubscriberInfo = {
        name: foundSub.name || cleanName,
        phone: foundSub.phone,
        loginAt: new Date().toISOString(),
        isCustomSubscriber: isCustom,
        allowedLessons: allowedList,
        isAllowed: true,
        maxDevices: foundSub.maxDevices || 1,
        deviceCount: registered.length
      };

      saveStoredSubscriber(confirmedSub);
      return {
        success: true,
        message: isCustom
          ? `✓ أهلاً بك يا ${confirmedSub.name}! تم تفعيل اشتراكك الخاص (${allowedList.length} دروس مخصصة).`
          : `✓ أهلاً بك يا ${confirmedSub.name}! تم التحقق من الاشتراك بنجاح.`,
        subscriber: confirmedSub
      };
    }

    return {
      success: false,
      message:
        '⚠️ لم يتم العثور على هذا الرقم في ورقة المشتركين. يمكنك تجربة الدخول السريع برقم 123 (مشترك عام) أو 999 (مشترك خاص)، أو ضبط رابط Google Apps Script من لوحة الإدارة.'
    };
  }

  // 4. الاستعلام الحي السحابي عبر Google Apps Script
  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'verifySubscriber');
    queryUrl.searchParams.set('phone', cleanPhone);
    queryUrl.searchParams.set('name', cleanName);
    queryUrl.searchParams.set('deviceId', currentDeviceId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.warn('Google Apps Script response parse issue:', text);
      throw new Error('استجابة غير صالحة من Google Apps Script. تأكد من نشر السكريبت كـ Web App وإعطاء إذن الوصول لـ Anyone.');
    }

    if (data && data.success) {
      const allowedLessonsList: string[] = Array.isArray(data.allowedLessons)
        ? data.allowedLessons
        : (data.allowedLessons ? String(data.allowedLessons).split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      const isCustom = Boolean(data.isCustomSubscriber || (allowedLessonsList.length > 0));

      const confirmedSub: SubscriberInfo = {
        name: String(data.name || cleanName).trim(),
        phone: String(data.phone || cleanPhone).trim(),
        loginAt: new Date().toISOString(),
        isCustomSubscriber: isCustom,
        allowedLessons: allowedLessonsList,
        isAllowed: true,
        maxDevices: parseInt(data.maxDevices, 10) || 1,
        deviceCount: parseInt(data.deviceCount, 10) || 1
      };

      saveStoredSubscriber(confirmedSub);
      return {
        success: true,
        message: isCustom
          ? `✓ أهلاً بك يا ${confirmedSub.name}! تم تفعيل اشتراكك الخاص (${allowedLessonsList.length} دروس مخصصة).`
          : `✓ أهلاً بك يا ${confirmedSub.name}! تم التحقق من الاشتراك بنجاح.`,
        subscriber: confirmedSub
      };
    } else {
      return {
        success: false,
        message:
          data.message ||
          'عذراً، لم يتم العثور على هذا الاسم أو الرقم في ورقة المشتركين (SubData). تأكد من صحة البيانات أو تواصل مع إدارة المنصة للاشتراك.'
      };
    }
  } catch (err: any) {
    console.warn('خطأ أثناء مطابقة المشترك مع Google Sheets:', err);
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'استغرق الاتصال بورقة Google Sheets وقتاً طويلاً. يرجى التحقق من اتصالك بالإنترنت وإعادة المحاولة.'
      };
    }
    return {
      success: false,
      message: `تعذر الاتصال بجدول Google Sheets: ${err?.message || 'تأكد من نشر سكريبت Apps Script كـ Web App للجميع'}`
    };
  }
}
