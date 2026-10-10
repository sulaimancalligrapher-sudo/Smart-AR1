import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, X, Eye, FileSpreadsheet, Focus, Sparkles } from 'lucide-react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LessonData, getActiveLessonModel } from '../types/ar';
import { getStoredLessons, DEFAULT_LESSONS } from '../data/lessons';
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

// ذاكرة تخزين مؤقت عامة للملفات ثلاثية الأبعاد لمنع أي تأخير في الظهور (0 ثانية تأخير)
const gltfBufferCache = new Map<string, ArrayBuffer>();

/**
 * دالة آمنة وفورية لتحميل وتغذية أي ملف GLB مع دعم الذاكرة المسبقة
 */
async function loadGLTFModelSafe(
  url: string,
  GLTFLoaderClass: any,
  onSuccess: (gltf: any) => void,
  onError: (err: any) => void
) {
  try {
    const loader = new GLTFLoaderClass();

    // 1. إذا كان الملف محملاً مسبقاً في الذاكرة، يتم عرضه فوراً في جزء من الألف من الثانية
    if (gltfBufferCache.has(url)) {
      const cached = gltfBufferCache.get(url)!;
      loader.parse(cached.slice(0), '', onSuccess, onError);
      return;
    }

    // 2. قراءة الملف وتخزينه في الكاش للاستخدام المتكرر السريع
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        gltfBufferCache.set(url, buffer);
        loader.parse(buffer.slice(0), '', onSuccess, onError);
        return;
      }
    } catch (fetchErr) {
      console.warn('Fetch arrayBuffer failed, fallback to direct loader.load:', fetchErr);
    }

    // 3. التحميل المباشر كخطة بديلة
    loader.load(url, onSuccess, undefined, onError);
  } catch (e) {
    onError(e);
  }
}

/**
 * مجسم ثلاثي أبعاد هولوجرافي بديل يظهر فقط إذا تعذر تحميل الملف بالكامل لمنع أي فراغ
 */
function createARCrystalFallback(THREE_NS: any, scale = 0.3) {
  const group = new THREE_NS.Group();
  group.name = 'fallbackCrystal';

  const geometry = new THREE_NS.OctahedronGeometry(scale, 0);
  const material = new THREE_NS.MeshBasicMaterial({
    color: 0x00f0ff,
    wireframe: true,
    transparent: true,
    opacity: 0.9
  });
  const crystal = new THREE_NS.Mesh(geometry, material);
  group.add(crystal);

  const innerGeo = new THREE_NS.OctahedronGeometry(scale * 0.55, 0);
  const innerMat = new THREE_NS.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95
  });
  const inner = new THREE_NS.Mesh(innerGeo, innerMat);
  group.add(inner);

  group.position.z = 0.15;
  return group;
}

/**
 * توحيد أبعاد وتمركز المجسم ثلاثي الأبعاد فوق صفحة الكتاب بحجم كبير وبارز وبدون أي خلفيات أو تظليل
 */
function setupModelForAnchor(model: any, THREE_NS: any) {
  model.updateMatrixWorld(true);
  const box = new THREE_NS.Box3().setFromObject(model);
  const size = box.getSize(new THREE_NS.Vector3());
  const center = box.getCenter(new THREE_NS.Vector3());

  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  // مقياس ملحوظ وكبير وبارز (1.35) ليملأ سطح البطاقة أو الكلمة بوضوح ممتاز
  const targetScale = 1.35 / maxDim;
  model.scale.setScalar(targetScale);

  // تمركز المجسم تماماً فوق نقطة الارتكاز مع رفعه قليلاً فوق الورقة ليطفو بحرية
  model.position.x = -center.x * targetScale;
  model.position.y = -center.y * targetScale;
  model.position.z = 0.14;

  // إزالة أي ظلال أرضية معتمة لضمان بقاء المجسم نقياً وواضحاً بدون أي خلفيات تظليل
  model.traverse((child: any) => {
    if (child.isMesh) {
      child.castShadow = false;
      child.receiveShadow = false;
      if (child.material) {
        child.material.side = THREE_NS.DoubleSide;
        child.material.needsUpdate = true;
      }
      child.frustumCulled = false;
    }
  });
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
  const [showFocusRing, setShowFocusRing] = useState(false);
  const [isPhysicalTargetTracked, setIsPhysicalTargetTracked] = useState(false);

  const mindarThreeRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // مراجع لتتبع مجموعات الـ Anchors والمجسمات ثلاثية الأبعاد
  const anchorsRef = useRef<Map<number, any>>(new Map());
  const anchorContentGroupsRef = useRef<Map<number, any>>(new Map());
  const modelEntriesRef = useRef<
    Map<
      number,
      {
        modelWrapper: any;
        mixer?: any;
        autoRotate: boolean;
      }
    >
  >(new Map());

  // مزامنة حالة تشغيل/إخفاء المجسم المعلق مع مجاميع الـ Anchors
  useEffect(() => {
    anchorContentGroupsRef.current.forEach((group) => {
      if (group) {
        group.visible = Boolean(showFloatingModel);
      }
    });
  }, [showFloatingModel]);

  // التحميل المسبق للمجسمات في الذاكرة لتكون جاهزة فوراً عند التعرف البصري (0 ثانية تأخير)
  useEffect(() => {
    lessons.forEach((l) => {
      const m = getActiveLessonModel(l, true);
      if (m?.url && !gltfBufferCache.has(m.url)) {
        fetch(m.url)
          .then((r) => (r.ok ? r.arrayBuffer() : null))
          .then((buf) => {
            if (buf && m.url) gltfBufferCache.set(m.url, buf);
          })
          .catch(() => {});
      }
    });
  }, [lessons]);

  // دالة لتحديث أو تحميل مجسم الدرس على الـ Anchor المعني
  const updateAnchorModel = useCallback((targetIdx: number, lesson: LessonData) => {
    const contentGroup = anchorContentGroupsRef.current.get(targetIdx);
    if (!contentGroup) return;

    const THREE_NS = (window as any).THREE || THREE;
    const GLTFLoaderClass = (window as any).GLTFLoader || GLTFLoader;

    let modelWrapper = contentGroup.getObjectByName('modelWrapper');
    if (!modelWrapper) {
      modelWrapper = new THREE_NS.Group();
      modelWrapper.name = 'modelWrapper';
      contentGroup.add(modelWrapper);
    }

    // تنظيف أي مجسمات سابقة
    while (modelWrapper.children.length > 0) {
      modelWrapper.remove(modelWrapper.children[0]);
    }

    // نعتمد على دالة getActiveLessonModel: إذا لم يُحدد رابط في الـ AR، يأخذ تلقائياً مجسم النوع الثاني دون تكرار!
    const targetModel = getActiveLessonModel(lesson, true);

    modelEntriesRef.current.set(targetIdx, {
      modelWrapper,
      mixer: null,
      autoRotate: targetModel?.autoRotate !== false
    });

    if (targetModel?.url && targetModel.url.trim() !== '') {
      loadGLTFModelSafe(
        targetModel.url,
        GLTFLoaderClass,
        (gltf: any) => {
          // تنظيف أي محتوى سابق عند اكتمال التحميل
          while (modelWrapper.children.length > 0) {
            modelWrapper.remove(modelWrapper.children[0]);
          }

          const model = gltf.scene;
          setupModelForAnchor(model, THREE_NS);
          modelWrapper.add(model);

          let mixer: any = null;
          if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE_NS.AnimationMixer(model);
            const action = mixer.clipAction(gltf.animations[0]);
            action.play();
          }

          modelEntriesRef.current.set(targetIdx, {
            modelWrapper,
            mixer,
            autoRotate: targetModel.autoRotate !== false
          });
          console.log(`🎯 تم تحميل وربط مجسم الـ GLB للهدف ${lesson.title} بنجاح!`);
        },
        (err: any) => {
          console.warn(`تعذر تحميل GLB للدرس ${lesson.title}، الإبقاء على المجسم الافتراضي:`, err);
          if (modelWrapper.children.length === 0) {
            const fb = createARCrystalFallback(THREE_NS, 0.3);
            modelWrapper.add(fb);
          }
        }
      );
    } else {
      // إذا لم يحدد المعلم أي مجسم إطلاقاً
      const fb = createARCrystalFallback(THREE_NS, 0.3);
      modelWrapper.add(fb);
    }
  }, []);

  // مزامنة المجسمات مع الدروس كلما تم تعديل أو إضافة ملف جديد من لوحة المعلم
  useEffect(() => {
    if (anchorContentGroupsRef.current.size === 0) return;
    lessons.forEach((l, idx) => {
      const targetIdx = typeof l.targetIndex === 'number' && !isNaN(l.targetIndex) ? l.targetIndex : idx;
      updateAnchorModel(targetIdx, l);
    });
  }, [lessons, updateAnchorModel]);

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

  // تشغيل محرك MindAR وتجهيز المشهد والكاميرا
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
          while (containerRef.current.firstChild) {
            containerRef.current.removeChild(containerRef.current.firstChild);
          }

          const mindarThree = new window.MINDAR.IMAGE.MindARThree({
            container: containerRef.current,
            imageTargetSrc: targetCompiler.getActiveMindUrl(),
            filterMinCF: 0.0005,
            filterBeta: 1000,
            warmupTolerance: 4,
            missTolerance: 6,
            uiScanning: 'no',
            uiLoading: 'no'
          });

          mindarThree.shouldFaceUser = targetFacingUser;
          mindarThreeRef.current = mindarThree;
          const { renderer, scene, camera } = mindarThree;

          if (renderer.domElement) {
            renderer.domElement.style.position = 'absolute';
            renderer.domElement.style.left = '0px';
            renderer.domElement.style.top = '0px';
            renderer.domElement.style.width = '100%';
            renderer.domElement.style.height = '100%';
            renderer.domElement.style.zIndex = '1';
            renderer.domElement.style.pointerEvents = 'none';
          }

          const THREE_NS = (window as any).THREE || THREE;

          // إضاءة PBR واضحة وشاملة
          const ambientLight = new THREE_NS.AmbientLight(0xffffff, 2.5);
          scene.add(ambientLight);

          const hemiLight = new THREE_NS.HemisphereLight(0xffffff, 0x444455, 1.8);
          scene.add(hemiLight);

          const dirLight = new THREE_NS.DirectionalLight(0xffffff, 2.8);
          dirLight.position.set(2, 5, 5);
          scene.add(dirLight);

          const fillLight = new THREE_NS.DirectionalLight(0x99ccff, 1.5);
          fillLight.position.set(-2, -3, 2);
          scene.add(fillLight);

          // -------------------------------------------------------------
          // ⭐ إعداد الـ Anchors وتثبيت المجسمات على بطاقات الورقة في الكتاب ⭐
          // -------------------------------------------------------------
          activeLessons.forEach((lesson, index) => {
            const targetIdx =
              typeof lesson.targetIndex === 'number' && !isNaN(lesson.targetIndex)
                ? lesson.targetIndex
                : index;

            const anchor = mindarThree.addAnchor(targetIdx);
            anchorsRef.current.set(targetIdx, anchor);

            const contentGroup = new THREE_NS.Group();
            contentGroup.visible = showFloatingModel;
            anchor.group.add(contentGroup);
            anchorContentGroupsRef.current.set(targetIdx, contentGroup);

            // تحميل وربط المجسم مباشرة فوق صفحة الكتاب بدون أي قاعدة أو تظليل
            updateAnchorModel(targetIdx, lesson);

            // 3. أحداث التعرف البصري على الورقة مع مهلة نعومة لتفادي الاهتزاز
            let targetLostTimer: any = null;
            anchor.onTargetFound = () => {
              if (isCancelled) return;
              if (targetLostTimer) {
                clearTimeout(targetLostTimer);
                targetLostTimer = null;
              }
              setIsPhysicalTargetTracked(true);
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
                  setIsPhysicalTargetTracked(false);
                  onTargetLost(lesson);
                }
              }, 800);
            };
          });

          // تشغيل محرك MindAR بالكاميرا
          try {
            await mindarThree.start();
          } catch (startErr: any) {
            console.warn('تعذر تشغيل الوضع الافتراضي، محاولة الكاميرا البديلة:', startErr);
            mindarThree.shouldFaceUser = true;
            await mindarThree.start();
          }

          if (containerRef.current) {
            const vid = containerRef.current.querySelector('video') as HTMLVideoElement;
            if (vid) {
              vid.style.zIndex = '0';
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

          // حلقة الرسوم المتحركة المتكاملة والتحديث المستمر
          const clock = new THREE_NS.Clock();
          renderer.setAnimationLoop(() => {
            const delta = clock.getDelta();

            // تحديث مجسمات الـ Anchors المثبتة على صور الكتاب
            modelEntriesRef.current.forEach((entry) => {
              if (entry.mixer) {
                entry.mixer.update(delta);
              }
              if (entry.autoRotate && entry.modelWrapper) {
                entry.modelWrapper.rotation.y += delta * 0.7;
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
      anchorContentGroupsRef.current.clear();
      modelEntriesRef.current.clear();
    };
  }, [facingMode, lessons.length, updateAnchorModel]);

  const handleSimulateFirstLesson = () => {
    if (lessons.length > 0) {
      playMatchChime();
      const firstLesson = lessons[0];
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
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="truncate">
                {isPhysicalTargetTracked ? '🎯 مثبت على صفحة الكتاب' : `✓ ${activeLesson.title} (مجسم AR نشط)`}
              </span>
            </>
          ) : (
            <>
              <span className={`w-2.5 h-2.5 rounded-full ${isMindArActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="truncate">
                {isMindArActive ? '🟢 وجّه الكاميرا إلى صورة الدرس في الكتاب...' : '📖 جارٍ تشغيل الماسح البصري...'}
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

      {/* 5. ⭐ مؤشر مسح بصري نقي وشفاف تماماً بدون أي تظليل أو خلفية عند توجيه الكاميرا للكتاب ⭐ */}
      {!isPhysicalTargetTracked && !cameraLoading && !cameraError && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center p-4">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 border-2 border-dashed border-cyan-400/40 rounded-3xl animate-scan-glow flex flex-col items-center justify-between p-4 shadow-2xl">
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-2xl" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-2xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-2xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-2xl" />

            <div className="mt-1 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-cyan-200 border border-cyan-400/30">
              وجّه الكاميرا إلى صورة الدرس في الكتاب
            </div>

            <div className="text-center">
              <span className="text-[10px] text-white/90 bg-black/60 px-2.5 py-1 rounded-md border border-white/10 block">
                تتبع الواقع المعزز (AR Tracking) نشط ومجهز
              </span>
            </div>
          </div>

          <div className="mt-4 pointer-events-none">
            <span className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] text-cyan-200 border border-cyan-400/30 shadow-lg text-center block">
              📖 قرّب الكاميرا ببطء من صفحة الدرس حتى يظهر المجسم مباشرة فوق الورقة
            </span>
          </div>

          {lessons.length > 0 && (
            <div className="mt-3 flex flex-col items-center gap-1.5 pointer-events-auto">
              <button
                onClick={handleSimulateFirstLesson}
                className="py-1.5 px-4 rounded-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="تجربة تفاعلية مباشرة بدون كاميرا ورقية"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ تجربة التعرف الفوري ومجسم AR بنقرة واحدة</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. شاشة تحميل الكاميرا ومحرك AR */}
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

      {/* 8. شاشة الخطأ وتنبيهات الكاميرا */}
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
