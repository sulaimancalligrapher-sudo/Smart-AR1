import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Play, Film, Layers } from 'lucide-react';
import { LessonVideo, normalizeVideoData } from '../types/ar';
import { analytics } from '../services/analytics';

interface VideoModalProps {
  video?: LessonVideo;
  videos?: LessonVideo[];
  lessonTitle: string;
  targetId: string;
  onClose: () => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  video,
  videos = [],
  lessonTitle,
  targetId,
  onClose
}) => {
  // تجميع كافة الفيديوهات المتوفرة وتطبيعها
  const rawList = videos.length > 0 ? videos : (video ? [video] : []);
  const videoList: LessonVideo[] = rawList.map((item, idx) => {
    const norm = normalizeVideoData(item.url, item.title || `فيديو تعليمي ${idx + 1}`);
    return {
      ...item,
      url: norm.url,
      embedUrl: norm.embedUrl || item.embedUrl,
      type: norm.type || item.type,
      title: item.title || `فيديو ${idx + 1}`
    };
  });

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const activeVideo = videoList[currentVideoIndex] || (video ? normalizeVideoData(video.url, video.title) : null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Film className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeVideo?.title || 'فيديو الدرس التعليمي'}
              </h3>
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

        {/* Video Playlist Bar (إذا وُجد أكثر من فيديو للدرس الواحد) */}
        {videoList.length > 1 && (
          <div className="bg-slate-950/70 border-b border-slate-800 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>قائمة فيديوهات الدرس ({videoList.length}):</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {videoList.map((vid, idx) => {
                const isSelected = idx === currentVideoIndex;
                const platformBadge =
                  vid.type === 'youtube'
                    ? 'YouTube'
                    : vid.type === 'vimeo'
                    ? 'Vimeo'
                    : vid.type === 'gdrive'
                    ? 'Drive'
                    : vid.type === 'mp4'
                    ? 'MP4'
                    : 'رابط خارجي';

                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentVideoIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-600 text-white border-sky-400/50 shadow-md shadow-sky-950 ring-1 ring-sky-400/40'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700'
                    }`}
                  >
                    <span>{isSelected ? '▶️' : '🎬'}</span>
                    <span>{vid.title || `فيديو ${idx + 1}`}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/30 font-mono text-slate-300">
                      {platformBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Video Player Container */}
        <div className="relative w-full bg-black aspect-video flex items-center justify-center overflow-hidden">
          {activeVideo && (activeVideo.type === 'youtube' || activeVideo.type === 'vimeo' || activeVideo.type === 'gdrive') && activeVideo.embedUrl ? (
            <iframe
              key={activeVideo.embedUrl}
              src={activeVideo.embedUrl}
              title={activeVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : activeVideo?.type === 'mp4' || activeVideo?.url?.endsWith('.mp4') || activeVideo?.url?.endsWith('.webm') ? (
            <video
              key={activeVideo.url}
              src={activeVideo.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            >
              متصفحك لا يدعم تشغيل هذا الفيديو.
            </video>
          ) : activeVideo?.embedUrl && activeVideo.embedUrl.startsWith('http') ? (
            <iframe
              key={activeVideo.embedUrl}
              src={activeVideo.embedUrl}
              title={activeVideo.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="p-6 text-center text-slate-300 space-y-3">
              <p className="text-sm">إذا تعذر تشغيل هذا الرابط داخل الإطار، يمكنك فتحه مباشرة عبر المنصة المخصصة:</p>
              {activeVideo?.url && (
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-lg transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>مشاهدة الفيديو على الموقع الأصلي</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
          {activeVideo?.url ? (
            <a
              href={activeVideo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium py-1 px-2 rounded-lg hover:bg-sky-500/10 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>فتح الرابط الأصلي في نافذة جديدة</span>
            </a>
          ) : (
            <div></div>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
