import React, { useState } from 'react';
import { 
  HelpCircle, Plus, Edit3, Trash2, ChevronUp, ChevronDown, CheckCircle2, 
  FileSpreadsheet, Send, Download, RefreshCw, ListFilter, User, Check
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

interface LessonQuestionsEditorProps {
  currentLesson: LessonData;
  allLessons: LessonData[];
  onUpdateQuestions: (questions: LessonQuestion[]) => void;
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
  onRequestConfirm
}) => {
  const [subTab, setSubTab] = useState<'builder' | 'submissions'>('builder');

  // Form State for Adding New Question
  const [newQType, setNewQType] = useState<QuestionType>('multiple_choice');
  const [newQText, setNewQText] = useState<string>('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectIndex, setNewQCorrectIndex] = useState<number>(0);
  const [newQCorrectAnswerText, setNewQCorrectAnswerText] = useState<string>('');
  const [newQExplanation, setNewQExplanation] = useState<string>('');
  const [newQPoints, setNewQPoints] = useState<number>(1);
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);

  // Student Submissions State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => getStoredSubmissions());
  const [submissionFilterLesson, setSubmissionFilterLesson] = useState<string>('all');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const currentQuestions = getLessonQuestions(currentLesson);

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
        options: validOptions,
        correctIndex: safeCorrectIndex,
        explanation: newQExplanation.trim() || undefined,
        points: Number(newQPoints) || 1
      };
    } else {
      if (!newQCorrectAnswerText.trim()) {
        setQuestionNotice('⚠️ يرجى كتابة الإجابة النموذجية أو الكلمات المفتاحية للسؤال النصي');
        return;
      }
      questionObj = {
        id: qId,
        type: 'text_answer',
        question: newQText.trim(),
        correctAnswerText: newQCorrectAnswerText.trim(),
        explanation: newQExplanation.trim() || undefined,
        points: Number(newQPoints) || 1
      };
    }

    const updatedQuestions = [...currentQuestions, questionObj];
    onUpdateQuestions(updatedQuestions);

    setNewQText('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrectIndex(0);
    setNewQCorrectAnswerText('');
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

  const handleRefreshSubmissions = () => {
    setSubmissions(getStoredSubmissions());
    setStatusNotice('تم تحديث قائمة إجابات الطلاب.');
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const handleClearSubmissions = () => {
    onRequestConfirm({
      isOpen: true,
      title: 'مسح سجل إجابات الطلاب',
      message: 'هل أنت متأكد من مسح جميع إجابات الطلاب المسجلة في هذا المتصفح؟',
      confirmText: 'نعم، مسح السجل',
      isDestructive: true,
      onConfirm: () => {
        clearAllSubmissions();
        setSubmissions([]);
        setStatusNotice('تم إفراغ سجل الإجابات.');
        setTimeout(() => setStatusNotice(null), 3000);
      }
    });
  };

  const handleAddSampleSubmission = () => {
    recordStudentSubmission({
      studentName: 'أحمد سلطان (طالب تجريبي)',
      studentPhone: '0551234567',
      lessonId: currentLesson.targetId || 'lesson_001',
      lessonTitle: currentLesson.title || 'درس تجريبي',
      questionId: 'q_sample_1',
      questionText: 'سؤال تجريبي لاختبار الربط وحفظ الإجابات في الشيت',
      questionType: 'multiple_choice',
      studentAnswer: 'الإجابة الأولى النموذجية',
      isCorrect: true,
      score: 1
    });
    setSubmissions(getStoredSubmissions());
    setStatusNotice('✓ تم تسجيل إجابة تجريبية وإرسالها تلقائياً إلى Google Sheets!');
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleExportSubmissionsCsv = () => {
    if (submissions.length === 0) {
      alert('لا توجد إجابات مسجلة لتصديرها.');
      return;
    }
    const headers = ['اسم الطالب', 'رقم الجوال / المشترك', 'الدرس', 'نوع السؤال', 'نص السؤال', 'إجابة الطالب', 'النتيجة', 'تاريخ ووقت الإرسال'];
    const rows = submissions.map((s) => [
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentPhone.replace(/"/g, '""')}"`,
      `"${s.lessonTitle.replace(/"/g, '""')}"`,
      `"${s.questionType === 'multiple_choice' ? 'اختيار من متعدد' : 'إجابة نصية'}"`,
      `"${s.questionText.replace(/"/g, '""')}"`,
      `"${s.studentAnswer.replace(/"/g, '""')}"`,
      `"${s.isCorrect ? 'صحيحة' : 'غير صحيحة'}"`,
      `"${new Date(s.submittedAt).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student_answers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-4 animate-fadeIn">
      {/* رأس بنك الأسئلة مع التبديل بين القسمين */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <HelpCircle className="w-4 h-4" />
          </span>
          <div>
            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
              <span>❓ بنك الأسئلة وتسجيل الإجابات</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold">
                {currentQuestions.length} أسئلة للدرس
              </span>
            </h5>
            <p className="text-[11px] text-slate-300">
              قسم بناء أسئلة الدرس (خيارات وإجابة نصية) وقسم تسجيل الإجابات المربوط بـ Google Sheets.
            </p>
          </div>
        </div>

        {/* التبديل بين القسمين */}
        <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800 text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSubTab('builder')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'builder'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>📝 قسم بناء وتحرير الأسئلة ({currentQuestions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('submissions');
              setSubmissions(getStoredSubmissions());
            }}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              subTab === 'submissions'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>📊 قسم تسجيل الإجابات ({submissions.length})</span>
          </button>
        </div>
      </div>

      {/* تنبيه الإشعارات */}
      {(questionNotice || statusNotice) && (
        <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{questionNotice || statusNotice}</span>
        </div>
      )}

      {/* ======================= 1. قسم بناء الأسئلة ======================= */}
      {subTab === 'builder' && (
        <div className="space-y-4">
          {/* قائمة الأسئلة الحالية */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                أسئلة هذا الدرس ({currentQuestions.length}):
              </span>
              <span className="text-[11px] text-slate-400">
                يمكنك تعديل أي سؤال، تحديد الخيار الصحيح، وإعادة الترتيب بالأسهم
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
                        <div className="space-y-1 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                          <label className="text-[11px] font-bold text-emerald-400">
                            الإجابة النموذجية أو الكلمات المفتاحية المقبولة:
                          </label>
                          <input
                            type="text"
                            value={q.correctAnswerText || ''}
                            onChange={(e) => handleUpdateQuestion(qIdx, { correctAnswerText: e.target.value })}
                            placeholder="اكتب الإجابة النموذجية التي يقارن بها حل الطالب..."
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
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

            {/* نص السؤال */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">نص السؤال:</label>
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
                  اكتب الخيارات وحدد الإجابة الصحيحة بالضغط على الدائرة:
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
                          ✓ الصحيح
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <label className="text-[11px] font-bold text-emerald-400">
                  الإجابة النموذجية أو الكلمات المفتاحية (يكتب الطالب الإجابة بيده):
                </label>
                <input
                  type="text"
                  value={newQCorrectAnswerText}
                  onChange={(e) => setNewQCorrectAnswerText(e.target.value)}
                  placeholder="اكتب الإجابة النموذجية التي يقارن بها حل الطالب..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
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
      )}

      {/* ======================= 2. قسم تسجيل الإجابات ======================= */}
      {subTab === 'submissions' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3 text-xs text-sky-200 leading-relaxed">
            <FileSpreadsheet className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">
                🔗 سجل إجابات الطلاب والربط التلقائي مع Google Sheets:
              </span>
              يسجل هذا الجدول إجابات الطلاب فور حلهم للأسئلة مع الاسم والرقم والنتيجة وتاريخ الإرسال، ويرسلها تلقائياً لـ Google Sheets.
            </div>
          </div>

          {/* فلاتر وأدوات السجل */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">تصفية:</span>
              <select
                value={submissionFilterLesson}
                onChange={(e) => setSubmissionFilterLesson(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="all">عرض إجابات جميع الدروس ({submissions.length})</option>
                {allLessons.map((l) => (
                  <option key={l.targetId} value={l.targetId}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRefreshSubmissions}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="تحديث البيانات"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>

              <button
                type="button"
                onClick={handleAddSampleSubmission}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="تسجيل إجابة تجريبية للتأكد من وصولها للجدول ولـ Google Sheets"
              >
                <Send className="w-3.5 h-3.5" />
                <span>🧪 إرسال إجابة تجريبية</span>
              </button>

              <button
                type="button"
                onClick={handleExportSubmissionsCsv}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="تنزيل جدول الإجابات كملف Excel / CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير CSV</span>
              </button>

              {submissions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearSubmissions}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="مسح كافة الإجابات المسجلة"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>مسح السجل</span>
                </button>
              )}
            </div>
          </div>

          {/* جدول الإجابات */}
          {submissions.length > 0 ? (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-inner">
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
                    <tr>
                      <th className="p-2.5">الطالب</th>
                      <th className="p-2.5">رقم الهاتف / المشترك</th>
                      <th className="p-2.5">الدرس</th>
                      <th className="p-2.5">السؤال</th>
                      <th className="p-2.5">إجابة الطالب</th>
                      <th className="p-2.5">التقييم</th>
                      <th className="p-2.5">تاريخ الإرسال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {submissions
                      .filter((s) => submissionFilterLesson === 'all' || s.lessonId === submissionFilterLesson)
                      .map((sub) => (
                        <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-2.5 font-bold text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                            <span>{sub.studentName}</span>
                          </td>
                          <td className="p-2.5 font-mono text-slate-300 text-[11px]">
                            {sub.studentPhone || '—'}
                          </td>
                          <td className="p-2.5 text-slate-200">
                            {sub.lessonTitle}
                          </td>
                          <td className="p-2.5 text-slate-300 max-w-[200px] truncate" title={sub.questionText}>
                            {sub.questionText}
                          </td>
                          <td className="p-2.5 text-amber-200 font-semibold max-w-[150px] truncate" title={sub.studentAnswer}>
                            {sub.studentAnswer}
                          </td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.isCorrect
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                            }`}>
                              {sub.isCorrect ? '✓ صحيحة' : '✗ خاطئة'}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-400 font-mono text-[10px]">
                            {new Date(sub.submittedAt).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
              <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-bold text-slate-300">لا توجد إجابات مسجلة بعد</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                عندما يجيب الطلاب على الأسئلة في التطبيق ستظهر إجاباتهم هنا فوراً، أو يمكنك الضغط على <strong>[ 🧪 إرسال إجابة تجريبية ]</strong> للتأكد من الجدول والربط بشيت قوقل.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
