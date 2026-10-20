import { analytics } from './analytics';

export interface SubscriberInfo {
  name: string;
  phone: string;
  loginAt: string;
}

const STORAGE_KEY_SUBSCRIBER = 'smart_ar_active_subscriber';
const STORAGE_KEY_EXTERNAL_URL = 'smart_ar_subscription_external_url';
export const DEFAULT_SUBSCRIPTION_URL =
  'https://wa.me/?text=' +
  encodeURIComponent('مرحباً، أود الاشتراك في منصة الواقع المعزز التعليمية وتفعيل حسابي.');

/**
 * تحويل الأرقام العربية المشرقية (٠-٩) إلى أرقام لاتينية (0-9)
 */
export function normalizeArabicDigits(input: string): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let output = input;
  for (let i = 0; i < 10; i++) {
    output = output.replace(new RegExp(arabicNumerals[i], 'g'), i.toString());
  }
  return output.trim();
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
      loginAt: parsed.loginAt
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
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY_EXTERNAL_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_EXTERNAL_URL);
    }
  } catch (err) {
    console.warn('تعذر حفظ رابط الاشتراك الخارجي:', err);
  }
}

/**
 * التحقق من المشترك في ورقة SubData عبر Google Apps Script
 * مع آلية التحقق السريع والتخزين المحلي
 */
export async function verifySubscriberWithSheet(
  name: string,
  phone: string,
  webAppUrl?: string
): Promise<{ success: boolean; message: string; subscriber?: SubscriberInfo }> {
  const cleanName = name.trim();
  const cleanPhone = normalizeArabicDigits(phone.trim().replace(/[\s\-\(\)]/g, ''));

  if (!cleanName || !cleanPhone) {
    return {
      success: false,
      message: 'يرجى إدخال كلٍ من اسم المشترك ورقم الهاتف/المشترك.'
    };
  }

  // 1. حساب تجريبي سريع للتطوير والاختبار المحلي الفوري إذا استخدم 123
  if (cleanPhone === '123' || cleanPhone === '000') {
    const demoSub: SubscriberInfo = {
      name: cleanName,
      phone: cleanPhone,
      loginAt: new Date().toISOString()
    };
    saveStoredSubscriber(demoSub);
    return {
      success: true,
      message: '✓ تم تفعيل الاشتراك بنجاح (وضع التجربة السريع)!',
      subscriber: demoSub
    };
  }

  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  // 2. إذا لم يكن رابط Google Apps Script مضافاً في الإعدادات
  if (!targetUrl) {
    return {
      success: false,
      message:
        '⚠️ رابط Google Sheets غير مضبوط في لوحة الإدارة بعد. يمكنك تجربة الدخول السريع برقم 123، أو ضبط الرابط من لوحة الإدارة (تبويب Google Sheets).'
    };
  }

  // 3. الاستعلام السريع عبر Google Apps Script (GET Query parameter) لتفادي قيود CORS
  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'verifySubscriber');
    queryUrl.searchParams.set('phone', cleanPhone);
    queryUrl.searchParams.set('name', cleanName);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000); // مهلة 9 ثوانٍ

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
      const confirmedSub: SubscriberInfo = {
        name: String(data.name || cleanName).trim(),
        phone: String(data.phone || cleanPhone).trim(),
        loginAt: new Date().toISOString()
      };
      saveStoredSubscriber(confirmedSub);
      return {
        success: true,
        message: `✓ أهلاً بك يا ${confirmedSub.name}! تم التحقق من الاشتراك بنجاح.`,
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
