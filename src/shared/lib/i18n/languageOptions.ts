export type LanguageOptionConfig = {
  label: string;
  value: string;
};

export const LANGUAGE_STORAGE_KEY = 'language';

export const languageOptionConfigs: ReadonlyArray<LanguageOptionConfig> = [
  { label: 'English', value: 'en-EN' },
  { label: 'Русский', value: 'ru-RU' },
];

export const DEFAULT_LANGUAGE_VALUE = languageOptionConfigs[0]?.value ?? 'en-EN';

