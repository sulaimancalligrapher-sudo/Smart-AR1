import { LessonData } from '../types/ar';

// Storage version key to automatically discard stale data from older testing sessions
const STORAGE_KEY = 'ar_school_lessons_v3';
const STORAGE_VERSION_KEY = 'ar_data_build_version';
const CURRENT_BUILD_VERSION = '3.1.0';

export const DEFAULT_LESSONS: LessonData[] = [
  {
    targetIndex: 0,
    targetId: 'lesson_001',
    title: 'كتاب الرقعة',
    subtitle: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: 'الخط واللغة العربية',
    grade: 'الصف الابتدائي',
    targetImage: '',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'فيديو تعليمي تفاعلي'
    },
    images: [],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'تسجيل صوتي تعليمي'
    },
    model3d: {
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
      keyPoints: [
        'التعرف على خصائص ومكونات الدرس',
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
    targetImage: '',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: 'فيديو تعليمي تفاعلي'
    },
    images: [],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'تسجيل صوتي تعليمي'
    },
    model3d: {
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
      keyPoints: [
        'فهم الخطوات التطبيقية',
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
    console.warn('Error saving stored lessons:', err);
  }
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
        if (forceRefreshServer) {
          saveStoredLessons(data.lessons);
          return data.lessons;
        }

        const local = getStoredLessons();
        if (local.length === 0) {
          saveStoredLessons(data.lessons);
          return data.lessons;
        }

        // Merge carefully: only preserve user modifications if the server doesn't provide them
        const merged = data.lessons.map((serverLesson: LessonData, idx: number) => {
          const localLesson = local[idx] || local.find(l => l.targetId === serverLesson.targetId);
          if (localLesson) {
            return {
              ...serverLesson,
              // Keep local user-uploaded media only if server did not specify it
              model3d: serverLesson.model3d || localLesson.model3d,
              targetImage: serverLesson.targetImage || localLesson.targetImage,
              video: serverLesson.video || localLesson.video
            };
          }
          return serverLesson;
        });

        saveStoredLessons(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch /data/content.json from server:', err);
  }

  const stored = getStoredLessons();
  if (stored.length > 0) {
    return stored;
  }

  return DEFAULT_LESSONS;
}

