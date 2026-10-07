import React from 'react';
import { Box, X, Sparkles } from 'lucide-react';
import { LessonModel3D } from '../types/ar';
import { Model3DViewer } from './Model3DViewer';

interface Holographic3DOverlayProps {
  model: LessonModel3D;
  lessonTitle: string;
  onClose?: () => void;
  audioUrl?: string;
}

export const Holographic3DOverlay: React.FC<Holographic3DOverlayProps> = ({
  model,
  lessonTitle,
  onClose
}) => {
  return (
    <div className="absolute inset-0 z-40 pointer-events-none flex flex-col items-center justify-between p-3 sm:p-5 select-none animate-fadeIn">
      {/* 1. Top: Minimal floating title pill */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 max-w-sm w-full pt-1">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-cyan-500/30 text-white shadow-xl">
          <span className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
            <Box className="w-4 h-4" />
          </span>
          <span className="text-xs sm:text-sm font-bold text-cyan-200 truncate">
            {model.title || `مجسم: ${lessonTitle}`}
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-rose-950/80 text-white hover:text-rose-200 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xl"
            title="إغلاق المجسم والعودة للشاشة"
            aria-label="إغلاق المجسم"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Center: 100% Transparent 3D Model Floating directly over live camera */}
      <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center my-auto">
        <Model3DViewer
          src={model.url}
          title={model.title || lessonTitle}
          height="50vh"
          autoRotate={Boolean(model.autoRotate)}
          interactive={true}
          transparent={true}
          className="w-full max-h-[440px]"
        />

        {/* 3. Bottom Close Action Button under the 3D model */}
        {onClose && (
          <div className="mt-3 flex items-center justify-center">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full bg-slate-900/90 hover:bg-rose-950/90 text-white hover:text-rose-200 border border-white/20 text-xs font-bold shadow-2xl backdrop-blur-md active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>✕ إغلاق المجسم</span>
            </button>
          </div>
        )}
      </div>

      {/* Spacer to balance bottom */}
      <div className="h-2 pointer-events-none" />
    </div>
  );
};
