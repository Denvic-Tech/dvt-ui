import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import {
  fetchSetupStatus,
  resetSetupMutationState,
  resetSetupState,
  submitSetupStep as submitSetupStepThunk,
} from './slice';
import {
  selectSetupHasResolved,
  selectSetupIsInitialized,
  selectSetupIsLoading,
  selectSetupLoadError,
  selectSetupLoadStatus,
  selectSetupStatus,
  selectSetupSteps,
  selectSetupSubmitErrorByCodeMap,
  selectSetupSubmitStatusByCodeMap,
} from './selectors';

export const useSetup = () => {
  const dispatch = useAppDispatch();

  const status = useAppSelector(selectSetupStatus);
  const steps = useAppSelector(selectSetupSteps);
  const isInitialized = useAppSelector(selectSetupIsInitialized);
  const hasResolved = useAppSelector(selectSetupHasResolved);
  const isLoading = useAppSelector(selectSetupIsLoading);
  const loadStatus = useAppSelector(selectSetupLoadStatus);
  const loadError = useAppSelector(selectSetupLoadError);
  const submitStatusByCode = useAppSelector(selectSetupSubmitStatusByCodeMap);
  const submitErrorByCode = useAppSelector(selectSetupSubmitErrorByCodeMap);

  const loadSetupStatus = useCallback(
    () => dispatch(fetchSetupStatus()).unwrap(),
    [dispatch]
  );

  const submitSetupStep = useCallback(
    (code: string, values: Record<string, unknown>) =>
      dispatch(submitSetupStepThunk({ code, values })).unwrap(),
    [dispatch]
  );

  const getSubmitStatus = useCallback(
    (code: string) => submitStatusByCode[code] ?? 'idle',
    [submitStatusByCode]
  );

  const getSubmitError = useCallback(
    (code: string) => submitErrorByCode[code] ?? null,
    [submitErrorByCode]
  );

  const resetState = useCallback(() => {
    dispatch(resetSetupState());
  }, [dispatch]);

  const resetMutationState = useCallback(() => {
    dispatch(resetSetupMutationState());
  }, [dispatch]);

  return {
    status,
    steps,
    isInitialized,
    hasResolved,
    isLoading,
    loadStatus,
    loadError,
    submitStatusByCode,
    submitErrorByCode,
    loadSetupStatus,
    submitSetupStep,
    getSubmitStatus,
    getSubmitError,
    resetState,
    resetMutationState,
  } as const;
};
