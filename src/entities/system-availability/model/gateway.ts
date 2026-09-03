import type { Dispatch } from '@reduxjs/toolkit';

import { setGatewaySystemUpdatingHandler } from '@/shared/gatewayClient';

import { systemAvailabilityActions } from './slice';
import { markSystemUpdateInProgress } from './storage';

export const initGatewaySystemUpdatingHandler = (dispatch: Dispatch): void => {
  setGatewaySystemUpdatingHandler(() => {
    markSystemUpdateInProgress();
    dispatch(systemAvailabilityActions.systemUpdateDetected());
  });
};
