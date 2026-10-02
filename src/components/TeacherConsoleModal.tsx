import React, { useState, useEffect } from 'react';
import { 
  X, Database, Send, Trash2, CheckCircle2, AlertCircle, Copy, Check, 
  FileSpreadsheet, ExternalLink, BookOpen, Edit3, Image, Video, Music, 
  HelpCircle, Save, Download, Sparkles, Layers, Upload, Plus, AlertTriangle
} from 'lucide-react';
import { analytics } from '../services/analytics';
import { AnalyticsLogItem, LessonData } from '../types/ar';
import { targetCompiler, CompileProgress } from '../services/targetCompiler';
import { saveStoredLessons } from '../data/lessons';

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
  const [activeTab, setActiveTab] = useState<'lessons' | 'sheets'>('lessons');
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
    if (selectedLessonIndex >= lessons.length && lessons.length > 0) {
      setSelectedLessonIndex(lessons.length - 1);
    }
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
        targetId: 'test_ping',
        lessonTitle: 'اختبار اتصال النظام',
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
    saveStoredLessons(editableLessons);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditableLessons((prev) => {
      const updated = [...prev];
      if (!updated[selectedLessonIndex]) return prev;
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

  const handleAddNewLesson = () => {
    const newIndex = editableLessons.length;
    const newLesson: LessonData = {
      targetIndex: newIndex,
      targetId: `lesson_${String(newIndex + 1).padStart(3, '0')}`,
      title: `درس جديد رقم ${newIndex + 1}`,
      subtitle: 'اكتب وصفاً أو تمهيداً للدرس هنا',
      subject: 'العلوم العامة',
      grade: 'الصف الابتدائي',
      targetImage: '',
      video: {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
        embedUrl: 'https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0',
        title: 'فيديو تعليمي تفاعلي'
      },
      images: [],
      audio: {
        url: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg',
        title: 'تسجيل صوتي'
      },
      description: {
        summary: 'ملخص وشرح معلومات الدرس...',
        keyPoints: ['نقطة رئيسية 1', 'نقطة رئيسية 2'],
        fullText: 'شرح مفصل للدرس يظهر للطالب عند الضغط على زر الشرح...',
        quiz: {
          question: 'سؤال الاختبار التفاعلي؟',
          options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'],
          correctIndex: 0,
          explanation: 'تفسير الإجابة الصحيحة'
        }
      }
    };
    const updated = [...editableLessons, newLesson];
    setEditableLessons(updated);
    setSelectedLessonIndex(updated.length - 1);
    if (onUpdateLessons) {
      onUpdateLessons(updated);
    }
    saveStoredLessons(updated);
  };

  const handleDeleteLesson = (indexToDelete: number) => {
    const lessonTitle = editableLessons[indexToDelete]?.title || 'هذا الدرس';
    if (!window.confirm(`هل أنت متأكد من حذف "${lessonTitle}" نهائياً من قائمة الدروس؟`)) {
      return;
    }
    const updated = editableLessons
      .filter((_, idx) => idx !== indexToDelete)
      .map((l, idx) => ({ ...l, targetIndex: idx })); // renumber targetIndex sequentially 0, 1, 2...
    
    setEditableLessons(updated);
    setSelectedLessonIndex((prev) => Math.max(0, Math.min(prev, updated.length - 1)));
    if (onUpdateLessons) {
      onUpdateLessons(updated);
    }
    saveStoredLessons(updated);
  };

  const handleClearAllLessons = () => {
    if (!window.confirm('⚠️ تحذير: هل أنت متأكد من مسح جميع الدروس الحالية والبدء من الصفر؟')) {
      return;
    }
    setEditableLessons([]);
    setSelectedLessonIndex(0);
    if (onUpdateLessons) {
      onUpdateLessons([]);
    }
    saveStoredLessons([]);
  };

  const handleCompileTargets = async () => {
    try {
      if (editableLessons.length === 0) {
        alert('يرجى إضافة درس واحد على الأقل ورفع صورته للبدء في تجميع البصمات.');
        return;
      }

      const validImages = editableLessons.filter((l) => l.targetImage && l.targetImage.trim() !== '');
      if (validImages.length === 0) {
        alert('يرجى تحديد أو رفع صورة واحدة على الأقل في الدروس قبل بدء التجميع.');
        return;
      }

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
    const jsonStr = JSON.stringify({ lessons: editableLessons }, null, 2);
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

  const currentLesson = editableLessons[selectedLessonIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">لوحة تحكم المعلم وإدارة الدروس الحقيقية</h3>
              <p className="text-xs text-slate-400">إضافة وحذف الدروس، رفع صور كتابك المدرسي، وتوليد ملف targets.mind</p>
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
        <div className="flex items-center justify-between px-4 pt-3 bg-slate-800/40 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'lessons'
                  ? 'bg-slate-900 text-sky-400 border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>محرر الدروس وربط صور الكتب ({editableLessons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'sheets'
                  ? 'bg-slate-900 text-emerald-400 border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>ربط Google Sheets</span>
            </button>
          </div>

          {activeTab === 'lessons' && editableLessons.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllLessons}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 p-1 cursor-pointer"
              title="مسح كافة النماذج الحالية"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح جميع الدروس</span>
            </button>
          )}
        </div>

        {/* Tab 1: Lessons Manager & Targets Linker */}
        {activeTab === 'lessons' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            {/* Guide Banner */}
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-200 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">💡 خطوات إعداد صور كتابك المدرسي الجديد:</span>
                1. اضغط على <strong>[ + إضافة درس جديد ]</strong> لكل صفحة من كتابك.<br />
                2. اضغط على <strong>[ رفع صورة من جهازك ]</strong> لاختيار صورة الصفحة.<br />
                3. ضع روابط الفيديو والصوت والنصوص وسؤال الاختبار.<br />
                4. اضغط <strong>[ ⚡ تجميع بصمات الصور ]</strong> لدمج جميع الصور وتوليد <code className="text-sky-300">targets.mind</code>.
              </div>
            </div>

            {/* Lessons Selector Bar with Add & Delete */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">قائمة دروس كتابك المدرسي:</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {editableLessons.length === 0 ? 'لا توجد دروس حالياً' : `إجمالي الدروس: ${editableLessons.length}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {editableLessons.map((l, idx) => {
                  const isSelected = selectedLessonIndex === idx;
                  return (
                    <div
                      key={l.targetId}
                      className={`relative group rounded-xl border transition-all flex items-stretch ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedLessonIndex(idx)}
                        className="flex-1 p-2.5 text-right flex flex-col justify-between cursor-pointer truncate"
                      >
                        <span className="text-[10px] font-mono text-sky-400 font-bold block">
                          Target #{l.targetIndex}
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate mt-1 block">
                          {l.title || `درس ${idx + 1}`}
                        </span>
                      </button>

                      {/* Delete Quick Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(idx);
                        }}
                        className="px-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded-l-xl transition-colors cursor-pointer"
                        title="حذف هذا الدرس"
                        aria-label={`حذف ${l.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add New Lesson Button */}
                <button
                  type="button"
                  onClick={handleAddNewLesson}
                  className="p-3 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة درس جديد</span>
                </button>
              </div>
            </div>

            {/* Empty State when 0 lessons */}
            {editableLessons.length === 0 && (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">لا توجد دروس حالياً (تم إفراغ النماذج)</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  ابدأ الآن بإضافة أول درس لك، ورفع صورة الصفحة المقابلة له من كتابك المدرسي وتعبئة بياناته.
                </p>
                <button
                  type="button"
                  onClick={handleAddNewLesson}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول درس لك الآن</span>
                </button>
              </div>
            )}

            {/* Current Lesson Edit Form */}
            {currentLesson && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>تعديل بيانات: {currentLesson.title} (Target #{currentLesson.targetIndex})</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                      ID: {currentLesson.targetId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(selectedLessonIndex)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الدرس</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Lesson Title */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">عنوان الدرس:</label>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="مثال: الخلية النباتية والبناء الضوئي"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Target Image Upload / Path */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">صورة الهدف من الكتاب (Target Image):</label>
                      <label className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer inline-flex items-center gap-1">
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 رفع صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const url = URL.createObjectURL(file);
                              handleFieldChange('targetImage', url);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={currentLesson.targetImage}
                      onChange={(e) => handleFieldChange('targetImage', e.target.value)}
                      placeholder="اضغط (رفع صورة) أو الصق رابط صورة صفحة الدرس"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono text-[11px]"
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
                      placeholder="https://.../audio.mp3"
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
                      placeholder="العلوم / الفيزياء / الأحياء"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-300">الصف الدراسي:</label>
                    <input
                      type="text"
                      value={currentLesson.grade}
                      onChange={(e) => handleFieldChange('grade', e.target.value)}
                      placeholder="الصف الرابع الابتدائي"
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
                      placeholder="اكتب شرحاً ومعلومات مفيدة للطالب عند قراءة صفحة الدرس..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* Target Image Preview Box */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {currentLesson.targetImage ? (
                        <img
                          src={currentLesson.targetImage}
                          alt={currentLesson.title}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 text-center px-1">لا توجد صورة بعد</span>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">معاينة صورة الهدف الحالي</h5>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        هذه هي الصورة التي ستبحث عنها الكاميرا لفتح هذا الدرس تحديداً
                      </p>
                    </div>
                  </div>

                  <label className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الصورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const url = URL.createObjectURL(file);
                          handleFieldChange('targetImage', url);
                        }
                      }}
                    />
                  </label>
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
                    disabled={isCompiling || editableLessons.length === 0}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
                    <span>{isCompiling ? 'جارٍ المعالجة البصرية...' : '⚡ تجميع بصمات الصور وتفعيلها فوراً'}</span>
                  </button>

                  {compiledBlob && (
                    <button
                      type="button"
                      onClick={handleDownloadMind}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5 animate-fadeIn"
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

        {/* Tab 2: Google Sheets Analytics */}
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
