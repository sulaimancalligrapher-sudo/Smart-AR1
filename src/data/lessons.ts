import { LessonData } from '../types/ar';

// All previous demo models have been cleared per user request.
// The system now starts completely clean for real schoolbook lessons.
export const DEFAULT_LESSONS: LessonData[] = [];

export function getStoredLessons(): LessonData[] {
  try {
    const local = localStorage.getItem('ar_school_lessons');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
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

export async function fetchLessons(): Promise<LessonData[]> {
  try {
    // 1. Check local storage first
    const stored = getStoredLessons();
    if (stored.length > 0) {
      return stored;
    }

    // 2. Fallback to /data/content.json if exists
    const res = await fetch('/data/content.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lessons) && data.lessons.length > 0) {
        return data.lessons;
      }
    }
  } catch (err) {
    console.warn('Using bundled lessons fallback:', err);
  }
  return DEFAULT_LESSONS;
}
