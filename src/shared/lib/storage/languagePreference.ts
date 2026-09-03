import { LANGUAGE_STORAGE_KEY } from '@/shared/lib/i18n/languageOptions';

export const getSavedLanguage = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.warn('Unable to read language from storage', error);
    return null;
  }
};

export const saveLanguage = (value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  } catch (error) {
    console.warn('Unable to persist language', error);
  }
};
