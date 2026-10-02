import React, { useState, useEffect } from 'react';
import { X, Database, Send, Trash2, CheckCircle2, AlertCircle, Copy, Check, FileSpreadsheet, ExternalLink } from 'lucide-react';
import { analytics } from '../services/analytics';
import { AnalyticsLogItem } from '../types/ar';

interface TeacherConsoleModalProps {
  onClose: () => void;
}

export const TeacherConsoleModal: React.FC<TeacherConsoleModalProps> = ({ onClose }) => {
  const [webAppUrl, setWebAppUrl] = useState(analytics.getWebAppUrl());
  const [logs, setLogs] = useState<AnalyticsLogItem[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    const unsubscribe = analytics.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.setWebAppUrl(webAppUrl);
    setTestResult('تم حفظ رابط Google Apps Script Web App بنجاح.');
    setTimeout(() => setTestResult(null), 3500);
  };

  const handleTestPing = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await analytics.trackEvent({
        targetId: 'lesson_001',
        lessonTitle: 'دورة الماء (اختبار اتصال)',
        action: 'target_detected'
      });
      setTestResult('✓ تم إرسال حدث الاختبار بنجاح إلى السجل ورابط السكريبت!');
    } catch (err) {
      setTestResult('تعذر الإرسال: ' + String(err));
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    analytics.clearLogs();
  };

  const copyCodeSample = () => {
    const code = `// Google Apps Script - Code.gs
var SHEET_NAME = "Events";

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.session_id || "session",
      data.target_id || "lesson",
      data.lesson_title || "",
      data.action || "action",
      data.device || "device",
      data.language || "ar"
    ]);
    return ContentService.createTextOutput(JSON.stringify({status: "success"})).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", error: err.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">لوحة تحليلات Google Sheets وواجهة المعلم</h3>
              <p className="text-xs text-slate-400">تسجيل أحداث التعرف على الدروس وتفاعل الطلاب في جدول البيانات</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Configuration Form */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>رابط نشر Google Apps Script Web App (API URL)</span>
              </h4>
              <button
                type="button"
                onClick={copyCodeSample}
                className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'تم نسخ كود السكريبت' : 'نسخ كود Apps Script'}
              </button>
            </div>

            <form onSubmit={handleSaveUrl} className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap"
              >
                حفظ الرابط
              </button>
              <button
                type="button"
                onClick={handleTestPing}
                disabled={isTesting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs sm:text-sm transition-colors cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isTesting ? 'جارٍ الإرسال...' : 'اختبار إرسال حدث'}
              </button>
            </form>

            {testResult && (
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{testResult}</span>
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 إذا تركت الرابط فارغاً، سيتم حفظ الأحداث محلياً فقط في المتصفح للعرض دون اتصال. بمجرد إدخال رابط Web App المنشور، سيتم ترحيل كل حركة تلقائياً إلى جدول Google Sheets.
            </p>
          </div>

          {/* Live Events Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>سجل الأحداث المباشر ({logs.length})</span>
              </h4>
              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  مسح السجل
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-xs">
                لم يتم تسجيل أحداث حتى الآن. وجّه الكاميرا إلى كتابك أو اضغط أحد الأزرار لتسجيل الأحداث.
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-2.5 font-medium">الوقت</th>
                        <th className="p-2.5 font-medium">الهدف (Target)</th>
                        <th className="p-2.5 font-medium">الحدث (Action)</th>
                        <th className="p-2.5 font-medium">الجهاز</th>
                        <th className="p-2.5 font-medium text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono text-[11px]">
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/50">
                          <td className="p-2.5 whitespace-nowrap">{log.timestamp.split(' ')[1] || log.timestamp}</td>
                          <td className="p-2.5 whitespace-nowrap font-sans font-medium text-white">{log.target_id}</td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap text-slate-400 font-sans truncate max-w-[120px]">{log.device}</td>
                          <td className="p-2.5 whitespace-nowrap text-center">
                            {log.status === 'sent' ? (
                              <span className="text-emerald-400 font-sans font-bold">✓ تم الإرسال</span>
                            ) : log.status === 'local_only' ? (
                              <span className="text-sky-400 font-sans">محلي</span>
                            ) : (
                              <span className="text-amber-400 font-sans">قيد الإرسال</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/60 flex items-center justify-between">
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            فتح Google Sheets جديد
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            ✕ إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
