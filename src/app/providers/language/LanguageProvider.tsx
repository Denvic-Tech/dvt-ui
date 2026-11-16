import { ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';

import {
  languageActions,
  LanguageContext,
  LanguageOption,
  selectCurrentLanguage,
  selectLanguageOptions,
} from '@/app/i18n';
import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import {
  fetchNodeDefinitions,
  selectNodeDefinitionsStatus,
} from '@/entities/node/node-definition';

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
  const nodeDefinitionsStatus = useAppSelector(selectNodeDefinitionsStatus);
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
      // Saved before the dispatch: the gateway client reads the X-Language
      // header from storage, and requests fired by the re-render must already
      // go out in the new language.
      saveLanguage(nextLanguage.value);
      dispatch(languageActions.setLanguage(nextLanguage));

      // Node definitions come localized and are loaded once per session.
      if (nodeDefinitionsStatus !== 'idle') {
        dispatch(fetchNodeDefinitions());
      }
    },
    [dispatch, nodeDefinitionsStatus]
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
