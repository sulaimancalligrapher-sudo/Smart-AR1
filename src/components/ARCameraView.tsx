import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, RefreshCw, X, Eye, FileSpreadsheet, AlertTriangle, Layers, Sparkles, CheckCircle2, Zap, BookOpen, Focus } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LessonData } from '../types/ar';
import { getStoredLessons, DEFAULT_LESSONS, fetchLessons } from '../data/lessons';
import { analytics } from '../services/analytics';
import { targetCompiler } from '../services/targetCompiler';

interface ARCameraViewProps {
  lessons: LessonData[];
  activeLesson: LessonData | null;
  onTargetDetected: (lesson: LessonData) => void;
  onTargetLost: (lesson: LessonData) => void;
  onCloseCamera: () => void;
  onOpenTargetCards?: () => void;
  onOpenTeacherConsole?: () => void;
  isStudentMode?: boolean;
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
  onOpenTeacherConsole,
  isStudentMode = false
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoFallbackRef = useRef<HTMLVideoElement | null>(null);
  const [cameraLoading, setCameraLoading] = useState(true);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMindArActive, setIsMindArActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isScanning, setIsScanning] = useState(true);
  const mindarThreeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [showFocusRing, setShowFocusRing] = useState(false);

  const applyAutoFocus = useCallback(() => {
    setShowFocusRing(true);
    setTimeout(() => setShowFocusRing(false), 1200);

    // 1. MindAR video element autofocus
    if (containerRef.current) {
      const vid = containerRef.current.querySelector('video') as HTMLVideoElement;
      if (vid && vid.srcObject) {
        const stream = vid.srcObject as MediaStream;
        stream.getVideoTracks().forEach((track) => {
          try {
            const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
            const advanced: any[] = [];
            if (caps.focusMode && (caps.focusMode.includes('continuous') || caps.focusMode.includes('auto'))) {
              advanced.push({ focusMode: 'continuous' });
            }
            if (caps.exposureMode && caps.exposureMode.includes('continuous')) {
              advanced.push({ exposureMode: 'continuous' });
            }
            if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('continuous')) {
              advanced.push({ whiteBalanceMode: 'continuous' });
            }
            if (advanced.length > 0) {
              track.applyConstraints({ advanced } as any).catch(() => {});
            }
          } catch (_) {}
        });
      }
    }

    // 2. Fallback stream autofocus
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        try {
          const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
          const advanced: any[] = [];
          if (caps.focusMode && (caps.focusMode.includes('continuous') || caps.focusMode.includes('auto'))) {
            advanced.push({ focusMode: 'continuous' });
          }
          if (caps.exposureMode && caps.exposureMode.includes('continuous')) {
            advanced.push({ exposureMode: 'continuous' });
          }
          if (advanced.length > 0) {
            track.applyConstraints({ advanced } as any).catch(() => {});
          }
        } catch (_) {}
      });
    }
  }, []);

  // Loading timer counter to give user progressive feedback
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (cameraLoading) {
      setLoadingSeconds(0);
      timer = setInterval(() => {
        setLoadingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cameraLoading]);

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

      // Ensure active lessons are available immediately
      let activeLessons = lessons;
      if (!activeLessons || activeLessons.length === 0) {
        activeLessons = getStoredLessons();
      }
      if (!activeLessons || activeLessons.length === 0) {
        activeLessons = DEFAULT_LESSONS;
      }

      if (activeLessons.length === 0) {
        setCameraError('EMPTY_LESSONS');
        setCameraLoading(false);
        return;
      }

      // Default facing mode: ALWAYS environment (rear camera) on mobile, tablet & desktop
      // only switch to user camera if the user explicitly requests it or device strictly lacks rear camera
      const targetFacingUser = facingMode === 'user';

      // 1. Wait for MindARThree to be ready from module imports (up to 4 seconds)
      let attempts = 0;
      while (!window.MINDAR?.IMAGE?.MindARThree && attempts < 40) {
        if (isCancelled) return;
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (window.MINDAR?.IMAGE?.MindARThree && containerRef.current) {
        try {
          const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: targetCompiler.getActiveMindUrl(),
            filterMinCF: 0.001,
            filterBeta: 100,
            uiScanning: 'no',
            uiLoading: 'no'
          });

          // Always enforce rear camera (environment) unless user explicitly toggled to front
          mindarThree.shouldFaceUser = targetFacingUser;

          mindarThreeRef.current = mindarThree;
          const { renderer, scene, camera } = mindarThree;

          // Add lighting to scene so 3D models appear brightly illuminated over the book
          const ambientLight = new THREE.AmbientLight(0xffffff, 1.8);
          scene.add(ambientLight);

          const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
          dirLight.position.set(0, 10, 10);
          scene.add(dirLight);

          const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
          fillLight.position.set(0, -10, -5);
          scene.add(fillLight);

          const animatedModels: THREE.Object3D[] = [];
          const gltfLoader = new GLTFLoader();

          // Attach anchors safely for all configured lessons
          activeLessons.forEach((lesson, index) => {
            const targetIdx = typeof lesson.targetIndex === 'number' && !isNaN(lesson.targetIndex)
              ? lesson.targetIndex
              : index;
            const anchor = mindarThree.addAnchor(targetIdx);

            let targetLostTimer: any = null;

            anchor.onTargetFound = () => {
              if (isCancelled) return;
              if (targetLostTimer) {
                clearTimeout(targetLostTimer);
                targetLostTimer = null;
              }
              setIsScanning(false);
              playMatchChime();
              if ('vibrate' in navigator) {
                try { navigator.vibrate(100); } catch (_) {}
              }
              onTargetDetected(lesson);
            };

            anchor.onTargetLost = () => {
              if (isCancelled) return;
              // 1.5s tolerance to prevent flickering when student hands tremble
              if (targetLostTimer) clearTimeout(targetLostTimer);
              targetLostTimer = setTimeout(() => {
                if (!isCancelled) {
                  onTargetLost(lesson);
                }
              }, 1500);
            };
          });

          // Start with timeout guard (8 seconds max)
          const startPromise = mindarThree.start();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('CAMERA_TIMEOUT')), 8000)
          );

          try {
            await Promise.race([startPromise, timeoutPromise]);
          } catch (startErr: any) {
            if (startErr.message === 'CAMERA_TIMEOUT') {
              throw new Error('TIMEOUT');
            }
            console.warn('Initial start failed, retrying with user camera mode:', startErr);
            mindarThree.shouldFaceUser = true;
            await mindarThree.start();
          }

          // Apply hardware autofocus and crisp video styling to MindAR video element
          if (containerRef.current) {
            const vid = containerRef.current.querySelector('video') as HTMLVideoElement;
            if (vid) {
              vid.style.objectFit = 'cover';
              vid.style.width = '100%';
              vid.style.height = '100%';
              (vid.style as any).imageRendering = '-webkit-optimize-contrast';

              const mediaStream = vid.srcObject as MediaStream;
              if (mediaStream) {
                mediaStream.getVideoTracks().forEach((track) => {
                  try {
                    const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
                    const advanced: any[] = [];
                    if (caps.focusMode && (caps.focusMode.includes('continuous') || caps.focusMode.includes('auto'))) {
                      advanced.push({ focusMode: 'continuous' });
                    }
                    if (caps.exposureMode && caps.exposureMode.includes('continuous')) {
                      advanced.push({ exposureMode: 'continuous' });
                    }
                    if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('continuous')) {
                      advanced.push({ whiteBalanceMode: 'continuous' });
                    }
                    if (advanced.length > 0) {
                      track.applyConstraints({ advanced } as any).catch(() => {});
                    }
                  } catch (e) {
                    console.warn('Autofocus constraint application failed:', e);
                  }
                });
              }
            }
          }

          // MindAR animation loop: pure camera tracking rendering (ultra lightweight, 60fps)
          renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
          });

          if (!isCancelled) {
            setIsMindArActive(true);
            setCameraLoading(false);
          }
          return;
        } catch (mindarErr: any) {
          console.warn('MindAR start failed, attempting direct camera stream fallback:', mindarErr);
          if (mindarErr.name === 'NotAllowedError' || mindarErr.name === 'PermissionDeniedError') {
            setCameraError('PERMISSION_DENIED');
            setCameraLoading(false);
            return;
          }
        }
      }

      // 2. Direct Camera Stream Fallback (getUserMedia) with HD resolution & Autofocus
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1920, min: 1280 },
              height: { ideal: 1080, min: 720 },
              advanced: [{ focusMode: 'continuous' }] as any
            },
            audio: false
          });
        } catch (initialErr) {
          // If specific facingMode failed, fallback to any available camera
          console.warn('Initial facingMode stream failed, trying any camera:', initialErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
        }

        // Apply hardware autofocus to fallback stream tracks
        stream.getVideoTracks().forEach((track) => {
          try {
            const caps = (track.getCapabilities ? track.getCapabilities() : {}) as any;
            const advanced: any[] = [];
            if (caps.focusMode && (caps.focusMode.includes('continuous') || caps.focusMode.includes('auto'))) {
              advanced.push({ focusMode: 'continuous' });
            }
            if (advanced.length > 0) {
              track.applyConstraints({ advanced } as any).catch(() => {});
            }
          } catch (_) {}
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
        console.error('Camera fallback access error:', err);
        const error = err as Error;
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setCameraError('PERMISSION_DENIED');
        } else if (error.name === 'NotFoundError') {
          setCameraError('NO_CAMERA');
        } else {
          setCameraError(error.message || 'تعذر تشغيل الكاميرا.');
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
  }, [facingMode, lessons.length]);

  const handleSimulateFirstLesson = () => {
    if (lessons.length > 0) {
      playMatchChime();
      onTargetDetected(lessons[0]);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* 1. MindAR Container (renders video & three.js canvas) */}
      <div 
        ref={containerRef}
        onClick={applyAutoFocus}
        className="mindar-container absolute inset-0 w-full h-full z-0 overflow-hidden cursor-crosshair"
      />

      {/* 2. Direct Camera Stream Fallback Video */}
      {!isMindArActive && (
        <video
          ref={videoFallbackRef}
          playsInline
          muted
          autoPlay
          onClick={applyAutoFocus}
          className="absolute inset-0 w-full h-full object-cover z-0 cursor-crosshair"
        />
      )}

      {/* Focus Ring Indicator (when user taps to focus) */}
      {showFocusRing && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center animate-fadeIn">
          <div className="w-24 h-24 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
          <div className="absolute w-14 h-14 rounded-2xl border-2 border-amber-300 flex items-center justify-center bg-amber-400/10">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <span className="absolute mt-20 text-[10px] font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded-full">
            تم ضبط التركيز التلقائي ✓
          </span>
        </div>
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
          {/* Hardware Auto-Focus Trigger */}
          <button
            onClick={applyAutoFocus}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="إعادة ضبط الفوكس والوضوح التلقائي (انقر في أي مكان على الشاشة أيضاً)"
            aria-label="ضبط الفوكس"
          >
            <Focus className="w-4 h-4 text-amber-400" />
          </button>

          {/* Flip Camera Button (Rear / Front) */}
          <button
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title={facingMode === 'environment' ? 'التبديل إلى الكاميرا الأمامية' : 'التبديل إلى الكاميرا الخلفية (الافتراضية)'}
            aria-label="تبديل الكاميرا"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Target Cards View (Hidden for students) */}
          {!isStudentMode && onOpenTargetCards && (
            <button
              onClick={onOpenTargetCards}
              className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
              title="عرض بطاقات الدروس للطباعة أو المسح"
              aria-label="عرض بطاقات الدروس"
            >
              <Eye className="w-4 h-4 text-sky-400" />
            </button>
          )}

          {/* Teacher / Sheets Analytics Console (Hidden for students) */}
          {!isStudentMode && onOpenTeacherConsole && (
            <button
              onClick={onOpenTeacherConsole}
              className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
              title="لوحة المعلم ومحرر الدروس"
              aria-label="لوحة المعلم ومحرر الدروس"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            </button>
          )}
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
                {isStudentMode ? 'الماسح الذكي نشط' : 'MindAR Image Tracking نشط'}
              </span>
            </div>
          </div>

          {/* Scanning Guidance Pill */}
          <div className="mt-4 pointer-events-none">
            <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-sky-200 border border-sky-400/30 shadow-lg text-center block">
              📖 قرّب الكاميرا ببطء من صورة الدرس حتى تظهر كاملة في المربع
            </span>
          </div>

          {/* Quick Helper Simulator Trigger (Hidden for students) */}
          {!isStudentMode && lessons.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-1.5 pointer-events-auto">
              <button
                onClick={handleSimulateFirstLesson}
                className="py-1.5 px-4 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="تجربة تفاعلية مباشرة للدرس"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ تجربة التعرف الفوري بنقرة واحدة (محاكاة الكاميرا)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera Loading Overlay with Close Button & Timeouts */}
      {cameraLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white">
          {/* Top Close Button so user is never trapped */}
          <button
            onClick={onCloseCamera}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="إلغاء والعودة"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-4" />
          
          <h3 className="text-base font-bold mb-1">
            {loadingSeconds < 3 
              ? 'جارٍ تشغيل الكاميرا ومحرك الواقع المعزز...'
              : 'في انتظار تأكيد إذن الكاميرا...'}
          </h3>

          <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-4">
            {loadingSeconds < 3
              ? 'يرجى الانتظار ثوانٍ معدودة لبدء المسح البصري.'
              : 'إذا ظهر لك مربع في أعلى المتصفح يطلب إذن الكاميرا، اضغط على (سماح / Allow).'}
          </p>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            {lessons.length > 0 && loadingSeconds >= 3 && (
              <button
                onClick={handleSimulateFirstLesson}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all animate-fadeIn"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>⚡ فتح الدرس فوراً (تخطي انتظار الكاميرا)</span>
              </button>
            )}

            <button
              onClick={onCloseCamera}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors"
            >
              ✕ إلغاء والعودة للشاشة الرئيسية
            </button>
          </div>
        </div>
      )}

      {/* Camera Error Overlay with Direct Action Buttons */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-rose-300 mb-1">
              {cameraError === 'EMPTY_LESSONS' ? 'لم يتم إضافة دروس بعد' : 'تنبيه في تشغيل الكاميرا'}
            </h3>
            
            <p className="text-xs text-slate-300 max-w-sm leading-relaxed">
              {cameraError === 'EMPTY_LESSONS' && (
                'تم إفراغ النماذج التجريبية السابقة بنجاح. يرجى فتح محرر الدروس لإضافة أول درس وصورته من كتابك المدرسي لتتمكن الكاميرا من البحث عنها.'
              )}
              {cameraError === 'PERMISSION_DENIED' && (
                'تم رفض إذن الوصول للكاميرا. يرجى الضغط على علامة القفل 🔒 أو الكاميرا بجانب رابط المتصفح واختيار (سماح / Allow) ثم إعادة التجربة.'
              )}
              {cameraError === 'NO_CAMERA' && (
                'لم يتم العثور على كاميرا متصلة بجهازك الحالي. يمكنك تجربة المحاكاة المباشرة بالزر أدناه.'
              )}
              {cameraError !== 'EMPTY_LESSONS' && cameraError !== 'PERMISSION_DENIED' && cameraError !== 'NO_CAMERA' && (
                cameraError
              )}
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
            {cameraError === 'EMPTY_LESSONS' ? (
              <button
                onClick={() => {
                  onCloseCamera();
                  onOpenTeacherConsole();
                }}
                className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span>فتح محرر الدروس وإضافة أول درس</span>
              </button>
            ) : (
              <>
                {lessons.length > 0 && (
                  <button
                    onClick={handleSimulateFirstLesson}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>⚡ تجربة محتوى الدرس فوراً (بدون كاميرا)</span>
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  إعادة تحميل الصفحة والمحاولة
                </button>
              </>
            )}

            <button
              onClick={onCloseCamera}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              العودة للشاشة الرئيسية
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
