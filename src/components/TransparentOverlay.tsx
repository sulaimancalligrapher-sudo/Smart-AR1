import React from 'react';
import { Video, Image, Music, BookOpen, Box, X, Layers } from 'lucide-react';
import { LessonData } from '../types/ar';

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
  return (
    <div className="absolute bottom-0 inset-x-0 z-30 pointer-events-none">
      <div className="pointer-events-auto p-3 sm:p-4 flex flex-col items-center gap-3">
        {/* شريط الأزرار الرئيسي */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 shadow-2xl">
          
          {/* زر الفيديو */}
          {lesson.video && (
            <button
              onClick={onOpenVideo}
              className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
              title="فتح الفيديو التعليمي"
            >
              <Video className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* زر الصور */}
          {lesson.images && lesson.images.length > 0 && (
            <button
              onClick={onOpenImages}
              className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
              title="فتح معرض الصور"
            >
              <Image className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* زر الصوت */}
          {lesson.audio && (
            <button
              onClick={onOpenAudio}
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
              title="تشغيل التسجيل الصوتي"
            >
              <Music className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* زر الشرح */}
          {lesson.description && (
            <button
              onClick={onOpenExplanation}
              className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg active:scale-95 transition-all cursor-pointer group"
              title="فتح الشرح التفصيلي"
            >
              <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* 1. النوع الأول: مجسم الواقع المعزز AR المثبت فوق الصورة يتبع حركة الكاميرا */}
          {(lesson.model3d || lesson.arModel3d) && onToggleFloatingModel && (
            <button
              onClick={onToggleFloatingModel}
              className={`relative p-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group flex items-center justify-center ${
                isFloatingModelActive
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 ring-2 ring-cyan-300 ring-offset-2 ring-offset-black/50 shadow-cyan-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10'
              }`}
              title={
                isFloatingModelActive
                  ? 'النوع الأول (AR): مجسم الواقع المعزز قيد العمل يتبع صفحة الكتاب (انقر للإخفاء)'
                  : 'النوع الأول (AR): إظهار مجسم الواقع المعزز فوق صفحة الكتاب (انقر للتشغيل)'
              }
            >
              <Layers className={`w-5 h-5 group-hover:scale-110 transition-transform ${isFloatingModelActive ? 'text-white' : 'text-slate-400'}`} />
              {isFloatingModelActive && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-black animate-pulse" />
              )}
            </button>
          )}

          {/* 2. النوع الثاني: المجسم التفاعلي 360° باللمس والفأرة */}
          {(lesson.model3d || lesson.arModel3d) && (
            <button
              onClick={onOpenModel3D}
              className={`p-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group flex items-center justify-center ${
                isModel3DActive
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 ring-2 ring-violet-300 ring-offset-2 ring-offset-black/50 shadow-purple-500/30'
                  : 'bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white'
              }`}
              title="النوع الثاني: نافذة فحص ثلاثي الأبعاد 360° (تحريك وتدوير حر بالإصبع والفأرة)"
            >
              <Box className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* شارة إيضاحية سريعة للوضع النشط للمجسم ثلاثي الأبعاد */}
        {(lesson.model3d || lesson.arModel3d) && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-200">
            {isFloatingModelActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>النوع 1: مجسم AR نشط ومثبت</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                <span>مجسم AR متوقف - انقر على الأيقونة الزرقاء</span>
              </>
            )}
            <span className="text-slate-500 mx-1">|</span>
            <button
              onClick={onOpenModel3D}
              className="text-purple-300 hover:text-purple-200 underline cursor-pointer font-bold"
            >
              النوع 2: تدوير بالإصبع 360°
            </button>
          </div>
        )}

        {/* زر إغلاق الدرس */}
        <button
          onClick={onCloseLesson}
          className="px-5 py-2 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold shadow-xl backdrop-blur-md active:scale-95 transition-all cursor-pointer flex items-center gap-2 border border-white/20"
        >
          <X className="w-4 h-4" />
          <span>✕ إغلاق الدرس</span>
        </button>
      </div>
    </div>
  );
};