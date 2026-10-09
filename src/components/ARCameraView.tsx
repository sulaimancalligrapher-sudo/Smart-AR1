import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, X, Eye, FileSpreadsheet, AlertTriangle, Zap, BookOpen, Focus, CheckCircle2, Box, Layers } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LessonData } from '../types/ar';
import { getStoredLessons, DEFAULT_LESSONS } from '../data/lessons';
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
  showFloatingModel?: boolean;
}

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
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

/**
 * دالة لإنشاء قاعدة ثلاثية الأبعاد هولوجرافية متوهجة تثبت فوراً فوق الصورة
 * تعطي تأكيداً بصرياً فورياً بأن تتبع الواقع المعزز قيد العمل
 */
function createHolographicPedestal(THREE_NS: any) {
  const baseGroup = new THREE_NS.Group();

  // 1. حلقة دائرية خارجية شفافة متوهجة
  const ringGeo = new THREE_NS.RingGeometry(0.36, 0.40, 48);
  const ringMat = new THREE_NS.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.75,
    side: THREE_NS.DoubleSide
  });
  const ringMesh = new THREE_NS.Mesh(ringGeo, ringMat);
  baseGroup.add(ringMesh);

  // 2. قرص داخلي شبه شفاف
  const discGeo = new THREE_NS.CircleGeometry(0.34, 48);
  const discMat = new THREE_NS.MeshBasicMaterial({
    color: 0x0ea5e9,
    transparent: true,
    opacity: 0.22,
    side: THREE_NS.DoubleSide
  });
  const discMesh = new THREE_NS.Mesh(discGeo, discMat);
  baseGroup.add(discMesh);

  // 3. علامات زوايا وشبكة AR دقيقة
  const crossGeo = new THREE_NS.RingGeometry(0.18, 0.20, 24);
  const crossMat = new THREE_NS.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.6,
    side: THREE_NS.DoubleSide
  });
  const innerRing = new THREE_NS.Mesh(crossGeo, crossMat);
  baseGroup.add(innerRing);

  // رفع القاعدة قليلاً جداً عن سطح الصورة لمنع تداخل Z-fighting
  baseGroup.position.z = 0.01;

  return baseGroup;
}

/**
 * مجسم AR هولوجرافي هندسي متلألئ (كرستالة ثلاثية الأبعاد)
 * يُعرض في حال تعذر تحميل GLB أو عدم وجود رابط لضمان عمل تجربة الواقع المعزز دائماً
 */
function createARCrystalFallback(THREE_NS: any) {
  const group = new THREE_NS.Group();

  const geometry = new THREE_NS.OctahedronGeometry(0.22, 0);
  const material = new THREE_NS.MeshStandardMaterial({
    color: 0x00ffff,
    metalness: 0.8,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9,
    wireframe: false
  });
  const crystal = new THREE_NS.Mesh(geometry, material);
  group.add(crystal);

  const wireGeo = new THREE_NS.OctahedronGeometry(0.23, 0);
  const wireMat = new THREE_NS.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.5
  });
  const wire = new THREE_NS.Mesh(wireGeo, wireMat);
  group.add(wire);

  group.position.z = 0.22;
  return group;
}

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  lessons,
  activeLesson,
  onTargetDetected,
  onTargetLost,
  onCloseCamera,
  onOpenTargetCards,
  onOpenTeacherConsole,
  showFloatingModel = true
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

  // مراجع لحفظ مجموعات المحتوى ثلاثي الأبعاد لكل هدف (Anchor)
  const anchorsRef = useRef<Map<number, any>>(new Map());
  const contentGroupsRef = useRef<Map<number, any>>(new Map());
  const modelEntriesRef = useRef<
    Map<
      number,
      {
        modelWrapper: any;
        pedestalGroup?: any;
        mixer?: any;
        autoRotate: boolean;
      }
    >
  >(new Map());

  // مزامنة حالة إظهار المجسم المعلق مع مجموعات المحتوى
  useEffect(() => {
    contentGroupsRef.current.forEach((group) => {
      if (group) {
        group.visible = showFloatingModel;
      }
    });
  }, [showFloatingModel]);

  const applyAutoFocus = useCallback(() => {
    setShowFocusRing(true);
    setTimeout(() => setShowFocusRing(false), 1200);

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
          if (caps.whiteBalanceMode && caps.whiteBalanceMode.includes('continuous')) {
            advanced.push({ whiteBalanceMode: 'continuous' });
          }
          if (advanced.length > 0) {
            track.applyConstraints({ advanced } as any).catch(() => {});
          }
        } catch (_) {}
      });
    }
  }, []);

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

      if (
        window.location.protocol !== 'https:' &&
        window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1'
      ) {
        setCameraError('يتطلب استخدام الكاميرا تشغيل الموقع عبر بروتوكول HTTPS المشفر.');
        setCameraLoading(false);
        return;
      }

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

      const targetFacingUser = facingMode === 'user';

      let attempts = 0;
      while (!window.MINDAR?.IMAGE?.MindARThree && attempts < 40) {
        if (isCancelled) return;
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (window.MINDAR?.IMAGE?.MindARThree && containerRef.current) {
        try {
          // تفريغ أي حاوية سابقة
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }

          const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: targetCompiler.getActiveMindUrl(),
            filterMinCF: 0.001,
            filterBeta: 100,
            uiScanning: 'no',
            uiLoading: 'no'
          });

          mindarThree.shouldFaceUser = targetFacingUser;
          mindarThreeRef.current = mindarThree;
          const { renderer, scene, camera } = mindarThree;

          // استخدام كائن Three الموحد من المتصفح لضمان توافق تام مع MindAR
          const THREE_NS = (window as any).THREE || THREE;
          const GLTFLoaderClass = (window as any).GLTFLoader || GLTFLoader;

          // إضاءة غنية ومناسبة للمجسمات ثلاثية الأبعاد PBR
          const ambientLight = new THREE_NS.AmbientLight(0xffffff, 2.0);
          scene.add(ambientLight);

          const hemiLight = new THREE_NS.HemisphereLight(0xffffff, 0x444455, 1.5);
          scene.add(hemiLight);

          const dirLight = new THREE_NS.DirectionalLight(0xffffff, 2.5);
          dirLight.position.set(2, 5, 5);
          scene.add(dirLight);

          const fillLight = new THREE_NS.DirectionalLight(0x99ccff, 1.2);
          fillLight.position.set(-2, -3, 2);
          scene.add(fillLight);

          // إعداد الـ Anchors وربط المجسمات ثلاثية الأبعاد بكل صورة هدف
          activeLessons.forEach((lesson, index) => {
            const targetIdx =
              typeof lesson.targetIndex === 'number' && !isNaN(lesson.targetIndex)
                ? lesson.targetIndex
                : index;

            const anchor = mindarThree.addAnchor(targetIdx);
            anchorsRef.current.set(targetIdx, anchor);

            // حاوية المحتوى ثلاثي الأبعاد المربوطة بالـ Anchor
            const contentGroup = new THREE_NS.Group();
            contentGroup.visible = showFloatingModel;
            anchor.group.add(contentGroup);
            contentGroupsRef.current.set(targetIdx, contentGroup);

            // 1. إضافة قاعدة هولوجرافية بصرية للواقع المعزز
            const pedestalGroup = createHolographicPedestal(THREE_NS);
            contentGroup.add(pedestalGroup);

            // 2. تحميل المجسم ثلاثي الأبعاد الحقيقي للدرس (GLTF / GLB)
            // نستخدم المجسم المخصص للواقع المعزز arModel3d إن وجد، أو نعتمد على model3d تلقائياً لمنع التكرار
            const targetARModel = lesson.arModel3d?.url ? lesson.arModel3d : lesson.model3d;

            if (targetARModel?.url) {
              const modelWrapper = new THREE_NS.Group();
              contentGroup.add(modelWrapper);

              const loader = new GLTFLoaderClass();
              loader.load(
                targetARModel.url,
                (gltf: any) => {
                  if (isCancelled) return;
                  const model = gltf.scene;

                  // حساب أبعاد المجسم بدقة وتوحيد حجمه بالنسبة لأبعاد البطاقة (1.0)
                  model.updateMatrixWorld(true);
                  const box = new THREE_NS.Box3().setFromObject(model);
                  const size = box.getSize(new THREE_NS.Vector3());
                  const center = box.getCenter(new THREE_NS.Vector3());

                  const maxDim = Math.max(size.x, size.y, size.z) || 1;
                  // حجم مثالي: يملأ حوالي 55% من عرض البطاقة
                  const targetScale = 0.55 / maxDim;
                  model.scale.setScalar(targetScale);

                  // محاذاة المجسم في المنتصف ورفعه فوق سطح البطاقة مباشرة
                  model.position.x = -center.x * targetScale;
                  model.position.y = -center.y * targetScale;
                  model.position.z = 0.05;

                  // تفعيل الظلال وتعديل المواد للرؤية من جميع الزوايا
                  model.traverse((child: any) => {
                    if (child.isMesh) {
                      child.castShadow = true;
                      if (child.material) {
                        child.material.side = THREE_NS.DoubleSide;
                      }
                    }
                  });

                  modelWrapper.add(model);

                  // دعم تحريك الرسوم المتحركة إذا كان المجسم يحتوي على أنيميشن
                  let mixer: any = null;
                  if (gltf.animations && gltf.animations.length > 0) {
                    mixer = new THREE_NS.AnimationMixer(model);
                    const action = mixer.clipAction(gltf.animations[0]);
                    action.play();
                  }

                  modelEntriesRef.current.set(targetIdx, {
                    modelWrapper,
                    pedestalGroup,
                    mixer,
                    autoRotate: targetARModel.autoRotate ?? true
                  });
                },
                undefined,
                (err: any) => {
                  console.warn(`فشل تحميل مجسم GLB للدرس ${lesson.title}، استخدام بديل هولوجرافي:`, err);
                  const crystal = createARCrystalFallback(THREE_NS);
                  contentGroup.add(crystal);
                  modelEntriesRef.current.set(targetIdx, {
                    modelWrapper: crystal,
                    pedestalGroup,
                    mixer: null,
                    autoRotate: true
                  });
                }
              );
            } else {
              // إذا لم يتوفر رابط مجسم للدرس، عرض كرستالة هولوجرافية تفاعلية
              const crystal = createARCrystalFallback(THREE_NS);
              contentGroup.add(crystal);
              modelEntriesRef.current.set(targetIdx, {
                modelWrapper: crystal,
                pedestalGroup,
                mixer: null,
                autoRotate: true
              });
            }

            // أحداث العثور على الهدف وفقدانه
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
                try {
                  navigator.vibrate(100);
                } catch (_) {}
              }

              console.log('🎯 تم التعرف على صورة الدرس وتثبيت المجسم:', lesson.title);
              onTargetDetected(lesson);
            };

            anchor.onTargetLost = () => {
              if (isCancelled) return;
              if (targetLostTimer) clearTimeout(targetLostTimer);
              targetLostTimer = setTimeout(() => {
                if (!isCancelled) {
                  // لا نحذف المجسم من الـ group! MindAR يقوم بإخفائه تلقائياً وسيعود فوراً عند رؤية الصورة
                  onTargetLost(lesson);
                }
              }, 1500);
            };
          });

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

          // حلقة الرسوم المتحركة المتكاملة
          const clock = new THREE_NS.Clock();
          renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // تحديث حركة المجسمات والقواعد الهولوجرافية
            modelEntriesRef.current.forEach((entry) => {
              if (entry.mixer) {
                entry.mixer.update(delta);
              }
              if (entry.autoRotate && entry.modelWrapper) {
                // تدوير المجسم حول محوره ليظهر بشكل حيوي جذاب
                entry.modelWrapper.rotation.y += delta * 0.7;
              }
              if (entry.pedestalGroup) {
                // تدوير حلقة القاعدة الهولوجرافية ببطء
                entry.pedestalGroup.rotation.z += delta * 0.4;
              }
            });

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

      // خطة بديلة للكاميرا في حال تعذر تشغيل محرك MindAR مباشرة
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
          console.warn('Initial facingMode stream failed, trying any camera:', initialErr);
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
          });
        }

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoFallbackRef.current) {
          videoFallbackRef.current.srcObject = stream;
          videoFallbackRef.current.play().catch(() => {});
        }

        setCameraLoading(false);
      } catch (error: any) {
        if (isCancelled) return;
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
      anchorsRef.current.clear();
      contentGroupsRef.current.clear();
      modelEntriesRef.current.clear();
    };
  }, [facingMode, lessons.length]);

  const handleSimulateFirstLesson = () => {
    if (lessons.length > 0) {
      playMatchChime();
      const firstLesson = lessons[0];
      const targetIdx =
        typeof firstLesson.targetIndex === 'number' && !isNaN(firstLesson.targetIndex)
          ? firstLesson.targetIndex
          : 0;
      
      // إظهار المحتوى التفاعلي للـ anchor في وضع المحاكاة
      const contentGroup = contentGroupsRef.current.get(targetIdx);
      if (contentGroup) {
        contentGroup.visible = true;
      }
      const anchor = anchorsRef.current.get(targetIdx);
      if (anchor && anchor.group) {
        anchor.group.visible = true;
      }

      onTargetDetected(firstLesson);
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-black overflow-hidden select-none">
      {/* 1. حاوية عرض محرك MindAR ثلاثي الأبعاد + الكاميرا الحية */}
      <div
        ref={containerRef}
        onClick={applyAutoFocus}
        className="mindar-container absolute inset-0 w-full h-full z-0 overflow-hidden cursor-crosshair"
      />

      {/* 2. كاميرا بديلة احتياطية في حال تعذر تشغيل WebGL AR */}
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

      {/* 3. حلقة التركيز التلقائي (Auto-focus) */}
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

      {/* 4. شريط التحكم العلوي وشارة الحالة */}
      <div className="absolute top-0 inset-x-0 z-40 p-3 sm:p-4 flex items-center justify-between pointer-events-auto bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button
          onClick={onCloseCamera}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
          title="الخروج من الكاميرا"
        >
          <X className="w-5 h-5" />
        </button>

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

        <div className="flex items-center gap-2">
          <button
            onClick={applyAutoFocus}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="ضبط الفوكس"
          >
            <Focus className="w-4 h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="تبديل الكاميرا"
          >
            <RefreshCw className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            onClick={onOpenTargetCards}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="عرض بطاقات الدروس"
          >
            <Eye className="w-4 h-4 text-sky-400" />
          </button>

          <button
            onClick={onOpenTeacherConsole}
            className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg active:scale-95 transition-all cursor-pointer"
            title="لوحة المعلم"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </button>
        </div>
      </div>

      {/* 5. تلميح وإطار توجيه الكاميرا عند البحث */}
      {!activeLesson && !cameraLoading && !cameraError && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-sky-400/50 rounded-3xl animate-scan-glow flex flex-col items-center justify-between p-4 shadow-2xl">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-sky-400 rounded-br-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl" />

            <div className="mt-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-sky-200 border border-sky-400/30">
              وجّه الكاميرا إلى صورة الدرس في الكتاب
            </div>

            <div className="text-center">
              <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-md border border-white/10 block">
                تتبع ثلاثي الأبعاد AR نشط ومجهز
              </span>
            </div>
          </div>

          <div className="mt-4 pointer-events-none">
            <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-sky-200 border border-sky-400/30 shadow-lg text-center block">
              📖 قرّب الكاميرا ببطء من صورة الدرس حتى تظهر كاملة في المربع
            </span>
          </div>

          {lessons.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-1.5 pointer-events-auto">
              <button
                onClick={handleSimulateFirstLesson}
                className="py-1.5 px-4 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="تجربة تفاعلية مباشرة بدون كاميرا ورقية"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ تجربة التعرف الفوري بنقرة واحدة</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 6. شاشة تحميل الكاميرا ومحرك AR */}
      {cameraLoading && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/95 p-6 text-center text-white">
          <button
            onClick={onCloseCamera}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-full border-4 border-sky-500 border-t-transparent animate-spin mb-4" />

          <h3 className="text-base font-bold mb-1">
            {loadingSeconds < 3
              ? 'جارٍ تشغيل الكاميرا وتجهيز مجسمات الواقع المعزز...'
              : 'في انتظار تأكيد إذن الكاميرا...'}
          </h3>

          <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-4">
            {loadingSeconds < 3
              ? 'يرجى الانتظار ثوانٍ معدودة لبدء المسح البصري الذكي.'
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

      {/* 7. شاشة الخطأ وتنبيهات الكاميرا */}
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
              {cameraError === 'EMPTY_LESSONS' &&
                'تم إفراغ النماذج التجريبية السابقة بنجاح. يرجى فتح محرر الدروس لإضافة أول درس وصورته.'}
              {cameraError === 'PERMISSION_DENIED' &&
                'تم رفض إذن الوصول للكاميرا. يرجى الضغط على علامة القفل 🔒 واختيار (سماح / Allow).'}
              {cameraError === 'NO_CAMERA' && 'لم يتم العثور على كاميرا متصلة بجهازك الحالي.'}
              {cameraError !== 'EMPTY_LESSONS' &&
                cameraError !== 'PERMISSION_DENIED' &&
                cameraError !== 'NO_CAMERA' &&
                cameraError}
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
                <span>فتح محرر الدروس</span>
              </button>
            ) : (
              <>
                {lessons.length > 0 && (
                  <button
                    onClick={handleSimulateFirstLesson}
                    className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>⚡ تجربة محتوى الدرس فوراً</span>
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  إعادة تحميل الصفحة
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
