/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  QrCode,
  Copy,
  Check,
  Camera,
  Download,
  Share2,
  Sparkles,
  Smartphone,
  Globe,
  Printer
} from 'lucide-react';
import { LessonData } from '../types/ar';
import { encodeLessonsPayload } from '../data/lessons';
import { AppLanguage } from '../types/translation';

interface StudentQRModalProps {
  lessons?: LessonData[];
  onClose: () => void;
}

interface LanguageQRConfig {
  code: AppLanguage;
  name: string;
  nameEn: string;
  flag: string;
  accentColor: string;
  badgeClass: string;
}

const QR_LANGUAGES: LanguageQRConfig[] = [
  {
    code: 'ar',
    name: 'العربية (AR)',
    nameEn: 'Arabic',
    flag: '🇸🇦',
    accentColor: 'border-emerald-500/40 text-emerald-400',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
  },
  {
    code: 'en',
    name: 'English (EN)',
    nameEn: 'English',
    flag: '🇬🇧',
    accentColor: 'border-sky-500/40 text-sky-400',
    badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-500/30'
  },
  {
    code: 'th',
    name: 'ภาษาไทย (TH)',
    nameEn: 'Thai',
    flag: '🇹🇭',
    accentColor: 'border-amber-500/40 text-amber-400',
    badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/30'
  }
];

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ lessons = [], onClose }) => {
  const [activeTab, setActiveTab] = useState<AppLanguage>('ar');
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'tabs' | 'all'>('tabs');

  const origin = window.location.origin;
  const pathname = window.location.pathname;

  // Build URLs for the three languages
  const getLanguageUrl = (lang: AppLanguage) => {
    return `${origin}${pathname}?mode=student&camera=1&lang=${lang}`;
  };

  const getQRImageUrl = (lang: AppLanguage) => {
    const url = getLanguageUrl(lang);
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(url)}`;
  };

  const handleCopy = (lang: AppLanguage) => {
    const url = getLanguageUrl(lang);
    navigator.clipboard.writeText(url);
    setCopiedMap((prev) => ({ ...prev, [lang]: true }));
    setTimeout(() => {
      setCopiedMap((prev) => ({ ...prev, [lang]: false }));
    }, 2500);
  };

  const handleDownload = (lang: AppLanguage) => {
    const a = document.createElement('a');
    a.href = getQRImageUrl(lang);
    a.download = `smart-ar-qr-${lang}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeConfig = QR_LANGUAGES.find((l) => l.code === activeTab) || QR_LANGUAGES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn select-none overflow-y-auto" dir="rtl">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          title="إغلاق"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-2">
          <QrCode className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-base sm:text-lg font-black text-white text-center">
          ثلاثة أكواد QR وروابط اللغات (تفتح الكاميرا واللغة فوراً)
        </h3>
        <p className="text-xs text-slate-300 mt-1 max-w-md text-center leading-relaxed">
          لكل لغة باركود ورابط خاص يفتح <span className="text-emerald-400 font-bold">الكاميرا مباشرة</span> باللغة المختارة (عربي، إنجليزي، أو تايلندي) بمجرد المسح!
        </p>

        {/* View mode toggle: Single Language Tab or All 3 QRs Side-by-Side */}
        <div className="flex items-center justify-between w-full mt-4 pb-2 border-b border-slate-800">
          {/* Tabs for Languages */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            {QR_LANGUAGES.map((l) => {
              const isSelected = activeTab === l.code && viewMode === 'tabs';
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => {
                    setActiveTab(l.code);
                    setViewMode('tabs');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <span>{l.flag}</span>
                  <span>{l.name}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setViewMode((prev) => (prev === 'tabs' ? 'all' : 'tabs'))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'all'
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
            }`}
          >
            <span>{viewMode === 'all' ? 'عرض مخصص' : 'عرض الثلاثة معاً'}</span>
          </button>
        </div>

        {/* Content Mode 1: Single Active Tab with Big QR */}
        {viewMode === 'tabs' && (
          <div className="w-full mt-4 flex flex-col items-center animate-fadeIn">
            {/* QR Code Container */}
            <div className={`p-4 bg-white rounded-3xl shadow-2xl border-4 ${activeConfig.accentColor} flex flex-col items-center`}>
              <img
                src={getQRImageUrl(activeConfig.code)}
                alt={`باركود كاميرا الطلاب باللغة ${activeConfig.name}`}
                className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
              />
              <div className="mt-2 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <span className="text-base select-none">{activeConfig.flag}</span>
                <span>{activeConfig.name} - يفتح الكاميرا باللغة المحددة</span>
              </div>
            </div>

            {/* Direct Link Box */}
            <div className="mt-4 w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="flex-1 min-w-0 text-left">
                <span className="text-xs font-mono text-sky-400 truncate block dir-ltr select-all">
                  {getLanguageUrl(activeConfig.code)}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold block text-right mt-0.5">
                  ✓ يفتح الكاميرا فوراً بدون شاشة البداية باللغة: {activeConfig.name}
                </span>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(activeConfig.code)}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  title="نسخ الرابط المباشر"
                >
                  {copiedMap[activeConfig.code] ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMap[activeConfig.code] ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDownload(activeConfig.code)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                  title="تنزيل صورة الباركود"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Mode 2: All 3 QR Codes side-by-side for comparison and worksheets */}
        {viewMode === 'all' && (
          <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fadeIn">
            {QR_LANGUAGES.map((l) => (
              <div
                key={l.code}
                className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col items-center text-center space-y-2.5 shadow-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{l.flag}</span>
                  <span className="text-xs font-bold text-white">{l.name}</span>
                </div>

                <div className="p-2.5 bg-white rounded-xl shadow border-2 border-slate-700">
                  <img
                    src={getQRImageUrl(l.code)}
                    alt={l.name}
                    className="w-32 h-32 object-contain"
                  />
                </div>

                <div className="w-full pt-1">
                  <button
                    type="button"
                    onClick={() => handleCopy(l.code)}
                    className="w-full py-1.5 px-2.5 rounded-xl bg-sky-600/90 hover:bg-sky-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    {copiedMap[l.code] ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedMap[l.code] ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-4 flex items-center justify-between w-full border-t border-slate-800/80 pt-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>يمكن طباعة الأكواد ولصقها على غلاف الكتاب المدرسي</span>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>طباعة الورقة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
