import { useCallback } from 'react';

import { useAppDispatch } from '@/app/providers/store/hooks.ts';
import {
  hideAll,
  hideGroup,
  purgeAll,
  purgeGroup,
  clearHistory,
  setGroupExpanded,
} from '@/app/notifications/model/slice.ts';

export const useAlertCenter = () => {
  const dispatch = useAppDispatch();

  return {
    hideAll: useCallback(() => dispatch(hideAll()), [dispatch]),
    hideGroup: useCallback(
      (groupKey: string) => dispatch(hideGroup({ groupKey })),
      [dispatch]
    ),
    purgeAll: useCallback(() => dispatch(purgeAll()), [dispatch]),
    purgeGroup: useCallback(
      (groupKey: string) => dispatch(purgeGroup({ groupKey })),
      [dispatch]
    ),
    clearHistory: useCallback(() => dispatch(clearHistory()), [dispatch]),
    setGroupExpanded: useCallback(
      (groupKey: string, expanded: boolean) =>
        dispatch(setGroupExpanded({ groupKey, expanded })),
      [dispatch]
    ),
  };
};
