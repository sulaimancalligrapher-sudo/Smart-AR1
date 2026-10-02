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
        // Sync fetched lessons into localStorage
        saveStoredLessons(data.lessons);
        return data.lessons;
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
