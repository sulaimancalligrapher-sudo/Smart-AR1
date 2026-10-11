import React, { useState } from 'react';
import {
  Video,
  Image,
  Music,
  BookOpen,
  Box,
  X,
  Layers,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { LessonData, getActiveLessonModel } from '../types/ar';

interface TransparentOverlayProps {
  lesson: LessonData;
  isModel3DActive: boolean;
  isFloatingModelActive?: boolean;
  onOpenVideo: () => void;
  onOpenImages: () => void;
  onOpenAudio: () => void;
  onOpenExplanation: () => void;
  onOpenModel3D: () => void;
  onToggleFloatingModel?: () => void;
  onCloseLesson: () => void;
}

export const TransparentOverlay: React.FC<TransparentOverlayProps> = ({
  lesson,
  isModel3DActive,
  isFloatingModelActive = false,
  onOpenVideo,
  onOpenImages,
  onOpenAudio,
  onOpenExplanation,
  onOpenModel3D,
  onToggleFloatingModel,
  onCloseLesson
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // التحقق من توفر كل نوع من أنواع بيانات الدرس
  const hasVideo = Boolean(lesson.video?.url?.trim() || lesson.video?.embedUrl?.trim());
  const hasImages = Boolean(
    (lesson.images && lesson.images.length > 0) ||
    (lesson.targetImage && lesson.targetImage.trim() !== '')
  );
  const hasAudio = Boolean(lesson.audio?.url?.trim());
  const hasDescription = Boolean(
    lesson.description?.summary?.trim() ||
    lesson.description?.fullText?.trim() ||
    (lesson.description?.keyPoints && lesson.description.keyPoints.length > 0)
  );
  const hasARModel = Boolean(getActiveLessonModel(lesson, true)) && Boolean(onToggleFloatingModel);
  const has360Model = Boolean(getActiveLessonModel(lesson, false));

  return (
    <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none flex justify-center pb-[max(0.75rem,env(safe-area-inset-bottom))] px-2 sm:px-4">
      <div className="pointer-events-auto w-full max-w-lg transition-all duration-300">
        <div className="bg-slate-950/90 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl p-2.5 sm:p-3.5 flex flex-col gap-2">
          
          {/* 1. ترويسة بطاقة الدرس: العنوان، تصنيف الدرس، وزر الإغلاق السريع */}
          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                    {lesson.title}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-semibold flex-shrink-0 border border-cyan-500/30">
                    بيانات الدرس
                  </span>
                </div>
                {lesson.subject && (
                  <p className="text-[10px] text-slate-400 truncate">
                    {lesson.subject} {lesson.grade ? `· ${lesson.grade}` : ''}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* زر تصغير / تكبير شريط البيانات لرؤية الكاميرا والمجسم بالكامل */}
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                title={isCollapsed ? 'إظهار أزرار البيانات' : 'تصغير الشريط مؤقتاً'}
              >
                {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* زر إغلاق الدرس */}
              <button
                onClick={onCloseLesson}
                className="px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-[11px] font-bold shadow-md active:scale-95 transition-all cursor-pointer flex items-center gap-1 border border-rose-400/30"
                title="إغلاق الدرس"
              >
                <X className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">إغلاق</span>
              </button>
            </div>
          </div>

          {/* 2. شريط أزرار البيانات (متجاوب 100% مع الجوال والكمبيوتر والتابلت دون أي قص أو نقص) */}
          {!isCollapsed && (
            <>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-0.5">
                
                {/* زر الفيديو */}
                {hasVideo && (
                  <button
                    onClick={onOpenVideo}
                    className="flex-1 min-w-[50px] max-w-[80px] sm:min-w-[64px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
                    title="فتح الفيديو التعليمي"
                  >
                    <Video className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold leading-none">فيديو</span>
                  </button>
                )}

                {/* زر الصور */}
                {hasImages && (
                  <button
                    onClick={onOpenImages}
                    className="flex-1 min-w-[50px] max-w-[80px] sm:min-w-[64px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
                    title="فتح معرض الصور"
                  >
                    <Image className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold leading-none">صور</span>
                  </button>
                )}

                {/* زر الصوت */}
                {hasAudio && (
                  <button
                    onClick={onOpenAudio}
                    className="flex-1 min-w-[50px] max-w-[80px] sm:min-w-[64px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
                    title="تشغيل التسجيل الصوتي"
                  >
                    <Music className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold leading-none">صوت</span>
                  </button>
                )}

                {/* زر الشرح */}
                {hasDescription && (
                  <button
                    onClick={onOpenExplanation}
                    className="flex-1 min-w-[50px] max-w-[80px] sm:min-w-[64px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
                    title="فتح الشرح والتفاصيل"
                  >
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold leading-none">شرح</span>
                  </button>
                )}

                {/* 1. النوع الأول: مجسم الواقع المعزز AR المثبت فوق الصورة يتبع حركة الكاميرا */}
                {hasARModel && (
                  <button
                    onClick={onToggleFloatingModel}
                    className={`relative flex-1 min-w-[56px] max-w-[88px] sm:min-w-[70px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group ${
                      isFloatingModelActive
                        ? 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 ring-2 ring-cyan-300 ring-offset-1 ring-offset-black/50 text-white'
                        : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10'
                    }`}
                    title={
                      isFloatingModelActive
                        ? 'النوع الأول (AR): مجسم الواقع المعزز قيد العمل فوق الكتاب (انقر للإخفاء)'
                        : 'النوع الأول (AR): تشغيل مجسم الواقع المعزز فوق الكتاب'
                    }
                  >
                    <Layers className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform ${isFloatingModelActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-[10px] sm:text-xs font-bold leading-none whitespace-nowrap">
                      {isFloatingModelActive ? 'مجسم AR ✓' : 'مجسم AR'}
                    </span>
                    {isFloatingModelActive && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-black animate-pulse" />
                    )}
                  </button>
                )}

                {/* 2. النوع الثاني: المجسم التفاعلي 360° باللمس والفأرة */}
                {has360Model && (
                  <button
                    onClick={onOpenModel3D}
                    className={`flex-1 min-w-[56px] max-w-[88px] sm:min-w-[70px] sm:max-w-none flex flex-col items-center justify-center gap-1 p-1.5 sm:px-2.5 sm:py-2 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group ${
                      isModel3DActive
                        ? 'bg-gradient-to-br from-violet-500 to-purple-600 ring-2 ring-violet-300 ring-offset-1 ring-offset-black/50 text-white'
                        : 'bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white'
                    }`}
                    title="النوع الثاني: نافذة فحص ثلاثي الأبعاد 360° (تحريك وتدوير حر بالإصبع)"
                  >
                    <Box className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] sm:text-xs font-bold leading-none whitespace-nowrap">فحص 360°</span>
                  </button>
                )}
              </div>

              {/* 3. شريط إرشادي خفيف يوضح للمستخدم نوعي المجسمات */}
              {hasARModel && (
                <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-black/40 text-[10px] text-slate-300 font-medium border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isFloatingModelActive ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span>النوع 1 (AR): مثبت فوق الكتاب</span>
                  </div>
                  <button
                    onClick={onOpenModel3D}
                    className="text-purple-300 hover:text-purple-200 underline font-bold cursor-pointer"
                  >
                    النوع 2: تدوير بالإصبع 360° ↗
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
