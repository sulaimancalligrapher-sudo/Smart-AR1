import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Mic, RotateCcw } from 'lucide-react';
import { LessonAudio } from '../types/ar';
import { analytics } from '../services/analytics';

interface AudioPlayerModalProps {
  audio: LessonAudio;
  lessonTitle: string;
  targetId: string;
  lessonSummary?: string;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  audio,
  lessonTitle,
  targetId,
  lessonSummary,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    analytics.trackEvent({
      targetId,
      lessonTitle,
      action: 'audio_play'
    });

    return () => {
      // Cleanup audio and TTS on unmount
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
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play restricted by browser policy:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (!isNaN(audioRef.current.duration)) {
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
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Text-To-Speech Arabic Narration Fallback
  const handleReadSummaryAloud = () => {
    if (!('speechSynthesis' in window)) return;

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
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden HTML5 Audio Element */}
        <audio
          ref={audioRef}
          src={audio.url}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={handleTimeUpdate}
          preload="metadata"
        />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Volume2 className="w-5 h-5" />
            </span>
            <div className="truncate">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">{audio.title || 'المقطع الصوتي للدرس'}</h3>
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

        {/* Audio Visualizer & Player Body */}
        <div className="p-6 bg-slate-900 flex flex-col items-center justify-center gap-5">
          {/* Wave Animation Icon */}
          <div className="relative w-24 h-24 rounded-full bg-slate-800/90 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            {isPlaying || isSpeakingTts ? (
              <div className="flex items-center justify-center gap-1.5 h-10">
                <span className="w-1.5 bg-amber-400 rounded-full animate-pulse h-8"></span>
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-10"></span>
                <span className="w-1.5 bg-amber-500 rounded-full animate-pulse h-6"></span>
                <span className="w-1.5 bg-amber-300 rounded-full animate-bounce h-9"></span>
                <span className="w-1.5 bg-amber-400 rounded-full animate-pulse h-7"></span>
              </div>
            ) : (
              <Volume2 className="w-10 h-10 text-amber-400" />
            )}
          </div>

          {/* Time & Scrub Bar */}
          <div className="w-full space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-400 font-mono">
              <span>{formatSeconds(currentTime)}</span>
              <span>{duration > 0 ? formatSeconds(duration) : (audio.duration || '01:45')}</span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-center gap-4 w-full">
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
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Big Primary Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 active:scale-95 transition-transform cursor-pointer"
              aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-slate-950" /> : <Play className="w-7 h-7 fill-slate-950 mr-0.5" />}
            </button>

            {/* Mute/Unmute */}
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="كتم / إلغاء الكتم"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-2 w-full max-w-xs pt-1">
            <span className="text-xs text-slate-400">مستوى الصوت:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* TTS Assist Button */}
          {lessonSummary && (
            <button
              onClick={handleReadSummaryAloud}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSpeakingTts
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              {isSpeakingTts ? 'جارٍ القراءة الصوتية (اضغط للإيقاف)' : '🎙️ الاستماع إلى ملخص الدرس بالقراءة الآلية'}
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex justify-end">
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
