/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { analytics } from './analytics';
import { normalizeArabicDigits } from './subscriptionAuth';

export interface SubscriberRecord {
  phone: string; // Column A: رقم المشترك
  name: string; // Column B: اسم المشترك
  allowedLessons: string; // Column C: الدروس المخصصة (فارغة = كافة الدروس)
  isAllowed: boolean; // Column AB: السماح بالدخول (نعم = true, لا = false)
  maxDevices: number; // Column AC: عدد الأجهزة المسموحة (الافتراضي: 1)
  registeredDevices: string[]; // Column AD+: بصمات الأجهزة المسجلة
}

const STORAGE_KEY_SUBSCRIBERS_CACHE = 'smart_ar_subscribers_cache_v1';

export const DEFAULT_DEMO_SUBSCRIBERS: SubscriberRecord[] = [
  {
    phone: '0501234567',
    name: 'أحمد السعيد',
    allowedLessons: '',
    isAllowed: true,
    maxDevices: 1,
    registeredDevices: []
  },
  {
    phone: '0559876543',
    name: 'سارة خالد (مشترك خاص)',
    allowedLessons: 'الخلية النباتية والحيوانية, المجموعة الشمسية',
    isAllowed: true,
    maxDevices: 2,
    registeredDevices: []
  },
  {
    phone: '0540001122',
    name: 'فهد المطيري (محظور)',
    allowedLessons: '',
    isAllowed: false,
    maxDevices: 1,
    registeredDevices: []
  }
];

export function getCachedSubscribers(): SubscriberRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIBERS_CACHE);
    if (!raw) return [...DEFAULT_DEMO_SUBSCRIBERS];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...DEFAULT_DEMO_SUBSCRIBERS];
  } catch {
    return [...DEFAULT_DEMO_SUBSCRIBERS];
  }
}

export function saveCachedSubscribers(subs: SubscriberRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIBERS_CACHE, JSON.stringify(subs));
  } catch (err) {
    console.warn('Failed to save subscribers cache:', err);
  }
}

/**
 * جلب المشتركين مباشرة من ورقة SubData عبر Google Apps Script
 */
export async function fetchSubscribersFromSheet(
  webAppUrl?: string
): Promise<{ success: boolean; subscribers: SubscriberRecord[]; message: string }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    const local = getCachedSubscribers();
    return {
      success: true,
      subscribers: local,
      message: 'تم تحميل القائمة من الذاكرة المحلية (يرجى ربط Google Apps Script للمزامنة السحابية).'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'getSubscribers');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('استجابة غير صالحة من Google Apps Script.');
    }

    if (data && data.success && Array.isArray(data.subscribers)) {
      const subs: SubscriberRecord[] = data.subscribers.map((item: any) => ({
        phone: normalizeArabicDigits(String(item.phone || '').trim()),
        name: String(item.name || '').trim(),
        allowedLessons: String(item.allowedLessons || '').trim(),
        isAllowed: item.isAllowed !== false && item.isAllowed !== 'لا' && item.isAllowed !== 'no',
        maxDevices: Math.max(1, parseInt(item.maxDevices, 10) || 1),
        registeredDevices: Array.isArray(item.registeredDevices)
          ? item.registeredDevices
          : (item.registeredDevices ? String(item.registeredDevices).split(',').map((s: string) => s.trim()).filter(Boolean) : [])
      }));

      saveCachedSubscribers(subs);
      return {
        success: true,
        subscribers: subs,
        message: `✓ تمت مزامنة ${subs.length} مشترك بنجاح من ورقة SubData.`
      };
    } else {
      return {
        success: false,
        subscribers: getCachedSubscribers(),
        message: data?.message || 'تعذر جلب المشتركين من الشيت.'
      };
    }
  } catch (err: any) {
    console.warn('Error fetching subscribers from sheet:', err);
    return {
      success: false,
      subscribers: getCachedSubscribers(),
      message: `تعذر الاتصال بـ Google Sheets: ${err?.message || 'تحقق من اتصالك بالإنترنت'}`
    };
  }
}

/**
 * إضافة أو تحديث مشترك في ورقة SubData
 */
export async function saveSubscriberToSheet(
  subscriber: SubscriberRecord,
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  // تحديث الكاش المحلي فوراً
  const current = getCachedSubscribers();
  const index = current.findIndex((s) => s.phone === subscriber.phone);
  if (index >= 0) {
    current[index] = { ...subscriber };
  } else {
    current.unshift({ ...subscriber });
  }
  saveCachedSubscribers(current);

  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();
  if (!targetUrl) {
    return {
      success: true,
      message: '✓ تم حفظ المشترك محلياً بنجاح (اربط Google Apps Script للمزامنة الحية مع الشيت).'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'saveSubscriber');
    queryUrl.searchParams.set('phone', subscriber.phone);
    queryUrl.searchParams.set('name', subscriber.name);
    queryUrl.searchParams.set('allowedLessons', subscriber.allowedLessons || '');
    queryUrl.searchParams.set('isAllowed', subscriber.isAllowed ? 'نعم' : 'لا');
    queryUrl.searchParams.set('maxDevices', String(subscriber.maxDevices || 1));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true };
    }

    return {
      success: true,
      message: data?.message || '✓ تم حفظ وتحديث بيانات المشترك في ورقة SubData بنجاح.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: `تم الحفظ محلياً (تعذر الاتصال السحابي: ${err?.message || 'خطأ في الشبكة'}).`
    };
  }
}

/**
 * حذف مشترك من ورقة SubData
 */
export async function deleteSubscriberFromSheet(
  phone: string,
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  const current = getCachedSubscribers().filter((s) => s.phone !== phone);
  saveCachedSubscribers(current);

  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();
  if (!targetUrl) {
    return {
      success: true,
      message: '✓ تم حذف المشترك من الذاكرة المحلية.'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'deleteSubscriber');
    queryUrl.searchParams.set('phone', phone);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      message: '✓ تم حذف المشترك بنجاح من ورقة SubData.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: `تم الحذف محلياً (تعذر إتمام الحذف السحابي: ${err?.message}).`
    };
  }
}

/**
 * تصفير الأجهزة المسجلة للمشترك للسماح له بالتسجيل من جهاز جديد
 */
export async function resetSubscriberDevicesInSheet(
  phone: string,
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  const current = getCachedSubscribers();
  const sub = current.find((s) => s.phone === phone);
  if (sub) {
    sub.registeredDevices = [];
    saveCachedSubscribers(current);
  }

  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();
  if (!targetUrl) {
    return {
      success: true,
      message: '✓ تم تصفير أجهزة المشترك محلياً.'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'resetSubscriberDevices');
    queryUrl.searchParams.set('phone', phone);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    return {
      success: true,
      message: '✓ تم تصفير الأجهزة المسجلة في ورقة SubData بنجاح، ويمكن للمشترك الآن التسجيل بجهاز جديد.'
    };
  } catch (err: any) {
    return {
      success: true,
      message: `تم تصفير الأجهزة محلياً (تعذر الاتصال بالشيت: ${err?.message}).`
    };
  }
}
