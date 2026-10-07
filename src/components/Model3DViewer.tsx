import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RefreshCw, RotateCcw, AlertCircle, Play, Pause, Compass } from 'lucide-react';

interface Model3DViewerProps {
  src: string;
  title?: string;
  className?: string;
  height?: string;
  autoRotate?: boolean;
  interactive?: boolean;
  transparent?: boolean;
}

/**
 * Solid Turntable 3D Viewer built with pure Three.js:
 * 1. ZERO Orbit Drift: Camera is fixed on Z-axis, rotation is applied directly to the model's central Y-axis.
 * 2. Guaranteed Centering: Geometry bounding box is computed and centered at (0,0,0) with normalized scale.
 * 3. Mobile & Tablet Hardened: Pointer events provide butter-smooth touch spinning without moving the model away.
 * 4. Default Still State: Auto-rotate is OFF by default so the model stands rock-solid.
 */
export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  src,
  title = 'مجسم ثلاثي الأبعاد',
  className = '',
  height = '320px',
  autoRotate = false,
  interactive = true,
  transparent = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(autoRotate);

  // References to keep animation loop & controls independent of React render cycles
  const isRotatingRef = useRef(autoRotate);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const reqIdRef = useRef<number | null>(null);

  // Touch & pointer tracking
  const isDraggingRef = useRef(false);
  const prevPointerRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistRef = useRef<number | null>(null);
  const defaultCameraZRef = useRef<number>(3.5);

  // Toggle auto rotation without reloading the 3D scene or re-fetching GLTF
  const toggleAutoRotate = useCallback(() => {
    setIsRotating((prev) => {
      const next = !prev;
      isRotatingRef.current = next;
      return next;
    });
  }, []);

  // Reset rotation and zoom to perfect default center
  const handleResetCenter = useCallback(() => {
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, defaultCameraZRef.current);
      cameraRef.current.lookAt(0, 0, 0);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !src) return;

    setIsLoading(true);
    setLoadError(null);
    isRotatingRef.current = autoRotate;
    setIsRotating(autoRotate);

    let isCancelled = false;

    // Dimensions
    const width = container.clientWidth || 320;
    const heightPx = container.clientHeight || 320;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera (Fixed orientation looking straight at origin 0,0,0)
    const camera = new THREE.PerspectiveCamera(45, width / heightPx, 0.1, 100);
    camera.position.set(0, 0, 3.5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 3. WebGL Renderer with full alpha transparency
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.touchAction = 'none';

    // 4. Lighting: Ambient + Key Directionals for vibrant illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.4);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight1.position.set(5, 7, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight2.position.set(-5, -3, -3);
    scene.add(dirLight2);

    // 5. Centered Pivot Group
    const rootGroup = new THREE.Group();
    rootGroup.position.set(0, 0, 0);
    rootGroup.rotation.set(0, 0, 0);
    scene.add(rootGroup);
    modelGroupRef.current = rootGroup;

    // 6. GLTF Loader with strict bounding box normalization
    const loader = new GLTFLoader();
    loader.load(
      src,
      (gltf) => {
        if (isCancelled) return;
        const model = gltf.scene;

        // Force world matrices update to compute exact bounding dimensions
        model.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Offset model geometry so its true volumetric center is exactly (0, 0, 0)
        model.position.x = -center.x;
        model.position.y = -center.y;
        model.position.z = -center.z;

        // Normalize scale to fit nicely in the viewport on any mobile/tablet/desktop screen
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const normalizedScale = 2.0 / maxDim;
        rootGroup.scale.setScalar(normalizedScale);

        rootGroup.add(model);

        // Adjust camera distance to ensure comfortable fit
        const fovRad = (camera.fov * Math.PI) / 180;
        const aspect = camera.aspect;
        // In portrait mode, aspect < 1, so fit horizontally
        const effectiveFOV = aspect < 1 ? 2 * Math.atan(Math.tan(fovRad / 2) / aspect) : fovRad;
        const idealDistance = Math.max((2.0 / 2) / Math.tan(effectiveFOV / 2) * 1.35, 2.8);

        camera.position.set(0, 0, idealDistance);
        camera.lookAt(0, 0, 0);
        defaultCameraZRef.current = idealDistance;

        setIsLoading(false);
      },
      undefined,
      (err) => {
        if (isCancelled) return;
        console.warn('Three.js GLTF load error:', err);
        setIsLoading(false);
        setLoadError('تعذر تحميل ملف المجسم. يرجى التأكد من صلاحية الرابط (.glb).');
      }
    );

    // 7. Render Loop (Fixed camera, in-place Y-axis turntable rotation)
    const animate = () => {
      reqIdRef.current = requestAnimationFrame(animate);

      if (isRotatingRef.current && modelGroupRef.current && !isDraggingRef.current) {
        // Spin in place around vertical center axis (never drifts)
        modelGroupRef.current.rotation.y += 0.012;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 8. Responsive Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        cameraRef.current.aspect = newWidth / newHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newWidth, newHeight);
      }
    });
    resizeObserver.observe(container);

    // 9. Cleanup
    return () => {
      isCancelled = true;
      resizeObserver.disconnect();
      if (reqIdRef.current) {
        cancelAnimationFrame(reqIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [src, autoRotate]);

  // Pointer event handlers for touch & mouse
  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactive || !isDraggingRef.current || !prevPointerRef.current) return;
    const deltaX = e.clientX - prevPointerRef.current.x;
    const deltaY = e.clientY - prevPointerRef.current.y;
    prevPointerRef.current = { x: e.clientX, y: e.clientY };

    if (modelGroupRef.current) {
      // Rotate around Y axis (360 horizontal turntable)
      modelGroupRef.current.rotation.y += deltaX * 0.009;

      // Tilt around X axis (clamped to prevent flipping upside down)
      const currentX = modelGroupRef.current.rotation.x;
      const nextX = currentX + deltaY * 0.007;
      modelGroupRef.current.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, nextX));
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!interactive) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}
    isDraggingRef.current = false;
    prevPointerRef.current = null;
  };

  // Touch pinch to zoom support
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!interactive || e.touches.length !== 2 || !cameraRef.current) return;
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

    if (initialPinchDistRef.current !== null) {
      const scale = initialPinchDistRef.current / dist;
      const newZ = cameraRef.current.position.z * scale;
      cameraRef.current.position.z = Math.max(1.8, Math.min(7.0, newZ));
    }
    initialPinchDistRef.current = dist;
  };

  const handleTouchEnd = () => {
    initialPinchDistRef.current = null;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!interactive || !cameraRef.current) return;
    e.preventDefault();
    const zoomDelta = e.deltaY * 0.003;
    const newZ = cameraRef.current.position.z + zoomDelta;
    cameraRef.current.position.z = Math.max(1.8, Math.min(7.0, newZ));
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden flex items-center justify-center select-none ${
        transparent
          ? 'bg-transparent border-0'
          : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800'
      } ${className}`}
      style={{ height }}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 3D Canvas Mount Point */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm text-slate-300 gap-2 z-10 pointer-events-none">
          <RefreshCw className="w-6 h-6 text-sky-400 animate-spin" />
          <span className="text-xs font-semibold">جارٍ تثبيت ومعالجة المجسم 3D...</span>
        </div>
      )}

      {/* Error state */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 p-4 text-center z-20 space-y-2">
          <AlertCircle className="w-8 h-8 text-rose-400" />
          <p className="text-xs text-rose-200 max-w-xs">{loadError}</p>
          <span className="text-[10px] text-slate-400 font-mono break-all max-w-xs">{src}</span>
        </div>
      )}

      {/* Interactive Controls Pill Bar */}
      {!isLoading && !loadError && interactive && (
        <div className="absolute bottom-2.5 inset-x-2 z-10 pointer-events-none flex items-center justify-between gap-1.5 px-2">
          {/* Help badge */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/15 text-[10px] font-bold text-sky-300 shadow-xl">
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span>اسحب للتدوير 360°</span>
          </div>

          {/* Action buttons */}
          <div className="pointer-events-auto flex items-center gap-1.5">
            {/* Toggle Rotation Button */}
            <button
              type="button"
              onClick={toggleAutoRotate}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl active:scale-95 transition-all flex items-center gap-1 cursor-pointer border ${
                isRotating
                  ? 'bg-cyan-500/90 text-slate-950 border-cyan-300 font-black'
                  : 'bg-slate-900/85 hover:bg-slate-800 text-white border-white/20'
              }`}
              title={isRotating ? 'إيقاف الدوران' : 'تشغيل الدوران'}
            >
              {isRotating ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-950" />
                  <span>تثبيت</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تدوير</span>
                </>
              )}
            </button>

            {/* Reset Center Button */}
            <button
              type="button"
              onClick={handleResetCenter}
              className="px-3 py-1.5 rounded-full bg-slate-900/85 hover:bg-slate-800 text-white border border-white/20 text-[11px] font-bold shadow-xl active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="إعادة ضبط المجسم للمركز الأصلي"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>المركز</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
