import type { RootState } from '@/app/providers/store';

export const selectRuntimeConfigState = (state: RootState) =>
  state.runtimeConfig;

export const selectRuntimeConfig = (state: RootState) =>
  selectRuntimeConfigState(state).config;

export const selectRuntimeConfigStatus = (state: RootState) =>
  selectRuntimeConfigState(state).status;

export const selectRuntimeConfigError = (state: RootState) =>
  selectRuntimeConfigState(state).error;

export const selectIsAIAnalysisEnabled = (state: RootState) =>
  selectRuntimeConfig(state)?.features.ai_analysis === true;
