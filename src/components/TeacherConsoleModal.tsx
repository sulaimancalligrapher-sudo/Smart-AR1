import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Database, Send, Trash2, CheckCircle2, AlertCircle, Copy, Check, 
  FileSpreadsheet, ExternalLink, BookOpen, Edit3, Image, Video, Music, 
  HelpCircle, Brain, Save, Download, Sparkles, Layers, Upload, Plus, AlertTriangle, Camera, Box,
  Volume2, VolumeX, Play, Pause, Disc, ChevronUp, ChevronDown, ArrowUp, ArrowDown,
  Lock, Unlock, CheckSquare, MessageSquare, UserCheck, RefreshCw, FileText, ListFilter, Award, User,
  DownloadCloud, UploadCloud, Loader2, Smartphone, Tablet, Monitor, Search, Eye, Globe
} from 'lucide-react';
import { analytics, DEFAULT_SHEETS_WEB_APP_URL } from '../services/analytics';
import {
  AnalyticsLogItem,
  LessonData,
  LessonModel3D,
  LessonImage,
  LessonVideo,
  LessonAudio,
  LessonQuestion,
  QuestionType,
  StudentSubmission,
  SystemAnswerRecord,
  getActiveLessonModel,
  getLessonVideos,
  getLessonAudios,
  getLessonQuestions,
  normalizeVideoData,
  normalizeAudioData,
  resolveAssetUrl,
  isLessonRestricted
} from '../types/ar';
import { saveStoredLessons, fetchLessons, setHasLocalDrafts } from '../data/lessons';
import { Model3DViewer } from './Model3DViewer';
import { normalizeImageUrl, normalizeAudioUrl, getAlternativeImageUrls } from '../services/urlHelpers';
import { buildMultiTargetMap } from '../services/targetCompiler';
import { optimizeImageFile } from '../services/imageOptimizer';
import { ConfirmModal } from './ConfirmModal';
import { getStoredSubmissions, clearAllSubmissions, recordStudentSubmission, getStoredSystemAnswers } from '../services/studentSubmissions';
import { LessonQuestionsEditor } from './LessonQuestionsEditor';
import { getSubscriptionExternalUrl, setSubscriptionExternalUrl } from '../services/subscriptionAuth';
import { fetchQuestionsFromSheet, exportQuestionsToSheet, fetchAnswersFromSheet } from '../services/sheetsQuestionsSync';
import { SystemAnswersModal } from './SystemAnswersModal';
import { getCameraShowTargetCards, setCameraShowTargetCards } from '../services/adminAuth';
import { TranslationManagerView } from './TranslationManagerView';
import { AppLanguage, getStoredLanguage, saveStoredLanguage } from '../services/translationService';

interface TeacherConsoleModalProps {
  lessons?: LessonData[];
  onUpdateLessons?: (lessons: LessonData[]) => void;
  onPurgeAllData?: () => void;
  onClose: () => void;
  currentLanguage?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
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
  onClose,
  currentLanguage: initialLang,
  onLanguageChange
}) => {
  const [activeTab, setActiveTab] = useState<'lessons' | 'sheets' | 'translations'>('lessons');
  const [currentLang, setCurrentLang] = useState<AppLanguage>(() => initialLang || getStoredLanguage());

  const handleLangChange = (newLang: AppLanguage) => {
    setCurrentLang(newLang);
    saveStoredLanguage(newLang);
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  };

  const [webAppUrl, setWebAppUrl] = useState(analytics.getWebAppUrl());

  const [logs, setLogs] = useState<AnalyticsLogItem[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string>(() => getSubscriptionExternalUrl());
  const [subscriptionUrlSaved, setSubscriptionUrlSaved] = useState<boolean>(false);
  const [isAnswersModalOpen, setIsAnswersModalOpen] = useState<boolean>(false);
  const [systemAnswers, setSystemAnswers] = useState<SystemAnswerRecord[]>(() => getStoredSystemAnswers());
  const [isFetchingSubmissions, setIsFetchingSubmissions] = useState<boolean>(false);
  const [submissionsSearch, setSubmissionsSearch] = useState<string>('');
  const [answersSyncNotice, setAnswersSyncNotice] = useState<string | null>(null);

  // تحديث قائمة إجابات النظام من الشيت
  const handleFetchAnswersInConsole = async () => {
    setIsFetchingSubmissions(true);
    setAnswersSyncNotice(null);
    try {
      const res = await fetchAnswersFromSheet(webAppUrl);
      if (res.success && res.records) {
        setSystemAnswers(res.records);
        setAnswersSyncNotice(`✓ تم جلب وتحديث ${res.records.length} سجل بنجاح من ورقة Answers-AR!`);
      } else {
        setAnswersSyncNotice(res.message);
      }
    } catch (e: any) {
      setAnswersSyncNotice(`تعذر جلب السجلات: ${e?.message || 'تأكد من الاتصال'}`);
    } finally {
      setIsFetchingSubmissions(false);
      setTimeout(() => setAnswersSyncNotice(null), 5000);
    }
  };

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

  // 5 Horizontal Tabs within Lesson Editor: بيانات -> وسائط -> مجسمات -> أسئلة -> إجابات الطلاب
  const [lessonSubTab, setLessonSubTab] = useState<'general' | 'media' | 'model3d' | 'questions' | 'submissions'>('general');
  // Target cards visibility toggle in Camera
  const [cameraShowTargetCards, setCameraShowTargetCardsState] = useState<boolean>(() => getCameraShowTargetCards());

  const handleToggleCameraTargetCards = () => {
    const next = !cameraShowTargetCards;
    setCameraShowTargetCardsState(next);
    setCameraShowTargetCards(next);
  };


  // Question Form State
  const [newQType, setNewQType] = useState<QuestionType>('multiple_choice');
  const [newQText, setNewQText] = useState<string>('');
  const [newQOptions, setNewQOptions] = useState<string[]>(['', '', '', '']);
  const [newQCorrectIndex, setNewQCorrectIndex] = useState<number>(0);
  const [newQCorrectAnswerText, setNewQCorrectAnswerText] = useState<string>('');
  const [newQExplanation, setNewQExplanation] = useState<string>('');
  const [newQPoints, setNewQPoints] = useState<number>(1);
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);

  // Student Submissions State
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => getStoredSubmissions());
  const [submissionFilterLesson, setSubmissionFilterLesson] = useState<string>('all');
  const [showMindARDetails, setShowMindARDetails] = useState<boolean>(false);
  const [showPublishingGuide, setShowPublishingGuide] = useState<boolean>(false);
  const [showSequenceTable, setShowSequenceTable] = useState<boolean>(false);
  const [selectedSequenceTargetIndex, setSelectedSequenceTargetIndex] = useState<number>(0);

  // Google Sheets Questions & Answers Sync State
  const [isSheetsQuestionsSyncing, setIsSheetsQuestionsSyncing] = useState<boolean>(false);
  const [sheetQuestionsNotice, setSheetQuestionsNotice] = useState<string | null>(null);

  const handleImportQuestionsFromSheet = async () => {
    setIsSheetsQuestionsSyncing(true);
    setSheetQuestionsNotice(null);
    try {
      const res = await fetchQuestionsFromSheet(editableLessons, webAppUrl);
      if (res.success && res.lessonsWithQuestions) {
        setEditableLessons(res.lessonsWithQuestions);
        if (onUpdateLessons) onUpdateLessons(res.lessonsWithQuestions);
        saveStoredLessons(res.lessonsWithQuestions);
        setSheetQuestionsNotice(res.message);
      } else {
        setSheetQuestionsNotice(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setSheetQuestionsNotice(`⚠️ خطأ في الاستيراد: ${err?.message || err}`);
    } finally {
      setIsSheetsQuestionsSyncing(false);
      setTimeout(() => setSheetQuestionsNotice(null), 5000);
    }
  };

  const handleExportQuestionsToSheet = async () => {
    setIsSheetsQuestionsSyncing(true);
    setSheetQuestionsNotice(null);
    try {
      const res = await exportQuestionsToSheet(editableLessons, webAppUrl);
      if (res.success) {
        setSheetQuestionsNotice(res.message);
      } else {
        setSheetQuestionsNotice(`⚠️ ${res.message}`);
      }
    } catch (err: any) {
      setSheetQuestionsNotice(`⚠️ خطأ في التصدير: ${err?.message || err}`);
    } finally {
      setIsSheetsQuestionsSyncing(false);
      setTimeout(() => setSheetQuestionsNotice(null), 5000);
    }
  };

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
      } else if (field === 'isFreePreview') {
        cur.isFreePreview = Boolean(value);
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
      isFreePreview: newIndex === 0 ? true : false,
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

  // Question Management Handlers
  const handleAddQuestion = () => {
    if (!newQText.trim()) {
      setQuestionNotice('⚠️ يرجى كتابة نص السؤال أولاً');
      return;
    }
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;

    const currentQuestions = getLessonQuestions(curLesson);
    const qId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    let questionObj: LessonQuestion;
    if (newQType === 'multiple_choice') {
      const validOptions = newQOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setQuestionNotice('⚠️ يرجى إدخال خيارين على الأقل لسؤال الاختيار من متعدد');
        return;
      }
      const safeCorrectIndex = Math.min(newQCorrectIndex, validOptions.length - 1);
      questionObj = {
        id: qId,
        type: 'multiple_choice',
        question: newQText.trim(),
        options: validOptions,
        correctIndex: safeCorrectIndex,
        explanation: newQExplanation.trim() || undefined,
        points: Number(newQPoints) || 1
      };
    } else {
      if (!newQCorrectAnswerText.trim()) {
        setQuestionNotice('⚠️ يرجى كتابة الإجابة النموذجية أو الكلمات المفتاحية للسؤال النصي');
        return;
      }
      questionObj = {
        id: qId,
        type: 'text_answer',
        question: newQText.trim(),
        correctAnswerText: newQCorrectAnswerText.trim(),
        explanation: newQExplanation.trim() || undefined,
        points: Number(newQPoints) || 1
      };
    }

    const updatedQuestions = [...currentQuestions, questionObj];
    const nextLessons = [...editableLessons];
    const cur = { ...curLesson, questions: updatedQuestions };
    if (updatedQuestions[0]?.type === 'multiple_choice') {
      cur.description = {
        ...cur.description,
        quiz: {
          question: updatedQuestions[0].question,
          options: updatedQuestions[0].options || [],
          correctIndex: updatedQuestions[0].correctIndex ?? 0,
          explanation: updatedQuestions[0].explanation || ''
        }
      };
    }
    nextLessons[selectedLessonIndex] = cur;
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);

    setNewQText('');
    setNewQOptions(['', '', '', '']);
    setNewQCorrectIndex(0);
    setNewQCorrectAnswerText('');
    setNewQExplanation('');
    setNewQPoints(1);
    setQuestionNotice('✓ تمت إضافة السؤال بنجاح إلى بنك أسئلة الدرس!');
    setTimeout(() => setQuestionNotice(null), 3500);
  };

  const handleDeleteQuestion = (qIdx: number) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentQuestions = getLessonQuestions(curLesson);
    const targetQ = currentQuestions[qIdx];
    const qTitle = targetQ?.question || `السؤال رقم ${qIdx + 1}`;

    setConfirmModal({
      isOpen: true,
      title: 'تأكيد حذف السؤال',
      message: `هل أنت متأكد من حذف السؤال "${qTitle.length > 50 ? qTitle.slice(0, 50) + '...' : qTitle}" من هذا الدرس؟`,
      confirmText: 'نعم، حذف السؤال',
      isDestructive: true,
      onConfirm: () => {
        const updated = currentQuestions.filter((_, i) => i !== qIdx);
        const nextLessons = [...editableLessons];
        const cur = { ...curLesson, questions: updated };
        if (updated.length > 0 && updated[0]?.type === 'multiple_choice') {
          cur.description = {
            ...cur.description,
            quiz: {
              question: updated[0].question,
              options: updated[0].options || [],
              correctIndex: updated[0].correctIndex ?? 0,
              explanation: updated[0].explanation || ''
            }
          };
        } else if (updated.length === 0 && cur.description) {
          cur.description = { ...cur.description, quiz: undefined };
        }
        nextLessons[selectedLessonIndex] = cur;
        setEditableLessons(nextLessons);
        if (onUpdateLessons) onUpdateLessons(nextLessons);
        saveStoredLessons(nextLessons);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setQuestionNotice('✓ تم حذف السؤال بنجاح!');
        setTimeout(() => setQuestionNotice(null), 3000);
      }
    });
  };

  const handleMoveQuestion = (qIdx: number, direction: 'up' | 'down') => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentQuestions = [...getLessonQuestions(curLesson)];
    const targetIdx = direction === 'up' ? qIdx - 1 : qIdx + 1;
    if (targetIdx < 0 || targetIdx >= currentQuestions.length) return;

    const temp = currentQuestions[qIdx];
    currentQuestions[qIdx] = currentQuestions[targetIdx];
    currentQuestions[targetIdx] = temp;

    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      questions: currentQuestions
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);
  };

  const handleUpdateQuestion = (qIdx: number, patch: Partial<LessonQuestion>) => {
    const curLesson = editableLessons[selectedLessonIndex];
    if (!curLesson) return;
    const currentQuestions = [...getLessonQuestions(curLesson)];
    if (!currentQuestions[qIdx]) return;

    currentQuestions[qIdx] = {
      ...currentQuestions[qIdx],
      ...patch
    };

    const nextLessons = [...editableLessons];
    nextLessons[selectedLessonIndex] = {
      ...curLesson,
      questions: currentQuestions
    };
    setEditableLessons(nextLessons);
    if (onUpdateLessons) onUpdateLessons(nextLessons);
    saveStoredLessons(nextLessons);
  };

  const handleRefreshSubmissions = () => {
    setSubmissions(getStoredSubmissions());
    setStatusNotice({ type: 'info', text: 'تم تحديث قائمة إجابات الطلاب.' });
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const handleClearSubmissions = () => {
    setConfirmModal({
      isOpen: true,
      title: 'مسح سجل إجابات الطلاب',
      message: 'هل أنت متأكد من مسح جميع إجابات الطلاب المسجلة في هذا المتصفح؟',
      confirmText: 'نعم، مسح السجل',
      isDestructive: true,
      onConfirm: () => {
        clearAllSubmissions();
        setSubmissions([]);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        setStatusNotice({ type: 'info', text: 'تم إفراغ سجل الإجابات.' });
        setTimeout(() => setStatusNotice(null), 3000);
      }
    });
  };

  const handleAddSampleSubmission = () => {
    const curLesson = editableLessons[selectedLessonIndex];
    recordStudentSubmission({
      studentName: 'أحمد سلطان (طالب تجريبي)',
      studentPhone: '0551234567',
      lessonId: curLesson?.targetId || 'lesson_001',
      lessonTitle: curLesson?.title || 'درس تجريبي',
      questionId: 'q_sample_1',
      questionText: 'سؤال تجريبي لاختبار الربط وحفظ الإجابات في الشيت',
      questionType: 'multiple_choice',
      studentAnswer: 'الإجابة الأولى النموذجية',
      isCorrect: true,
      score: 1
    });
    setSubmissions(getStoredSubmissions());
    setStatusNotice({
      type: 'success',
      text: '✓ تم تسجيل إجابة تجريبية بنجاح وإرسالها تلقائياً إلى Google Sheets!'
    });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  const handleExportSubmissionsCsv = () => {
    if (submissions.length === 0) {
      alert('لا توجد إجابات مسجلة لتصديرها.');
      return;
    }
    const headers = ['اسم الطالب', 'رقم الجوال / المشترك', 'الدرس', 'نوع السؤال', 'نص السؤال', 'إجابة الطالب', 'النتيجة', 'تاريخ ووقت الإرسال'];
    const rows = submissions.map((s) => [
      `"${s.studentName.replace(/"/g, '""')}"`,
      `"${s.studentPhone.replace(/"/g, '""')}"`,
      `"${s.lessonTitle.replace(/"/g, '""')}"`,
      `"${s.questionType === 'multiple_choice' ? 'اختيار من متعدد' : 'إجابة نصية'}"`,
      `"${s.questionText.replace(/"/g, '""')}"`,
      `"${s.studentAnswer.replace(/"/g, '""')}"`,
      `"${s.isCorrect ? 'صحيحة' : 'غير صحيحة'}"`,
      `"${new Date(s.submittedAt).toLocaleString('ar-EG')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `student_answers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const handleCopyLessonsTsCode = () => {
    const { updatedLessons } = buildMultiTargetMap(editableLessons);
    const sanitized = updatedLessons.map((l) => {
      const vList = Array.isArray(l.videos)
        ? l.videos.filter((v) => v && (v.url?.trim() || v.embedUrl?.trim()))
        : (l.video?.url?.trim() ? [l.video] : []);
      const aList = Array.isArray(l.audios)
        ? l.audios.filter((a) => a && a.url?.trim())
        : (l.audio?.url?.trim() ? [l.audio] : []);
      return {
        ...l,
        videos: vList,
        video: vList.length > 0 ? vList[0] : undefined,
        audios: aList,
        audio: aList.length > 0 ? aList[0] : undefined
      };
    });
    const code = `import { LessonData } from '../types/ar';\n\nexport const DEFAULT_LESSONS: LessonData[] = ${JSON.stringify(sanitized, null, 2)};\n`;
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

      // تنظيف كامل للفيديوهات والصوتيات: إذا حُذفت، لا تُصدر بتاتاً لـ content.json
      const validVideos = Array.isArray(l.videos)
        ? l.videos.filter((v) => v && (v.url?.trim() || v.embedUrl?.trim()))
        : (l.video?.url?.trim() ? [l.video] : []);

      const validAudios = Array.isArray(l.audios)
        ? l.audios.filter((a) => a && a.url?.trim())
        : (l.audio?.url?.trim() ? [l.audio] : []);

      return {
        ...l,
        videos: validVideos,
        video: validVideos.length > 0 ? validVideos[0] : undefined,
        audios: validAudios,
        audio: validAudios.length > 0 ? validAudios[0] : undefined,
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
// يدعم:
// 1. ورقة SubData: التحقق من المشتركين والدروس المقيدة
// 2. ورقة Questions-AR: قراءة وتحديث بنك الأسئلة أفقياً لكل درس
// 3. ورقة Answers-AR: حفظ إجابات وتقييمات الطلاب لكل حصة
// 4. ورقة Events: سجل أحداث الكاميرا المباشرة

var SUBSCRIBERS_SHEET = "SubData";
var QUESTIONS_SHEET = "Questions-AR";
var ANSWERS_SHEET = "Answers-AR";
var EVENTS_SHEET = "Events";
var SUBMISSIONS_SHEET = "Submissions";

// 1. معالجة طلبات GET (فحص المشتركين + جلب الأسئلة)
function doGet(e) {
  try {
    var action = (e.parameter && e.parameter.action) ? e.parameter.action : "";
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // أ) التحقق من المشترك في ورقة SubData
    if (action === "verifySubscriber") {
      var phone = (e.parameter.phone || "").toString().trim().replace(/[\\s\\-\\(\\)]/g, "");
      var name = (e.parameter.name || "").toString().trim().toLowerCase();

      var subSheet = ss.getSheetByName(SUBSCRIBERS_SHEET);
      if (!subSheet) {
        subSheet = ss.insertSheet(SUBSCRIBERS_SHEET);
        subSheet.appendRow(["رقم المشترك / الجوال", "اسم المشترك"]);
        return createJsonResponse({
          success: false,
          message: "تم إنشاء ورقة SubData تلقائياً في الشيت، يرجى وضع أرقام المشتركين في العمود A وأسمائهم في العمود B."
        });
      }

      var subData = subSheet.getDataRange().getValues();
      for (var i = 1; i < subData.length; i++) {
        var rowPhone = (subData[i][0] || "").toString().trim().replace(/[\\s\\-\\(\\)]/g, "");
        var rowName = (subData[i][1] || "").toString().trim().toLowerCase();

        if (rowPhone && phone && rowPhone === phone) {
          if (!name || rowName.indexOf(name) !== -1 || name.indexOf(rowName) !== -1) {
            return createJsonResponse({
              success: true,
              name: subData[i][1] || e.parameter.name,
              phone: subData[i][0] || e.parameter.phone
            });
          }
        }
      }

      return createJsonResponse({
        success: false,
        message: "عذراً، هذا الاسم أو الرقم غير مسجل في ورقة المشتركين (SubData)."
      });
    }

    // ب) جلب بنك الأسئلة من ورقة Questions-AR
    if (action === "getQuestions") {
      var qSheet = ss.getSheetByName(QUESTIONS_SHEET);
      if (!qSheet) {
        qSheet = ss.insertSheet(QUESTIONS_SHEET);
        qSheet.appendRow([
          "عنوان الدرس",
          "رابط صورة السؤال 1",
          "نص السؤال 1",
          "خيارات السؤال 1 أو «نص»",
          "طريقة الإجابة / الإجابة الصحيحة 1",
          "رابط صورة السؤال 2",
          "نص السؤال 2",
          "خيارات السؤال 2 أو «نص»",
          "طريقة الإجابة / الإجابة الصحيحة 2"
        ]);
        return createJsonResponse({
          success: true,
          message: "تم إنشاء ورقة Questions-AR بنجاح وهي جاهزة لإضافة الأسئلة.",
          rows: []
        });
      }

      var rows = qSheet.getDataRange().getValues();
      return createJsonResponse({
        success: true,
        rows: rows
      });
    }

    // ج) تسجيل إجابات وتقييمات الطلاب في ورقة Answers-AR (يدعم الاستدعاء عبر GET أيضاً)
    if (action === "submitAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET) || ss.insertSheet(ANSWERS_SHEET);
      if (ansSheet.getLastRow() === 0) {
        var headerRow = [
          "تاريخ ووقت التسجيل",
          "رقم الطالب",
          "اسم المستخدم",
          "موضوع الحصة"
        ];
        for (var q = 1; q <= 20; q++) {
          headerRow.push("إجابة السؤال " + q);
        }
        ansSheet.appendRow(headerRow);
      }

      var ansCols = [];
      try {
        ansCols = JSON.parse(e.parameter.answerColumns || "[]");
      } catch (err) {
        ansCols = [];
      }

      var newRow = [
        e.parameter.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd HH:mm:ss"),
        e.parameter.studentPhone || "",
        e.parameter.studentName || "زائر",
        e.parameter.lessonTitle || ""
      ].concat(ansCols);

      // فحص ومنع تكرار الإرسال المتزامن
      var lastRowIdx = ansSheet.getLastRow();
      var isDuplicate = false;
      if (lastRowIdx > 1) {
        var lastValues = ansSheet.getRange(lastRowIdx, 1, 1, Math.min(ansSheet.getLastColumn(), 4 + ansCols.length)).getValues()[0];
        var lastPhone = String(lastValues[1] || "").trim();
        var lastName = String(lastValues[2] || "").trim();
        var lastLesson = String(lastValues[3] || "").trim();
        var curPhone = String(e.parameter.studentPhone || "").trim();
        var curName = String(e.parameter.studentName || "زائر").trim();
        var curLesson = String(e.parameter.lessonTitle || "").trim();

        if (lastPhone === curPhone && lastName === curName && lastLesson === curLesson) {
          var allMatch = true;
          for (var a = 0; a < ansCols.length; a++) {
            if (String(lastValues[4 + a] || "").trim() !== String(ansCols[a] || "").trim()) {
              allMatch = false;
              break;
            }
          }
          if (allMatch) {
            isDuplicate = true;
          }
        }
      }

      if (!isDuplicate) {
        ansSheet.appendRow(newRow);
      }

      return createJsonResponse({
        success: true,
        status: "success",
        isDuplicate: isDuplicate,
        message: isDuplicate 
          ? "✓ تم استلام الإجابة مسبقاً (تم منع التكرار بنجاح)."
          : "✓ تم تسجيل إجابات الطالب في ورقة Answers-AR بنجاح!"
      });
    }

    // د) جلب سجلات إجابات الطلاب من ورقة Answers-AR لكافة الأجهزة (جوالات، تابلت، كمبيوتر)
    if (action === "getAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET);
      if (!ansSheet) {
        return createJsonResponse({
          success: true,
          rows: []
        });
      }
      var rows = ansSheet.getDataRange().getValues();
      return createJsonResponse({
        success: true,
        rows: rows
      });
    }

    return createJsonResponse({
      status: "ready",
      app: "Smart AR Book Web App",
      sheets: [SUBSCRIBERS_SHEET, QUESTIONS_SHEET, ANSWERS_SHEET]
    });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// 2. معالجة طلبات POST (تحديث ورقة Questions-AR + تسجيل إجابات الطلاب في Answers-AR + الأحداث)
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (errP) {
        data = {};
      }
    }
    if ((!data || !data.action) && e && e.parameter && e.parameter.action) {
      data = e.parameter;
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // أ) تحديث وحفظ كافة الأسئلة في ورقة Questions-AR أفقياً
    if (data.action === "syncQuestions") {
      var qSheet = ss.getSheetByName(QUESTIONS_SHEET) || ss.insertSheet(QUESTIONS_SHEET);
      qSheet.clearContents();

      if (data.rows && data.rows.length > 0) {
        var maxCols = 1;
        for (var r = 0; r < data.rows.length; r++) {
          if (data.rows[r].length > maxCols) maxCols = data.rows[r].length;
        }

        var paddedRows = data.rows.map(function(row) {
          var copy = row.slice();
          while (copy.length < maxCols) copy.push("");
          return copy;
        });

        qSheet.getRange(1, 1, paddedRows.length, maxCols).setValues(paddedRows);
      }

      return createJsonResponse({
        success: true,
        message: "✓ تم تحديث ورقة Questions-AR في Google Sheets بنجاح!"
      });
    }

    // ب) تسجيل إجابات وتقييمات الطالب في ورقة Answers-AR
    if (data.action === "submitAnswers") {
      var ansSheet = ss.getSheetByName(ANSWERS_SHEET) || ss.insertSheet(ANSWERS_SHEET);
      var ansCols = data.answerColumns || [];
      if (typeof ansCols === "string") {
        try { ansCols = JSON.parse(ansCols); } catch (_) { ansCols = [ansCols]; }
      }
      if (!Array.isArray(ansCols)) ansCols = [];

      if (ansSheet.getLastRow() === 0) {
        var headerRow = [
          "تاريخ ووقت التسجيل",
          "رقم الطالب",
          "اسم المستخدم",
          "موضوع الحصة"
        ];
        var ansCount = ansCols.length ? ansCols.length : 10;
        for (var q = 1; q <= Math.max(ansCount, 10); q++) {
          headerRow.push("إجابة السؤال " + q);
        }
        ansSheet.appendRow(headerRow);
      }

      var newRow = [
        data.timestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone() || "GMT+3", "yyyy-MM-dd HH:mm:ss"),
        data.studentPhone || "",
        data.studentName || "زائر",
        data.lessonTitle || ""
      ].concat(ansCols);

      var lastRowIdxP = ansSheet.getLastRow();
      var isDuplicateP = false;
      if (lastRowIdxP > 1) {
        var lastValuesP = ansSheet.getRange(lastRowIdxP, 1, 1, Math.min(ansSheet.getLastColumn(), 4 + ansCols.length)).getValues()[0];
        if (String(lastValuesP[1] || "").trim() === String(data.studentPhone || "").trim() &&
            String(lastValuesP[2] || "").trim() === String(data.studentName || "زائر").trim() &&
            String(lastValuesP[3] || "").trim() === String(data.lessonTitle || "").trim()) {
          var matchAll = true;
          for (var ap = 0; ap < ansCols.length; ap++) {
            if (String(lastValuesP[4 + ap] || "").trim() !== String(ansCols[ap] || "").trim()) {
              matchAll = false;
              break;
            }
          }
          if (matchAll) isDuplicateP = true;
        }
      }

      if (!isDuplicateP) {
        ansSheet.appendRow(newRow);
      }

      return createJsonResponse({
        success: true,
        status: "success",
        isDuplicate: isDuplicateP,
        message: isDuplicateP 
          ? "✓ تم استلام الإجابة مسبقاً (تم منع التكرار بنجاح)."
          : "✓ تم تسجيل إجابات الطالب في ورقة Answers-AR بنجاح!"
      });
    }

    // ج) تسجيل إجابة فردية (دعم توافقي سابق)
    if (data.action === "student_submission") {
      var subSheet = ss.getSheetByName(SUBMISSIONS_SHEET) || ss.insertSheet(SUBMISSIONS_SHEET);
      if (subSheet.getLastRow() === 0) {
        subSheet.appendRow(["التاريخ والوقت", "اسم الطالب", "رقم الجوال", "اسم الدرس", "السؤال", "إجابة الطالب", "صحيحة؟", "النتيجة"]);
      }
      subSheet.appendRow([
        data.submittedAt || new Date().toISOString(),
        data.studentName || "",
        data.studentPhone || "",
        data.lessonTitle || "",
        data.questionText || "",
        data.studentAnswer || "",
        data.isCorrect ? "نعم ✓" : "لا ✗",
        data.score || 0
      ]);
      return createJsonResponse({ status: "success", type: "submission_recorded" });
    }

    // د) تسجيل أحداث الكاميرا والدروس
    var eventSheet = ss.getSheetByName(EVENTS_SHEET) || ss.insertSheet(EVENTS_SHEET);
    if (eventSheet.getLastRow() === 0) {
      eventSheet.appendRow(["التاريخ والوقت", "معرف الجلسة", "معرف الهدف", "عنوان الدرس", "الحدث", "الجهاز", "اللغة"]);
    }
    eventSheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.session_id || "session",
      data.target_id || "lesson",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return createJsonResponse({ status: "success", type: "event_recorded" });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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

            <button
              onClick={() => setActiveTab('translations')}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-t border-x transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'translations'
                  ? 'bg-slate-900 text-sky-400 border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200 border-transparent'
              }`}
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>إدارة الترجمة واللغات (4 مجموعات)</span>
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

            {/* زر إظهار/إخفاء بطاقات الدروس في الكاميرا */}
            <button
              type="button"
              onClick={handleToggleCameraTargetCards}
              className={`text-[11px] font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                cameraShowTargetCards
                  ? 'bg-sky-950/80 border-sky-500/50 text-sky-300'
                  : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
              title="إظهار أو إخفاء زر بطاقات الدروس في الشريط العلوي لشاشة الكاميرا"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>بطاقات الدروس بالكاميرا: {cameraShowTargetCards ? 'مفعّل ✓' : 'مخفي ✕'}</span>
            </button>

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
            {/* 1. شاشة البداية وشريط الاختيار العلوي الأنيق (بدون ازدحام) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                      <span>اختر الدرس المراد تعديله:</span>
                    </label>
                    <span className="text-[11px] font-mono text-slate-400">
                      إجمالي الدروس: {editableLessons.length}
                    </span>
                  </div>

                  {editableLessons.length > 0 ? (
                    <div className="relative">
                      <select
                        value={selectedLessonIndex}
                        onChange={(e) => setSelectedLessonIndex(Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-500 focus:border-sky-500 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer focus:outline-none appearance-none shadow-sm"
                      >
                        {editableLessons.map((l, idx) => {
                          const isFree = !isLessonRestricted(l);
                          return (
                            <option key={l.targetId || idx} value={idx} className="bg-slate-950 text-white py-1">
                              Target #{l.targetIndex}: {l.title || `درس ${idx + 1}`} {isFree ? ' (🔓 متاح مجاناً)' : ' (🔒 مقفل للمشتركين)'}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="w-4 h-4 text-sky-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <div className="py-2 text-xs text-slate-500">
                      لا توجد دروس حالياً، اضغط إضافة درس جديد للبدء.
                    </div>
                  )}
                </div>

                {/* أزرار إضافة درس وتسجيل إجابات في نفس الصف بنصوص مختصرة وأنيقة */}
                <div className="self-end sm:self-auto sm:pt-4 flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <button
                    type="button"
                    onClick={() => {
                      setLessonSubTab('submissions');
                      setSystemAnswers(getStoredSystemAnswers());
                    }}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95 border border-emerald-400/30"
                    title="الانتقال إلى تبويب إجابات الطلاب المسجلة"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>تسجيل إجابات</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-black/30 text-emerald-200 text-xs font-bold font-mono">
                      {systemAnswers.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddNewLesson}
                    className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap active:scale-95"
                    title="إضافة درس جديد"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة درس</span>
                  </button>
                </div>
              </div>

              {/* أدوات سريعة للدرس المحدد (تقديم/تأخير/حذف بأيقونة فقط بدون نص) */}
              {currentLesson && (
                <div className="flex items-center justify-between sm:justify-end gap-2 border-t md:border-t-0 pt-2.5 md:pt-0 border-slate-800">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400 ml-1">ترتيب:</span>
                    <button
                      type="button"
                      disabled={selectedLessonIndex === 0}
                      onClick={() => handleMoveLesson(selectedLessonIndex, 'up')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-slate-800 transition-colors"
                      title="تحريك الدرس للأعلى (تقديم الترتيب)"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={selectedLessonIndex === editableLessons.length - 1}
                      onClick={() => handleMoveLesson(selectedLessonIndex, 'down')}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-slate-800 transition-colors"
                      title="تحريك الدرس للأسفل (تأخير الترتيب)"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteLesson(selectedLessonIndex)}
                    className="p-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center flex-shrink-0"
                    title="حذف هذا الدرس نهائياً"
                    aria-label="حذف الدرس"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
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

            {/* التبويبات الأفقية الخمسة للدرس المحدد: بيانات ثم وسائط ثم مجسمات ثم أسئلة ثم إجابات الطلاب */}
            {currentLesson && (
              <div className="space-y-4">
                {/* شريط التبويبات الأفقية الخمسة الأنيق والمختصر */}
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto shadow-lg">
                  {/* 1. بيانات */}
                  <button
                    type="button"
                    onClick={() => setLessonSubTab('general')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      lessonSubTab === 'general'
                        ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>بيانات</span>
                  </button>

                  {/* 2. وسائط */}
                  <button
                    type="button"
                    onClick={() => setLessonSubTab('media')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      lessonSubTab === 'media'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>وسائط</span>
                  </button>

                  {/* 3. مجسمات (أيقونة واحدة Box واسم مختصر) */}
                  <button
                    type="button"
                    onClick={() => setLessonSubTab('model3d')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      lessonSubTab === 'model3d'
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Box className="w-4 h-4" />
                    <span>مجسمات</span>
                  </button>

                  {/* 4. أسئلة */}
                  <button
                    type="button"
                    onClick={() => setLessonSubTab('questions')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      lessonSubTab === 'questions'
                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>أسئلة</span>
                  </button>

                  {/* 5. إجابات الطلاب */}
                  <button
                    type="button"
                    onClick={() => {
                      setLessonSubTab('submissions');
                      setSystemAnswers(getStoredSystemAnswers());
                    }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${
                      lessonSubTab === 'submissions'
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>إجابات الطلاب</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold font-mono">
                      {systemAnswers.length}
                    </span>
                  </button>
                </div>


                {/* ========================================================================= */}
                {/* 📝 التبويب 1: البيانات والصفحات ومستوى الوصول                             */}
                {/* ========================================================================= */}
                {lessonSubTab === 'general' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-sky-400" />
                        <span>بيانات الدرس والصفحات: {currentLesson.title} (Target #{currentLesson.targetIndex})</span>
                      </h4>

                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">
                        ID: {currentLesson.targetId}
                      </span>
                    </div>

                    {/* مستوى الوصول للدرس (Free vs Locked) */}
                    {(() => {
                      const isRestricted = isLessonRestricted(currentLesson);
                      return (
                        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-white flex items-center gap-1.5">
                              {!isRestricted ? (
                                <Unlock className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Lock className="w-4 h-4 text-amber-400" />
                              )}
                              <span>مستوى صلاحية الوصول لهذا الدرس:</span>
                            </label>
                            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              !isRestricted 
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                            }`}>
                              {!isRestricted ? '🔓 متاح مجاناً للتجربة (Free Preview)' : '🔒 مقفل للأعضاء المشتركين فقط'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            حدد ما إذا كان هذا الدرس مفتوحاً للجميع (كنموذج دعائي وتجريبي للكتاب المدرسي)، أو يتطلب اشتراكاً وتسجيل دخول.
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => handleFieldChange('isFreePreview', true)}
                              className={`p-2.5 rounded-xl border text-xs text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                                !isRestricted
                                  ? 'bg-emerald-950/80 border-emerald-500 text-white font-bold ring-2 ring-emerald-500/30'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Unlock className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <div>
                                <div className="font-bold text-white text-xs">متاح مجاناً للجميع (تجربة ومعاينة)</div>
                                <div className="text-[10px] text-slate-400">يمكن لأي طالب فتحه واستكشاف المجسم والوسائط دون تسجيل</div>
                              </div>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFieldChange('isFreePreview', false)}
                              className={`p-2.5 rounded-xl border text-xs text-right transition-all cursor-pointer flex items-center gap-2.5 ${
                                isRestricted
                                  ? 'bg-amber-950/80 border-amber-500 text-white font-bold ring-2 ring-amber-500/30'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                              <div>
                                <div className="font-bold text-white text-xs">مقفل للمشتركين فقط (تسجيل الدخول)</div>
                                <div className="text-[10px] text-slate-400">يتطلب الاسم ورقم الاشتراك المسجل في قاعدة البيانات</div>
                              </div>
                            </button>
                          </div>
                        </div>
                      );
                    })()}

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
                        <label className="text-xs font-bold text-slate-300">ملخص وشرح الدرس السريع:</label>
                        <textarea
                          rows={2}
                          value={currentLesson.description.summary}
                          onChange={(e) => handleFieldChange('summary', e.target.value)}
                          placeholder="اكتب شرحاً ومعلومات مفيدة للطالب عند قراءة صفحة الدرس..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>

                    {/* 📷 بطاقة صورة صفحة الكتاب المطبوعة (هدف المسح بالكاميرا) */}
                    <div className="p-3.5 rounded-xl bg-sky-950/30 border border-sky-500/40 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                            <Camera className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>صورة صفحة الكتاب المطبوعة (هدف المسح بالكاميرا)</span>
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
                          إذا كان الدرس يمتد عبر عدة صفحات في الكتاب (مثلاً صفحة ١٤ وصفحة ١٥)، أضف صور الصفحات الأخرى هنا. سيتعرف نظام الكاميرا على أي صفحة منها فوراً ويفتح نفس الدرس ومجسمه!
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
                        {(currentLesson.additionalTargetImages || []).length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
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
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 🎬 التبويب 2: الوسائط والشرح (فيديوهات + صوتيات + معرض الصور)               */}
                {/* ========================================================================= */}
                {lessonSubTab === 'media' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* 🎬 إدارة فيديوهات الدرس */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-rose-500/20 text-rose-400">
                            <Video className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>فيديوهات الدرس التعليمية (إضافة وترتيب وحذف)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                                {getLessonVideos(currentLesson).length} فيديو
                              </span>
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              دعم روابط YouTube أو Google Drive أو ملفات MP4 المباشرة أو أي موقع خارجي.
                            </p>
                          </div>
                        </div>
                      </div>

                      {videoNotice && (
                        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{videoNotice}</span>
                        </div>
                      )}

                      {/* قائمة الفيديوهات */}
                      {getLessonVideos(currentLesson).length > 0 ? (
                        <div className="space-y-2">
                          {getLessonVideos(currentLesson).map((vid, vidIdx) => (
                            <div
                              key={vidIdx}
                              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-bold flex items-center justify-center font-mono">
                                  #{vidIdx + 1}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                                  {vid.type === 'youtube' ? 'YouTube' : vid.type === 'vimeo' ? 'Vimeo' : vid.type === 'gdrive' ? 'Drive' : vid.type === 'mp4' ? 'MP4 مباشر' : 'رابط'}
                                </span>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 min-w-0">
                                <input
                                  type="text"
                                  value={vid.title}
                                  onChange={(e) => handleUpdateVideo(vidIdx, { title: e.target.value })}
                                  placeholder="عنوان المقطع"
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
                                <button
                                  type="button"
                                  disabled={vidIdx === 0}
                                  onClick={() => handleMoveVideo(vidIdx, 'up')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer"
                                  title="تحريك للأعلى"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={vidIdx === getLessonVideos(currentLesson).length - 1}
                                  onClick={() => handleMoveVideo(vidIdx, 'down')}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer"
                                  title="تحريك للأسفل"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>

                                {vid.url && (
                                  <a
                                    href={vid.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-sky-300"
                                    title="معاينة الرابط"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVideo(vidIdx)}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 cursor-pointer"
                                  title="حذف الفيديو"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 text-center text-xs text-slate-400 bg-slate-900/60 rounded-xl border border-dashed border-slate-800">
                          لا توجد فيديوهات مضافة لهذا الدرس حتى الآن.
                        </div>
                      )}

                      {/* إضافة فيديو جديد */}
                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1">
                          <Plus className="w-3.5 h-3.5 text-rose-400" />
                          <span>إضافة فيديو جديد للدرس:</span>
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

                    {/* 🎵 إدارة المقاطع الصوتية للدرس */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Music className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>التسجيلات الصوتية للدرس (رفع/رابط، تجربة الصوت، وترتيب)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                                {getLessonAudios(currentLesson).length} تسجيل
                              </span>
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              صوت الدرس منفصل عن صوت المجسم. يمكن للطلاب الاستماع إليه عبر زر الصوت.
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

                      {audioNotice && (
                        <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{audioNotice}</span>
                        </div>
                      )}

                      {/* قائمة الصوتيات */}
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
                                    placeholder="عنوان التسجيل"
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

                                  <button
                                    type="button"
                                    disabled={audIdx === 0}
                                    onClick={() => handleMoveAudio(audIdx, 'up')}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer"
                                    title="تحريك للأعلى"
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={audIdx === getLessonAudios(currentLesson).length - 1}
                                    onClick={() => handleMoveAudio(audIdx, 'down')}
                                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 disabled:opacity-20 cursor-pointer"
                                    title="تحريك للأسفل"
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAudio(audIdx)}
                                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 cursor-pointer"
                                    title="حذف التسجيل"
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
                          لا توجد تسجيلات صوتية مضافة لهذا الدرس.
                        </div>
                      )}

                      {/* إضافة تسجيل صوتي عبر الرابط */}
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
                            placeholder="عنوان التسجيل (مثال: قراءة النص بصوت المعلم)"
                            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                          />
                          <input
                            type="url"
                            value={newAudioUrl}
                            onChange={(e) => setNewAudioUrl(e.target.value)}
                            placeholder="رابط الصوت (MP3 مباشر، Google Drive، أو موقع صوتي)"
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

                    {/* 🖼️ معرض صور الشرح واللوحات التعليمية */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                            <Image className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>معرض صور الشرح واللوحات التعليمية</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                                {currentLesson.images?.length || 0} صور مضافة
                              </span>
                            </h5>
                            <p className="text-[11px] text-slate-400">
                              تظهر للطالب عند النقر على زر 🖼️ "الصور". تقبل رفع صور متعددة أو روابط مباشرة أو Google Drive.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                          <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all flex-shrink-0">
                            <Upload className="w-3.5 h-3.5" />
                            <span>📁 رفع صور من جهازك</span>
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
                                    setImageNotice(`✓ تم رفع وإضافة ${newUploadedImages.length} صور بنجاح!`);
                                    setTimeout(() => setImageNotice(null), 4000);
                                  });
                                }
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* إضافة رابط صورة */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div className="sm:col-span-6">
                          <input
                            type="url"
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="الصق رابط صورة Google Drive أو رابط مباشر..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-sky-500"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <input
                            type="text"
                            value={newImageTitle}
                            onChange={(e) => setNewImageTitle(e.target.value)}
                            placeholder="عنوان الصورة..."
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

                      {/* شبكة الصور */}
                      {currentLesson.images && currentLesson.images.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto p-1 pt-2">
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
                      ) : (
                        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                          لم يتم إضافة صور توضيحية لهذا الدرس بعد.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 🧊 التبويب 3: المجسم التفاعلي (3D & AR)                                     */}
                {/* ========================================================================= */}
                {lessonSubTab === 'model3d' && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                          <Box className="w-4 h-4" />
                        </span>
                        <div>
                          <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>ملف المجسم ثلاثي الأبعاد المشترك (.glb / .gltf)</span>
                          </h5>
                          <p className="text-[11px] text-slate-400">
                            نفس الملف يعمل تلقائياً في الواقع المعزز (AR) فوق صفحة الكتاب، وكذلك في العرض التفاعلي 360°.
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
                            title="إلغاء المجسم"
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

                    {/* نماذج سريعة للتجربة */}
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
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-sky-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
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
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-semibold border border-slate-700 cursor-pointer"
                      >
                        👨‍🚀 مجسم بديل تجريبي
                      </button>
                    </div>

                    {/* حقول المجسم */}
                    <div className="space-y-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-300">
                          رابط أو مسار ملف المجسم (.glb):
                        </label>
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
                          placeholder="مثال: /models/word.glb أو رابط مباشر"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300">عنوان المجسم المعروض للطالب:</label>
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
                            placeholder="عنوان المجسم"
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="flex items-center pt-4 px-1">
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

                    {/* 🎵 صوت المجسم التلقائي (3D Model Sound Effect) */}
                    <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                            <Music className="w-4 h-4" />
                          </span>
                          <div>
                            <h5 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                              <span>حقل الصوت التلقائي المخصص للمجسم فقط (3D Model Sound)</span>
                            </h5>
                            <p className="text-[11px] text-slate-300">
                              صوت مخصص للمجسم فقط ينطلق فور ظهور المجسم في الكاميرا أو المعاينة.
                            </p>
                          </div>
                        </div>

                        <label className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-md shadow-purple-600/20 transition-all flex-shrink-0 self-start sm:self-auto">
                          <Upload className="w-3.5 h-3.5" />
                          <span>📁 رفع ملف صوت (.mp3)</span>
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

                      <div className="flex flex-col sm:flex-row gap-2 items-center">
                        <input
                          type="text"
                          value={currentLesson.model3d?.soundUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateModelSound(val, val.trim() !== '');
                          }}
                          placeholder="الصق رابط صوت مباشر أو قوقل درايف للمجسم..."
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
                          >
                            {isPlayingTestAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span>{isPlayingTestAudio ? 'إيقاف الصوت' : 'تجربة الصوت'}</span>
                          </button>
                        )}
                      </div>

                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                        <input
                          type="checkbox"
                          checked={currentLesson.model3d?.soundEnabled !== false}
                          onChange={(e) => {
                            handleUpdateModelSound(undefined, e.target.checked);
                          }}
                          className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                        />
                        <span>تفعيل تشغيل الصوت تلقائياً مع ظهور المجسم ثلاثي الأبعاد</span>
                      </label>
                    </div>

                    {/* المعاينة الحية للمجسم */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>معاينة حية تفاعلية للمجسم (3D Preview) - جرّب التدوير بالفأرة أو اللمس:</span>
                      </span>

                      {getActiveLessonModel(currentLesson, true)?.url ? (
                        <Model3DViewer
                          src={getActiveLessonModel(currentLesson, true)!.url}
                          title={getActiveLessonModel(currentLesson, true)!.title || currentLesson.title}
                          height="260px"
                          autoRotate={getActiveLessonModel(currentLesson, true)!.autoRotate !== false}
                          interactive={true}
                        />
                      ) : (
                        <div className="h-44 rounded-2xl bg-slate-900 border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-1">
                          <Box className="w-8 h-8 text-slate-600 animate-pulse" />
                          <p className="text-xs font-bold text-slate-300">لا يوجد مجسم ثلاثي أبعاد لهذا الدرس حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* ❓ التبويب 4: بنك أسئلة الدرس                                            */}
                {/* ========================================================================= */}
                {lessonSubTab === 'questions' && (
                  <div className="space-y-4 animate-fadeIn">
                    <LessonQuestionsEditor
                      currentLesson={currentLesson}
                      allLessons={editableLessons}
                      webAppUrl={webAppUrl}
                      onUpdateAllLessons={(nextLessons) => {
                        setEditableLessons(nextLessons);
                        if (onUpdateLessons) onUpdateLessons(nextLessons);
                        saveStoredLessons(nextLessons);
                      }}
                      onUpdateQuestions={(newQuestions) => {
                        const nextLessons = [...editableLessons];
                        const cur = { ...currentLesson, questions: newQuestions };
                        if (newQuestions[0]?.type === 'multiple_choice') {
                          cur.description = {
                            ...cur.description,
                            quiz: {
                              question: newQuestions[0].question,
                              options: newQuestions[0].options || [],
                              correctIndex: newQuestions[0].correctIndex ?? 0,
                              explanation: newQuestions[0].explanation || ''
                            }
                          };
                        }
                        nextLessons[selectedLessonIndex] = cur;
                        setEditableLessons(nextLessons);
                        if (onUpdateLessons) onUpdateLessons(nextLessons);
                        saveStoredLessons(nextLessons);
                      }}
                      onRequestConfirm={setConfirmModal}
                    />
                  </div>
                )}

                {/* ========================================================================= */}
                {/* 📊 التبويب 5: إجابات الطلاب المسجلة في النظام (Answers-AR)               */}
                {/* ========================================================================= */}
                {lessonSubTab === 'submissions' && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* عرض سجل إجابات الطلاب في النظام المعتمد لورقة Answers-AR */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-4 animate-fadeIn">
                      {answersSyncNotice && (
                        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                          answersSyncNotice.includes('✓')
                            ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                            : 'bg-amber-950/70 border border-amber-500/40 text-amber-300'
                        }`}>
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>{answersSyncNotice}</span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <FileSpreadsheet className="w-5 h-5" />
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-white flex items-center gap-2">
                              <span>سجل إجابات الطلاب المعتمد (Answers-AR)</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                                {systemAnswers.length} سجل مسجل
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              يتم تسجيل إجابات الطلاب من الجوال والتابلت والكمبيوتر في هذا الجدول وتزامنها مع ورقة Answers-AR
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={handleFetchAnswersInConsole}
                            disabled={isFetchingSubmissions}
                            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 shadow-sm active:scale-95"
                            title="جلب إجابات الطلاب التي تمت من الجوال أو التابلت وتحديثها فورياً من Google Sheets"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSubmissions ? 'animate-spin' : ''}`} />
                            <span>{isFetchingSubmissions ? 'جارٍ الجلب...' : '📥 جلب من Google Sheets'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSystemAnswers(getStoredSystemAnswers());
                              setIsAnswersModalOpen(true);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                            <span>تصدير وعرض كامل</span>
                          </button>
                        </div>
                      </div>

                      {/* فلاتر البحث */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-sm">
                          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={submissionsSearch}
                            onChange={(e) => setSubmissionsSearch(e.target.value)}
                            placeholder="بحث باسم الطالب، رقم الهاتف، أو اسم الدرس..."
                            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">تصفية:</span>
                          <select
                            value={submissionFilterLesson}
                            onChange={(e) => setSubmissionFilterLesson(e.target.value)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            <option value="all">جميع الدروس ({systemAnswers.length})</option>
                            {editableLessons.map((l, idx) => (
                              <option key={l.targetId || idx} value={l.title}>
                                {l.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* جدول الإجابات */}
                      {(() => {
                        const filtered = systemAnswers.filter((a) => {
                          const matchSearch =
                            !submissionsSearch.trim() ||
                            a.studentName.toLowerCase().includes(submissionsSearch.toLowerCase()) ||
                            a.studentPhone.includes(submissionsSearch) ||
                            a.lessonTitle.toLowerCase().includes(submissionsSearch.toLowerCase());
                          const matchLesson =
                            submissionFilterLesson === 'all' ||
                            a.lessonTitle.trim() === submissionFilterLesson.trim();
                          return matchSearch && matchLesson;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-dashed border-slate-800 space-y-2">
                              <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
                              <p className="text-xs font-bold text-slate-400">لا توجد إجابات مسجلة بعد وفق هذا الفلتر</p>
                              <p className="text-[11px] text-slate-500">
                                عندما يجيب الطالب أو المشترك أو الزائر على الأسئلة في شاشة الكاميرا، ستظهر إجاباته هنا مباشرة وتُرسل لورقة Answers-AR.
                              </p>
                            </div>
                          );
                        }

                        const maxCols = Math.max(
                          3,
                          ...filtered.map((a) => (Array.isArray(a.answerColumns) ? a.answerColumns.length : 0))
                        );

                        return (
                          <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900/80 shadow-inner">
                            <div className="overflow-x-auto max-h-72">
                              <table className="w-full text-right text-xs border-collapse">
                                <thead className="bg-slate-950 text-slate-300 font-bold sticky top-0 z-10 border-b border-slate-800">
                                  <tr>
                                    <th className="p-2.5 whitespace-nowrap bg-slate-950">التاريخ والوقت</th>
                                    <th className="p-2.5 whitespace-nowrap bg-slate-950">رقم الطالب</th>
                                    <th className="p-2.5 whitespace-nowrap bg-slate-950">اسم المستخدم</th>
                                    <th className="p-2.5 whitespace-nowrap bg-slate-950 text-center">الجهاز</th>
                                    <th className="p-2.5 whitespace-nowrap bg-slate-950">موضوع الحصة</th>
                                    {Array.from({ length: maxCols }).map((_, i) => (
                                      <th key={i} className="p-2.5 whitespace-nowrap bg-slate-950 text-center min-w-[90px]">
                                        إجابة س{i + 1}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/80 text-[11px]">
                                  {filtered.map((row, rIdx) => {
                                    const isVisitor = !row.studentPhone || row.studentName === 'زائر';
                                    const ansCols = Array.isArray(row.answerColumns) ? row.answerColumns : [];
                                    const d = String(row.device || '').toLowerCase();
                                    const isMob = d.includes('جوال') || d.includes('mobile') || d.includes('phone');
                                    const isTab = d.includes('تابلت') || d.includes('tablet') || d.includes('ipad');

                                    return (
                                      <tr key={row.id || rIdx} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-2.5 font-mono text-slate-400 whitespace-nowrap">
                                          {row.timestamp}
                                        </td>
                                        <td className="p-2.5 font-mono whitespace-nowrap">
                                          {row.studentPhone ? (
                                            <span className="text-emerald-400 font-bold">{row.studentPhone}</span>
                                          ) : (
                                            <span className="text-slate-500 italic">زائر</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-bold whitespace-nowrap">
                                          {isVisitor ? (
                                            <span className="px-2 py-0.5 rounded-md bg-sky-950 text-sky-300 border border-sky-500/20">
                                              {row.studentName || 'زائر'}
                                            </span>
                                          ) : (
                                            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/20">
                                              {row.studentName}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 whitespace-nowrap text-center">
                                          {isMob ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                                              <Smartphone className="w-3 h-3" />
                                              <span>جوال</span>
                                            </span>
                                          ) : isTab ? (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                                              <Tablet className="w-3 h-3" />
                                              <span>تابلت</span>
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px]">
                                              <Monitor className="w-3 h-3" />
                                              <span>كمبيوتر</span>
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-medium text-amber-200 whitespace-nowrap">
                                          {row.lessonTitle}
                                        </td>
                                        {Array.from({ length: maxCols }).map((_, cIdx) => {
                                          const cell = ansCols[cIdx];
                                          if (cell === undefined || cell === null || cell === '') {
                                            return (
                                              <td key={cIdx} className="p-2.5 text-center text-slate-600">
                                                -
                                              </td>
                                            );
                                          }
                                          if (cell === 'صح') {
                                            return (
                                              <td key={cIdx} className="p-2.5 text-center">
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                                                  صح ✓
                                                </span>
                                              </td>
                                            );
                                          }
                                          if (cell === 'خطأ') {
                                            return (
                                              <td key={cIdx} className="p-2.5 text-center">
                                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                                                  خطأ ✗
                                                </span>
                                              </td>
                                            );
                                          }
                                          return (
                                            <td key={cIdx} className="p-2.5 text-center">
                                              <span className="px-2 py-0.5 rounded bg-slate-800 text-sky-200 border border-slate-700">
                                                {cell}
                                              </span>
                                            </td>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

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

            {/* زر دليل وإدارة تجميع الأهداف ونشر ملفات المشروع (زر واحد أنيق قابل للفتح والإغلاق) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPublishingGuide((prev) => !prev)}
                className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-900 border border-sky-500/30 hover:border-sky-400 transition-all cursor-pointer flex items-center justify-between shadow-lg group active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-lg bg-sky-500/15 text-sky-400 group-hover:bg-sky-500/25 transition-colors">
                    <Download className="w-4 h-4" />
                  </span>
                  <div className="text-right">
                    <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-sky-200 transition-colors">
                      🚀 دليل وإدارة تجميع الأهداف ونشر ملفات المشروع (MindAR & GitHub)
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2.5 py-1 rounded-lg bg-sky-500/10 text-sky-300 font-medium border border-sky-500/20">
                    {showPublishingGuide ? 'إخفاء الدليل ▲' : 'فتح الدليل والملفات ▼'}
                  </span>
                  <div className="p-1 rounded-md bg-slate-800 text-sky-400">
                    {showPublishingGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </button>
            </div>

            {/* محتوى دليل النشر وإدارة تجميع الأهداف عند النقر على الزر أعلاه */}
            {showPublishingGuide && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                      <Download className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        دليل وإدارة تجميع الأهداف وتحديث ملفات المشروع
                      </h4>
                      <p className="text-xs text-slate-400">
                        خطوتان سهلتان لتفعيل تحديثات الدروس وقراءة الكاميرا لجميع الطلاب في التطبيق
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPublishingGuide(false)}
                    className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <span>إغلاق الدليل</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* 💡 خطوات إعداد صور كتابك المدرسي الجديد */}
                <div className="p-3.5 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-200 leading-relaxed">
                    <span className="font-bold text-white block mb-0.5">💡 خطوات إعداد صور كتابك المدرسي الجديد:</span>
                    1. اضغط على <strong>[ + إضافة درس ]</strong> لكل صفحة من كتابك.<br />
                    2. اضغط على <strong>[ رفع صورة من جهازك ]</strong> لاختيار صورة الصفحة.<br />
                    3. ضع روابط الفيديو والصوت والنصوص وسؤال الاختبار.<br />
                    4. اضغط <strong>[ ⚡ تجميع بصمات الصور ]</strong> لدمج جميع الصور وتوليد <code className="text-sky-300">targets.mind</code>.
                  </div>
                </div>


                {/* 🎯 Visual Sequence Mapping for MindAR - Dropdown List */}
                {(() => {
                  const targetMap = buildMultiTargetMap(editableLessons);
                  const entries = targetMap.entries;
                  const activeEntry = entries.find((e) => e.globalTargetIndex === selectedSequenceTargetIndex) || entries[0];

                  return (
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-500/30 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-sky-400" />
                          <span>🎯 قائمة الترتيب الإلزامي لصور صفحات الكتاب في موقع MindAR</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono font-bold">
                            {entries.length} صفحة
                          </span>
                        </label>
                        <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-md border border-amber-500/20 font-medium self-start sm:self-auto">
                          ⚠️ يجب سحب الصور في MindAR بنفس هذا الترتيب
                        </span>
                      </div>

                      {/* القائمة المنسدلة لاختيار ومعاينة ترتيب أي صفحة دون أخذ مساحة من الصفحة */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <select
                            value={activeEntry ? activeEntry.globalTargetIndex : 0}
                            onChange={(e) => setSelectedSequenceTargetIndex(Number(e.target.value))}
                            className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-sky-200 font-medium focus:outline-none focus:border-sky-400 cursor-pointer shadow-inner"
                          >
                            {entries.map((entry) => (
                              <option key={`entry_opt_${entry.globalTargetIndex}_${entry.lessonId}`} value={entry.globalTargetIndex}>
                                ترتيب #{entry.globalTargetIndex + 1} (Target {entry.globalTargetIndex}): {entry.pageLabel} {entry.isPrimary ? '— (صفحة الدرس الأساسية)' : '— (صفحة إضافية)'}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => setShowSequenceTable((prev) => !prev)}
                            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold whitespace-nowrap border border-slate-700 cursor-pointer transition-colors flex items-center gap-1.5"
                            title="عرض أو إخفاء الجدول الشبكي المصغر للكل"
                          >
                            <span>{showSequenceTable ? 'إخفاء الشبكة ▲' : 'عرض الكل كجدول ▼'}</span>
                          </button>
                        </div>

                        {/* كرت معاينة الصفحة المحددة من القائمة المنسدلة فقط (موجز وموفر للمساحة) */}
                        {activeEntry && !showSequenceTable && (
                          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                            activeEntry.isPrimary ? 'bg-slate-950 border-slate-800' : 'bg-slate-950/80 border-indigo-500/30'
                          }`}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {activeEntry.imageUrl ? (
                                  <img src={normalizeImageUrl(activeEntry.imageUrl)} alt={activeEntry.pageLabel} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="text-[9px] text-slate-500 text-center">لا توجد صورة</span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 font-mono text-[11px] font-bold">
                                    ترتيب #{activeEntry.globalTargetIndex + 1}
                                  </span>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    (Target {activeEntry.globalTargetIndex})
                                  </span>
                                  <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                                    activeEntry.isPrimary ? 'bg-emerald-500/20 text-emerald-300' : 'bg-indigo-500/25 text-indigo-300'
                                  }`}>
                                    {activeEntry.isPrimary ? 'صفحة رئيسية' : 'صفحة إضافية'}
                                  </span>
                                </div>
                                <p className="text-xs sm:text-sm font-bold text-white truncate mt-1">
                                  {activeEntry.pageLabel}
                                </p>
                              </div>
                            </div>

                            <span className="text-[11px] text-slate-400 hidden sm:inline-block">
                              اختر أي صفحة من القائمة أعلاه لمعاينتها
                            </span>
                          </div>
                        )}
                      </div>

                      {/* القائمة الشبكية الكاملة (تفتح فقط عند طلب المعلم لعرض الكل) */}
                      {showSequenceTable && (
                        <div className="space-y-2 pt-2 border-t border-slate-800 animate-fadeIn">
                          <p className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/20">
                            ⚠️ يجب سحب الصور في موقع MindAR بنفس هذا الترتيب التسلسلي تماماً لضمان قراءة الدرس الصحيح للكاميرا:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-1">
                            {entries.map((entry) => (
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
                                  </div>
                                  <p className="text-xs font-bold text-white truncate mt-1">
                                    {entry.pageLabel}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

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
            )}
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
                  onClick={() => {
                    setWebAppUrl(DEFAULT_SHEETS_WEB_APP_URL);
                    analytics.setWebAppUrl(DEFAULT_SHEETS_WEB_APP_URL);
                    setTestResult('✓ تم تعيين واستعادة الرابط الافتراضي الدائم بنجاح.');
                    setTimeout(() => setTestResult(null), 3500);
                  }}
                  title="استعادة الرابط الدائم المدمج في التطبيق"
                  className="px-3 py-2 rounded-xl bg-sky-950/70 hover:bg-sky-900/80 text-sky-300 border border-sky-500/30 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>الرابط الافتراضي المدمج</span>
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

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>الرابط الافتراضي مدمج في الكود ويعمل تلقائياً لجميع الطلاب والهواتف دون الحاجة لأي إعداد يدوي.</span>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  testResult.includes('✓') ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
                }`}>
                  {testResult.includes('✓') ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{testResult}</span>
                </div>
              )}
            </div>

            {/* 💎 بطاقة إعدادات رابط الاشتراك الخارجي وورقة SubData */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>إعدادات نظام المشتركين ورابط طلب الاشتراك الخارجي</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono">
                        ورقة SubData
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      يتحكم في الرابط الذي يفتح للطلاب عند النقر على (طلب اشتراك) في الدروس المقيدة
                    </p>
                  </div>
                </div>
              </div>

              {/* حقل رابط الاشتراك الخارجي */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-200">
                  رابط طلب الاشتراك الخارجي (واتساب، متجر إلكتروني، أو صفحة تسديد):
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={subscriptionUrl}
                    onChange={(e) => setSubscriptionUrl(e.target.value)}
                    placeholder="https://wa.me/966XXXXXXXXX أو رابط متجرك"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-sky-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSubscriptionExternalUrl(subscriptionUrl);
                      setSubscriptionUrlSaved(true);
                      setTimeout(() => setSubscriptionUrlSaved(false), 3000);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    {subscriptionUrlSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{subscriptionUrlSaved ? 'تم الحفظ بنجاح!' : 'حفظ الرابط'}</span>
                  </button>
                  {subscriptionUrl && (
                    <a
                      href={subscriptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs transition-colors cursor-pointer flex items-center justify-center gap-1 border border-slate-700"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>تجربة الرابط ↗</span>
                    </a>
                  )}
                </div>
              </div>

              {/* إرشادات هيكل ورقة SubData للمشتركين */}
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>طريقة إضافة المشتركين في Google Sheets (ورقة SubData):</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  عند نسخ كود سكريبت Apps Script أعلاه، يتم إنشاء ورقة اسمها <code className="font-mono bg-black/40 px-1 rounded text-amber-300">SubData</code> تلقائياً في الشيت:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-amber-400 font-bold block">العمود A:</span>
                    رقم المشترك أو رقم الجوال (مثل: 0501234567)
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-amber-400 font-bold block">العمود B:</span>
                    اسم المشترك (مثل: محمد خالد)
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  💡 عند كتابة الطالب اسمه ورقمه لأول مرة في التطبيق، تتم مطابقتها في ثانية واحدة مع هذه الورقة وتفعيل حسابه تلقائياً لجميع الدروس المقيدة.
                </p>
              </div>
            </div>

            {/* ❓ بطاقة ورقة الأسئلة Questions-AR وورقة الإجابات Answers-AR */}
            <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                    <Brain className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      <span>نظام الأسئلة والإجابات المباشر (Questions-AR & Answers-AR)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-mono">
                        ورقتين مخصصتين
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      إدارة الأسئلة أفقياً لكل درس، واستقبال سجل إجابات الطلاب وتقييماتهم
                    </p>
                  </div>
                </div>

                {/* أزرار المزامنة السريعة */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleImportQuestionsFromSheet}
                    disabled={isSheetsQuestionsSyncing}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                    title="استيراد الأسئلة من ورقة Questions-AR وتحديث دروس التطبيق بها"
                  >
                    {isSheetsQuestionsSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DownloadCloud className="w-3.5 h-3.5 text-sky-400" />}
                    <span>استيراد الأسئلة من الشيت</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportQuestionsToSheet}
                    disabled={isSheetsQuestionsSyncing}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-sky-600/20 active:scale-95 disabled:opacity-50"
                    title="تصدير بنك الأسئلة من التطبيق وحفظه في ورقة Questions-AR"
                  >
                    {isSheetsQuestionsSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>تحديث ورقة Questions-AR</span>
                  </button>
                </div>
              </div>

              {sheetQuestionsNotice && (
                <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sky-200 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 flex-shrink-0" />
                  <span>{sheetQuestionsNotice}</span>
                </div>
              )}

              {/* الشرح التوضيحي لهيكل ورقة Questions-AR */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div className="font-bold text-sky-300 flex items-center justify-between">
                  <span>أولاً: هيكل ورقة Questions-AR (حفظ الأسئلة أفقياً لكل درس في صف واحد):</span>
                  <span className="text-[10px] text-slate-400">كل سؤال يشغل 4 أعمدة</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border border-slate-800 rounded">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                        <th className="p-2 border-l border-slate-800">العمود A</th>
                        <th className="p-2 border-l border-slate-800">العمود B</th>
                        <th className="p-2 border-l border-slate-800">العمود C</th>
                        <th className="p-2 border-l border-slate-800">العمود D</th>
                        <th className="p-2 border-l border-slate-800">العمود E</th>
                        <th className="p-2 text-slate-400">الأعمدة F وما بعده</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr>
                        <td className="p-2 border-l border-slate-800 font-bold text-amber-300">عنوان الدرس</td>
                        <td className="p-2 border-l border-slate-800 text-slate-400">رابط صورة السؤال 1 (اختياري)</td>
                        <td className="p-2 border-l border-slate-800 text-white font-medium">نص السؤال 1</td>
                        <td className="p-2 border-l border-slate-800 text-cyan-300">خيارات السؤال 1 (مفصولة بفاصلة) أو كلمة «نص»</td>
                        <td className="p-2 border-l border-slate-800 text-emerald-300">طريقة الإجابة (رقم الخيار / النص الصحيح / فارغ لحر)</td>
                        <td className="p-2 text-slate-400">تكرار نفس البنية: صورة 2، نص 2، خيارات 2، إجابة 2...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
                  <p>• إذا كان السؤال لا يحتوي على صورة، يمكن ترك عمود الصورة فارغاً.</p>
                  <p>• إذا تُرِك عمود طريقة الإجابة (E) فارغاً لسؤال نصي، يعتبر سؤالاً ذا «إجابة حرة» دون تصحيح صح/خطأ.</p>
                  <p>• إذا كان الدرس لا يحتوي على أي سؤال في الورقة، يُخفى زر الأسئلة للطالب تلقائياً في شاشة الكاميرا.</p>
                </div>
              </div>

              {/* الشرح التوضيحي لهيكل ورقة Answers-AR */}
              <div className="space-y-2 p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
                <div className="font-bold text-emerald-300 flex items-center justify-between">
                  <span>ثانياً: هيكل ورقة Answers-AR (حفظ إجابات الطلاب لكل حصة):</span>
                  <span className="text-[10px] text-slate-400">صف مستقل لكل طالب</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-[11px] border border-slate-800 rounded">
                    <thead>
                      <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                        <th className="p-2 border-l border-slate-800">A: التاريخ والوقت</th>
                        <th className="p-2 border-l border-slate-800">B: رقم الطالب</th>
                        <th className="p-2 border-l border-slate-800">C: اسم المستخدم</th>
                        <th className="p-2 border-l border-slate-800">D: موضوع الحصة</th>
                        <th className="p-2 border-l border-slate-800">E: إجابة السؤال 1</th>
                        <th className="p-2 text-slate-400">F وما بعده: إجابة 2، 3...</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      <tr>
                        <td className="p-2 border-l border-slate-800 font-mono text-[10px]">2026-10-17 14:30</td>
                        <td className="p-2 border-l border-slate-800 font-mono text-cyan-300">0501234567</td>
                        <td className="p-2 border-l border-slate-800 font-bold text-white">محمد خالد</td>
                        <td className="p-2 border-l border-slate-800 text-amber-300">دورة الماء في الطبيعة</td>
                        <td className="p-2 border-l border-slate-800 font-bold text-emerald-400">صح</td>
                        <td className="p-2 text-slate-300">«الخط العربي» (نص حر) / خطأ / فارغ</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
                  <p>• <span className="text-emerald-300 font-bold">صح:</span> إذا كانت إجابة الطالب مطابقة للخيار أو الإجابة النموذجية.</p>
                  <p>• <span className="text-rose-300 font-bold">خطأ:</span> إذا كانت إجابة الطالب خاطئة.</p>
                  <p>• <span className="text-sky-300 font-bold">نص الإجابة الحرة نفسه:</span> مثل «الخط العربي» دون تقييد بصح أو خطأ.</p>
                  <p>• <span className="text-slate-400 font-bold">فارغ:</span> إذا لم يُسجل الطالب إجابة عن هذا السؤال.</p>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSystemAnswers(getStoredSystemAnswers());
                      setIsAnswersModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
                    <span>📊 فتح قسم وسجل إجابات الطلاب (Answers-AR)</span>
                    <span className="px-2 py-0.5 rounded-full bg-black/30 text-emerald-200 text-[10px] font-bold">
                      {systemAnswers.length} سجل
                    </span>
                  </button>
                </div>
              </div>
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

        {/* Tab 3: Translations Manager (4 Groups with Individual & Group AI Translation) */}
        {activeTab === 'translations' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-100">
            <TranslationManagerView
              currentLanguage={currentLang}
              onLanguageChange={handleLangChange}
              onRequestConfirm={setConfirmModal}
            />
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

        {/* نافذة قسم تسجيل إجابات الطلاب لكافة الدروس (Answers-AR) */}
        <SystemAnswersModal
          isOpen={isAnswersModalOpen}
          lessons={editableLessons}
          onClose={() => {
            setIsAnswersModalOpen(false);
            setSystemAnswers(getStoredSystemAnswers());
          }}
        />
      </div>
    </div>
  );
};
