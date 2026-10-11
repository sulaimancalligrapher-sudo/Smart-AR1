import { LessonData } from '../types/ar';

// Storage version key to automatically discard stale data from older testing sessions
const STORAGE_KEY = 'ar_school_lessons_v3';
const STORAGE_VERSION_KEY = 'ar_data_build_version';
const CURRENT_BUILD_VERSION = '3.2.0';

export const DEFAULT_LESSONS: LessonData[] = [
  {
    targetIndex: 0,
    targetId: 'lesson_001',
    title: 'كتاب الرقعة',
    subtitle: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: 'الخط واللغة العربية',
    grade: 'الصف الابتدائي',
    targetImage: '/targets/target_lesson_001.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'فيديو تعليمي تفاعلي'
    },
    images: [
      {
        url: '/images/lesson_1_img_1.png',
        title: 'كتاب الرقعة',
        caption: 'لوحة تفاعلية لشرح أصول خط الرقعة'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'تسجيل صوتي تعليمي'
    },
    model3d: {
      url: '/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
      keyPoints: [
        'التعرف على خصائص ومكونات خط الرقعة',
        'فحص المجسم التفاعلي بزوايا 360 درجة'
      ],
      fullText: 'شرح مفصل للدرس يظهر للطالب عند فتح أيقونة الشرح والاستكشاف...',
      quiz: {
        question: 'ما هي أهم ميزة في هذا المجسم التفاعلي؟',
        options: ['ثابت ويمكن تدويره 360°', 'يتحرك تلقائياً', 'لا يمكن لمسه', 'صغير جداً'],
        correctIndex: 0,
        explanation: 'المجسم يتميز بالثبات الكامل التفاعلي تحت تحكم الطالب.'
      }
    }
  },
  {
    targetIndex: 1,
    targetId: 'lesson_002',
    title: 'كتاب الديواني',
    subtitle: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: 'الخط واللغة العربية',
    grade: 'الصف الابتدائي',
    targetImage: '/targets/target_lesson_002.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'فيديو تعليمي تفاعلي'
    },
    images: [
      {
        url: '/images/lesson_2_img_1.png',
        title: 'كتاب الديواني',
        caption: 'لوحة تفاعلية لجماليات الخط الديواني'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'تسجيل صوتي تعليمي'
    },
    model3d: {
      url: '/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
      keyPoints: [
        'فهم الخطوات التطبيقية للخط الديواني',
        'المعاينة ثلاثية الأبعاد'
      ],
      fullText: 'شرح مفصل للدرس الثاني يظهر للطالب في المنصة...',
      quiz: {
        question: 'كيف يمكن تدوير المجسم؟',
        options: ['بالسحب بالإصبع في أي اتجاه', 'بالهز', 'بالصوت', 'تلقائياً فقط'],
        correctIndex: 0,
        explanation: 'يمكنك تحريك إصبعك في أي اتجاه لمعاينة المجسم بدقة.'
      }
    }
  },
  {
    targetIndex: 2,
    targetId: 'lesson_003',
    title: 'كتاب النسخ',
    subtitle: 'درس استكشافي تفاعلي مدعوم بمجسم كلمة الخط العربي والواقع المعزز',
    subject: 'الخط العربي والقرآن الكريم',
    grade: 'الصف الابتدائي',
    targetImage: '/targets/target_lesson_003.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'فيديو تعليمي لخط النسخ'
    },
    images: [
      {
        url: '/images/lesson_3_img_1.png',
        title: 'قواعد خط النسخ',
        caption: 'مخطط لقواعد وحروف خط النسخ'
      },
      {
        url: '/images/lesson_3_img_2.jpg',
        title: 'نماذج خط النسخ',
        caption: 'نماذج تطبيقية لكتابة الكلمات والحروف'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'تسجيل صوتي لخط النسخ'
    },
    model3d: {
      url: '/models/calligraphy_word.glb',
      title: 'مجسم كلمة الخط العربي ثلاثي الأبعاد',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي مدعوم بمجسم كلمة الخط العربي ثلاثي الأبعاد والواقع المعزز',
      keyPoints: [
        'أصول وضوابط خط النسخ ووضوح الحروف',
        'فحص مجسم الكلمة ثلاثي الأبعاد وتثبيته فوق صفحة الكتاب'
      ],
      fullText: 'شرح مفصل لقواعد خط النسخ وجمالياته وكيفية ممارسته...',
      quiz: {
        question: 'ما هو المجسم المعروض في هذا الدرس؟',
        options: ['مجسم كلمة الخط العربي', 'رائد فضاء', 'سيارة', 'شجرة'],
        correctIndex: 0,
        explanation: 'مجسم كلمة الخط العربي ثلاثي الأبعاد مصمم خصيصاً للدرس.'
      }
    }
  }
];

// Automatic migration check: if legacy version exists, purge to prevent stale state
try {
  const savedVer = localStorage.getItem(STORAGE_VERSION_KEY);
  if (savedVer !== CURRENT_BUILD_VERSION) {
    // Clean up older legacy keys
    localStorage.removeItem('ar_school_lessons');
    localStorage.removeItem('ar_school_lessons_v2');
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_BUILD_VERSION);
  }
} catch {
  // Ignore storage access errors
}

export function getStoredLessons(): LessonData[] {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading stored lessons:', err);
  }
  return DEFAULT_LESSONS;
}

export function saveStoredLessons(lessons: LessonData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (err) {
    console.warn('Error saving stored lessons, attempting compact save without large data URIs:', err);
    try {
      const compact = lessons.map((l) => ({
        ...l,
        targetImage: l.targetImage?.startsWith('data:') ? '' : l.targetImage,
        images: l.images?.filter((img) => !img.url?.startsWith('data:')) || [],
        model3d: l.model3d?.url?.startsWith('data:') ? { ...l.model3d, url: '' } : l.model3d,
        arModel3d: l.arModel3d?.url?.startsWith('data:') ? { ...l.arModel3d, url: '' } : l.arModel3d
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch (e2) {
      console.warn('Could not save compact lessons to localStorage:', e2);
    }
  }
}

/**
 * تشفير بيانات الدروس في رابط URL آمن base64 لمشاركتها مع الطلاب
 */
export function encodeLessonsPayload(lessons: LessonData[]): string {
  try {
    const clean = lessons.map((l) => ({
      targetIndex: l.targetIndex,
      targetId: l.targetId,
      title: l.title,
      subtitle: l.subtitle,
      subject: l.subject,
      grade: l.grade,
      targetImage: l.targetImage?.startsWith('data:') ? '' : (l.targetImage || `/targets/target_${l.targetId}.jpg`),
      video: l.video,
      model3d: l.model3d,
      arModel3d: l.arModel3d,
      audio: l.audio,
      description: l.description,
      images: l.images?.filter((img) => !img.url?.startsWith('data:')) || []
    }));
    const json = JSON.stringify(clean);
    return btoa(encodeURIComponent(json));
  } catch (err) {
    console.warn('Could not encode lessons payload:', err);
    return '';
  }
}

/**
 * فك تشفير بيانات الدروس من الرابط
 */
export function decodeLessonsPayload(payload: string): LessonData[] | null {
  try {
    if (!payload) return null;
    const json = decodeURIComponent(atob(payload));
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as LessonData[];
    }
  } catch (err) {
    console.warn('Could not decode lessons payload:', err);
  }
  return null;
}

export function clearStoredLessons(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('ar_school_lessons');
    localStorage.removeItem('ar_school_lessons_v2');
  } catch (err) {
    console.warn('Error clearing stored lessons:', err);
  }
}

/**
 * مسح شامل لجميع البيانات المخزنة محلياً في المتصفح وتصفير الكاش
 */
export async function purgeAllLocalDataAndCache(): Promise<void> {
  try {
    // 1. Clear LocalStorage
    localStorage.clear();
  } catch (e) {
    console.warn('Could not clear localStorage:', e);
  }

  try {
    // 2. Clear SessionStorage
    sessionStorage.clear();
  } catch (e) {
    console.warn('Could not clear sessionStorage:', e);
  }

  try {
    // 3. Clear Service Worker Caches if any exist
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
  } catch (e) {
    console.warn('Could not clear cache storage:', e);
  }

  try {
    // 4. Immediately seed clean default lessons so there is ZERO delay or EMPTY_LESSONS error
    saveStoredLessons(DEFAULT_LESSONS);
    localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_BUILD_VERSION);
  } catch (e) {
    console.warn('Could not set build version:', e);
  }
}

export async function fetchLessons(forceRefreshServer = false): Promise<LessonData[]> {
  const local = getStoredLessons();

  // If local already has stored user lessons and not a forced server refresh, preserve user data
  if (!forceRefreshServer && local && local.length > 0) {
    return local;
  }

  try {
    // Fetch deployed /data/content.json with timeout guard (3.5s max to prevent mobile hang)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`/data/content.json?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lessons) && data.lessons.length > 0) {
        if (forceRefreshServer || !local || local.length === 0) {
          saveStoredLessons(data.lessons);
          return data.lessons;
        }

        // Merge: local user edits ALWAYS take top priority over static server defaults
        const merged = local.map((locLesson: LessonData, idx: number) => {
          const serverLesson = data.lessons[idx] || data.lessons.find((s: LessonData) => s.targetId === locLesson.targetId);
          if (!serverLesson) return locLesson;
          return {
            ...serverLesson,
            ...locLesson, // Local modifications ALWAYS win
            video: locLesson.video || serverLesson.video,
            audio: locLesson.audio || serverLesson.audio,
            description: locLesson.description || serverLesson.description,
            images: (locLesson.images && locLesson.images.length > 0) ? locLesson.images : (serverLesson.images || []),
            model3d: locLesson.model3d || serverLesson.model3d,
            arModel3d: locLesson.arModel3d || serverLesson.arModel3d,
            targetImage: locLesson.targetImage || serverLesson.targetImage
          };
        });

        // If server has newer lessons beyond local length, append them
        if (data.lessons.length > local.length) {
          for (let i = local.length; i < data.lessons.length; i++) {
            merged.push(data.lessons[i]);
          }
        }

        saveStoredLessons(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch /data/content.json from server:', err);
  }

  if (local && local.length > 0) {
    return local;
  }

  return DEFAULT_LESSONS;
}

