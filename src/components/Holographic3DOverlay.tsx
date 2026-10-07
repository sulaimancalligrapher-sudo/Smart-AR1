import React from 'react';
import { X, Box, RotateCcw, Volume2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { LessonModel3D } from '../types/ar';
import { Model3DViewer } from './Model3DViewer';

interface Holographic3DOverlayProps {
  model: LessonModel3D;
  lessonTitle: string;
  onClose: () => void;
  audioUrl?: string;
}

export const Holographic3DOverlay: React.FC<Holographic3DOverlayProps> = ({
  model,
  lessonTitle,
  onClose,
  audioUrl
}) => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none animate-fadeIn">
      {/* Top Floating Holographic Header (Transparent Glass Pill) */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 max-w-md mx-auto w-full pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/60 backdrop-blur-md border border-cyan-400/30 text-white shadow-lg">
          <Box className="w-4 h-4 text-cyan-400 animate-pulse flex-shrink-0" />
          <span className="text-xs font-bold truncate max-w-[160px] sm:max-w-[220px]">
            {model.title || lessonTitle}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
            3D WebAR
          </span>
        </div>

        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-slate-950/60 hover:bg-slate-900/80 backdrop-blur-md border border-white/20 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg active:scale-95"
          title="إخفاء المجسم والعودة للكاميرا"
        >
          <span>✕ إخفاء المجسم</span>
        </button>
      </div>

      {/* Center 100% Transparent 3D Model Floating over Camera */}
      <div className="pointer-events-auto w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col items-center justify-center my-auto">
        <Model3DViewer
          src={model.url}
          title={model.title || lessonTitle}
          height="55vh"
          autoRotate={model.autoRotate !== false}
          interactive={true}
          transparent={true}
          className="w-full max-h-[500px]"
        />

        {/* Floating Touch Tip */}
        <div className="pointer-events-none mt-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-cyan-200 shadow-md">
          <RotateCcw className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>اسحب بإصبعك لتدوير المجسم 360° بحرية فوق الكاميرا</span>
        </div>
      </div>

      {/* Optional Audio Sync Bar at Bottom */}
      {audioUrl && (
        <div className="pointer-events-auto max-w-xs mx-auto mb-20 z-10 p-2 rounded-2xl bg-slate-950/60 backdrop-blur-md border border-white/15 flex items-center gap-2 shadow-lg">
          <Volume2 className="w-4 h-4 text-amber-400 flex-shrink-0 mr-1" />
          <audio src={audioUrl} controls className="h-7 w-full outline-none opacity-90" />
        </div>
      )}
    </div>
  );
};
