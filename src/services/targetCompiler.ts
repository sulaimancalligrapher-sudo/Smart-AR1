/**
 * MindAR In-Browser Target Compiler Service
 * يسمح بتجميع أي صور للدروس وتحويلها إلى ملف targets.mind مباشرة في متصفح المستخدم
 */

export interface CompileProgress {
  percent: number;
  statusText: string;
}

// Helper to load an image source into an HTMLImageElement
export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image from ' + src));
    img.src = src;
  });
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
}

export const targetCompiler = new TargetCompilerService();
