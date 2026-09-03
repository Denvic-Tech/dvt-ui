import { useCallback } from 'react';
import { useAppDispatch } from '@/app/providers/store';
import { exportGraphThunk } from '../thunks.ts';

/**
 * Hook for exporting graph to JSON file
 */
export const useExportGraph = () => {
  const dispatch = useAppDispatch();

  const handleExport = useCallback(() => {
    dispatch(exportGraphThunk());
  }, [dispatch]);

  return { handleExport };
};
