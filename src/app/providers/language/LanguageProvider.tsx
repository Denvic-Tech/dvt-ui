import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import {
  LanguageContext,
  LanguageOption,
  languageActions,
  selectCurrentLanguage,
  selectLanguageOptions,
} from '@/app/i18n';
import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';
import {
  getSavedLanguage,
  saveLanguage,
} from '@/shared/lib/storage/languagePreference';

const HYDRATION_FLAG = true;

type LanguageProviderProps = {
  children: ReactNode;
};

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectCurrentLanguage);
  const options = useAppSelector(selectLanguageOptions);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current === HYDRATION_FLAG) {
      return;
    }

    hydratedRef.current = HYDRATION_FLAG;
    const savedLanguage = getSavedLanguage();

    if (savedLanguage && savedLanguage !== language.value) {
      dispatch(languageActions.setLanguageByValue(savedLanguage));
    }
  }, [dispatch, language.value]);

  useEffect(() => {
    saveLanguage(language.value);
  }, [language.value]);

  const setLanguage = useCallback(
    (nextLanguage: LanguageOption) => {
      dispatch(languageActions.setLanguage(nextLanguage));
    },
    [dispatch]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      languageOptions: options,
    }),
    [language, options, setLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
