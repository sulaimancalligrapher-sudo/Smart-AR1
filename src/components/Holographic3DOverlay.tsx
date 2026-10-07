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
          height="54vh"
          autoRotate={model.autoRotate !== false}
          interactive={true}
          transparent={true}
          className="w-full max-h-[480px]"
        />
      </div>
    </div>
  );
};
