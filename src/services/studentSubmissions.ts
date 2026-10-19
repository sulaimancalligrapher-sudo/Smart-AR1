import { StudentSubmission } from '../types/ar';
import { analytics } from './analytics';

const SUBMISSIONS_STORAGE_KEY = 'ar_student_submissions_v1';

export function getStoredSubmissions(): StudentSubmission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading student submissions:', e);
  }
  return [];
}

export function saveStoredSubmissions(submissions: StudentSubmission[]): void {
  try {
    localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(submissions));
  } catch (e) {
    console.warn('Error saving student submissions:', e);
  }
}

export function recordStudentSubmission(submission: Omit<StudentSubmission, 'id' | 'submittedAt'>): StudentSubmission {
  const newEntry: StudentSubmission = {
    ...submission,
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    submittedAt: new Date().toISOString()
  };

  const existing = getStoredSubmissions();
  const updated = [newEntry, ...existing];
  saveStoredSubmissions(updated);

  // الحفظ السحابي يتم مركزياً في صف موحد لكل حصة عبر submitStudentAnswersToSheet
  return newEntry;
}

export function clearAllSubmissions(): void {
  try {
    localStorage.removeItem(SUBMISSIONS_STORAGE_KEY);
  } catch (_) {}
}
