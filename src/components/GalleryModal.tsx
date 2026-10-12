import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { LessonImage } from '../types/ar';
import { analytics } from '../services/analytics';
import { normalizeImageUrl, getAlternativeImageUrls } from '../services/urlHelpers';

interface GalleryModalProps {
  images?: LessonImage[];
  targetImage?: string;
  lessonTitle: string;
  targetId: string;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  images = [],
  targetImage,
  lessonTitle,
  targetId,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [loadError, setLoadError] = useState(false);

  // Collect all available images for this lesson with URL normalization (Google Drive auto-conversion)
  const hasValidCustomImages = Boolean(
    images && 
    images.length > 0 && 
    images.some((img) => img && typeof img.url === 'string' && img.url.trim() !== '')
  );

  const rawImages: LessonImage[] = hasValidCustomImages
    ? images.filter((img) => img && typeof img.url === 'string' && img.url.trim() !== '')
    : targetImage && targetImage.trim() !== ''
      ? [
          {
            url: targetImage,
            title: lessonTitle,
            caption: 'لوحة الشرح التوضيحية.'
          }
        ]
      : [];

  const effectiveImages: LessonImage[] = rawImages.map((img) => ({
    ...img,
    url: normalizeImageUrl(img.url)
  }));

  const currentImage = effectiveImages[currentIndex] || null;
  const candidateUrls = currentImage ? getAlternativeImageUrls(currentImage.url) : [];
  const activeUrl = candidateUrls[fallbackIndex] || currentImage?.url || '';

  // Reset fallback and error states when changing slides
  useEffect(() => {
    setFallbackIndex(0);
    setLoadError(false);
  }, [currentIndex]);

  useEffect(() => {
    analytics.trackEvent({
      targetId,
      lessonTitle,
      action: 'images_open'
    });

    return () => {
      analytics.trackEvent({
        targetId,
        lessonTitle,
        action: 'content_close'
      });
    };
  }, [targetId, lessonTitle]);

  const handleNext = () => {
    if (effectiveImages.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % effectiveImages.length);
    }
  };

  const handlePrev = () => {
    if (effectiveImages.length > 0) {
      setCurrentIndex((prev) => (prev - 1 + effectiveImages.length) % effectiveImages.length);
    }
  };

  const handleImageError = () => {
    // Attempt next candidate URL (e.g. alternate Google Drive CDN endpoints)
    if (fallbackIndex + 1 < candidateUrls.length) {
      setFallbackIndex((prev) => prev + 1);
    } else {
      setLoadError(true);
    }
  };

  const isGoogleDrive = currentImage?.url.includes('google.com') || currentImage?.url.includes('googleusercontent.com');

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none animate-fadeIn">
      {/* 1. Top Minimal Title Pill (If multiple images, shows indicator) */}
      <div className="pointer-events-auto flex items-center justify-center max-w-md mx-auto w-full pt-2">
        {effectiveImages.length > 1 && (
          <div className="px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white text-xs font-semibold shadow-lg">
            <span>لوحة {currentIndex + 1} من {effectiveImages.length}</span>
          </div>
        )}
      </div>

      {/* 2. Center: 100% Borderless, Frame-Free Floating Image / PNG / GIF directly over live camera */}
      <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col items-center justify-center">
        {currentImage ? (
          <div className="relative w-full flex flex-col items-center justify-center">
            {/* The Floating Image without ANY border, background, shadow or outline (Pure transparent PNG/GIF/WebP) */}
            <div className="relative flex items-center justify-center w-full max-h-[60vh] min-h-[160px]">
              {!loadError ? (
                <img
                  key={`${activeUrl}_${fallbackIndex}`}
                  src={activeUrl}
                  alt={currentImage.title}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={handleImageError}
                  className="max-h-[58vh] w-auto max-w-full object-contain select-none transition-transform duration-300 pointer-events-auto"
                  style={{ filter: 'none', background: 'transparent' }}
                />
              ) : (
                /* Clear diagnostic fallback if image fails to load */
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/50 backdrop-blur-md text-center max-w-sm space-y-2 text-white shadow-2xl">
                  <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>تعذر تحميل الصورة</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {isGoogleDrive ? (
                      <>
                        إذا كان الرابط من <strong>Google Drive</strong>، يرجى التأكد من تغيير إعداد المشاركة إلى{' '}
                        <span className="text-amber-300 font-bold">"أي شخص لديه الرابط" (عارض)</span> وليس "حصري/مقيد".
                      </>
                    ) : (
                      'تأكد من صحة رابط الصورة المباشر أو أن الموقع المصدر يسمح بعرضها.'
                    )}
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setFallbackIndex(0);
                        setLoadError(false);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>إعادة المحاولة</span>
                    </button>
                    {activeUrl && (
                      <a
                        href={currentImage.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>فتح الرابط</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Prev / Next Floating Arrows for Multi-image navigation */}
              {effectiveImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                    aria-label="الصورة السابقة"
                  >
                    <ChevronRight className="w-7 h-7" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/20 flex items-center justify-center shadow-xl active:scale-90 transition-transform cursor-pointer"
                    aria-label="الصورة التالية"
                  >
                    <ChevronLeft className="w-7 h-7" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Floating Dots Indicator for Group of Images */}
            {effectiveImages.length > 1 && (
              <div className="flex items-center gap-1.5 mt-2.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-md">
                {effectiveImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentIndex ? 'w-5 bg-emerald-400' : 'w-2 bg-white/40'
                    }`}
                    aria-label={`الانتقال إلى صورة ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Floating Image Title / Caption */}
            {currentImage.title && (
              <div className="mt-2.5 px-4 py-1.5 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-center max-w-xs shadow-lg">
                <span className="text-xs font-bold text-white block truncate">
                  {currentImage.title}
                </span>
                {currentImage.caption && (
                  <span className="text-[10px] text-slate-300 block truncate">
                    {currentImage.caption}
                  </span>
                )}
              </div>
            )}

            {/* Prominent High-Visibility Close Button directly UNDER the text for clear exiting */}
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2.5 rounded-full bg-slate-900/90 hover:bg-rose-950 text-white hover:text-rose-200 border-2 border-white/30 shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-md"
              title="إغلاق الصورة والعودة للكاميرا"
              aria-label="إغلاق الصورة"
            >
              <X className="w-4 h-4 text-rose-400" />
              <span>إغلاق الصورة والعودة للكاميرا</span>
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-black/55 backdrop-blur-md border border-white/20 text-center text-xs text-slate-200">
            <p>لا توجد صور مضافة لهذا الدرس بعد.</p>
            <button
              onClick={onClose}
              className="mt-3 px-4 py-1.5 rounded-full bg-slate-800 text-white text-xs font-bold"
            >
              رجوع
            </button>
          </div>
        )}
      </div>

      {/* Bottom spacer */}
      <div className="h-4" />
    </div>
  );
};
