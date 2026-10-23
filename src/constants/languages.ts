import type {LanguageConfig, SupportedLanguage} from '../types';
import languagesJson from './languages.json';

/**
 * Registry of supported voice languages.
 *
 * Single source of truth is src/constants/languages.json, shared with
 * scripts/generate-audio.js. This file derives the typed registry for the app.
 */
export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> =
  Object.fromEntries(
    Object.entries(languagesJson).map(([code, definition]) => [
      code,
      {
        audioPath: definition.audioPath,
        code: code as SupportedLanguage,
        label: definition.label,
        speechSynthesisLang: definition.speechSynthesisLang,
      },
    ]),
  ) as Record<SupportedLanguage, LanguageConfig>;

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
