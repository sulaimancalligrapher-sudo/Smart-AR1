import React from 'react';
import { Camera, CheckCircle2, LogOut, ExternalLink } from 'lucide-react';

interface StudentExitScreenProps {
  onReopenCamera: () => void;
}

export const StudentExitScreen: React.FC<StudentExitScreenProps> = ({ onReopenCamera }) => {
  const handleCloseWindow = () => {
    try {
      window.close();
    } catch (_) {}
    // If browser prevents closing tab (e.g. not opened via window.open), provide blank or redirect
    setTimeout(() => {
      try {
        window.location.replace('about:blank');
      } catch (_) {}
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 text-center select-none">
      <div className="relative w-full max-w-sm rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl backdrop-blur-xl flex flex-col items-center animate-fadeIn">
        {/* Glow circle */}
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <h2 className="text-xl font-black text-white mb-2">تم إنهاء الجلسة بنجاح</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
          شكراً لك! تم إيقاف الكاميرا وإنهاء جلسة التعلم. يمكنك الآن إغلاق هذا التبويب في المتصفح بأمان.
        </p>

        <div className="w-full space-y-3">
          {/* Close browser tab button */}
          <button
            onClick={handleCloseWindow}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>إغلاق التبويب والخروج الآن</span>
          </button>

          {/* Re-open camera button */}
          <button
            onClick={onReopenCamera}
            className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>إعادة فتح الكاميرا (إذا خرجت بالخطأ)</span>
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-300">
          كتابي الذكي للواقع المعزز 📖✨
        </div>
      </div>
    </div>
  );
};
