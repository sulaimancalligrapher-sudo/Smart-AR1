import React from 'react';
import { RotateCcw } from 'lucide-react';
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
  lessonTitle
}) => {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center p-2 select-none animate-fadeIn">
      {/* 100% Transparent 3D Model Floating directly over live camera */}
      <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto flex flex-col items-center justify-center">
        <Model3DViewer
          src={model.url}
          title={model.title || lessonTitle}
          height="52vh"
          autoRotate={model.autoRotate !== false}
          interactive={true}
          transparent={true}
          className="w-full max-h-[460px]"
        />

        {/* Minimalist Floating Touch Tip */}
        <div className="pointer-events-none -mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[10px] text-cyan-200 shadow-md">
          <RotateCcw className="w-3 h-3 text-cyan-400 animate-spin" />
          <span>اسحب بإصبعك لتدوير المجسم 360° بحرية</span>
        </div>
      </div>
    </div>
  );
};
