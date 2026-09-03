import { useAppDispatch, useAppSelector } from '@/app/providers/store';
import { selectLogs } from '@/entities/log';
import { useCallback } from 'react';
import { logsActions } from '@/entities/log';

export const useLogs = () => {
  const dispatch = useAppDispatch();

  const logs = useAppSelector(selectLogs);

  const clearLogs = useCallback(() => {
    dispatch(logsActions.clearLogs());
  }, [dispatch]);

  return {
    logs,
    clearLogs,
  } as const;
};
