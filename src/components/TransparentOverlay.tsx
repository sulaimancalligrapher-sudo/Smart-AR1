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
      <div className="pointer-events-auto w-full max-w-md transition-all duration-300">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl p-2 sm:p-2.5 flex flex-col gap-1.5">
          
          {/* 1. ترويسة بطاقة الدرس: العنوان وزر الإغلاق بأيقونة شفافة */}
          <div className="flex items-center justify-between gap-2 px-1 pb-1 border-b border-white/10">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping flex-shrink-0" />
              <div className="truncate">
                <h4 className="text-xs sm:text-sm font-bold text-white drop-shadow truncate">
                  {lesson.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* زر تصغير / تكبير شريط البيانات */}
              <button
                onClick={() => setIsCollapsed((prev) => !prev)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer"
                title={isCollapsed ? 'إظهار الأزرار' : 'تصغير'}
                aria-label={isCollapsed ? 'إظهار الأزرار' : 'تصغير'}
              >
                {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {/* زر إغلاق الدرس */}
              <button
                onClick={onCloseLesson}
                className="p-1 rounded-lg bg-white/10 hover:bg-rose-500/40 text-white/80 hover:text-white border border-white/15 transition-all cursor-pointer active:scale-95"
                title="إغلاق الدرس"
                aria-label="إغلاق الدرس"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 2. شريط الأزرار: أزرار ملونة زاهية بأيقونات واضحة مع خلفية زجاجية شفافة تُظهر ما خلفها */}
          {!isCollapsed && (
            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              
              {/* زر الفيديو */}
              {hasVideo && (
                <button
                  onClick={onOpenVideo}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border border-rose-400/40 flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-90 transition-all cursor-pointer group"
                  title="🎬 فيديو تعليمي"
                  aria-label="فيديو تعليمي"
                >
                  <Video className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                </button>
              )}

              {/* زر الصور */}
              {hasImages && (
                <button
                  onClick={onOpenImages}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white border border-sky-400/40 flex items-center justify-center shadow-lg shadow-sky-600/30 active:scale-90 transition-all cursor-pointer group"
                  title="🖼️ معرض الصور واللوحات"
                  aria-label="معرض الصور"
                >
                  <Image className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                </button>
              )}

              {/* زر الصوت */}
              {hasAudio && (
                <button
                  onClick={onOpenAudio}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-90 transition-all cursor-pointer group"
                  title="🎵 تسجيل صوتي"
                  aria-label="تسجيل صوتي"
                >
                  <Music className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                </button>
              )}

              {/* زر الشرح */}
              {hasDescription && (
                <button
                  onClick={onOpenExplanation}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white border border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-600/30 active:scale-90 transition-all cursor-pointer group"
                  title="📖 الشرح والمعلومات"
                  aria-label="الشرح والمعلومات"
                >
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                </button>
              )}

              {/* 1. النوع الأول: مجسم الواقع المعزز AR المثبت فوق الصورة */}
              {hasARModel && (
                <button
                  onClick={onToggleFloatingModel}
                  className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer group border ${
                    isFloatingModelActive
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-300 ring-2 ring-cyan-400/50 shadow-cyan-600/40'
                      : 'bg-cyan-950/70 hover:bg-cyan-900 text-cyan-300 border-cyan-500/40'
                  }`}
                  title={
                    isFloatingModelActive
                      ? '🪐 النوع 1: مجسم AR مثبت فوق الكتاب (مفعّل - انقر للإخفاء)'
                      : '🪐 النوع 1: مجسم AR مثبت فوق الكتاب (متوقف - انقر للتفعيل)'
                  }
                  aria-label="مجسم AR مثبت فوق الكتاب"
                >
                  <Layers className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                  {isFloatingModelActive && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-900 animate-pulse" />
                  )}
                </button>
              )}

              {/* 2. النوع الثاني: المجسم التفاعلي 360° باللمس */}
              {has360Model && (
                <button
                  onClick={onOpenModel3D}
                  className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer group border ${
                    isModel3DActive
                      ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-300 ring-2 ring-purple-400/50 shadow-purple-600/40'
                      : 'bg-purple-700 hover:bg-purple-600 text-white border-purple-400/40 shadow-purple-700/30'
                  }`}
                  title="📦 النوع 2: فحص ثلاثي الأبعاد 360° (تحريك وتدوير باللمس)"
                  aria-label="فحص ثلاثي الأبعاد 360°"
                >
                  <Box className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform drop-shadow" />
                </button>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
