import {
  DEFAULT_LANGUAGE_VALUE,
  languageOptionConfigs,
} from '@/shared/lib/i18n/languageOptions.ts';

import { LanguageOption,LanguageOptionSchema } from './language.schema.ts';

export const languageOptions: LanguageOption[] = languageOptionConfigs.map(
  option => LanguageOptionSchema.parse(option)
);

export const getDefaultLanguage = (value: string | null): LanguageOption => {
  if (value) {
    const match = languageOptions.find(option => option.value === value);
    if (match) {
      return match;
    }
  }

  const fallback = languageOptions.find(
    option => option.value === DEFAULT_LANGUAGE_VALUE
  );

  return fallback ?? languageOptions[0];
};
