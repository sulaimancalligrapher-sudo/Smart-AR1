import React, { useState, useEffect } from 'react';
import { 
  X, Database, Send, Trash2, CheckCircle2, AlertCircle, Copy, Check, 
  FileSpreadsheet, ExternalLink, BookOpen, Edit3, Image, Video, Music, 
  HelpCircle, Save, Download, Sparkles, Layers 
} from 'lucide-react';
import { analytics } from '../services/analytics';
import { AnalyticsLogItem, LessonData } from '../types/ar';
import { targetCompiler, CompileProgress } from '../services/targetCompiler';

interface TeacherConsoleModalProps {
  lessons?: LessonData[];
  onUpdateLessons?: (lessons: LessonData[]) => void;
  onClose: () => void;
}

export const TeacherConsoleModal: React.FC<TeacherConsoleModalProps> = ({
  lessons = [],
  onUpdateLessons,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'sheets' | 'lessons'>('sheets');
  const [webAppUrl, setWebAppUrl] = useState(analytics.getWebAppUrl());
  const [logs, setLogs] = useState<AnalyticsLogItem[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lesson Editor State
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [editableLessons, setEditableLessons] = useState<LessonData[]>(lessons);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compiler State
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState<CompileProgress | null>(null);
  const [compiledBlob, setCompiledBlob] = useState<Blob | null>(null);

  useEffect(() => {
    setEditableLessons(lessons);
  }, [lessons]);

  useEffect(() => {
    const unsubscribe = analytics.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.setWebAppUrl(webAppUrl);
    setTestResult('تم حفظ رابط Google Apps Script Web App بنجاح.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await analytics.trackEvent({
        targetId: 'lesson_001',
        lessonTitle: 'دورة الماء (اختبار اتصال)',
        action: 'target_detected'
      });
      setTestResult('✓ تم إرسال حدث الاختبار بنجاح إلى السجل ورابط السكريبت!');
    } catch (err) {
      setTestResult('تعذر الإرسال: ' + String(err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLessonChanges = () => {
    if (onUpdateLessons) {
      onUpdateLessons(editableLessons);
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditableLessons((prev) => {
      const updated = [...prev];
      const cur = { ...updated[selectedLessonIndex] };
      if (field === 'title') cur.title = value;
      else if (field === 'subtitle') cur.subtitle = value;
      else if (field === 'subject') cur.subject = value;
      else if (field === 'grade') cur.grade = value;
      else if (field === 'targetImage') cur.targetImage = value;
      else if (field === 'videoUrl') {
        cur.video = {
          ...cur.video,
          url: value,
          embedUrl: value.includes('watch?v=')
            ? value.replace('watch?v=', 'embed/').split('&')[0] + '?autoplay=1&rel=0'
            : value
        };
      } else if (field === 'audioUrl') {
        cur.audio = { ...cur.audio, url: value };
      } else if (field === 'summary') {
        cur.description = { ...cur.description, summary: value };
      }
      updated[selectedLessonIndex] = cur;
      return updated;
    });
  };

  const handleCompileTargets = async () => {
    try {
      setIsCompiling(true);
      setCompileProgress({ percent: 10, statusText: 'بدء تحليل صور الدروس...' });

      const allImages = editableLessons.map((l) => l.targetImage);
      const res = await targetCompiler.compileImages(allImages, (progress) => {
        setCompileProgress(progress);
      });

      setCompiledBlob(res.blob);
      setIsCompiling(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      alert('خطأ أثناء التجميع: ' + (err.message || String(err)));
      setIsCompiling(false);
      setCompileProgress(null);
    }
  };

  const handleDownloadMind = () => {
    if (!compiledBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(compiledBlob);
    a.download = 'targets.mind';
    a.click();
  };

  const handleDownloadContentJson = () => {
    const jsonStr = JSON.stringify(editableLessons, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    a.click();
  };

  const copyCodeSample = () => {
    const code = `// Google Apps Script - Code.gs
var SHEET_NAME = "Events";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.session_id || "session",
      data.target_id || "lesson",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentLesson = editableLessons[selectedLessonIndex] || editableLessons[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">لوحة تحكم المعلم وإدارة المنظومة التعليمية</h3>
              <p className="text-xs text-slate-400">إدارة وتعديل بيانات الدروس، ربط صور الكتب المدرسية، وتحليلات Google Sheets</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-3 bg-slate-800/40 border-b border-slate-700/40">
          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sheets'
                ? 'bg-slate-900 text-emerald-400 border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>ربط وسجل Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('lessons')}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'lessons'
                ? 'bg-slate-900 text-sky-400 border-slate-700 shadow-md'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>محرر الدروس وربط صور الكتب (Targets Editor)</span>
          </button>
        </div>

        {/* Tab 1: Google Sheets Analytics */}
        {activeTab === 'sheets' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            {/* Configuration Form */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>رابط نشر Google Apps Script Web App (API URL)</span>
                </h4>
                <button
                  type="button"
                  onClick={copyCodeSample}
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'تم نسخ كود السكريبت' : 'نسخ كود Apps Script'}
                </button>
              </div>

              <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  حفظ الرابط
                </button>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse' : ''}`} />
                  <span>{isTesting ? 'جارٍ الإرسال...' : 'إرسال حدث تجريبي'}</span>
                </button>
              </form>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.includes('✓') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                }`}>
                  {testResult.includes('✓') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult}</span>
                </div>
              )}
            </div>

            {/* Live Logs Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>سجل الأحداث المباشر في الجلسة الحالية</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-400">
                    {logs.length} حدث
                  </span>
                </h4>
                {logs.length > 0 && (
                  <button
                    onClick={() => analytics.clearLogs()}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 text-slate-500 text-xs">
                  لا توجد أحداث مسجلة بعد. وجّه الكاميرا إلى أي بطاقة درس ليتم تسجيل التعرف تلقائياً.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">الوقت</th>
                          <th className="p-2.5">الدرس</th>
                          <th className="p-2.5">الحدث</th>
                          <th className="p-2.5">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {logs.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                              {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                            </td>
                            <td className="p-2.5 font-bold text-white">{item.lesson_title}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800/50 text-[10px]">
                                {item.action}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] ${
                                item.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {item.status === 'sent' ? '✓ تم الإرسال للجدول' : 'قيد الانتظار'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Lessons Manager & Targets Linker */}
        {activeTab === 'lessons' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            {/* Guide Banner */}
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-200 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">💡 كيف تربط صور كتابك المدرسي بأي درس؟</span>
                كل درس يرتبط بـ <strong>(Target Index)</strong> من ملف البصمات <code className="text-sky-300">targets.mind</code>.
                يمكنك هنا تغيير صورة أي درس، تعديل عنوانه وفيديوهاته، ثم الضغط على <strong>[ ⚡ تجميع وتحديث بصمات الصور تلقائياً ]</strong> ليتعرف عليها محرك الكاميرا فوراً!
              </div>
            </div>

            {/* Lessons Selector Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {editableLessons.map((l, idx) => {
                const isSelected = selectedLessonIndex === idx;
                return (
                  <button
                    key={l.targetId}
                    type="button"
                    onClick={() => setSelectedLessonIndex(idx)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500 text-white shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-sky-400 font-bold">
                      Target #{l.targetIndex}
                    </span>
                    <span className="text-xs font-bold text-slate-100 truncate mt-1">
                      {l.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Current Lesson Edit Form */}
            {currentLesson && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>تعديل بيانات: {currentLesson.title} (Target #{currentLesson.targetIndex})</span>
                  </h4>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                    ID: {currentLesson.targetId}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lesson Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">عنوان الدرس:</label>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Target Image Path / URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">مسار أو رابط صورة الهدف (Target Image):</label>
                    <input
                      type="text"
                      value={currentLesson.targetImage}
                      onChange={(e) => handleFieldChange('targetImage', e.target.value)}
                      placeholder="/targets/target_lesson_002.jpg"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* YouTube Video URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">رابط فيديو YouTube التعليمي:</label>
                    <input
                      type="url"
                      value={currentLesson.video.url}
                      onChange={(e) => handleFieldChange('videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Audio URL */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">رابط ملف الصوت (MP3 / OGG):</label>
                    <input
                      type="url"
                      value={currentLesson.audio.url}
                      onChange={(e) => handleFieldChange('audioUrl', e.target.value)}
                      placeholder="https://.../sound.ogg"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Subject and Grade */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">المادة الدراسية:</label>
                    <input
                      type="text"
                      value={currentLesson.subject}
                      onChange={(e) => handleFieldChange('subject', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الصف الدراسي:</label>
                    <input
                      type="text"
                      value={currentLesson.grade}
                      onChange={(e) => handleFieldChange('grade', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-300">ملخص وشرح الدرس:</label>
                    <textarea
                      rows={2}
                      value={currentLesson.description.summary}
                      onChange={(e) => handleFieldChange('summary', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Target Image Preview Box */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={currentLesson.targetImage}
                        alt={currentLesson.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">معاينة صورة الهدف الحالي</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        هذه هي الصورة التي ستبحث عنها الكاميرا لفتح هذا الدرس تحديداً
                      </p>
                    </div>
                  </div>

                  {/* Preset quick image selection */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('targetImage', '/targets/target_lesson_002.jpg')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-sky-300 border border-slate-700 cursor-pointer"
                    >
                      صورة المجموعة الشمسية
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('targetImage', '/targets/target_sample_bear.png')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-emerald-300 border border-slate-700 cursor-pointer"
                    >
                      صورة الدب
                    </button>
                  </div>
                </div>

                {/* Action Buttons for Lessons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveLessonChanges}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ تعديلات الدروس في الجلسة</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadContentJson}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل content.json</span>
                    </button>
                  </div>

                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4" />
                      تم الحفظ والتحديث بنجاح!
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* In-Browser MindAR Targets Compiler Box */}
            <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-indigo-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>المترجم التلقائي لبصمات الصور (In-Browser MindAR Compiler)</span>
                  </h4>
                  <p className="text-xs text-indigo-300/80 mt-0.5">
                    يقوم بتحليل جميع صور الدروس وتوليد ملف targets.mind جديد وتفعيله فوراً في كاميرا المتصفح
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCompileTargets}
                    disabled={isCompiling}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
                    <span>{isCompiling ? 'جارٍ المعالجة البصرية...' : '⚡ تجميع بصمات الصور وتفعيلها فوراً'}</span>
                  </button>

                  {compiledBlob && (
                    <button
                      type="button"
                      onClick={handleDownloadMind}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4" />
                      <span>تنزيل targets.mind الجديد</span>
                    </button>
                  )}
                </div>
              </div>

              {compileProgress && (
                <div className="p-3 rounded-lg bg-indigo-900/60 border border-indigo-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-200">
                    <span>{compileProgress.statusText}</span>
                    <span className="font-mono font-bold">{Math.round(compileProgress.percent)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-indigo-950 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-300"
                      style={{ width: `${compileProgress.percent}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح Google Sheets جديد
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://hiukim.github.io/mind-ar-js-doc/tools/compile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              أداة MindAR Compiler الرسمية على الويب
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
