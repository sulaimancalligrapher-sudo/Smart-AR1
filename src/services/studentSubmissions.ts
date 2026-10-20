import { StudentSubmission, SystemAnswerRecord } from '../types/ar';
import { analytics } from './analytics';

const SUBMISSIONS_STORAGE_KEY = 'ar_student_submissions_v1';
const SYSTEM_ANSWERS_STORAGE_KEY = 'smart_ar_system_answers_v1';

// ==========================================
// 1. إدارة سجلات إجابات النظام المعتمدة (Answers-AR)
// ==========================================

export function getStoredSystemAnswers(): SystemAnswerRecord[] {
  try {
    const raw = localStorage.getItem(SYSTEM_ANSWERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading system answers:', e);
  }
  return [];
}

export function saveStoredSystemAnswers(records: SystemAnswerRecord[]): void {
  try {
    localStorage.setItem(SYSTEM_ANSWERS_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('Error saving system answers:', e);
  }
}

/**
 * تسجيل سجل إجابات حصة في النظام أولاً قبل إرساله للشيت
 */
export function recordSystemAnswer(
  data: Omit<SystemAnswerRecord, 'id'>
): SystemAnswerRecord {
  const newRecord: SystemAnswerRecord = {
    ...data,
    id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  };

  const existing = getStoredSystemAnswers();
  const updated = [newRecord, ...existing];
  saveStoredSystemAnswers(updated);
  return newRecord;
}

/**
 * تحديث حالة المزامنة السحابية للسجل بعد استلام رد Google Sheets
 */
export function updateSystemAnswerSyncStatus(
  id: string,
  synced: boolean
): void {
  const existing = getStoredSystemAnswers();
  const updated = existing.map((rec) => {
    if (rec.id === id) {
      return {
        ...rec,
        syncedToSheet: synced,
        syncedAt: synced ? new Date().toISOString() : rec.syncedAt
      };
    }
    return rec;
  });
  saveStoredSystemAnswers(updated);
}

/**
 * مسح كافة سجلات إجابات النظام
 */
export function clearAllSystemAnswers(): void {
  try {
    localStorage.removeItem(SYSTEM_ANSWERS_STORAGE_KEY);
  } catch (_) {}
}

// ==========================================
// 2. دوال التوافق التراجعي (Legacy compatibility)
// ==========================================

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

  return newEntry;
}

export function clearAllSubmissions(): void {
  try {
    localStorage.removeItem(SUBMISSIONS_STORAGE_KEY);
  } catch (_) {}
}
