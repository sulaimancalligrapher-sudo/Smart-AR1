/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AppBrandingConfig {
  logoUrl: string;
  customTitle: string;
  customSubtitle: string;
}

const STORAGE_BRANDING_KEY = 'smart_ar_branding_config_v1';

export const DEFAULT_BRANDING: AppBrandingConfig = {
  logoUrl: '',
  customTitle: '',
  customSubtitle: ''
};

export function getAppBranding(): AppBrandingConfig {
  try {
    const raw = localStorage.getItem(STORAGE_BRANDING_KEY);
    if (!raw) return { ...DEFAULT_BRANDING };
    const parsed = JSON.parse(raw);
    return {
      logoUrl: typeof parsed.logoUrl === 'string' ? parsed.logoUrl : '',
      customTitle: typeof parsed.customTitle === 'string' ? parsed.customTitle : '',
      customSubtitle: typeof parsed.customSubtitle === 'string' ? parsed.customSubtitle : ''
    };
  } catch {
    return { ...DEFAULT_BRANDING };
  }
}

export function saveAppBranding(config: Partial<AppBrandingConfig>): AppBrandingConfig {
  try {
    const current = getAppBranding();
    const updated: AppBrandingConfig = {
      ...current,
      ...config
    };
    localStorage.setItem(STORAGE_BRANDING_KEY, JSON.stringify(updated));
    // إرسال حدث مخصص للمزامنة الفورية بين المكونات
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smart_ar_branding_updated', { detail: updated }));
    }
    return updated;
  } catch (err) {
    console.error('Failed to save app branding:', err);
    return getAppBranding();
  }
}

export function resetAppBranding(): AppBrandingConfig {
  try {
    localStorage.removeItem(STORAGE_BRANDING_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('smart_ar_branding_updated', { detail: DEFAULT_BRANDING }));
    }
  } catch {}
  return { ...DEFAULT_BRANDING };
}
