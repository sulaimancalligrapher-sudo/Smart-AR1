import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RefreshCw, RotateCcw, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ThreeJSModelViewerProps {
  src: string;
  title?: string;
  className?: string;
  height?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  transparent?: boolean;
}

export const ThreeJSModelViewer: React.FC<ThreeJSModelViewerProps> = ({
  src,
  title = 'مجسم ثلاثي الأبعاد',
  className = '',
  height = '360px',
  autoRotate = false,
  interactive = true,
  transparent = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(autoRotate);

  // References to three.js objects
  const controlsRef = useRef<OrbitControls | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const reqIdRef = useRef<number | null>(null);

  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const toggleAutoRotate = () => {
    setIsRotating((prev) => !prev);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setIsLoading(true);
    setErrorMsg(null);

    const width = container.clientWidth || 300;
    const heightPx = container.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 3);

    // 3. Renderer with transparent alpha and antialias
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.touchAction = 'none';

    // 4. OrbitControls with strict mobile touch clamping
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false; // Disable panning to avoid drift on mobile/tablet touches!
    controls.enableZoom = interactive;
    controls.enableRotate = interactive;
    controls.autoRotate = isRotating;
    controls.autoRotateSpeed = 2.0;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.2);
    fillLight.position.set(-3, -2, -3);
    scene.add(fillLight);

    // 6. Load GLTF / GLB model
    let isCancelled = false;
    const loader = new GLTFLoader();

    loader.load(
      src,
      (gltf) => {
        if (isCancelled) return;
        const model = gltf.scene;
        modelRef.current = model;

        // Auto-center and normalize size
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the geometry precisely at (0,0,0)
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Create an anchor group to isolate rotation
        const rootGroup = new THREE.Group();
        rootGroup.add(model);
        scene.add(rootGroup);

        // Adjust camera distance nicely according to bounding sphere
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;
        camera.position.set(0, 0, Math.max(cameraZ, 2));
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.saveState(); // Saved for reset button

        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (isCancelled) return;
        console.warn('Three.js GLTF load error:', err);
        setIsLoading(false);
        setErrorMsg('تعذر تحميل ملف المجسم 3D. تأكد من أن الرابط بصيغة .glb صالحة.');
      }
    );

    // 7. Animation loop
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.autoRotate = isRotating;
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [src, isRotating, interactive]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden flex items-center justify-center select-none ${
        transparent
          ? 'bg-transparent border-0'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800'
      } ${className}`}
      style={{ height }}
    >
      {/* Three.js Canvas Container */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-slate-200 gap-2 z-10 pointer-events-none">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
          <span className="text-xs font-semibold">جارٍ معالجة وتثبيت المجسم 3D...</span>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 p-4 text-center z-20 space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-rose-200 max-w-xs">{errorMsg}</p>
          <span className="text-[10px] text-slate-400 font-mono break-all max-w-xs">{src}</span>
        </div>
      )}

      {/* Controls: Reset Center & Rotation Toggle */}
      {!isLoading && !errorMsg && interactive && (
        <div className="absolute bottom-2 inset-x-2 z-10 pointer-events-none flex items-center justify-between gap-1.5 px-2">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/10 text-[10px] text-sky-300 shadow-md">
            <RotateCcw className="w-3 h-3 text-sky-400" />
            <span>اسحب للتدوير 360° بثبات</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleAutoRotate}
              className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white border border-white/20 text-[10px] font-bold shadow-md active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
              title={isRotating ? 'إيقاف الدوران التلقائي' : 'تشغيل الدوران التلقائي'}
            >
              <span>{isRotating ? '⏸️ تثبيت' : '▶️ تدوير'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetCamera}
              className="px-2.5 py-1 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white border border-white/20 text-[10px] font-bold shadow-md active:scale-95 transition-transform flex items-center gap-1 cursor-pointer"
              title="إعادة ضبط المجسم للمركز"
            >
              <span>🎯 ضبط المركز</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
