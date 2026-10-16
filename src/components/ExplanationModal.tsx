import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, AlertCircle, HelpCircle, Send, Award, User, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react';
import { LessonDescription, LessonQuestion } from '../types/ar';
import { analytics } from '../services/analytics';
import { recordStudentSubmission } from '../services/studentSubmissions';

interface ExplanationModalProps {
  description: LessonDescription;
  lessonTitle: string;
  targetId: string;
  grade?: string;
  subject?: string;
  questions?: LessonQuestion[];
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  description,
  lessonTitle,
  targetId,
  grade,
  subject,
  questions = [],
  onClose
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  // Convert fallback description.quiz to questions array if questions prop is empty
  const activeQuestions: LessonQuestion[] = React.useMemo(() => {
    if (questions && questions.length > 0) {
      return questions;
    }
    if (description.quiz?.question?.trim()) {
      return [{
        id: `quiz_${targetId}_1`,
        type: 'multiple_choice',
        question: description.quiz.question,
        options: description.quiz.options || ['الخيار 1', 'الخيار 2'],
        correctIndex: description.quiz.correctIndex ?? 0,
        explanation: description.quiz.explanation || '',
        points: 1
      }];
    }
    return [];
  }, [questions, description.quiz, targetId]);

  // Student Identity state
  const [studentName, setStudentName] = useState(() => {
    return localStorage.getItem('ar_student_name') || '';
  });
  const [studentPhone, setStudentPhone] = useState(() => {
    return localStorage.getItem('ar_student_phone') || '';
  });
  const [showIdentityInputs, setShowIdentityInputs] = useState(false);

  // Question navigation and state
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answersState, setAnswersState] = useState<Record<number, {
    selectedOption?: number;
    textAnswer?: string;
    isAnswered: boolean;
    isCorrect: boolean;
    score: number;
  }>>({});
  const [currentTextDraft, setCurrentTextDraft] = useState('');

  useEffect(() => {
    analytics.trackEvent({
      targetId,
      lessonTitle,
      action: 'explanation_open'
    });

    return () => {
      analytics.trackEvent({
        targetId,
        lessonTitle,
        action: 'content_close'
      });
    };
  }, [targetId, lessonTitle]);

  // Save student credentials to local storage
  const handleSaveStudentIdentity = (name: string, phone: string) => {
    setStudentName(name);
    setStudentPhone(phone);
    try {
      localStorage.setItem('ar_student_name', name);
      localStorage.setItem('ar_student_phone', phone);
    } catch (_) {}
  };

  const currentQ = activeQuestions[currentQIndex];
  const currentAnswer = answersState[currentQIndex];

  // Submit Multiple Choice Answer
  const handleSelectOption = (optIndex: number) => {
    if (!currentQ || currentAnswer?.isAnswered) return;

    const isCorrect = optIndex === (currentQ.correctIndex ?? 0);
    const score = isCorrect ? (currentQ.points ?? 1) : 0;
    const selectedText = currentQ.options?.[optIndex] || `خيار ${optIndex + 1}`;

    setAnswersState((prev) => ({
      ...prev,
      [currentQIndex]: {
        selectedOption: optIndex,
        isAnswered: true,
        isCorrect,
        score
      }
    }));

    // Record submission
    recordStudentSubmission({
      studentName: studentName.trim() || 'طالب زائر',
      studentPhone: studentPhone.trim() || 'غير مسجل',
      lessonId: targetId,
      lessonTitle,
      questionId: currentQ.id,
      questionText: currentQ.question,
      questionType: currentQ.type,
      studentAnswer: selectedText,
      isCorrect,
      score
    });
  };

  // Submit Text Answer
  const handleSubmitTextAnswer = () => {
    if (!currentQ || !currentTextDraft.trim() || currentAnswer?.isAnswered) return;

    const trimmedInput = currentTextDraft.trim().toLowerCase();
    const model = (currentQ.correctAnswerText || '').trim().toLowerCase();

    // Check match or keywords
    let isCorrect = false;
    if (model && (trimmedInput === model || trimmedInput.includes(model) || model.includes(trimmedInput))) {
      isCorrect = true;
    }

    const score = isCorrect ? (currentQ.points ?? 1) : 0;

    setAnswersState((prev) => ({
      ...prev,
      [currentQIndex]: {
        textAnswer: currentTextDraft.trim(),
        isAnswered: true,
        isCorrect,
        score
      }
    }));

    // Record submission
    recordStudentSubmission({
      studentName: studentName.trim() || 'طالب زائر',
      studentPhone: studentPhone.trim() || 'غير مسجل',
      lessonId: targetId,
      lessonTitle,
      questionId: currentQ.id,
      questionText: currentQ.question,
      questionType: currentQ.type,
      studentAnswer: currentTextDraft.trim(),
      isCorrect,
      score
    });
  };

  // Reset current question
  const handleResetCurrent = () => {
    setAnswersState((prev) => {
      const next = { ...prev };
      delete next[currentQIndex];
      return next;
    });
    setCurrentTextDraft('');
  };

  // Calculate total score
  const totalScore = Object.values(answersState).reduce((acc, a) => acc + (a.score || 0), 0);
  const totalPossiblePoints = activeQuestions.reduce((acc, q) => acc + (q.points ?? 1), 0);
  const answeredCount = Object.keys(answersState).length;

  const textSizeClasses = fontSize === 'large'
    ? 'text-base sm:text-lg leading-relaxed'
    : 'text-sm sm:text-base leading-relaxed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{lessonTitle}</h3>
              <p className="text-xs text-slate-400 truncate">{subject} · {grade}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font size toggles */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setFontSize('normal')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${fontSize === 'normal' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="حجم خط عادي"
              >
                عادي
              </button>
              <button
                onClick={() => setFontSize('large')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${fontSize === 'large' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                title="حجم خط كبير"
              >
                كبير +
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
              aria-label="إغلاق الشرح"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Summary Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1.5">
              <Sparkles className="w-4 h-4" />
              <span>ملخص الدرس السريع</span>
            </div>
            <p className={`${textSizeClasses} text-indigo-100/90 font-medium`}>
              {description.summary}
            </p>
          </div>

          {/* Key Points */}
          {description.keyPoints && description.keyPoints.length > 0 && (
            <div>
              <h4 className="text-sm sm:text-base font-bold text-white mb-2.5 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                النقاط والمفاهيم الأساسية:
              </h4>
              <ul className="space-y-2">
                {description.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed text-slate-300">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Full Text Explanation */}
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              الشرح التعليمي المفصل:
            </h4>
            <div className={`text-slate-300 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 ${textSizeClasses}`}>
              <p className="leading-loose whitespace-pre-line">
                {description.fullText}
              </p>
            </div>
          </div>

          {/* Fun Fact Card */}
          {description.funFact && (
            <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <h5 className="font-bold text-amber-400 text-xs sm:text-sm mb-1">هل تعلم يا بطل؟</h5>
                <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                  {description.funFact}
                </p>
              </div>
            </div>
          )}

          {/* Interactive Questions Bank Section */}
          {activeQuestions.length > 0 && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 shadow-lg space-y-4">
              {/* Question Bank Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span>بنك أسئلة الدرس</span>
                    <span className="text-xs text-slate-400 font-normal mr-2">
                      (السؤال {currentQIndex + 1} من {activeQuestions.length})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Student Identity Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowIdentityInputs(!showIdentityInputs)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-sky-400" />
                    <span>{studentName.trim() ? studentName : 'تسجيل اسمك للنتيجة'}</span>
                  </button>

                  {/* Reset button if answered */}
                  {currentAnswer?.isAnswered && (
                    <button
                      type="button"
                      onClick={handleResetCurrent}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                      title="إعادة محاولة هذا السؤال"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>إعادة</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Student Identity Inline Card */}
              {showIdentityInputs && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">اسم الطالب / المشترك:</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => handleSaveStudentIdentity(e.target.value, studentPhone)}
                      placeholder="مثال: أحمد محمد"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">رقم الطالب / الهاتف:</label>
                    <input
                      type="text"
                      value={studentPhone}
                      onChange={(e) => handleSaveStudentIdentity(studentName, e.target.value)}
                      placeholder="مثال: 0501234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>
              )}

              {/* Question Navigation Pills */}
              {activeQuestions.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {activeQuestions.map((q, idx) => {
                    const ans = answersState[idx];
                    let pillColor = 'bg-slate-800 text-slate-400 border-slate-700';
                    if (ans?.isAnswered) {
                      pillColor = ans.isCorrect
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                        : 'bg-rose-950/80 text-rose-300 border-rose-500/50';
                    } else if (idx === currentQIndex) {
                      pillColor = 'bg-sky-600 text-white border-sky-400 font-bold';
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCurrentQIndex(idx);
                          setCurrentTextDraft('');
                        }}
                        className={`px-3 py-1 rounded-lg text-xs border transition-all cursor-pointer flex items-center gap-1 shrink-0 ${pillColor}`}
                      >
                        <span>س{idx + 1}</span>
                        {ans?.isAnswered && (
                          <span>{ans.isCorrect ? '✓' : '✗'}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Current Question Body */}
              {currentQ && (
                <div className="space-y-3">
                  {/* Badges: Type & Points */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800">
                      {currentQ.type === 'multiple_choice' ? 'اختيار من متعدد' : 'إجابة نصية قصيرة'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                      {currentQ.points ?? 1} درجة
                    </span>
                  </div>

                  {/* Question Text */}
                  <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {currentQ.question}
                  </p>

                  {/* Mode 1: Multiple Choice Options */}
                  {currentQ.type === 'multiple_choice' && currentQ.options && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {currentQ.options.map((opt, optIdx) => {
                        let btnStyle = 'bg-slate-900 border-slate-800 text-slate-200 hover:border-slate-600 hover:bg-slate-850';
                        if (currentAnswer?.isAnswered) {
                          if (optIdx === (currentQ.correctIndex ?? 0)) {
                            btnStyle = 'bg-emerald-950/90 border-emerald-500 text-emerald-200 font-bold';
                          } else if (optIdx === currentAnswer.selectedOption) {
                            btnStyle = 'bg-rose-950/90 border-rose-500 text-rose-200';
                          } else {
                            btnStyle = 'opacity-40 bg-slate-900 border-slate-800 text-slate-400';
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            disabled={currentAnswer?.isAnswered}
                            onClick={() => handleSelectOption(optIdx)}
                            className={`w-full p-3 rounded-xl border text-xs sm:text-sm text-right transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {currentAnswer?.isAnswered && optIdx === (currentQ.correctIndex ?? 0) && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-2" />
                            )}
                            {currentAnswer?.isAnswered && optIdx === currentAnswer.selectedOption && optIdx !== (currentQ.correctIndex ?? 0) && (
                              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mr-2" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Mode 2: Short Text Answer */}
                  {currentQ.type === 'text_answer' && (
                    <div className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          disabled={currentAnswer?.isAnswered}
                          value={currentAnswer?.isAnswered ? (currentAnswer.textAnswer || '') : currentTextDraft}
                          onChange={(e) => setCurrentTextDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSubmitTextAnswer();
                          }}
                          placeholder="اكتب إجابتك هنا يا بطل..."
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                        />
                        {!currentAnswer?.isAnswered && (
                          <button
                            type="button"
                            disabled={!currentTextDraft.trim()}
                            onClick={handleSubmitTextAnswer}
                            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>إرسال</span>
                          </button>
                        )}
                      </div>

                      {/* Model answer reveal if answered */}
                      {currentAnswer?.isAnswered && (
                        <div className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                          currentAnswer.isCorrect
                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                            : 'bg-amber-950/60 border-amber-500/40 text-amber-200'
                        }`}>
                          <div className="font-bold flex items-center gap-1 mb-1">
                            {currentAnswer.isCorrect ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span>إجابة رائعة وصحيحة! 🎉</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                <span>محاولة جيدة! نموذج الإجابة النموذجي:</span>
                              </>
                            )}
                          </div>
                          {currentQ.correctAnswerText && (
                            <p className="font-mono bg-slate-950/50 p-1.5 rounded-lg text-slate-300">
                              {currentQ.correctAnswerText}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explanation card upon answering */}
                  {currentAnswer?.isAnswered && currentQ.explanation && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-sky-400">💡 التوضيح والشرح: </span>
                      {currentQ.explanation}
                    </div>
                  )}

                  {/* Next / Previous Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <button
                      type="button"
                      disabled={currentQIndex === 0}
                      onClick={() => {
                        setCurrentQIndex((prev) => Math.max(0, prev - 1));
                        setCurrentTextDraft('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <span>السابق</span>
                    </button>

                    <div className="flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                      <span>درجتك: {totalScore} من {totalPossiblePoints}</span>
                    </div>

                    <button
                      type="button"
                      disabled={currentQIndex >= activeQuestions.length - 1}
                      onClick={() => {
                        setCurrentQIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1));
                        setCurrentTextDraft('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>التالي</span>
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Total Quiz Completion Banner */}
              {answeredCount === activeQuestions.length && activeQuestions.length > 0 && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 to-sky-950/50 border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>أحسنت! أكملت جميع أسئلة هذا الدرس</span>
                  </div>
                  <div className="text-white font-mono font-bold bg-emerald-600/30 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                    مجموع النقاط: {totalScore} / {totalPossiblePoints}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">قراءة تعليمية وبنك أسئلة تفاعلي</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ إغلاق الشرح
          </button>
        </div>
      </div>
    </div>
  );
};

