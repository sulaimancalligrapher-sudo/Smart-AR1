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
import { Model3DModal } from './components/Model3DModal';
import { Holographic3DOverlay } from './components/Holographic3DOverlay';
import { LessonData } from './types/ar';
import { DEFAULT_LESSONS, fetchLessons, getStoredLessons, saveStoredLessons, purgeAllLocalDataAndCache } from './data/lessons';
import { analytics } from './services/analytics';

type ActiveModalType =
  | 'none'
  | 'video'
  | 'images'
  | 'audio'
  | 'explanation'
  | 'model3d'
  | 'target_cards'
  | 'teacher_console'
  | 'compiler';

export default function App() {
  const [lessons, setLessons] = useState<LessonData[]>(() => {
    const stored = getStoredLessons();
    return stored && stored.length > 0 ? stored : DEFAULT_LESSONS;
  });
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');
  const [showHologram3D, setShowHologram3D] = useState<boolean>(false);
  
  // ⭐ حالة جديدة: المجسم المعلق فوق الصورة ⭐
  const [showFloatingModel, setShowFloatingModel] = useState<boolean>(false);

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
    setShowFloatingModel(false); // ⭐ إعادة ضبط ⭐
    setActiveModal('none');
  };

  const handleCloseCamera = () => {
    setIsCameraActive(false);
    setActiveLesson(null);
    setShowHologram3D(false);
    setShowFloatingModel(false); // ⭐ إعادة ضبط ⭐
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
    setShowFloatingModel(false); // ⭐ إعادة ضبط ⭐
    setActiveModal('none');
  };

  // ⭐ دالة جديدة: تبديل المجسم المعلق ⭐
  const handleToggleFloatingModel = () => {
    setShowFloatingModel(prev => !prev);
    setShowHologram3D(false); // إلغاء تفعيل الوضع الآخر
  };

  const handlePurgeAllData = async () => {
    if (window.confirm('⚠️ تأكيد: هل تريد مسح كافة البيانات المخزنة وتصفير الكاش في المتصفح تماماً وتحديث النظام بالكامل لأحدث نسخة نظيفة؟')) {
      await purgeAllLocalDataAndCache();
      window.location.reload();
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. Main View: Welcome Screen OR Live AR Camera View */}
      {!isCameraActive ? (
        <WelcomeScreen
          lessons={lessons}
          onStartCamera={handleStartCamera}
          onOpenTargetCards={() => setActiveModal('target_cards')}
          onOpenTeacherConsole={() => setActiveModal('teacher_console')}
          onOpenCompiler={() => setActiveModal('compiler')}
          onSimulateLesson={handleSimulateLesson}
          onPurgeAllData={handlePurgeAllData}
        />
      ) : (
        <ARCameraView
          lessons={lessons}
          activeLesson={activeLesson}
          onTargetDetected={handleTargetDetected}
          onTargetLost={handleTargetLost}
          onCloseCamera={handleCloseCamera}
          onOpenTargetCards={() => setActiveModal('target_cards')}
          onOpenTeacherConsole={() => setActiveModal('teacher_console')}
          showFloatingModel={showFloatingModel} // ⭐ تمرير الحالة ⭐
        />
      )}

      {/* 2. Real Holographic 3D AR Layer over Live Camera */}
      {isCameraActive && activeLesson && activeLesson.model3d && showHologram3D && activeModal === 'none' && (
        <Holographic3DOverlay
          model={activeLesson.model3d}
          lessonTitle={activeLesson.title}
          audioUrl={activeLesson.audio?.url}
          onClose={() => setShowHologram3D(false)}
        />
      )}

      {/* 3. Transparent HTML/CSS Overlay */}
      {isCameraActive && activeLesson && activeModal === 'none' && (
        <TransparentOverlay
          lesson={activeLesson}
          isModel3DActive={showHologram3D}
          isFloatingModelActive={showFloatingModel} // ⭐ تمرير الحالة ⭐
          onOpenVideo={() => {
            setShowHologram3D(false);
            setShowFloatingModel(false);
            setActiveModal('video');
          }}
          onOpenImages={() => {
            setShowHologram3D(false);
            setShowFloatingModel(false);
            setActiveModal('images');
          }}
          onOpenAudio={() => {
            setShowHologram3D(false);
            setShowFloatingModel(false);
            setActiveModal('audio');
          }}
          onOpenExplanation={() => {
            setShowHologram3D(false);
            setShowFloatingModel(false);
            setActiveModal('explanation');
          }}
          onOpenModel3D={() => {
            setShowFloatingModel(false);
            setShowHologram3D((prev) => !prev);
          }}
          onToggleFloatingModel={handleToggleFloatingModel} // ⭐ تمرير الدالة ⭐
          onCloseLesson={handleCloseOverlayLesson}
        />
      )}

      {/* 4. Interactive Content Modals */}
      {activeModal === 'model3d' && activeLesson && activeLesson.model3d && (
        <Model3DModal
          model={activeLesson.model3d}
          lessonTitle={activeLesson.title}
          audioUrl={activeLesson.audio?.url}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'video' && activeLesson && (
        <VideoModal
          video={activeLesson.video}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'images' && activeLesson && (
        <GalleryModal
          images={activeLesson.images}
          targetImage={activeLesson.targetImage}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'audio' && activeLesson && (
        <AudioPlayerModal
          audio={activeLesson.audio}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          lessonSummary={activeLesson.description.summary}
          onClose={() => setActiveModal('none')}
        />
      )}

      {activeModal === 'explanation' && activeLesson && (
        <ExplanationModal
          description={activeLesson.description}
          lessonTitle={activeLesson.title}
          targetId={activeLesson.targetId}
          grade={activeLesson.grade}
          subject={activeLesson.subject}
          onClose={() => setActiveModal('none')}
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
    </div>
  );
}