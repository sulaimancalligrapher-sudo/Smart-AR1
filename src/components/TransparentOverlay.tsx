import React, { useState } from 'react';
import { Film, Image as ImageIcon, Volume2, BookOpen, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { LessonData } from '../types/ar';

interface TransparentOverlayProps {
  lesson: LessonData;
  onOpenVideo: () => void;
  onOpenImages: () => void;
  onOpenAudio: () => void;
  onOpenExplanation: () => void;
  onCloseLesson?: () => void;
}

export const TransparentOverlay: React.FC<TransparentOverlayProps> = ({
  lesson,
  onOpenVideo,
  onOpenImages,
  onOpenAudio,
  onOpenExplanation,
  onCloseLesson
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-5 pointer-events-none select-none transition-all duration-300">
      <div 
        className="max-w-md mx-auto pointer-events-auto rounded-3xl ar-glass-panel shadow-2xl overflow-hidden border border-white/20 transition-all duration-300"
      >
        {/* Lesson Identification Banner */}
        <div className="px-4 py-2.5 bg-gradient-to-r from-emerald-600/90 via-teal-600/85 to-sky-600/90 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0 animate-pulse" />
            <span className="text-xs font-bold tracking-wide truncate">
              تم التعرف على الدرس بنجاح
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded-lg hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isMinimized ? 'توسيع القائمة' : 'تصغير القائمة'}
              aria-label={isMinimized ? 'توسيع القائمة' : 'تصغير القائمة'}
            >
              {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {onCloseLesson && (
              <button
                onClick={onCloseLesson}
                className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-black/20 hover:bg-black/40 text-white/90 transition-colors cursor-pointer"
                title="إلغاء قفل الدرس"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 space-y-3.5">
          {/* Header Title & Subtitle */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-sm truncate">
                {lesson.title}
              </h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/30 text-sky-200 border border-sky-400/30 flex-shrink-0">
                {lesson.subject}
              </span>
            </div>
            <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed">
              {lesson.subtitle}
            </p>
          </div>

          {/* 4 Large Child-Friendly Interactive Action Buttons */}
          {!isMinimized && (
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pt-1">
              {/* Button 1: Video */}
              <button
                onClick={onOpenVideo}
                className="ar-glass-button h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 p-2 border-sky-400/30 text-sky-100 hover:text-white hover:border-sky-300 hover:bg-sky-900/60 shadow-lg cursor-pointer group"
                aria-label="مشاهدة فيديو الدرس"
              >
                <div className="w-8 h-8 rounded-full bg-sky-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Film className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black block">🎬 فيديو</span>
                  <span className="text-[10px] text-sky-200/70 font-medium block">مشاهدة مرئية</span>
                </div>
              </button>

              {/* Button 2: Gallery */}
              <button
                onClick={onOpenImages}
                className="ar-glass-button h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 p-2 border-emerald-400/30 text-emerald-100 hover:text-white hover:border-emerald-300 hover:bg-emerald-900/60 shadow-lg cursor-pointer group"
                aria-label="معرض صور الدرس"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black block">🖼️ صور</span>
                  <span className="text-[10px] text-emerald-200/70 font-medium block">معرض المخططات</span>
                </div>
              </button>

              {/* Button 3: Audio */}
              <button
                onClick={onOpenAudio}
                className="ar-glass-button h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 p-2 border-amber-400/30 text-amber-100 hover:text-white hover:border-amber-300 hover:bg-amber-900/60 shadow-lg cursor-pointer group"
                aria-label="الاستماع للشرح الصوتي"
              >
                <div className="w-8 h-8 rounded-full bg-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black block">🔊 استماع</span>
                  <span className="text-[10px] text-amber-200/70 font-medium block">شرح صوتي</span>
                </div>
              </button>

              {/* Button 4: Explanation */}
              <button
                onClick={onOpenExplanation}
                className="ar-glass-button h-16 sm:h-20 rounded-2xl flex flex-col items-center justify-center gap-1 p-2 border-indigo-400/30 text-indigo-100 hover:text-white hover:border-indigo-300 hover:bg-indigo-900/60 shadow-lg cursor-pointer group"
                aria-label="قراءة شرح الدرس"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-300" />
                </div>
                <div className="text-center">
                  <span className="text-xs sm:text-sm font-black block">📝 شرح</span>
                  <span className="text-[10px] text-indigo-200/70 font-medium block">نص وتدريبات</span>
                </div>
              </button>
            </div>
          )}

          {/* Quick Peek Hint */}
          <div className="flex items-center justify-between text-[11px] text-slate-300/80 pt-1 border-t border-white/10">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>المحتوى معروض فوق الكاميرا الحية</span>
            </span>
            <span className="font-mono text-[10px] text-slate-400">
              {lesson.targetId}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
