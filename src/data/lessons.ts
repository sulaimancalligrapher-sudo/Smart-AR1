import { LessonData } from '../types/ar';

// All previous demo models have been cleared per user request.
// The system starts clean and loads real schoolbook lessons from content.json or localStorage.
export const DEFAULT_LESSONS: LessonData[] = [];

export function getStoredLessons(): LessonData[] {
  try {
    const local = localStorage.getItem('ar_school_lessons');
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
    localStorage.setItem('ar_school_lessons', JSON.stringify(lessons));
  } catch (err) {
    console.warn('Error saving stored lessons:', err);
  }
}

export function clearStoredLessons(): void {
  try {
    localStorage.removeItem('ar_school_lessons');
  } catch (err) {
    console.warn('Error clearing stored lessons:', err);
  }
}

export async function fetchLessons(): Promise<LessonData[]> {
  try {
    // 1. Always prioritize fetching the deployed /data/content.json from server with cache-busting
    const res = await fetch(`/data/content.json?t=${Date.now()}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lessons) && data.lessons.length > 0) {
        // Merge with local storage so locally configured model3d is not wiped out on reload
        const local = getStoredLessons();
        const merged = data.lessons.map((serverLesson: LessonData, idx: number) => {
          const localLesson = local[idx] || local.find(l => l.targetId === serverLesson.targetId);
          if (localLesson && localLesson.model3d && !serverLesson.model3d) {
            return { ...serverLesson, model3d: localLesson.model3d };
          }
          return serverLesson;
        });

        // Sync merged lessons into localStorage
        saveStoredLessons(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Could not fetch /data/content.json from server, falling back to local storage:', err);
  }

  // 2. If server content.json is empty or offline, use local storage session
  const stored = getStoredLessons();
  if (stored.length > 0) {
    return stored;
  }

  return DEFAULT_LESSONS;
}
