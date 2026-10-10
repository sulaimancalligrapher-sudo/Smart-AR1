import React, { useState } from 'react';
import {
  Camera,
  Sparkles,
  BookOpen,
  Layers,
  FileSpreadsheet,
  Eye,
  QrCode,
  Copy,
  Check,
  Smartphone,
  Monitor,
  RotateCcw,
  Shield,
  ShieldCheck,
  LogOut,
  HelpCircle,
  Scan,
  Compass,
  Lightbulb,
  ExternalLink
} from 'lucide-react';
import { LessonData } from '../types/ar';

interface WelcomeScreenProps {
  onStartCamera: () => void;
  onOpenTargetCards: () => void;
  onOpenTeacherConsole: () => void;
  onOpenCompiler: () => void;
  onOpenQRModal?: () => void;
  onSimulateLesson: (lesson: LessonData) => void;
  onPurgeAllData?: () => void;
  lessons: LessonData[];
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
  onAdminLogout: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartCamera,
  onOpenTargetCards,
  onOpenTeacherConsole,
  onOpenCompiler,
  onOpenQRModal,
  onSimulateLesson,
  onPurgeAllData,
  lessons,
  isAdmin,
  onOpenAdminLogin,
  onAdminLogout
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
    <div className="relative min-h-screen w-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto" dir="rtl">
      {/* Decorative ambient background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>كتابي الذكي</span>
              {isAdmin && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                  وضع الإدارة نشط
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">الواقع المعزز التعليمي المفتوح (WebAR)</p>
          </div>
        </div>

        {/* Header Right: Admin controls or Login button */}
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-amber-300 font-bold bg-amber-950/60 border border-amber-700/50 px-2.5 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>قسم الإدارة</span>
              </span>
              <button
                onClick={onAdminLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                title="تسجيل الخروج من الإدارة والعودة لوضع الطالب"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>خروج الإدارة</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold group shadow-sm"
              title="دخول المعلم والإدارة برقم واسم سري"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
              <span>دخول الإدارة</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-2xl mx-auto w-full py-6 sm:py-8 flex flex-col items-center text-center space-y-6">
        
        {/* ============================================================== */}
        {/* قسم الطالب الرئيسي (ظاهر دائماً: زر الكاميرا والنصوص الإرشادية) */}
        {/* ============================================================== */}
        
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
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            عند التعرف على صور الكتاب، ستظهر لك مجسمات ثلاثية الأبعاد تفاعلية، ومقاطع الفيديو، والمقاطع الصوتية، والشروحات التوضيحية فوق صفحات كتابك فوراً.
          </p>
        </div>

        {/* Primary Student CTA: Start Camera (الزر الأساسي الوحيد للطالب) */}
        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={onStartCamera}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-sky-600/30 active:scale-95 transition-all cursor-pointer group"
          >
            <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span>📷 تشغيل الكاميرا الآن</span>
          </button>
        </div>

        {/* Student Instructional Guide (نصوص إرشادية واضحة للطالب فقط) */}
        <div className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-5 text-right space-y-3">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>كيف تبدأ التجربة التعليمية؟ (خطوات بسيطة):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs flex items-center justify-center border border-sky-400/30">
                ١
              </div>
              <p className="text-xs font-bold text-white">شغّل الكاميرا</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                اضغط على زر الكاميرا بالأعلى واسمح للمتصفح باستخدام الكاميرا.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center border border-teal-400/30">
                ٢
              </div>
              <p className="text-xs font-bold text-white">وجّه نحو صفحة الدرس</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                قرّب الكاميرا ببطء من صورة الدرس في كتابك المدرسي بثبات وإضاءة جيدة.
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-400/30">
                ٣
              </div>
              <p className="text-xs font-bold text-white">استمتع بالمجسم والشرح</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                سيظهر المجسم 3D فوق صفحة الكتاب وتستطيع تدويره وسماع الصوت والشرح!
              </p>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>نصيحة: تأكد من أن الغرفة مضاءة جيداً، وحافظ على مسافة مناسبة بين كاميرا الهاتف وكتابك.</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* قسم الإدارة الكامل (خاص بدخول الإدارة فقط - محمي بالرمز والاسم) */}
        {/* ============================================================== */}
        {isAdmin && (
          <div className="w-full bg-gradient-to-b from-indigo-950/50 via-slate-900 to-slate-950 border-2 border-indigo-500/40 rounded-3xl p-5 sm:p-6 text-right space-y-5 shadow-2xl animate-fadeIn">
            {/* عنوان قسم الإدارة */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-500/30 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">قسم الإدارة والمعلم (Control Hub)</h3>
                  <p className="text-[11px] text-indigo-300 font-medium">أدوات التحكم الحقيقية وإدارة الدروس والمجسمات والأهداف</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onPurgeAllData && (
                  <button
                    onClick={onPurgeAllData}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                    title="مسح وتصفير كافة البيانات المخزنة والكاش وإعادة تشغيل النظام نظيفاً"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                    <span>مسح الكاش والبيانات</span>
                  </button>
                )}
              </div>
            </div>

            {/* الأزرار الإدارية الستة المطلوبة */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* 1. لوحة تحكم المعلم وإدارة الدروس الحقيقية */}
              <button
                onClick={onOpenTeacherConsole}
                className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-emerald-500/30 hover:border-emerald-500 text-right transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-md"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>لوحة تحكم المعلم</span>
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">إدارة</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  إدارة الدروس، روابط Google Sheets، رفع مجسمات AR (.glb/.gltf) والصوتيات.
                </p>
              </button>

              {/* 2. دليل وأداة تجميع الأهداف MindAR */}
              <button
                onClick={onOpenCompiler}
                className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/30 hover:border-indigo-500 text-right transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-md"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>دليل وأداة تجميع الأهداف</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-bold">MindAR</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  أداة تجميع صور صفحات الكتاب إلى ملف targets.mind المتوافق مع الواقع المعزز.
                </p>
              </button>

              {/* 3. زر عرض بطاقات أهداف الدروس */}
              <button
                onClick={onOpenTargetCards}
                className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-sky-500/30 hover:border-sky-500 text-right transition-all cursor-pointer group flex flex-col justify-between gap-2 shadow-md"
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-sky-400 group-hover:text-sky-300 flex items-center gap-1.5">
                    <Eye className="w-4 h-4" />
                    <span>عرض بطاقات أهداف الدروس</span>
                  </span>
                  <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded-full font-bold">Targets</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  استعراض صور صفحات الكتاب المستهدفة للتعرف عليها بالكاميرا أو الطباعة.
                </p>
              </button>
            </div>

            {/* 4. مربع أو صندوق كيو آر كود ونسخ الرابط */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-right space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-bold text-xs sm:text-sm">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>📱 صندوق كيو آر كود (QR) ومشاركة رابط الموقع:</span>
                </div>
                <div className="flex items-center gap-2">
                  {onOpenQRModal && (
                    <button
                      onClick={onOpenQRModal}
                      className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-800/50"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>نافذة الباركود الشاملة</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'تم نسخ الرابط!' : 'نسخ رابط الموقع'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <div className="p-1.5 bg-white rounded-lg shadow-md flex-shrink-0">
                  <img
                    src={qrCodeUrl}
                    alt="امسح الباركود لفتح الموقع على الهاتف"
                    className="w-24 h-24 object-contain"
                  />
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed text-right">
                  <p className="font-bold text-white">شارك الباركود مع الطلاب أو زوار المعرض:</p>
                  <p className="text-slate-400 text-[11px]">
                    يمكن للطلاب مسح هذا الكود بكاميرا هواتفهم لفتح تطبيق كاميرا الواقع المعزز فوراً بدون تثبيت تطبيقات.
                  </p>
                </div>
              </div>
            </div>

            {/* 5. تجربة فورية فوق الكاميرا (محاكي المعلم) */}
            <div className="pt-2 border-t border-slate-800/80 text-right space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-amber-400" />
                  <span>⚡ تجربة فورية فوق الكاميرا (محاكاة بدون تصوير):</span>
                </span>
                <span className="text-[10px] text-slate-400">انقر على أي درس لتشغيل الكاميرا والمجسم فوراً</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {lessons.map((lesson) => (
                  <button
                    key={lesson.targetId}
                    onClick={() => onSimulateLesson(lesson)}
                    className="p-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-right transition-colors cursor-pointer group flex flex-col justify-between"
                  >
                    <span className="text-[10px] text-amber-400 font-mono block">
                      {lesson.targetId}
                    </span>
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate block mt-0.5">
                      {lesson.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 text-center border-t border-white/5 text-[11px] text-slate-500">
        مشروع WebAR تعليمي متطور · متوافق مع كافة الهواتف والأجهزة الذكية
      </footer>
    </div>
  );
};

