import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Mic,
  RotateCcw,
  ListMusic,
  ExternalLink,
  AlertCircle,
  HelpCircle,
  Repeat,
  Gauge
} from 'lucide-react';
import { LessonAudio, getLessonAudios, normalizeAudioData } from '../types/ar';
import { analytics } from '../services/analytics';

interface AudioPlayerModalProps {
  audio?: LessonAudio;
  audios?: LessonAudio[];
  lessonTitle: string;
  targetId: string;
  lessonSummary?: string;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  audio,
  audios = [],
  lessonTitle,
  targetId,
  lessonSummary,
  onClose
}) => {
  // تجميع كافة التسجيلات الصوتية المتوفرة للدرس
  const rawList = audios.length > 0 ? audios : (audio ? [audio] : []);
  const trackList: LessonAudio[] = rawList.map((item, idx) => {
    const norm = normalizeAudioData(item.url, item.title || `تسجيل صوتي ${idx + 1}`);
    return {
      ...item,
      url: norm.url,
      embedUrl: norm.embedUrl || item.embedUrl,
      type: norm.type,
      title: item.title || `تسجيل ${idx + 1}`
    };
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const activeTrack = trackList[currentTrackIndex] || (audio ? normalizeAudioData(audio.url, audio.title) : null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isBlockedByBrowser, setIsBlockedByBrowser] = useState(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [showTtsInfo, setShowTtsInfo] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // إيقاف أي قراءة آلية أو صوت عند الإغلاق
  useEffect(() => {
    analytics.trackEvent({
      targetId,
      lessonTitle,
      action: 'audio_play'
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      analytics.trackEvent({
        targetId,
        lessonTitle,
        action: 'content_close'
      });
    };
  }, [targetId, lessonTitle]);

  // محاولة تشغيل المقطع تلقائياً عند فتح النافذة أو تغيير التراك
  useEffect(() => {
    setAudioError(null);
    setIsBlockedByBrowser(false);
    setCurrentTime(0);

    if (activeTrack?.type === 'audio' || activeTrack?.type === 'gdrive') {
      const el = audioRef.current;
      if (el) {
        el.load();
        el.playbackRate = playbackRate;
        const playPromise = el.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              setIsBlockedByBrowser(false);
            })
            .catch((err) => {
              console.warn('Autoplay blocked by browser policy:', err);
              setIsPlaying(false);
              // إشعار المستخدم بنقرة واحدة لتشغيل الصوت إذا حظره المتصفح
              setIsBlockedByBrowser(true);
            });
        }
      }
    }
  }, [currentTrackIndex, activeTrack?.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isSpeakingTts && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioError(null);
      setIsBlockedByBrowser(false);
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.warn('Audio playback error:', err);
          setIsPlaying(false);
          setAudioError('تعذر تشغيل الصوت تلقائياً بسبب قيود المتصفح أو تنسيق الملف.');
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleRate = () => {
    const rates = [1, 1.25, 1.5];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  // ميزة القراءة الآلية (TTS - Text to Speech)
  const handleReadSummaryAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('متصفحك لا يدعم القراءة الآلية للنصوص.');
      return;
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    if (isSpeakingTts) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      return;
    }

    const textToSpeak = `${lessonTitle}. ${lessonSummary || 'أهلاً بك في هذا الدرس التعليمي.'}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;

    utterance.onend = () => setIsSpeakingTts(false);
    utterance.onerror = () => setIsSpeakingTts(false);

    setIsSpeakingTts(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatSeconds = (sec: number) => {
    if (isNaN(sec) || !isFinite(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden HTML5 Audio for direct streams */}
        {activeTrack && (activeTrack.type === 'audio' || activeTrack.type === 'gdrive' || !activeTrack.type) && (
          <audio
            ref={audioRef}
            src={activeTrack.url}
            loop={isLooping}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onLoadedMetadata={handleTimeUpdate}
            onError={(e) => {
              console.warn('Audio tag load error:', e);
              setAudioError('تعذر تحميل الملف الصوتي من الرابط المحدد. يرجى التحقق من الرابط أو التنسيق.');
              setIsPlaying(false);
            }}
            preload="auto"
          />
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/90 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Volume2 className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                {activeTrack?.title || 'المقطع الصوتي للدرس'}
              </h3>
              <p className="text-xs text-slate-400 truncate">{lessonTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
            aria-label="إغلاق المشغل الصوتي"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist Bar (إذا وُجد أكثر من تسجيل صوتي للدرس) */}
        {trackList.length > 1 && (
          <div className="bg-slate-950/70 border-b border-slate-800 px-3 py-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold mb-1.5">
              <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
              <span>قائمة التسجيلات الصوتية للدرس ({trackList.length}):</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {trackList.map((trk, idx) => {
                const isSelected = idx === currentTrackIndex;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.pause();
                      }
                      setCurrentTrackIndex(idx);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400/50 shadow-md shadow-emerald-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border-slate-700'
                    }`}
                  >
                    <span>{isSelected ? '▶️' : '🎵'}</span>
                    <span>{trk.title || `تسجيل ${idx + 1}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 sm:p-6 bg-slate-900 flex flex-col items-center justify-center gap-4 overflow-y-auto">
          {/* YouTube Audio/Video Player Fallback if URL is YouTube */}
          {activeTrack?.type === 'youtube' && activeTrack.embedUrl ? (
            <div className="w-full space-y-3">
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-slate-700 shadow-lg bg-black">
                <iframe
                  src={activeTrack.embedUrl}
                  title={activeTrack.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <p className="text-center text-xs text-slate-400">
                يتم تشغيل هذا التسجيل عبر مشغل يوتيوب المدمج.
              </p>
            </div>
          ) : activeTrack?.type === 'soundcloud' && activeTrack.embedUrl ? (
            <div className="w-full space-y-3">
              <div className="w-full h-40 rounded-xl overflow-hidden border border-slate-700">
                <iframe
                  width="100%"
                  height="166"
                  scrolling="no"
                  frameBorder="no"
                  allow="autoplay"
                  src={activeTrack.embedUrl}
                  title="SoundCloud Player"
                />
              </div>
            </div>
          ) : (
            /* Direct HTML5 Audio Player UI */
            <>
              {/* Wave Animation Circle */}
              <div
                onClick={togglePlay}
                className="relative w-24 h-24 rounded-full bg-slate-800/90 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl shadow-emerald-500/10 cursor-pointer hover:scale-105 transition-transform"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying || isSpeakingTts ? (
                  <div className="flex items-center justify-center gap-1.5 h-10">
                    <span className="w-1.5 bg-emerald-400 rounded-full animate-pulse h-8"></span>
                    <span className="w-1.5 bg-emerald-300 rounded-full animate-bounce h-10"></span>
                    <span className="w-1.5 bg-emerald-500 rounded-full animate-pulse h-6"></span>
                    <span className="w-1.5 bg-emerald-300 rounded-full animate-bounce h-9"></span>
                    <span className="w-1.5 bg-emerald-400 rounded-full animate-pulse h-7"></span>
                  </div>
                ) : (
                  <Play className="w-10 h-10 text-emerald-400 fill-emerald-400 mr-1 drop-shadow" />
                )}
              </div>

              {/* Notice when browser restricts autoplay */}
              {isBlockedByBrowser && !isPlaying && (
                <button
                  onClick={togglePlay}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg animate-pulse flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>انقر هنا لبدء الاستماع إلى تسجيل الدرس</span>
                </button>
              )}

              {/* Error Notice */}
              {audioError && (
                <div className="w-full p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span>{audioError}</span>
                  </div>
                  {activeTrack?.url && (
                    <a
                      href={activeTrack.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>فتح الرابط المباشر في علامة تبويب جديدة</span>
                    </a>
                  )}
                </div>
              )}

              {/* Progress and Scrub Bar */}
              <div className="w-full space-y-1.5 pt-1">
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>{formatSeconds(currentTime)}</span>
                  <span>{duration > 0 ? formatSeconds(duration) : (activeTrack?.duration || '01:30')}</span>
                </div>
              </div>

              {/* Controls Bar */}
              <div className="flex items-center justify-center gap-3 sm:gap-4 w-full">
                {/* Restart */}
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.currentTime = 0;
                      setCurrentTime(0);
                    }
                  }}
                  className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="إعادة من البداية"
                >
                  <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Big Primary Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform cursor-pointer"
                  aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
                >
                  {isPlaying ? (
                    <Pause className="w-7 h-7 fill-slate-950" />
                  ) : (
                    <Play className="w-7 h-7 fill-slate-950 mr-0.5" />
                  )}
                </button>

                {/* Loop Toggle */}
                <button
                  onClick={() => setIsLooping((prev) => !prev)}
                  className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                    isLooping
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isLooping ? 'تكرار مستمر (مفعّل)' : 'تشغيل بدون تكرار'}
                >
                  <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Speed Toggle */}
                <button
                  onClick={toggleRate}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-mono font-bold border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  title="تغيير سرعة الصوت"
                >
                  <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{playbackRate}x</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-2.5 w-full max-w-xs pt-1">
                <button
                  onClick={toggleMute}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title={isMuted ? 'إلغاء الكتم' : 'كتم'}
                >
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : volume < 0.4 ? (
                    <Volume1 className="w-4 h-4 text-slate-300" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-[11px] text-slate-400 font-mono w-8 text-left">
                  {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </>
          )}

          {/* Section: Text-To-Speech (القراءة الآلية لملخص الدرس) */}
          {lessonSummary && (
            <div className="w-full mt-2 pt-3 border-t border-slate-800/80 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>أو يمكنك الاستماع للشرح المكتوب صوتياً:</span>
                <button
                  type="button"
                  onClick={() => setShowTtsInfo((prev) => !prev)}
                  className="text-slate-400 hover:text-amber-300 transition-colors"
                  title="ما هي القراءة الآلية؟"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>

              {showTtsInfo && (
                <div className="w-full p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 text-center leading-relaxed animate-fadeIn">
                  💡 <strong>القراءة الآلية (TTS):</strong> خاصية ذكية تقوم بتحويل النص المكتوب لملخص وشرح الدرس إلى صوت ناطق باللغة العربية لمساعدة الطلاب في الاستيعاب والاستماع.
                </div>
              )}

              <button
                onClick={handleReadSummaryAloud}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
                  isSpeakingTts
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/60 ring-2 ring-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700'
                }`}
              >
                <Mic className="w-4 h-4 text-amber-400" />
                <span>
                  {isSpeakingTts
                    ? 'جارٍ قراءة الملخص بصوت المتصفح (انقر للإيقاف)'
                    : '🎙️ الاستماع إلى ملخص الدرس بالقراءة الآلية'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-800/90 border-t border-slate-700/60 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {trackList.length > 1
              ? `المقطع ${currentTrackIndex + 1} من ${trackList.length}`
              : 'تسجيل صوتي تعليمي'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
