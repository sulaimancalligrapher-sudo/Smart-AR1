export type VideoSourceType = 'youtube' | 'vimeo' | 'mp4' | 'gdrive' | 'custom';

export interface LessonVideo {
  type?: VideoSourceType;
  url: string;
  embedUrl?: string;
  title: string;
  duration?: string;
}

export interface LessonImage {
  url: string;
  title: string;
  caption: string;
}

export type AudioSourceType = 'audio' | 'youtube' | 'soundcloud' | 'gdrive' | 'custom';

export interface LessonAudio {
  url: string;
  title: string;
  duration?: string;
  type?: AudioSourceType;
  embedUrl?: string;
}

export type QuestionType = 'multiple_choice' | 'text_answer';

export interface LessonQuestion {
  id: string;
  type: QuestionType; // 'multiple_choice' أو 'text_answer'
  question: string;
  imageUrl?: string; // رابط صورة السؤال الاختيارية (العمود B, F, J في ورقة Questions-AR)
  options?: string[]; // لأسئلة الاختيار من متعدد
  correctIndex?: number; // رقم الإجابة الصحيحة (0, 1, 2, 3...)
  correctAnswerText?: string; // الإجابة النموذجية أو المفتاحية للسؤال النصي (إذا تُرِكَت فارغة تصبح إجابة حرة)
  isFreeText?: boolean; // هل السؤال إجابة حرة؟
  explanation?: string; // تفسير وتعزيز الإجابة
  points?: number; // نقاط أو درجات السؤال
}

/**
 * فحص هل الدرس يحتوي على أسئلة فعلية لعرض زر الأسئلة للطالب (إذا لم توجد أسئلة يُخفى الزر)
 */
export function hasLessonQuestions(lesson?: LessonData | null): boolean {
  if (!lesson) return false;
  if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
    return lesson.questions.some((q) => q && q.question && q.question.trim().length > 0);
  }
  if (lesson.description?.quiz?.question && lesson.description.quiz.question.trim().length > 0) {
    return true;
  }
  return false;
}

export interface StudentSubmission {
  id: string;
  studentName: string;
  studentPhone: string;
  lessonId: string;
  lessonTitle: string;
  questionId: string;
  questionText: string;
  questionType: QuestionType;
  studentAnswer: string;
  isCorrect?: boolean;
  score?: number;
  submittedAt: string;
  syncedToSheets?: boolean;
}

/**
 * سجل إجابات الطالب في النظام المعتمد لورقة Answers-AR
 * العمود A: تاريخ ووقت التسجيل (YYYY-MM-DD HH:mm:ss)
 * العمود B: رقم الطالب (أو فارغ)
 * العمود C: اسم المستخدم (اسم الطالب أو المشترك)
 * العمود D: موضوع الحصة
 * العمود E وما بعده: إجابات الأسئلة (صح / خطأ / النص الحر نفسه / فارغ)
 */
export interface SystemAnswerRecord {
  id: string;
  timestamp: string;          // العمود A: تاريخ ووقت التسجيل
  studentPhone: string;       // العمود B: رقم الطالب (أو فارغ للزائر)
  studentName: string;        // العمود C: اسم المستخدم (اسم المشترك أو الزائر)
  lessonTitle: string;        // العمود D: موضوع الحصة
  answerColumns: string[];    // العمود E وما بعده: إجابات الأسئلة
  syncedToSheet?: boolean;    // هل تم إرسالها وحفظها في Google Sheets
  syncedAt?: string;          // وقت اكتمال المزامنة
  device?: string;            // نوع الجهاز: هاتف جوال، تابلت، أو كمبيوتر
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonDescription {
  summary: string;
  keyPoints: string[];
  fullText: string;
  funFact?: string;
  quiz?: LessonQuiz;
}

export interface LessonModel3D {
  url: string;
  title?: string;
  autoRotate?: boolean;
  soundUrl?: string; // رابط ملف صوتي مخصص للمجسم يعمل تلقائياً مع ظهوره
  soundEnabled?: boolean; // تفعيل أو كتم الصوت التلقائي (افتراضياً مفعّل إذا وُجد رابط)
}

import type { SubscriberInfo } from '../services/subscriptionAuth';

export type LessonAccessTier = 'open' | 'restricted' | 'custom';

export interface LessonData {
  targetIndex: number;
  additionalTargetIndices?: number[]; // فهارس صفحات وأهداف إضافية لنفس الدرس في targets.mind
  additionalTargetImages?: string[]; // روابط أو مسارات صور الصفحات الإضافية لنفس الدرس
  targetId: string;
  title: string;
  subtitle: string;
  subject: string;
  grade: string;
  targetImage: string;
  video?: LessonVideo;
  videos?: LessonVideo[]; // قائمة الفيديوهات المتعددة للدرس الواحد
  images: LessonImage[];
  audio?: LessonAudio;
  audios?: LessonAudio[]; // قائمة التسجيلات الصوتية المتعددة للدرس الواحد
  description: LessonDescription;
  model3d?: LessonModel3D;
  arModel3d?: LessonModel3D; // مجسم مخصص اختياري للواقع المعزز (AR) - إذا لم يُحدد يستخدم model3d تلقائياً
  isFreePreview?: boolean; // هل الدرس متاح للتجربة المجانية بدون تسجيل دخول؟ (true = مجاني، false = للمشتركين فقط)
  accessTier?: LessonAccessTier; // 'open' (متاح للجميع) | 'restricted' (مقيد للمشتركين) | 'custom' (خاص بمشتركين محددين VIP)
  questions?: LessonQuestion[]; // بنك الأسئلة المتعددة للدرس الواحد
}

/**
 * تحديد مستوى صلاحية الوصول للدرس:
 * - 'open': متاح مجاناً للجميع (زائر، مشترك، مشترك خاص)
 * - 'restricted': مقيد للمشتركين (يراه المشترك والمشترك الخاص، ومحجوب عن الزائر)
 * - 'custom': خاص وحصري (محجوب عن الزائر والمشترك العادي، يراه فقط المشترك الخاص المخصص له هذا الدرس)
 */
export function getLessonAccessTier(lesson?: LessonData | null): LessonAccessTier {
  if (!lesson) return 'open';
  if (lesson.accessTier === 'custom') return 'custom';
  if (lesson.accessTier === 'restricted') return 'restricted';
  if (lesson.accessTier === 'open') return 'open';

  // التوافق مع الخاصية السابقة isFreePreview
  if (lesson.isFreePreview === true || (lesson.isFreePreview as any) === 'true') {
    return 'open';
  }
  if (lesson.isFreePreview === false || (lesson.isFreePreview as any) === 'false') {
    return 'restricted';
  }

  // في حال لم يتم تحديد القيمة: الدرس الأول (Target #0) متاح مجاناً، وجميع الدروس التالية مقفلة
  const pIdx = typeof lesson.targetIndex === 'number' ? lesson.targetIndex : 0;
  return pIdx > 0 ? 'restricted' : 'open';
}

/**
 * دالة معيارية لفحص هل الدرس مقفل ومقيد (سواء مقيد عام أو خاص) أم متاح مجاناً للجميع
 */
export function isLessonRestricted(lesson?: LessonData | null): boolean {
  return getLessonAccessTier(lesson) !== 'open';
}

/**
 * هل الدرس مصنف كـ "خاص" بمشتركين محددين (VIP)؟
 */
export function isLessonCustom(lesson?: LessonData | null): boolean {
  return getLessonAccessTier(lesson) === 'custom';
}

export interface LessonAccessResult {
  allowed: boolean;
  tier: LessonAccessTier;
  reason?: 'open' | 'subscriber_granted' | 'custom_granted' | 'visitor_blocked' | 'subscriber_blocked_custom_only' | 'custom_not_assigned';
  message?: string;
}

/**
 * دالة مساعدة لمعايرة وتوحيد النصوص العربية للتطابق الدقيق والمرن:
 * - إزالة علامات التشكيل والتنوين
 * - توحيد أشكال الألف (أ، إ، آ -> ا)
 * - توحيد التاء المربوطة والهاء (ة -> ه)
 * - توحيد الياء والألف المقصورة (ى -> ي)
 * - تحويل الأرقام العربية والفارسية إلى أرقام لاتينية (١، ۲ -> 1, 2)
 * - إزالة المسافات المتكررة
 */
export function normalizeArabicText(str?: string | null): string {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآا]/g, 'ا')
    .replace(/[ة]/g, 'ه')
    .replace(/[ى]/g, 'ي')
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/\s+/g, ' ');
}

/**
 * فحص صلاحية وصول المستخدم (زائر / مشترك عادي / مشترك خاص) لدرس معين:
 * 1. الدرس المتاح: مفتوح للجميع (زائر، مشترك، مشترك خاص)
 * 2. الدرس المقيد: مفتوح للمشترك العادي والمشترك الخاص، ومحجوب عن الزائر
 * 3. الدرس الخاص: محجوب عن الزائر ومحجوب عن المشترك العادي! يفتح فقط للمشترك الخاص المخصص له هذا الدرس في SubData
 */
export function checkLessonAccess(
  lesson?: LessonData | null,
  subscriber?: SubscriberInfo | null
): LessonAccessResult {
  if (!lesson) {
    return { allowed: true, tier: 'open', reason: 'open' };
  }

  const tier = getLessonAccessTier(lesson);

  // 1. متاح للجميع:
  if (tier === 'open') {
    return { allowed: true, tier: 'open', reason: 'open' };
  }

  // 2. إذا لم يكن هناك اشتراك (وضع الزائر):
  if (!subscriber) {
    return {
      allowed: false,
      tier,
      reason: 'visitor_blocked',
      message: tier === 'custom'
        ? 'هذا الدرس مخصص حصرياً للمشتركين الخاصين (VIP). يرجى تسجيل الدخول بحساب المشترك الخاص.'
        : 'هذا الدرس مقيد للمشتركين. يرجى تسجيل الدخول أو الاشتراك للاطلاع عليه.'
    };
  }

  // 3. إذا كان الدرس مقيداً للمشتركين (Restricted):
  if (tier === 'restricted') {
    // المشترك العادي والمشترك الخاص كلاهما مسموح لهما بالدخول للدروس المقيدة العامة
    return {
      allowed: true,
      tier: 'restricted',
      reason: subscriber.isCustomSubscriber ? 'custom_granted' : 'subscriber_granted'
    };
  }

  // 4. إذا كان الدرس خاصاً (Custom):
  // فحص هل المستخدم مصنف كمشترك خاص (إما بعلامة isCustomSubscriber أو بوجود دروس مخصصة في حسابه)
  const allowedList = (subscriber.allowedLessons || [])
    .map((s) => String(s).trim())
    .filter(Boolean);
  const isCustomUser = Boolean(subscriber.isCustomSubscriber || allowedList.length > 0);

  if (!isCustomUser) {
    return {
      allowed: false,
      tier: 'custom',
      reason: 'subscriber_blocked_custom_only',
      message: 'هذا المحتوى خاص وحصري لمشتركين معينين (مشترك خاص). حسابك مشترك عام ولا يشمل هذا الدرس.'
    };
  }

  // إذا كان مشتركاً خاصاً ولديه تفويض لكافة الدروس (أو القائمة فارغة تعني الكل للمشترك الخاص):
  if (allowedList.length === 0) {
    return {
      allowed: true,
      tier: 'custom',
      reason: 'custom_granted'
    };
  }

  // نتحقق بمرونة فائقة هل الدرس الحالي مصرح له:
  const rawLessonTitle = (lesson.title || '').trim();
  const normTitle = normalizeArabicText(rawLessonTitle);
  const rawTargetId = (lesson.targetId || '').trim();
  const normTargetId = normalizeArabicText(rawTargetId);

  const tIndex0 = typeof lesson.targetIndex === 'number' ? lesson.targetIndex : 0;
  const tIndex1 = tIndex0 + 1; // الترقيم الإنساني (1-based)
  const additionalIndices = Array.isArray(lesson.additionalTargetIndices)
    ? lesson.additionalTargetIndices
    : [];

  const isMatched = allowedList.some((item) => {
    const rawItem = String(item || '').trim();
    if (!rawItem) return false;
    const normItem = normalizeArabicText(rawItem);

    // 1. رمز الكل والشمولية
    if (
      normItem === '*' ||
      normItem === 'الكل' ||
      normItem === 'all' ||
      normItem === 'جميع الدروس' ||
      normItem === 'كل الدروس'
    ) {
      return true;
    }

    // 2. التطابق التام أو المعاير مع عنوان الدرس
    if (rawItem === rawLessonTitle || normItem === normTitle) {
      return true;
    }

    // 3. التطابق الجزئي (إذا كتب المعلم جزءاً من العنوان، مثلاً: "الديواني" أو "النسخ" أو "الرقعة")
    if (normItem.length >= 2 && normTitle.length >= 2) {
      if (normTitle.includes(normItem) || normItem.includes(normTitle)) {
        return true;
      }
    }

    // 4. التطابق مع معرف الهدف (targetId مثل lesson_001)
    if (rawItem === rawTargetId || normItem === normTargetId) {
      return true;
    }

    // 5. التطابق مع رقم الدرس أو فهرس الهدف (1-based أو 0-based)
    if (normItem === String(tIndex1) || normItem === String(tIndex0)) {
      return true;
    }
    if (additionalIndices.map(String).includes(normItem)) {
      return true;
    }

    // 6. استخراج الأرقام من نصوص مثل "درس 1" أو "الدرس 2" أو "Target #3"
    const digitMatch = normItem.match(/\d+/);
    if (digitMatch) {
      const parsedNum = parseInt(digitMatch[0], 10);
      if (
        parsedNum === tIndex1 ||
        parsedNum === tIndex0 ||
        additionalIndices.includes(parsedNum)
      ) {
        return true;
      }
    }

    return false;
  });

  if (isMatched) {
    return {
      allowed: true,
      tier: 'custom',
      reason: 'custom_granted'
    };
  }

  return {
    allowed: false,
    tier: 'custom',
    reason: 'custom_not_assigned',
    message: 'هذا الدرس خاص ولم يُخصص لحسابك بعد. يرجى مراجعة المعلم لإضافته إلى دروسك المعتمدة.'
  };
}

/**
 * دالة ذكية لمعالجة وتصحيح روابط الوسائط (الصوت والفيديو والمجسمات)
 * 1. تحويل روابط GitHub من نمط صفحة العرض (blob/main/...) إلى الرابط المباشر الخام raw.githubusercontent.com
 * 2. معالجة المسارات النسبية لتتوافق مع بيئة النشر (GitHub Pages / النطاقات الفرعية) عبر BASE_URL
 * 3. تنظيف الرابط من علامات التنصيص والمسافات الزائدة
 */
export function resolveAssetUrl(rawUrl?: string | null): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim().replace(/^["']|["']$/g, '');

  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // 1. تحويل روابط Google Drive إلى روابط عرض مباشرة عبر CDN (lh3.googleusercontent.com)
  const gDriveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|docs\.google\.com\/file\/d\/)([a-zA-Z0-9_-]+)/i);
  if (gDriveMatch && gDriveMatch[1]) {
    const fileId = gDriveMatch[1];
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  // 2. تحويل روابط Dropbox إلى روابط وسائط خام مباشرة
  if (url.includes('dropbox.com')) {
    if (url.includes('?dl=0') || url.includes('&dl=0')) {
      url = url.replace(/([?&])dl=0/g, '$1raw=1');
    } else if (!url.includes('raw=1')) {
      url += (url.includes('?') ? '&' : '?') + 'raw=1';
    }
    return url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  // 3. تحويل روابط GitHub من صفحات العرض (blob) إلى المحتوى الخام المباشر للتشغيل
  const ghBlobMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/i);
  if (ghBlobMatch) {
    const [, owner, repo, branch, path] = ghBlobMatch;
    url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // 4. معالجة المسارات النسبية المحلية مع BASE_URL
  if (url.startsWith('/') && !url.startsWith('//')) {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    url = `${cleanBase}${url}`;
  } else if (url.startsWith('./')) {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    url = `${cleanBase}${url.slice(2)}`;
  }

  return url;
}

/**
 * استخراج قائمة جميع الفيديوهات للدرس (يدعم الفيديوهات المتعددة أو المفردة القديمة)
 * يضمن عدم إعادة إحياء الفيديوهات المحذوفة إذا كانت المصفوفة فارغة عمداً!
 */
export function getLessonVideos(lesson?: LessonData | null): LessonVideo[] {
  if (!lesson) return [];
  // إذا كانت مصفوفة الفيديوهات معرفة (حتى لو كانت فارغة لأن المعلم حذف جميع الفيديوهات)، نحترم رغبة المستخدم
  if (Array.isArray(lesson.videos)) {
    return lesson.videos
      .filter((v) => v && (v.url?.trim() || v.embedUrl?.trim()))
      .map((v) => ({
        ...v,
        url: resolveAssetUrl(v.url),
        embedUrl: v.embedUrl ? resolveAssetUrl(v.embedUrl) : v.embedUrl
      }));
  }
  // التوافق القديم فقط إذا لم تكن خاصية videos موجودة كـ مصفوفة
  if (lesson.video?.url?.trim() || lesson.video?.embedUrl?.trim()) {
    return [{
      ...lesson.video,
      url: resolveAssetUrl(lesson.video.url),
      embedUrl: lesson.video.embedUrl ? resolveAssetUrl(lesson.video.embedUrl) : lesson.video.embedUrl
    }];
  }
  return [];
}

/**
 * استخراج قائمة جميع التسجيلات الصوتية للدرس (يدعم الصوتيات المتعددة أو المفردة القديمة)
 * يضمن عدم إعادة إحياء الصوتيات المحذوفة إذا كانت المصفوفة فارغة عمداً!
 */
export function getLessonAudios(lesson?: LessonData | null): LessonAudio[] {
  if (!lesson) return [];
  // إذا كانت مصفوفة الصوتيات معرفة (حتى لو كانت فارغة لأن المعلم حذف جميع الصوتيات)، نحترم رغبة المستخدم
  if (Array.isArray(lesson.audios)) {
    return lesson.audios
      .filter((a) => a && a.url?.trim())
      .map((a) => ({
        ...a,
        url: resolveAssetUrl(a.url),
        embedUrl: a.embedUrl ? resolveAssetUrl(a.embedUrl) : a.embedUrl
      }));
  }
  // التوافق القديم فقط إذا لم تكن خاصية audios موجودة كـ مصفوفة
  if (lesson.audio?.url?.trim()) {
    return [{
      ...lesson.audio,
      url: resolveAssetUrl(lesson.audio.url),
      embedUrl: lesson.audio.embedUrl ? resolveAssetUrl(lesson.audio.embedUrl) : lesson.audio.embedUrl
    }];
  }
  return [];
}

/**
 * استخراج بنك أسئلة الدرس (يدعم بنك الأسئلة المتعدد الجديد والسؤال الفردي القديم)
 */
export function getLessonQuestions(lesson?: LessonData | null): LessonQuestion[] {
  if (!lesson) return [];
  if (Array.isArray(lesson.questions) && lesson.questions.length > 0) {
    return lesson.questions.filter((q) => q && q.question?.trim());
  }
  // التوافق القديم إذا وجد سؤال في description.quiz
  if (lesson.description?.quiz?.question?.trim()) {
    return [{
      id: `${lesson.targetId || 'q'}_default_1`,
      type: 'multiple_choice',
      question: lesson.description.quiz.question,
      options: Array.isArray(lesson.description.quiz.options) && lesson.description.quiz.options.length > 0
        ? lesson.description.quiz.options
        : ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4'],
      correctIndex: lesson.description.quiz.correctIndex ?? 0,
      explanation: lesson.description.quiz.explanation || '',
      points: 1
    }];
  }
  return [];
}

/**
 * تطبيع وفحص روابط الفيديو من يوتيوب، فيميو، جوجل درايف، جيت هب، أو الروابط المباشرة والمخصصة
 */
export function normalizeVideoData(rawUrl: string, title?: string): LessonVideo {
  const url = resolveAssetUrl(rawUrl);
  let embedUrl = url;
  let type: VideoSourceType = 'mp4';

  if (!url) {
    return { type: 'mp4', url: '', embedUrl: '', title: title || 'فيديو تعليمي' };
  }

  // 1. YouTube (standard watch?v=, short youtu.be, or shorts)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
    type = 'youtube';
  } else if (url.includes('vimeo.com')) {
    const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
      type = 'vimeo';
    }
  } else if (url.includes('drive.google.com')) {
    const gdriveMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (gdriveMatch && gdriveMatch[1]) {
      embedUrl = `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
      type = 'gdrive';
    }
  } else if (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.mov') ||
    url.endsWith('.m4v') ||
    url.includes('/gtv-videos-bucket/') ||
    url.includes('raw.githubusercontent.com')
  ) {
    type = 'mp4';
    embedUrl = url;
  } else {
    type = 'custom';
    embedUrl = url;
  }

  return {
    type,
    url,
    embedUrl,
    title: title || 'فيديو تعليمي تفاعلي'
  };
}

/**
 * تطبيع وفحص روابط الصوت: ملفات مباشرة، جوجل درايف، يوتيوب، ساوندكلاود، جيت هب، أو روابط مخصصة
 */
export function normalizeAudioData(rawUrl: string, title?: string): LessonAudio {
  const url = resolveAssetUrl(rawUrl);
  let type: AudioSourceType = 'audio';
  let embedUrl: string | undefined = undefined;
  let streamUrl = url;

  if (!url) {
    return { url: '', title: title || 'تسجيل صوتي', type: 'audio' };
  }

  // Google Drive
  const gdriveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch && gdriveMatch[1]) {
    streamUrl = `https://drive.google.com/uc?export=download&id=${gdriveMatch[1]}`;
    embedUrl = `https://drive.google.com/file/d/${gdriveMatch[1]}/preview`;
    type = 'gdrive';
  } else if (url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)) {
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch && ytMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
      type = 'youtube';
    }
  } else if (url.includes('soundcloud.com')) {
    type = 'soundcloud';
    embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=true`;
  }

  return {
    url: streamUrl,
    embedUrl,
    title: title || 'تسجيل صوتي تعليمي',
    type
  };
}

/**
 * دالة ذكية لإرجاع ملف الصوت المخصص للمجسم:
 * تفحص حصراً صوت المجسم المخصص للـ AR أو المجسم المشترك 3D Model.
 * لا يتم استخدام صوت الدرس كبديل، لضمان عدم تشغيل أي صوت تلقائياً إذا لم يضع المعلم صوتاً للمجسم.
 */
export function getLessonModelSound(lesson?: LessonData | null): { soundUrl: string; soundEnabled: boolean } | null {
  if (!lesson) return null;

  // 1. فحص arModel3d
  if (lesson.arModel3d?.soundUrl && lesson.arModel3d.soundUrl.trim() !== '') {
    return {
      soundUrl: resolveAssetUrl(lesson.arModel3d.soundUrl.trim()),
      soundEnabled: lesson.arModel3d.soundEnabled !== false
    };
  }

  // 2. فحص model3d المشترك
  if (lesson.model3d?.soundUrl && lesson.model3d.soundUrl.trim() !== '') {
    return {
      soundUrl: resolveAssetUrl(lesson.model3d.soundUrl.trim()),
      soundEnabled: lesson.model3d.soundEnabled !== false
    };
  }

  // إذا لم يحدد المعلم صوتاً خاصاً للمجسم، لا يتم تشغيل أي صوت تلقائياً
  return null;
}

/**
 * دالة ذكية ومرنة ترجع المجسم الفعال لأي درس:
 * إذا لم يُحدد مجسم خاص بالـ AR (النوع الأول)، يتم استخدام مجسم الدرس المشترك (النوع الثاني) تلقائياً دون تكرار!
 */
export function getActiveLessonModel(lesson?: LessonData | null, preferAR: boolean = true): LessonModel3D | null {
  if (!lesson) return null;

  let chosen: LessonModel3D | null = null;

  if (preferAR) {
    if (lesson.arModel3d?.url && lesson.arModel3d.url.trim() !== '') {
      chosen = { ...lesson.arModel3d };
    }
  }

  if (!chosen && lesson.model3d?.url && lesson.model3d.url.trim() !== '') {
    chosen = { ...lesson.model3d };
  }

  if (!chosen && lesson.arModel3d?.url && lesson.arModel3d.url.trim() !== '') {
    chosen = { ...lesson.arModel3d };
  }

  // إذا لم يكن هناك مجسم بملف ولكن هناك صوت مسجل
  if (!chosen && (lesson.model3d?.soundUrl || lesson.arModel3d?.soundUrl)) {
    chosen = {
      url: '',
      title: lesson.model3d?.title || lesson.title,
      autoRotate: false
    };
  }

  if (chosen) {
    chosen.url = resolveAssetUrl(chosen.url);
    const soundInfo = getLessonModelSound(lesson);
    if (soundInfo) {
      chosen.soundUrl = soundInfo.soundUrl;
      chosen.soundEnabled = soundInfo.soundEnabled;
    }
  }

  return chosen;
}

export type ARActionType =
  | 'target_detected'
  | 'target_locked_blocked'
  | 'video_open'
  | 'video_close'
  | 'images_open'
  | 'audio_play'
  | 'explanation_open'
  | 'model3d_open'
  | 'content_close'
  | 'target_lost';

export interface AnalyticsPayload {
  timestamp: string;
  session_id: string;
  target_id: string;
  lesson_title: string;
  action: ARActionType;
  device: string;
  language: string;
}

export interface AnalyticsLogItem extends AnalyticsPayload {
  id: string;
  status: 'sent' | 'pending' | 'local_only' | 'error';
}

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler?: new () => {
          compileImageTargets: (
            images: HTMLImageElement[],
            onProgress?: (progress: number) => void
          ) => Promise<any>;
          exportData: () => Uint8Array;
        };
        MindARThree?: new (params: {
          container: HTMLElement;
          imageTargetSrc: string;
          filterMinCF?: number;
          filterBeta?: number;
          uiScanning?: string;
          uiLoading?: string;
        }) => {
          start: () => Promise<void>;
          stop: () => void;
          shouldFaceUser?: boolean;
          switchCamera?: () => void;
          scene: any;
          camera: any;
          renderer: {
            dispose: () => void;
            domElement: HTMLCanvasElement;
            setAnimationLoop: (callback: (() => void) | null) => void;
            render: (scene: any, camera: any) => void;
          };
          video: HTMLVideoElement;
          addAnchor: (index: number) => {
            group: any;
            targetIndex: number;
            onTargetFound?: () => void;
            onTargetLost?: () => void;
          };
        };
      };
    };
    THREE?: any;
    GLTFLoader?: any;
  }
}

