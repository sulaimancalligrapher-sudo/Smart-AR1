import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Database, Send, Trash2, CheckCircle2, AlertCircle, Copy, Check, 
  FileSpreadsheet, ExternalLink, BookOpen, Edit3, Image, Video, Music, 
  HelpCircle, Save, Download, Sparkles, Layers, Upload, Plus, AlertTriangle, Camera, Box,
  Volume2, VolumeX, Play, Pause, Disc, ChevronUp, ChevronDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { analytics } from '../services/analytics';
import {
  AnalyticsLogItem,
  LessonData,
  LessonModel3D,
  LessonImage,
  LessonVideo,
  LessonAudio,
  getActiveLessonModel,
  getLessonVideos,
  getLessonAudios,
  normalizeVideoData,
  normalizeAudioData,
  resolveAssetUrl
} from '../types/ar';
import { saveStoredLessons, fetchLessons, setHasLocalDrafts } from '../data/lessons';
import { Model3DViewer } from './Model3DViewer';
import { normalizeImageUrl, normalizeAudioUrl, getAlternativeImageUrls } from '../services/urlHelpers';
import { buildMultiTargetMap } from '../services/targetCompiler';
import { optimizeImageFile } from '../services/imageOptimizer';
import { ConfirmModal } from './ConfirmModal';

interface TeacherConsoleModalProps {
  lessons?: LessonData[];
  onUpdateLessons?: (lessons: LessonData[]) => void;
  onPurgeAllData?: () => void;
  onClose: () => void;
}

interface LessonImageCardProps {
  img: LessonImage;
  imgIdx: number;
  lessonId: string;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
}

const LessonImageCard: React.FC<LessonImageCardProps> = ({
  img,
  imgIdx,
  lessonId,
  onUpdateTitle,
  onDelete
}) => {
  const alts = React.useMemo(() => getAlternativeImageUrls(img.url), [img.url]);
  const [altIndex, setAltIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAltIndex(0);
    setHasError(false);
    setIsLoaded(false);
  }, [img.url, lessonId]);

  const currentSrc = alts[altIndex] || img.url;
  const isDrive = img.url.includes('drive.google.com') || img.url.includes('googleusercontent.com');
  const isData = img.url.startsWith('data:');

  const handleImageError = () => {
    if (altIndex + 1 < alts.length) {
      setAltIndex((prev) => prev + 1);
    } else {
      setHasError(true);
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="w-14 h-14 rounded-lg bg-black border border-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
        {!hasError ? (
          <img
            key={`${lessonId}_${imgIdx}_${altIndex}`}
            src={currentSrc}
            alt={img.title || `صورة ${imgIdx + 1}`}
            referrerPolicy="no-referrer"
            onLoad={() => setIsLoaded(true)}
            onError={handleImageError}
            className={`w-full h-full object-contain transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-30'
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-rose-950/80 p-1 text-center select-none">
            <span className="text-[10px] text-amber-300 font-bold leading-tight">⚠️ غير متاح</span>
            <span className="text-[8px] text-rose-200/80 mt-0.5">تحقق من الرابط</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <input
          type="text"
          value={img.title || ''}
          onChange={(e) => onUpdateTitle(e.target.value)}
          placeholder={`عنوان صورة ${imgIdx + 1}`}
          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-sky-500"
        />
        <div className="flex items-center justify-between gap-1">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 truncate max-w-[100px]">
            {isDrive ? '☁️ قوقل درايف' : isData ? '💾 ملف جهاز' : '🔗 رابط ويب'}
          </span>
          <div className="flex items-center gap-1">
            {isDrive && (
              <a
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-slate-400 hover:text-sky-300 transition-colors"
                title="فتح الرابط في Google Drive للتحقق من صلاحية المشاركة"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={onDelete}
              className="text-[10px] text-rose-400 hover:text-rose-300 font-medium px-1.5 py-0.5 rounded hover:bg-rose-950/40 cursor-pointer"
            >
              ✕ حذف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeacherConsoleModal: React.FC<TeacherConsoleModalProps> = ({
  lessons = [],
  onUpdateLessons,
  onPurgeAllData,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'sheets'>('lessons');
  const [webAppUrl, setWebAppUrl] = useState(analytics.getWebAppUrl());
  const [logs, setLogs] = useState<AnalyticsLogItem[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lesson Editor State
  const [selectedLessonIndex, setSelectedLessonIndex] = useState<number>(0);
  const [editableLessons, setEditableLessons] = useState<LessonData[]>(lessons);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [uploadedModelFileName, setUploadedModelFileName] = useState<string | null>(null);
  const [uploadedARModelFileName, setUploadedARModelFileName] = useState<string | null>(null);
  const [showCustomARModelOverride, setShowCustomARModelOverride] = useState(false);

  // Multi-Target Mapping State
  const [newAdditionalTargetUrl, setNewAdditionalTargetUrl] = useState<string>('');
  const [multiTargetNotice, setMultiTargetNotice] = useState<string | null>(null);

  // 3D Model Sound State
  const testAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingTestAudio, setIsPlayingTestAudio] = useState(false);
  const [audioUploadFileName, setAudioUploadFileName] = useState<string | null>(null);
  const [modelSoundNotice, setModelSoundNotice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (testAudioRef.current) {
        testAudioRef.current.pause();
        testAudioRef.current = null;
      }
    };
  }, []);

  // External Image Link addition state
  const [newImageUrl, setNewImageUrl] = useState<string>('');
  const [newImageTitle, setNewImageTitle] = useState<string>('');
  const [imageNotice, setImageNotice] = useState<string | null>(null);

  // Multi-Video Management State
  const [newVideoUrl, setNewVideoUrl] = useState<string>('');
  const [newVideoTitle, setNewVideoTitle] = useState<string>('');
  const [videoNotice, setVideoNotice] = useState<string | null>(null);

  // Multi-Audio Management State
  const [newAudioUrl, setNewAudioUrl] = useState<string>('');
  const [newAudioTitle, setNewAudioTitle] = useState<string>('');
  const [audioNotice, setAudioNotice] = useState<string | null>(null);
  const [playingLessonAudioUrl, setPlayingLessonAudioUrl] = useState<string | null>(null);
  const lessonAudioTestRef = useRef<HTMLAudioElement | null>(null);

  // In-App Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد الحذف',
    isDestructive: true,
    onConfirm: () => {}
  });

  const [copiedLessonsTs, setCopiedLessonsTs] = useState(false);

  useEffect(() => {
    return () => {
      if (lessonAudioTestRef.current) {
        lessonAudioTestRef.current.pause();
        lessonAudioTestRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Only update if incoming lessons changed significantly and not during active editing
    if (lessons && lessons.length > 0 && editableLessons.length === 0) {
      setEditableLessons(lessons);
    }
  }, [lessons, editableLessons.length]);

  useEffect(() => {
    const unsubscribe = analytics.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const toggleTestAudio = (soundUrl?: string) => {
    if (!soundUrl) return;
    const normalized = normalizeAudioUrl(soundUrl);
    if (!normalized) return;

    if (isPlayingTestAudio && testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
      setIsPlayingTestAudio(false);
      return;
    }

    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }

    try {
      const a = new Audio(normalized);
      a.volume = 0.9;
      a.onended = () => setIsPlayingTestAudio(false);
      a.onerror = () => {
        setIsPlayingTestAudio(false);
        setModelSoundNotice('⚠️ تعذر تشغيل ملف الصوت، تأكد من صحة الرابط أو صلاحية مشاركة قوقل درايف (أي شخص لديه الرابط).');
        setTimeout(() => setModelSoundNotice(null), 4000);
      };
      a.play().then(() => {
        setIsPlayingTestAudio(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
        setIsPlayingTestAudio(false);
      });
      testAudioRef.current = a;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  };

  const handleAddAdditionalTargetImage = () => {
    if (!newAdditionalTargetUrl.trim()) return;
    const normalized = normalizeImageUrl(newAdditionalTargetUrl.trim());
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;

    const existingTargets = curLesson.additionalTargetImages || [];
    const updatedTargets = [...existingTargets, normalized];
    handleFieldChange('additionalTargetImages', updatedTargets);
    setNewAdditionalTargetUrl('');
    setMultiTargetNotice('✓ تمت إضافة صورة المسح الإضافية لهذا الدرس بنجاح!');
    setTimeout(() => setMultiTargetNotice(null), 3500);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.setWebAppUrl(webAppUrl);
    setTestResult('تم حفظ رابط Google Apps Script Web App بنجاح.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await analytics.trackEvent({
        targetId: 'test_ping',
        lessonTitle: 'اختبار اتصال النظام',
        action: 'target_detected'
      });
      setTestResult('✓ تم إرسال حدث الاختبار بنجاح إلى السجل ورابط السكريبت!');
    } catch (err) {
      setTestResult('تعذر الإرسال: ' + String(err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveLessonChanges = () => {
    const { updatedLessons } = buildMultiTargetMap(editableLessons);
    setEditableLessons(updatedLessons);
    if (onUpdateLessons) {
      onUpdateLessons(updatedLessons);
    }
    saveStoredLessons(updatedLessons);
    setHasLocalDrafts(true);
    setSaveSuccess(true);
    setStatusNotice({
      type: 'success',
      text: '✓ تم حفظ التعديلات محلياً وتحديث خريطة الأهداف! لتفعيلها للطلاب في الجوال والتابلت، اضغط على زر (💾 تنزيل content.json لـ GitHub) ثم ارفعه لمستودعك على GitHub.'
    });
    setTimeout(() => {
      setSaveSuccess(false);
      setStatusNotice(null);
    }, 7000);
  };

  const handleCloseModal = () => {
    if (testAudioRef.current) {
      testAudioRef.current.pause();
      testAudioRef.current = null;
    }
    const { updatedLessons } = buildMultiTargetMap(editableLessons);
    if (onUpdateLessons) {
      onUpdateLessons(updatedLessons);
    }
    saveStoredLessons(updatedLessons);
    onClose();
  };

  const handleFieldChange = (field: string, value: any) => {
    setHasLocalDrafts(true);
    setEditableLessons((prev) => {
      const updated = [...prev];
      if (!updated[selectedLessonIndex]) return prev;
      const cur = { ...updated[selectedLessonIndex] };
      if (field === 'title') cur.title = value;
      else if (field === 'subtitle') cur.subtitle = value;
      else if (field === 'subject') cur.subject = value;
      else if (field === 'grade') cur.grade = value;
      else if (field === 'targetImage') cur.targetImage = normalizeImageUrl(value);
      else if (field === 'additionalTargetImages') cur.additionalTargetImages = Array.isArray(value) ? value.map((v: string) => normalizeImageUrl(v)) : value;
      else if (field === 'additionalTargetIndices') cur.additionalTargetIndices = value;
      else if (field === 'model3d') cur.model3d = value;
      else if (field === 'arModel3d') cur.arModel3d = value;
      else if (field === 'videoUrl') {
        const norm = normalizeVideoData(value, cur.video?.title);
        cur.video = norm;
        const currentList = getLessonVideos(cur);
        if (currentList.length > 0) {
          currentList[0] = norm;
          cur.videos = [...currentList];
        } else {
          cur.videos = [norm];
        }
      } else if (field === 'audioUrl') {
        const norm = normalizeAudioData(value, cur.audio?.title);
        cur.audio = norm;
        const currentList = getLessonAudios(cur);
        if (currentList.length > 0) {
          currentList[0] = norm;
          cur.audios = [...currentList];
        } else {
          cur.audios = [norm];
        }
      } else if (field === 'videos') {
        cur.videos = value;
        if (Array.isArray(value) && value.length > 0) {
          cur.video = value[0];
        }
      } else if (field === 'audios') {
        cur.audios = value;
        if (Array.isArray(value) && value.length > 0) {
          cur.audio = value[0];
        }
      } else if (field === 'summary') {
        cur.description = { ...cur.description, summary: value };
      } else if (field === 'images') {
        cur.images = value;
      } else {
        (cur as any)[field] = value;
      }
      updated[selectedLessonIndex] = cur;

      // Auto-save to storage immediately
      try {
        saveStoredLessons(updated);
        if (onUpdateLessons) {
          onUpdateLessons(updated);
        }
      } catch (_) {}

      return updated;
    });
  };

  const handleUpdateModelSound = (soundUrl?: string, soundEnabled?: boolean) => {
    setHasLocalDrafts(true);
    setEditableLessons((prev) => {
      const updated = [...prev];
      if (!updated[selectedLessonIndex]) return prev;
      const cur = { ...updated[selectedLessonIndex] };
      const existingModel = cur.model3d || {
        url: '',
        title: `مجسم: ${cur.title}`,
        autoRotate: true
      };
      const finalSoundUrl = soundUrl !== undefined ? soundUrl : (existingModel.soundUrl || '');
      const finalSoundEnabled = soundEnabled !== undefined ? soundEnabled : (finalSoundUrl.trim() !== '');

      cur.model3d = {
        ...existingModel,
        soundUrl: finalSoundUrl,
        soundEnabled: finalSoundEnabled
      };

      if (cur.arModel3d) {
        cur.arModel3d = {
          ...cur.arModel3d,
          soundUrl: finalSoundUrl,
          soundEnabled: finalSoundEnabled
        };
      }

      updated[selectedLessonIndex] = cur;
      try {
        saveStoredLessons(updated);
        if (onUpdateLessons) onUpdateLessons(updated);
      } catch (_) {}
      return updated;
    });
  };

  const handleAddImageLink = () => {
    if (!newImageUrl.trim()) return;
    const normalized = normalizeImageUrl(newImageUrl.trim());
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;

    const existingImages = curLesson.images || [];
    const title = newImageTitle.trim() || `لوحة توضيحية (${existingImages.length + 1}): ${curLesson.title}`;
    const newImg: LessonImage = {
      url: normalized,
      title: title,
      caption: `رسم توضيحي وعناصر شرح لدرس ${curLesson.title}.`
    };

    const updatedImages = [...existingImages, newImg];
    handleFieldChange('images', updatedImages);
    setNewImageUrl('');
    setNewImageTitle('');
    setImageNotice('✓ تمت إضافة رابط الصورة إلى معرض الدرس بنجاح!');
    setTimeout(() => setImageNotice(null), 3500);
  };

  // وظائف إدارة الفيديوهات المتعددة للدرس وترتيبها
  const handleAddVideo = () => {
    const cleanUrl = newVideoUrl.trim().replace(/^["']|["']$/g, '');
    if (!cleanUrl) {
      setVideoNotice('⚠️ يرجى إدخال رابط الفيديو (YouTube، MP4، Drive، أو أي رابط آخر)');
      return;
    }
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;

    const currentVideos = getLessonVideos(curLesson);
    const norm = normalizeVideoData(
      cleanUrl,
      newVideoTitle.trim() || `فيديو ${currentVideos.length + 1}: ${curLesson.title}`
    );
    const updated = [...currentVideos, norm];
    
    // حفظ التحديث في مصفوفة الفيديوهات والفيديو الرئيسي
    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      videos: updated,
      video: updated[0]
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);

    setNewVideoUrl('');
    setNewVideoTitle('');
    setVideoNotice('✓ تمت إضافة الفيديو لقائمة الدرس بنجاح!');
    setTimeout(() => setVideoNotice(null), 3500);
  };

  const handleDeleteVideo = (idx: number) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentVideos = getLessonVideos(curLesson);
    const targetVideo = currentVideos[idx];
    const videoTitle = targetVideo?.title || `الفيديو رقم ${idx + 1}`;

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الفيديو التعليمي',
      message: `هل أنت متأكد من حذف "${videoTitle}" نهائياً من هذا الدرس؟`,
      confirmText: 'نعم، حذف الفيديو',
      isDestructive: true,
      onConfirm: () => {
        const updated = currentVideos.filter((_, i) => i !== idx);
        const nextLessons = [...editableLessons];
        nextLessons[selectedLessonIndex] = {
          ...curLesson,
          videos: updated,
          // تنظيف الحقل القديم لضمان عدم عودة الفيديو عند الحذف
          video: updated.length > 0 ? updated[0] : undefined
        };
        setEditableLessons(nextLessons);
        if (onUpdateLessons) onUpdateLessons(nextLessons);
        saveStoredLessons(nextLessons);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setVideoNotice('✓ تم حذف الفيديو بنجاح!');
        setTimeout(() => setVideoNotice(null), 3000);
      }
    });
  };

  const handleMoveVideo = (idx: number, direction: 'up' | 'down') => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentVideos = [...getLessonVideos(curLesson)];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentVideos.length) return;

    const temp = currentVideos[idx];
    currentVideos[idx] = currentVideos[targetIdx];
    currentVideos[targetIdx] = temp;

    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      videos: currentVideos,
      video: currentVideos[0]
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);
  };

  const handleUpdateVideo = (idx: number, patch: Partial<LessonVideo>) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentVideos = [...getLessonVideos(curLesson)];
    if (currentVideos[idx]) {
      const merged = { ...currentVideos[idx], ...patch };
      if (patch.url !== undefined) {
        currentVideos[idx] = normalizeVideoData(patch.url, merged.title);
      } else {
        currentVideos[idx] = merged;
      }
      const nextLessons = [...editableLessons];
      nextLessons[selectedLessonIndex] = {
        ...curLesson,
        videos: currentVideos,
        video: currentVideos[0]
      };
      setEditableLessons(nextLessons);
      if (onUpdateLessons) onUpdateLessons(nextLessons);
      saveStoredLessons(nextLessons);
    }
  };

  // وظائف إدارة الصوتيات المتعددة للدرس وترتيبها
  const handleAddAudio = () => {
    const cleanUrl = newAudioUrl.trim().replace(/^["']|["']$/g, '');
    if (!cleanUrl) {
      setAudioNotice('⚠️ يرجى إدخال رابط أو رفع ملف صوتي');
      return;
    }
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;

    const currentAudios = getLessonAudios(curLesson);
    const norm = normalizeAudioData(
      cleanUrl,
      newAudioTitle.trim() || `تسجيل صوتي ${currentAudios.length + 1}: ${curLesson.title}`
    );
    const updated = [...currentAudios, norm];

    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      audios: updated,
      audio: updated[0]
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);

    setNewAudioUrl('');
    setNewAudioTitle('');
    setAudioNotice('✓ تم حفظ التسجيل الصوتي بنجاح!');
    setTimeout(() => setAudioNotice(null), 3500);
  };

  const handleDeleteAudio = (idx: number) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentAudios = getLessonAudios(curLesson);
    const targetAudio = currentAudios[idx];
    const audioTitle = targetAudio?.title || `التسجيل رقم ${idx + 1}`;

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف التسجيل الصوتي',
      message: `هل أنت متأكد من حذف "${audioTitle}" نهائياً من هذا الدرس؟`,
      confirmText: 'نعم، حذف التسجيل',
      isDestructive: true,
      onConfirm: () => {
        if (playingLessonAudioUrl === currentAudios[idx]?.url) {
          if (lessonAudioTestRef.current) {
            lessonAudioTestRef.current.pause();
          }
          setPlayingLessonAudioUrl(null);
        }
        const updated = currentAudios.filter((_, i) => i !== idx);
        const nextLessons = [...editableLessons];
        nextLessons[selectedLessonIndex] = {
          ...curLesson,
          audios: updated,
          // تنظيف الحقل القديم لضمان عدم عودة الصوت عند الحذف
          audio: updated.length > 0 ? updated[0] : undefined
        };
        setEditableLessons(nextLessons);
        if (onUpdateLessons) onUpdateLessons(nextLessons);
        saveStoredLessons(nextLessons);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setAudioNotice('✓ تم حذف التسجيل الصوتي بنجاح!');
        setTimeout(() => setAudioNotice(null), 3000);
      }
    });
  };

  const handleMoveAudio = (idx: number, direction: 'up' | 'down') => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentAudios = [...getLessonAudios(curLesson)];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentAudios.length) return;

    const temp = currentAudios[idx];
    currentAudios[idx] = currentAudios[targetIdx];
    currentAudios[targetIdx] = temp;

    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      audios: currentAudios,
      audio: currentAudios[0]
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);
  };

  const handleUpdateAudio = (idx: number, patch: Partial<LessonAudio>) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentAudios = [...getLessonAudios(curLesson)];
    if (currentAudios[idx]) {
      const merged = { ...currentAudios[idx], ...patch };
      if (patch.url !== undefined) {
        currentAudios[idx] = normalizeAudioData(patch.url, merged.title);
      } else {
        currentAudios[idx] = merged;
      }
      const nextLessons = [...editableLessons];
      nextLessons[selectedLessonIndex] = {
        ...curLesson,
        audios: currentAudios,
        audio: currentAudios[0]
      };
      setEditableLessons(nextLessons);
      if (onUpdateLessons) onUpdateLessons(nextLessons);
      saveStoredLessons(nextLessons);
    }
  };

  const handleTestPlayLessonAudio = (url: string) => {
    if (!url) return;
    if (playingLessonAudioUrl === url) {
      if (lessonAudioTestRef.current) {
        lessonAudioTestRef.current.pause();
      }
      setPlayingLessonAudioUrl(null);
      return;
    }

    if (lessonAudioTestRef.current) {
      lessonAudioTestRef.current.pause();
    }
    const a = new Audio(url);
    lessonAudioTestRef.current = a;
    setPlayingLessonAudioUrl(url);
    a.play().catch((err) => {
      console.warn('Audio test error:', err);
      setPlayingLessonAudioUrl(null);
      alert('تعذر تشغيل هذا المقطع الصوتي للمعاينة. قد يكون الرابط محظوراً أو التنسيق غير مدعوم.');
    });
    a.onended = () => setPlayingLessonAudioUrl(null);
    a.onerror = () => setPlayingLessonAudioUrl(null);
  };

  const handleUploadLessonAudioLocal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|aac|m4a)$/i)) {
      alert('يرجى اختيار ملف صوتي صالح (MP3 أو WAV أو OGG).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const curLesson = editableLessons[selectedLessonIndex];
      if (!curLesson) return;
      const currentAudios = getLessonAudios(curLesson);
      const cleanFileName = file.name.replace(/\.[^/.]+$/, '');
      const norm = normalizeAudioData(dataUrl, cleanFileName || `تسجيل صوتي ${currentAudios.length + 1}`);
      const updated = [...currentAudios, norm];
      handleFieldChange('audios', updated);
      setAudioNotice(`✓ تم رفع الملف الصوتي (${file.name}) بنجاح!`);
      setTimeout(() => setAudioNotice(null), 4000);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddNewLesson = () => {
    const newIndex = editableLessons.length;
    const newLesson: LessonData = {
      targetIndex: newIndex,
      targetId: `lesson_${String(newIndex + 1).padStart(3, '0')}`,
      title: `درس جديد رقم ${newIndex + 1}`,
      subtitle: 'اكتب وصفاً أو تمهيداً للدرس هنا',
      subject: 'العلوم العامة',
      grade: 'الصف الابتدائي',
      targetImage: '',
      video: {
        type: 'youtube',
        url: 'https://www.youtube.com/watch?v=ncORPosDrjI',
        embedUrl: 'https://www.youtube.com/embed/ncORPosDrjI?autoplay=1&rel=0',
        title: 'فيديو تعليمي تفاعلي'
      },
      images: [],
      audio: {
        url: 'https://actions.google.com/sounds/v1/weather/rain_heavy.ogg',
        title: 'تسجيل صوتي'
      },
      description: {
        summary: 'ملخص وشرح معلومات الدرس...',
        keyPoints: ['نقطة رئيسية 1', 'نقطة رئيسية 2'],
        fullText: 'شرح مفصل للدرس يظهر للطالب عند الضغط على زر الشرح...',
        quiz: {
          question: 'سؤال الاختبار التفاعلي؟',
          options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'],
          correctIndex: 0,
          explanation: 'تفسير الإجابة الصحيحة'
        }
      }
    };
    const rawUpdated = [...editableLessons, newLesson];
    const { updatedLessons } = buildMultiTargetMap(rawUpdated);
    setEditableLessons(updatedLessons);
    setSelectedLessonIndex(updatedLessons.length - 1);
    if (onUpdateLessons) {
      onUpdateLessons(updatedLessons);
    }
    saveStoredLessons(updatedLessons);
  };

  const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editableLessons.length) return;

    const nextLessons = [...editableLessons];
    const temp = nextLessons[index];
    nextLessons[index] = nextLessons[targetIndex];
    nextLessons[targetIndex] = temp;

    const { updatedLessons } = buildMultiTargetMap(nextLessons);
    setEditableLessons(updatedLessons);
    setSelectedLessonIndex(targetIndex);
    if (onUpdateLessons) {
      onUpdateLessons(updatedLessons);
    }
    saveStoredLessons(updatedLessons);
  };

  const handleDeleteLesson = (indexToDelete: number) => {
    const lessonTitle = editableLessons[indexToDelete]?.title || 'هذا الدرس';
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف الدرس نهائياً',
      message: `هل أنت متأكد من حذف "${lessonTitle}" وجميع وسائطه من قائمة الدروس؟`,
      confirmText: 'نعم، حذف الدرس',
      isDestructive: true,
      onConfirm: () => {
        const filtered = editableLessons.filter((_, idx) => idx !== indexToDelete);
        const { updatedLessons } = buildMultiTargetMap(filtered);
        
        setEditableLessons(updatedLessons);
        setSelectedLessonIndex((prev) => Math.max(0, Math.min(prev, updatedLessons.length - 1)));
        if (onUpdateLessons) {
          onUpdateLessons(updatedLessons);
        }
        saveStoredLessons(updatedLessons);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setStatusNotice({ type: 'success', text: `✓ تم حذف "${lessonTitle}" بنجاح.` });
        setTimeout(() => setStatusNotice(null), 3000);
      }
    });
  };

  const handleClearAllLessons = () => {
    setConfirmModal({
      isOpen: true,
      title: 'تأكيد مسح كافة الدروس',
      message: '⚠️ تحذير: هل أنت متأكد من رغبتك في مسح كافة الدروس والبدء من الصفر؟ لن تتمكن من استرجاعها إلا باستيراد ملف احتياطي أو إعادة التعيين.',
      confirmText: 'نعم، مسح كافة الدروس',
      isDestructive: true,
      onConfirm: () => {
        setEditableLessons([]);
        setSelectedLessonIndex(0);
        if (onUpdateLessons) {
          onUpdateLessons([]);
        }
        saveStoredLessons([]);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setStatusNotice({ type: 'info', text: 'تم تفريغ قائمة الدروس.' });
        setTimeout(() => setStatusNotice(null), 3000);
      }
    });
  };

  const handleCopyLessonsTsCode = () => {
    const { updatedLessons } = buildMultiTargetMap(editableLessons);
    const code = `import { LessonData } from '../types/ar';\n\nexport const DEFAULT_LESSONS: LessonData[] = ${JSON.stringify(updatedLessons, null, 2)};\n`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedLessonsTs(true);
      setTimeout(() => setCopiedLessonsTs(false), 4000);
    });
  };

  const handleDownloadContentJson = () => {
    const { updatedLessons } = buildMultiTargetMap(editableLessons);
    const normalized = updatedLessons.map((l, idx) => {
      // Ensure model URLs are permanent paths rather than temporary blob URLs
      let cleanModel = l.model3d;
      if (cleanModel?.url?.startsWith('blob:')) {
        cleanModel = {
          ...cleanModel,
          url: `/models/lesson_${idx + 1}_model.glb`
        };
      }
      let cleanAR = l.arModel3d;
      if (cleanAR?.url?.startsWith('blob:')) {
        cleanAR = {
          ...cleanAR,
          url: `/models/lesson_${idx + 1}_ar.glb`
        };
      }
      return {
        ...l,
        model3d: cleanModel,
        arModel3d: cleanAR
      };
    });

    const exportPayload = {
      version: '3.3.0',
      exportedAt: new Date().toISOString(),
      lessonsCount: normalized.length,
      lessons: normalized
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.json';
    a.click();

    setHasLocalDrafts(false);
    setStatusNotice({
      type: 'success',
      text: `✓ تم تنزيل ملف content.json بنجاح (${normalized.length} دروس)! الخطوة التالية: ضعه في مجلد public/data/content.json في مشروعك وارفعه إلى GitHub و Vercel ليظهر فوراً لجميع الطلاب.`
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 7000);
  };

  const handleImportContentJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rawText = ev.target?.result as string;
        const parsed = JSON.parse(rawText);
        const loadedLessons = Array.isArray(parsed) ? parsed : (parsed?.lessons || parsed?.data?.lessons);
        if (Array.isArray(loadedLessons) && loadedLessons.length > 0) {
          const normalized: LessonData[] = loadedLessons.map((l: any, idx: number) => ({
            ...l,
            targetIndex: typeof l.targetIndex === 'number' ? l.targetIndex : idx,
            targetId: l.targetId || `lesson_${String(idx + 1).padStart(3, '0')}`,
            title: l.title || `درس رقم ${idx + 1}`,
            images: Array.isArray(l.images) ? l.images : []
          }));
          setEditableLessons(normalized);
          saveStoredLessons(normalized);
          setHasLocalDrafts(false);
          if (onUpdateLessons) onUpdateLessons(normalized);
          setSelectedLessonIndex(0); // Switch to lesson 1 to immediately see the data in form
          setStatusNotice({
            type: 'success',
            text: `✓ تم بنجاح استيراد ${normalized.length} دروس من ملف content.json! تظهر الآن كافة العناوين، الروابط، الصور، والمجسمات في واجهة التحكم.`
          });
          setSaveSuccess(true);
          setTimeout(() => {
            setSaveSuccess(false);
          }, 7000);
        } else {
          setStatusNotice({
            type: 'error',
            text: '⚠️ الملف المختار لا يحتوي على مصفوفة دروس (lessons) صالحة. يرجى التأكد من اختيار ملف content.json الصحيح.'
          });
        }
      } catch (err: any) {
        console.warn('فشل قراءة ملف content.json:', err);
        setStatusNotice({
          type: 'error',
          text: `⚠️ تعذر قراءة الملف: ${err?.message || 'الملف ليس بصيغة JSON صحيحة'}`
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadFixedTargetsMind = () => {
    const a = document.createElement('a');
    a.href = '/targets/targets.mind';
    a.download = 'targets.mind';
    a.click();
  };

  const copyCodeSample = () => {
    const code = `// Google Apps Script - Code.gs
var SHEET_NAME = "Events";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.session_id || "session",
      data.target_id || "lesson",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const currentLesson = editableLessons[selectedLessonIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">لوحة تحكم المعلم وإدارة الدروس الحقيقية</h3>
              <p className="text-xs text-slate-400">إضافة وحذف الدروس، رفع صور كتابك المدرسي، وتوليد ملف targets.mind</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveLessonChanges}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
              title="حفظ كافة تعديلات الدروس فوراً"
            >
              <Save className="w-3.5 h-3.5" />
              <span>حفظ التعديلات</span>
            </button>
            <button
              onClick={handleCloseModal}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
              title="إغلاق لوحة التحكم"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status notice banner for Save / Download / Import / Sync */}
        {statusNotice && (
          <div className={`border-b px-4 py-2.5 flex items-center justify-between gap-3 text-xs font-semibold animate-fadeIn ${
            statusNotice.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : statusNotice.type === 'info'
              ? 'bg-sky-950/95 border-sky-500/50 text-sky-200'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {statusNotice.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              ) : statusNotice.type === 'info' ? (
                <Sparkles className="w-4 h-4 text-sky-400 flex-shrink-0 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{statusNotice.text}</span>
            </div>
            <button
              onClick={() => setStatusNotice(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer flex-shrink-0"
              title="إغلاق التنبيه"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-4 pt-3 bg-slate-800/40 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('lessons')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'lessons'
                  ? 'bg-slate-900 text-sky-400 border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>محرر الدروس وربط صور الكتب ({editableLessons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('sheets')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'sheets'
                  ? 'bg-slate-900 text-emerald-400 border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Database className="w-4 h-4" />
              <span>ربط Google Sheets</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {onPurgeAllData && (
              <button
                type="button"
                onClick={onPurgeAllData}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1 p-1 cursor-pointer"
                title="تصفير الكاش ومسح كل الذاكرة المؤقتة من المتصفح"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>تصفير الكاش والذاكرة</span>
              </button>
            )}

            {activeTab === 'lessons' && editableLessons.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllLessons}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 p-1 cursor-pointer"
                title="مسح كافة الدروس الحالية"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح جميع الدروس</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Lessons Manager & Targets Linker */}
        {activeTab === 'lessons' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            {/* Guide Banner */}
            <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-sky-200 leading-relaxed">
                <span className="font-bold text-white block mb-0.5">💡 خطوات إعداد صور كتابك المدرسي الجديد:</span>
                1. اضغط على <strong>[ + إضافة درس جديد ]</strong> لكل صفحة من كتابك.<br />
                2. اضغط على <strong>[ رفع صورة من جهازك ]</strong> لاختيار صورة الصفحة.<br />
                3. ضع روابط الفيديو والصوت والنصوص وسؤال الاختبار.<br />
                4. اضغط <strong>[ ⚡ تجميع بصمات الصور ]</strong> لدمج جميع الصور وتوليد <code className="text-sky-300">targets.mind</code>.
              </div>
            </div>

            {/* Lessons Selector Bar with Add & Delete */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">قائمة دروس كتابك المدرسي:</span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {editableLessons.length === 0 ? 'لا توجد دروس حالياً' : `إجمالي الدروس: ${editableLessons.length}`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {editableLessons.map((l, idx) => {
                  const isSelected = selectedLessonIndex === idx;
                  return (
                    <div
                      key={l.targetId}
                      className={`relative group rounded-xl border transition-all flex items-stretch overflow-hidden ${
                        isSelected
                          ? 'bg-sky-950/60 border-sky-500 text-white shadow-md'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {/* Reorder Up/Down for Lesson */}
                      <div className="flex flex-col justify-center gap-1 py-1 px-1 border-l border-slate-800/80 bg-slate-900/50 flex-shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLesson(idx, 'up');
                          }}
                          className="text-slate-400 hover:text-sky-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5 rounded hover:bg-slate-800 transition-colors"
                          title="تحريك الدرس للأعلى (تقديم الترتيب)"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === editableLessons.length - 1}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveLesson(idx, 'down');
                          }}
                          className="text-slate-400 hover:text-sky-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed p-0.5 rounded hover:bg-slate-800 transition-colors"
                          title="تحريك الدرس للأسفل (تأخير الترتيب)"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedLessonIndex(idx)}
                        className="flex-1 p-2 text-right flex flex-col justify-between cursor-pointer truncate min-w-0"
                      >
                        <span className="text-[10px] font-mono text-sky-400 font-bold block">
                          Target #{l.targetIndex}
                        </span>
                        <span className="text-xs font-bold text-slate-100 truncate mt-1 block">
                          {l.title || `درس ${idx + 1}`}
                        </span>
                      </button>

                      {/* Delete Quick Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(idx);
                        }}
                        className="px-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 border-r border-slate-800/80 transition-colors cursor-pointer flex-shrink-0 flex items-center justify-center"
                        title="حذف هذا الدرس"
                        aria-label={`حذف ${l.title}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}

                {/* Add New Lesson Button */}
                <button
                  type="button"
                  onClick={handleAddNewLesson}
                  className="p-3 rounded-xl border border-dashed border-sky-500/50 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ إضافة درس جديد</span>
                </button>
              </div>
            </div>

            {/* Empty State when 0 lessons */}
            {editableLessons.length === 0 && (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                  <BookOpen className="w-7 h-7" />
                </div>
                <h4 className="text-sm sm:text-base font-bold text-white">لا توجد دروس حالياً (تم إفراغ النماذج)</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  ابدأ الآن بإضافة أول درس لك، ورفع صورة الصفحة المقابلة له من كتابك المدرسي وتعبئة بياناته.
                </p>
                <button
                  type="button"
                  onClick={handleAddNewLesson}
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة أول درس لك الآن</span>
                </button>
              </div>
            )}

            {/* Current Lesson Edit Form */}
            {currentLesson && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-sky-400" />
                    <span>تعديل بيانات: {currentLesson.title} (Target #{currentLesson.targetIndex})</span>
                  </h4>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                      ID: {currentLesson.targetId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(selectedLessonIndex)}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف الدرس</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Lesson Title */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-bold text-slate-300">عنوان الدرس:</label>
                    <input
                      type="text"
                      value={currentLesson.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="مثال: الخلية النباتية والبناء الضوئي"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-bold text-slate-300">المادة الدراسية:</label>
                    <input
                      type="text"
                      value={currentLesson.subject}
                      onChange={(e) => handleFieldChange('subject', e.target.value)}
                      placeholder="العلوم / الفيزياء / الأحياء"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Grade */}
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-xs font-bold text-slate-300">الصف الدراسي:</label>
                    <input
                      type="text"
                      value={currentLesson.grade}
                      onChange={(e) => handleFieldChange('grade', e.target.value)}
                      placeholder="الصف الرابع الابتدائي"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  {/* Summary */}
                  <div className="space-y-1 md:col-span-3">
                    <label className="text-xs font-bold text-slate-300">ملخص وشرح الدرس:</label>
                    <textarea
                      rows={2}
                      value={currentLesson.description.summary}
                      onChange={(e) => handleFieldChange('summary', e.target.value)}
                      placeholder="اكتب شرحاً ومعلومات مفيدة للطالب عند قراءة صفحة الدرس..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                {/* 🎬 بطاقة إدارة فيديوهات الدرس (دعم روابط متعددة: YouTube, MP4, Vimeo, Drive, مواقع أخرى) */}
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                        <Video className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>فيديوهات الدرس التعليمية (روابط متعددة)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                            {getLessonVideos(currentLesson).length} فيديو
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          يمكنك إضافة أكثر من فيديو للدرس الواحد من YouTube أو Google Drive أو ملفات MP4 المباشرة أو أي موقع خارجي.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notice for video */}
                  {videoNotice && (
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{videoNotice}</span>
                    </div>
                  )}

                  {/* Existing Videos List */}
                  {getLessonVideos(currentLesson).length > 0 ? (
                    <div className="space-y-2">
                      {getLessonVideos(currentLesson).map((vid, vidIdx) => {
                        const platformBadge =
                          vid.type === 'youtube'
                            ? 'YouTube'
                            : vid.type === 'vimeo'
                            ? 'Vimeo'
                            : vid.type === 'gdrive'
                            ? 'Drive'
                            : vid.type === 'mp4'
                            ? 'MP4 مباشر'
                            : 'رابط خارجي';

                        return (
                          <div
                            key={vidIdx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center font-mono">
                                #{vidIdx + 1}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                                {platformBadge}
                              </span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
                              <input
                                type="text"
                                value={vid.title}
                                onChange={(e) => handleUpdateVideo(vidIdx, { title: e.target.value })}
                                placeholder="عنوان المقطع (مثال: شرح الخطوات)"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-rose-500"
                              />
                              <input
                                type="url"
                                value={vid.url}
                                onChange={(e) => handleUpdateVideo(vidIdx, { url: e.target.value })}
                                placeholder="رابط الفيديو (https://...)"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-rose-500"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                              {/* Video Reordering Buttons */}
                              <button
                                type="button"
                                disabled={vidIdx === 0}
                                onClick={() => handleMoveVideo(vidIdx, 'up')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="تحريك الفيديو للأعلى (تقديم الترتيب)"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={vidIdx === getLessonVideos(currentLesson).length - 1}
                                onClick={() => handleMoveVideo(vidIdx, 'down')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="تحريك الفيديو للأسفل (تأخير الترتيب)"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {vid.url && (
                                <a
                                  href={vid.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 transition-colors"
                                  title="معاينة الرابط في تبويب جديد"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteVideo(vidIdx)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="حذف هذا الفيديو"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
                      لا توجد فيديوهات مضافة لهذا الدرس حتى الآن.
                    </div>
                  )}

                  {/* Add New Video Form */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-rose-400" />
                      <span>إضافة فيديو جديد لهذا الدرس:</span>
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newVideoTitle}
                        onChange={(e) => setNewVideoTitle(e.target.value)}
                        placeholder="عنوان الفيديو (مثال: شرح المعلم للدرس)"
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                      />
                      <input
                        type="url"
                        value={newVideoUrl}
                        onChange={(e) => setNewVideoUrl(e.target.value)}
                        placeholder="رابط الفيديو (YouTube، MP4، Drive، أو أي موقع آخر)"
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddVideo}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة الفيديو لقائمة الدرس</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 🎵 بطاقة إدارة التسجيلات الصوتية للدرس (دعم ملفات متعددة: MP3, Drive, YouTube, رفع مباشر وتجربة الصوت) */}
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Music className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>التسجيلات الصوتية للدرس (روابط وملفات صوتية متعددة)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                            {getLessonAudios(currentLesson).length} تسجيل
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          صوت الدرس منفصل تماماً عن صوت المجسم. يمكن للطالب الاستماع إليها عبر زر الصوت أو التنقل بين عدة مقاطع.
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all flex-shrink-0 self-start sm:self-auto">
                      <Upload className="w-3.5 h-3.5" />
                      <span>📁 رفع ملف صوت من الجهاز (MP3)</span>
                      <input
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a"
                        onChange={handleUploadLessonAudioLocal}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Notice for audio */}
                  {audioNotice && (
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5 animate-fadeIn">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{audioNotice}</span>
                    </div>
                  )}

                  {/* Existing Audios List */}
                  {getLessonAudios(currentLesson).length > 0 ? (
                    <div className="space-y-2">
                      {getLessonAudios(currentLesson).map((aud, audIdx) => {
                        const isThisPlaying = playingLessonAudioUrl === aud.url;
                        const isData = aud.url.startsWith('data:');
                        return (
                          <div
                            key={audIdx}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center font-mono">
                                #{audIdx + 1}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                                {isData ? 'ملف مرفوع' : aud.type || 'صوت'}
                              </span>
                            </div>

                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
                              <input
                                type="text"
                                value={aud.title}
                                onChange={(e) => handleUpdateAudio(audIdx, { title: e.target.value })}
                                placeholder="عنوان التسجيل (مثال: قراءة النص بصوت المعلم)"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                              />
                              <input
                                type="url"
                                value={isData ? 'ملف صوتي مرفوع محلياً (Data URL)' : aud.url}
                                disabled={isData}
                                onChange={(e) => handleUpdateAudio(audIdx, { url: e.target.value })}
                                placeholder="رابط الصوت (https://.../audio.mp3)"
                                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-60"
                              />
                            </div>

                            <div className="flex items-center gap-1.5 self-end md:self-center flex-shrink-0">
                              {/* Test play button in console */}
                              <button
                                type="button"
                                onClick={() => handleTestPlayLessonAudio(aud.url)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer border ${
                                  isThisPlaying
                                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                                    : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border-emerald-500/30'
                                }`}
                                title={isThisPlaying ? 'إيقاف التجربة' : 'تجربة وتشغيل الصوت الآن للتأكد منه'}
                              >
                                {isThisPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                                <span>{isThisPlaying ? 'إيقاف' : 'تجربة الصوت'}</span>
                              </button>

                              {/* Audio Reordering Buttons */}
                              <button
                                type="button"
                                disabled={audIdx === 0}
                                onClick={() => handleMoveAudio(audIdx, 'up')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="تحريك التسجيل للأعلى (تقديم الترتيب)"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={audIdx === getLessonAudios(currentLesson).length - 1}
                                onClick={() => handleMoveAudio(audIdx, 'down')}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed transition-colors"
                                title="تحريك التسجيل للأسفل (تأخير الترتيب)"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>

                              {!isData && aud.url && (
                                <a
                                  href={aud.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300 transition-colors"
                                  title="فتح الرابط في تبويب جديد"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteAudio(audIdx)}
                                className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                                title="حذف هذا التسجيل الصوتي"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
                      لا توجد تسجيلات صوتية مضافة لهذا الدرس. يمكنك إضافة رابط أو رفع ملف صوتي.
                    </div>
                  )}

                  {/* Add New Audio Form */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>إضافة تسجيل صوتي جديد للدرس عبر الرابط:</span>
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newAudioTitle}
                        onChange={(e) => setNewAudioTitle(e.target.value)}
                        placeholder="عنوان التسجيل (مثال: الشرح التوضيحي)"
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="url"
                        value={newAudioUrl}
                        onChange={(e) => setNewAudioUrl(e.target.value)}
                        placeholder="رابط الصوت (MP3 مباشر، Google Drive، YouTube، أو موقع صوتي)"
                        className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddAudio}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة التسجيل لقائمة الدرس</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 📷 Card 1: Book Page Scan Target Image */}
                <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                        <Camera className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>١. صورة صفحة الكتاب المطبوعة (هدف المسح بالكاميرا)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                            Target #{currentLesson.targetIndex}
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          هذه هي صفحة كتاب الطالب التي ستتعرف عليها الكاميرا عند توجيه الهاتف نحوها.
                        </p>
                      </div>
                    </div>

                    <label className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all flex-shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>📁 رفع صورة صفحة الكتاب</span>
                      <input
                        key={`book_scan_${currentLesson.targetId}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            try {
                              const optimized = await optimizeImageFile(file, 1024, 1024, 0.85);
                              handleFieldChange('targetImage', optimized);
                              setStatusNotice({ type: 'success', text: '✓ تم رفع وضغط صورة كتاب الدرس بنجاح!' });
                              setTimeout(() => setStatusNotice(null), 3000);
                            } catch (err: any) {
                              setStatusNotice({ type: 'error', text: 'تعذر معالجة الصورة: ' + (err.message || String(err)) });
                            }
                          }
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex items-center gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                      {currentLesson.targetImage ? (
                        <img
                          src={currentLesson.targetImage}
                          alt={currentLesson.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-500 text-center px-1">لم يتم رفع صورة الكتاب بعد</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <label className="text-[11px] font-bold text-slate-300">رابط أو مسار صورة الكتاب:</label>
                      <input
                        type="text"
                        value={currentLesson.targetImage}
                        onChange={(e) => handleFieldChange('targetImage', e.target.value)}
                        placeholder="اضغط (رفع صورة صفحة الكتاب) أو الصق الرابط هنا"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  </div>

                  {/* ⭐ Multi-Target Mapping: إضافة صفحات وبطاقات مسح إضافية لنفس الدرس ⭐ */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-sky-500/30 space-y-2.5 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-sky-400 flex-shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>صفحات وأهداف مسح إضافية لنفس الدرس (Multi-Target Mapping)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                              {currentLesson.additionalTargetImages?.length || 0} إضافية
                            </span>
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        التعرف على أي صفحة منها يفتح نفس الدرس ومجسمه
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      إذا كان الدرس يمتد عبر عدة صفحات في الكتاب (مثلاً صفحة ١٤ وصفحة ١٥)، أو يحتوي على أكثر من بطاقة ورقية، أضف صور الصفحات الأخرى هنا. سيتعرف نظام الكاميرا على أي صفحة منها فوراً ويفتح نفس الدرس ومجسمه ثلاثي الأبعاد!
                    </p>

                    {/* حقل إضافة رابط أو رفع صفحة إضافية */}
                    <div className="flex flex-col sm:flex-row gap-2 items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="url"
                          value={newAdditionalTargetUrl}
                          onChange={(e) => setNewAdditionalTargetUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAdditionalTargetImage();
                            }
                          }}
                          placeholder="الصق رابط صورة صفحة إضافية (قوقل درايف أو رابط مباشر)..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleAddAdditionalTargetImage}
                          disabled={!newAdditionalTargetUrl.trim()}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة الرابط</span>
                        </button>

                        <label className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold cursor-pointer border border-slate-700 transition-colors flex items-center justify-center gap-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>📁 رفع صفحة</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                try {
                                  const optimized = await optimizeImageFile(file, 1024, 1024, 0.85);
                                  const curLesson = editableLessons[selectedLessonIndex];
                                  const existing = curLesson?.additionalTargetImages || [];
                                  handleFieldChange('additionalTargetImages', [...existing, optimized]);
                                  setMultiTargetNotice('✓ تمت إضافة صورة المسح الإضافية للدرس بنجاح وبدقة عالية!');
                                  setTimeout(() => setMultiTargetNotice(null), 3500);
                                } catch (err: any) {
                                  setMultiTargetNotice('تعذر معالجة الصورة: ' + (err.message || String(err)));
                                }
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {multiTargetNotice && (
                      <p className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        {multiTargetNotice}
                      </p>
                    )}

                    {/* شبكة معاينة صور صفحات المسح المسجلة لهذا الدرس */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <span>خريطة أهداف المسح البصري المعتمدة لهذا الدرس:</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {/* الهدف الأساسي */}
                        <div className="p-2 rounded-lg bg-sky-950/50 border border-sky-500/40 space-y-1.5 flex flex-col items-center">
                          <div className="w-full h-20 rounded bg-black/60 border border-slate-700 overflow-hidden flex items-center justify-center">
                            {currentLesson.targetImage ? (
                              <img
                                src={normalizeImageUrl(currentLesson.targetImage)}
                                alt="الهدف الرئيسي"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-[9px] text-slate-500 text-center">لا توجد صورة</span>
                            )}
                          </div>
                          <div className="w-full flex items-center justify-between text-[10px]">
                            <span className="font-bold text-sky-300">الهدف الأساسي #1</span>
                            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-200 text-[9px] font-mono">
                              Target #{currentLesson.targetIndex}
                            </span>
                          </div>
                        </div>

                        {/* الأهداف الإضافية */}
                        {(currentLesson.additionalTargetImages || []).map((imgUrl, addIdx) => (
                          <div
                            key={`target_add_${addIdx}_${imgUrl.slice(0, 30)}`}
                            className="p-2 rounded-lg bg-slate-950/80 border border-slate-700/80 space-y-1.5 flex flex-col items-center relative group"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                const filtered = (currentLesson.additionalTargetImages || []).filter((_, i) => i !== addIdx);
                                handleFieldChange('additionalTargetImages', filtered);
                              }}
                              className="absolute top-1 left-1 p-1 rounded-md bg-rose-950/90 hover:bg-rose-900 text-rose-300 border border-rose-500/50 transition-all cursor-pointer z-10"
                              title="حذف هذه الصفحة الإضافية"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <div className="w-full h-20 rounded bg-black/60 border border-slate-700 overflow-hidden flex items-center justify-center">
                              <img
                                src={normalizeImageUrl(imgUrl)}
                                alt={`هدف إضافي #${addIdx + 1}`}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="w-full flex items-center justify-between text-[10px]">
                              <span className="font-bold text-slate-300">صفحة إضافية #{addIdx + 2}</span>
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-200 text-[9px] font-mono">
                                Multi-Target
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🖼️ Card 2: Educational Explanation / Diagram Images */}
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Image className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>٢. معرض صور الشرح واللوحات (التي يراها الطالب في التطبيق)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                            {currentLesson.images?.length || 0} صور مضافة
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          اللوحات والرسوم التي تظهر للطالب عند النقر على زر 🖼️ "الصور". يمكنك إضافة أي عدد من روابط Google Drive، أو روابط مباشرة، أو رفع صور من جهازك!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      {currentLesson.images && currentLesson.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'مسح كافة صور الدرس',
                              message: 'هل أنت متأكد من رغبتك في حذف كافة صور هذا الدرس؟ سيتم الاعتماد على صورة الكتاب تلقائياً.',
                              confirmText: 'نعم، مسح كافة الصور',
                              isDestructive: true,
                              onConfirm: () => {
                                handleFieldChange('images', []);
                                setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                              }
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-all"
                          title="حذف كافة صور الشرح والاعتماد على صورة الكتاب تلقائياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>مسح كافة الصور</span>
                        </button>
                      )}

                      <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all flex-shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 رفع صور من جهازك (اختيار عدة صور)</span>
                        <input
                          key={`explanation_img_${currentLesson.targetId}`}
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              const files = Array.from(e.target.files);
                              Promise.all(files.map((file, idx) => new Promise<LessonImage>((resolve) => {
                                const reader = new FileReader();
                                reader.onload = (uploadEv) => {
                                  const base64 = uploadEv.target?.result as string;
                                  resolve({
                                    url: base64,
                                    title: file.name.replace(/\.[^/.]+$/, ''),
                                    caption: `لوحة تعليمية: ${currentLesson.title} (${idx + 1})`
                                  });
                                };
                                reader.readAsDataURL(file);
                              }))).then((newUploadedImages) => {
                                const existing = currentLesson.images || [];
                                handleFieldChange('images', [...existing, ...newUploadedImages]);
                                setImageNotice(`✓ تم رفع وإضافة ${newUploadedImages.length} صور من جهازك بنجاح!`);
                                setTimeout(() => setImageNotice(null), 4000);
                              });
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* صندوق إضافة رابط صورة خارجي (Google Drive أو أي رابط ويب) */}
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-sky-400" />
                        <span>إضافة رابط صورة جديد (Google Drive أو أي رابط مباشر):</span>
                      </label>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30">
                        ✨ تحويل ذكي لروابط Google Drive
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                      <div className="sm:col-span-6">
                        <input
                          type="url"
                          value={newImageUrl}
                          onChange={(e) => setNewImageUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageLink();
                            }
                          }}
                          placeholder="الصق رابط صورة Google Drive أو رابط صورة مباشر هنا..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={newImageTitle}
                          onChange={(e) => setNewImageTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddImageLink();
                            }
                          }}
                          placeholder="عنوان الصورة (مثال: دورة الماء / مخطط الدرس)..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          onClick={handleAddImageLink}
                          disabled={!newImageUrl.trim()}
                          className="w-full h-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold text-xs transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1 shadow-sm active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة الرابط</span>
                        </button>
                      </div>
                    </div>

                    {imageNotice && (
                      <p className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                        {imageNotice}
                      </p>
                    )}

                    {/* صندوق إرشادات وشروط قبول الروابط */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
                      <div className="font-bold text-sky-400 flex items-center gap-1.5">
                        <span>💡 شروط وضمان عمل روابط الصور بنجاح:</span>
                      </div>
                      <ul className="space-y-1 text-slate-300 pr-3 list-disc">
                        <li>
                          <strong className="text-amber-300">لروابط Google Drive:</strong> يجب أن تكون صلاحية الملف مضبوطة على{' '}
                          <span className="text-white underline font-semibold">«أي شخص لديه الرابط» (عارض)</span>. إذا كان الملف مضبوطاً على «حصري/خاص» تمنع قوقل ظهوره خارج حسابك.
                        </li>
                        <li>
                          <strong className="text-emerald-300">الصيغ المدعومة:</strong> يقبل النظام كافة أنواع الصور بدون استثناء:{' '}
                          <span className="text-white font-mono">PNG, JPG, JPEG, GIF (المتحركة بالكامل), WebP, SVG</span>.
                        </li>
                        <li>
                          <strong className="text-sky-300">طريقة التحويل التلقائي:</strong> انسخ رابط المشاركة العادي من درايف وسيقوم النظام فوراً بتهيئته وعرضه بجودة فائقة.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* قائمة الصور المضافة لهذا الدرس */}
                  {currentLesson.images && currentLesson.images.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-300">
                          الصور المعتمدة لهذا الدرس في المعرض ({currentLesson.images.length} صورة):
                        </span>
                        <span className="text-[10px] text-slate-400">
                          يمكنك تعديل عنوان أي صورة أو حذفها بنقرة واحدة
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1">
                        {currentLesson.images.map((img, imgIdx) => (
                          <LessonImageCard
                            key={`${currentLesson.targetId}_${imgIdx}_${img.url}`}
                            img={img}
                            imgIdx={imgIdx}
                            lessonId={currentLesson.targetId}
                            onUpdateTitle={(newTitle) => {
                              const updatedImages = (currentLesson.images || []).map((im, i) =>
                                i === imgIdx ? { ...im, title: newTitle } : im
                              );
                              handleFieldChange('images', updatedImages);
                            }}
                            onDelete={() => {
                              const filtered = (currentLesson.images || []).filter((_, idx) => idx !== imgIdx);
                              handleFieldChange('images', filtered);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                      <p className="text-xs text-slate-400">
                        لم يتم إضافة صور توضيحية لهذا الدرس بعد.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        إذا لم تضف صوراً هنا، سيُعرض كتاب الدرس تلقائياً عند فتح زر 🖼️ "الصور"، أو يمكنك إضافة روابط من قوقل درايف أو رفع صور من جهازك أعلاه.
                      </p>
                    </div>
                  )}
                </div>

                {/* 🧊 Card 3: 3D Model (GLB from Blender) */}
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                        <Box className="w-4 h-4" />
                      </span>
                      <div>
                        <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>٣. المجسم ثلاثي الأبعاد المشترك (3D Model - .glb)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                            .glb / .gltf
                          </span>
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          نفس صيغة الملف القياسية تعمل تلقائياً في <strong className="text-cyan-300">النوعين معاً</strong>: (١) الواقع المعزز فوق صفحة الكتاب، و(٢) العرض التفاعلي باللمس والفأرة.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {currentLesson.model3d?.url && (
                        <button
                          type="button"
                          onClick={() => {
                            handleFieldChange('model3d', undefined);
                            setUploadedModelFileName(null);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-all"
                          title="حذف المجسم ثلاثي الأبعاد من هذا الدرس"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إلغاء المجسم</span>
                        </button>
                      )}

                      <label className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-cyan-600/20 transition-all flex-shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>📁 اختيار ملف .glb من جهازك</span>
                        <input
                          key={`model3d_upload_${currentLesson.targetId}`}
                          type="file"
                          accept=".glb,model/gltf-binary,.gltf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const objectUrl = URL.createObjectURL(file);
                              const cleanName = file.name.replace(/\.[^/.]+$/, '');
                              setUploadedModelFileName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
                              
                              const newModel: LessonModel3D = {
                                url: objectUrl,
                                title: currentLesson.model3d?.title || `مجسم: ${cleanName}`,
                                autoRotate: true
                              };
                              handleFieldChange('model3d', newModel);

                              // حفظ بصيغة Data URL للتخزين المحلي إذا كان الحجم ملائماً
                              if (file.size < 6 * 1024 * 1024) {
                                const reader = new FileReader();
                                reader.onload = (uploadEv) => {
                                  const dataUrl = uploadEv.target?.result as string;
                                  if (dataUrl) {
                                    handleFieldChange('model3d', {
                                      ...newModel,
                                      url: dataUrl
                                    });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* إشعار ذكي يوضح قاعدة عدم تكرار الملف */}
                  <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-500/20 text-sky-200 text-[11px] leading-relaxed flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>قاعدة الاستخدام الموحد والمرن:</strong> امتداد المجسم المعتمد دائماً هو <code className="px-1 py-0.2 bg-black/40 rounded text-cyan-300 font-bold">.glb</code>. عند إضافة المجسم هنا، سيعمل تلقائياً في شاشة الواقع المعزز (AR) فوق الصورة، وكذلك عند النقر على زر التدوير 360° بالإصبع والفأرة دون الحاجة لإدخاله مرتين!
                    </div>
                  </div>

                  {/* نماذج سريعة للتجربة الفورية بنقرة واحدة */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-300">
                    <span className="text-[11px] text-slate-400">نماذج جاهزة للتجربة السريعة:</span>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('model3d', {
                          url: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
                          title: 'رائد فضاء (نموذج تجريبي)',
                          autoRotate: true
                        });
                        setUploadedModelFileName(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                    >
                      🚀 رائد الفضاء (Astronaut.glb)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange('model3d', {
                          url: 'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
                          title: 'مجسم تعليمي تجريبي',
                          autoRotate: true
                        });
                        setUploadedModelFileName(null);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                    >
                      👨‍🚀 مجسم بديل تجريبي
                    </button>
                  </div>

                  {/* Uploaded File Feedback Pill */}
                  {uploadedModelFileName && (
                    <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-cyan-200">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="font-bold">تم اختيار وتحميل الملف بنجاح:</span>
                        <code className="px-1.5 py-0.5 rounded bg-black/40 text-cyan-300 font-mono text-[11px]">
                          {uploadedModelFileName}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const baseName = uploadedModelFileName.split(' ')[0] || 'model.glb';
                          handleFieldChange('model3d', {
                            url: `/models/${baseName}`,
                            title: currentLesson.model3d?.title || `مجسم: ${currentLesson.title}`,
                            autoRotate: currentLesson.model3d?.autoRotate !== false
                          });
                        }}
                        className="px-2 py-1 rounded-md bg-cyan-800/80 hover:bg-cyan-700 text-cyan-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        title="ضبط المسار لمطابقة رفع الملف إلى مجلد public/models في GitHub"
                      >
                        استخدام المسار القياسي للنشر: /models/{uploadedModelFileName.split(' ')[0] || 'model.glb'}
                      </button>
                    </div>
                  )}

                  {/* Input Fields */}
                  <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300">
                          رابط أو مسار ملف المجسم المشترك (3D Model URL .glb):
                        </label>
                        <span className="text-[10px] text-cyan-400 font-medium">📁 الأفضل حفظه في public/models/</span>
                      </div>
                      <input
                        type="text"
                        value={currentLesson.model3d?.url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val.trim() === '') {
                            handleFieldChange('model3d', undefined);
                          } else {
                            handleFieldChange('model3d', {
                              url: val,
                              title: currentLesson.model3d?.title || `مجسم: ${currentLesson.title}`,
                              autoRotate: currentLesson.model3d?.autoRotate !== false
                            });
                          }
                        }}
                        placeholder="مثال: /models/calligraphy_word.glb أو رابط مباشر ينتهي بـ .glb"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                      />
                      <p className="text-[10px] text-slate-400">
                        مستودع GitHub يوفر 1 جيجابايت مجاناً تتسع لـ 500-800 مجسم خفيف. ضع الملف في مجلد <code className="text-cyan-300">public/models/</code> واكتب مساره هنا.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-0.5">
                        <label className="text-[11px] font-bold text-slate-300">
                          عنوان المجسم المعروض للطالب:
                        </label>
                        <input
                          type="text"
                          value={currentLesson.model3d?.title || ''}
                          onChange={(e) => {
                            if (currentLesson.model3d) {
                              handleFieldChange('model3d', {
                                ...currentLesson.model3d,
                                title: e.target.value
                              });
                            }
                          }}
                          placeholder="مثال: مجسم خط الرقعة ثلاثي الأبعاد"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center justify-between sm:justify-start gap-3 pt-4 sm:pt-4 px-1">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={currentLesson.model3d?.autoRotate !== false}
                            onChange={(e) => {
                              if (currentLesson.model3d) {
                                handleFieldChange('model3d', {
                                  ...currentLesson.model3d,
                                  autoRotate: e.target.checked
                                });
                              }
                            }}
                            className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span>تدوير تلقائي انسيابي (Auto-Rotate)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* ⚡ خيار مخصص ذكي: تخصيص مجسم مختلف للواقع المعزز AR فقط (اختياري) */}
                  <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-500/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">
                          تخصيص مجسم خاص بتتبع الواقع المعزز (AR Model) فقط (اختياري):
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowCustomARModelOverride(prev => !prev)}
                        className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        {showCustomARModelOverride || currentLesson.arModel3d?.url
                          ? 'إخفاء الإعداد المتقدم'
                          : '+ تخصيص مجسم مختلف للـ AR'}
                      </button>
                    </div>

                    {(showCustomARModelOverride || currentLesson.arModel3d?.url) && (
                      <div className="space-y-2 pt-1 border-t border-slate-800 animate-fadeIn">
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          📌 <strong>ملاحظة مرنة:</strong> إذا تركت هذا الحقل فارغاً، سيعتمد نظام الواقع المعزز تلقائياً على المجسم الرئيسي أعلاه بدون تكرار! استخدم هذا الحقل فقط إذا أردت إظهار مجسم مختلف كلياً فوق صورة الكتاب.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="text"
                            value={currentLesson.arModel3d?.url || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.trim() === '') {
                                handleFieldChange('arModel3d', undefined);
                              } else {
                                handleFieldChange('arModel3d', {
                                  url: val,
                                  title: currentLesson.arModel3d?.title || `مجسم AR: ${currentLesson.title}`,
                                  autoRotate: currentLesson.arModel3d?.autoRotate !== false
                                });
                              }
                            }}
                            placeholder="مسار أو رابط مجسم AR مخصص (.glb) - أو اتركه فارغاً"
                            className="flex-1 w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                          />

                          <label className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 border border-cyan-500/30 flex-shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع .glb خاص بـ AR</span>
                            <input
                              type="file"
                              accept=".glb,model/gltf-binary,.gltf"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const objectUrl = URL.createObjectURL(file);
                                  const cleanName = file.name.replace(/\.[^/.]+$/, '');
                                  setUploadedARModelFileName(`${file.name} (${Math.round(file.size / 1024)} KB)`);
                                  
                                  const newARModel: LessonModel3D = {
                                    url: objectUrl,
                                    title: `مجسم AR: ${cleanName}`,
                                    autoRotate: false
                                  };
                                  handleFieldChange('arModel3d', newARModel);

                                  if (file.size < 6 * 1024 * 1024) {
                                    const reader = new FileReader();
                                    reader.onload = (uploadEv) => {
                                      const dataUrl = uploadEv.target?.result as string;
                                      if (dataUrl) {
                                        handleFieldChange('arModel3d', {
                                          ...newARModel,
                                          url: dataUrl
                                        });
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {currentLesson.arModel3d?.url && (
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('arModel3d', undefined);
                                setUploadedARModelFileName(null);
                              }}
                              className="px-2 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs cursor-pointer"
                              title="إلغاء التخصيص والعودة للمجسم الرئيسي المشترك"
                            >
                              إلغاء والعودة للمشترك
                            </button>
                          )}
                        </div>

                        {uploadedARModelFileName && (
                          <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>تم رفع مجسم AR مخصص: {uploadedARModelFileName}</span>
                          </div>
                        )}

                        {currentLesson.arModel3d?.url && (
                          <div className="pt-1 flex items-center gap-2">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={currentLesson.arModel3d.autoRotate === true}
                                onChange={(e) => {
                                  if (currentLesson.arModel3d) {
                                    handleFieldChange('arModel3d', {
                                      ...currentLesson.arModel3d,
                                      autoRotate: e.target.checked
                                    });
                                  }
                                }}
                                className="rounded border-slate-700 text-cyan-600 focus:ring-cyan-500"
                              />
                              <span>تدوير تلقائي للمجسم في الـ AR (أو اتركه بدون تفعيل ليبقى ثابتاً تماماً فوق صفحة الكتاب)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 🎵 صوت المجسم التلقائي (3D Model Sound Effect) */}
                  <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                          <Music className="w-4 h-4" />
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>صوت المجسم التلقائي (3D Model Sound)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold">
                              ينطلق فور ظهور المجسم
                            </span>
                          </h5>
                          <p className="text-[11px] text-slate-300">
                            صوت أو مؤثر خاص بالمجسم يعمل تلقائياً وبشكل فوري بمجرد توجيه الكاميرا إلى صفحة الكتاب.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {currentLesson.model3d?.soundUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateModelSound('', false);
                              if (isPlayingTestAudio && testAudioRef.current) {
                                testAudioRef.current.pause();
                                setIsPlayingTestAudio(false);
                              }
                              setAudioUploadFileName(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs font-semibold cursor-pointer inline-flex items-center gap-1 transition-all"
                            title="إلغاء صوت المجسم"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>إلغاء الصوت</span>
                          </button>
                        )}

                        <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all flex-shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>📁 رفع ملف صوتي (.mp3 / .wav)</span>
                          <input
                            key={`sound_upload_${currentLesson.targetId}`}
                            type="file"
                            accept="audio/*,.mp3,.wav,.ogg,.m4a"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const cleanName = file.name;
                                setAudioUploadFileName(`${cleanName} (${Math.round(file.size / 1024)} KB)`);

                                const reader = new FileReader();
                                reader.onload = (uploadEv) => {
                                  const dataUrl = uploadEv.target?.result as string;
                                  if (dataUrl) {
                                    handleUpdateModelSound(dataUrl, true);
                                    setModelSoundNotice(`✓ تم رفع وتفعيل ملف الصوت: ${cleanName}`);
                                    setTimeout(() => setModelSoundNotice(null), 3500);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* حقل الرابط واختبار الصوت */}
                    <div className="space-y-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-300">
                            رابط ملف الصوت (Google Drive أو رابط مباشر MP3/OGG/WAV):
                          </label>
                          {currentLesson.model3d?.soundUrl && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>الصوت مخصص لهذا الدرس</span>
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 items-center">
                          <input
                            type="text"
                            value={currentLesson.model3d?.soundUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateModelSound(val, val.trim() !== '');
                            }}
                            placeholder="الصق رابط صوت قوقل درايف أو رابط مباشر (مثال: https://.../sound.mp3)"
                            className="flex-1 w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-purple-500"
                          />

                          {currentLesson.model3d?.soundUrl && (
                            <button
                              type="button"
                              onClick={() => toggleTestAudio(currentLesson.model3d?.soundUrl)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer flex-shrink-0 ${
                                isPlayingTestAudio
                                  ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                              }`}
                              title={isPlayingTestAudio ? 'إيقاف التجربة' : 'استماع للصوت الآن'}
                            >
                              {isPlayingTestAudio ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span>⏸ إيقاف الصوت</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span>▶ استماع وتجربة</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* شريط تفعيل/كتم الصوت التلقائي */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={currentLesson.model3d?.soundEnabled !== false}
                            onChange={(e) => {
                              handleUpdateModelSound(undefined, e.target.checked);
                            }}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="font-semibold">
                            تفعيل انطلاق الصوت تلقائياً مع ظهور المجسم ثلاثي الأبعاد في الكاميرا
                          </span>
                        </label>
                      </div>

                      {/* نماذج مؤثرات صوتية سريعة بنقرة واحدة */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5 text-xs text-slate-300">
                        <span className="text-[10px] text-slate-400">أصوات جاهزة للتجربة السريعة:</span>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateModelSound('https://actions.google.com/sounds/v1/science_fiction/space_atmosphere.ogg', true);
                            setAudioUploadFileName(null);
                            setModelSoundNotice('✓ تم تعيين مؤثر الغلاف الجوي والفضاء للمجسم');
                            setTimeout(() => setModelSoundNotice(null), 3000);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-purple-300 text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                        >
                          🪐 مؤثر فضاء وكواكب
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateModelSound('https://actions.google.com/sounds/v1/science_fiction/teleport.ogg', true);
                            setAudioUploadFileName(null);
                            setModelSoundNotice('✓ تم تعيين نغمة الهولوجرام التقنية للمجسم');
                            setTimeout(() => setModelSoundNotice(null), 3000);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                        >
                          ⚡ نغمة هولوجرام تقنية
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateModelSound('https://actions.google.com/sounds/v1/nature/wind_blowing_through_trees.ogg', true);
                            setAudioUploadFileName(null);
                            setModelSoundNotice('✓ تم تعيين مؤثر بيئي طبيعي للمجسم');
                            setTimeout(() => setModelSoundNotice(null), 3000);
                          }}
                          className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-semibold border border-slate-700 cursor-pointer transition-colors"
                        >
                          🌿 مؤثر بيئي طبيعي
                        </button>
                      </div>

                      {modelSoundNotice && (
                        <p className="text-[11px] text-emerald-400 font-medium bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          {modelSoundNotice}
                        </p>
                      )}

                      {audioUploadFileName && (
                        <div className="text-[10px] text-purple-300 font-semibold flex items-center gap-1.5 pt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                          <span>الملف المرفوع: {audioUploadFileName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3D Interactive Live Preview Window */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>معاينة حية للمجسم (3D Preview) - جرّب التدوير بالفأرة أو اللمس:</span>
                      </span>
                      {getActiveLessonModel(currentLesson, true)?.url && (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          ✓ جاهز للنوعين (AR فوق الورقة و 360° باللمس)
                        </span>
                      )}
                    </div>

                    {getActiveLessonModel(currentLesson, true)?.url ? (
                      <Model3DViewer
                        src={getActiveLessonModel(currentLesson, true)!.url}
                        title={getActiveLessonModel(currentLesson, true)!.title || currentLesson.title}
                        height="260px"
                        autoRotate={getActiveLessonModel(currentLesson, true)!.autoRotate !== false}
                        interactive={true}
                      />
                    ) : (
                      <div className="h-44 rounded-2xl bg-slate-950/80 border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                        <Box className="w-8 h-8 text-slate-600 animate-pulse" />
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-300">
                            لا يوجد مجسم 3D مرتبط بهذا الدرس حالياً
                          </p>
                          <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                            اضغط <strong>[ 📁 اختيار ملف .glb من جهازك ]</strong> أو اختر أحد النماذج الجاهزة أعلاه لتظهر لك المعاينة الحية فوراً هنا وتتحقق من شكله قبل الحفظ.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons for Lessons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* 1. حفظ في المتصفح */}
                    <button
                      type="button"
                      onClick={handleSaveLessonChanges}
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95"
                      title="حفظ التعديلات في ذاكرة هذا المتصفح للمعاينة الفورية على هذا الجهاز"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ التعديلات (لهذا الجهاز)</span>
                    </button>

                    {/* 2. تنزيل content.json للنشر على Vercel و GitHub */}
                    <button
                      type="button"
                      onClick={handleDownloadContentJson}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95"
                      title="تنزيل ملف content.json لوضعه في public/data/content.json في GitHub ليظهر على هواتف جميع الطلاب"
                    >
                      <Download className="w-4 h-4" />
                      <span>💾 تنزيل content.json لـ GitHub</span>
                    </button>

                    {/* زر نسخ كود TypeScript لتحديث lessons.ts في المستودع مباشرة */}
                    <button
                      type="button"
                      onClick={handleCopyLessonsTsCode}
                      className="px-3.5 py-2 rounded-xl bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                      title="نسخ كود TypeScript لتحديث ملف src/data/lessons.ts في المستودع حتى تظهر الدروس للجميع بعد النشر"
                    >
                      {copiedLessonsTs ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-300" />}
                      <span>{copiedLessonsTs ? '✓ تم نسخ الكود!' : '📋 نسخ كود lessons.ts للمستودع'}</span>
                    </button>

                    {/* 3. استيراد ملف content.json من الجهاز */}
                    <label className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border border-slate-700 active:scale-95">
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span>📁 استيراد content.json من جهازك</span>
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={handleImportContentJson}
                      />
                    </label>

                    {/* 4. جلب وتحديث من السيرفر Vercel */}
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setStatusNotice({ type: 'info', text: 'جاري الاتصال بسيرفر Vercel وجلب أحدث ملف content.json...' });
                          const fresh = await fetchLessons(true);
                          if (fresh && fresh.length > 0) {
                            setEditableLessons(fresh);
                            if (onUpdateLessons) onUpdateLessons(fresh);
                            saveStoredLessons(fresh);
                            setHasLocalDrafts(false);
                            setSelectedLessonIndex(0);
                            setStatusNotice({
                              type: 'success',
                              text: `✓ تم جلب الدروس بنجاح من سيرفر Vercel (${fresh.length} دروس)! تظهر الآن أحدث نسخة منشورة على GitHub.`
                            });
                            setSaveSuccess(true);
                            setTimeout(() => setSaveSuccess(false), 6000);
                          } else {
                            setStatusNotice({
                              type: 'error',
                              text: '⚠️ لم يتم العثور على دروس في السيرفر أو أن الملف فارغ. تأكد من نشر الملف على GitHub و Vercel.'
                            });
                          }
                        } catch (err: any) {
                          console.warn('خطأ أثناء جلب الملف:', err);
                          setStatusNotice({
                            type: 'error',
                            text: `⚠️ خطأ في الاتصال بسيرفر Vercel: ${err?.message || 'تأكد من الاتصال بالإنترنت'}`
                          });
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-sky-300 text-xs transition-colors cursor-pointer flex items-center gap-1.5 border border-sky-500/30 active:scale-95"
                      title="جلب وتحديث الدروس من ملف content.json المرفوع على سيرفر Vercel ومسح الكاش"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>🔄 مزامنة من سيرفر Vercel</span>
                    </button>
                  </div>

                  {saveSuccess && (
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-fadeIn self-end sm:self-auto">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تم الحفظ والمزامنة بنجاح!</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Project Export & MindAR Publishing Hub */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Download className="w-5 h-5" />
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      دليل نشر وتحديث ملفات المشروع لـ Vercel
                    </h4>
                    <p className="text-xs text-slate-400">
                      خطوتان سهلتان لتفعيل تحديثات الدروس وقراءة الكاميرا لجميع الطلاب في التطبيق
                    </p>
                  </div>
                </div>
              </div>

              {/* 🎯 Visual Sequence Mapping Table for MindAR */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                      <Layers className="w-4 h-4" />
                    </span>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-white">
                        🎯 جدول الترتيب الإلزامي لصور صفحات الكتاب في موقع MindAR
                      </h5>
                      <p className="text-[11px] text-slate-300">
                        يجب سحب الصور في موقع MindAR بنفس هذا الترتيب تماماً لضمان قراءة الدرس الصحيح:
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
                    إجمالي الدروس: {editableLessons.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {buildMultiTargetMap(editableLessons).entries.map((entry) => (
                    <div 
                      key={`entry_${entry.globalTargetIndex}_${entry.lessonId}`} 
                      className={`p-2.5 rounded-lg border flex items-center gap-2.5 ${
                        entry.isPrimary ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/70 border-indigo-500/30'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                        {entry.imageUrl ? (
                          <img src={normalizeImageUrl(entry.imageUrl)} alt={entry.pageLabel} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-slate-500 text-center">لا توجد صورة</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px] font-bold">
                            ترتيب #{entry.globalTargetIndex + 1}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            (Target {entry.globalTargetIndex})
                          </span>
                          {!entry.isPrimary && (
                            <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 text-[9px]">
                              صفحة إضافية
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-white truncate mt-1">
                          {entry.pageLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Step 1: content.json */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400">الملف الأساسي (محتوى الدروس)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                        content.json
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white">تصدير ملف بيانات ومحتوى الدروس</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      يحفظ عناوين كل الدروس، وروابط فيديوهات اليوتيوب، والتسجيل الصوتي، وروابط صور الشرح ومعرض الدرس، وأسماء المجسمات وأسئلة الاختبار.
                    </p>
                    <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-200 leading-relaxed">
                      💡 <strong>لتحديث الجوال والتابلت:</strong> نزّل هذا الملف وضعه في <code className="text-emerald-300 font-bold font-mono">public/data/content.json</code> ثم ارفعه لمستودعك على GitHub لينشر تلقائياً لـ Vercel.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadContentJson}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>💾 تنزيل ملف content.json الآن</span>
                  </button>
                </div>

                {/* Step 2: MindAR Official Tool */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-500/30 flex flex-col justify-between space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-sky-400">ملف الكاميرا فقط (اختياري)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                        targets.mind
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-white">بصمات تعرّف الكاميرا البصرية</h5>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      هذا الملف خاص بكاميرا الهاتف للتعرف على الورقة المطبوعة. <strong>لا تحتاجه</strong> إذا كنت فقط تعدل الروابط أو الصور الإضافية أو المجسمات؛ تحتاجه فقط إذا غيرت صورة صفحة الكتاب المطبوعة ذاتها.
                    </p>
                    <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 text-[11px] text-sky-200 leading-relaxed">
                      📁 مسار الحفظ إذا استخرجته: <code className="text-sky-300 font-bold font-mono">public/targets/targets.mind</code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadFixedTargetsMind}
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-700/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-center"
                    >
                      <Download className="w-4 h-4" />
                      <span>⚡ تنزيل ملف targets.mind للكاميرا</span>
                    </button>
                    <a
                      href="https://hiukim.github.io/mind-ar-js-doc/tools/compile"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 font-medium text-xs flex items-center justify-center gap-2 cursor-pointer transition-all text-center border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>أداة MindAR الرسمية (لإعادة التجميع يدوياً) ↗</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Solved diagnosis banner */}
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>حل مشكلة الترتيب (الصورة 1 تظهر درس 2، والصورة 2 تظهر درس 3، والصورة 3 لا تعمل):</span>
                </div>
                <p className="text-emerald-100/90 leading-relaxed text-[11px]">
                  <strong>سبب المشكلة:</strong> ملف <code className="text-emerald-300">targets.mind</code> القديم في المستودع كان يحتوي على <strong>4 أهداف</strong> (حيث تم رفع صورة فارغة أو غلاف كهدف رقم 0 أولاً)، مما أدى لترحيل كتاب الرقعة للهدف 1 (الدرس الثاني)، وكتاب الديواني للهدف 2 (الدرس الثالث)، وكتاب النسخ للهدف 3 (غير موجود في قائمة الدروس).
                </p>
                <div className="p-2 rounded-lg bg-black/40 border border-emerald-500/20 text-[11px] text-emerald-200">
                  ✅ <strong>الحل:</strong> حمّل ملف <strong>targets.mind</strong> المصحح بالزر أعلاه وضعه في <code className="text-emerald-300">public/targets/targets.mind</code> بمستودع GitHub لديك، وسيعمل كل درس مع صورته الصحيحة بنسبة 100%!
                </div>
              </div>

              {/* Tips for Best Image Quality & 3D / GIF notice */}
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-200">إرشادات مفيدة لجودة الصور والمحتوى:</span>
                  <p className="text-[11px] leading-relaxed">
                    الدقة المثالية لصور صفحات الكتاب بين 600px و 1200px (JPG/PNG). وتدعم بطاقة الشرح الصور المتحركة (GIF) لشرح التجارب العلمية التفاعلية!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Google Sheets Analytics */}
        {activeTab === 'sheets' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            {/* Configuration Form */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>رابط نشر Google Apps Script Web App (API URL)</span>
                </h4>
                <button
                  type="button"
                  onClick={copyCodeSample}
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedCode ? 'تم نسخ كود السكريبت' : 'نسخ كود Apps Script'}
                </button>
              </div>

              <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
                >
                  حفظ الرابط
                </button>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={isTesting}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse' : ''}`} />
                  <span>{isTesting ? 'جارٍ الإرسال...' : 'إرسال حدث تجريبي'}</span>
                </button>
              </form>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.includes('✓') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                }`}>
                  {testResult.includes('✓') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult}</span>
                </div>
              )}
            </div>

            {/* Live Logs Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>سجل الأحداث المباشر في الجلسة الحالية</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-400">
                    {logs.length} حدث
                  </span>
                </h4>
                {logs.length > 0 && (
                  <button
                    onClick={() => analytics.clearLogs()}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-slate-950 border border-slate-800/80 text-slate-500 text-xs">
                  لا توجد أحداث مسجلة بعد. وجّه الكاميرا إلى أي بطاقة درس ليتم تسجيل التعرف تلقائياً.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-2.5">الوقت</th>
                          <th className="p-2.5">الدرس</th>
                          <th className="p-2.5">الحدث</th>
                          <th className="p-2.5">الحالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {logs.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="p-2.5 text-slate-400 font-mono text-[11px]">
                              {new Date(item.timestamp).toLocaleTimeString('ar-EG')}
                            </td>
                            <td className="p-2.5 font-bold text-white">{item.lesson_title}</td>
                            <td className="p-2.5">
                              <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-400 border border-sky-800/50 text-[10px]">
                                {item.action}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`inline-flex items-center gap-1 text-[10px] ${
                                item.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'
                              }`}>
                                {item.status === 'sent' ? '✓ تم الإرسال للجدول' : 'قيد الانتظار'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              فتح Google Sheets جديد
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="https://hiukim.github.io/mind-ar-js-doc/tools/compile"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              أداة MindAR Compiler الرسمية على الويب
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>

        {/* In-app custom confirmation modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          confirmText={confirmModal.confirmText}
          cancelText={confirmModal.cancelText}
          isDestructive={confirmModal.isDestructive}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    </div>
  );
};
