import { createContext, useContext } from 'react';

import type { LanguageContextValue } from '../model/language.schema.ts';

export const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('LanguageContext must be used within a LanguageProvider');
  }

  return context;
};
