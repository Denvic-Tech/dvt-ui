import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/providers/store/hooks';

import {
  selectCollapsedNodeLibraryCategories,
  selectIsPromptSuppressed,
  selectNodeModalWorkspacePreviewWidth,
  selectPinnedNodeNames,
  selectProjectsViewMode,
  selectSkipHardStopConfirm,
  selectThemeMode,
} from './selectors';
import { uiPreferencesActions } from './slice';
import type {
  ProjectsViewMode,
  SuppressiblePromptId,
  ThemeMode,
} from './types';

export const useThemeModePreference = () => {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(selectThemeMode);

  const setThemeMode = useCallback(
    (nextThemeMode: ThemeMode) => {
      dispatch(uiPreferencesActions.setThemeMode(nextThemeMode));
    },
    [dispatch]
  );

  return {
    themeMode,
    setThemeMode,
  };
};

export const useProjectsViewModePreference = () => {
  const dispatch = useAppDispatch();
  const viewMode = useAppSelector(selectProjectsViewMode);

  const setViewMode = useCallback(
    (nextViewMode: ProjectsViewMode) => {
      dispatch(uiPreferencesActions.setProjectsViewMode(nextViewMode));
    },
    [dispatch]
  );

  return {
    viewMode,
    setViewMode,
  };
};

export const useUiPreferences = () => {
  const dispatch = useAppDispatch();
  const skipHardStopConfirm = useAppSelector(selectSkipHardStopConfirm);

  const setSkipHardStopConfirm = useCallback(
    (nextValue: boolean) => {
      dispatch(uiPreferencesActions.setSkipHardStopConfirm(nextValue));
    },
    [dispatch]
  );

  return {
    skipHardStopConfirm,
    setSkipHardStopConfirm,
  };
};

export const useNodeLibraryPreferences = () => {
  const dispatch = useAppDispatch();
  const pinnedNodeNames = useAppSelector(selectPinnedNodeNames);
  const collapsedCategories = useAppSelector(
    selectCollapsedNodeLibraryCategories
  );

  const toggleNodePinned = useCallback(
    (nodeName: string) => {
      dispatch(uiPreferencesActions.toggleNodeLibraryPinnedNode(nodeName));
    },
    [dispatch]
  );

  const toggleCategoryCollapsed = useCallback(
    (category: string) => {
      dispatch(
        uiPreferencesActions.toggleNodeLibraryCategoryCollapsed(category)
      );
    },
    [dispatch]
  );

  return {
    pinnedNodeNames,
    collapsedCategories,
    toggleNodePinned,
    toggleCategoryCollapsed,
  };
};

export const useNodeModalWorkspacePreferences = () => {
  const dispatch = useAppDispatch();
  const previewWidth = useAppSelector(selectNodeModalWorkspacePreviewWidth);

  const setPreviewWidth = useCallback(
    (nextPreviewWidth: number) => {
      dispatch(
        uiPreferencesActions.setNodeModalWorkspacePreviewWidth(nextPreviewWidth)
      );
    },
    [dispatch]
  );

  return {
    previewWidth,
    setPreviewWidth,
  };
};

export const usePromptSuppressionPreference = (
  promptId: SuppressiblePromptId
) => {
  const dispatch = useAppDispatch();
  const suppressed = useAppSelector(state =>
    selectIsPromptSuppressed(state, promptId)
  );

  const setSuppressed = useCallback(
    (nextSuppressed: boolean) => {
      dispatch(
        uiPreferencesActions.setPromptSuppressed({
          promptId,
          suppressed: nextSuppressed,
        })
      );
    },
    [dispatch, promptId]
  );

  const suppress = useCallback(() => {
    setSuppressed(true);
  }, [setSuppressed]);

  const allow = useCallback(() => {
    setSuppressed(false);
  }, [setSuppressed]);

  return {
    suppressed,
    setSuppressed,
    suppress,
    allow,
  };
};
