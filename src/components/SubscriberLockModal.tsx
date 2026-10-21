import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  KeyRound,
  ExternalLink,
  X,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Loader2
} from 'lucide-react';
import { LessonData } from '../types/ar';
import { normalizeImageUrl } from '../services/urlHelpers';
import {
  SubscriberInfo,
  verifySubscriberWithSheet
} from '../services/subscriptionAuth';

interface SubscriberLockModalProps {
  isOpen: boolean;
  lesson: LessonData | null;
  webAppUrl?: string;
  subscriptionExternalUrl: string;
  onSuccessLogin: (subscriber: SubscriberInfo) => void;
  onClose: () => void;
}

export const SubscriberLockModal: React.FC<SubscriberLockModalProps> = ({
  isOpen,
  lesson,
  webAppUrl,
  subscriptionExternalUrl,
  onSuccessLogin,
  onClose
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !lesson) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();

    if (!cleanName || !cleanPhone) {
      setErrorMessage('يرجى ملء حقلي الاسم ورقم الهاتف.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await verifySubscriberWithSheet(name, phone, webAppUrl);

      if (res.success && res.subscriber) {
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
      setErrorMessage(`حدث خطأ أثناء الاتصال: ${err?.message || 'تأكد من الاتصال بالإنترنت'}`);
      setIsLoading(false);
    }
  };

  const handleOpenSubscriptionLink = () => {
    const targetUrl = subscriptionExternalUrl.trim();
    if (!targetUrl) return;
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div
        className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
              <Lock className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>محتوى مقفل للمشتركين فقط</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                  محتوى مدفوع
                </span>
              </h3>
              <p className="text-xs text-amber-200/80">
                يتطلب هذا الدرس حساب اشتراك مفعل للمتابعة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق والعودة للتصفح"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lesson Preview Snippet */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[80vh]">
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-xl bg-black border border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
              {lesson.targetImage ? (
                <img
                  src={normalizeImageUrl(lesson.targetImage)}
                  alt={lesson.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Lock className="w-6 h-6 text-amber-400" />
              )}
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center">
                <Lock className="w-4 h-4 text-amber-300" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-medium">
                  {lesson.subject || 'المنهج المدرسي'}
                </span>
                {lesson.grade && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {lesson.grade}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-1">
                {lesson.title}
              </h4>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {lesson.description?.summary || 'يحتوي هذا الدرس على وسائط وشروحات ومجسمات تفاعلية ثلاثية الأبعاد.'}
              </p>
            </div>
          </div>

          {/* Form: Subscriber Login */}
          <div className="space-y-3">
            <div className="border-b border-slate-800 pb-2">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>لديك اشتراك؟ أدخل بياناتك للدخول الفوري:</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                تتم مطابقة البيانات تلقائياً مع جدول المشتركين (SubData). الدخول لمرة واحدة فقط!
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم المشترك:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: محمد أحمد"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white placeholder-slate-500"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  رقم الهاتف أو رقم الاشتراك (العمود A):
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="مثال: 05xxxxxxxx"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-500 focus:outline-none text-xs sm:text-sm text-white font-mono placeholder-slate-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
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
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جارٍ التحقق من ورقة المشتركين (SubData)...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>تأكيد الاشتراك وفتح محتوى الدرس</span>
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
                أو إذا كنت ترغب في الاشتراك
              </span>
            </div>
          </div>

          {/* Subscribe Link Button */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>ليس لديك حساب بعد؟</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">تفعيل فوري</span>
            </div>
            <p className="text-[11px] text-slate-400">
              تواصل مع إدارة المنصة للاشتراك وتفعيل رقمك واسمك في ورقة المشتركين.
            </p>
            <button
              type="button"
              onClick={handleOpenSubscriptionLink}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 font-bold text-xs border border-sky-500/30 hover:border-sky-400/60 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>💎 طلب اشتراك جديد وتفعيل الحساب ↗</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">الدروس المجانية تفتح تلقائياً بدون هذا القفل</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            متابعة التصفح المجاني
          </button>
        </div>
      </div>
    </div>
  );
};
