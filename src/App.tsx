/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { LessonData, getActiveLessonModel } from './types/ar';
import { DEFAULT_LESSONS, fetchLessons, getStoredLessons, saveStoredLessons, purgeAllLocalDataAndCache } from './data/lessons';
import { analytics } from './services/analytics';
import { getIsAdminLoggedIn, setAdminLoggedIn } from './services/adminAuth';

type ActiveModalType =
  | 'none'
  | 'video'
  | 'images'
  | 'audio'
  | 'explanation'
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

  // كشف الدخول عبر الرابط الخاص بالإدارة
  useEffect(() => {
    if (checkIsAdminUrl()) {
      setViewMode('admin');
      if (!getIsAdminLoggedIn()) {
        setIsAdminLoginOpen(true);
      }
    }
  }, []);

  // ⭐ النوع الأول: المجسم مثبت على الصورة ويتابعها (AR) ⭐
  const [showFloatingModel, setShowFloatingModel] = useState<boolean>(true);

  useEffect(() => {
    fetchLessons().then((loadedLessons) => {
      if (loadedLessons) {
        setLessons(loadedLessons);
      }
    });
  }, []);

  const handleUpdateLessons = (updated: LessonData[]) => {
    setLessons(updated);
    saveStoredLessons(updated);
  };

  const handleTargetDetected = (lesson: LessonData) => {
    setActiveLesson(lesson);
    setShowHologram3D(false);
    setShowFloatingModel(true); // تفعيل مجسم الواقع المعزز على الصورة تلقائياً
    if (activeModal !== 'teacher_console' && activeModal !== 'compiler') {
      setActiveModal('none');
    }
    analytics.trackEvent({
      targetId: lesson.targetId,
      lessonTitle: lesson.title,
      action: 'target_detected'
    });
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
          onTargetDetected={handleTargetDetected}
          onTargetLost={handleTargetLost}
          onCloseCamera={handleCloseCamera}
          onOpenTargetCards={() => setActiveModal('target_cards')}
          onOpenTeacherConsole={() => setActiveModal('teacher_console')}
          showFloatingModel={showFloatingModel} // ⭐ تمرير الحالة ⭐
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
          isModel3DActive={showHologram3D}
          isFloatingModelActive={showFloatingModel}
          onOpenVideo={() => {
            setShowHologram3D(false);
            setActiveModal('video');
          }}
          onOpenImages={() => {
            setShowHologram3D(false);
            setActiveModal('images');
          }}
          onOpenAudio={() => {
            setShowHologram3D(false);
            setActiveModal('audio');
          }}
          onOpenExplanation={() => {
            setShowHologram3D(false);
            setActiveModal('explanation');
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

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={handleCloseAdminLogin}
        onSuccess={handleAdminLoginSuccess}
      />
    </div>
  );
}