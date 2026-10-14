export type VideoSourceType = 'youtube' | 'vimeo' | 'mp4';

export interface LessonVideo {
  type: VideoSourceType;
  url: string;
  embedUrl: string;
  title: string;
}

export interface LessonImage {
  url: string;
  title: string;
  caption: string;
}

export interface LessonAudio {
  url: string;
  title: string;
  duration?: string;
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
  images: LessonImage[];
  audio: LessonAudio;
  description: LessonDescription;
  model3d?: LessonModel3D;
  arModel3d?: LessonModel3D; // مجسم مخصص اختياري للواقع المعزز (AR) - إذا لم يُحدد يستخدم model3d تلقائياً
}

/**
 * دالة ذكية لإرجاع ملف الصوت المخصص للمجسم:
 * تفحص المجسم المخصص للـ AR، ثم المجسم المشترك 3D Model لضمان عدم ضياع الصوت أبداً!
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

  // 3. فحص صوت الدرس العام audio.url كبديل ذكي لضمان تشغيل الصوت دائماً
  if (lesson.audio?.url && lesson.audio.url.trim() !== '') {
    return {
      soundUrl: lesson.audio.url.trim(),
      soundEnabled: true
    };
  }

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

