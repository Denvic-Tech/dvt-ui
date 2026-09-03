import { RootState } from '@/app/providers/store';

import { ApiErrorPayload } from '@/shared/lib/errors';

import { BuildVersionState } from './slice';

export const selectBuildVersionState = (state: RootState): BuildVersionState =>
  state.buildVersion;
export const selectBuildVersionIsLoading = (state: RootState): boolean =>
  state.buildVersion.isLoading;
export const selectBuildVersionError = (
  state: RootState
): ApiErrorPayload | null => state.buildVersion.error;
