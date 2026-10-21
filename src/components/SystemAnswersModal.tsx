import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  X,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Clock,
  User,
  Phone,
  BookOpen,
  ArrowUpDown,
  Send,
  Sparkles,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor
} from 'lucide-react';
import { SystemAnswerRecord, LessonData } from '../types/ar';
import {
  getStoredSystemAnswers,
  clearAllSystemAnswers,
  updateSystemAnswerSyncStatus
} from '../services/studentSubmissions';
import { analytics } from '../services/analytics';
import { fetchAnswersFromSheet } from '../services/sheetsQuestionsSync';

interface SystemAnswersModalProps {
  isOpen: boolean;
  lessons: LessonData[];
  onClose: () => void;
}

export const SystemAnswersModal: React.FC<SystemAnswersModalProps> = ({
  isOpen,
  lessons,
  onClose
}) => {
  const [answers, setAnswers] = useState<SystemAnswerRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterLesson, setFilterLesson] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isFetchingFromSheet, setIsFetchingFromSheet] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const loadData = () => {
    setAnswers(getStoredSystemAnswers());
  };

  const handleFetchFromSheet = async () => {
    setIsFetchingFromSheet(true);
    setSyncFeedback(null);
    try {
      const res = await fetchAnswersFromSheet();
      if (res.success && res.records) {
        setAnswers(res.records);
        setSyncFeedback(`✓ تم تحديث السجلات بنجاح من ورقة Answers-AR (${res.records.length} سجل متاح)!`);
      } else {
        setSyncFeedback(res.message);
      }
    } catch (e: any) {
      setSyncFeedback(`تعذر جلب السجلات: ${e?.message || 'تأكد من الاتصال'}`);
    } finally {
      setIsFetchingFromSheet(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // تحديث تلقائي لجلب إجابات الطلاب التي تمت من الجوال أو التابلت
      fetchAnswersFromSheet().then((res) => {
        if (res.success && res.records && res.records.length > 0) {
          setAnswers(res.records);
        }
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // فلاتر البحث والدروس
  const filteredAnswers = answers.filter((a) => {
    const matchesSearch =
      !searchQuery.trim() ||
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentPhone.includes(searchQuery) ||
      a.lessonTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLesson =
      filterLesson === 'all' ||
      a.lessonTitle.trim() === filterLesson.trim();

    return matchesSearch && matchesLesson;
  });

  // حساب أقصى عدد أسئلة في السجلات المعروضة لتشكيل الأعمدة
  const maxQuestionCount = Math.max(
    3,
    ...filteredAnswers.map((a) => (Array.isArray(a.answerColumns) ? a.answerColumns.length : 0))
  );

  // إعادة مزامنة كافة السجلات غير المزمنة مع Google Sheets (Answers-AR)
  const handleSyncAllToSheet = async () => {
    const webAppUrl = analytics.getWebAppUrl();
    if (!webAppUrl) {
      setSyncFeedback('⚠️ رابط Google Apps Script غير مضبوط في الإعدادات.');
      return;
    }

    setIsSyncing(true);
    setSyncFeedback(null);
    let successCount = 0;

    for (const item of answers) {
      try {
        const getUrl = new URL(webAppUrl);
        getUrl.searchParams.set('action', 'submitAnswers');
        getUrl.searchParams.set('timestamp', item.timestamp);
        getUrl.searchParams.set('studentPhone', item.studentPhone || '');
        getUrl.searchParams.set('studentName', item.studentName || 'زائر');
        getUrl.searchParams.set('lessonTitle', item.lessonTitle);
        getUrl.searchParams.set('answerColumns', JSON.stringify(item.answerColumns || []));
        getUrl.searchParams.set('_r', Date.now().toString());

        await fetch(getUrl.toString(), {
          method: 'GET',
          mode: 'no-cors',
          cache: 'no-cache',
          keepalive: true
        });

        updateSystemAnswerSyncStatus(item.id, true);
        successCount++;
      } catch (err) {
        console.warn('Sync item error:', err);
      }
    }

    setIsSyncing(false);
    loadData();
    setSyncFeedback(`✓ تمت مزامنة ${successCount} سجل بنجاح مع ورقة Answers-AR في Google Sheets!`);
  };

  // تصدير جدول النظام كملف CSV متطابق تماماً مع هيكل Answers-AR
  const handleExportCSV = () => {
    if (filteredAnswers.length === 0) return;

    const headers = [
      'تاريخ ووقت التسجيل',
      'رقم الطالب',
      'اسم المستخدم',
      'نوع الجهاز',
      'موضوع الحصة'
    ];
    for (let i = 1; i <= maxQuestionCount; i++) {
      headers.push(`إجابة السؤال ${i}`);
    }

    const rows = filteredAnswers.map((a) => {
      const base = [
        `"${a.timestamp}"`,
        `"${a.studentPhone || ''}"`,
        `"${a.studentName || 'زائر'}"`,
        `"${a.device || 'غير محدد'}"`,
        `"${a.lessonTitle}"`
      ];
      const ansCols = Array.isArray(a.answerColumns) ? a.answerColumns : [];
      for (let i = 0; i < maxQuestionCount; i++) {
        base.push(`"${ansCols[i] || ''}"`);
      }
      return base.join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Answers-AR_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = () => {
    if (window.confirm('هل أنت متأكد من مسح جميع سجلات الإجابات المحفوظة في النظام محلياً؟')) {
      clearAllSystemAnswers();
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div 
        className="w-full max-w-6xl bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner">
              <FileSpreadsheet className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  قسم تسجيل إجابات الطلاب (Answers-AR)
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  {answers.length} سجل
                </span>
              </div>
              <p className="text-xs text-slate-400">
                جدول النظام الشامل لحفظ إجابات جميع الطلاب والزوار لجميع الدروس متطابقاً مع هيكل Google Sheets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Sync Banner */}
        <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>الهيكل المعتمد:</strong> العمود A (تاريخ ووقت) | العمود B (رقم الطالب) | العمود C (اسم المستخدم) | العمود D (موضوع الحصة) | E وما بعده (إجابات الأسئلة)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFetchFromSheet}
              disabled={isFetchingFromSheet}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
              title="جلب وتحديث كافة سجلات الطلاب والزوار المسجلة من كافة الأجهزة (جوالات، أجهزة لوحية، كمبيوتر) من ورقة Answers-AR"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFromSheet ? 'animate-spin' : ''}`} />
              <span>{isFetchingFromSheet ? 'جارٍ الجلب من الشيت...' : '📥 جلب من Google Sheets'}</span>
            </button>

            <button
              onClick={handleSyncAllToSheet}
              disabled={isSyncing || answers.length === 0}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm"
              title="إعادة إرسال السجلات المحلية غير المزمنة إلى ورقة Answers-AR في Google Sheets"
            >
              <Send className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جارٍ الإرسال...' : '📤 إرسال للشيت'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredAnswers.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="تصدير كملف CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={handleClearAll}
              disabled={answers.length === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40"
              title="مسح كافة السجلات"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح السجل</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="px-6 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Toolbar: Filters & Search */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="بحث باسم الطالب، رقم الهاتف، أو اسم الدرس..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-slate-400">تصفية حسب الدرس:</span>
            <select
              value={filterLesson}
              onChange={(e) => setFilterLesson(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">جميع الدروس ({answers.length})</option>
              {lessons.map((l, idx) => (
                <option key={l.targetId || idx} value={l.title}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-auto p-4">
          {filteredAnswers.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center space-y-3 text-slate-500">
              <FileSpreadsheet className="w-12 h-12 stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-400">لا توجد سجلات إجابات مسجلة حالياً</p>
              <p className="text-xs max-w-sm">
                عندما يجيب الزوار أو المشتركون على أسئلة أي درس، ستظهر إجاباتهم مباشرة هنا في جدول النظام بالترتيب.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
              <div className="overflow-x-auto max-h-[58vh]">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-800 shadow-sm">
                    <tr>
                      <th className="p-3 whitespace-nowrap bg-slate-950">
                        <span className="text-amber-400 font-mono text-[11px] block">العمود A</span>
                        تاريخ ووقت التسجيل
                      </th>
                      <th className="p-3 whitespace-nowrap bg-slate-950">
                        <span className="text-amber-400 font-mono text-[11px] block">العمود B</span>
                        رقم الطالب
                      </th>
                      <th className="p-3 whitespace-nowrap bg-slate-950">
                        <span className="text-amber-400 font-mono text-[11px] block">العمود C</span>
                        اسم المستخدم
                      </th>
                      <th className="p-3 whitespace-nowrap bg-slate-950 text-center">
                        <span className="text-amber-400 font-mono text-[11px] block">كشف النظام</span>
                        الجهاز
                      </th>
                      <th className="p-3 whitespace-nowrap bg-slate-950">
                        <span className="text-amber-400 font-mono text-[11px] block">العمود D</span>
                        موضوع الحصة
                      </th>
                      {Array.from({ length: maxQuestionCount }).map((_, qIdx) => {
                        const colLetter = String.fromCharCode(69 + qIdx); // 69 = E
                        return (
                          <th key={qIdx} className="p-3 whitespace-nowrap bg-slate-950 text-center min-w-[110px]">
                            <span className="text-amber-400 font-mono text-[11px] block">العمود {colLetter}</span>
                            إجابة سؤال {qIdx + 1}
                          </th>
                        );
                      })}
                      <th className="p-3 whitespace-nowrap bg-slate-950 text-center">
                        حالة الشيت
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 font-medium">
                    {filteredAnswers.map((row, rIdx) => {
                      const ansCols = Array.isArray(row.answerColumns) ? row.answerColumns : [];
                      const isVisitor = !row.studentPhone || row.studentName === 'زائر';
                      return (
                        <tr key={row.id || rIdx} className="hover:bg-slate-800/60 transition-colors">
                          <td className="p-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                            {row.timestamp}
                          </td>
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap">
                            {row.studentPhone ? (
                              <span className="text-emerald-300 font-bold">{row.studentPhone}</span>
                            ) : (
                              <span className="text-slate-500 italic">(فارغ - زائر)</span>
                            )}
                          </td>
                          <td className="p-3 font-bold whitespace-nowrap">
                            {isVisitor ? (
                              <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 text-[11px]">
                                {row.studentName || 'زائر'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px]">
                                {row.studentName}
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            {row.device?.includes('جوال') || row.device?.includes('Mobile') ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-500/40 text-[11px] font-bold shadow-sm">
                                <Smartphone className="w-3.5 h-3.5 text-violet-400" />
                                جوال
                              </span>
                            ) : row.device?.includes('تابلت') || row.device?.includes('Tablet') || row.device?.includes('لوحي') ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/40 text-[11px] font-bold shadow-sm">
                                <Tablet className="w-3.5 h-3.5 text-amber-400" />
                                تابلت
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
                                <Monitor className="w-3.5 h-3.5 text-slate-400" />
                                كمبيوتر
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-bold text-white whitespace-nowrap">
                            {row.lessonTitle}
                          </td>
                          {Array.from({ length: maxQuestionCount }).map((_, qIdx) => {
                            const val = (ansCols[qIdx] || '').trim();
                            const isCorrect = val === 'صح';
                            const isWrong = val === 'خطأ';
                            return (
                              <td key={qIdx} className="p-3 text-center whitespace-nowrap">
                                {isCorrect ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold">
                                    صح ✓
                                  </span>
                                ) : isWrong ? (
                                  <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-500/40 text-[11px] font-bold">
                                    خطأ ✗
                                  </span>
                                ) : val ? (
                                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-200 border border-slate-700 text-[11px] max-w-[130px] truncate inline-block" title={val}>
                                    {val}
                                  </span>
                                ) : (
                                  <span className="text-slate-600 text-[10px]">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center whitespace-nowrap">
                            {row.syncedToSheet ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                سحابي ✓
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40 font-bold inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                محلي في النظام
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            يتم تسجيل كل إجابة في هذا الجدول فورياً وتلقائياً بنمط صف لكل حصة متطابقاً مع ورقة Answers-AR.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
