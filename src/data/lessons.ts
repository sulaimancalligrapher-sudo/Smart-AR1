import { LessonData } from '../types/ar';

// Storage version key to automatically discard stale data from older testing sessions
const STORAGE_KEY = 'ar_school_lessons_v3';
const STORAGE_VERSION_KEY = 'ar_data_build_version';
const DRAFT_FLAG_KEY = 'ar_has_unsaved_drafts';
const CURRENT_BUILD_VERSION = '3.5.0';

export function normalizeLessonsIndices(lessons: LessonData[]): LessonData[] {
  let extraIndex = lessons.length;
  return lessons.map((l, idx) => {
    const validAdditionals = Array.isArray(l.additionalTargetImages)
      ? l.additionalTargetImages.filter((img) => img && typeof img === 'string' && img.trim() !== '')
      : [];
    const additionalIndices: number[] = [];
    validAdditionals.forEach(() => {
      additionalIndices.push(extraIndex++);
    });
    return {
      ...l,
      targetIndex: idx, // يضمن دائماً مطابقة الترتيب الحقيقي لملف targets.mind
      additionalTargetIndices: additionalIndices,
      additionalTargetImages: validAdditionals
    };
  });
}

export const DEFAULT_LESSONS: LessonData[] = [
  {
    targetIndex: 0,
    targetId: 'lesson_001',
    title: 'كتاب الرقعة',
    subtitle: 'درس استكشافي تفاعلي مدعوم بالواقع المعزز والمجسمات',
    subject: 'الخط واللغة العربية',
    grade: 'الصف الابتدائي',
    isFreePreview: true,
    targetImage: '/targets/target_lesson_001.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: '١. فيديو تعليمي تفاعلي (MP4)'
    },
    videos: [
      {
        type: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        title: '١. شرح الدرس التفاعلي (MP4)'
      },
      {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
        embedUrl: 'https://www.youtube.com/embed/aqz-KE-bpKQ?autoplay=1&rel=0&playsinline=1',
        title: '٢. درس خط الرقعة المرئي (YouTube)'
      }
    ],
    images: [
      {
        url: '/images/lesson_1_img_1.png',
        title: 'كتاب الرقعة',
        caption: 'لوحة تفاعلية لشرح أصول خط الرقعة'
      }
    ],
    audio: {
      url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
      title: '١. التسجيل الصوتي لشرح الدرس'
    },
    audios: [
      {
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
        title: '١. التسجيل الصوتي النموذجي'
      },
      {
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/win.mp3',
        title: '٢. قراءة وتلاوة النص التعليمي'
      }
    ],
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
    isFreePreview: false,
    targetImage: '/targets/target_lesson_002.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      title: '١. فيديو استكشافي للخط الديواني'
    },
    videos: [
      {
        type: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        title: '١. فيديو استكشافي للخط الديواني'
      }
    ],
    images: [
      {
        url: '/images/lesson_2_img_1.png',
        title: 'كتاب الديواني',
        caption: 'لوحة تفاعلية لجماليات الخط الديواني'
      }
    ],
    audio: {
      url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
      title: 'تسجيل صوتي تعليمي للخط الديواني'
    },
    audios: [
      {
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
        title: 'تسجيل صوتي تعليمي للخط الديواني'
      }
    ],
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
    isFreePreview: false,
    targetImage: '/targets/target_lesson_003.jpg',
    video: {
      type: 'mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      title: 'فيديو تعليمي لخط النسخ'
    },
    videos: [
      {
        type: 'mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        embedUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        title: 'فيديو تعليمي لخط النسخ'
      }
    ],
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
      url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
      title: 'تسجيل صوتي لخط النسخ'
    },
    audios: [
      {
        url: 'https://commondatastorage.googleapis.com/codeskulptor-demos/riceracer_assets/music/race.mp3',
        title: 'تسجيل صوتي لخط النسخ'
      }
    ],
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

export function getRawStoredLessons(): LessonData[] | null {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeLessonsIndices(parsed);
      }
    }
  } catch (err) {
    console.warn('Error reading stored lessons:', err);
  }
  return null;
}

export function setHasLocalDrafts(hasDrafts: boolean): void {
  try {
    if (hasDrafts) {
      localStorage.setItem(DRAFT_FLAG_KEY, 'true');
    } else {
      localStorage.removeItem(DRAFT_FLAG_KEY);
    }
  } catch (_) {}
}

export function getHasLocalDrafts(): boolean {
  try {
    return localStorage.getItem(DRAFT_FLAG_KEY) === 'true';
  } catch (_) {
    return false;
  }
}

export function getStoredLessons(): LessonData[] {
  return getRawStoredLessons() || DEFAULT_LESSONS;
}

export function saveStoredLessons(lessons: LessonData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  } catch (err) {
    console.warn('Error saving stored lessons, attempting compact save without large data URIs:', err);
    try {
      const compact = lessons.map((l) => ({
        ...l,
        targetImage: l.targetImage?.startsWith('data:') && l.targetImage.length > 500000 ? '' : l.targetImage,
        additionalTargetImages: (l.additionalTargetImages || []).filter((img) => !img.startsWith('data:') || img.length <= 500000),
        images: l.images?.filter((img) => !img.url?.startsWith('data:') || img.url.length <= 500000) || [],
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
  const hasDrafts = getHasLocalDrafts();
  const rawLocal = getRawStoredLessons();

  // If user on this browser explicitly has local unsaved drafts, and not forced to refresh server
  if (!forceRefreshServer && hasDrafts && rawLocal && rawLocal.length > 0) {
    return rawLocal;
  }

  try {
    // Fetch deployed /data/content.json with cache buster and no-cache headers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const contentUrl = `${cleanBase}/data/content.json?t=${Date.now()}`;

    let res = await fetch(contentUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });

    if (!res.ok) {
      // Try root content.json fallback
      res = await fetch(`${cleanBase}/content.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
    }

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const serverLessons = Array.isArray(data) ? data : data?.lessons;
      if (Array.isArray(serverLessons) && serverLessons.length > 0) {
        const normalized: LessonData[] = serverLessons.map((l: any, idx: number) => {
          const vList = Array.isArray(l.videos)
            ? l.videos.filter((v: any) => v && (v.url?.trim() || v.embedUrl?.trim()))
            : (l.video?.url?.trim() ? [l.video] : []);

          const aList = Array.isArray(l.audios)
            ? l.audios.filter((a: any) => a && a.url?.trim())
            : (l.audio?.url?.trim() ? [l.audio] : []);

          return {
            ...l,
            isFreePreview: typeof l.isFreePreview === 'boolean' ? l.isFreePreview : (idx === 0),
            targetIndex: typeof l.targetIndex === 'number' ? l.targetIndex : idx,
            videos: vList,
            video: vList.length > 0 ? vList[0] : undefined,
            audios: aList,
            audio: aList.length > 0 ? aList[0] : undefined
          };
        });

        saveStoredLessons(normalized);
        if (forceRefreshServer) {
          setHasLocalDrafts(false);
        }
        return normalized;
      }
    }
  } catch (err) {
    console.warn('Could not fetch content.json from server:', err);
  }

  // Fallback to local storage if available
  if (rawLocal && rawLocal.length > 0) {
    return rawLocal;
  }

  return DEFAULT_LESSONS;
}

