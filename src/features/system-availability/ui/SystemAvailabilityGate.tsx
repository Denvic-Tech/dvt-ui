import * as React from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import { selectSystemUpdateState } from '@/features/profile/system-update';

import {
  clearSystemUpdateMarker,
  selectIsSystemAvailabilityBlocking,
  selectSystemAvailability,
  SYSTEM_UPDATE_IN_PROGRESS_KEY,
  systemAvailabilityActions,
  systemAvailabilityApi,
} from '@/entities/system-availability';

import { toApiErrorPayload } from '@/shared/lib/errors';

import { useAuth } from '@/contexts/AuthContext';

import { SystemUpdatingScreen } from './SystemUpdatingScreen';

const RECONNECT_DELAY_MS = 3000;

interface SystemAvailabilityGateProps {
  children: React.ReactNode;
}

const isRecoverableStateError = (status: number | undefined): boolean =>
  status == null || status === 502 || status === 503;

export const SystemAvailabilityGate = ({
  children,
}: SystemAvailabilityGateProps) => {
  const dispatch = useAppDispatch();
  const availability = useAppSelector(selectSystemAvailability);
  const isAvailabilityBlocking = useAppSelector(
    selectIsSystemAvailabilityBlocking
  );
  const updateState = useAppSelector(selectSystemUpdateState);
  const { isAuthenticated } = useAuth();
  const reloadTriggeredRef = React.useRef(false);

  React.useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === SYSTEM_UPDATE_IN_PROGRESS_KEY &&
        event.newValue != null
      ) {
        dispatch(systemAvailabilityActions.systemUpdateDetected());
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, [dispatch]);

  const shouldPoll =
    availability.knownUpdate &&
    availability.phase !== 'ready' &&
    availability.phase !== 'degraded';

  React.useEffect(() => {
    if (!shouldPoll) {
      return undefined;
    }

    let stopped = false;
    let timerId: number | null = null;

    const schedule = (delayMs: number) => {
      timerId = window.setTimeout(() => {
        void poll();
      }, delayMs);
    };

    const poll = async () => {
      if (stopped) {
        return;
      }

      dispatch(systemAvailabilityActions.systemUpdateCheckRequested());

      try {
        const snapshot = await systemAvailabilityApi.getState();

        if (stopped) {
          return;
        }

        dispatch(systemAvailabilityActions.systemStateReceived(snapshot));

        if (snapshot.state === 'updating') {
          schedule(Math.max(1, snapshot.retry_after_sec) * 1000);
        } else if (snapshot.state === 'degraded') {
          clearSystemUpdateMarker();
        }
      } catch (error) {
        if (stopped) {
          return;
        }

        const payload = toApiErrorPayload(
          error,
          'Не удалось получить состояние системы.'
        );

        if (!isRecoverableStateError(payload.status)) {
          dispatch(systemAvailabilityActions.systemStateUnavailable(payload));
          return;
        }

        dispatch(systemAvailabilityActions.systemStateUnavailable(payload));
        schedule(RECONNECT_DELAY_MS);
      }
    };

    void poll();

    return () => {
      stopped = true;

      if (timerId != null) {
        window.clearTimeout(timerId);
      }
    };
  }, [dispatch, shouldPoll]);

  React.useEffect(() => {
    if (
      availability.phase !== 'ready' ||
      updateState.marker != null ||
      reloadTriggeredRef.current
    ) {
      return;
    }

    reloadTriggeredRef.current = true;
    clearSystemUpdateMarker();
    window.location.reload();
  }, [availability.phase, updateState.marker]);

  const allowsInitiatorSignIn = Boolean(
    updateState.marker &&
    updateState.phase === 'awaiting_auth' &&
    !isAuthenticated
  );
  const holdsForInitiator = Boolean(
    updateState.marker && availability.phase === 'degraded'
  );
  const waitsForReadyReload =
    availability.knownUpdate && availability.phase === 'ready';
  const shouldBlockShell =
    isAvailabilityBlocking || waitsForReadyReload || holdsForInitiator;

  if (shouldBlockShell && !allowsInitiatorSignIn) {
    return (
      <SystemUpdatingScreen
        reconnecting={availability.phase === 'reconnecting'}
      />
    );
  }

  return <>{children}</>;
};
