import {type I18nContextValue, useI18n} from '../contexts/i18n-context';

export type {I18nContextValue};

export function useTranslation(): I18nContextValue {
  return useI18n();
}
