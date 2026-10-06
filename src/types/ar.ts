export type VideoSourceType = 'youtube' | 'vimeo' | 'mp4';

export interface LessonVideo {
  type: VideoSourceType;
  url: string;
  embedUrl: string;
  title: string;
}

export interface LessonImage {
  url: string;
  title: string;
  caption: string;
}

export interface LessonAudio {
  url: string;
  title: string;
  duration?: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonDescription {
  summary: string;
  keyPoints: string[];
  fullText: string;
  funFact?: string;
  quiz?: LessonQuiz;
}

export interface LessonModel3D {
  url: string;
  title?: string;
  autoRotate?: boolean;
}

export interface LessonData {
  targetIndex: number;
  targetId: string;
  title: string;
  subtitle: string;
  subject: string;
  grade: string;
  targetImage: string;
  video: LessonVideo;
  images: LessonImage[];
  audio: LessonAudio;
  description: LessonDescription;
  model3d?: LessonModel3D;
}

export type ARActionType =
  | 'target_detected'
  | 'video_open'
  | 'video_close'
  | 'images_open'
  | 'audio_play'
  | 'explanation_open'
  | 'model3d_open'
  | 'content_close'
  | 'target_lost';

export interface AnalyticsPayload {
  timestamp: string;
  session_id: string;
  target_id: string;
  lesson_title: string;
  action: ARActionType;
  device: string;
  language: string;
}

export interface AnalyticsLogItem extends AnalyticsPayload {
  id: string;
  status: 'sent' | 'pending' | 'local_only' | 'error';
}

declare global {
  interface Window {
    MINDAR?: {
      IMAGE?: {
        Compiler?: new () => {
          compileImageTargets: (
            images: HTMLImageElement[],
            onProgress?: (progress: number) => void
          ) => Promise<any>;
          exportData: () => Uint8Array;
        };
        MindARThree?: new (params: {
          container: HTMLElement;
          imageTargetSrc: string;
          filterMinCF?: number;
          filterBeta?: number;
          uiScanning?: string;
          uiLoading?: string;
        }) => {
          start: () => Promise<void>;
          stop: () => void;
          shouldFaceUser?: boolean;
          switchCamera?: () => void;
          scene: any;
          camera: any;
          renderer: {
            dispose: () => void;
            domElement: HTMLCanvasElement;
            setAnimationLoop: (callback: (() => void) | null) => void;
            render: (scene: any, camera: any) => void;
          };
          video: HTMLVideoElement;
          addAnchor: (index: number) => {
            onTargetFound?: () => void;
            onTargetLost?: () => void;
          };
        };
      };
    };
  }
}

