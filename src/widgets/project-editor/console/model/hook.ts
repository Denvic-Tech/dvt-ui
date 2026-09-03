import { useCallback, useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { selectFilteredLogs } from '@/widgets/project-editor/console';

import { selectConsoleUILayout, uiLayoutActions } from '@/features/ui-layout';

const EMPTY_LOGS: ReturnType<typeof selectFilteredLogs> = [];

export const useConsole = () => {
  // TODO: refactor, move to separate entity "Logs"
  const dispatch = useAppDispatch();

  const [searchTerm, setSearchTerm] = useState<string | null>(null);

  const consoleUILayout = useAppSelector(selectConsoleUILayout);

  const filteredLogs = useAppSelector(state =>
    consoleUILayout.open ? selectFilteredLogs(state, searchTerm) : EMPTY_LOGS
  );

  const toggle = useCallback(() => {
    dispatch(uiLayoutActions.toggleConsole());
  }, [dispatch]);

  const setConsoleOpen = useCallback(
    (open: boolean) => {
      dispatch(uiLayoutActions.setConsoleOpen(open));
    },
    [dispatch]
  );

  const setConsoleHeight = useCallback(
    (height: number) => {
      dispatch(uiLayoutActions.setConsoleHeight(height));
    },
    [dispatch]
  );

  return {
    searchTerm,
    setSearchTerm,
    filteredLogs,
    ...consoleUILayout,
    toggle,
    setConsoleOpen,
    setConsoleHeight,
  };
};
