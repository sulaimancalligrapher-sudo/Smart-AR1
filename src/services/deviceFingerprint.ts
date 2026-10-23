/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const STORAGE_KEY_DEVICE_ID = 'smart_ar_device_fingerprint_v1';

/**
 * توليد أو جلب بصمة الجهاز الفريدة (Device Fingerprint / Token)
 * يتم حفظها في المتصفح لتمييز هذا الجهاز (جوال أو تابلت أو كمبيوتر) بشكل دائم
 */
export function getClientDeviceId(): string {
  try {
    let deviceId = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (!deviceId) {
      const screenRes = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '0x0';
      const rand = Math.random().toString(36).substring(2, 10);
      deviceId = `dev_${Date.now().toString(36)}_${rand}_${screenRes}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback_' + Math.random().toString(36).substring(2, 10);
  }
}
