import enUi from './en/ui.json';
import enVoice from './en/voice.json';

export const LANGUAGE_PACKS = {
  en: {
    ui: enUi,
    voice: enVoice,
  },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGE_PACKS;

export interface LanguageConfig {
  audioPath: string;
  code: SupportedLanguage;
  label: string;
  speechSynthesisLang: string;
}

export type Translations = typeof enUi;

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKeyPath = NestedKeyOf<Translations> | (string & {});

export const SUPPORTED_LANGUAGES: Record<SupportedLanguage, LanguageConfig> = {
  en: {
    audioPath: enVoice.audioPath,
    code: 'en',
    label: enVoice.label,
    speechSynthesisLang: enVoice.speechSynthesisLang,
  },
};

export const UI_TRANSLATIONS: Record<SupportedLanguage, Translations> = {
  en: enUi,
};

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';

export function getBrowserLanguage(): SupportedLanguage {
  if (typeof window === 'undefined' || !navigator.language) {
    return DEFAULT_LANGUAGE;
  }
  const primaryLang = navigator.language
    .split('-')[0]
    .toLowerCase() as SupportedLanguage;

  if (primaryLang in SUPPORTED_LANGUAGES) {
    return primaryLang;
  }
  return DEFAULT_LANGUAGE;
}

export function getLanguageConfig(
  lang: SupportedLanguage = DEFAULT_LANGUAGE,
): LanguageConfig {
  return SUPPORTED_LANGUAGES[lang] || SUPPORTED_LANGUAGES.en;
}
