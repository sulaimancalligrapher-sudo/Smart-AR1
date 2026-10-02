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
import { LessonData } from './types/ar';
import { DEFAULT_LESSONS, fetchLessons } from './data/lessons';
import { analytics } from './services/analytics';

type ActiveModalType =
  | 'none'
  | 'video'
  | 'images'
  | 'audio'
  | 'explanation'
  | 'target_cards'
  | 'teacher_console'
  | 'compiler';

export default function App() {
  const [lessons, setLessons] = useState<LessonData[]>(DEFAULT_LESSONS);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [activeLesson, setActiveLesson] = useState<LessonData | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModalType>('none');

  // Load custom lessons from content.json on startup
  useEffect(() => {
    fetchLessons().then((loadedLessons) => {
      if (loadedLessons && loadedLessons.length > 0) {
        setLessons(loadedLessons);
      }
    });
  }, []);

  // When a lesson target is recognized by MindAR or simulator
  const handleTargetDetected = (lesson: LessonData) => {
    setActiveLesson(lesson);
    analytics.trackEvent({
      targetId: lesson.targetId,
      lessonTitle: lesson.title,
      action: 'target_detected'
    });
  };

  // When camera loses view of the target
  const handleTargetLost = (lesson: LessonData) => {
    analytics.trackEvent({
      targetId: lesson.targetId,
      lessonTitle: lesson.title,
      action: 'target_lost'
    });
    // Note: We retain the activeLesson in state for a smooth student experience
    // so the overlay doesn't flicker away if the child moves the book slightly.
  };

  const handleStartCamera = () => {
    setIsCameraActive(true);
    setActiveModal('none');
  };

  const handleCloseCamera = () => {
    setIsCameraActive(false);
    setActiveLesson(null);
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
    setActiveModal('none');
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
        />
      )}

      {/* 2. Transparent HTML/CSS Overlay (Visible over camera when target is detected) */}
      {isCameraActive && activeLesson && activeModal === 'none' && (
        <TransparentOverlay
          lesson={activeLesson}
          onOpenVideo={() => setActiveModal('video')}
          onOpenImages={() => setActiveModal('images')}
          onOpenAudio={() => setActiveModal('audio')}
          onOpenExplanation={() => setActiveModal('explanation')}
          onCloseLesson={handleCloseOverlayLesson}
        />
      )}

      {/* 3. Interactive Content Modals (Video, Gallery, Audio, Explanation) */}
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

      {/* 4. Utility Modals (Printable Targets, Teacher Console, Target Compiler) */}
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
        <TeacherConsoleModal onClose={() => setActiveModal('none')} />
      )}

      {activeModal === 'compiler' && (
        <MindARCompilerModal onClose={() => setActiveModal('none')} />
      )}
    </div>
  );
}
