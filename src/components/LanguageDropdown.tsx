/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { AppLanguage } from '../types/translation';

interface LanguageDropdownProps {
  currentLanguage: AppLanguage;
  onLanguageChange: (lang: AppLanguage) => void;
  className?: string;
  compact?: boolean;
}

interface LanguageOption {
  code: AppLanguage;
  label: string;
  shortLabel: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'ar',
    label: 'العربية',
    shortLabel: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl'
  },
  {
    code: 'en',
    label: 'English',
    shortLabel: 'EN',
    flag: '🇬🇧',
    dir: 'ltr'
  },
  {
    code: 'th',
    label: 'ภาษาไทย',
    shortLabel: 'ไทย',
    flag: '🇹🇭',
    dir: 'ltr'
  }
];

export const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  currentLanguage,
  onLanguageChange,
  className = '',
  compact = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeLang = LANGUAGES.find((l) => l.code === currentLanguage) || LANGUAGES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: AppLanguage) => {
    onLanguageChange(lang);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-right ${className}`} ref={dropdownRef}>
      {/* الزر الموحد والمختصر لعرض وتغيير اللغات */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-sky-500/50 shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold active:scale-95"
        title="تغيير لغة التطبيق / Change Language / เปลี่ยนภาษา"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="text-sm select-none">{activeLang.flag}</span>
        <span className={compact ? 'hidden sm:inline text-xs' : 'text-xs'}>
          {compact ? activeLang.shortLabel : activeLang.label}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-400' : ''}`} />
      </button>

      {/* القائمة المنسدلة للغات الثلاث */}
      {isOpen && (
        <div className="absolute top-full mt-1.5 right-0 z-50 min-w-[155px] bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl animate-fadeIn">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
            <span>اختر اللغة</span>
            <Globe className="w-3 h-3 text-sky-400" />
          </div>

          <div className="space-y-0.5">
            {LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLanguage;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                  dir={lang.dir}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm select-none">{lang.flag}</span>
                    <span>{lang.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
