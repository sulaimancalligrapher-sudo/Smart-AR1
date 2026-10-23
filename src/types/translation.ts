/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppLanguage = 'ar' | 'en' | 'th';

export type TranslationGroupId =
  | 'group1_welcome'
  | 'group2_camera'
  | 'group3_interactive'
  | 'group4_alerts';

export interface TranslationItem {
  id: string;
  group: TranslationGroupId;
  labelAr: string;
  ar: string;
  en: string;
  th: string;
}

export interface TranslationGroupInfo {
  id: TranslationGroupId;
  titleAr: string;
  titleEn: string;
  titleTh: string;
  descriptionAr: string;
  iconName: string;
}
