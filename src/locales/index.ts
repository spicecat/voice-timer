import {
  DEFAULT_LANGUAGE,
  type SupportedLanguage,
  type Translations,
  UI_TRANSLATIONS,
} from './registry';

export * from './registry';

export const TRANSLATIONS = UI_TRANSLATIONS;
export const DEFAULT_LOCALE = DEFAULT_LANGUAGE;

export function getTranslations(lang: string): Translations {
  return (
    UI_TRANSLATIONS[lang as SupportedLanguage] ??
    UI_TRANSLATIONS[DEFAULT_LANGUAGE]
  );
}

export function formatTemplate(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return key in params ? String(params[key]) : match;
  });
}

function resolvePath(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((curr, segment) => {
    if (curr && typeof curr === 'object' && segment in curr) {
      return (curr as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

export function translate(
  lang: string,
  keyPath: string,
  params?: Record<string, string | number>,
): string {
  const translations = getTranslations(lang);
  const fallback = UI_TRANSLATIONS[DEFAULT_LANGUAGE];

  const val =
    resolvePath(translations, keyPath) ?? resolvePath(fallback, keyPath);

  if (typeof val === 'string') {
    return formatTemplate(val, params);
  }

  return keyPath;
}
