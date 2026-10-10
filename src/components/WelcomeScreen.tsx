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
  Smartphone
} from 'lucide-react';
import { LessonData } from '../types/ar';

interface WelcomeScreenProps {
  onStartCamera: () => void;
  lessons: LessonData[];
  isAdmin: boolean;
  onOpenAdminPortal?: () => void;
  onAdminLogout?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartCamera,
  lessons,
  isAdmin,
  onOpenAdminPortal,
  onAdminLogout
}) => {
  return (
    <div className="relative w-full min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between p-4 sm:p-6" dir="rtl">
      {/* Decorative ambient background */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-2xl mx-auto w-full flex items-center justify-between py-2.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-white">كتابي الذكي</h1>
            <p className="text-[11px] text-slate-400 font-medium">الواقع المعزز التعليمي (WebAR)</p>
          </div>
        </div>

        {/* 
          إذا كان المستخدم مسجلاً كإدارة فقط، يظهر له زر الانتقال إلى لوحة الإدارة.
          أما الطالب العادي فلا يظهر له أي زر إدارة نهائياً.
        */}
        <div className="flex items-center gap-2">
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
        
        {/* Child-Friendly Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/15 border border-sky-400/30 text-sky-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>يعمل مباشرة في المتصفح الآن بدون تثبيت أي تطبيق</span>
        </div>

        {/* Title */}
        <div className="space-y-2.5">
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            وجّه الكاميرا إلى كتابك المدرسي
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              واستمتع بالتعلم التفاعلي الممتع!
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            عند التعرف على صور الدرس في الكتاب، سيظهر لك المجسم ثلاثي الأبعاد مباشرة فوق الورقة مع الصوتيات والشروحات التعليمية.
          </p>
        </div>

        {/* Primary CTA: Start Camera (الزر الوحيد المطلوب للطالب) */}
        <div className="w-full max-w-sm pt-2">
          <button
            onClick={onStartCamera}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xl shadow-sky-600/35 active:scale-95 transition-all cursor-pointer group"
          >
            <Camera className="w-7 h-7 group-hover:scale-110 transition-transform" />
            <span>📷 تشغيل الكاميرا الآن</span>
          </button>
        </div>

        {/* Educational 3-Step Guide (نصوص إرشادية واضحة للطالب) */}
        <div className="w-full bg-slate-900/70 border border-slate-800 rounded-3xl p-5 text-right space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs sm:text-sm">
            <Compass className="w-4 h-4 text-sky-400" />
            <span>كيف تبدأ التجربة التعليمية؟ (٣ خطوات سهلة):</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-sky-500/20 text-sky-300 font-black text-xs flex items-center justify-center border border-sky-400/30">
                ١
              </div>
              <p className="text-xs font-bold text-white">شغّل الكاميرا</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                اضغط على زر الكاميرا بالأعلى واسمح للمتصفح باستخدام كاميرا جهازك.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 text-teal-300 font-black text-xs flex items-center justify-center border border-teal-400/30">
                ٢
              </div>
              <p className="text-xs font-bold text-white">وجّه نحو صفحة الدرس</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                قرّب الكاميرا ببطء من صورة الدرس في كتابك المدرسي بثبات في إضاءة جيدة.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 flex flex-col gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-400/30">
                ٣
              </div>
              <p className="text-xs font-bold text-white">شاهد المجسم 3D</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                سيظهر المجسم ثابتاً فوق صفحة الكتاب وتستطيع مشاهدته من جميع الجهات!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded-xl px-3 py-2">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
            <span>نصيحة: تأكد من أن الغرفة مضاءة جيداً، واجعل صفحة الكتاب مفرودة أمام الكاميرا.</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-xl mx-auto w-full py-4 text-center border-t border-white/5 text-[11px] text-slate-500">
        مشروع كتابي الذكي (WebAR) · متوافق مع كافة الهواتف والأجهزة الذكية
      </footer>
    </div>
  );
};
