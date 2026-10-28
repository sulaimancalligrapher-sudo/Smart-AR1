/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ARCameraView } from './components/ARCameraView';
import { TransparentOverlay } from './components/TransparentOverlay';
import { VideoModal } from './components/VideoModal';
import { GalleryModal } from './components/GalleryModal';
import { AudioPlayerModal } from './components/AudioPlayerModal';
import { ExplanationModal } from './components/ExplanationModal';
import { TargetCardsModal } from './components/TargetCardsModal';
import { TeacherConsoleModal } from './components/TeacherConsoleModal';
import { MindARCompilerModal } from './components/MindARCompilerModal';
import { StudentQRModal } from './components/StudentQRModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminPortalView } from './components/AdminPortalView';
import { Model3DModal } from './components/Model3DModal';
import { Holographic3DOverlay } from './components/Holographic3DOverlay';
import { QuestionsModal } from './components/QuestionsModal';
import { LessonData, getActiveLessonModel, getLessonVideos, getLessonAudios, getLessonQuestions, isLessonRestricted, checkLessonAccess } from './types/ar';
import { DEFAULT_LESSONS, fetchLessons, getStoredLessons, saveStoredLessons, purgeAllLocalDataAndCache } from './data/lessons';
import { analytics } from './services/analytics';
import { soundService } from './services/soundService';
import { getIsAdminLoggedIn, setAdminLoggedIn } from './services/adminAuth';
import { SubscriberLockModal } from './components/SubscriberLockModal';
import { fetchQuestionsFromSheet } from './services/sheetsQuestionsSync';
import { AppLanguage } from './types/translation';
import {
  getStoredLanguage,
  saveStoredLanguage,
  applyLanguageDirection
} from './services/translationService';
import {
  SubscriberInfo,
  getStoredSubscriber,
  saveStoredSubscriber,
  clearStoredSubscriber,
  getSubscriptionExternalUrl,
  getStoredVisitorName,
  saveStoredVisitorName,
  clearStoredVisitorName
} from './services/subscriptionAuth';

type ActiveModalType =
  | 'none'
  | 'video'
  | 'images'
  | 'audio'
  | 'explanation'
  | 'questions'
  | 'model3d'
  | 'target_cards'
  | 'teacher_console'
  | 'compiler'
  | 'qr';

// التحقق من الرابط الخاص بالإدارة
function checkIsAdminUrl(): boolean {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    return (
      searchParams.has('admin') ||
      searchParams.get('mode') === 'admin' ||
      window.location.hash.toLowerCase().includes('admin')
    );
  } catch {
    return false;
  }
}

export default function App() {
  const [lessons, setLessons] = useState<LessonData[]>(() => {
    const stored = getStoredLessons();
    return stored && stored.length > 0 ? stored : DEFAULT_LESSONS;
  });
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [showHologram3D, setShowHologram3D] = useState<boolean>(false);
  
  // صلاحيات ومستوى الإدارة والمعلم
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getIsAdminLoggedIn());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'student' | 'admin'>(() => {
    return checkIsAdminUrl() ? 'admin' : 'student';
  });

  // 💎 نظام المشتركين (الوضع المفتوح vs الوضع المقيد)
  const [currentSubscriber, setCurrentSubscriber] = useState<SubscriberInfo | null>(() => getStoredSubscriber());
  const currentSubscriberRef = useRef<SubscriberInfo | null>(currentSubscriber);
  useEffect(() => {
    currentSubscriberRef.current = currentSubscriber;
  }, [currentSubscriber]);

  const [lockedLessonTarget, setLockedLessonTarget] = useState<LessonData | null>(null);
  const [isSubscriberLockModalOpen, setIsSubscriberLockModalOpen] = useState<boolean>(false);

  // 👤 نظام اسم الزائر (للدروس المفتوحة - يُسجل في الصفحة ويُحفظ تلقائياً)
  const [visitorName, setVisitorName] = useState<string>(() => getStoredVisitorName());

  const handleVisitorNameChange = (name: string) => {
    saveStoredVisitorName(name);
    setVisitorName(name);
  };

  const handleVisitorLogout = () => {
    clearStoredVisitorName();
    setVisitorName('');
  };

  // 🌐 إدارة اللغة الحالية (العربية ar | الإنجليزية en | التايلاندية th)
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() => {
    return getStoredLanguage();
  });

  const handleLanguageChange = (newLang: AppLanguage) => {
    setCurrentLanguage(newLang);
    saveStoredLanguage(newLang);
    applyLanguageDirection(newLang);
  };

  // كشف الدخول عبر الرابط الخاص بالإدارة أو الرابط المباشر لكاميرا الطالب مع ضبط اللغة
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlLang = searchParams.get('lang');
      if (urlLang === 'ar' || urlLang === 'en' || urlLang === 'th') {
        setCurrentLanguage(urlLang);
        saveStoredLanguage(urlLang);
        applyLanguageDirection(urlLang);
      } else {
        applyLanguageDirection(getStoredLanguage());
      }
    } catch (_) {}

    if (checkIsAdminUrl()) {
      setViewMode('admin');
      if (!getIsAdminLoggedIn()) {
        setIsAdminLoginOpen(true);
      }
    } else {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const isStudentCameraDirect =
          searchParams.get('mode') === 'student' ||
          searchParams.get('camera') === '1' ||
          searchParams.has('camera') ||
          searchParams.get('start') === 'camera' ||
          searchParams.get('autostart') === 'true' ||
          window.location.hash.includes('camera');

        if (isStudentCameraDirect) {
          setIsCameraActive(true);
          setShowHologram3D(false);
          setShowFloatingModel(true);
          setActiveModal('none');
        }
      } catch (_) {}
    }
  }, []);

  // ⭐ النوع الأول: المجسم مثبت على الصورة ويتابعها (AR) ⭐
  const [showFloatingModel, setShowFloatingModel] = useState<boolean>(true);

  useEffect(() => {
    fetchLessons().then(async (loadedLessons) => {
      if (loadedLessons && loadedLessons.length > 0) {
        setLessons(loadedLessons);
        setActiveLesson((prev) => {
          if (!prev) return null;
          return loadedLessons.find(
            (l, idx) => l.targetId === prev.targetId || (l.targetIndex ?? idx) === (prev.targetIndex ?? -1)
          ) || prev;
        });

        // مزامنة ذكية وهادئة في الخلفية لجلب أحدث الأسئلة من ورقة Questions-AR
        const webAppUrl = analytics.getWebAppUrl();
        if (webAppUrl) {
          try {
            const sheetRes = await fetchQuestionsFromSheet(loadedLessons, webAppUrl);
            if (sheetRes.success && sheetRes.lessonsWithQuestions && sheetRes.lessonsWithQuestions.length > 0) {
              setLessons(sheetRes.lessonsWithQuestions);
              saveStoredLessons(sheetRes.lessonsWithQuestions);
            }
          } catch (_) {}
        }
      }
    });
  }, []);

  const handleUpdateLessons = (updated: LessonData[]) => {
    setLessons(updated);
    saveStoredLessons(updated);
    if (activeLesson) {
      const refreshed = updated.find(
        (l, idx) => l.targetId === activeLesson.targetId || (l.targetIndex ?? idx) === (activeLesson.targetIndex ?? -1)
      );
      if (refreshed) {
        setActiveLesson(refreshed);
      }
    }
  };

  const handleTargetDetected = (lesson: LessonData) => {
    // 1. جلب أحدث بيانات للدرس الممسوح
    const fresh =
      lessons.find((l) => l.targetId === lesson.targetId) ||
      lessons.find(
        (l, idx) =>
          (typeof l.targetIndex === 'number' ? l.targetIndex : idx) ===
          (typeof lesson.targetIndex === 'number' ? lesson.targetIndex : -1)
      ) ||
      lesson;

    // 2. فحص صلاحية الوصول للدرس: (متاح مجاناً / مقفل للمشتركين / خاص VIP)
    const activeSub = currentSubscriberRef.current || currentSubscriber || getStoredSubscriber();
    const access = checkLessonAccess(fresh, activeSub);

    if (!access.allowed) {
      console.warn(`🔒 درس مقيد/خاص تم مسحه (${access.tier}):`, fresh.title, access.reason);
      setLockedLessonTarget(fresh);
      setIsSubscriberLockModalOpen(true);
      // إخفاء الدرس النشط لمنع ظهور أزرار التفاعل لغير المصرح لهم
      setActiveLesson(null);
      analytics.trackEvent({
        targetId: fresh.targetId,
        lessonTitle: fresh.title,
        action: 'target_locked_blocked'
      });
      return;
    }

    // تفعيل الدرس لعرض أزرار التفاعل فوق الكاميرا
    setActiveLesson(fresh);
    setShowHologram3D(false);
    setShowFloatingModel(true);
    if (activeModal !== 'teacher_console' && activeModal !== 'compiler') {
      setActiveModal('none');
    }
    analytics.trackEvent({
      targetId: fresh.targetId,
      lessonTitle: fresh.title,
      action: 'target_detected'
    });
  };

  // نجاح تسجيل دخول المشترك
  const handleSubscriberLoginSuccess = (subscriber: SubscriberInfo) => {
    saveStoredSubscriber(subscriber);
    setCurrentSubscriber(subscriber);
    currentSubscriberRef.current = subscriber;
    setIsSubscriberLockModalOpen(false);
    if (lockedLessonTarget) {
      const access = checkLessonAccess(lockedLessonTarget, subscriber);
      if (access.allowed) {
        setActiveLesson(lockedLessonTarget);
        setShowFloatingModel(true);
        setShowHologram3D(false);
        if (activeModal !== 'teacher_console' && activeModal !== 'compiler') {
          setActiveModal('none');
        }
      }
      setLockedLessonTarget(null);
    }
  };

  // تسجيل خروج المشترك
  const handleSubscriberLogout = () => {
    clearStoredSubscriber();
    setCurrentSubscriber(null);
    currentSubscriberRef.current = null;
    setActiveLesson(null);
    setShowHologram3D(false);
    setShowFloatingModel(false);
    setActiveModal('none');
    soundService.pauseModelSound();
  };

  const handleTargetLost = (lesson: LessonData) => {
    analytics.trackEvent({
      targetId: lesson.targetId,
      lessonTitle: lesson.title,
      action: 'target_lost'
    });
  };

  const handleStartCamera = () => {
    setIsCameraActive(true);
    setShowHologram3D(false);
    setShowFloatingModel(true);
    setActiveModal('none');
  };

  const handleCloseCamera = () => {
    setIsCameraActive(false);
    setActiveLesson(null);
    setShowHologram3D(false);
    setShowFloatingModel(true);
    setActiveModal('none');
  };

  const handleSimulateLesson = (lesson: LessonData) => {
    setIsCameraActive(true);
    handleTargetDetected(lesson);
  };

  const handleCloseOverlayLesson = () => {
    if (activeLesson) {
      analytics.trackEvent({
        targetId: activeLesson.targetId,
        lessonTitle: activeLesson.title,
        action: 'content_close'
      });
    }
    setActiveLesson(null);
    setShowHologram3D(false);
    setShowFloatingModel(true);
    setActiveModal('none');
  };

  // تبديل إظهار/إخفاء المجسم المعلق على الصورة (النوع الأول)
  const handleToggleFloatingModel = () => {
    setShowFloatingModel((prev) => !prev);
  };

  const handlePurgeAllData = async () => {
    if (window.confirm('⚠️ تأكيد: هل تريد مسح كافة البيانات المخزنة وتصفير الكاش في المتصفح تماماً وتحديث النظام بالكامل لأحدث نسخة نظيفة؟')) {
      await purgeAllLocalDataAndCache();
      window.location.reload();
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    setViewMode('admin');
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminLoggedIn(false);
    setViewMode('student');
    try {
      window.history.replaceState({}, '', window.location.pathname);
    } catch (_) {}
  };

  const handleCloseAdminLogin = () => {
    setIsAdminLoginOpen(false);
    if (viewMode === 'admin' && !isAdmin) {
      setViewMode('student');
      try {
        window.history.replaceState({}, '', window.location.pathname);
      } catch (_) {}
    }
  };

  return (
    <div className={`relative w-full min-h-screen bg-slate-950 text-slate-100 font-sans ${isCameraActive ? 'fixed inset-0 overflow-hidden' : 'overflow-x-hidden overflow-y-auto'}`}>
      {/* 1. Main View: Welcome Screen OR Dedicated Admin Portal OR Live AR Camera View */}
      {!isCameraActive ? (
        viewMode === 'admin' ? (
          isAdmin ? (
            <AdminPortalView
              lessons={lessons}
              onOpenTeacherConsole={() => setActiveModal('teacher_console')}
              onOpenCompiler={() => setActiveModal('compiler')}
              onOpenTargetCards={() => setActiveModal('target_cards')}
              onOpenQRModal={() => setActiveModal('qr')}
              onSimulateLesson={handleSimulateLesson}
              onPurgeAllData={handlePurgeAllData}
              onGoToStudentView={() => {
                setViewMode('student');
                try {
                  window.history.replaceState({}, '', window.location.pathname);
                } catch (_) {}
              }}
              onLogout={handleAdminLogout}
            />
          ) : (
            <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-center text-white" dir="rtl">
              <AdminLoginModal
                isOpen={true}
                onClose={handleCloseAdminLogin}
                onSuccess={handleAdminLoginSuccess}
              />
            </div>
          )
        ) : (
          <WelcomeScreen
            lessons={lessons}
            isAdmin={isAdmin}
            subscriber={currentSubscriber}
            visitorName={visitorName}
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            onSubscriberLogout={handleSubscriberLogout}
            onVisitorLogout={handleVisitorLogout}
            onOpenSubscriberLogin={() => {
              const restricted = lessons.find((l) => isLessonRestricted(l)) || lessons[0] || null;
              setLockedLessonTarget(restricted);
              setIsSubscriberLockModalOpen(true);
            }}
            onStartCamera={handleStartCamera}
            onOpenAdminPortal={() => setViewMode('admin')}
            onAdminLogout={handleAdminLogout}
          />
        )
      ) : (
        <ARCameraView
          lessons={lessons}
          activeLesson={activeLesson}
          isAdmin={isAdmin}
          subscriber={currentSubscriber}
          visitorName={visitorName}
          currentLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
          onSubscriberLogout={handleSubscriberLogout}
          onVisitorLogout={handleVisitorLogout}
          onTargetDetected={handleTargetDetected}
          onTargetLost={handleTargetLost}
          onCloseCamera={handleCloseCamera}
          onOpenTargetCards={() => setActiveModal('target_cards')}
          onOpenTeacherConsole={() => setActiveModal('teacher_console')}
          showFloatingModel={showFloatingModel} // ⭐ تمرير الحالة ⭐
          hideScanReticle={activeModal !== 'none' || showHologram3D}
        />
      )}

      {/* 2. Real Holographic 3D AR Layer over Live Camera */}
      {isCameraActive && activeLesson && getActiveLessonModel(activeLesson, false) && showHologram3D && activeModal === 'none' && (
        <Holographic3DOverlay
          model={getActiveLessonModel(activeLesson, false)!}
          lessonTitle={activeLesson.title}
          audioUrl={activeLesson.audio?.url}
          onClose={() => {
            setShowHologram3D(false);
            setShowFloatingModel(true);
          }}
        />
      )}

      {/* 3. Transparent HTML/CSS Overlay */}
      {isCameraActive && activeLesson && activeModal === 'none' && (
        <TransparentOverlay
          lesson={activeLesson}
          currentLanguage={currentLanguage}
          isModel3DActive={showHologram3D}
          isFloatingModelActive={showFloatingModel}
          onOpenVideo={() => {
            if (activeLesson && isLessonRestricted(activeLesson) && !currentSubscriber && !getStoredSubscriber()) {
              setLockedLessonTarget(activeLesson);
              setIsSubscriberLockModalOpen(true);
              return;
            }
            soundService.pauseModelSound();
            setShowHologram3D(false);
            setActiveModal('video');
          }}
          onOpenImages={() => {
            setShowHologram3D(false);
            setActiveModal('images');
          }}
          onOpenAudio={() => {
            if (activeLesson && isLessonRestricted(activeLesson) && !currentSubscriber && !getStoredSubscriber()) {
              setLockedLessonTarget(activeLesson);
              setIsSubscriberLockModalOpen(true);
              return;
            }
            soundService.pauseModelSound();
            setShowHologram3D(false);
            setActiveModal('audio');
          }}
          onOpenExplanation={() => {
            if (activeLesson && isLessonRestricted(activeLesson) && !currentSubscriber && !getStoredSubscriber()) {
              setLockedLessonTarget(activeLesson);
              setIsSubscriberLockModalOpen(true);
              return;
            }
            setShowHologram3D(false);
            setActiveModal('explanation');
          }}
          onOpenQuestions={() => {
            soundService.pauseModelSound();
            setShowHologram3D(false);
            setActiveModal('questions');
          }}
          onOpenModel3D={() => {
            setShowHologram3D((prev) => {
              const next = !prev;
              if (!next) {
                setShowFloatingModel(true);
              }
              return next;
            });
          }}
          onToggleFloatingModel={handleToggleFloatingModel}
          onCloseLesson={handleCloseOverlayLesson}
        />
      )}

      {/* 4. Interactive Content Modals */}
      {activeModal === 'model3d' && activeLesson && getActiveLessonModel(activeLesson, false) && (
        <Model3DModal
          model={getActiveLessonModel(activeLesson, false)!}
          lessonTitle={activeLesson.title}
          audioUrl={activeLesson.audio?.url}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {activeModal === 'video' && activeLesson && (
        <VideoModal
          video={activeLesson.video}
          videos={getLessonVideos(activeLesson)}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {activeModal === 'images' && activeLesson && (
        <GalleryModal
          images={activeLesson.images}
          targetImage={activeLesson.targetImage}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {activeModal === 'audio' && activeLesson && (
        <AudioPlayerModal
          audio={activeLesson.audio}
          audios={getLessonAudios(activeLesson)}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          lessonSummary={activeLesson.description.summary}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {activeModal === 'explanation' && activeLesson && (
        <ExplanationModal
          description={activeLesson.description}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          grade={activeLesson.grade}
          subject={activeLesson.subject}
          questions={getLessonQuestions(activeLesson)}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {activeModal === 'questions' && activeLesson && (
        <QuestionsModal
          lesson={activeLesson}
          questions={getLessonQuestions(activeLesson)}
          subscriber={currentSubscriber}
          visitorName={visitorName}
          webAppUrl={analytics.getWebAppUrl()}
          currentLanguage={currentLanguage}
          onSubscriberLogin={handleSubscriberLoginSuccess}
          onVisitorNameChange={handleVisitorNameChange}
          onVisitorLogout={handleVisitorLogout}
          onClose={() => {
            setActiveModal('none');
            setShowFloatingModel(true);
          }}
        />
      )}

      {/* 5. Utility Modals */}
      {activeModal === 'target_cards' && (
        <TargetCardsModal
          lessons={lessons}
          onSelectLesson={(lesson) => {
            handleSimulateLesson(lesson);
            setActiveModal('none');
          }}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'teacher_console' && (
        <TeacherConsoleModal 
          lessons={lessons}
          onUpdateLessons={handleUpdateLessons}
          onPurgeAllData={handlePurgeAllData}
          onClose={() => setActiveModal('none')} 
        />
      )}

      {activeModal === 'compiler' && (
        <MindARCompilerModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'qr' && (
        <StudentQRModal
          lessons={lessons}
          onClose={() => setActiveModal('none')}
        />
      )}

      {/* 6. نافذة قفل الدروس للمشتركين فقط وتسجيل الدخول / طلب الاشتراك */}
      <SubscriberLockModal
        isOpen={isSubscriberLockModalOpen}
        lesson={lockedLessonTarget || lessons.find((l) => isLessonRestricted(l)) || lessons[0] || null}
        currentSubscriber={currentSubscriber}
        webAppUrl={analytics.getWebAppUrl()}
        subscriptionExternalUrl={getSubscriptionExternalUrl()}
        currentLanguage={currentLanguage}
        onSuccessLogin={handleSubscriberLoginSuccess}
        onClose={() => {
          setIsSubscriberLockModalOpen(false);
          setLockedLessonTarget(null);
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={handleCloseAdminLogin}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}