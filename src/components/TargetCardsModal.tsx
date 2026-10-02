import React, { useState } from 'react';
import { X, Printer, Eye, Play, Sparkles, Download, CheckCircle2, Zap, RefreshCw } from 'lucide-react';
import { LessonData } from '../types/ar';
import { targetCompiler, CompileProgress } from '../services/targetCompiler';

interface TargetCardsModalProps {
  lessons: LessonData[];
  onSelectLesson: (lesson: LessonData) => void;
  onClose: () => void;
}

export const TargetCardsModal: React.FC<TargetCardsModalProps> = ({
  lessons,
  onSelectLesson,
  onClose
}) => {
  const [selectedTarget, setSelectedTarget] = useState<LessonData | null>(lessons[0] || null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileProgress, setCompileProgress] = useState<CompileProgress | null>(null);
  const [compiledBlob, setCompiledBlob] = useState<Blob | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleAutoCompileAll = async () => {
    try {
      setIsCompiling(true);
      setCompileProgress({ percent: 10, statusText: 'بدء تجميع بصمات الصور...' });

      const allImages = lessons.map((l) => l.targetImage);
      const res = await targetCompiler.compileImages(allImages, (progress) => {
        setCompileProgress(progress);
      });

      setCompiledBlob(res.blob);
      setIsCompiling(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Eye className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">بطاقات أهداف الدروس (Targets)</h3>
              <p className="text-xs text-slate-400">افتح هذه البطاقة على شاشة كمبيوترك أو هاتفك الآخر، ثم وجّه الكاميرا إليها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Tabs & Target Card Display */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {lessons.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
              <Eye className="w-10 h-10 text-slate-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">لا توجد بطاقات أهداف مضافة بعد</h4>
              <p className="text-xs text-slate-400">
                تم إفراغ النماذج التجريبية السابقة بنجاح. يمكنك الآن إضافة دروس كتابك المدرسي وصورها من خلال محرر الدروس (أيقونة الجدول في الأعلى).
              </p>
            </div>
          ) : (
            <>
              {/* Important Highlight Note */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-200 leading-relaxed">
                  <span className="font-bold text-emerald-300 block mb-0.5">
                    💡 بطاقات أهداف الدروس الحالية:
                  </span>
                  افتح أي بطاقة من القائمة أدناه على شاشة كمبيوترك أو اطبعها، ثم وجه كاميرا الهاتف نحوها للتعرف الفوري!
                </div>
              </div>

              {/* Target Selector Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {lessons.map((lesson) => {
                  const isActive = selectedTarget?.targetId === lesson.targetId;
                  return (
                    <button
                      key={lesson.targetId}
                      onClick={() => setSelectedTarget(lesson)}
                      className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-sky-600/20 border-sky-400 text-white shadow-md'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="text-[10px] text-sky-400 font-mono block">
                        Target #{lesson.targetIndex}
                      </span>
                      <span className="text-xs font-bold truncate block mt-0.5">
                        {lesson.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Active Target Card Preview */}
          {selectedTarget && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center gap-5">
              {/* Target Image Frame */}
              <div className="w-full md:w-1/2 flex flex-col items-center">
                <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-sky-500/50 p-1 bg-slate-900 shadow-xl max-w-sm">
                  <img
                    src={selectedTarget.targetImage}
                    alt={selectedTarget.title}
                    className="w-full h-auto rounded-lg object-contain max-h-64"
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-emerald-400 font-mono border border-emerald-500/40">
                    {selectedTarget.targetId} · Target {selectedTarget.targetIndex}
                  </div>
                </div>
                <span className="text-[11px] text-emerald-300 mt-2 text-center font-medium">
                  📸 وجّه كاميرا الهاتف نحو هذه الصورة بالضبط
                </span>
              </div>

              {/* Target Details & Direct Actions */}
              <div className="w-full md:w-1/2 space-y-3.5">
                <div>
                  <span className="text-xs text-sky-400 font-semibold">{selectedTarget.subject} · {selectedTarget.grade}</span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{selectedTarget.title}</h4>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{selectedTarget.subtitle}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>نصائح لنجاح القراءة بالكاميرا:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400">
                    <li>اجعل الصورة كاملة تظهر داخل المربع المتقطع في الكاميرا.</li>
                    <li>تجنب انعكاس الإضاءة الساطعة من شاشة اللابتوب أو الجوال.</li>
                    <li>ثبّت الكاميرا لمسافة 20 إلى 30 سم تقريباً.</li>
                  </ul>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onSelectLesson(selectedTarget);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    تجربة هذا الدرس مباشرة فوق الكاميرا الآن
                  </button>

                  <a
                    href={selectedTarget.targetImage}
                    download={`target_${selectedTarget.targetId}.png`}
                    className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تحميل هذه الصورة على جهازك لعرضها أو طباعتها
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* In-Browser Automatic Target Compiler Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h5 className="font-bold text-white text-xs sm:text-sm">
                  ميزة التجميع الذاتي للبصمات (Auto-Compiler)
                </h5>
              </div>
              {compiledBlob && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  ✓ تم التجميع والتفعيل
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              إذا قمت بتغيير صور الدروس في كتابك، يمكنك الضغط هنا ليقوم المتصفح باستخراج البصمات وتفعيلها فوراً في الكاميرا دون مغادرة الموقع!
            </p>

            {compileProgress && (
              <div className="space-y-1 py-1">
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${compileProgress.percent}%` }}
                  />
                </div>
                <span className="text-[11px] text-emerald-300 font-mono block">
                  {compileProgress.statusText}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAutoCompileAll}
                disabled={isCompiling}
                className="py-2 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCompiling ? 'animate-spin' : ''}`} />
                <span>{isCompiling ? 'جارٍ المعالجة في المتصفح...' : '⚡ تجميع وتحديث بصمات الصور تلقائياً'}</span>
              </button>

              {compiledBlob && (
                <button
                  type="button"
                  onClick={handleDownloadMind}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل targets.mind الجديد</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            طباعة البطاقات
          </button>
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
