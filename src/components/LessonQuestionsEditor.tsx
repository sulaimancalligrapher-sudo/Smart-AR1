import React, { useState } from 'react';
import { 
  HelpCircle, Brain, Plus, Edit3, Trash2, ChevronUp, ChevronDown, CheckCircle2, 
  FileSpreadsheet, Send, Download, RefreshCw, ListFilter, User, Check,
  DownloadCloud, UploadCloud, Loader2, Image as ImageIcon, Sparkles, AlertCircle
} from 'lucide-react';
import { 
  LessonData, 
  LessonQuestion, 
  QuestionType, 
  StudentSubmission, 
  getLessonQuestions,
  LessonQuiz
} from '../types/ar';
import { 
  getStoredSubmissions, 
  saveStoredSubmissions, 
  clearAllSubmissions, 
  recordStudentSubmission 
} from '../services/studentSubmissions';
import { fetchQuestionsFromSheet, exportQuestionsToSheet } from '../services/sheetsQuestionsSync';
import { analytics } from '../services/analytics';

interface LessonQuestionsEditorProps {
  currentLesson: LessonData;
  allLessons: LessonData[];
  onUpdateQuestions: (questions: LessonQuestion[]) => void;
  onUpdateAllLessons?: (lessons: LessonData[]) => void;
  webAppUrl?: string;
  onRequestConfirm: (modalConfig: {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }) => void;
}

export const LessonQuestionsEditor: React.FC<LessonQuestionsEditorProps> = ({
  currentLesson,
  allLessons,
  onUpdateQuestions,
  onUpdateAllLessons,
  webAppUrl,
  onRequestConfirm
}) => {
  // Form State for Adding New Question
  const [newQType, setNewQType] = useState<QuestionType>('multiple_choice');
  const [newQText, setNewQText] = useState<string>('');
  const [newQImageUrl, setNewQImageUrl] = useState<string>('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectIndex, setNewQCorrectIndex] = useState<number>(0);
  const [newQCorrectAnswerText, setNewQCorrectAnswerText] = useState<string>('');
  const [newQIsFreeText, setNewQIsFreeText] = useState<boolean>(false);
  const [newQExplanation, setNewQExplanation] = useState<string>('');
  const [newQPoints, setNewQPoints] = useState<number>(1);
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);
  const [isSheetSyncing, setIsSheetSyncing] = useState<boolean>(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentQuestions = getLessonQuestions(currentLesson);

  const handleImportFromSheet = async () => {
    setIsSheetSyncing(true);
    setQuestionNotice(null);
    try {
      const targetUrl = webAppUrl || analytics.getWebAppUrl();
      const res = await fetchQuestionsFromSheet(allLessons, targetUrl);
      if (res.success && res.lessonsWithQuestions) {
        if (onUpdateAllLessons) {
          onUpdateAllLessons(res.lessonsWithQuestions);
        }
        setQuestionNotice(res.message);
      } else {
        setQuestionNotice(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setQuestionNotice(`⚠️ خطأ في الاستيراد: ${err?.message || err}`);
    } finally {
      setIsSheetSyncing(false);
      setTimeout(() => setQuestionNotice(null), 5000);
    }
  };

  const handleExportToSheet = async () => {
    setIsSheetSyncing(true);
    setQuestionNotice(null);
    try {
      const targetUrl = webAppUrl || analytics.getWebAppUrl();
      const res = await exportQuestionsToSheet(allLessons, targetUrl);
      if (res.success) {
        setQuestionNotice(res.message);
      } else {
        setQuestionNotice(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setQuestionNotice(`⚠️ خطأ في التصدير: ${err?.message || err}`);
    } finally {
      setIsSheetSyncing(false);
      setTimeout(() => setQuestionNotice(null), 5000);
    }
  };

  const handleAddQuestion = () => {
    if (!newQText.trim()) {
      setQuestionNotice('⚠️ يرجى كتابة نص السؤال أولاً');
      return;
    }

    const qId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let questionObj: LessonQuestion;
    if (newQType === 'multiple_choice') {
      const validOptions = newQOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setQuestionNotice('⚠️ يرجى إدخال خيارين على الأقل لسؤال الاختيار من متعدد');
        return;
      }
      const safeCorrectIndex = Math.min(newQCorrectIndex, validOptions.length - 1);
      questionObj = {
        id: qId,
        type: 'multiple_choice',
        question: newQText.trim(),
        imageUrl: newQImageUrl.trim() || undefined,
        options: validOptions,
        correctIndex: safeCorrectIndex,
        explanation: newQExplanation.trim() || undefined,
        points: Number(newQPoints) || 1
      };
    } else {
      if (!newQIsFreeText && !newQCorrectAnswerText.trim()) {
        setQuestionNotice('⚠️ يرجى كتابة الإجابة النموذجية أو تفعيل خيار (إجابة حرة بدون صح أو خطأ)');
        return;
      }
      questionObj = {
        id: qId,
        type: 'text_answer',
        question: newQText.trim(),
        imageUrl: newQImageUrl.trim() || undefined,
        correctAnswerText: newQIsFreeText ? undefined : newQCorrectAnswerText.trim(),
        isFreeText: newQIsFreeText,
        explanation: newQExplanation.trim() || (newQIsFreeText ? 'إجابة نصية حرة' : undefined),
        points: Number(newQPoints) || 1
      };
    }

    const updatedQuestions = [...currentQuestions, questionObj];
    onUpdateQuestions(updatedQuestions);

    setNewQText('');
    setNewQImageUrl('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrectIndex(0);
    setNewQCorrectAnswerText('');
    setNewQIsFreeText(false);
    setNewQExplanation('');
    setNewQPoints(1);
    setQuestionNotice('✓ تمت إضافة السؤال بنجاح لبنك أسئلة الدرس!');
    setTimeout(() => setQuestionNotice(null), 3500);
  };

  const handleDeleteQuestion = (qIdx: number) => {
    const targetQ = currentQuestions[qIdx];
    const qTitle = targetQ?.question || `السؤال رقم ${qIdx + 1}`;

    onRequestConfirm({
      isOpen: true,
      title: 'تأكيد حذف السؤال',
      message: `هل أنت متأكد من حذف السؤال "${qTitle.length > 50 ? qTitle.slice(0, 50) + '...' : qTitle}" من هذا الدرس؟`,
      confirmText: 'نعم، حذف السؤال',
      isDestructive: true,
      onConfirm: () => {
        const updated = currentQuestions.filter((_, i) => i !== qIdx);
        onUpdateQuestions(updated);
        setQuestionNotice('✓ تم حذف السؤال بنجاح!');
        setTimeout(() => setQuestionNotice(null), 3000);
      }
    });
  };

  const handleMoveQuestion = (qIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentQuestions.length) return;

    const copy = [...currentQuestions];
    const temp = copy[qIdx];
    copy[qIdx] = copy[targetIdx];
    copy[targetIdx] = temp;

    onUpdateQuestions(copy);
  };

  const handleUpdateQuestion = (qIdx: number, patch: Partial<LessonQuestion>) => {
    if (!currentQuestions[qIdx]) return;
    const copy = [...currentQuestions];
    copy[qIdx] = { ...copy[qIdx], ...patch };
    onUpdateQuestions(copy);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 animate-fadeIn">
      {/* رأس بنك الأسئلة مع التبديل بين القسمين */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Brain className="w-4 h-4" />
          </span>
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>🧠 بنك أسئلة الدرس (Questions-AR)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {currentQuestions.length} أسئلة للدرس
              </span>
            </h5>
            <p className="text-[11px] text-slate-300">
              قسم بناء وتحرير أسئلة هذا الدرس والمزامنة الأفقية مع ورقة Questions-AR.
            </p>
          </div>
        </div>

        {/* شارة عدد أسئلة الدرس */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold self-start sm:self-auto">
          <Edit3 className="w-3.5 h-3.5" />
          <span>بنك أسئلة الدرس ({currentQuestions.length})</span>
        </div>
      </div>

      {/* تنبيه الإشعارات */}
      {(questionNotice || statusNotice) && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{questionNotice || statusNotice}</span>
        </div>
      )}

      {/* ======================= قسم بناء وتحرير الأسئلة ======================= */}
      <div className="space-y-4">
          {/* شريط المزامنة مع ورقة Questions-AR */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>المزامنة مع ورقة الأسئلة (Questions-AR)</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                  بنية أفقية لكل درس
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                تُحفظ أسئلة كل درس أفقياً في صف واحد (صورة، نص السؤال، الخيارات، طريقة الإجابة).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleImportFromSheet}
                disabled={isSheetSyncing}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                title="جلب وتحديث الأسئلة من ورقة Questions-AR في Google Sheets"
              >
                {isSheetSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />}
                <span>استيراد من Questions-AR</span>
              </button>
              <button
                type="button"
                onClick={handleExportToSheet}
                disabled={isSheetSyncing}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-amber-600/20 active:scale-95 disabled:opacity-50"
                title="تصدير وحفظ أسئلة جميع الدروس أفقياً في ورقة Questions-AR"
              >
                {isSheetSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                <span>تحديث ورقة Questions-AR</span>
              </button>
            </div>
          </div>

          {/* قائمة الأسئلة الحالية */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                أسئلة هذا الدرس ({currentQuestions.length}):
              </span>
              <span className="text-[11px] text-slate-400">
                {currentQuestions.length === 0
                  ? '⚠️ هذا الدرس لا يحتوي على أسئلة ولن يظهر له زر الأسئلة في الكاميرا'
                  : '✓ سيظهر زر الأسئلة للطالب عند توجيه الكاميرا لصورة هذا الدرس'}
              </span>
            </div>

            {currentQuestions.length > 0 ? (
              <div className="space-y-3">
                {currentQuestions.map((q, qIdx) => {
                  const isMCQ = q.type === 'multiple_choice';
                  return (
                    <div
                      key={q.id || qIdx}
                      className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 transition-all hover:border-slate-700"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center font-mono text-xs">
                            #{qIdx + 1}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            isMCQ
                              ? 'bg-sky-950/80 text-sky-300 border-sky-500/30'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {isMCQ ? '🔘 اختيار من متعدد' : '✍️ إجابة نصية قصيرة'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({q.points || 1} درجات)
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => handleMoveQuestion(qIdx, 'up')}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="تحريك السؤال للأعلى"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={qIdx === currentQuestions.length - 1}
                            onClick={() => handleMoveQuestion(qIdx, 'down')}
                            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                            title="تحريك السؤال للأسفل"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(qIdx)}
                            className="p-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 cursor-pointer"
                            title="حذف هذا السؤال"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* رابط صورة السؤال الاختيارية */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>رابط صورة السؤال الاختيارية (العمود B, F, J في ورقة Questions-AR):</span>
                          {q.imageUrl && <span className="text-sky-400 font-semibold">توجد صورة للسؤال ✓</span>}
                        </div>
                        <input
                          type="url"
                          value={q.imageUrl || ''}
                          onChange={(e) => handleUpdateQuestion(qIdx, { imageUrl: e.target.value.trim() || undefined })}
                          placeholder="https://... رابط صورة توضيحية للسؤال (اختياري)"
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      {/* نص السؤال */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">نص السؤال:</label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIdx, { question: e.target.value })}
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                        />
                      </div>

                      {/* خيارات سؤال الاختيار من متعدد */}
                      {isMCQ && (
                        <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <label className="text-[11px] font-bold text-slate-300 block mb-1">
                            خيارات الإجابة (اضغط على الدائرة لتعيين الإجابة الصحيحة):
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {(q.options || ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4']).map((opt, optIdx) => {
                              const isCorrect = (q.correctIndex ?? 0) === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2 p-1.5 rounded-lg border transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-950/40 border-emerald-500/60'
                                      : 'bg-slate-900 border-slate-800'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct_${q.id || qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => handleUpdateQuestion(qIdx, { correctIndex: optIdx })}
                                    className="cursor-pointer text-emerald-500 focus:ring-emerald-500"
                                    title="تعيين كإجابة صحيحة"
                                  />
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const updatedOpts = [...(q.options || [])];
                                      updatedOpts[optIdx] = e.target.value;
                                      handleUpdateQuestion(qIdx, { options: updatedOpts });
                                    }}
                                    placeholder={`الخيار ${optIdx + 1}...`}
                                    className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none p-0"
                                  />
                                  {isCorrect && (
                                    <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 flex-shrink-0">
                                      ✓ الصحيح
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* سؤال الإجابة النصية القصيرة */}
                      {!isMCQ && (
                        <div className="space-y-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <label className="text-[11px] font-bold text-emerald-400">
                              الإجابة النصية (العمود E في ورقة Questions-AR):
                            </label>
                            <label className="flex items-center gap-1.5 text-xs text-sky-300 font-semibold cursor-pointer">
                              <input
                                type="checkbox"
                                checked={Boolean(q.isFreeText)}
                                onChange={(e) => handleUpdateQuestion(qIdx, {
                                  isFreeText: e.target.checked,
                                  correctAnswerText: e.target.checked ? undefined : (q.correctAnswerText || '')
                                })}
                                className="rounded text-sky-500 cursor-pointer"
                              />
                              <span>إجابة حرة مفتوحة (بدون صح/خطأ)</span>
                            </label>
                          </div>
                          {!q.isFreeText ? (
                            <input
                              type="text"
                              value={q.correctAnswerText || ''}
                              onChange={(e) => handleUpdateQuestion(qIdx, { correctAnswerText: e.target.value })}
                              placeholder="اكتب الإجابة النموذجية التي يقارن بها حل الطالب..."
                              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                            />
                          ) : (
                            <p className="text-[10px] text-sky-300">
                              💡 إجابة حرة: ستبقى الخلية E فارغة في Questions-AR وسيُحفظ نص الطالب بحرية في Answers-AR.
                            </p>
                          )}
                        </div>
                      )}

                      {/* التفسير والدرجات */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <div className="sm:col-span-3 space-y-0.5">
                          <label className="text-[10px] text-slate-400">تفسير وتعزيز الإجابة للطالب بعد الحل:</label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onChange={(e) => handleUpdateQuestion(qIdx, { explanation: e.target.value })}
                            placeholder="معلومات وتفسير يظهر للطالب بعد إرسال الإجابة..."
                            className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="sm:col-span-1 space-y-0.5">
                          <label className="text-[10px] text-slate-400">الدرجة / النقاط:</label>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={q.points || 1}
                            onChange={(e) => handleUpdateQuestion(qIdx, { points: Number(e.target.value) || 1 })}
                            className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
                لا توجد أسئلة مضافة لهذا الدرس بعد. استخدم النموذج أدناه لإضافة أسئلة.
              </div>
            )}
          </div>

          {/* نموذج إضافة سؤال جديد */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h6 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>إضافة سؤال جديد لبنك أسئلة هذا الدرس:</span>
              </h6>

              {/* اختيار نوع السؤال */}
              <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setNewQType('multiple_choice')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    newQType === 'multiple_choice'
                      ? 'bg-sky-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🔘 أسئلة اختيار من متعدد
                </button>
                <button
                  type="button"
                  onClick={() => setNewQType('text_answer')}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    newQType === 'text_answer'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ✍️ أسئلة إجابة نصية قصيرة
                </button>
              </div>
            </div>

            {/* رابط صورة السؤال الاختيارية (العمود B في ورقة Questions-AR) */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                <span>رابط صورة السؤال الاختيارية (العمود B في ورقة Questions-AR):</span>
                {newQImageUrl && (
                  <span className="text-[10px] text-sky-400 font-medium">تم إدخال رابط الصورة ✓</span>
                )}
              </label>
              <input
                type="url"
                value={newQImageUrl}
                onChange={(e) => setNewQImageUrl(e.target.value)}
                placeholder="https://... رابط صورة السؤال إن وُجدت (اختياري)"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* نص السؤال */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">نص السؤال (العمود C في ورقة Questions-AR):</label>
              <input
                type="text"
                value={newQText}
                onChange={(e) => setNewQText(e.target.value)}
                placeholder="اكتب السؤال هنا (مثال: ما هي مميزات خط الرقعة؟)..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* خيارات الاختيار من متعدد */}
            {newQType === 'multiple_choice' ? (
              <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  اكتب الخيارات (العمود D) وحدد الإجابة الصحيحة برقم الخيار (العمود E):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {newQOptions.map((opt, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-1.5 rounded-lg border ${
                        newQCorrectIndex === i
                          ? 'bg-emerald-950/40 border-emerald-500/60'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="new_q_correct_option"
                        checked={newQCorrectIndex === i}
                        onChange={() => setNewQCorrectIndex(i)}
                        className="cursor-pointer text-emerald-500 focus:ring-emerald-500"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const updated = [...newQOptions];
                          updated[i] = e.target.value;
                          setNewQOptions(updated);
                        }}
                        placeholder={`الخيار ${i + 1}...`}
                        className="flex-1 bg-transparent border-0 text-xs text-slate-200 focus:outline-none p-0"
                      />
                      {newQCorrectIndex === i && (
                        <span className="text-[10px] text-emerald-400 font-bold px-1 rounded bg-emerald-500/20 flex-shrink-0">
                          ✓ الخيار {i + 1}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[11px] font-bold text-emerald-400">
                    طريقة الإجابة النصية (العمود E في ورقة Questions-AR):
                  </label>
                  <div className="flex items-center gap-3 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                      <input
                        type="radio"
                        name="new_q_is_free"
                        checked={!newQIsFreeText}
                        onChange={() => setNewQIsFreeText(false)}
                        className="text-emerald-500"
                      />
                      <span>إجابة نموذجية محددة</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sky-300 font-semibold">
                      <input
                        type="radio"
                        name="new_q_is_free"
                        checked={newQIsFreeText}
                        onChange={() => setNewQIsFreeText(true)}
                        className="text-sky-500"
                      />
                      <span>إجابة حرة (بدون صح/خطأ)</span>
                    </label>
                  </div>
                </div>

                {!newQIsFreeText ? (
                  <div>
                    <input
                      type="text"
                      value={newQCorrectAnswerText}
                      onChange={(e) => setNewQCorrectAnswerText(e.target.value)}
                      placeholder="اكتب النص الصحيح المطلوب من الطالب لمطابقته (مثل: الخط العربي)..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      💡 تُحفظ الإجابة في العمود E، وفي ورقة Answers-AR يُسجل للحل: «صح» أو «خطأ».
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-sky-950/50 border border-sky-500/30 text-xs text-sky-200">
                    <span>💡 تكون الخلية E في الشيت فارغة، وفي ورقة Answers-AR يُسجل نص إجابة الطالب الحرة نفسه.</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <div className="sm:col-span-3 space-y-0.5">
                <label className="text-[10px] text-slate-400">تفسير وتعزيز الإجابة للطالب بعد الحل (اختياري):</label>
                <input
                  type="text"
                  value={newQExplanation}
                  onChange={(e) => setNewQExplanation(e.target.value)}
                  placeholder="معلومات توضيحية لتعزيز الفهم..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="sm:col-span-1 space-y-0.5">
                <label className="text-[10px] text-slate-400">الدرجة:</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={newQPoints}
                  onChange={(e) => setNewQPoints(Number(e.target.value) || 1)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة السؤال لبنك أسئلة الدرس</span>
              </button>
            </div>
          </div>
        </div>
      </div>
  );
};
