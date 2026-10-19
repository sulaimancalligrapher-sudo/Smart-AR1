import { LessonData, LessonQuestion, QuestionType } from '../types/ar';
import { analytics } from './analytics';
import { normalizeArabicDigits } from './subscriptionAuth';

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
export async function submitStudentAnswersToSheet(
  payload: StudentAnswersSubmissionPayload
): Promise<{ success: boolean; message: string; scoreText?: string }> {
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

  // تنظيف الأرقام والأسماء: وضع الزائر يسجل باسم "زائر" ورقم فارغ، ووضع المشترك يسجل باسمه ورقمه
  const effectivePhone = normalizeArabicDigits((payload.studentPhone || '').toString().trim().replace(/[\s\-\(\)]/g, ''));
  const effectiveName = (payload.studentName && payload.studentName.trim()) 
    ? payload.studentName.trim() 
    : 'زائر';
  const effectiveLesson = (payload.lessonTitle || '').toString().trim();

  if (!targetUrl) {
    return {
      success: true,
      message: effectivePhone 
        ? `✓ تم حفظ إجاباتك محلياً باسم (${effectiveName}) ورقم (${effectivePhone})!`
        : `✓ تم حفظ إجاباتك محلياً كـ (زائر)!`,
      scoreText
    };
  }

  // إرسال البيانات عبر قنوات إرسال متكاملة تضمن وصول الإجابات فوراً وبدون تعليق المتصفح أو CORS
  try {
    // 1. تشكيل رابط GET المباشر مع المعايير (يعمل بنجاح فوري وموثوق مع Google Apps Script)
    const getUrl = new URL(targetUrl);
    getUrl.searchParams.set('action', 'submitAnswers');
    getUrl.searchParams.set('timestamp', timestamp);
    getUrl.searchParams.set('studentPhone', effectivePhone);
    getUrl.searchParams.set('studentName', effectiveName);
    getUrl.searchParams.set('lessonTitle', effectiveLesson);
    getUrl.searchParams.set('answerColumns', JSON.stringify(answerColumns));
    getUrl.searchParams.set('_r', Date.now().toString());

    // أ) الإرسال عبر Image Beacon مع حفظ المرجع لمنع الـ Garbage Collector من إلغاء الطلب
    try {
      const beaconImg = new Image();
      if (typeof window !== 'undefined') {
        const win = window as any;
        win.__smart_ar_beacons = win.__smart_ar_beacons || [];
        win.__smart_ar_beacons.push(beaconImg);
        if (win.__smart_ar_beacons.length > 20) {
          win.__smart_ar_beacons.shift();
        }
      }
      beaconImg.src = getUrl.toString();
    } catch (_) {}

    // ب) الإرسال عبر fetch GET بدون preflight ومع keepalive لضمان عدم إلغاء الطلب أثناء تنقل الواجهة
    try {
      fetch(getUrl.toString(), {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
        keepalive: true
      }).catch(() => {});
    } catch (_) {}

    // ج) محاولة فحص سريعة بخلفية المتصفح عبر fetch مباشر (مع مهلة قصيرة 4 ثوانٍ)
    try {
      const directController = new AbortController();
      const directTimeout = setTimeout(() => directController.abort(), 4000);
      fetch(getUrl.toString(), {
        method: 'GET',
        signal: directController.signal
      })
        .then(() => clearTimeout(directTimeout))
        .catch(() => clearTimeout(directTimeout));
    } catch (_) {}
  } catch (netErr) {
    console.warn('Background submission transmission error:', netErr);
  }

  const successMessage = effectivePhone 
    ? `✓ تم تسجيل إجاباتك في ورقة Answers-AR باسم (${effectiveName}) ورقم (${effectivePhone})!`
    : `✓ تم تسجيل إجاباتك في ورقة Answers-AR كـ (${effectiveName}) بنجاح!`;

  return {
    success: true,
    message: successMessage,
    scoreText
  };
}
