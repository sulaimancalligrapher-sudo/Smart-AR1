/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AdminCredentials {
  username: string;
  pin: string;
}

const STORAGE_ADMIN_CREDENTIALS = 'smart_ar_admin_credentials_v1';
const STORAGE_ADMIN_SESSION = 'smart_ar_admin_logged_in_v1';

const DEFAULT_CREDENTIALS: AdminCredentials = {
  username: 'admin',
  pin: '1234'
};

export function getAdminCredentials(): AdminCredentials {
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_CREDENTIALS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.username && parsed.pin) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load admin credentials', err);
  }
  return DEFAULT_CREDENTIALS;
}

export function saveAdminCredentials(credentials: AdminCredentials): boolean {
  try {
    localStorage.setItem(STORAGE_ADMIN_CREDENTIALS, JSON.stringify({
      username: credentials.username.trim(),
      pin: credentials.pin.trim()
    }));
    return true;
  } catch (err) {
    console.error('Failed to save admin credentials', err);
    return false;
  }
}

export function verifyAdminCredentials(inputUsername: string, inputPin: string): boolean {
  const current = getAdminCredentials();
  const cleanUsername = inputUsername.trim().toLowerCase();
  const cleanPin = inputPin.trim();

  // Also allow Arabic 'المعلم' or 'ادمن' as alias if default admin is set
  const matchesUsername =
    cleanUsername === current.username.toLowerCase() ||
    (current.username === 'admin' && (cleanUsername === 'المعلم' || cleanUsername === 'ادمن' || cleanUsername === 'إدمن'));

  const matchesPin = cleanPin === current.pin;

  return matchesUsername && matchesPin;
}

export function getIsAdminLoggedIn(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_ADMIN_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setAdminLoggedIn(isLoggedIn: boolean): void {
  try {
    if (isLoggedIn) {
      sessionStorage.setItem(STORAGE_ADMIN_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_ADMIN_SESSION);
    }
  } catch (err) {
    console.warn('Failed to update admin session', err);
  }
}
