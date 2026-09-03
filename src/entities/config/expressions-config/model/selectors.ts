import type { RootState } from '@/app/providers/store';

export const selectExpressionsConfigState = (state: RootState) =>
  state.expressionsConfig;

export const selectExpressionsConfig = (state: RootState) =>
  selectExpressionsConfigState(state).config;

export const selectExpressionsConfigStatus = (state: RootState) =>
  selectExpressionsConfigState(state).status;

export const selectExpressionsConfigError = (state: RootState) =>
  selectExpressionsConfigState(state).error;
