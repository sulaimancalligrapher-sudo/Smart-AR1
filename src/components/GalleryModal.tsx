import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { LessonImage } from '../types/ar';
import { analytics } from '../services/analytics';

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

  // Collect all available images for this lesson
  const hasValidCustomImages = Boolean(
    images && 
    images.length > 0 && 
    images.some((img) => img && typeof img.url === 'string' && img.url.trim() !== '')
  );

  const effectiveImages: LessonImage[] = hasValidCustomImages
    ? images.filter((img) => img && typeof img.url === 'string' && img.url.trim() !== '')
    : targetImage && targetImage.trim() !== ''
      ? [
          {
            url: targetImage,
            title: `صورة المرجع: ${lessonTitle}`,
            caption: 'صفحة الدرس في الكتاب المدرسي.'
          }
        ]
      : [];

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

  const currentImage = effectiveImages[currentIndex] || null;

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

  return (
    <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-4 sm:p-6 select-none animate-fadeIn">
      {/* 1. Top Floating Transparent Pill (Header + Close Button) */}
      <div className="pointer-events-auto flex items-center justify-between gap-2 max-w-md mx-auto w-full pt-1">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md border border-emerald-400/30 text-white shadow-xl">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold truncate">
            معرض صور: {lessonTitle}
          </span>
          {effectiveImages.length > 1 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 font-mono">
              {currentIndex + 1} / {effectiveImages.length}
            </span>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/50 hover:bg-rose-950/80 text-white hover:text-rose-200 border border-white/20 flex items-center justify-center backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xl"
          title="إغلاق المعرض والعودة للكاميرا"
          aria-label="إغلاق المعرض"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Center: Pure Floating Photos directly over live camera (No Window Box, No Dark Backdrop!) */}
      <div className="pointer-events-auto w-full max-w-sm sm:max-w-md mx-auto my-auto flex flex-col items-center justify-center">
        {currentImage ? (
          <div className="relative w-full flex flex-col items-center justify-center">
            {/* The Floating Photo Card with subtle shadow */}
            <div className="relative rounded-3xl overflow-hidden border-2 border-white/25 shadow-2xl bg-black/20 backdrop-blur-xs max-h-[56vh] flex items-center justify-center">
              <img
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[54vh] w-auto max-w-full object-contain rounded-2xl select-none transition-all duration-300"
              />

              {/* Prev / Next Floating Arrows for Multi-image navigation */}
              {effectiveImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                    aria-label="الصورة السابقة"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer"
                    aria-label="الصورة التالية"
                  >
                    <ChevronLeft className="w-6 h-6" />
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

            {/* Floating Image Title/Caption */}
            {currentImage.title && (
              <div className="mt-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10 text-center max-w-xs shadow-md">
                <span className="text-[11px] font-bold text-white block truncate">
                  {currentImage.title}
                </span>
                {currentImage.caption && (
                  <span className="text-[10px] text-slate-300 block truncate">
                    {currentImage.caption}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 text-center text-xs text-slate-300">
            لا توجد صور مضافة لهذا الدرس بعد.
          </div>
        )}
      </div>

      {/* Spacer to keep bottom icons visible */}
      <div className="h-4" />
    </div>
  );
};
