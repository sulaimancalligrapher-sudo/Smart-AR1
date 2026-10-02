import React, { useState } from 'react';
import { X, Layers, ExternalLink, Sparkles, CheckCircle2, FileCode, Upload, ArrowRight } from 'lucide-react';

interface MindARCompilerModalProps {
  onClose: () => void;
}

export const MindARCompilerModal: React.FC<MindARCompilerModalProps> = ({ onClose }) => {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [compilerStatus, setCompilerStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedImages(Array.from(e.target.files));
      setCompilerStatus(`تم اختيار ${e.target.files.length} صورة من صور كتابك.`);
    }
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
            <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">دليل وأداة تجميع الأهداف (MindAR Targets Compiler)</h3>
              <p className="text-xs text-slate-400">كيفية تحويل صور كتابك المطبوع إلى ملف targets.mind متعدد الأهداف</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Overview Banner */}
          <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-indigo-200 text-sm mb-1">ما هو ملف targets.mind؟</h4>
              <p className="text-xs text-indigo-100/90 leading-relaxed">
                هو ملف ثنائي مُعالج مسبقاً يحتوي على خريطة النقاط والمميزات البصرية (Feature Points) لصور كتابك. هذا الملف يسمح للمتصفح بالتعرف الفوري على صور الكتاب بسرعة 60 إطاراً في الثانية دون إرسال الفيديو لأي خادم، مما يجعله مجانياً وآمناً وسريعاً للغاية.
              </p>
            </div>
          </div>

          {/* Step by Step Guide */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              خطوات إنشاء ملف targets.mind لصور كتابك المطبوع:
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Step 1 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                <h5 className="font-bold text-white text-xs">تجهيز صور الدروس</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  التقط أو احفظ صور صفحات الدروس بصيغة JPG أو PNG واضحة ذات تباين جيد وتفاصيل غنية (تجنب الصور الباهتة أو المتكررة).
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                <h5 className="font-bold text-white text-xs">أداة التجميع المجانية</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  افتح أداة تجميع MindAR الرسمية على الويب، وارفع الصور بالترتيب الذي تريده (الصورة الأولى = Target 0، الثانية = Target 1، وهكذا).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="w-6 h-6 rounded-full bg-sky-600 text-white flex items-center justify-center text-xs font-bold">3</span>
                <h5 className="font-bold text-white text-xs">تحميل واستبدال الملف</h5>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  اضغط زر Compile ثم حمّل الملف الناتج وضع اسمه <code className="text-sky-300">targets.mind</code> في مجلد <code className="text-sky-300">public/targets/</code>.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Online Compiler Launch Link */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h5 className="font-bold text-white text-xs sm:text-sm">أداة MindAR Compiler الرسمية عبر المتصفح:</h5>
              <p className="text-xs text-slate-400 mt-0.5">
                تعمل بالكامل داخل متصفحك عبر WebAssembly مجاناً بدون الحاجة لتثبيت أي برامج
              </p>
            </div>
            <a
              href="https://hiukim.github.io/mind-ar-js-doc/tools/compile"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap transition-colors"
            >
              <span>فتح أداة التجميع المباشرة</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Target Mapping in content.json */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h5 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>ربط الترتيب بملف المحتوى content.json:</span>
            </h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              عند إضافة درس جديد في <code className="text-emerald-300">public/data/content.json</code>، اجعل <code className="text-emerald-300">targetIndex</code> مطابقاً لترتيب رفع الصورة في أداة التجميع:
            </p>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300/90 overflow-x-auto" dir="ltr">
              <pre>{`{
  "targetIndex": 0,          // مطابق للصورة الأولى في targets.mind
  "targetId": "lesson_001",  // معرّف الدرس
  "title": "دورة الماء",
  "video": { ... },
  "images": [ ... ],
  "audio": { ... },
  "description": { ... }
}`}</pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ فهمت ذلك، إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
