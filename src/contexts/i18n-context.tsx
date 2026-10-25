import {createContext, type ReactNode, useContext, useMemo} from 'react';
import {
  DEFAULT_LOCALE,
  getTranslations,
  type TranslationKeyPath,
  type Translations,
  translate,
} from '../locales';
import type {SupportedLanguage} from '../types';

export interface I18nContextValue {
  language: SupportedLanguage;
  t: (
    keyPath: TranslationKeyPath,
    params?: Record<string, string | number>,
  ) => string;
  translations: Translations;
}

const defaultTranslations = getTranslations(DEFAULT_LOCALE);

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LOCALE as SupportedLanguage,
  t: (key, params) => translate(DEFAULT_LOCALE, key, params),
  translations: defaultTranslations,
});

export interface I18nProviderProps {
  children: ReactNode;
  language: SupportedLanguage;
}

export function I18nProvider({language, children}: I18nProviderProps) {
  const value = useMemo(() => {
    const translations = getTranslations(language);
    return {
      language,
      t: (
        keyPath: TranslationKeyPath,
        params?: Record<string, string | number>,
      ) => translate(language, keyPath, params),
      translations,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
