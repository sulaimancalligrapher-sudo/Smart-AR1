import React from 'react';
import { X, Box, Sparkles, Volume2, Maximize2, RotateCw } from 'lucide-react';
import { LessonModel3D } from '../types/ar';
import { Model3DViewer } from './Model3DViewer';

interface Model3DModalProps {
  model: LessonModel3D;
  lessonTitle: string;
  onClose: () => void;
  audioUrl?: string;
}

export const Model3DModal: React.FC<Model3DModalProps> = ({
  model,
  lessonTitle,
  onClose,
  audioUrl
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-sky-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Box className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                {model.title || `مجسم ثلاثي الأبعاد: ${lessonTitle}`}
              </h3>
              <p className="text-xs text-sky-300 font-medium">عرض تفاعلي ثلاثي الأبعاد 360°</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Canvas Body */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col space-y-4">
          <Model3DViewer
            src={model.url}
            title={model.title || lessonTitle}
            height="380px"
            autoRotate={Boolean(model.autoRotate)}
            interactive={true}
          />

          {/* Quick Guidance and Audio Sync */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>استخدم إصبعك أو الفأرة للفحص من جميع الزوايا والتكبير والتصغير.</span>
            </div>

            {audioUrl && (
              <audio 
                src={audioUrl} 
                controls 
                className="h-8 max-w-[200px] outline-none"
                title="شرح صوتي متزامن مع المجسم"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-mono">
            صيغة المجسم: GLTF Binary (.glb)
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer border border-slate-700"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
