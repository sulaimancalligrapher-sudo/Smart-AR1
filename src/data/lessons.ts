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
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
      embedUrl: 'https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0',
      title: 'فيديو شرح كتاب الرقعة'
    },
    images: [
      {
        url: '/targets/target_lesson_001.jpg',
        title: 'بطاقة درس كتاب الرقعة',
        caption: 'بطاقة درس كتاب الرقعة'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'الشرح الصوتي لكتاب الرقعة'
    },
    model3d: {
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي تفاعلي لخط الرقعة وقواعده وجمالياته الفنية عبر تقنية الواقع المعزز.',
      keyPoints: [
        'التعرف على خصائص وحروف خط الرقعة',
        'مشاهدة المجسم ثلاثي الأبعاد والتدوير بزاوية 360 درجة',
        'متابعة الفيديو التعليمي التفاعلي والاستماع للشرح الصوتي'
      ],
      fullText: 'خط الرقعة هو أحد الخطوط العربية الأصيلة التي تتميز بالبساطة والسرعة في الكتابة وسهولة القراءة، ويستخدم بكثرة في الحياة اليومية.',
      quiz: {
        question: 'ما هي أهم ميزة في خط الرقعة؟',
        options: ['السرعة والسهولة في الكتابة', 'صعوبة القراءة', 'كثرة الزخارف المعقدة', 'يكتب بأقلام خاصة فقط'],
        correctIndex: 0,
        explanation: 'يتميز خط الرقعة بسلاسة وسرعة كتابته ووضوح حروفه.'
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
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
      embedUrl: 'https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0',
      title: 'فيديو شرح كتاب الديواني'
    },
    images: [
      {
        url: '/targets/target_lesson_002.jpg',
        title: 'بطاقة درس كتاب الديواني',
        caption: 'بطاقة درس كتاب الديواني'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'الشرح الصوتي لكتاب الديواني'
    },
    model3d: {
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس استكشافي لخط الديواني وانحناءاته الفنية الرائعة والمجسم التفاعلي.',
      keyPoints: [
        'فهم أسلوب الخط الديواني واستخداماته التاريخية',
        'فحص المجسم 3D التفاعلي من كافة الجهات',
        'التدريب على رسم الحروف والكلمات بانسيابية'
      ],
      fullText: 'الخط الديواني هو خط عربي فني متميز بالمرونة والتداخل الجمالي في الحروف، وكان يستخدم في الدواوين والوثائق الرسمية القديمة.',
      quiz: {
        question: 'أين كان يستخدم الخط الديواني قديماً؟',
        options: ['في الدواوين والمراسلات الرسمية', 'في الإعلانات فقط', 'لم يستخدم قط', 'في الصحف الحديثة فقط'],
        correctIndex: 0,
        explanation: 'سمي بالديواني لأنه كان الخط المعتمد في الدواوين الملكية والرسمية.'
      }
    }
  },
  {
    targetIndex: 2,
    targetId: 'lesson_003',
    title: 'كتاب النسخ',
    subtitle: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: 'الخط واللغة العربية',
    grade: 'الصف الابتدائي',
    targetImage: '/targets/target_lesson_003.jpg',
    video: {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
      embedUrl: 'https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0',
      title: 'فيديو شرح كتاب النسخ'
    },
    images: [
      {
        url: '/targets/target_lesson_003.jpg',
        title: 'بطاقة درس كتاب النسخ',
        caption: 'بطاقة درس كتاب النسخ'
      }
    ],
    audio: {
      url: 'https://actions.google.com/sounds/v1/science/ambient_space.ogg',
      title: 'الشرح الصوتي لكتاب النسخ'
    },
    model3d: {
      url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
      title: 'مجسم ثلاثي الأبعاد تفاعلي',
      autoRotate: false
    },
    description: {
      summary: 'درس شامل لخط النسخ المستخدم في طباعة الكتب المدرسية والقرآن الكريم.',
      keyPoints: [
        'التعرف على قواعد خط النسخ ووضوح رسم حروفه',
        'التفاعل مع المجسم التعليمي ثلاثي الأبعاد',
        'إتقان الكتابة بالنسخ للمرحلة الابتدائية'
      ],
      fullText: 'خط النسخ هو الخط الأكثر انتشاراً واستخداماً في طباعة الكتب والصحف والمناهج المدرسية، لشدة وضوحه ودقته وتناسق حروفه.',
      quiz: {
        question: 'لماذا سمي خط النسخ بهذا الاسم؟',
        options: ['لكثرة استخدامه في نسخ الكتب والمخطوطات', 'لأنه جديد', 'لأنه صعب جداً', 'لأنه يكتب بسرعة دون تاني'],
        correctIndex: 0,
        explanation: 'سمي خط النسخ بهذا الاسم لأنه كان الخط الأساسي الذي ينسخ به الوراقون الكتب والمصاحف.'
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
      // Strip large data URIs if quota exceeded to ensure core text/models/videos are preserved
      const compact = lessons.map(l => ({
        ...l,
        targetImage: l.targetImage?.startsWith('data:') ? '' : l.targetImage,
        images: l.images?.filter(img => !img.url?.startsWith('data:')) || []
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compact));
    } catch (e2) {
      console.warn('Could not save even compact lessons to localStorage:', e2);
    }
  }
}

/**
 * Encode lessons into a compact URL-safe base64 string for direct student sharing
 */
export function encodeLessonsPayload(lessons: LessonData[]): string {
  try {
    // Strip heavy base64 to ensure URL fits easily
    const clean = lessons.map(l => ({
      targetIndex: l.targetIndex,
      targetId: l.targetId,
      title: l.title,
      subtitle: l.subtitle,
      subject: l.subject,
      grade: l.grade,
      targetImage: l.targetImage?.startsWith('data:') ? '' : (l.targetImage || `/targets/target_${l.targetId}.jpg`),
      video: l.video,
      model3d: l.model3d,
      audio: l.audio,
      description: l.description,
      images: l.images?.filter(img => !img.url?.startsWith('data:')) || []
    }));
    const json = JSON.stringify(clean);
    return btoa(encodeURIComponent(json));
  } catch (err) {
    console.warn('Could not encode lessons payload:', err);
    return '';
  }
}

/**
 * Decode lessons from a URL-safe base64 string
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
  try {
    // Check if URL hash or search params contains an encoded lessons payload
    const hash = window.location.hash;
    if (hash.includes('d=')) {
      const parts = hash.split('d=');
      if (parts[1]) {
        const decoded = decodeLessonsPayload(parts[1]);
        if (decoded && decoded.length > 0) {
          saveStoredLessons(decoded);
          return decoded;
        }
      }
    }

    // Fetch deployed /data/content.json (now clean and <10KB)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

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

        // Merge carefully: ensure 3D model and video and description exist
        const merged = data.lessons.map((serverLesson: LessonData, idx: number) => {
          const localLesson = local[idx] || local.find(l => l.targetId === serverLesson.targetId);
          if (localLesson) {
            return {
              ...serverLesson,
              title: localLesson.title || serverLesson.title,
              subtitle: localLesson.subtitle || serverLesson.subtitle,
              model3d: localLesson.model3d || serverLesson.model3d,
              targetImage: localLesson.targetImage || serverLesson.targetImage,
              video: localLesson.video || serverLesson.video,
              audio: localLesson.audio || serverLesson.audio,
              description: localLesson.description || serverLesson.description
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

