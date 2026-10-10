/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle, X, KeyRound } from 'lucide-react';
import { verifyAdminCredentials, getAdminCredentials, saveAdminCredentials } from '../services/adminAuth';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isChangingCredentials, setIsChangingCredentials] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPin, setNewPin] = useState('');
  const [changeSuccess, setChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const currentCreds = getAdminCredentials();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !pin.trim()) {
      setError('يرجى إدخال اسم المستخدم والرقم السري للإدارة');
      return;
    }

    const isValid = verifyAdminCredentials(username, pin);
    if (isValid) {
      onSuccess();
    } else {
      setError('بيانات الدخول غير صحيحة! تأكد من اسم المستخدم والرقم السري.');
    }
  };

  const handleAutofillDefault = () => {
    setUsername(currentCreds.username);
    setPin(currentCreds.pin);
    setError(null);
  };

  const handleSaveNewCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPin.trim()) {
      setError('يرجى ملء كافة حقول التعديل');
      return;
    }
    if (newPin.trim().length < 3) {
      setError('يجب ألا يقل الرمز السري عن 3 خانات');
      return;
    }

    saveAdminCredentials({
      username: newUsername.trim(),
      pin: newPin.trim()
    });
    setChangeSuccess(true);
    setUsername(newUsername.trim());
    setPin(newPin.trim());
    setTimeout(() => {
      setChangeSuccess(false);
      setIsChangingCredentials(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-7 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {isChangingCredentials ? 'تعديل بيانات دخول الإدارة' : 'دخول قسم الإدارة والمعلم'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isChangingCredentials
              ? 'قم بتعيين اسم مستخدم ورقم سري جديدين للإدارة'
              : 'أدخل الاسم والرقم الخاص بالإدارة للوصول إلى أدوات التحكم'}
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {changeSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>تم حفظ بيانات الإدارة الجديدة بنجاح!</span>
          </div>
        )}

        {!isChangingCredentials ? (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم للإدارة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin"
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            {/* PIN / Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الرقم / الرمز السري للإدارة:
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="مثال: 1234"
                  className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  title={showPin ? 'إخفاء الرمز' : 'إظهار الرمز'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Default credentials helper hint */}
            <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>الافتراضي: <strong>{currentCreds.username}</strong> | الرمز: <strong>{currentCreds.pin}</strong></span>
              </div>
              <button
                type="button"
                onClick={handleAutofillDefault}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
              >
                تعبئة سريعة
              </button>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Shield className="w-4 h-4" />
                <span>دخول قسم الإدارة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setNewUsername(currentCreds.username);
                  setNewPin(currentCreds.pin);
                  setIsChangingCredentials(true);
                  setError(null);
                }}
                className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                تغيير اسم ورقم الإدارة السري
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveNewCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                اسم المستخدم الجديد:
              </label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="اسم الإدارة الجديد"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                الرقم / الرمز السري الجديد:
              </label>
              <input
                type="text"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="الرقم السري الجديد"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>حفظ التعديلات الجديدة</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsChangingCredentials(false);
                  setError(null);
                }}
                className="w-full py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                إلغاء والعودة للدخول
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
