import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { LanguageOption, LanguageState } from './language.schema.ts';
import { getDefaultLanguage, languageOptions } from './language.constants.ts';

const initialState: LanguageState = {
  current: languageOptions[0],
  options: languageOptions,
};

const slice = createSlice({
  name: 'language',
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<LanguageOption>) {
      state.current = action.payload;
    },
    setLanguageByValue(state, action: PayloadAction<string>) {
      state.current = getDefaultLanguage(action.payload);
    },
  },
});

export const languageReducer = slice.reducer;
export const languageActions = slice.actions;
