import React, { useState } from 'react';
import {
  Brain,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Send,
  Sparkles,
  Award,
  User,
  Phone,
  Image as ImageIcon,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { LessonData, LessonQuestion } from '../types/ar';
import { SubscriberInfo, getStoredSubscriber } from '../services/subscriptionAuth';
import { submitStudentAnswersToSheet } from '../services/sheetsQuestionsSync';
import { recordStudentSubmission } from '../services/studentSubmissions';

interface QuestionsModalProps {
  lesson: LessonData;
  questions: LessonQuestion[];
  subscriber?: SubscriberInfo | null;
  webAppUrl?: string;
  onClose: () => void;
}

export const QuestionsModal: React.FC<QuestionsModalProps> = ({
  lesson,
  questions,
  subscriber,
  webAppUrl,
  onClose
}) => {
  // بيانات الطالب: المشترك الحالي المسجل أو اسم محلي
  const activeSub = subscriber || getStoredSubscriber();
  const [studentName, setStudentName] = useState<string>(activeSub?.name || '');
  const [studentPhone, setStudentPhone] = useState<string>(activeSub?.phone || '');
  const [showIdentityEdit, setShowIdentityEdit] = useState<boolean>(!activeSub?.name);

  // حالة التنقل بين الأسئلة
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // إجابات الطالب: [qIndex] => studentAnswer string
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // حالة الإرسال والنتائج
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    scoreText?: string;
    correctCount: number;
    totalCount: number;
    message: string;
  } | null>(null);

  if (!questions || questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <Brain className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-white">لا توجد أسئلة مضافة لهذا الدرس حالياً</h3>
          <p className="text-xs text-slate-400">يمكن للمعلم إضافة الأسئلة من لوحة الإدارة أو عبر ورقة Questions-AR.</p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
          >
            إغلاق والعودة للكاميرا
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || questions[0];
  const currentAnswer = userAnswers[currentIdx] || '';

  const handleSelectOption = (optText: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: optText
    }));
  };

  const handleTextAnswerChange = (val: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentIdx]: val
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  // إرسال الإجابات وتقييمها وحفظها في Answers-AR
  const handleSubmitAllAnswers = async () => {
    if (!studentName.trim()) {
      setShowIdentityEdit(true);
      return;
    }

    setIsSubmitting(true);

    // تقييم الإجابات وفق المعايير المحددة
    let correctCount = 0;
    let evaluableCount = 0;

    const evaluatedAnswers = questions.map((q, idx) => {
      const studentAns = (userAnswers[idx] || '').trim();
      let isCorrect = false;

      if (q.type === 'multiple_choice') {
        evaluableCount++;
        const targetOption = q.options && typeof q.correctIndex === 'number' ? q.options[q.correctIndex] : null;
        if (targetOption && studentAns === targetOption.trim()) {
          isCorrect = true;
          correctCount++;
        }
      } else {
        // نص
        if (q.isFreeText || !q.correctAnswerText || q.correctAnswerText.trim() === '') {
          // نص حر: لا يوجد صح أو خطأ
          isCorrect = true;
        } else {
          evaluableCount++;
          // مقارنة النص مع الإجابة النموذجية
          const cleanStudent = studentAns.toLowerCase().replace(/[\s\-_،,]/g, '');
          const cleanModel = q.correctAnswerText.toLowerCase().replace(/[\s\-_،,]/g, '');
          if (cleanStudent && cleanModel && (cleanStudent === cleanModel || cleanStudent.includes(cleanModel) || cleanModel.includes(cleanStudent))) {
            isCorrect = true;
            correctCount++;
          }
        }
      }

      // حفظ محلي أيضاً
      try {
        recordStudentSubmission({
          studentName: studentName.trim(),
          studentPhone: studentPhone.trim() || 'مشترك',
          lessonId: lesson.targetId,
          lessonTitle: lesson.title,
          questionId: q.id,
          questionText: q.question,
          questionType: q.type,
          studentAnswer: studentAns,
          isCorrect: q.type === 'multiple_choice' || (!q.isFreeText && q.correctAnswerText) ? isCorrect : undefined,
          score: isCorrect ? (q.points || 1) : 0
        });
      } catch (_) {}

      return {
        questionId: q.id,
        questionText: q.question,
        questionType: q.type,
        studentAnswer: studentAns,
        isCorrect,
        isFreeText: q.isFreeText || (q.type === 'text_answer' && !q.correctAnswerText)
      };
    });

    // إرسال لورقة Answers-AR في صف واحد
    const result = await submitStudentAnswersToSheet({
      lessonTitle: lesson.title,
      studentName: studentName.trim(),
      studentPhone: studentPhone.trim(),
      answers: evaluatedAnswers,
      webAppUrl
    });

    setIsSubmitting(false);
    setIsCompleted(true);
    setSubmissionFeedback({
      correctCount,
      totalCount: evaluableCount,
      scoreText: evaluableCount > 0 ? `${correctCount} من ${evaluableCount}` : undefined,
      message: result.message
    });
  };

  const answeredCount = Object.keys(userAnswers).filter((k) => (userAnswers[Number(k)] || '').trim() !== '').length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-amber-950/70 via-slate-900 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  بنك أسئلة وتفكير الدرس: {lesson.title}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  {questions.length} أسئلة
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                أجب عن الأسئلة وسيتم تسجيل نتائجك مباشرة في ورقة الإجابات (Answers-AR)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Identity Bar */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
              <User className="w-3.5 h-3.5" />
            </div>
            {activeSub?.name && !showIdentityEdit ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white">الطالب المسجل: {studentName}</span>
                {studentPhone && (
                  <span className="text-[10px] text-slate-400 font-mono">({studentPhone})</span>
                )}
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-semibold">
                  مشترك مفعل ✓
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="اسم الطالب..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  placeholder="رقم الهاتف/المشترك..."
                  value={studentPhone}
                  onChange={(e) => setStudentPhone(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-medium">
              تمت الإجابة: {answeredCount} من {questions.length}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {!isCompleted ? (
            <>
              {/* Question Stepper Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIdx;
                  const isAnswered = Boolean((userAnswers[idx] || '').trim());
                  return (
                    <button
                      key={q.id || idx}
                      onClick={() => setCurrentIdx(idx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                          : isAnswered
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      <span>سؤال {idx + 1}</span>
                      {isAnswered && (
                        <Check className="w-3 h-3 text-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Question Box */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                {/* Image if available */}
                {currentQ.imageUrl && currentQ.imageUrl.trim() !== '' && (
                  <div className="rounded-xl overflow-hidden border border-slate-800 bg-black max-h-56 flex items-center justify-center p-1">
                    <img
                      src={currentQ.imageUrl}
                      alt={currentQ.question}
                      className="max-h-52 w-auto object-contain rounded-lg shadow-md"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Question Info Header */}
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold">
                    السؤال {currentIdx + 1} من {questions.length}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentQ.type === 'multiple_choice' ? '🔘 اختيار من متعدد' : (currentQ.isFreeText ? '✍️ إجابة نصية حرة' : '✍️ إجابة نصية')}
                  </span>
                </div>

                {/* Question Text */}
                <h4 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ.question}
                </h4>

                {/* Question Inputs */}
                {currentQ.type === 'multiple_choice' ? (
                  <div className="space-y-2 pt-2">
                    {(currentQ.options || ['نعم', 'لا']).map((opt, oIdx) => {
                      const isSelected = currentAnswer === opt.trim();
                      const letter = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][oIdx] || (oIdx + 1).toString();
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(opt.trim())}
                          className={`w-full p-3.5 rounded-xl border text-right transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white font-bold ring-2 ring-amber-400/30 shadow-md'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {letter}
                          </span>
                          <span className="text-xs sm:text-sm flex-1">{opt}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      اكتب إجابتك هنا:
                    </label>
                    <textarea
                      rows={3}
                      value={currentAnswer}
                      onChange={(e) => handleTextAnswerChange(e.target.value)}
                      placeholder={currentQ.isFreeText ? 'اكتب رأيك أو إجابتك الحرة هنا...' : 'اكتب الإجابة المطلوبة...'}
                      className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                    {currentQ.isFreeText && (
                      <p className="text-[11px] text-sky-300">
                        💡 هذا السؤال ذو إجابة حرة، سيتم تسجيل ما تكتبه نصاً في جدول Answers-AR.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Celebration & Results Screen */
            <div className="bg-slate-950 p-6 rounded-3xl border border-emerald-500/40 text-center space-y-5 animate-scaleUp">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-black text-white">
                  أحسنت يا {studentName || 'بطل'}! 🎉
                </h4>
                <p className="text-xs sm:text-sm text-emerald-300 font-medium">
                  {submissionFeedback?.message || 'تم تسجيل جميع إجاباتك بنجاح في ورقة المعلم (Answers-AR).'}
                </p>
              </div>

              {submissionFeedback?.scoreText && (
                <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 inline-block max-w-xs mx-auto">
                  <span className="text-xs text-emerald-200 block mb-1">النتيجة والتقييم:</span>
                  <span className="text-2xl font-black text-white font-mono">
                    {submissionFeedback.scoreText}
                  </span>
                </div>
              )}

              {/* Answers Breakdown */}
              <div className="space-y-2 text-right pt-2 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300 mb-2">ملخص إجاباتك المسجلة:</h5>
                {questions.map((q, idx) => {
                  const ans = (userAnswers[idx] || '').trim();
                  return (
                    <div key={q.id || idx} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs gap-3">
                      <div className="truncate flex-1">
                        <span className="text-slate-400 font-mono ml-1.5">#{idx + 1}</span>
                        <span className="text-white font-medium">{q.question}</span>
                      </div>
                      <span className="text-xs font-bold text-amber-300 px-2 py-0.5 rounded bg-slate-800 border border-slate-700 whitespace-nowrap">
                        {ans || '(فارغ)'}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  ✓ تم، العودة للكاميرا
                </button>
                <button
                  onClick={() => {
                    setIsCompleted(false);
                    setCurrentIdx(0);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مراجعة الأسئلة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {!isCompleted && (
          <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                currentIdx === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              ) : null}

              {/* زر الإرسال النهائي الملون والبارز */}
              <button
                onClick={handleSubmitAllAnswers}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>جارٍ الإرسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 fill-slate-950" />
                    <span>📤 إرسال الإجابات والتقييم</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
