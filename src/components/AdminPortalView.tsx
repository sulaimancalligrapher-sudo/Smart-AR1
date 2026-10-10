/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Eye,
  QrCode,
  Copy,
  Check,
  RotateCcw,
  LogOut,
  Camera,
  ExternalLink,
  BookOpen,
  KeyRound,
  Sparkles,
  Link as LinkIcon,
  HelpCircle,
  Monitor
} from 'lucide-react';
import { LessonData } from '../types/ar';
import { getAdminCredentials, saveAdminCredentials } from '../services/adminAuth';

interface AdminPortalViewProps {
  lessons: LessonData[];
  onOpenTeacherConsole: () => void;
  onOpenCompiler: () => void;
  onOpenTargetCards: () => void;
  onOpenQRModal: () => void;
  onSimulateLesson: (lesson: LessonData) => void;
  onPurgeAllData: () => void;
  onGoToStudentView: () => void;
  onLogout: () => void;
}

export const AdminPortalView: React.FC<AdminPortalViewProps> = ({
  lessons,
  onOpenTeacherConsole,
  onOpenCompiler,
  onOpenTargetCards,
  onOpenQRModal,
  onSimulateLesson,
  onPurgeAllData,
  onGoToStudentView,
  onLogout
}) => {
  const [copiedAdminLink, setCopiedAdminLink] = useState(false);
  const [copiedStudentLink, setCopiedStudentLink] = useState(false);
  const [isEditingCreds, setIsEditingCreds] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [credMessage, setCredMessage] = useState<string | null>(null);

  const adminCredentials = getAdminCredentials();

  // Create clean admin and student URLs
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const adminUrl = `${origin}${pathname}?admin`;
  const studentUrl = `${origin}${pathname}`;

  const handleCopyAdminUrl = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedAdminLink(true);
    setTimeout(() => setCopiedAdminLink(false), 2500);
  };

  const handleCopyStudentUrl = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopiedStudentLink(true);
    setTimeout(() => setCopiedStudentLink(false), 2500);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPin.trim()) {
      setCredMessage('يرجى ملء جميع الحقول');
      return;
    }
    if (newPin.trim().length < 3) {
      setCredMessage('الرمز السري يجب أن يتكون من 3 خانات على الأقل');
      return;
    }

    saveAdminCredentials({
      username: newUsername.trim(),
      pin: newPin.trim()
    });
    setCredMessage('تم تحديث بيانات الإدارة بنجاح!');
    setTimeout(() => {
      setCredMessage(null);
      setIsEditingCreds(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-6 overflow-y-auto" dir="rtl">
      {/* Decorative ambient background */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pb-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white">لوحة تحكم الإدارة والمعلم</h1>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold">
                خاصة ومحمية
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              مرحباً بك: <span className="text-white font-bold">{adminCredentials.username}</span> | إدارة شاملة للدروس والمجسمات والأهداف
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onGoToStudentView}
            className="px-3 py-1.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-300 hover:text-white border border-sky-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="معاينة واجهة الطالب النظيفة"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">واجهة الطالب</span>
          </button>

          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="تسجيل الخروج من لوحة الإدارة"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="relative z-10 max-w-5xl mx-auto w-full py-6 space-y-6">
        
        {/* Secret Admin URL Card */}
        <div className="bg-gradient-to-r from-indigo-950/70 via-slate-900/90 to-purple-950/70 border border-indigo-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">الرابط السري الخاص بدخول الإدارة</h2>
                <p className="text-[11px] text-slate-300">
                  احفظ هذا الرابط في المفضلة لديك. صفحة الطالب العامة لا تحتوي على أي زر للإدارة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={handleCopyAdminUrl}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                {copiedAdminLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedAdminLink ? 'تم نسخ الرابط السري!' : 'نسخ رابط الإدارة'}</span>
              </button>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/60 border border-indigo-500/30 font-mono text-xs text-indigo-200 select-all break-all flex items-center justify-between">
            <span className="truncate">{adminUrl}</span>
            <span className="text-[10px] text-indigo-400 shrink-0 mr-2 font-sans font-bold bg-indigo-950/80 px-2 py-0.5 rounded">
              سري للإدارة فقط
            </span>
          </div>
        </div>

        {/* 6 Essential Management Tools Cards */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>الأدوات الإدارية والتحكم في الدروس:</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. لوحة تحكم المعلم وإدارة الدروس */}
            <button
              onClick={onOpenTeacherConsole}
              className="p-5 rounded-3xl bg-slate-900/90 hover:bg-slate-800/90 border border-emerald-500/40 hover:border-emerald-400 transition-all cursor-pointer text-right group shadow-lg flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                  إدارة الدروس
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                  لوحة تحكم المعلم وإدارة الدروس الحقيقية
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تعديل الدروس، ربط Google Sheets، رفع مجسمات AR ثلاثية الأبعاد (.glb/.gltf)، والصوتيات والشروحات.
                </p>
              </div>
            </button>

            {/* 2. دليل وأداة تجميع الأهداف MindAR */}
            <button
              onClick={onOpenCompiler}
              className="p-5 rounded-3xl bg-slate-900/90 hover:bg-slate-800/90 border border-indigo-500/40 hover:border-indigo-400 transition-all cursor-pointer text-right group shadow-lg flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30 group-hover:scale-105 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-full font-bold">
                  MindAR
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors">
                  دليل وأداة تجميع الأهداف
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  أداة تجميع صور صفحات الكتاب إلى ملف targets.mind المتوافق مع الواقع المعزز.
                </p>
              </div>
            </button>

            {/* 3. زر عرض بطاقات أهداف الدروس */}
            <button
              onClick={onOpenTargetCards}
              className="p-5 rounded-3xl bg-slate-900/90 hover:bg-slate-800/90 border border-sky-500/40 hover:border-sky-400 transition-all cursor-pointer text-right group shadow-lg flex flex-col justify-between gap-4"
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/30 group-hover:scale-105 transition-transform">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-full font-bold">
                  Targets
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-white group-hover:text-sky-300 transition-colors">
                  عرض بطاقات أهداف الدروس
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  معاينة وطباعة بطاقات صور الدروس المستهدفة للتعرف عليها بالكاميرا في الفصل.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 4. كيو آر كود ورابط الطلاب */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm sm:text-base font-black text-white">رابط وبباركود صفحة الطالب (للمشاركة في الصف)</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenQRModal}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>نافذة الباركود للطباعة</span>
              </button>
              <button
                onClick={handleCopyStudentUrl}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedStudentLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedStudentLink ? 'تم نسخ الرابط!' : 'نسخ رابط الطالب'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
            <div className="p-2 bg-white rounded-xl shadow-md flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(studentUrl)}`}
                alt="باركود صفحة الطلاب"
                className="w-28 h-28 object-contain"
              />
            </div>
            <div className="text-xs text-slate-300 space-y-2 text-right">
              <p className="font-bold text-white text-sm">هذا هو رابط الطالب النظيف الخالي من أي أزرار إدارة:</p>
              <p className="text-slate-400 text-xs">
                شارك هذا الباركود أو الرابط مع الطلاب؛ عند فتحه يظهر لهم فقط زر تشغيل الكاميرا والنصوص الإرشادية.
              </p>
              <div className="font-mono text-xs text-emerald-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 break-all">
                {studentUrl}
              </div>
            </div>
          </div>
        </div>

        {/* 5. تجربة فورية فوق الكاميرا (محاكي المعلم) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Monitor className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm sm:text-base font-black text-white">⚡ تجربة فورية فوق الكاميرا (محاكاة بدون كتاب ورقي)</h3>
            </div>
            <span className="text-[11px] text-slate-400">انقر على أي درس لتشغيله في الكاميرا فوراً</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {lessons.map((lesson) => (
              <button
                key={lesson.targetId}
                onClick={() => onSimulateLesson(lesson)}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-400/50 text-right transition-colors cursor-pointer group flex flex-col justify-between"
              >
                <span className="text-[10px] text-amber-400 font-mono block">
                  {lesson.targetId}
                </span>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate block mt-1">
                  {lesson.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. أدوات النظام والأمان ومسح الكاش */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-right">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>أمان وبيانات الإدارة:</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              الاسم الحالي: <strong>{adminCredentials.username}</strong> | الرمز: <strong>{adminCredentials.pin}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsEditingCreds(!isEditingCreds)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              تعديل الاسم والرمز السري
            </button>

            <button
              onClick={onPurgeAllData}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800/80 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              title="مسح وتصفير كافة البيانات المخزنة والكاش وإعادة تشغيل النظام نظيفاً"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>مسح الكاش والبيانات</span>
            </button>
          </div>
        </div>

        {/* Change Credentials Form Modal / Drawer */}
        {isEditingCreds && (
          <form onSubmit={handleSaveCredentials} className="bg-slate-950 border border-indigo-500/40 rounded-3xl p-5 space-y-4 animate-fadeIn">
            <h4 className="text-xs font-bold text-indigo-300">تعيين اسم مستخدم ورمز سري جديدين للإدارة:</h4>
            
            {credMessage && (
              <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 text-xs font-bold">
                {credMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-300 mb-1">اسم المستخدم الجديد:</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder={adminCredentials.username}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-300 mb-1">الرمز السري الجديد:</label>
                <input
                  type="text"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder={adminCredentials.pin}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditingCreds(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                حفظ التغييرات
              </button>
            </div>
          </form>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto w-full py-4 text-center border-t border-slate-800 text-[11px] text-slate-500">
        لوحة تحكم كتابي الذكي (WebAR) · مخصصة للمعلم وإدارة المحتوى التعليمي
      </footer>
    </div>
  );
};
