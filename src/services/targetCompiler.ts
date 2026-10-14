import { LessonData } from '../types/ar';
import { normalizeImageUrl } from './urlHelpers';

/**
 * MindAR In-Browser Target Compiler Service
 * يسمح بتجميع أي صور للدروس وتحويلها إلى ملف targets.mind مباشرة في متصفح المستخدم
 */

export interface CompileProgress {
  percent: number;
  statusText: string;
}

export interface TargetEntry {
  globalTargetIndex: number;
  lessonId: string;
  lessonTitle: string;
  imageUrl: string;
  isPrimary: boolean;
  pageLabel: string;
}

// Helper to load an image source into an HTMLImageElement
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image from ' + src));
    img.src = src;
  });
}

/**
 * تبني خريطة الأهداف لجميع الدروس مع دعم الأهداف المتعددة (Multi-Target Mapping).
 * تعيد الدروس مع تحديث targetIndex و additionalTargetIndices تلقائياً بالتسلسل الصحيح.
 */
export function buildMultiTargetMap(lessons: LessonData[]): {
  entries: TargetEntry[];
  updatedLessons: LessonData[];
  orderedImageUrls: string[];
} {
  const primaryEntries: TargetEntry[] = [];
  const additionalEntries: TargetEntry[] = [];

  // 1. تثبيت الفهارس الأساسية لكل درس (0, 1, 2, ...) بدقة مطابقة لملف targets.mind
  lessons.forEach((lesson, idx) => {
    const primaryImg = normalizeImageUrl(lesson.targetImage);
    primaryEntries.push({
      globalTargetIndex: idx,
      lessonId: lesson.targetId,
      lessonTitle: lesson.title,
      imageUrl: primaryImg,
      isPrimary: true,
      pageLabel: `${lesson.title} (الصفحة الرئيسية)`
    });
  });

  // 2. إلحاق أي صفحات إضافية لنفس الدروس بعد جميع الدروس الأساسية (من lessons.length فصاعداً)
  // هذا يضمن 100% عدم حدوث أي إزاحة أو لخبطة بين الدروس الأصلية
  let extraIndex = lessons.length;
  const updatedLessons = lessons.map((lesson, idx) => {
    const validAdditionalImages = (lesson.additionalTargetImages || [])
      .map(img => normalizeImageUrl(img))
      .filter(Boolean);
    const additionalIndices: number[] = [];

    validAdditionalImages.forEach((addImg, aIdx) => {
      const addIndex = extraIndex++;
      additionalIndices.push(addIndex);
      additionalEntries.push({
        globalTargetIndex: addIndex,
        lessonId: lesson.targetId,
        lessonTitle: lesson.title,
        imageUrl: addImg,
        isPrimary: false,
        pageLabel: `${lesson.title} (صفحة إضافية #${aIdx + 1})`
      });
    });

    return {
      ...lesson,
      targetIndex: idx, // فهرس الدرس الأساسي ثابت ومضمون
      additionalTargetIndices: additionalIndices,
      additionalTargetImages: validAdditionalImages
    };
  });

  const allEntries = [...primaryEntries, ...additionalEntries];

  return {
    entries: allEntries,
    updatedLessons,
    orderedImageUrls: allEntries.map(e => e.imageUrl)
  };
}

class TargetCompilerService {
  private customMindBlobUrl: string | null = null;

  public getActiveMindUrl(): string {
    return this.customMindBlobUrl || '/targets/targets.mind';
  }

  public hasCustomTargets(): boolean {
    return this.customMindBlobUrl !== null;
  }

  public setCustomMindBlob(blob: Blob): string {
    if (this.customMindBlobUrl) {
      URL.revokeObjectURL(this.customMindBlobUrl);
    }
    this.customMindBlobUrl = URL.createObjectURL(blob);
    return this.customMindBlobUrl;
  }

  public async compileImages(
    imageUrls: string[],
    onProgress?: (progress: CompileProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string }> {
    if (!window.MINDAR?.IMAGE?.Compiler) {
      throw new Error('مكتبة تجميع MindAR لم تكتمل في المتصفح بعد. يرجى الانتظار ثانية ثم المحاولة.');
    }

    onProgress?.({ percent: 10, statusText: 'جارٍ تحميل صور الدروس في الذاكرة...' });

    const imgElements: HTMLImageElement[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const img = await loadImageElement(imageUrls[i]);
        imgElements.push(img);
      } catch (err) {
        console.warn('Could not load image for compilation, skipping:', imageUrls[i], err);
      }
    }

    if (imgElements.length === 0) {
      throw new Error('لم يتم العثور على أي صورة صالحة للبدء في تجميعها.');
    }

    onProgress?.({ percent: 30, statusText: `جارٍ استخراج البصمات البصرية لـ ${imgElements.length} صور...` });

    const compiler = new window.MINDAR.IMAGE.Compiler();

    await compiler.compileImageTargets(imgElements, (pct: number) => {
      const scaled = 30 + Math.floor((pct || 0) * 0.65);
      onProgress?.({
        percent: scaled,
        statusText: `جارٍ بناء شبكة النقاط البصرية (Feature Points): ${Math.floor(pct)}%`
      });
    });

    onProgress?.({ percent: 95, statusText: 'جارٍ تصدير ملف targets.mind الثنائي...' });

    const buffer = compiler.exportData();
    const blob = new Blob([buffer.buffer as ArrayBuffer], { type: 'application/octet-stream' });
    const blobUrl = this.setCustomMindBlob(blob);

    onProgress?.({ percent: 100, statusText: '✓ اكتمل تجميع البصمات وجاهز للتعرف بالكاميرا!' });

    return { blob, blobUrl };
  }

  /**
   * تجميع كافة أهداف الدروس بما فيها الصفحات الإضافية Multi-Target وتعيين الفهارس تلقائياً
   */
  public async compileAllLessonsTargets(
    lessons: LessonData[],
    onProgress?: (progress: CompileProgress) => void
  ): Promise<{ blob: Blob; blobUrl: string; updatedLessons: LessonData[]; entries: TargetEntry[] }> {
    const { entries, updatedLessons, orderedImageUrls } = buildMultiTargetMap(lessons);
    const { blob, blobUrl } = await this.compileImages(orderedImageUrls, onProgress);
    return { blob, blobUrl, updatedLessons, entries };
  }
}

export const targetCompiler = new TargetCompilerService();
