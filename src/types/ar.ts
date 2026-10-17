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
  options?: string[]; // لأسئلة الاختيار من متعدد
  correctIndex?: number; // رقم الإجابة الصحيحة (0, 1, 2, 3)
  correctAnswerText?: string; // الإجابة النموذجية أو المفتاحية للسؤال النصي
  explanation?: string; // تفسير وتعزيز الإجابة
  points?: number; // نقاط أو درجات السؤال
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
  questions?: LessonQuestion[]; // بنك الأسئلة المتعددة للدرس الواحد
}

/**
 * دالة معيارية لفحص هل الدرس مقفل ومقيد للمشتركين فقط أم متاح مجاناً للجميع
 */
export function isLessonRestricted(lesson?: LessonData | null): boolean {
  if (!lesson) return false;
  // إذا حُدد صراحة كمعاينة مجانية (سواء boolean أو نص string)
  if (lesson.isFreePreview === true || (lesson.isFreePreview as any) === 'true') {
    return false;
  }
  // إذا حُدد صراحة كمقفل للمشتركين
  if (lesson.isFreePreview === false || (lesson.isFreePreview as any) === 'false') {
    return true;
  }
  // في حال لم يتم تحديد القيمة: الدرس الأول (Target #0) متاح مجاناً، وجميع الدروس التالية مقفلة للمشتركين
  const pIdx = typeof lesson.targetIndex === 'number' ? lesson.targetIndex : 0;
  return pIdx > 0;
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

  // 1. تحويل روابط GitHub من صفحات العرض (blob) إلى المحتوى الخام المباشر للتشغيل
  const ghBlobMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/(?:blob|raw)\/([^/]+)\/(.+)$/i);
  if (ghBlobMatch) {
    const [, owner, repo, branch, path] = ghBlobMatch;
    url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // 2. معالجة المسارات النسبية المحلية مع BASE_URL
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

