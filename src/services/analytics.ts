import { ARActionType, AnalyticsLogItem, AnalyticsPayload } from '../types/ar';

const STORAGE_KEY_LOGS = 'smart_ar_event_logs';
const STORAGE_KEY_WEB_APP_URL = 'smart_ar_sheets_web_app_url';
const DEFAULT_FALLBACK_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

// Detect client device category
function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android Chrome/Browser';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: boolean }).MSStream) return 'iOS Safari/WebKit';
  if (/tablet|ipad/i.test(ua)) return 'Tablet';
  return 'Desktop / Laptop';
}

// Generate or retrieve session ID for this browser session
function getOrCreateSessionId(): string {
  try {
    let sid = sessionStorage.getItem('smart_ar_session_id');
    if (!sid) {
      sid = 'ar_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('smart_ar_session_id', sid);
    }
    return sid;
  } catch {
    return 'ar_sess_' + Math.random().toString(36).substring(2, 8);
  }
}

// Format local datetime string
function getFormattedTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const YYYY = now.getFullYear();
  const MM = pad(now.getMonth() + 1);
  const DD = pad(now.getDate());
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss}`;
}

class AnalyticsService {
  private sessionId: string;
  private listeners: Array<(logs: AnalyticsLogItem[]) => void> = [];
  private logs: AnalyticsLogItem[] = [];

  constructor() {
    this.sessionId = getOrCreateSessionId();
    this.loadLogs();
  }

  private loadLogs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LOGS);
      if (raw) {
        this.logs = JSON.parse(raw).slice(-50);
      }
    } catch {
      this.logs = [];
    }
  }

  private saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs.slice(-50)));
    } catch {
      // storage quota or incognito mode
    }
    this.notifyListeners();
  }

  public subscribe(fn: (logs: AnalyticsLogItem[]) => void): () => void {
    this.listeners.push(fn);
    fn([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifyListeners() {
    const copy = [...this.logs];
    this.listeners.forEach((fn) => fn(copy));
  }

  public getWebAppUrl(): string {
    return localStorage.getItem(STORAGE_KEY_WEB_APP_URL) || DEFAULT_FALLBACK_URL;
  }

  public setWebAppUrl(url: string) {
    if (url.trim()) {
      localStorage.setItem(STORAGE_KEY_WEB_APP_URL, url.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY_WEB_APP_URL);
    }
  }

  public getLogs(): AnalyticsLogItem[] {
    return [...this.logs];
  }

  public clearLogs() {
    this.logs = [];
    localStorage.removeItem(STORAGE_KEY_LOGS);
    this.notifyListeners();
  }

  public async trackEvent(params: {
    targetId: string;
    lessonTitle: string;
    action: ARActionType;
    language?: string;
  }): Promise<AnalyticsLogItem> {
    const payload: AnalyticsPayload = {
      timestamp: getFormattedTimestamp(),
      session_id: this.sessionId,
      target_id: params.targetId,
      lesson_title: params.lessonTitle,
      action: params.action,
      device: detectDevice(),
      language: params.language || 'ar'
    };

    const logItem: AnalyticsLogItem = {
      ...payload,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      status: 'pending'
    };

    this.logs.unshift(logItem);
    this.saveLogs();

    const targetUrl = this.getWebAppUrl();

    if (!targetUrl) {
      logItem.status = 'local_only';
      this.saveLogs();
      return logItem;
    }

    // Google Apps Script Web App can accept POST or GET
    // Due to Google redirects, sending via POST with mode 'no-cors' or GET ensures success without browser CORS block.
    try {
      // Method A: no-cors POST with text payload
      await fetch(targetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      logItem.status = 'sent';
      this.saveLogs();
    } catch {
      // Method B fallback: GET query parameter
      try {
        const getUrl = new URL(targetUrl);
        getUrl.searchParams.set('data', JSON.stringify(payload));
        const img = new Image();
        img.src = getUrl.toString();
        logItem.status = 'sent';
        this.saveLogs();
      } catch (err2) {
        console.warn('Failed to send to Google Sheets Web App:', err2);
        logItem.status = 'error';
        this.saveLogs();
      }
    }

    return logItem;
  }
}

export const analytics = new AnalyticsService();
