/**
 * Helper utilities for media URLs and external cloud storage links
 */

/**
 * Automatically converts Google Drive share/view links into high-res direct thumbnail image URLs.
 * Example input:
 *   https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
 *   https://drive.google.com/open?id=1a2b3c4d5e
 * Example output:
 *   https://drive.google.com/thumbnail?id=1a2b3c4d5e&sz=w1200
 */
export function convertGoogleDriveImageUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already a direct thumbnail URL, ensure it has good resolution (w1200)
  if (trimmed.includes('drive.google.com/thumbnail')) {
    if (!trimmed.includes('&sz=')) {
      return `${trimmed}&sz=w1200`;
    }
    return trimmed;
  }

  // Match /file/d/FILE_ID or /u/0/d/FILE_ID or /d/FILE_ID
  const fileDMatch = trimmed.match(/drive\.google\.com\/(?:file\/)?(?:u\/\d+\/)?(?:d|file\/d)\/([a-zA-Z0-9_-]+)/i);
  if (fileDMatch && fileDMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${fileDMatch[1]}&sz=w1200`;
  }

  // Match open?id=FILE_ID or uc?id=FILE_ID
  const idParamMatch = trimmed.match(/drive\.google\.com\/(?:open|uc)\?(?:[^&]*&)*id=([a-zA-Z0-9_-]+)/i);
  if (idParamMatch && idParamMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${idParamMatch[1]}&sz=w1200`;
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
