import type {LanguageConfig, SupportedLanguage} from '../types';

/**
 * Registry of supported voice languages.
 * Designed for frictionless expansion to multiple languages in the future.
 */
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    audioPath: '/audio/en',
    code: 'en',
    label: 'English',
    speechSynthesisLang: 'en-US',
  },
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

/**
 * Detects browser language and matches with supported languages.
 */
export function getBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !navigator.language)
    return DEFAULT_LANGUAGE;
  const primaryLang = navigator.language
    .split('-')[0]
    .toLowerCase() as SupportedLanguage;
  if (primaryLang in SUPPORTED_LANGUAGES) {
    return primaryLang;
  }
  return DEFAULT_LANGUAGE;
}

/**
 * Returns configuration metadata for a given language code.
 */
export function getLanguageConfig(
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): LanguageConfig {
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
}
