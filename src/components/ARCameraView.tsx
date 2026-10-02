import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, X, Eye, FileSpreadsheet, AlertTriangle, Layers, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { LessonData } from '../types/ar';
import { analytics } from '../services/analytics';
import { targetCompiler } from '../services/targetCompiler';

interface ARCameraViewProps {
  lessons: LessonData[];
  activeLesson: LessonData | null;
  onTargetDetected: (lesson: LessonData) => void;
  onTargetLost: (lesson: LessonData) => void;
  onCloseCamera: () => void;
  onOpenTargetCards: () => void;
  onOpenTeacherConsole: () => void;
}

// Audio chime when target is matched
function playMatchChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  lessons,
  activeLesson,
  onTargetDetected,
  onTargetLost,
  onCloseCamera,
  onOpenTargetCards,
  onOpenTeacherConsole
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoFallbackRef = useRef<HTMLVideoElement | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMindArActive, setIsMindArActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showSimBar, setShowSimBar] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const mindarThreeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function initAR() {
      setCameraLoading(true);
      setCameraError(null);

      // Check for HTTPS / Localhost security requirement
      if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        setCameraError('يتطلب استخدام الكاميرا تشغيل الموقع عبر بروتوكول HTTPS المشفر.');
        setCameraLoading(false);
        return;
      }

      if (lessons.length === 0) {
        setCameraError('لم يتم إضافة أي دروس بعد! يرجى فتح محرر الدروس (أيقونة الجدول في الأعلى) وإضافة درسك الأول وصورته أولاً.');
        setCameraLoading(false);
        return;
      }

      // 1. Wait for MindARThree to be ready from module imports (up to 6 seconds)
      let attempts = 0;
      while (!window.MINDAR?.IMAGE?.MindARThree && attempts < 60) {
        if (isCancelled) return;
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (window.MINDAR?.IMAGE?.MindARThree && containerRef.current) {
        try {
          const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: targetCompiler.getActiveMindUrl(),
            filterMinCF: 0.0005,
            filterBeta: 1000,
            uiScanning: 'no',
            uiLoading: 'no'
          });

          mindarThreeRef.current = mindarThree;

          // Attach anchors safely (default targets.mind contains targetIndex 0 and 1)
          const isCustom = targetCompiler.hasCustomTargets();
          lessons.forEach((lesson) => {
            if (!isCustom && lesson.targetIndex > 1) {
              return;
            }
            const anchor = mindarThree.addAnchor(lesson.targetIndex);
            anchor.onTargetFound = () => {
              if (isCancelled) return;
              setIsScanning(false);
              playMatchChime();
              if ('vibrate' in navigator) {
                try { navigator.vibrate(100); } catch (_) {}
              }
              onTargetDetected(lesson);
            };
            anchor.onTargetLost = () => {
              if (isCancelled) return;
              onTargetLost(lesson);
            };
          });

          try {
            await mindarThree.start();
          } catch (firstErr) {
            console.warn('First mindarThree.start() failed (likely environment camera missing on desktop), trying user camera:', firstErr);
            mindarThree.shouldFaceUser = true;
            await mindarThree.start();
          }

          // CRITICAL: MindAR requires renderer.setAnimationLoop to process video frames continuously
          const { renderer, scene, camera } = mindarThree;
          renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
          });

          if (!isCancelled) {
            setIsMindArActive(true);
            setCameraLoading(false);
          }
          return;
        } catch (mindarErr) {
          console.warn('MindAR start failed or targets.mind not found, using direct camera stream:', mindarErr);
        }
      }

      // 2. Direct Camera Stream Fallback (getUserMedia)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        if (videoFallbackRef.current) {
          videoFallbackRef.current.srcObject = stream;
          await videoFallbackRef.current.play();
        }

        setIsMindArActive(false);
        setCameraLoading(false);
      } catch (err: unknown) {
        console.error('Camera access error:', err);
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('تم رفض إذن الكاميرا. يرجى السماح للمتصفح بالوصول للكاميرا من إعدادات الموقع.');
        } else if (error.name === 'NotFoundError') {
          setCameraError('لم يتم العثور على كاميرا في جهازك.');
        } else {
          setCameraError('تعذر تشغيل الكاميرا: ' + (error.message || 'خطأ غير معروف'));
        }
        setCameraLoading(false);
      }
    }

    initAR();

    return () => {
      isCancelled = true;
      if (mindarThreeRef.current) {
        try {
          mindarThreeRef.current.renderer?.setAnimationLoop(null);
          mindarThreeRef.current.stop();
        } catch (e) {
          console.warn('Error stopping mindarThree:', e);
        }
        mindarThreeRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, lessons]);

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* 1. MindAR Container (renders video & three.js canvas) */}
      <div 
        ref={containerRef}
        className="mindar-container absolute inset-0 w-full h-full z-0 overflow-hidden"
      />

      {/* 2. Direct Camera Stream Fallback Video */}
      {!isMindArActive && (
        <video
          ref={videoFallbackRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Top Floating Action Bar */}
      <div className="absolute top-0 inset-x-0 z-40 p-3 sm:p-4 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Close Camera Button */}
        <button
          onClick={onCloseCamera}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
          title="الخروج من الكاميرا"
          aria-label="الخروج من الكاميرا"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Status Indicator Banner */}
        <div className="px-3.5 py-1.5 rounded-full ar-glass-panel border border-white/20 text-xs font-bold flex items-center gap-2 text-white shadow-lg max-w-[65%] truncate">
          {activeLesson ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="truncate">✓ تم التعرف: {activeLesson.title}</span>
            </>
          ) : (
            <>
              <span className={`w-2.5 h-2.5 rounded-full ${isMindArActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="truncate">
                {isMindArActive ? '🟢 الماسح البصري الذكي يبحث عن صورة الدرس...' : '📖 وجّه الكاميرا إلى صورة الدرس'}
              </span>
            </>
          )}
        </div>

        {/* Secondary Tool Buttons */}
        <div className="flex items-center gap-2">
          {/* Target Cards View */}
          <button
            onClick={onOpenTargetCards}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="عرض بطاقات الدروس للطباعة أو المسح"
            aria-label="عرض بطاقات الدروس"
          >
            <Eye className="w-4 h-4 text-sky-400" />
          </button>

          {/* Teacher / Sheets Analytics Console */}
          <button
            onClick={onOpenTeacherConsole}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="سجل أحداث Google Sheets"
            aria-label="سجل أحداث Google Sheets"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* Target Scanning Reticle / Viewfinder Frame */}
      {!activeLesson && !cameraLoading && !cameraError && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-sky-400/50 rounded-3xl animate-scan-glow flex flex-col items-center justify-between p-4 shadow-2xl">
            {/* Viewfinder Corners */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-400 rounded-br-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl" />

            <div className="mt-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-sky-200 border border-sky-400/30">
              وجّه الكاميرا إلى صورة الدرس في الكتاب
            </div>

            <div className="text-center">
              <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-md border border-white/10 block">
                MindAR Image Tracking نشط
              </span>
            </div>
          </div>

          {/* Scanning Guidance Pill */}
          <div className="mt-4 pointer-events-none">
            <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-sky-200 border border-sky-400/30 shadow-lg text-center block">
              📖 قرّب الكاميرا ببطء من صورة الدرس حتى تظهر كاملة في المربع
            </span>
          </div>

          {/* Quick Helper Simulator Trigger */}
          <div className="mt-3 flex flex-col items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => {
                playMatchChime();
                onTargetDetected(lessons[0]);
              }}
              className="py-1.5 px-4 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              title="تجربة تفاعلية مباشرة لدرس دورة الماء"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>⚡ تجربة التعرف الفوري بنقرة واحدة (محاكاة الكاميرا)</span>
            </button>
            <span className="text-[10px] text-slate-400 bg-black/60 px-2.5 py-0.5 rounded-full text-center">
              💡 يتيح لك فك القفل فوراً إذا كانت شاشة الكمبيوتر تسبب انعكاساً لكاميرا الويب
            </span>
          </div>
        </div>
      )}

      {/* Camera Loading Overlay */}
      {cameraLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center text-white">
          <div className="w-16 h-16 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-4" />
          <h3 className="text-base font-bold mb-1">جارٍ تشغيل الكاميرا ومحرك الواقع المعزز...</h3>
          <p className="text-xs text-slate-400 max-w-xs">يرجى الموافقة على طلب إذن الكاميرا إذا ظهر في أعلى المتصفح</p>
        </div>
      )}

      {/* Camera Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-rose-300 mb-1">تنبيه في تشغيل الكاميرا</h3>
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">{cameraError}</p>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
            <button
              onClick={() => window.location.reload()}
              className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              إعادة تحميل الصفحة والمحاولة
            </button>
            <button
              onClick={onCloseCamera}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              العودة للشاشة الرئيسية
            </button>
          </div>
        </div>
      )}

      {/* Quick Lesson Simulator Toggle (Available when camera is running) */}
      <div className="absolute bottom-3 left-3 z-40 pointer-events-auto">
        <button
          onClick={() => setShowSimBar(!showSimBar)}
          className="px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 text-xs font-medium flex items-center gap-1.5 shadow-lg cursor-pointer"
          title="اختبار الدروس يدوياً"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>اختبار الدروس ({lessons.length})</span>
        </button>
      </div>

      {/* Simulator Drawer */}
      {showSimBar && (
        <div className="absolute bottom-14 left-3 right-3 z-40 max-w-md mx-auto p-3 rounded-2xl ar-glass-panel border border-white/20 shadow-2xl pointer-events-auto space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold text-white">اختر درساً لمحاكاة التعرف الفوري:</span>
            <button
              onClick={() => setShowSimBar(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {lessons.map((lesson) => (
              <button
                key={lesson.targetId}
                onClick={() => {
                  onTargetDetected(lesson);
                  setShowSimBar(false);
                }}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-right text-xs text-slate-200 transition-colors cursor-pointer truncate"
              >
                <span className="text-[10px] text-sky-400 font-mono block">
                  {lesson.targetId}
                </span>
                <span className="font-bold truncate block">
                  {lesson.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
