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
  video: LessonVideo;
  videos?: LessonVideo[]; // قائمة الفيديوهات المتعددة للدرس الواحد
  images: LessonImage[];
  audio: LessonAudio;
  audios?: LessonAudio[]; // قائمة التسجيلات الصوتية المتعددة للدرس الواحد
  description: LessonDescription;
  model3d?: LessonModel3D;
  arModel3d?: LessonModel3D; // مجسم مخصص اختياري للواقع المعزز (AR) - إذا لم يُحدد يستخدم model3d تلقائياً
}

/**
 * استخراج قائمة جميع الفيديوهات للدرس (يدعم الفيديوهات المتعددة أو المفردة القديمة)
 */
export function getLessonVideos(lesson?: LessonData | null): LessonVideo[] {
  if (!lesson) return [];
  if (Array.isArray(lesson.videos) && lesson.videos.length > 0) {
    const valid = lesson.videos.filter((v) => v && (v.url?.trim() || v.embedUrl?.trim()));
    if (valid.length > 0) return valid;
  }
  if (lesson.video?.url?.trim() || lesson.video?.embedUrl?.trim()) {
    return [lesson.video];
  }
  return [];
}

/**
 * استخراج قائمة جميع التسجيلات الصوتية للدرس (يدعم الصوتيات المتعددة أو المفردة القديمة)
 */
export function getLessonAudios(lesson?: LessonData | null): LessonAudio[] {
  if (!lesson) return [];
  if (Array.isArray(lesson.audios) && lesson.audios.length > 0) {
    const valid = lesson.audios.filter((a) => a && a.url?.trim());
    if (valid.length > 0) return valid;
  }
  if (lesson.audio?.url?.trim()) {
    return [lesson.audio];
  }
  return [];
}

/**
 * تطبيع وفحص روابط الفيديو من يوتيوب، فيميو، جوجل درايف، أو الروابط المباشرة والمخصصة
 */
export function normalizeVideoData(rawUrl: string, title?: string): LessonVideo {
  const url = (rawUrl || '').trim();
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
  } else if (url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov') || url.includes('/gtv-videos-bucket/')) {
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
 * تطبيع وفحص روابط الصوت: ملفات مباشرة، جوجل درايف، يوتيوب، ساوندكلاود، أو روابط مخصصة
 */
export function normalizeAudioData(rawUrl: string, title?: string): LessonAudio {
  const url = (rawUrl || '').trim();
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
      soundUrl: lesson.arModel3d.soundUrl.trim(),
      soundEnabled: lesson.arModel3d.soundEnabled !== false
    };
  }

  // 2. فحص model3d المشترك
  if (lesson.model3d?.soundUrl && lesson.model3d.soundUrl.trim() !== '') {
    return {
      soundUrl: lesson.model3d.soundUrl.trim(),
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

