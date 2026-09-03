import { useEffect, useRef } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectHasActiveAIAnalysis } from './selectors';
import { pollAIAnalysisOnce } from './slice';

const POLL_INTERVAL_MS = 20_000;

export const useAIAnalysisPolling = (projectId: string | null | undefined) => {
  const dispatch = useAppDispatch();
  const hasActive = useAppSelector(state =>
    selectHasActiveAIAnalysis(state, projectId ?? undefined)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!projectId || !hasActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      return undefined;
    }

    const poll = () => {
      void dispatch(pollAIAnalysisOnce({ projectId }))
        .unwrap()
        .catch(() => {
          // Polling errors should not break the editor surface.
        });
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [dispatch, hasActive, projectId]);
};
