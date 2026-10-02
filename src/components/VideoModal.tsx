import React, { useEffect } from 'react';
import { X, ExternalLink, Play, Film } from 'lucide-react';
import { LessonVideo } from '../types/ar';
import { analytics } from '../services/analytics';

interface VideoModalProps {
  video: LessonVideo;
  lessonTitle: string;
  targetId: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  lessonTitle,
  targetId,
  onClose
}) => {
  useEffect(() => {
    analytics.trackEvent({
      targetId,
      lessonTitle,
      action: 'video_open'
    });

    return () => {
      analytics.trackEvent({
        targetId,
        lessonTitle,
        action: 'video_close'
      });
    };
  }, [targetId, lessonTitle]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <Film className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{video.title || 'فيديو الدرس التعليمي'}</h3>
              <p className="text-xs text-slate-400 truncate">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label="إغلاق الفيديو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Container */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
          {video.type === 'youtube' && video.embedUrl ? (
            <iframe
              src={video.embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : video.type === 'mp4' ? (
            <video
              src={video.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              متصفحك لا يدعم تشغيل هذا الفيديو.
            </video>
          ) : (
            <div className="p-6 text-center text-slate-300">
              <p className="mb-4 text-sm">إذا تعذر تشغيل الفيديو داخل الإطار بسبب سياسات الموقع، يمكنك فتحه مباشرة:</p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-white font-medium hover:bg-sky-600 transition-colors"
              >
                <Play className="w-4 h-4" />
                مشاهدة الفيديو على المنصة الأصلية
              </a>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium py-1 px-2 rounded-lg hover:bg-sky-500/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح الرابط في صفحة خارجية
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
