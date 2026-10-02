import React, { useState } from 'react';
import { Camera, Sparkles, BookOpen, Layers, FileSpreadsheet, Eye, Play, QrCode, Copy, Check, Smartphone, Monitor } from 'lucide-react';
import { LessonData } from '../types/ar';

interface WelcomeScreenProps {
  onStartCamera: () => void;
  onOpenTargetCards: () => void;
  onOpenTeacherConsole: () => void;
  onOpenCompiler: () => void;
  onSimulateLesson: (lesson: LessonData) => void;
  lessons: LessonData[];
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartCamera,
  onOpenTargetCards,
  onOpenTeacherConsole,
  onOpenCompiler,
  onSimulateLesson,
  lessons
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const sharedUrl = window.location.href;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(sharedUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(sharedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto">
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">كتابي الذكي</h1>
            <p className="text-[11px] text-slate-400 font-medium">الواقع المعزز التعليمي المفتوح (WebAR)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTeacherConsole}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            title="إعدادات Google Sheets وسجل الأحداث"
            aria-label="إعدادات Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
          <button
            onClick={onOpenCompiler}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
            title="دليل تجميع الأهداف MindAR"
            aria-label="دليل تجميع الأهداف"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-xl mx-auto w-full py-6 sm:py-8 flex flex-col items-center text-center space-y-6">
        {/* Child-Friendly Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>يعمل مباشرة في المتصفح الآن بدون تثبيت أي تطبيق</span>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            وجّه الكاميرا إلى كتابك المدرسي
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              واستمتع بالتعلم التفاعلي الممتع!
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            عند التعرف على صور الكتاب، ستظهر لك مقاطع الفيديو التعليمية، ومعرض المخططات، والمقاطع الصوتية، والشروحات التفاعلية فوق صفحات كتابك فوراً.
          </p>
        </div>

        {/* Primary CTA: Start Camera */}
        <div className="w-full max-w-sm space-y-2.5">
          <button
            onClick={onStartCamera}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-xl shadow-sky-600/30 active:scale-95 transition-all cursor-pointer group"
          >
            <Camera className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <span>📷 تشغيل الكاميرا الآن</span>
          </button>

          <button
            onClick={onOpenTargetCards}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>عرض بطاقات أهداف الدروس (Targets)</span>
          </button>
        </div>

        {/* Mobile Real-Device Tester Card (Scan QR with phone) */}
        <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>📱 هل تريد تجربة الكاميرا من هاتفك الذكي الآن؟</span>
            </div>
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الموقع'}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800/80">
            <div className="p-1.5 bg-white rounded-lg shadow-md flex-shrink-0">
              <img
                src={qrCodeUrl}
                alt="امسح الباركود لفتح الموقع على الهاتف"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed text-right">
              <p className="font-bold text-white">امسح هذا الباركود بكاميرا هاتفك العادية:</p>
              <p className="text-slate-400 text-[11px]">
                ١. سيفتح لك هذا الموقع في متصفح جوالك مباشرة عبر HTTPS.
              </p>
              <p className="text-slate-400 text-[11px]">
                ٢. اضغط تشغيل الكاميرا من الجوال، ووجّه كاميرا الجوال نحو صورة الدرس المعروضة على شاشة الكمبيوتر!
              </p>
            </div>
          </div>
        </div>

        {/* Quick Simulator Bar for Instant Desktop Testing */}
        <div className="w-full pt-2 border-t border-slate-800/80 text-right space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-sky-400" />
              <span>تجربة فورية فوق الكاميرا بنقرة واحدة (بدون تصوير):</span>
            </span>
            <span className="text-[10px] text-slate-500">انقر لفك القفل فوراً</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.targetId}
                onClick={() => onSimulateLesson(lesson)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-right transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <span className="text-[10px] text-sky-400 font-mono block">
                  {lesson.targetId}
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate block mt-0.5">
                  {lesson.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center border-t border-white/5 text-[11px] text-slate-500">
        مشروع WebAR تعليمي مفتوح المصدر · متوافق مع Android Chrome و iPhone Safari · مجاني 100%
      </footer>
    </div>
  );
};
