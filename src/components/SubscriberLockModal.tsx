import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  X,
  User,
  IdCard,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { LessonData, getLessonAccessTier, checkLessonAccess } from '../types/ar';
import {
  SubscriberInfo,
  verifySubscriberWithSheet
} from '../services/subscriptionAuth';
import { AppLanguage } from '../types/translation';
import { t } from '../services/translationService';

interface SubscriberLockModalProps {
  isOpen: boolean;
  lesson: LessonData | null;
  currentSubscriber?: SubscriberInfo | null;
  webAppUrl?: string;
  subscriptionExternalUrl: string;
  onSuccessLogin: (subscriber: SubscriberInfo) => void;
  onClose: () => void;
  currentLanguage?: AppLanguage;
}

export const SubscriberLockModal: React.FC<SubscriberLockModalProps> = ({
  isOpen,
  lesson,
  currentSubscriber,
  webAppUrl,
  subscriptionExternalUrl,
  onSuccessLogin,
  onClose,
  currentLanguage = 'ar'
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const accessTier = getLessonAccessTier(lesson);
  const isCustomTier = accessTier === 'custom';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanName || !cleanPhone) {
      setErrorMessage(t('sub_modal_err_required_fields', currentLanguage));
      return;
    }

    setIsLoading(true);

    try {
      // نتحقق من الحساب بدون حفظ تلقائي فوري، لنتأكد أولاً من صلاحية الدرس الحالي
      const res = await verifySubscriberWithSheet(cleanName, cleanPhone, webAppUrl, { skipAutoSave: true });

      if (res.success && res.subscriber) {
        // فحص هل هذا المشترك مصرح له بهذا الدرس تحديداً (خاصة للدروس الخاصة VIP)
        const accessCheck = checkLessonAccess(lesson, res.subscriber);
        if (!accessCheck.allowed) {
          if (accessCheck.reason === 'subscriber_blocked_custom_only') {
            setErrorMessage(t('sub_modal_custom_access_denied', currentLanguage));
          } else {
            setErrorMessage(t('sub_modal_custom_not_assigned_error', currentLanguage));
          }
          setIsLoading(false);
          return;
        }

        // تم التحقق بنجاح من الهوية وصلاحية الدرس: الآن نحفظ الجلسة
        setSuccessMessage(res.message);
        setTimeout(() => {
          onSuccessLogin(res.subscriber!);
          setIsLoading(false);
        }, 800);
      } else {
        setErrorMessage(res.message);
        setIsLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(`${currentLanguage === 'ar' ? 'حدث خطأ أثناء الاتصال:' : currentLanguage === 'en' ? 'Connection error:' : 'เกิดข้อผิดพลาดในการเชื่อมต่อ:'} ${err?.message || ''}`);
      setIsLoading(false);
    }
  };

  const handleOpenSubscriptionLink = () => {
    const targetUrl = subscriptionExternalUrl.trim();
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const isRTL = currentLanguage === 'ar';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div
        className={`w-full max-w-lg bg-slate-900 border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scaleUp ${
          isCustomTier ? 'border-purple-500/50 shadow-purple-950/40' : 'border-amber-500/40 shadow-amber-950/40'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isCustomTier
            ? 'bg-gradient-to-r from-purple-950/90 via-slate-900 to-slate-900 border-purple-500/30'
            : 'bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-amber-500/30'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`p-2 rounded-xl border shadow-inner ${
              isCustomTier
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            }`}>
              {isCustomTier ? (
                <Sparkles className="w-5 h-5 animate-pulse text-purple-300" />
              ) : (
                <Lock className="w-5 h-5 animate-pulse text-amber-400" />
              )}
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {isCustomTier
                  ? t('sub_modal_title_custom', currentLanguage)
                  : t('sub_modal_title_subscribers', currentLanguage)}
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                isCustomTier
                  ? 'bg-purple-500/25 text-purple-200 border-purple-400/50'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isCustomTier
                  ? t('sub_modal_badge_custom', currentLanguage)
                  : t('sub_modal_badge_subscribers', currentLanguage)}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('sub_modal_close_btn', currentLanguage)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          {/* إذا كان المستخدم مسجلاً بالفعل كـ مشترك عام ولكن الدرس خاص */}
          {currentSubscriber && (
            <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 space-y-1.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">{t('sub_modal_active_account_label', currentLanguage)}</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                  currentSubscriber.isCustomSubscriber
                    ? 'bg-purple-950 text-purple-300 border-purple-500/30'
                    : 'bg-amber-950 text-amber-300 border-amber-500/30'
                }`}>
                  {currentSubscriber.isCustomSubscriber
                    ? t('sub_modal_tier_custom_badge', currentLanguage)
                    : t('sub_modal_tier_general_badge', currentLanguage)}
                </span>
              </div>
              <div className="font-semibold text-white">{currentSubscriber.name} ({currentSubscriber.phone})</div>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                {isCustomTier
                  ? t('sub_modal_custom_not_assigned_notice', currentLanguage)
                  : t('sub_modal_not_activated_notice', currentLanguage)}
              </p>
            </div>
          )}

          {/* Form: Subscriber Login */}
          <div className="space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('sub_modal_name_label', currentLanguage)}:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('sub_modal_name_placeholder', currentLanguage)}
                    disabled={isLoading}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border focus:outline-none text-xs sm:text-sm text-white placeholder-slate-500 ${
                      isCustomTier ? 'border-slate-700 focus:border-purple-500' : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('sub_modal_id_label', currentLanguage)}:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('sub_modal_id_placeholder', currentLanguage)}
                    disabled={isLoading}
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border focus:outline-none text-xs sm:text-sm text-white font-mono placeholder-slate-500 ${
                      isCustomTier ? 'border-slate-700 focus:border-purple-500' : 'border-slate-700 focus:border-amber-500'
                    }`}
                  />
                  <IdCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {successMessage && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span className="font-bold">{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCustomTier
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 shadow-amber-600/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t('sub_modal_verifying', currentLanguage)}</span>
                  </>
                ) : (
                  <>
                    {isCustomTier ? <Sparkles className="w-4 h-4 text-purple-200" /> : <Unlock className="w-4 h-4" />}
                    <span>{isCustomTier ? t('sub_modal_custom_login_btn', currentLanguage) : t('sub_modal_login_btn', currentLanguage)}</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">
                {t('sub_modal_or_subscribe', currentLanguage)}
              </span>
            </div>
          </div>

          {/* Subscribe Link Button */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{t('sub_modal_request_sub_title', currentLanguage)}</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {t('sub_modal_instant_activation', currentLanguage)}
              </span>
            </div>
            <button
              type="button"
              onClick={handleOpenSubscriptionLink}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 font-bold text-xs border border-sky-500/30 hover:border-sky-400/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>💎 {t('sub_modal_request_sub_btn', currentLanguage)} ↗</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">
            {t('welcome_visitor_hint', currentLanguage)}
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            {t('sub_modal_close_btn', currentLanguage)}
          </button>
        </div>
      </div>
    </div>
  );
};
