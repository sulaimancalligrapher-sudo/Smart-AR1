import React, { useState } from 'react';
import { X, QrCode, Copy, Check, Camera, Download, Share2, Sparkles, Smartphone, ExternalLink } from 'lucide-react';

interface StudentQRModalProps {
  onClose: () => void;
}

export const StudentQRModal: React.FC<StudentQRModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);

  // Generate student direct camera URL
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  const studentCameraUrl = `${origin}${pathname}?mode=student`;

  // QR Code URL using high-res QR API
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=10&data=${encodeURIComponent(
    studentCameraUrl
  )}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentCameraUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQR = () => {
    const a = document.createElement('a');
    a.href = qrCodeImageUrl;
    a.download = 'كتابي-الذكي-باركود-كاميرا-الطلاب.png';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'كتابي الذكي - كاميرا الواقع المعزز للطلاب',
          text: 'افتح الكاميرا مباشرة ووجّهها لكتابك المدرسي للاستمتاع بالمجسمات والشروحات التفاعلية!',
          url: studentCameraUrl,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn select-none">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col items-center text-center">
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
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-sky-500/20 mb-3">
          <Camera className="w-6 h-6 text-white" />
        </div>

        <h3 className="text-lg font-black text-white">رابط وباركود كاميرا الطلاب</h3>
        <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
          صفحة مخصصة للطلاب تفتح <span className="text-emerald-400 font-bold">الكاميرا فقط مباشرة</span> بدون أي إعدادات أو أزرار معقدة.
        </p>

        {/* QR Code Frame */}
        <div className="mt-4 p-3 bg-white rounded-2xl shadow-xl border-4 border-emerald-400/30 flex flex-col items-center">
          <img
            src={qrCodeImageUrl}
            alt="باركود كاميرا الطلاب المباشرة"
            className="w-56 h-56 object-contain"
          />
          <span className="text-[10px] text-slate-600 font-bold mt-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            امسح الباركود بكاميرا الجوال ليفتح الكاميرا فوراً
          </span>
        </div>

        {/* Student Link Display Box */}
        <div className="mt-4 w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <span className="text-xs font-mono text-sky-400 truncate text-left dir-ltr flex-1 select-all">
            {studentCameraUrl}
          </span>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all flex-shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 w-full">
          <button
            onClick={handleDownloadQR}
            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
            title="حفظ صورة الباركود لطباعتها في أوراق العمل أو الكتاب"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>حفظ الباركود (طباعة)</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
            title="مشاركة الرابط للطلاب أو أولياء الأمور"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>مشاركة للطلاب</span>
          </button>
        </div>

        {/* Direct Test Button */}
        <a
          href={studentCameraUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 text-[11px] text-slate-400 hover:text-sky-300 inline-flex items-center gap-1 transition-colors"
        >
          <span>تجربة فتح رابط الطلاب في نافذة جديدة</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
