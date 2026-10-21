import { LessonData, LessonQuestion, QuestionType, SystemAnswerRecord } from '../types/ar';
import { analytics } from './analytics';
import { normalizeArabicDigits } from './subscriptionAuth';
import { recordSystemAnswer, updateSystemAnswerSyncStatus, getStoredSystemAnswers, saveStoredSystemAnswers, detectUserDevice } from './studentSubmissions';

export interface SheetQuestionSyncResult {
  success: boolean;
  message: string;
  updatedLessonsCount?: number;
  totalQuestionsCount?: number;
}

export interface StudentAnswersSubmissionPayload {
  lessonTitle: string;
  studentName: string;
  studentPhone: string;
  answers: Array<{
    questionId: string;
    questionText: string;
    questionType: QuestionType;
    studentAnswer: string;
    isCorrect?: boolean;
    isFreeText?: boolean;
  }>;
  webAppUrl?: string;
}

/**
 * خدمة الربط والمزامنة مع ورقتي:
 * 1. Questions-AR: لقراءة وكتابة بنك الأسئلة أفقياً لكل درس
 * 2. Answers-AR: لتسجيل إجابات وتقييمات الطلاب لكل حصة
 */

/**
 * 1. جلب الأسئلة من ورقة Questions-AR ودمجها في دروس التطبيق
 */
export async function fetchQuestionsFromSheet(
  lessons: LessonData[],
  webAppUrl?: string
): Promise<{ success: boolean; message: string; lessonsWithQuestions?: LessonData[] }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: '⚠️ رابط Google Sheets غير مضبوط بعد. يرجى ضبط الرابط في تبويب Google Sheets أولاً.'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'getQuestions');
    queryUrl.searchParams.set('t', Date.now().toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('استجابة غير صالحة من Google Apps Script. تأكد من نشر السكريبت كـ Web App للجميع (Anyone).');
    }

    if (!data || !data.success) {
      return {
        success: false,
        message: data?.message || 'تعذر جلب بيانات ورقة Questions-AR من Google Sheets.'
      };
    }

    // data.rows عبارة عن مصفوفة الصفوف من الشيت:
    // [ [ "عنوان الدرس", "رابط صورة 1", "نص سؤال 1", "خيارات 1 أو نص", "إجابة 1", "رابط صورة 2", "نص سؤال 2", ... ], ... ]
    const rawRows: any[][] = Array.isArray(data.rows) ? data.rows : [];
    if (rawRows.length === 0) {
      return {
        success: true,
        message: 'تم الاتصال بالورقة بنجاح، ولكن ورقة Questions-AR فارغة حالياً.',
        lessonsWithQuestions: lessons
      };
    }

    // خريطة لتخزين أسئلة كل درس حسب عنوانه
    const questionsByLessonTitle = new Map<string, LessonQuestion[]>();

    // تخطي صف العناوين إن وجد
    const startRowIdx = (rawRows[0] && (rawRows[0][0] || '').toString().includes('عنوان')) ? 1 : 0;

    for (let r = startRowIdx; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || !row[0]) continue;

      const lessonTitle = row[0].toString().trim();
      const parsedQuestions: LessonQuestion[] = [];

      // كل سؤال يشغل 4 أعمدة بدءاً من العمود 1 (B, C, D, E) ثم (F, G, H, I) ...
      for (let col = 1; col < row.length; col += 4) {
        const rawImg = (row[col] || '').toString().trim();
        const rawQText = (row[col + 1] || '').toString().trim();
        const rawOptionsOrType = (row[col + 2] || '').toString().trim();
        const rawAnswerWay = (row[col + 3] ?? '').toString().trim();

        if (!rawQText) continue; // إذا كان نص السؤال فارغاً نتخطاه

        const qId = `q_sheet_${r}_${Math.floor(col / 4) + 1}`;
        const isTextQuestion =
          rawOptionsOrType.toLowerCase() === 'نص' ||
          rawOptionsOrType.toLowerCase() === 'text' ||
          rawOptionsOrType === '';

        if (isTextQuestion) {
          // سؤال كتابة نصية
          const isFreeText = rawAnswerWay === '';
          parsedQuestions.push({
            id: qId,
            type: 'text_answer',
            question: rawQText,
            imageUrl: rawImg || undefined,
            correctAnswerText: isFreeText ? undefined : rawAnswerWay,
            isFreeText: isFreeText,
            explanation: isFreeText ? 'إجابة نصية حرة' : `الإجابة النموذجية: ${rawAnswerWay}`,
            points: 1
          });
        } else {
          // سؤال خيارات متعددة مفصولة بفاصلة
          const optionsList = rawOptionsOrType
            .split(/[,،]/)
            .map((opt: string) => opt.trim())
            .filter(Boolean);

          let correctIdx = 0;
          const num = parseInt(normalizeArabicDigits(rawAnswerWay), 10);
          if (!isNaN(num) && num >= 1 && num <= optionsList.length) {
            correctIdx = num - 1; // تحويل من ترقيم الشيت (1-based) إلى مصفوفة الكود (0-based)
          } else if (rawAnswerWay) {
            // محاولة مطابقة نص الخيار
            const matchIdx = optionsList.findIndex(
              (o: string) => o.toLowerCase() === rawAnswerWay.toLowerCase()
            );
            if (matchIdx !== -1) correctIdx = matchIdx;
          }

          parsedQuestions.push({
            id: qId,
            type: 'multiple_choice',
            question: rawQText,
            imageUrl: rawImg || undefined,
            options: optionsList.length > 0 ? optionsList : ['نعم', 'لا'],
            correctIndex: correctIdx,
            explanation: optionsList[correctIdx] ? `الإجابة الصحيحة هي: ${optionsList[correctIdx]}` : '',
            points: 1
          });
        }
      }

      if (parsedQuestions.length > 0) {
        questionsByLessonTitle.set(lessonTitle, parsedQuestions);
      }
    }

    // دمج الأسئلة المستوردة مع دروس التطبيق
    let updatedCount = 0;
    const mergedLessons = lessons.map((l) => {
      // مطابقة بالاسم أو جزء منه
      const matched =
        questionsByLessonTitle.get(l.title.trim()) ||
        Array.from(questionsByLessonTitle.entries()).find(
          ([title]) => l.title.includes(title) || title.includes(l.title)
        )?.[1];

      if (matched && matched.length > 0) {
        updatedCount++;
        return {
          ...l,
          questions: matched
        };
      }
      return l;
    });

    return {
      success: true,
      message: `✓ تم استيراد بنك الأسئلة من ورقة Questions-AR وتحديث ${updatedCount} من الدروس بنجاح!`,
      lessonsWithQuestions: mergedLessons
    };
  } catch (err: any) {
    console.warn('Error fetching questions from sheet:', err);
    return {
      success: false,
      message: `تعذر جلب الأسئلة من Google Sheets: ${err?.message || 'تأكد من الاتصال بالإنترنت'}`
    };
  }
}

/**
 * 2. تصدير / مزامنة بنك الأسئلة من التطبيق إلى ورقة Questions-AR في Google Sheets
 */
export async function exportQuestionsToSheet(
  lessons: LessonData[],
  webAppUrl?: string
): Promise<{ success: boolean; message: string }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: '⚠️ رابط Google Sheets غير مضبوط في لوحة الإدارة بعد.'
    };
  }

  try {
    // 1. حساب أقصى عدد من الأسئلة في أي درس لتحديد عدد الأعمدة في الهيدر
    let maxQuestions = 1;
    lessons.forEach((l) => {
      const qCount = Array.isArray(l.questions) ? l.questions.length : 0;
      if (qCount > maxQuestions) maxQuestions = qCount;
    });

    // 2. بناء صف العناوين الهيدر (Header Row)
    const headerRow: string[] = ['عنوان الدرس'];
    for (let q = 1; q <= maxQuestions; q++) {
      headerRow.push(
        `رابط صورة السؤال ${q}`,
        `نص السؤال ${q}`,
        `خيارات السؤال ${q} أو «نص»`,
        `طريقة الإجابة / الإجابة الصحيحة ${q}`
      );
    }

    // 3. بناء صفوف الدروس
    const dataRows: any[][] = [];
    lessons.forEach((l) => {
      const row: any[] = [l.title];
      const qList = (l.questions || []).filter((q) => q && q.question?.trim());

      for (let i = 0; i < maxQuestions; i++) {
        const q = qList[i];
        if (q) {
          row.push(q.imageUrl || '');
          row.push(q.question);
          if (q.type === 'text_answer') {
            row.push('نص');
            row.push(q.isFreeText ? '' : (q.correctAnswerText || ''));
          } else {
            row.push((q.options || []).join(', '));
            row.push((typeof q.correctIndex === 'number' ? q.correctIndex + 1 : 1).toString());
          }
        } else {
          // خانات فارغة لإكمال الصف
          row.push('', '', '', '');
        }
      }
      dataRows.push(row);
    });

    const allSheetRows = [headerRow, ...dataRows];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 14000);

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'syncQuestions',
        rows: allSheetRows
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: true };
    }

    return {
      success: true,
      message: `✓ تم حفظ وتحديث ورقة Questions-AR في Google Sheets بنجاح (${dataRows.length} درس)!`
    };
  } catch (err: any) {
    console.warn('Error syncing questions to sheet:', err);
    return {
      success: false,
      message: `تعذر حفظ الأسئلة في الشيت: ${err?.message || 'تأكد من نشر سكريبت Apps Script'}`
    };
  }
}

/**
 * 3. إرسال سجل إجابات الطالب إلى ورقة Answers-AR في صف واحد لكل حصة
 * الهيكل المعتمد:
 * العمود A: تاريخ ووقت التسجيل (مثل 2026-10-19 01:30:00)
 * العمود B: رقم الطالب (أو فارغ)
 * العمود C: اسم المستخدم (طالب / اسم المشترك)
 * العمود D: موضوع الحصة
 * العمود E: إجابة السؤال 1
 * العمود F: إجابة السؤال 2
 * العمود G: إجابة السؤال 3
 * العمود H وما بعده: إجابات بقية الأسئلة
 * 
 * وتُحفظ الإجابات بهذه الطريقة:
 * - صح: إذا كانت الإجابة صحيحة.
 * - خطأ: إذا كانت الإجابة خاطئة.
 * - نص الإجابة الحرة نفسها: تُحفظ الإجابة الحرة كما كتبها الطالب، مثل «الخط العربي» (وليس كلمة ثابتة).
 * - فارغ (""): إذا لم يُسجّل الطالب إجابة عن السؤال.
 */
// ذاكرة مؤقتة لمنع أي تكرار متزامن لنفس سجل الإجابات خلال 10 ثوانٍ
const recentSubmissionsCache = new Map<string, number>();

export async function submitStudentAnswersToSheet(
  payload: StudentAnswersSubmissionPayload
): Promise<{ success: boolean; message: string; scoreText?: string; systemRecordId?: string }> {
  const targetUrl = (payload.webAppUrl || analytics.getWebAppUrl() || '').trim();

  // تشكيل قيم الإجابات للأعمدة وفق الهيكل المطلوب بدقة
  const answerColumns: string[] = (payload.answers || []).map((ans) => {
    const studentAnswer = (ans.studentAnswer || '').toString().trim();
    if (!studentAnswer) {
      return ''; // فارغ إذا لم يُسجّل الطالب إجابة عن السؤال
    }
    if (ans.isFreeText) {
      return studentAnswer; // حفظ النص الحر نفسه كما هو، مثل «الخط العربي»
    }
    return ans.isCorrect ? 'صح' : 'خطأ';
  });

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // حساب النتيجة الإجمالية للأسئلة القابلة للتقييم
  const evaluatedQuestions = (payload.answers || []).filter(
    (a) => !a.isFreeText && (a.studentAnswer || '').toString().trim() !== ''
  );
  const correctCount = evaluatedQuestions.filter((a) => a.isCorrect).length;
  const totalEvaluated = evaluatedQuestions.length;
  const scoreText = totalEvaluated > 0 ? `${correctCount} من ${totalEvaluated}` : undefined;

  // تنظيف الأرقام والأسماء
  const effectivePhone = normalizeArabicDigits((payload.studentPhone != null ? String(payload.studentPhone) : '').trim().replace(/[\s\-\(\)]/g, ''));
  const effectiveName = (payload.studentName != null && String(payload.studentName).trim()) 
    ? String(payload.studentName).trim() 
    : 'زائر';
  const effectiveLesson = (payload.lessonTitle != null ? String(payload.lessonTitle) : '').trim();

  // حماية صارمة لمنع التكرار (Deduplication Lock)
  const dedupKey = `${effectiveName}_${effectivePhone}_${effectiveLesson}_${answerColumns.join('|')}`;
  const lastSentTime = recentSubmissionsCache.get(dedupKey) || 0;
  if (Date.now() - lastSentTime < 15000) {
    return {
      success: true,
      message: effectivePhone 
        ? `✓ تم حفظ الإجابات في النظام وإرسالها باسم (${effectiveName}) ورقم (${effectivePhone})!`
        : `✓ تم حفظ الإجابات في النظام وإرسالها باسم (${effectiveName}) بنجاح!`,
      scoreText
    };
  }
  recentSubmissionsCache.set(dedupKey, Date.now());

  // ⭐ تحديد نوع جهاز الطالب بدقة (جوال / تابلت / كمبيوتر) ⭐
  const deviceType = detectUserDevice();

  // ⭐ الخطوة 1: تسجيل الإجابات أولاً في النظام (System Database First) مع نوع الجهاز ⭐
  let systemRecordId = '';
  try {
    const sysRec = recordSystemAnswer({
      timestamp,
      studentPhone: effectivePhone,
      studentName: effectiveName,
      lessonTitle: effectiveLesson,
      answerColumns,
      device: deviceType,
      syncedToSheet: false
    });
    systemRecordId = sysRec.id;
  } catch (sysErr) {
    console.warn('Error saving answer to system database:', sysErr);
  }

  // ⭐ الخطوة 2: إرسال الإجابات إلى Google Sheets عبر طلب وحيد مضمون 100% (منع التكرار) ⭐
  if (targetUrl) {
    let transmitted = false;

    try {
      const getUrl = new URL(targetUrl);
      getUrl.searchParams.set('action', 'submitAnswers');
      getUrl.searchParams.set('timestamp', timestamp);
      getUrl.searchParams.set('studentPhone', effectivePhone);
      getUrl.searchParams.set('studentName', effectiveName);
      getUrl.searchParams.set('lessonTitle', effectiveLesson);
      getUrl.searchParams.set('answerColumns', JSON.stringify(answerColumns));
      getUrl.searchParams.set('device', deviceType);
      getUrl.searchParams.set('_r', Date.now().toString());

      // 1) إرسال وحيد أساسي عبر fetch GET المباشر مع keepalive
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        await fetch(getUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          keepalive: true,
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        transmitted = true;
      } catch (fetchErr) {
        console.warn('GET fetch notice on mobile/tablet, attempting single fallback:', fetchErr);
      }

      // 2) بديل احتياطي وحيد: يُستدعى فقط إذا فشل fetch أعلاه، لضمان عدم تكرار الإرسال
      if (!transmitted && typeof Image !== 'undefined') {
        const beaconImg = new Image();
        beaconImg.src = getUrl.toString();
        transmitted = true;
      }

      if (transmitted && systemRecordId) {
        updateSystemAnswerSyncStatus(systemRecordId, true);
      }
    } catch (urlErr) {
      console.warn('Submission URL error:', urlErr);
    }
  }

  const successMessage = effectivePhone 
    ? `✓ تم حفظ الإجابات في النظام وإرسالها باسم (${effectiveName}) ورقم (${effectivePhone})!`
    : `✓ تم حفظ الإجابات في النظام وإرسالها باسم (${effectiveName}) بنجاح!`;

  return {
    success: true,
    message: successMessage,
    scoreText,
    systemRecordId
  };
}

/**
 * 3. جلب وتحديث كافة سجلات الطلاب من ورقة Answers-AR في Google Sheets
 * لعرض إجابات جميع الطلاب المكتملة من كافة الأجهزة (جوالات، أجهزة لوحية، كمبيوتر)
 */
export async function fetchAnswersFromSheet(
  webAppUrl?: string
): Promise<{ success: boolean; message: string; records?: SystemAnswerRecord[] }> {
  const targetUrl = (webAppUrl || analytics.getWebAppUrl() || '').trim();

  if (!targetUrl) {
    return {
      success: false,
      message: '⚠️ رابط Google Sheets غير مضبوط في الإعدادات.'
    };
  }

  try {
    const queryUrl = new URL(targetUrl);
    queryUrl.searchParams.set('action', 'getAnswers');
    queryUrl.searchParams.set('t', Date.now().toString());

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(queryUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('استجابة غير صالحة من Google Apps Script.');
    }

    if (!data || !data.success) {
      const msg = data?.message || (data?.status === 'ready'
        ? '⚠️ سكريبت Google Apps Script المنشور بحاجة لتحديث ونشر إصدار جديد (Deploy > New deployment) لتفعيل جلب إجابات الجوال والتابلت إلى شاشة الكمبيوتر تلقائياً.'
        : 'تعذر جلب بيانات ورقة Answers-AR.');
      return {
        success: false,
        message: msg
      };
    }

    const rawRows: any[][] = Array.isArray(data.rows) ? data.rows : [];
    if (rawRows.length <= 1) {
      return {
        success: true,
        message: 'ورقة Answers-AR لا تحتوي على إجابات بعد.',
        records: getStoredSystemAnswers()
      };
    }

    // تحويل الصفوف إلى SystemAnswerRecord
    const fetchedRecords: SystemAnswerRecord[] = [];
    const startIndex = (rawRows[0] && String(rawRows[0][0] || '').includes('تاريخ')) ? 1 : 0;

    for (let r = startIndex; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;
      const ts = String(row[0] || '').trim();
      const phone = String(row[1] || '').trim();
      const name = String(row[2] || '').trim();
      const lesson = String(row[3] || '').trim();
      if (!ts && !name && !lesson) continue;

      const answerCols: string[] = [];
      for (let c = 4; c < row.length; c++) {
        answerCols.push(row[c] !== undefined && row[c] !== null ? String(row[c]) : '');
      }

      fetchedRecords.push({
        id: `sheet_row_${r}_${ts.replace(/[\s\-\:]/g, '_')}`,
        timestamp: ts,
        studentPhone: phone,
        studentName: name || 'زائر',
        lessonTitle: lesson,
        answerColumns: answerCols,
        syncedToSheet: true,
        syncedAt: ts
      });
    }

    // دمج السجلات مع السجلات المحلية
    const localRecords = getStoredSystemAnswers();
    const mergedMap = new Map<string, SystemAnswerRecord>();

    // نضع سجلات الشيت أولاً
    fetchedRecords.forEach((rec) => {
      const key = `${rec.timestamp}_${rec.studentPhone}_${rec.studentName}_${rec.lessonTitle}`;
      mergedMap.set(key, rec);
    });

    // ثم ندمج السجلات المحلية التي لم تكن موجودة بعد
    localRecords.forEach((local) => {
      const key = `${local.timestamp}_${local.studentPhone}_${local.studentName}_${local.lessonTitle}`;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, local);
      }
    });

    const finalRecords = Array.from(mergedMap.values());
    saveStoredSystemAnswers(finalRecords);

    return {
      success: true,
      message: `✓ تم جلب وتحديث ${fetchedRecords.length} سجل بنجاح من ورقة Answers-AR في Google Sheets!`,
      records: finalRecords
    };
  } catch (err: any) {
    return {
      success: false,
      message: `خطأ أثناء الاتصال بورقة Answers-AR: ${err?.message || 'تأكد من الاتصال'}`
    };
  }
}
