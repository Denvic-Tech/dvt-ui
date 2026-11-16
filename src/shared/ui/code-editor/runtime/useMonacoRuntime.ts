import { useEffect, useSyncExternalStore } from 'react';

import {
  ensureMonacoRuntime,
  getMonacoRuntimeError,
  getMonacoRuntimeStatus,
  type MonacoRuntimeStatus,
  subscribeMonacoRuntime,
} from './monacoRuntime';

export type MonacoRuntimeState = {
  status: MonacoRuntimeStatus;
  error: Error | null;
};

/**
 * Subscribes to the shared Monaco runtime and kicks off loading on first use.
 */
export const useMonacoRuntime = (): MonacoRuntimeState => {
  const status = useSyncExternalStore(
    subscribeMonacoRuntime,
    getMonacoRuntimeStatus,
    getMonacoRuntimeStatus
  );
  const error = useSyncExternalStore(
    subscribeMonacoRuntime,
    getMonacoRuntimeError,
    getMonacoRuntimeError
  );

  useEffect(() => {
    ensureMonacoRuntime().catch(() => {
      // Already reported inside ensureMonacoRuntime; state carries the error.
    });
  }, []);

  return { status, error };
};
