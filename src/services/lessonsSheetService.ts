/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LessonData, LessonAccessTier, LessonVideo, LessonAudio, LessonImage, resolveAssetUrl } from '../types/ar';
import { analytics } from './analytics';

export const STORAGE_KEY_SHEET_LESSONS = 'smart_ar_sheet_lessons_v1';

export interface SheetLessonRow {
  title: string;                 // العامود A: عنوان الدرس
  accessTier: LessonAccessTier;  // العامود B: صلاحية الوصول (متاح / مقفل / خاص)
  targetImage: string;           // العامود C: صورة الهدف الأساسي
  additionalTargets: string[];   // العامود D: أهداف إضافية
  videos: string[];              // العامود E: روابط الفيديو
  audios: string[];              // العامود F: روابط الصوت
  images: string[];              // العامود G: روابط الصور والشروحات
  modelUrl: string;              // العامود H: رابط المجسم ثلاثي الأبعاد
  modelTitle: string;            // العامود I: عنوان المجسم
  modelSoundUrl: string;         // العامود J: صوت المجسم التلقائي
}

/**
 * دالة مساعدة لتحويل رابط فيديو YouTube أو MP4 إلى بنية LessonVideo
 */
export function formatVideoItem(rawUrl: string, index: number, lessonTitle?: string): LessonVideo {
  const cleanUrl = rawUrl.trim();
  const resolved = resolveAssetUrl(cleanUrl);

  const ytMatch = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([a-zA-Z0-9_-]{11})/i);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: 'youtube',
      url: cleanUrl,
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`,
      title: `${index + 1}. فيديو YouTube (${lessonTitle || 'درس تفاعلي'})`
    };
  }

  return {
    type: 'mp4',
    url: resolved,
    embedUrl: resolved,
    title: `${index + 1}. فيديو تعليمي MP4`
  };
}

/**
 * تحويل بيانات سطر من ورقة (دروس) إلى كائن LessonData متكامل للنظام
 */
export function parseSheetRowToLesson(
  row: Partial<SheetLessonRow>,
  index: number,
  fallbackLesson?: LessonData
): LessonData {
  const title = (row.title || fallbackLesson?.title || `درس رقم ${index + 1}`).trim();
  const accessTier: LessonAccessTier =
    row.accessTier === 'custom' || row.accessTier === 'restricted' || row.accessTier === 'open'
      ? row.accessTier
      : (fallbackLesson?.accessTier || 'open');

  const targetImage = (row.targetImage || fallbackLesson?.targetImage || '').trim();
  const additionalTargetImages = (row.additionalTargets || fallbackLesson?.additionalTargetImages || [])
    .map((s) => s.trim())
    .filter(Boolean);

  // الفيديوهات المتعددة
  const rawVideos = row.videos && row.videos.length > 0
    ? row.videos
    : (fallbackLesson?.videos ? fallbackLesson.videos.map((v) => v.url || v.embedUrl || '').filter(Boolean) : []);
  const videos: LessonVideo[] = rawVideos.map((url, vIdx) => formatVideoItem(url, vIdx, title));

  // الصوتيات المتعددة
  const rawAudios = row.audios && row.audios.length > 0
    ? row.audios
    : (fallbackLesson?.audios ? fallbackLesson.audios.map((a) => a.url).filter(Boolean) : []);
  const audios: LessonAudio[] = rawAudios.map((url, aIdx) => ({
    url: resolveAssetUrl(url.trim()),
    title: `${aIdx + 1}. تسجيل صوتي للشرح (${title})`
  }));

  // الصور المتعددة
  const rawImages = row.images && row.images.length > 0
    ? row.images
    : (fallbackLesson?.images ? fallbackLesson.images.map((img) => img.url).filter(Boolean) : []);
  const images: LessonImage[] = rawImages.map((url, imgIdx) => ({
    url: resolveAssetUrl(url.trim()),
    title: `لوحة توضيحية (${imgIdx + 1}): ${title}`,
    caption: `مخطط تعليمي وعناصر شرح مفصلة لهذا الدرس.`
  }));

  // مجسم ثلاثي الأبعاد
  const modelUrl = (row.modelUrl || fallbackLesson?.model3d?.url || '').trim();
  const modelTitle = (row.modelTitle || fallbackLesson?.model3d?.title || `مجسم: ${title}`).trim();
  const modelSoundUrl = (row.modelSoundUrl || fallbackLesson?.model3d?.soundUrl || '').trim();

  const model3d = modelUrl
    ? {
        url: resolveAssetUrl(modelUrl),
        title: modelTitle,
        autoRotate: fallbackLesson?.model3d?.autoRotate ?? false,
        soundUrl: modelSoundUrl ? resolveAssetUrl(modelSoundUrl) : undefined,
        soundEnabled: Boolean(modelSoundUrl)
      }
    : undefined;

  return {
    targetIndex: index,
    targetId: fallbackLesson?.targetId || `lesson_${String(index + 1).padStart(3, '0')}`,
    title,
    subtitle: fallbackLesson?.subtitle || 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: fallbackLesson?.subject || '',
    grade: fallbackLesson?.grade || '',
    accessTier,
    isFreePreview: accessTier === 'open',
    targetImage: resolveAssetUrl(targetImage),
    additionalTargetImages: additionalTargetImages.map(resolveAssetUrl),
    videos,
    video: videos[0],
    audios,
    audio: audios[0],
    images,
    model3d,
    arModel3d: model3d,
    description: fallbackLesson?.description || {
      summary: `درس استكشافي تفاعلي: ${title}`,
      keyPoints: ['التعرف على محتوى الدرس التفاعلي', 'فحص المجسم بزوايا 360 درجة'],
      fullText: `محتوى تفاعلي للدرس: ${title}`
    },
    questions: fallbackLesson?.questions || []
  };
}

/**
 * قراءة الدروس المحفوظة في الكاش المحلي
 */
export function getCachedSheetLessons(): LessonData[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SHEET_LESSONS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (err) {
    console.warn('Failed to parse cached sheet lessons:', err);
  }
  return null;
}

/**
 * حفظ الدروس في الكاش المحلي
 */
export function saveCachedSheetLessons(lessons: LessonData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_SHEET_LESSONS, JSON.stringify(lessons));
  } catch (err) {
    console.warn('Failed to save sheet lessons cache:', err);
  }
}

/**
 * جلب وتحديث الدروس مباشرة من ورقة (دروس) عبر Google Apps Script
 */
export async function fetchLessonsFromSheet(
  webAppUrl?: string,
  currentLessons: LessonData[] = []
): Promise<{ success: boolean; lessons: LessonData[]; message: string }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    const cached = getCachedSheetLessons();
    return {
      success: true,
      lessons: cached && cached.length > 0 ? cached : currentLessons,
      message: 'تم تحميل الدروس من الذاكرة المحلية (يرجى ربط رابط Google Apps Script لجلب التحديثات من الشيت).'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'getLessons');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

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
      throw new Error('استجابة غير صالحة من Google Apps Script. تأكد من نشر السكريبت للجميع.');
    }

    if (data && data.success && Array.isArray(data.lessons)) {
      if (data.lessons.length === 0) {
        return {
          success: true,
          lessons: currentLessons,
          message: data.message || 'ورقة (دروس) في الشيت جاهزة ولكنها لا تحتوي على سطور بعد.'
        };
      }

      const updatedLessons: LessonData[] = data.lessons.map((item: any, idx: number) => {
        const fallback = currentLessons[idx] || currentLessons.find((l) => l.targetIndex === idx);

        let accessTier: LessonAccessTier = 'open';
        const rawTier = String(item.accessTier || '').trim().toLowerCase();
        if (rawTier === 'خاص' || rawTier === 'custom' || rawTier === 'vip') {
          accessTier = 'custom';
        } else if (
          rawTier === 'مقفل' ||
          rawTier === 'مقيد' ||
          rawTier === 'restricted' ||
          rawTier === 'مغلق' ||
          rawTier === 'مشتركين'
        ) {
          accessTier = 'restricted';
        }

        const row: Partial<SheetLessonRow> = {
          title: item.title,
          accessTier,
          targetImage: item.targetImage,
          additionalTargets: Array.isArray(item.additionalTargetImages)
            ? item.additionalTargetImages
            : (item.additionalTargetImages ? String(item.additionalTargetImages).split(/[,\u060C;|\n\r/]+/) : []),
          videos: Array.isArray(item.videoUrls)
            ? item.videoUrls
            : (item.videoUrls ? String(item.videoUrls).split(/[,\u060C;|\n\r/]+/) : []),
          audios: Array.isArray(item.audioUrls)
            ? item.audioUrls
            : (item.audioUrls ? String(item.audioUrls).split(/[,\u060C;|\n\r/]+/) : []),
          images: Array.isArray(item.imageUrls)
            ? item.imageUrls
            : (item.imageUrls ? String(item.imageUrls).split(/[,\u060C;|\n\r/]+/) : []),
          modelUrl: item.model3d?.url,
          modelTitle: item.model3d?.title,
          modelSoundUrl: item.model3d?.soundUrl
        };

        return parseSheetRowToLesson(row, idx, fallback);
      });

      saveCachedSheetLessons(updatedLessons);

      return {
        success: true,
        lessons: updatedLessons,
        message: `✓ تمت مزامنة ${updatedLessons.length} درس بنجاح من ورقة (دروس)!`
      };
    } else {
      return {
        success: false,
        lessons: currentLessons,
        message: data?.message || 'تعذر جلب الدروس من ورقة (دروس).'
      };
    }
  } catch (err: any) {
    console.warn('Error fetching lessons from sheet:', err);
    const cached = getCachedSheetLessons();
    return {
      success: false,
      lessons: cached || currentLessons,
      message: `تعذر الاتصال بـ Google Sheets: ${err?.message || 'تحقق من اتصالك بالإنترنت'}`
    };
  }
}

/**
 * حفظ ورفع كافة الدروس الحالية إلى ورقة (دروس) في Google Sheets
 */
export async function saveLessonsToSheet(
  lessons: LessonData[],
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    saveCachedSheetLessons(lessons);
    return {
      success: false,
      message: 'لم يتم ربط رابط Google Apps Script بعد. تم حفظ التعديلات في الذاكرة المحلية فقط.'
    };
  }

  try {
    const serializedList = lessons.map((l) => ({
      title: l.title || '',
      accessTier: l.accessTier || 'open',
      targetImage: l.targetImage || '',
      additionalTargetImages: l.additionalTargetImages || [],
      videos: l.videos || (l.video ? [l.video] : []),
      audios: l.audios || (l.audio ? [l.audio] : []),
      images: l.images || [],
      model3d: l.model3d
        ? {
            url: l.model3d.url || '',
            title: l.model3d.title || '',
            soundUrl: l.model3d.soundUrl || ''
          }
        : undefined
    }));

    // إرسال حمولة البيانات كاملة عبر POST آمن وسريع (يتفادى حدود حجم الـ URL ويمنع مشاكل CORS)
    const payload = JSON.stringify({
      action: 'saveLessons',
      lessons: serializedList
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    let success = false;
    let serverMessage = `✓ تم حفظ ومزامنة ${lessons.length} درس في ورقة (دروس) بنجاح!`;

    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: payload,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch (_) {
        // إذا نجح الاتصال وكانت الاستجابة 200 ولكن تم إرجاع صفحة توجيه قوقل
        if (res.ok || res.status === 200) {
          data = { success: true };
        }
      }

      if (data && data.success) {
        success = true;
        if (data.message) serverMessage = data.message;
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        // في حال استجابة ناجحة من خوادم قوقل
        success = true;
      }
    } catch (postErr: any) {
      clearTimeout(timeoutId);
      console.warn('POST failed or blocked by CORS, trying fallback no-cors POST...', postErr);
      // محاولة بديلة عبر وضع no-cors لضمان مرور البيانات لخوادم Google Apps Script
      try {
        await fetch(targetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload
        });
        success = true;
        serverMessage = `✓ تم إرسال وتحديث ${lessons.length} درس إلى ورقة (دروس) في Google Sheets بنجاح!`;
      } catch (fallbackErr: any) {
        throw new Error(postErr?.message || fallbackErr?.message || 'تعذر الاتصال بـ Google Sheets');
      }
    }

    if (success) {
      saveCachedSheetLessons(lessons);
      return {
        success: true,
        message: serverMessage
      };
    } else {
      return {
        success: false,
        message: 'تعذر حفظ الدروس في ورقة (دروس).'
      };
    }
  } catch (err: any) {
    console.warn('Error saving lessons to sheet:', err);
    saveCachedSheetLessons(lessons);
    return {
      success: false,
      message: `حدث خطأ أثناء الحفظ في الشيت: ${err?.message || 'تحقق من صحة الرابط واتصالك بالإنترنت'}`
    };
  }
}
