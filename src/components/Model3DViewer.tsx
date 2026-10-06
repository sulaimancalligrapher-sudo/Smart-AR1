import React, { useEffect, useRef, useState } from 'react';
import { Box, RotateCcw, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any;
    }
  }
}

interface Model3DViewerProps {
  src: string;
  title?: string;
  className?: string;
  height?: string;
  autoRotate?: boolean;
  interactive?: boolean;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  src,
  title = 'مجسم ثلاثي الأبعاد',
  className = '',
  height = '300px',
  autoRotate = true,
  interactive = true,
}) => {
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
  }, [src]);

  return (
    <div 
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-center ${className}`}
      style={{ height }}
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Model-Viewer Component (Standard Web Component) */}
      <model-viewer
        ref={(el: any) => {
          viewerRef.current = el;
          if (el) {
            el.addEventListener('load', () => setIsLoading(false));
            el.addEventListener('error', () => {
              setIsLoading(false);
              setLoadError('تعذر تحميل ملف المجسم. تأكد من أن الرابط مباشر وينتهي بـ .glb');
            });
          }
        }}
        src={src}
        alt={title}
        auto-rotate={autoRotate ? 'true' : undefined}
        camera-controls={interactive ? 'true' : undefined}
        touch-action="pan-y"
        shadow-intensity="1.2"
        shadow-softness="0.8"
        exposure="1"
        style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
      >
        {/* Loading Spinner Slot */}
        {isLoading && (
          <div slot="poster" className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm text-slate-300 gap-2 z-10">
            <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
            <span className="text-xs font-semibold">جارٍ تحميل المجسم 3D...</span>
          </div>
        )}
      </model-viewer>

      {/* Error state fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center z-20 space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-rose-200 max-w-xs">{loadError}</p>
          <span className="text-[10px] text-slate-400 font-mono break-all max-w-xs">{src}</span>
        </div>
      )}

      {/* Floating Interactive Badge */}
      {!isLoading && !loadError && interactive && (
        <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] text-sky-300">
          <RotateCcw className="w-3 h-3 text-sky-400 animate-pulse" />
          <span>اسحب للتدوير 360° · قرّب للتكبير</span>
        </div>
      )}
    </div>
  );
};
