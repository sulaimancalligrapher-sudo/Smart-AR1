/**
 * Helper utilities for media URLs and external cloud storage links
 */

/**
 * Extracts Google Drive file ID from virtually any Google Drive URL format or raw ID.
 * Handles:
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 *  - https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
 *  - https://drive.google.com/file/u/0/d/FILE_ID/view
 *  - https://drive.google.com/open?id=FILE_ID
 *  - https://drive.google.com/uc?id=FILE_ID
 *  - https://docs.google.com/uc?id=FILE_ID
 *  - https://drive.google.com/thumbnail?id=FILE_ID=w1200
 *  - https://drive.google.com/thumbnail?id=FILE_ID&sz=w1200
 *  - https://lh3.googleusercontent.com/d/FILE_ID
 *  - https://drive.usercontent.google.com/download?id=FILE_ID
 *  - Raw 25-50 char Google Drive ID
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();

  // If user pasted just the ID directly (typically 25-50 alphanum chars + '-' or '_')
  if (/^[a-zA-Z0-9_-]{25,55}$/.test(trimmed)) {
    return trimmed;
  }

  // /file/d/FILE_ID or /d/FILE_ID
  const fileDMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (fileDMatch && fileDMatch[1]) {
    // Strip trailing =w1200 or similar if accidentally present
    return fileDMatch[1].split('=')[0];
  }

  // ?id=FILE_ID or &id=FILE_ID
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idParamMatch && idParamMatch[1]) {
    return idParamMatch[1].split('=')[0];
  }

  // lh3.googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1].split('=')[0];
  }

  return null;
}

/**
 * Returns alternative candidate URLs for a given image link (useful for fallback on loading error).
 */
export function getAlternativeImageUrls(url: string): string[] {
  if (!url || typeof url !== 'string') return [];
  const trimmed = url.trim();

  // Data URIs have no alternatives
  if (trimmed.startsWith('data:')) {
    return [trimmed];
  }

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return [
      `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`,
      `https://lh3.googleusercontent.com/d/${driveId}`,
      `https://drive.google.com/thumbnail?id=${driveId}=w1200`,
      `https://drive.google.com/thumbnail?id=${driveId}`,
      `https://drive.google.com/uc?export=view&id=${driveId}`,
      `https://drive.usercontent.google.com/download?id=${driveId}`
    ];
  }

  return [trimmed];
}

/**
 * Automatically converts Google Drive share/view links into high-res direct thumbnail image URLs.
 */
export function convertGoogleDriveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:')) return trimmed;

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
  }

  return trimmed;
}

/**
 * Automatically converts Google Drive audio links into streamable direct audio URLs.
 */
export function convertGoogleDriveAudioUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;

  const driveId = extractGoogleDriveFileId(trimmed);
  if (driveId) {
    return `https://drive.google.com/uc?export=download&id=${driveId}`;
  }

  return trimmed;
}

/**
 * Normalizes any image URL (handles Google Drive conversion, trims spaces, etc.)
 */
export function normalizeImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  return convertGoogleDriveImageUrl(url);
}

/**
 * Normalizes any audio URL (handles Google Drive audio conversion, trims spaces, etc.)
 */
export function normalizeAudioUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  return convertGoogleDriveAudioUrl(url);
}

/**
 * Checks if a URL points to an animated image (e.g. GIF or animated WebP)
 */
export function isAnimatedImage(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('.gif') || lower.includes('image/gif');
}
