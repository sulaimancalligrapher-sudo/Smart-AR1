import React, { useState, useEffect } from 'react';
import { X, BookOpen, Sparkles, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { LessonDescription } from '../types/ar';
import { analytics } from '../services/analytics';

interface ExplanationModalProps {
  description: LessonDescription;
  lessonTitle: string;
  targetId: string;
  grade?: string;
  subject?: string;
  onClose: () => void;
}

export const ExplanationModal: React.FC<ExplanationModalProps> = ({
  description,
  lessonTitle,
  targetId,
  grade,
  subject,
  onClose
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

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

  const handleSelectQuiz = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
  };

  const handleResetQuiz = () => {
    setSelectedOption(null);
    setIsAnswered(false);
  };

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

          {/* Interactive Comprehension Quiz */}
          {description.quiz && (
            <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  <span>سؤال سريع لاختبار فهمك:</span>
                </div>
                {isAnswered && (
                  <button
                    onClick={handleResetQuiz}
                    className="text-xs text-sky-400 hover:underline cursor-pointer"
                  >
                    إعادة المحاولة
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-200 font-medium mb-3">
                {description.quiz.question}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {description.quiz.options.map((opt, i) => {
                  let btnStyle = 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500';
                  if (isAnswered) {
                    if (i === description.quiz!.correctIndex) {
                      btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 font-bold';
                    } else if (i === selectedOption) {
                      btnStyle = 'bg-rose-950 border-rose-500 text-rose-200';
                    } else {
                      btnStyle = 'opacity-40 bg-slate-900 border-slate-800 text-slate-400';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={isAnswered}
                      onClick={() => handleSelectQuiz(i)}
                      className={`w-full p-2.5 rounded-lg border text-xs sm:text-sm text-right transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && i === description.quiz!.correctIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mr-2" />
                      )}
                      {isAnswered && i === selectedOption && i !== description.quiz!.correctIndex && (
                        <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mr-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {isAnswered && (
                <div className="mt-3 p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs text-slate-300 leading-relaxed">
                  <span className="font-bold text-sky-400">التوضيح: </span>
                  {description.quiz.explanation}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-xs text-slate-400">قراءة تعليمية مبسطة للطلاب</span>
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
