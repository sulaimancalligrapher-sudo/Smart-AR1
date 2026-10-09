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

          {/* زر المجسم التفاعلي (بالإصبع) */}
          {lesson.model3d && (
            <button
              onClick={onOpenModel3D}
              className={`p-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group ${
                isModel3DActive
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 ring-2 ring-violet-300'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500'
              }`}
              title="فتح المجسم ثلاثي الأبعاد (تحريك بالإصبع)"
            >
              <Box className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* ⭐ الزر الجديد: المجسم المعلق فوق الصورة ⭐ */}
          {lesson.model3d && onToggleFloatingModel && (
            <button
              onClick={onToggleFloatingModel}
              className={`p-3 rounded-xl shadow-lg active:scale-95 transition-all cursor-pointer group ${
                isFloatingModelActive
                  ? 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 ring-2 ring-cyan-300 animate-pulse'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500'
              }`}
              title="عرض المجسم معلقاً فوق الصورة (يتبع الكاميرا)"
            >
              <Layers className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

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