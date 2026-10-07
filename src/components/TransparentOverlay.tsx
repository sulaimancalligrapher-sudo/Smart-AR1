import React from 'react';
import { Film, Image as ImageIcon, Volume2, BookOpen, Box, X } from 'lucide-react';
import { LessonData } from '../types/ar';

interface TransparentOverlayProps {
  lesson: LessonData;
  onOpenVideo: () => void;
  onOpenImages: () => void;
  onOpenAudio: () => void;
  onOpenExplanation: () => void;
  onOpenModel3D?: () => void;
  onCloseLesson?: () => void;
}

export const TransparentOverlay: React.FC<TransparentOverlayProps> = ({
  lesson,
  onOpenVideo,
  onOpenImages,
  onOpenAudio,
  onOpenExplanation,
  onOpenModel3D,
  onCloseLesson
}) => {
  return (
    <div className="absolute inset-0 z-30 pointer-events-none select-none flex flex-col justify-between p-4 sm:p-6 transition-all duration-300">
      {/* 1. Top: Minimalist Lesson Title Badge (Floating Glass Pill without clutter) */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 max-w-md mx-auto w-full pt-1 animate-fadeIn">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/45 backdrop-blur-md border border-white/20 text-white shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <h2 className="text-sm sm:text-base font-black tracking-tight drop-shadow truncate max-w-[200px] sm:max-w-xs">
            {lesson.title}
          </h2>
        </div>

        {onCloseLesson && (
          <button
            onClick={onCloseLesson}
            className="w-10 h-10 rounded-full bg-black/45 hover:bg-rose-950/70 text-white hover:text-rose-200 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xl"
            title="مسح صفحة كتاب أخرى"
            aria-label="مسح صفحة أخرى"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Bottom: Floating Bar of Large Circular Icon Buttons (No Background Box, No Text) */}
      <div className="pointer-events-auto flex items-center justify-center gap-3 sm:gap-4 max-w-lg mx-auto w-full pb-4 sm:pb-6 animate-slideUp">
        {/* Button 1: 3D Model (Icon Only, Large, Glowing) */}
        {lesson.model3d?.url && onOpenModel3D && (
          <button
            onClick={onOpenModel3D}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 active:scale-90 transition-all cursor-pointer border-2 border-white/30"
            title="إظهار / إخفاء المجسم ثلاثي الأبعاد"
            aria-label="المجسم 3D"
          >
            <Box className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        )}

        {/* Button 2: Video (Icon Only, Large) */}
        <button
          onClick={onOpenVideo}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 hover:bg-sky-600/90 text-sky-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 active:scale-90 transition-all cursor-pointer group"
          title="مشاهدة فيديو الدرس"
          aria-label="فيديو الدرس"
        >
          <Film className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Button 3: Gallery / Images (Icon Only, Large) */}
        <button
          onClick={onOpenImages}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 hover:bg-emerald-600/90 text-emerald-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 active:scale-90 transition-all cursor-pointer group"
          title="معرض المخططات والصور"
          aria-label="معرض الصور"
        >
          <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Button 4: Audio (Icon Only, Large) */}
        <button
          onClick={onOpenAudio}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 hover:bg-amber-600/90 text-amber-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 active:scale-90 transition-all cursor-pointer group"
          title="الاستماع للشرح الصوتي"
          aria-label="الشرح الصوتي"
        >
          <Volume2 className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
        </button>

        {/* Button 5: Explanation / Book (Icon Only, Large) */}
        <button
          onClick={onOpenExplanation}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900/80 hover:bg-indigo-600/90 text-indigo-300 hover:text-white flex items-center justify-center backdrop-blur-md shadow-xl border border-white/20 active:scale-90 transition-all cursor-pointer group"
          title="شرح الدرس والتدريبات"
          aria-label="شرح الدرس"
        >
          <BookOpen className="w-7 h-7 sm:w-8 sm:h-8 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};
