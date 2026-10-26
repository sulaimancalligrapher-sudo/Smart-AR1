/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Globe,
  Sparkles,
  Camera,
  Layers,
  ShieldCheck,
  Search,
  Save,
  RotateCcw,
  Download,
  Check,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Languages,
  KeyRound
} from 'lucide-react';
import { AppLanguage, TranslationGroupId, TranslationItem } from '../types/translation';
import {
  TRANSLATION_GROUPS,
  getStoredTranslations,
  saveStoredTranslations,
  resetTranslationsToDefault,
  aiTranslateSingleText,
  aiTranslateItems,
  reloadTranslationsCache
} from '../services/translationService';

interface TranslationManagerViewProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  onRequestConfirm?: (modal: any) => void;
}

export const TranslationManagerView: React.FC<TranslationManagerViewProps> = ({
  currentLanguage,
  onLanguageChange,
  onRequestConfirm
}) => {
  const [items, setItems] = useState<TranslationItem[]>(() => getStoredTranslations());
  const [selectedGroup, setSelectedGroup] = useState<TranslationGroupId>('group1_welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const [translatingItemId, setTranslatingItemId] = useState<string | null>(null);
  const [isTranslatingGroup, setIsTranslatingGroup] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // تحديث نص محدد في الذاكرة
  const handleUpdateItemText = (id: string, lang: 'ar' | 'en' | 'th', value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [lang]: value } : item))
    );
  };

  // 1. ترجمة نص عربي واحد بالذكاء الاصطناعي
  const handleTranslateSingle = async (item: TranslationItem) => {
    if (!item.ar.trim()) {
      setStatusMessage({ type: 'error', text: 'يرجى كتابة النص العربي أولاً لترجمته' });
      return;
    }

    setTranslatingItemId(item.id);
    setStatusMessage({ type: 'info', text: `جارٍ ترجمة: "${item.labelAr}" بالذكاء الاصطناعي...` });

    try {
      const { en, th } = await aiTranslateSingleText(item.ar);
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, en: en || it.en, th: th || it.th } : it))
      );
      setStatusMessage({ type: 'success', text: `✓ تمت ترجمة "${item.labelAr}" بنجاح إلى الإنجليزية والتايلندية!` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `تعذرت الترجمة: ${err?.message || 'خطأ غير معروف'}` });
    } finally {
      setTranslatingItemId(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // 2. ترجمة مجموعة كاملة بالذكاء الاصطناعي
  const handleTranslateGroup = async (groupId: TranslationGroupId) => {
    const groupItems = items.filter((it) => it.group === groupId);
    const groupInfo = TRANSLATION_GROUPS.find((g) => g.id === groupId);

    setIsTranslatingGroup(groupId);
    setStatusMessage({
      type: 'info',
      text: `جارٍ ترجمة ${groupItems.length} نص في ${groupInfo?.titleAr} بالذكاء الاصطناعي...`
    });

    try {
      const translatedGroup = await aiTranslateItems(groupItems);
      setItems((prev) => {
        const map = new Map<string, TranslationItem>();
        prev.forEach((it) => map.set(it.id, it));
        translatedGroup.forEach((it) => map.set(it.id, it));
        return Array.from(map.values());
      });
      setStatusMessage({
        type: 'success',
        text: `✓ تم إكمال ترجمة جميع نصوص ${groupInfo?.titleAr} بنجاح!`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `تعذرت ترجمة المجموعة: ${err?.message || 'خطأ'}` });
    } finally {
      setIsTranslatingGroup(null);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // 3. ترجمة كافة المجموعات دفعة واحدة
  const handleTranslateAllGroups = async () => {
    setIsTranslatingGroup('all');
    setStatusMessage({
      type: 'info',
      text: `جارٍ ترجمة كافة نصوص التطبيق (${items.length} نص) بالذكاء الاصطناعي...`
    });

    try {
      const allTranslated = await aiTranslateItems(items);
      setItems(allTranslated);
      setStatusMessage({
        type: 'success',
        text: `✓ تم إكمال ترجمة جميع النصوص (${items.length} نص) بالذكاء الاصطناعي بنجاح!`
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `خطأ في الترجمة: ${err?.message || 'خطأ'}` });
    } finally {
      setIsTranslatingGroup(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // حفظ التعديلات
  const handleSaveTranslations = () => {
    saveStoredTranslations(items);
    reloadTranslationsCache();
    setSaveSuccess(true);
    setStatusMessage({ type: 'success', text: '✓ تم حفظ جميع النصوص والتراجم بنجاح وتطبيقها في المتصفح!' });
    setTimeout(() => {
      setSaveSuccess(false);
      setStatusMessage(null);
    }, 4000);
  };

  // تنزيل ملف JSON للترجمة
  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'translations.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // استعادة التراجم الافتراضية
  const handleResetDefaults = () => {
    const doReset = () => {
      const reset = resetTranslationsToDefault();
      setItems(reset);
      reloadTranslationsCache();
      setStatusMessage({ type: 'info', text: 'تمت استعادة التراجم الافتراضية بنجاح' });
      setTimeout(() => setStatusMessage(null), 3000);
    };

    if (onRequestConfirm) {
      onRequestConfirm({
        isOpen: true,
        title: 'استعادة التراجم الأصلية',
        message: 'هل تريد حقاً استعادة النصوص والتراجم الأصلية وإلغاء أي تعديلات خاصة قمت بها؟',
        confirmText: 'استعادة الافتراضي',
        cancelText: 'إلغاء',
        isDestructive: false,
        onConfirm: doReset
      });
    } else {
      doReset();
    }
  };

  // تصفية العناصر
  const filteredItems = items.filter((item) => {
    const matchGroup = item.group === selectedGroup;
    const q = searchQuery.trim().toLowerCase();
    const matchQuery =
      !q ||
      item.labelAr.toLowerCase().includes(q) ||
      item.ar.toLowerCase().includes(q) ||
      item.en.toLowerCase().includes(q) ||
      item.th.toLowerCase().includes(q);
    return matchGroup && matchQuery;
  });

  const getGroupIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'Camera':
        return <Camera className="w-4 h-4 text-cyan-400" />;
      case 'Layers':
        return <Layers className="w-4 h-4 text-emerald-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'KeyRound':
        return <KeyRound className="w-4 h-4 text-amber-400" />;
      default:
        return <Globe className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="space-y-5 text-slate-100 animate-fadeIn" dir="rtl">
      {/* 1. Header Box with Language Switcher & Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>إدارة التراجم واللغات الأربعة (عربي ↔ تايلندي ↔ إنجليزي)</span>
              </h3>
              <p className="text-xs text-slate-400">
                تحكم في كافة نصوص التطبيق، مع زر ترجمة بالذكاء الاصطناعي لكل نص منفرد أو للمجموعة بأكملها
              </p>
            </div>
          </div>

          {/* معاينة اللغة الحالية الفورية */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400">اللغة المعروضة الآن:</span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-700">
              <button
                type="button"
                onClick={() => onLanguageChange('ar')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === 'ar' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇸🇦 العربية
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === 'en' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('th')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentLanguage === 'th' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇹🇭 ภาษาไทย
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons: Save, Translate All, Download JSON, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSaveTranslations}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'تم الحفظ والمزامنة!' : 'حفظ التراجم والنصوص'}</span>
            </button>

            <button
              type="button"
              onClick={handleTranslateAllGroups}
              disabled={isTranslatingGroup !== null}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
              title="ترجمة جميع النصوص في التطبيق بالكامل من العربية إلى التايلندية والإنجليزية"
            >
              {isTranslatingGroup === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Languages className="w-4 h-4 text-amber-300" />
              )}
              <span>{isTranslatingGroup === 'all' ? 'جارٍ ترجمة الكل...' : '✨ ترجمة جميع المجموعات (AI)'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJson}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
              title="تنزيل ملف translations.json للنسخ الاحتياطي"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>تنزيل translations.json</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
            title="استعادة النصوص والتراجم الأصلية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>
        </div>

        {/* Notice alert */}
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
                : 'bg-sky-950/80 border border-sky-500/40 text-sky-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* 2. Group Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* شريط اختيار المجموعات الأربعة (أيقونة ورقم فقط) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-2xl overflow-x-auto">
          {TRANSLATION_GROUPS.map((g, idx) => {
            const isSelected = selectedGroup === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGroup(g.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
                title={g.titleAr}
              >
                {getGroupIcon(g.iconName)}
                <span className="font-bold font-mono text-xs">{idx + 1}</span>
              </button>
            );
          })}
        </div>

        {/* بحث سريع */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في النصوص العربية أو التراجم..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>
      </div>

      {/* 3. Render Groups and their Items */}
      <div className="space-y-6">
        {TRANSLATION_GROUPS.filter((g) => selectedGroup === g.id).map((group) => {
          const groupItems = filteredItems.filter((it) => it.group === group.id);
          if (groupItems.length === 0 && searchQuery) return null;

          const isThisGroupTranslating = isTranslatingGroup === group.id;

          return (
            <div
              key={group.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-4"
            >
              {/* Group Header with Group AI Translation Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-white">
                    {getGroupIcon(group.iconName)}
                  </span>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      <span>{group.titleAr}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                        {groupItems.length} نصوص
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400">{group.descriptionAr}</p>
                  </div>
                </div>

                {/* زر ترجمة هذه المجموعة بالكامل بالذكاء الاصطناعي */}
                <button
                  type="button"
                  onClick={() => handleTranslateGroup(group.id)}
                  disabled={isTranslatingGroup !== null}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-40 active:scale-95 border border-emerald-400/30"
                  title="ترجمة كافة نصوص هذه المجموعة فقط بالذكاء الاصطناعي"
                >
                  {isThisGroupTranslating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>
                    {isThisGroupTranslating
                      ? 'جارٍ ترجمة المجموعة...'
                      : '✨ ترجمة كامل هذه المجموعة (AI)'}
                  </span>
                </button>
              </div>

              {/* Group Translation Items Grid */}
              <div className="grid grid-cols-1 gap-4">
                {groupItems.map((item) => {
                  const isItemTranslating = translatingItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-3.5 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      {/* Item Title and Individual AI Translation Button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.labelAr}</span>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                        </div>

                        {/* زر الترجمة الفردي لكل نص عربي */}
                        <button
                          type="button"
                          onClick={() => handleTranslateSingle(item)}
                          disabled={isItemTranslating || isTranslatingGroup !== null}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors self-start sm:self-auto"
                          title="ترجمة هذا النص العربي فورياً إلى التايلندية والإنجليزية بالذكاء الاصطناعي"
                        >
                          {isItemTranslating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          )}
                          <span>{isItemTranslating ? 'جارٍ الترجمة...' : '✨ ترجمة هذا النص (AI)'}</span>
                        </button>
                      </div>

                      {/* 3 Text Inputs: Arabic, English, Thai */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* 1. Arabic (Original) */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>🇸🇦</span>
                              <span>النص العربي (الأصل):</span>
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            value={item.ar}
                            onChange={(e) => handleUpdateItemText(item.id, 'ar', e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-sky-500/50 focus:border-sky-500 text-xs text-white focus:outline-none transition-colors resize-none leading-relaxed"
                            placeholder="اكتب النص العربي هنا..."
                            dir="rtl"
                          />
                        </div>

                        {/* 2. English Translation */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>🇬🇧</span>
                              <span>الترجمة الإنجليزية (English):</span>
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            value={item.en}
                            onChange={(e) => handleUpdateItemText(item.id, 'en', e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-indigo-500/50 focus:border-indigo-500 text-xs text-white focus:outline-none transition-colors resize-none leading-relaxed"
                            placeholder="English translation..."
                            dir="ltr"
                          />
                        </div>

                        {/* 3. Thai Translation */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                            <span className="flex items-center gap-1">
                              <span>🇹🇭</span>
                              <span>الترجمة التايلندية (ภาษาไทย):</span>
                            </span>
                          </label>
                          <textarea
                            rows={2}
                            value={item.th}
                            onChange={(e) => handleUpdateItemText(item.id, 'th', e.target.value)}
                            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-teal-500/50 focus:border-teal-500 text-xs text-white focus:outline-none transition-colors resize-none leading-relaxed"
                            placeholder="คำแปลภาษาไทย..."
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
