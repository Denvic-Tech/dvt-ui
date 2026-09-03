import type { RootState } from '@/app/providers/store';

import type { SetupStatus } from '@/shared/gatewayClient';

import type { SetupSliceState } from './slice';

const EMPTY_SETUP_STEPS: SetupStatus['steps'] = [];

export const selectSetupState = (state: RootState): SetupSliceState =>
  state.setup;

export const selectSetupStatus = (state: RootState) =>
  selectSetupState(state).status;

export const selectSetupLoadStatus = (state: RootState) =>
  selectSetupState(state).loadStatus;

export const selectSetupLoadError = (state: RootState) =>
  selectSetupState(state).loadError;

export const selectSetupSubmitStatusByCodeMap = (state: RootState) =>
  selectSetupState(state).submitStatusByCode;

export const selectSetupSubmitErrorByCodeMap = (state: RootState) =>
  selectSetupState(state).submitErrorByCode;

export const selectSetupSteps = (state: RootState) =>
  selectSetupStatus(state)?.steps ?? EMPTY_SETUP_STEPS;

export const selectSetupIsInitialized = (state: RootState): boolean =>
  selectSetupStatus(state)?.initialized ?? false;

export const selectSetupSubmitStatusByCode =
  (code: string) => (state: RootState) =>
    selectSetupSubmitStatusByCodeMap(state)[code] ?? 'idle';

export const selectSetupSubmitErrorByCode =
  (code: string) => (state: RootState) =>
    selectSetupSubmitErrorByCodeMap(state)[code] ?? null;

export const selectSetupHasResolved = (state: RootState): boolean => {
  const setupState = selectSetupState(state);
  return setupState.status !== null || setupState.loadStatus === 'failed';
};

export const selectSetupIsLoading = (state: RootState): boolean => {
  const setupState = selectSetupState(state);

  if (setupState.loadStatus === 'loading') {
    return true;
  }

  return Object.values(setupState.submitStatusByCode).some(
    status => status === 'loading'
  );
};
