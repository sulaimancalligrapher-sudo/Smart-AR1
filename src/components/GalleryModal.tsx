import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Image as ImageIcon } from 'lucide-react';
import { LessonImage } from '../types/ar';
import { analytics } from '../services/analytics';

interface GalleryModalProps {
  images: LessonImage[];
  lessonTitle: string;
  targetId: string;
  onClose: () => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  images,
  lessonTitle,
  targetId,
  onClose
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <ImageIcon className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">معرض الصور التعليمية</h3>
              <p className="text-xs text-slate-400 truncate">{lessonTitle} ({currentIndex + 1} من {images.length})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label="إغلاق المعرض"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Image Display */}
        <div className="relative w-full bg-slate-950 min-h-[260px] sm:min-h-[340px] flex items-center justify-center overflow-hidden p-2">
          <img
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.title}
            referrerPolicy="no-referrer"
            className="max-h-[50vh] w-auto max-w-full object-contain rounded-lg shadow-md select-none transition-all duration-300"
          />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition-transform active:scale-90 cursor-pointer"
                aria-label="الصورة السابقة"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-white/20 shadow-lg transition-transform active:scale-90 cursor-pointer"
                aria-label="الصورة التالية"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {/* Caption & Metadata */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex-1 overflow-y-auto">
          <h4 className="font-bold text-sm sm:text-base text-white mb-1.5">{currentImage.title}</h4>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{currentImage.caption}</p>

          {/* Thumbnails Row */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/80 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    currentIndex === idx
                      ? 'border-emerald-400 scale-105 shadow-md shadow-emerald-500/20'
                      : 'border-slate-700 opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={images.length <= 1}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              السابق ←
            </button>
            <button
              onClick={handleNext}
              disabled={images.length <= 1}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              → التالي
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
