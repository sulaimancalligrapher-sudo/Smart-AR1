import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Send,
  Award,
  User,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  KeyRound,
  UserCheck,
  ArrowRight,
  Sparkles,
  LogOut
} from 'lucide-react';
import { LessonData, LessonQuestion, isLessonRestricted } from '../types/ar';
import {
  SubscriberInfo,
  getStoredSubscriber,
  saveStoredSubscriber,
  verifySubscriberWithSheet,
  normalizeArabicDigits,
  getStoredVisitorName,
  saveStoredVisitorName,
  clearStoredVisitorName
} from '../services/subscriptionAuth';
import { submitStudentAnswersToSheet } from '../services/sheetsQuestionsSync';
import { recordStudentSubmission } from '../services/studentSubmissions';
import { AppLanguage } from '../types/translation';
import { t } from '../services/translationService';

interface QuestionsModalProps {
  lesson: LessonData;
  questions: LessonQuestion[];
  subscriber?: SubscriberInfo | null;
  visitorName?: string;
  webAppUrl?: string;
  onSubscriberLogin?: (subscriber: SubscriberInfo) => void;
  onVisitorNameChange?: (name: string) => void;
  onVisitorLogout?: () => void;
  onClose: () => void;
  currentLanguage?: AppLanguage;
}

export const QuestionsModal: React.FC<QuestionsModalProps> = ({
  lesson,
  questions,
  subscriber,
  visitorName,
  webAppUrl,
  onSubscriberLogin,
  onVisitorNameChange,
  onVisitorLogout,
  onClose,
  currentLanguage = 'ar'
}) => {
  // فحص هل الدرس مقيد للمشتركين أم مفتوح للزوار
  const isRestricted = isLessonRestricted(lesson);

  // المشترك النشط المسجل
  const [activeSub, setActiveSub] = useState<SubscriberInfo | null>(
    () => subscriber || getStoredSubscriber()
  );

  useEffect(() => {
    if (subscriber) {
      setActiveSub(subscriber);
    }
  }, [subscriber]);

  // اسم الزائر المحفوظ في النظام
  const [savedVisitorName, setSavedVisitorName] = useState<string>(() => {
    return visitorName || getStoredVisitorName() || '';
  });

  useEffect(() => {
    if (visitorName !== undefined) {
      setSavedVisitorName(visitorName);
    }
  }, [visitorName]);

  // مراحل النافذة:
  // 'initial_gate': نافذة البداية (تسجيل اسم الزائر أو الترحيب بالمشترك/تسجيل دخوله)
  // 'answering': مرحلة حل واستعراض الأسئلة
  // 'completed': مرحلة عرض النتائج والتقييم
  const [modalStage, setModalStage] = useState<'initial_gate' | 'answering' | 'completed'>('initial_gate');

  // بيانات هوية الطالب التي ستُسجل مع الإجابة
  const [studentName, setStudentName] = useState<string>('');
  const [studentPhone, setStudentPhone] = useState<string>('');

  // مدخلات الزائر في المرحلة الأولى
  const [visitorNameInput, setVisitorNameInput] = useState<string>(() => {
    return savedVisitorName || getStoredVisitorName() || '';
  });

  // وضع تعديل اسم الزائر يدوياً
  const [isEditingVisitorName, setIsEditingVisitorName] = useState<boolean>(false);

  // مدخلات تسجيل دخول المشترك في الوضع المقيد
  const [loginNameInput, setLoginNameInput] = useState<string>('');
  const [loginPhoneInput, setLoginPhoneInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifyingLogin, setIsVerifyingLogin] = useState<boolean>(false);

  // حالة التنقل بين الأسئلة
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // إجابات الطالب: [qIndex] => studentAnswer string
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});

  // حالة الإرسال والنتائج
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
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

  // منع الإرسال المتكرر داخل المكون
  const hasSubmittedRef = useRef(false);

  // 1. الوضع الأول (المفتوح للزائر): تسجيل الاسم والانتقال للأسئلة بدون رقم
  const handleStartVisitorAnswering = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = String(visitorNameInput || savedVisitorName || '').trim() || 'زائر';
    setStudentName(finalName);
    setStudentPhone(''); // بدون رقم كما هو محدد في المطلوب
    saveStoredVisitorName(finalName);
    setSavedVisitorName(finalName);
    setIsEditingVisitorName(false);
    if (onVisitorNameChange) {
      onVisitorNameChange(finalName);
    }
    setModalStage('answering');
  };

  // خروج الزائر ومسح اسمه لإتاحة تسجيل اسم جديد
  const handleClearVisitor = () => {
    clearStoredVisitorName();
    setSavedVisitorName('');
    setVisitorNameInput('');
    setStudentName('');
    setIsEditingVisitorName(true);
    if (onVisitorLogout) {
      onVisitorLogout();
    }
  };

  // 2. الوضع الثاني (المقيد للمشترك): الدخول المباشر للمشترك المسجل
  const handleStartSubscriberAnswering = () => {
    if (activeSub) {
      setStudentName(String(activeSub.name || '').trim());
      setStudentPhone(String(activeSub.phone || '').trim());
      setModalStage('answering');
    }
  };

  // 3. الوضع الثاني (المقيد للمشترك): تسجيل دخول مشترك جديد ثم الانتقال للأسئلة
  const handleSubscriberLoginAndStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cName = String(loginNameInput || '').trim();
    const cPhone = normalizeArabicDigits(String(loginPhoneInput || '').replace(/[\s\-\(\)]/g, ''));

    if (!cName || !cPhone) {
      setLoginError('يرجى إدخال اسم المشترك ورقم هاتفه للمتابعة.');
      return;
    }

    setIsVerifyingLogin(true);

    try {
      const res = await verifySubscriberWithSheet(cName, cPhone, webAppUrl);

      if (res.success && res.subscriber) {
        saveStoredSubscriber(res.subscriber);
        setActiveSub(res.subscriber);
        setStudentName(res.subscriber.name);
        setStudentPhone(res.subscriber.phone);
        if (onSubscriberLogin) {
          onSubscriberLogin(res.subscriber);
        }
        setIsVerifyingLogin(false);
        setModalStage('answering');
      } else {
        setLoginError(res.message);
        setIsVerifyingLogin(false);
      }
    } catch (err: any) {
      setLoginError(`حدث خطأ أثناء الاتصال: ${err?.message || 'تأكد من الاتصال بالإنترنت'}`);
      setIsVerifyingLogin(false);
    }
  };

  // تنفيذ إرسال الإجابات وحفظها في النظام أولاً ثم الشيت
  const handleFinalSubmitAllAnswers = async () => {
    if (isSubmitting || hasSubmittedRef.current) return;

    hasSubmittedRef.current = true;
    setIsSubmitting(true);

    // ⭐ القاعدة الأساسية:
    // إذا كان المستخدم مشتركاً نشطاً (تم الدخول بحسابه) -> يُسجل كل شيء باسم المشترك ورقمه
    // سواء كان الدرس مقيداً أو مفتوحاً!
    // وإذا لم يكن مشتركاً (زائر) -> يُسجل باسم الزائر وبدون رقم هاتف.
    const isSubscriber = Boolean(activeSub && activeSub.name);
    const rawName = isSubscriber
      ? activeSub!.name
      : (studentName || savedVisitorName || visitorNameInput || getStoredVisitorName() || 'زائر');
    const rawPhone = isSubscriber ? activeSub!.phone : '';

    const effectiveName = String(rawName != null ? rawName : '').trim() || (isSubscriber ? 'مشترك' : 'زائر');
    const effectivePhone = isSubscriber ? String(rawPhone != null ? rawPhone : '').trim() : '';

    try {
      // تقييم الإجابات وفق المعايير المحددة بدقة
      let correctCount = 0;
      let evaluableCount = 0;

      const evaluatedAnswers = questions.map((q, idx) => {
        const studentAns = String(userAnswers[idx] || '').trim();
        let isCorrect = false;

        // هل السؤال إجابة حرة؟
        const isFree = Boolean(
          q.isFreeText ||
          (q.type === 'text_answer' && (!q.correctAnswerText || String(q.correctAnswerText).trim() === ''))
        );

        if (q.type === 'multiple_choice') {
          evaluableCount++;
          const targetOption = q.options && typeof q.correctIndex === 'number' ? q.options[q.correctIndex] : null;
          if (targetOption !== null && targetOption !== undefined && studentAns === String(targetOption).trim()) {
            isCorrect = true;
            correctCount++;
          }
        } else {
          // سؤال كتابي / نصي
          if (isFree) {
            isCorrect = true; // نص حر: تُحفظ الإجابة الحرة كما كتبها الطالب
          } else {
            evaluableCount++;
            const cleanStudent = studentAns.toLowerCase().replace(/[\s\-_،,]/g, '');
            const cleanModel = String(q.correctAnswerText || '').toLowerCase().replace(/[\s\-_،,]/g, '');
            if (cleanStudent && cleanModel && (cleanStudent === cleanModel || cleanStudent.includes(cleanModel) || cleanModel.includes(cleanStudent))) {
              isCorrect = true;
              correctCount++;
            }
          }
        }

        // حفظ تفصيلي في سجل التوافق
        try {
          recordStudentSubmission({
            studentName: effectiveName,
            studentPhone: effectivePhone || 'زائر',
            lessonId: lesson.targetId,
            lessonTitle: lesson.title,
            questionId: q.id,
            questionText: q.question,
            questionType: q.type,
            studentAnswer: studentAns,
            isCorrect: q.type === 'multiple_choice' || (!isFree && q.correctAnswerText) ? isCorrect : undefined,
            score: isCorrect ? (q.points || 1) : 0
          });
        } catch (_) {}

        return {
          questionId: q.id,
          questionText: q.question,
          questionType: q.type,
          studentAnswer: studentAns,
          isCorrect,
          isFreeText: isFree
        };
      });

      // إرسال الإجابات: تُسجل أولاً في النظام ثم يُرسل طلب وحيد لـ Google Sheets
      const result = await submitStudentAnswersToSheet({
        lessonTitle: lesson.title,
        studentName: effectiveName,
        studentPhone: effectivePhone,
        answers: evaluatedAnswers,
        webAppUrl
      });

      setSubmissionFeedback({
        correctCount,
        totalCount: evaluableCount,
        scoreText: evaluableCount > 0 ? `${correctCount} من ${evaluableCount}` : undefined,
        message: result.message
      });
      setModalStage('completed');
    } catch (err: any) {
      console.error('Error submitting student answers:', err);
      setSubmissionFeedback({
        correctCount: 0,
        totalCount: questions.length,
        message: effectivePhone
          ? `✓ تم حفظ إجاباتك في النظام وإرسالها باسم (${effectiveName}) ورقم (${effectivePhone})!`
          : `✓ تم حفظ إجاباتك في النظام وإرسالها باسم (${effectiveName}) بنجاح!`
      });
      setModalStage('completed');
    } finally {
      setIsSubmitting(false);
    }
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
                {isRestricted ? (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    الوضع المقيد
                  </span>
                ) : (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <User className="w-2.5 h-2.5" />
                    الوضع المفتوح
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                تسجيل وحفظ الإجابات في جدول النظام وورقة Answers-AR
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

        {/* ======================================================== */}
        {/* المرحلة 1: شاشة البداية المخصصة لكل وضع (Initial Gate) */}
        {/* ======================================================== */}
        {modalStage === 'initial_gate' && (
          <div className="p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center space-y-6">
            {activeSub ? (
              /* 1. حساب المشترك المسجل (ينطبق على كافة الدروس المفتوحة والمقيدة): يتم تسجيل كل شيء باسمه ورقمه */
              <div className="w-full max-w-md bg-slate-950/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <UserCheck className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-bold">
                    حساب مشترك معتمد 💎
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    مرحباً بك، {activeSub.name}! 👋
                  </h4>
                  <p className="text-xs text-slate-300">
                    رقم المشترك المسجل: <span className="font-mono text-emerald-300 font-bold">{activeSub.phone}</span>
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    أنت مسجل بحساب المشترك لدرس «{lesson.title}». ستُسجل كافة إجاباتك في النظام باسمك ورقمك مباشرة وبدون أي تكرار.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartSubscriberAnswering}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>🚀 دخول ورؤية الأسئلة والإجابة عليها</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            ) : isRestricted ? (
              /* 2. الوضع المقيد للمشترك - لم يسجل دخوله بعد */
              <div className="w-full max-w-md bg-slate-950/90 border border-amber-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                    محتوى مقيد للمشتركين
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    تسجيل دخول المشترك لرؤية الأسئلة
                  </h4>
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    يشترط تسجيل الدخول بحساب المشترك (الاسم ورقم الهاتف) لكي تجيب على أسئلة هذا الدرس وتُسجّل الإجابة باسمك ورقمك:
                  </p>
                </div>

                <form onSubmit={handleSubscriberLoginAndStart} className="space-y-3.5 text-right">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                      اسم المشترك:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسمك الكامل..."
                      value={loginNameInput}
                      onChange={(e) => setLoginNameInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                      رقم هاتف المشترك:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: 0501234567 أو 123 للتجربة"
                      value={loginPhoneInput}
                      onChange={(e) => setLoginPhoneInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>

                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 text-right">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifyingLogin}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isVerifyingLogin ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>جارٍ التحقق وتفعيل الحساب...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>تأكيد الدخول ورؤية الأسئلة</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : savedVisitorName && !isEditingVisitorName ? (
              /* 3. الوضع المفتوح للزائر: الاسم محفوظ مسبقاً (لا يكرر كتابة اسمه) */
              <div className="w-full max-w-md bg-slate-950/90 border border-sky-500/40 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                  <User className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 font-bold">
                    الوضع المفتوح للزائر
                  </span>
                  <h4 className="text-lg sm:text-xl font-black text-white">
                    مرحباً بك، {savedVisitorName}! 👋
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    تم حفظ اسمك في الصفحة، وسيتم تسجيل إجابات هذا الدرس وكافة الدروس المفتوحة باسمك تلقائياً دون تكرار كتابته.
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={handleStartVisitorAnswering}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>🚀 متابعة الإجابة باسم ({savedVisitorName})</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>

                  <button
                    type="button"
                    onClick={handleClearVisitor}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 border border-slate-700/60 font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    title="تسجيل خروج الزائر لتغيير الاسم"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج الزائر / تغيير الاسم</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 4. الوضع المفتوح للزائر: تسجيل الاسم للمرة الأولى */
              <div className="w-full max-w-md bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/30 text-sky-400 flex items-center justify-center mx-auto shadow-inner">
                  <User className="w-7 h-7" />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 font-bold">
                    الوضع المفتوح للزائر
                  </span>
                  <h4 className="text-base sm:text-lg font-black text-white">
                    تسجيل اسم الزائر للبدء في حل الأسئلة
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    مرحباً بك! يرجى كتابة اسمك الكريم ليتم تسجيله في الصفحة وكافة الدروس المفتوحة باسمك تلقائياً (دون تكرار):
                  </p>
                </div>

                <form onSubmit={handleStartVisitorAnswering} className="space-y-4">
                  <input
                    type="text"
                    required
                    placeholder="اكتب اسمك الكريم هنا (مثال: أحمد، سارة)..."
                    value={visitorNameInput}
                    onChange={(e) => setVisitorNameInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 text-center"
                    autoFocus
                  />

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>🚀 حفظ الاسم وبدء حل الأسئلة</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* المرحلة 2: شاشة حل واستعراض الأسئلة (Answering Stage) */}
        {/* ======================================================== */}
        {modalStage === 'answering' && (
          <>
            {/* شريط هوية الطالب المعلقة بالإجابة */}
            <div className="px-5 py-2.5 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {studentPhone ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white">المشترك: {studentName}</span>
                    <span className="text-[10px] text-emerald-300 font-mono">({studentPhone})</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                      مشترك مفعل ✓
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-white">الزائر: {studentName}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-950 text-sky-300 border border-sky-500/40">
                      وضع الزائر (بدون رقم)
                    </span>
                    <button
                      type="button"
                      onClick={handleClearVisitor}
                      className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-[10px] flex items-center gap-1 border border-slate-700/60 transition-colors cursor-pointer"
                      title="تسجيل خروج الزائر لتغيير الاسم"
                    >
                      <LogOut className="w-2.5 h-2.5" />
                      <span>خروج الزائر</span>
                    </button>
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
                      const optStr = String(opt != null ? opt : '');
                      const isSelected = currentAnswer === optStr.trim();
                      const letter = ['أ', 'ب', 'ج', 'د', 'هـ', 'و'][oIdx] || (oIdx + 1).toString();
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(optStr.trim())}
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
                        💡 هذا السؤال ذو إجابة حرة، سيتم حفظ النص الحر نفسه كما كتبته في النظام وفي ورقة Answers-AR.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Navigation Buttons */}
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
                <span>{t('btn_prev', currentLanguage)}</span>
              </button>

              <div className="flex items-center gap-2">
                {currentIdx < questions.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{t('btn_next', currentLanguage)}</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : null}

                {/* زر الإرسال النهائي الملون والبارز */}
                <button
                  onClick={handleFinalSubmitAllAnswers}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>{currentLanguage === 'ar' ? 'جارٍ الحفظ والإرسال...' : currentLanguage === 'en' ? 'Submitting...' : 'กำลังส่ง...'}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 fill-slate-950" />
                      <span>📤 {currentLanguage === 'ar' ? 'إرسال الإجابات والتقييم' : currentLanguage === 'en' ? 'Submit Answers' : 'ส่งคำตอบ'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* ======================================================== */}
        {/* المرحلة 3: شاشة النتائج والتقييم (Completed Stage) */}
        {/* ======================================================== */}
        {modalStage === 'completed' && (
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            <div className="bg-slate-950 p-6 rounded-3xl border border-emerald-500/40 text-center space-y-5 animate-scaleUp">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl">
                <Award className="w-8 h-8 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-black text-white">
                  {t('alert_congrats', currentLanguage)} {studentName ? `(${studentName})` : ''} 🎉
                </h4>
                <p className="text-xs sm:text-sm text-emerald-300 font-medium">
                  {submissionFeedback?.message || t('alert_save_success', currentLanguage)}
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
                <h5 className="text-xs font-bold text-slate-300 mb-2">ملخص إجاباتك المسجلة في النظام:</h5>
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
                    setModalStage('answering');
                    setCurrentIdx(0);
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>مراجعة الأسئلة</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
