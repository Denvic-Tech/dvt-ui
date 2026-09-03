import * as React from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import { clearSystemUpdateMarker } from '@/entities/system-availability';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import {
  type ApiErrorPayload,
  createUnknownError,
  toApiErrorPayload,
} from '@/shared/lib/errors';

import { useAuth } from '@/contexts/AuthContext';

import { systemUpdateApi } from '../api';
import { selectSystemUpdateState } from '../model/selectors';
import {
  readSystemUpdateMarker,
  writeSystemUpdateMarker,
} from '../model/session';
import { systemUpdateActions } from '../model/slice';
import { getSystemUpdateOwnerKey } from '../model/types';
import { validateSystemUpdateSnapshot } from '../model/validation';

import { SystemUpdateProgressDialog } from './SystemUpdateProgressDialog';

const RUNNING_POLL_DELAY_MS = 1500;
const RECONNECT_POLL_DELAY_MS = 3000;
const isRecoverablePollingError = (error: ApiErrorPayload) =>
  error.status == null || error.status >= 500;

export const SystemUpdateOverlayHost = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectSystemUpdateState);
  const { isAuthenticated } = useAuth();
  const {
    user,
    loading: currentUserLoading,
    reload: reloadCurrentUser,
  } = useCurrentUser();
  const stateRef = React.useRef(state);

  stateRef.current = state;

  React.useEffect(() => {
    if (!state.hydrated) {
      dispatch(
        systemUpdateActions.hydrateSystemUpdate(readSystemUpdateMarker())
      );
    }
  }, [dispatch, state.hydrated]);

  React.useEffect(() => {
    if (state.hydrated) {
      writeSystemUpdateMarker(state.marker);
    }
  }, [state.hydrated, state.marker]);

  const currentOwnerKey = getSystemUpdateOwnerKey(user);
  const ownerMatches =
    state.marker == null ||
    currentOwnerKey == null ||
    state.marker.ownerKey === currentOwnerKey;
  const isCurrentSuperadmin = normalizeRole(user?.role) === 'superadmin';
  const canMonitorForCurrentUser = Boolean(
    currentOwnerKey && ownerMatches && isCurrentSuperadmin
  );

  React.useEffect(() => {
    if (
      state.marker &&
      currentOwnerKey &&
      (!ownerMatches || !isCurrentSuperadmin)
    ) {
      dispatch(systemUpdateActions.clearSystemUpdateMonitoring());
    }
  }, [
    currentOwnerKey,
    dispatch,
    isCurrentSuperadmin,
    ownerMatches,
    state.marker,
  ]);

  React.useEffect(() => {
    if (
      !isAuthenticated ||
      !state.marker ||
      (state.phase !== 'awaiting_auth' && currentOwnerKey != null)
    ) {
      return undefined;
    }

    let stopped = false;
    let timerId: number | null = null;

    const restoreMonitoring = async () => {
      const authenticatedUser = await reloadCurrentUser({ silent: true });

      if (stopped) {
        return;
      }

      if (!authenticatedUser) {
        timerId = window.setTimeout(() => {
          void restoreMonitoring();
        }, RECONNECT_POLL_DELAY_MS);
        return;
      }

      const authenticatedOwnerKey = getSystemUpdateOwnerKey(authenticatedUser);
      const isEligibleOwner =
        authenticatedOwnerKey === state.marker?.ownerKey &&
        normalizeRole(authenticatedUser.role) === 'superadmin';

      if (!isEligibleOwner) {
        dispatch(systemUpdateActions.clearSystemUpdateMonitoring());
        return;
      }

      if (state.phase === 'awaiting_auth') {
        dispatch(systemUpdateActions.systemUpdateAuthenticationRestored());
      }
    };

    void restoreMonitoring();

    return () => {
      stopped = true;

      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [
    currentOwnerKey,
    dispatch,
    isAuthenticated,
    reloadCurrentUser,
    state.marker,
    state.phase,
  ]);

  const shouldPoll = Boolean(
    state.hydrated &&
    state.marker &&
    isAuthenticated &&
    !currentUserLoading &&
    canMonitorForCurrentUser &&
    !state.marker.paused &&
    state.phase !== 'awaiting_auth' &&
    state.phase !== 'succeeded' &&
    state.phase !== 'failed' &&
    state.phase !== 'status_error'
  );
  const markerLaunchTime = state.marker?.launchedAt ?? null;

  React.useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }

    let stopped = false;
    let timerId: number | null = null;

    const schedule = (delay: number) => {
      timerId = window.setTimeout(() => {
        void poll();
      }, delay);
    };

    const failWithStatusError = (message: string) => {
      dispatch(
        systemUpdateActions.systemUpdateStatusError(
          createUnknownError(message, 'SYSTEM_UPDATE.STATUS_MISMATCH')
        )
      );
    };

    const poll = async () => {
      const currentState = stateRef.current;
      const marker = currentState.marker;

      if (stopped || !marker || marker.paused) {
        return;
      }

      try {
        const snapshot = await systemUpdateApi.getStatus(
          currentState.logOffset
        );

        if (stopped) {
          return;
        }

        const validationError = validateSystemUpdateSnapshot(marker, snapshot);

        if (validationError) {
          failWithStatusError(validationError);
          return;
        }

        dispatch(systemUpdateActions.systemUpdateStatusReceived(snapshot));

        if (snapshot.state === 'running') {
          schedule(RUNNING_POLL_DELAY_MS);
        }
      } catch (error) {
        if (stopped) {
          return;
        }

        const payload = toApiErrorPayload(
          error,
          'Не удалось получить статус обновления.'
        );

        if (payload.status === 401) {
          dispatch(systemUpdateActions.systemUpdateAuthenticationRequired());
          return;
        }

        if (!isRecoverablePollingError(payload)) {
          dispatch(systemUpdateActions.systemUpdateStatusError(payload));
          return;
        }

        dispatch(
          systemUpdateActions.systemUpdatePollUnavailable({
            at: Date.now(),
            error: payload,
          })
        );
        schedule(RECONNECT_POLL_DELAY_MS);
      }
    };

    void poll();

    return () => {
      stopped = true;

      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [dispatch, markerLaunchTime, shouldPoll]);

  const handleReload = React.useCallback(() => {
    writeSystemUpdateMarker(null);
    clearSystemUpdateMarker();
    dispatch(systemUpdateActions.clearSystemUpdateMonitoring());
    window.location.reload();
  }, [dispatch]);

  const showDialog = Boolean(
    state.marker &&
    isAuthenticated &&
    canMonitorForCurrentUser &&
    !state.marker.paused &&
    state.phase !== 'awaiting_auth' &&
    state.phase !== 'starting'
  );

  if (!showDialog) {
    return null;
  }

  return (
    <SystemUpdateProgressDialog
      state={state}
      onClear={() => {
        dispatch(systemUpdateActions.clearSystemUpdateMonitoring());
      }}
      onPause={() => {
        dispatch(systemUpdateActions.pauseSystemUpdateMonitoring());
      }}
      onReload={handleReload}
    />
  );
};
