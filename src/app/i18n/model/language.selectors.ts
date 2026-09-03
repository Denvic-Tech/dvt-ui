import type { RootState } from '@/app/providers/store/rootReducer.ts';

export const selectLanguageState = (state: RootState) => state.language;

export const selectCurrentLanguage = (state: RootState) =>
  selectLanguageState(state).current;

export const selectLanguageOptions = (state: RootState) =>
  selectLanguageState(state).options;
