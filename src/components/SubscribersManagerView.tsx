/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Smartphone,
  Edit2,
  Trash2,
  Lock,
  Unlock,
  BookOpen,
  Phone,
  User,
  X,
  Save,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { LessonData } from '../types/ar';
import {
  SubscriberRecord,
  getCachedSubscribers,
  saveCachedSubscribers,
  fetchSubscribersFromSheet,
  saveSubscriberToSheet,
  deleteSubscriberFromSheet,
  resetSubscriberDevicesInSheet
} from '../services/subscribersManagement';
import { normalizeArabicDigits } from '../services/subscriptionAuth';

interface SubscribersManagerViewProps {
  lessons: LessonData[];
  webAppUrl?: string;
}

export const SubscribersManagerView: React.FC<SubscribersManagerViewProps> = ({
  lessons,
  webAppUrl
}) => {
  const [subscribers, setSubscribers] = useState<SubscriberRecord[]>(() => getCachedSubscribers());
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'allowed' | 'blocked' | 'custom'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Edit / Add Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Form Fields
  const [formPhone, setFormPhone] = useState('');
  const [formName, setFormName] = useState('');
  const [formIsAllowed, setFormIsAllowed] = useState(true);
  const [formMaxDevices, setFormMaxDevices] = useState<number>(1);
  const [formIsCustomLessons, setFormIsCustomLessons] = useState(false);
  const [selectedLessonTitles, setSelectedLessonTitles] = useState<string[]>([]);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Delete Confirm Modal
  const [deleteTargetPhone, setDeleteTargetPhone] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 4500);
  };

  // المزامنة الحية مع شيت جوجل (SubData)
  const handleSyncFromSheet = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchSubscribersFromSheet(webAppUrl);
      if (res.success && res.subscribers) {
        setSubscribers(res.subscribers);
        showNotification('success', res.message);
      } else {
        showNotification('error', res.message);
      }
    } catch (err: any) {
      showNotification('error', `تعذر الاتصال بالشيت: ${err?.message || err}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // فتح نافذة إضافة مشترك جديد
  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingIndex(null);
    setFormPhone('');
    setFormName('');
    setFormIsAllowed(true);
    setFormMaxDevices(1);
    setFormIsCustomLessons(false);
    setSelectedLessonTitles([]);
    setIsModalOpen(true);
  };

  // فتح نافذة تعديل مشترك موجود
  const handleOpenEditModal = (sub: SubscriberRecord, idx: number) => {
    setIsEditing(true);
    setEditingIndex(idx);
    setFormPhone(sub.phone);
    setFormName(sub.name);
    setFormIsAllowed(sub.isAllowed);
    setFormMaxDevices(sub.maxDevices || 1);

    if (sub.allowedLessons && sub.allowedLessons.trim() !== '') {
      setFormIsCustomLessons(true);
      const parsed = sub.allowedLessons
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setSelectedLessonTitles(parsed);
    } else {
      setFormIsCustomLessons(false);
      setSelectedLessonTitles([]);
    }
    setIsModalOpen(true);
  };

  // تبديل اختيار درس معين للمشترك الخاص
  const toggleLessonSelection = (lessonTitle: string) => {
    setSelectedLessonTitles((prev) => {
      if (prev.includes(lessonTitle)) {
        return prev.filter((t) => t !== lessonTitle);
      } else {
        return [...prev, lessonTitle];
      }
    });
  };

  // حفظ المشترك (إضافة أو تعديل)
  const handleSaveSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizeArabicDigits(formPhone.replace(/[\s\-\(\)]/g, ''));
    const cleanName = formName.trim();

    if (!cleanPhone || !cleanName) {
      showNotification('error', 'يرجى كتابة اسم ورقم المشترك بشكل صحيح.');
      return;
    }

    const finalAllowedLessons = formIsCustomLessons ? selectedLessonTitles.join(', ') : '';

    const newRecord: SubscriberRecord = {
      phone: cleanPhone,
      name: cleanName,
      allowedLessons: finalAllowedLessons,
      isAllowed: formIsAllowed,
      maxDevices: Math.max(1, formMaxDevices || 1),
      registeredDevices: isEditing && editingIndex !== null ? subscribers[editingIndex]?.registeredDevices || [] : []
    };

    // حفظ في الحالة والكاش وإرسالها لـ Google Apps Script
    try {
      const res = await saveSubscriberToSheet(newRecord, webAppUrl);
      const updated = getCachedSubscribers();
      setSubscribers(updated);
      setIsModalOpen(false);
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', `حدث خطأ أثناء الحفظ: ${err?.message || err}`);
    }
  };

  // تبديل سريع للسماح بالدخول (نعم / لا) مباشرة من الجدول
  const handleToggleAllowStatus = async (sub: SubscriberRecord) => {
    const updatedSub: SubscriberRecord = {
      ...sub,
      isAllowed: !sub.isAllowed
    };
    try {
      await saveSubscriberToSheet(updatedSub, webAppUrl);
      setSubscribers(getCachedSubscribers());
      showNotification(
        'success',
        updatedSub.isAllowed
          ? `✓ تم تفعيل الدخول لـ ${sub.name} (السماح: نعم).`
          : `⚠️ تم حظر الدخول لـ ${sub.name} (السماح: لا).`
      );
    } catch {
      showNotification('error', 'تعذر تحديث حالة السماح.');
    }
  };

  // تصفير الأجهزة المسجلة
  const handleResetDevices = async (sub: SubscriberRecord) => {
    if (!window.confirm(`هل تريد تصفير الأجهزة المسجلة لـ "${sub.name}"؟ سيتيح له ذلك الدخول من جهاز جديد فوراً.`)) {
      return;
    }
    try {
      const res = await resetSubscriberDevicesInSheet(sub.phone, webAppUrl);
      setSubscribers(getCachedSubscribers());
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', `فشل تصفير الأجهزة: ${err?.message || err}`);
    }
  };

  // تأكيد حذف المشترك
  const handleConfirmDelete = async () => {
    if (!deleteTargetPhone) return;
    try {
      const res = await deleteSubscriberFromSheet(deleteTargetPhone, webAppUrl);
      setSubscribers(getCachedSubscribers());
      setDeleteTargetPhone(null);
      showNotification('success', res.message);
    } catch (err: any) {
      showNotification('error', `فشل الحذف: ${err?.message || err}`);
    }
  };

  // تصفية المشتركين حسب البحث والنوع
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((sub) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        sub.name.toLowerCase().includes(q) ||
        sub.phone.toLowerCase().includes(q) ||
        sub.allowedLessons.toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterType === 'allowed') return sub.isAllowed;
      if (filterType === 'blocked') return !sub.isAllowed;
      if (filterType === 'custom') return Boolean(sub.allowedLessons && sub.allowedLessons.trim());
      return true;
    });
  }, [subscribers, searchQuery, filterType]);

  const stats = useMemo(() => {
    const total = subscribers.length;
    const allowed = subscribers.filter((s) => s.isAllowed).length;
    const blocked = subscribers.filter((s) => !s.isAllowed).length;
    const custom = subscribers.filter((s) => s.allowedLessons && s.allowedLessons.trim()).length;
    return { total, allowed, blocked, custom };
  }, [subscribers]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedPhone(text);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* 1. الشريط العلوي والأزرار الرئيسية */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>إدارة المشتركين وورقة SubData</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                سحابي
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              تحديد عدد الأجهزة المسموحة، الحظر الفوري (نعم / لا)، وتخصيص دروس لطلاب بعينهم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={handleSyncFromSheet}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="جلب وتحديث قائمة المشتركين الحية من ورقة SubData"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارٍ المزامنة...' : 'مزامنة مع SubData'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 shadow-lg shadow-purple-900/30"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مشترك جديد</span>
          </button>
        </div>
      </div>

      {/* تنبيه الإشعارات والعمليات */}
      {notice && (
        <div
          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
            notice.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
              : notice.type === 'error'
              ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
              : 'bg-sky-950/80 border-sky-500/50 text-sky-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{notice.text}</span>
        </div>
      )}

      {/* 2. شريط الإحصائيات السريعة */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">إجمالي المشتركين</span>
          <span className="text-base font-black text-white">{stats.total}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مسموح الدخول</span>
          </span>
          <span className="text-base font-black text-emerald-400">{stats.allowed}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-rose-400 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            <span>محظور (لا)</span>
          </span>
          <span className="text-base font-black text-rose-400">{stats.blocked}</span>
        </div>
        <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مشترك خاص</span>
          </span>
          <span className="text-base font-black text-purple-400">{stats.custom}</span>
        </div>
      </div>

      {/* 3. شريط البحث والتصفية */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الهاتف، اسم المشترك، أو عنوان الدرس المخصص..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('allowed')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'allowed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            مسموح ({stats.allowed})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('blocked')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'blocked'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            محظور ({stats.blocked})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('custom')}
            className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'custom'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            خاص ({stats.custom})
          </button>
        </div>
      </div>

      {/* 4. جدول المشتركين الكامل */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-900/90 text-slate-300 font-bold border-b border-slate-800">
            <tr>
              <th className="py-3 px-3.5 whitespace-nowrap">رقم المشترك (A)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">اسم المشترك (B)</th>
              <th className="py-3 px-3.5 whitespace-nowrap">الدروس المخصصة (C)</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">السماح بالدخول (AB)</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">الأجهزة المسموحة (AC)</th>
              <th className="py-3 px-3.5 text-center whitespace-nowrap">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {filteredSubscribers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Users className="w-8 h-8 text-slate-600" />
                    <span>لا توجد سجلات مطابقة للبحث أو الفلتر المختار.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredSubscribers.map((sub, idx) => {
                const hasCustomLessons = Boolean(sub.allowedLessons && sub.allowedLessons.trim());
                const lessonList = hasCustomLessons
                  ? sub.allowedLessons.split(',').map((s) => s.trim()).filter(Boolean)
                  : [];
                const registeredCount = Array.isArray(sub.registeredDevices) ? sub.registeredDevices.length : 0;

                return (
                  <tr
                    key={sub.phone + '_' + idx}
                    className="hover:bg-slate-900/50 transition-colors"
                  >
                    {/* رقم المشترك */}
                    <td className="py-3 px-3.5 font-mono text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                        <span className="font-bold">{sub.phone}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(sub.phone)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                          title="نسخ الرقم"
                        >
                          {copiedPhone === sub.phone ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* اسم المشترك */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{sub.name}</span>
                        {hasCustomLessons ? (
                          <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>مشترك خاص</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                            عام
                          </span>
                        )}
                      </div>
                    </td>

                    {/* الدروس المخصصة */}
                    <td className="py-3 px-3.5 max-w-[280px]">
                      {hasCustomLessons ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] text-purple-300 font-semibold">
                            <BookOpen className="w-3 h-3 text-purple-400 flex-shrink-0" />
                            <span>مخصص له ({lessonList.length} دروس):</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {lessonList.slice(0, 3).map((lt, lidx) => (
                              <span
                                key={lidx}
                                className="px-1.5 py-0.5 rounded-md bg-purple-950/60 border border-purple-500/30 text-[10px] text-purple-200 truncate max-w-[140px]"
                                title={lt}
                              >
                                {lt}
                              </span>
                            ))}
                            {lessonList.length > 3 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400">
                                +{lessonList.length - 3} دروس أخرى
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          ✓ كافة دروس الكتاب مفتوحة
                        </span>
                      )}
                    </td>

                    {/* السماح بالدخول (نعم / لا) */}
                    <td className="py-3 px-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleAllowStatus(sub)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer active:scale-95 shadow-sm ${
                          sub.isAllowed
                            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900'
                            : 'bg-rose-950/80 border-rose-500/50 text-rose-300 hover:bg-rose-900'
                        }`}
                        title={sub.isAllowed ? 'اضغط للحظر (تغيير إلى: لا)' : 'اضغط للسماح بالدخول (تغيير إلى: نعم)'}
                      >
                        {sub.isAllowed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>نعم (مسموح)</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>لا (محظور)</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* عدد الأجهزة */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                          <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                        </span>
                        <span className="font-bold text-slate-100 font-mono">
                          {registeredCount} / {sub.maxDevices || 1}
                        </span>
                        {registeredCount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleResetDevices(sub)}
                            className="p-1 rounded-md bg-slate-800 hover:bg-amber-900/50 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                            title="تصفير الأجهزة المسجلة للسماح له بالدخول من جهاز جديد"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* إجراءات (تعديل وحذف) */}
                    <td className="py-3 px-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(sub, idx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-900/50 text-slate-300 hover:text-purple-300 border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title="تعديل بيانات المشترك والدروس المخصصة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTargetPhone(sub.phone)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 border border-slate-700 transition-all cursor-pointer active:scale-95"
                          title="حذف المشترك نهائياً من ورقة SubData"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 5. نافذة منبثقة: إضافة أو تعديل مشترك */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            dir="rtl"
            className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {isEditing ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {isEditing ? 'تعديل بيانات المشترك في ورقة SubData' : 'إضافة مشترك جديد إلى ورقة SubData'}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    تُحفظ البيانات مباشرة وتُطبق على كافة الجوالات والتابلت
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSubscriber} className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* رقم الهاتف والاسم */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>رقم المشترك / الهاتف (A) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="مثال: 0501234567"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span>اسم المشترك (B) *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="مثال: محمد عبدالله"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* السماح بالدخول والحد الأقصى للأجهزة */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                {/* السماح بالدخول (نعم / لا) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    {formIsAllowed ? (
                      <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span>السماح بالدخول (AB)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setFormIsAllowed(true)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        formIsAllowed
                          ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>نعم (مسموح)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormIsAllowed(false)}
                      className={`flex-1 py-1.5 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        !formIsAllowed
                          ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>لا (حظر)</span>
                    </button>
                  </div>
                </div>

                {/* عدد الأجهزة المسموحة (AC) */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>عدد الأجهزة المسموحة (AC)</span>
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formMaxDevices}
                      onChange={(e) => setFormMaxDevices(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">جهاز</span>
                  </div>
                </div>
              </div>

              {/* نوع الاشتراك: عام أم مشترك خاص بدروس محددة */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>تخصيص دروس محددة (مشترك خاص - العمود C)</span>
                    </label>
                    <p className="text-[10px] text-slate-400">
                      إذا لم يُفعل، يرى المشترك كافة دروس الكتاب المتاحة
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formIsCustomLessons}
                    onChange={(e) => setFormIsCustomLessons(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 bg-slate-900 border-slate-700 cursor-pointer accent-purple-600"
                  />
                </div>

                {/* قائمة اختيار الدروس المخصصة */}
                {formIsCustomLessons && (
                  <div className="pt-2 border-t border-slate-800 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between text-[11px] text-slate-300">
                      <span>حدد الدروس المسموح بها لهذا الطالب:</span>
                      <span className="text-purple-400 font-bold">
                        تم تحديد {selectedLessonTitles.length} من {lessons.length}
                      </span>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-800/80 rounded-xl p-2 bg-slate-950">
                      {lessons.map((lesson, lidx) => {
                        const isSelected = selectedLessonTitles.includes(lesson.title);
                        return (
                          <div
                            key={lesson.targetId || lidx}
                            onClick={() => toggleLessonSelection(lesson.title)}
                            className={`p-2 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-950/70 border-purple-500/50 text-purple-200'
                                : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px] flex items-center justify-center flex-shrink-0">
                                {lidx + 1}
                              </span>
                              <span className="font-semibold truncate">{lesson.title}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-3.5 h-3.5 accent-purple-600 pointer-events-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار الحفظ والإلغاء */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-lg shadow-purple-900/30 active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isEditing ? 'حفظ التعديلات في SubData' : 'إضافة وحفظ في SubData'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. نافذة تأكيد الحذف */}
      {deleteTargetPhone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div dir="rtl" className="w-full max-w-sm bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">تأكيد حذف المشترك</h4>
                <p className="text-[11px] text-slate-400">
                  هل أنت متأكد من حذف هذا المشترك نهائياً من ورقة SubData؟
                </p>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span>رقم المشترك:</span>
              <span className="font-bold text-white">{deleteTargetPhone}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTargetPhone(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md shadow-rose-900/30"
              >
                نعم، تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
