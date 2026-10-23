/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Camera,
  Sparkles,
  BookOpen,
  Compass,
  Lightbulb,
  ShieldCheck,
  LogOut,
  Scan,
  Smartphone,
  KeyRound,
  User
} from 'lucide-react';
import { LessonData } from '../types/ar';
import { soundService } from '../services/soundService';
import { SubscriberInfo } from '../services/subscriptionAuth';
import { AppLanguage } from '../types/translation';
import { t } from '../services/translationService';
import { LanguageDropdown } from './LanguageDropdown';
import { getAppBranding, AppBrandingConfig } from '../services/brandingService';

interface WelcomeScreenProps {
  onStartCamera: () => void;
  lessons: LessonData[];
  isAdmin: boolean;
  subscriber?: SubscriberInfo | null;
  visitorName?: string;
  onSubscriberLogout?: () => void;
  onVisitorLogout?: () => void;
  onOpenSubscriberLogin?: () => void;
  onOpenAdminPortal?: () => void;
  onAdminLogout?: () => void;
  currentLanguage?: AppLanguage;
  onLanguageChange?: (lang: AppLanguage) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartCamera,
  lessons,
  isAdmin,
  subscriber,
  visitorName,
  onSubscriberLogout,
  onVisitorLogout,
  onOpenSubscriberLogin,
  onOpenAdminPortal,
  onAdminLogout,
  currentLanguage = 'ar',
  onLanguageChange
}) => {
  const isRTL = currentLanguage === 'ar';
  const [branding, setBranding] = React.useState<AppBrandingConfig>(() => getAppBranding());

  React.useEffect(() => {
    const handleBrandingUpdate = (e: any) => {
      if (e.detail) setBranding(e.detail);
    };
    window.addEventListener('smart_ar_branding_updated', handleBrandingUpdate);
    return () => window.removeEventListener('smart_ar_branding_updated', handleBrandingUpdate);
  }, []);

  return (
    <div
      className="relative w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Decorative ambient background */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-50 max-w-2xl mx-auto w-full flex items-center justify-between py-2.5 border-b border-white/10 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="Logo"
              className="w-10 h-10 rounded-2xl object-contain bg-white/10 p-1 shadow-lg shadow-sky-500/20 border border-white/20 flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 flex-shrink-0">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white truncate">
              {branding.customTitle || (currentLanguage === 'ar' ? 'كتابي الذكي' : currentLanguage === 'en' ? 'Smart-AR' : 'สมาร์ท-AR')}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {branding.customSubtitle || (currentLanguage === 'ar' ? 'الواقع المعزز التعليمي (WebAR)' : currentLanguage === 'en' ? 'Educational WebAR' : 'การเรียนรู้ WebAR')}
            </p>
          </div>
        </div>

        {/* أدوات الهيدر: زر اللغات المنسدل + شارات الإدارة / المشترك */}
        <div className="flex items-center gap-2">
          {/* 🌐 زر اللغات المنسدل المدمج والمصمم بعناية */}
          {onLanguageChange && (
            <LanguageDropdown
              currentLanguage={currentLanguage}
              onLanguageChange={onLanguageChange}
            />
          )}
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdminPortal}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-md shadow-indigo-600/30 active:scale-95"
                title="فتح لوحة تحكم الإدارة والمعلم"
              >
                <ShieldCheck className="w-4 h-4 text-amber-300" />
                <span>لوحة الإدارة</span>
              </button>
              {onAdminLogout && (
                <button
                  onClick={onAdminLogout}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                  title="تسجيل الخروج من الإدارة"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                </button>
              )}
            </div>
          ) : subscriber ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{subscriber.name}</span>
              </div>
              {onSubscriberLogout && (
                <button
                  onClick={onSubscriberLogout}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer text-xs"
                  title={t('welcome_logout_subscriber', currentLanguage)}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
          ) : visitorName ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold shadow-sm">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>{visitorName}</span>
              </div>
              {onVisitorLogout && (
                <button
                  onClick={onVisitorLogout}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer text-xs flex items-center gap-1"
                  title={t('welcome_logout_visitor', currentLanguage)}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/20 text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>منصة تعليمية تفاعلية</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Student Experience */}
      <main className="relative z-10 max-w-xl mx-auto w-full py-8 sm:py-12 flex flex-col items-center text-center space-y-6">
        
        {/* كارت حالة المستخدم (مشترك مفعل / زائر محفوظ اسمه مع زر خروج / أو زائر جديد مع زر دخول المشترك) */}
        {subscriber ? (
          <div className="w-full max-w-md p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 flex items-center justify-between gap-3 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{subscriber.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold border ${
                      subscriber.isCustomSubscriber
                        ? 'bg-purple-500/20 text-purple-300 border-purple-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    }`}
                  >
                    {subscriber.isCustomSubscriber
                      ? t('welcome_custom_subscriber_badge', currentLanguage)
                      : t('welcome_subscriber_badge', currentLanguage)}
                  </span>
                </div>
                <div className={`text-[10px] ${subscriber.isCustomSubscriber ? 'text-purple-300' : 'text-emerald-300'}`}>
                  {subscriber.isCustomSubscriber && subscriber.allowedLessons && subscriber.allowedLessons.length > 0
                    ? `${t('welcome_custom_subscriber_desc', currentLanguage)} (${subscriber.allowedLessons.length} دروس)`
                    : subscriber.isCustomSubscriber
                    ? t('welcome_custom_subscriber_desc', currentLanguage)
                    : t('welcome_subscriber_desc', currentLanguage)}
                </div>
              </div>
            </div>
            {onSubscriberLogout && (
              <button
                onClick={onSubscriberLogout}
                className="px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm active:scale-95 flex-shrink-0"
                title={t('welcome_logout_subscriber', currentLanguage)}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t('welcome_logout_subscriber', currentLanguage)}</span>
              </button>
            )}
          </div>
        ) : visitorName ? (
          <div className="w-full max-w-md p-3.5 rounded-2xl bg-slate-900/95 border border-sky-500/40 flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30 flex-shrink-0">
                <User className="w-4 h-4 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{visitorName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-semibold">
                    {t('welcome_visitor_badge', currentLanguage)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  {t('welcome_visitor_desc', currentLanguage)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onVisitorLogout && (
                <button
                  onClick={onVisitorLogout}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-rose-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 active:scale-95 shadow-sm"
                  title={t('welcome_logout_visitor', currentLanguage)}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('welcome_logout_visitor', currentLanguage)}</span>
                </button>
              )}
              {onOpenSubscriberLogin && (
                <button
                  onClick={onOpenSubscriberLogin}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-sm"
                  title={t('welcome_subscriber_login_btn', currentLanguage)}
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">{t('welcome_subscriber_login_btn', currentLanguage)}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md p-3 rounded-2xl bg-slate-900/90 border border-amber-500/30 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
              <div className="text-xs text-slate-300 font-medium">
                <span>{t('welcome_visitor_alert', currentLanguage)}</span>
              </div>
            </div>
            {onOpenSubscriberLogin && (
              <button
                onClick={onOpenSubscriberLogin}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold cursor-pointer transition-all flex items-center gap-1 flex-shrink-0 active:scale-95 shadow-sm"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('welcome_subscriber_login_btn', currentLanguage)}</span>
              </button>
            )}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2.5">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {t('camera_guide_point', currentLanguage)}
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              {currentLanguage === 'ar' ? 'واستمتع بالتعلم التفاعلي الممتع!' : currentLanguage === 'en' ? 'Enjoy interactive 3D learning!' : 'เพลิดเพลินกับการเรียนรู้ 3 มิติ!'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {t('welcome_app_subtitle', currentLanguage)}
          </p>
        </div>

        {/* Primary CTA: Start Camera (الزر الوحيد المطلوب للطالب) */}
        <div className="w-full max-w-sm pt-2">
          <button
            onClick={() => {
              soundService.unlockAudio();
              onStartCamera();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-sky-600/35 active:scale-95 transition-all cursor-pointer group"
          >
            <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span>📷 {t('welcome_start_camera_btn', currentLanguage)}</span>
          </button>
        </div>

        {/* Educational 3-Step Guide (نصوص إرشادية واضحة للطالب) */}
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>
              {currentLanguage === 'ar'
                ? 'كيف تبدأ التجربة التعليمية؟ (٣ خطوات سهلة):'
                : currentLanguage === 'en'
                ? 'How to start? (3 Easy Steps):'
                : 'วิธีเริ่มต้นใช้งาน (3 ขั้นตอนง่ายๆ):'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs flex items-center justify-center border border-sky-400/30">
                1
              </div>
              <p className="text-xs font-bold text-white">
                {currentLanguage === 'ar' ? 'شغّل الكاميرا' : currentLanguage === 'en' ? 'Start Camera' : 'เปิดกล้อง'}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {currentLanguage === 'ar'
                  ? 'اضغط على زر الكاميرا بالأعلى واسمح للمتصفح باستخدام كاميرا جهازك.'
                  : currentLanguage === 'en'
                  ? 'Click the camera button above and allow camera access.'
                  : 'กดปุ่มกล้องด้านบนและอนุญาตให้เข้าถึงกล้อง'}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center border border-teal-400/30">
                2
              </div>
              <p className="text-xs font-bold text-white">
                {currentLanguage === 'ar' ? 'وجّه نحو صفحة الدرس' : currentLanguage === 'en' ? 'Point at Page' : 'เล็งไปที่หน้าบทเรียน'}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t('camera_slow_approach', currentLanguage)}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-400/30">
                3
              </div>
              <p className="text-xs font-bold text-white">
                {currentLanguage === 'ar' ? 'شاهد المجسم 3D' : currentLanguage === 'en' ? 'View 3D AR' : 'ดูโมเดล 3 มิติ'}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {currentLanguage === 'ar'
                  ? 'سيظهر المجسم ثابتاً فوق صفحة الكتاب وتستطيع مشاهدته من جميع الجهات!'
                  : currentLanguage === 'en'
                  ? 'The 3D model will appear anchored right above the book page!'
                  : 'โมเดล 3 มิติจะปรากฏขึ้นบนหน้าหนังสือทันที!'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {currentLanguage === 'ar'
                ? 'نصيحة: تأكد من أن الغرفة مضاءة جيداً، واجعل صفحة الكتاب مفرودة أمام الكاميرا.'
                : currentLanguage === 'en'
                ? 'Tip: Ensure good lighting and keep the textbook page flat in front of the camera.'
                : 'คำแนะนำ: จัดแสงให้เพียงพอและวางหน้าหนังสือให้แบนราบ'}
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-xl mx-auto w-full py-4 text-center border-t border-white/5 text-[11px] text-slate-500">
        {t('welcome_copyright', currentLanguage)}
      </footer>
    </div>
  );
};
