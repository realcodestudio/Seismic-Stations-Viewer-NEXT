import type { Locale } from '@/src/store/appStore';
import en from '@/messages/en.json';
import zhCN from '@/messages/zh-CN.json';
import zhTW from '@/messages/zh-TW.json';
import ja from '@/messages/ja.json';
import ko from '@/messages/ko.json';

type TranslationKeys = {
  [key: string]: string | TranslationKeys;
};

const translations: Record<Locale, TranslationKeys> = {
  'en': en as TranslationKeys,
  'zh-CN': zhCN as TranslationKeys,
  'zh-TW': zhTW as TranslationKeys,
  'ja': ja as TranslationKeys,
  'ko': ko as TranslationKeys,
};

export function t(key: string, locale: Locale): string {
  const keys = key.split('.');
  let result: any = translations[locale];

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      return key;
    }
  }

  return typeof result === 'string' ? result : key;
}
