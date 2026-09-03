import { RootState } from '@/app/providers/store';

import { ApiErrorPayload } from '@/shared/lib/errors';

import { ServicesStatusState } from './slice';

export const selectServicesStatusState = (
  state: RootState
): ServicesStatusState => state.servicesStatus;
export const selectServicesStatsIsLoading = (state: RootState): boolean =>
  state.servicesStatus.isLoading;
export const selectServicesStatsError = (
  state: RootState
): ApiErrorPayload | null => state.servicesStatus.error;
