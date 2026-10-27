import type { RootState } from '@/app/providers/store/types';

import { DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH } from './slice';
import type {
  HomeDashboardUIPreferences,
  NodeLibraryUIPreferences,
  NodeModalWorkspaceUIPreferences,
} from './types';

export const selectUIPreferences = (state: RootState) => state.uiPreferences;

const EMPTY_PINNED_NODE_NAMES: string[] = [];
const EMPTY_COLLAPSED_CATEGORIES: Partial<Record<string, true>> = {};
const DEFAULT_NODE_LIBRARY_PREFERENCES: NodeLibraryUIPreferences = {
  pinnedNodeNames: EMPTY_PINNED_NODE_NAMES,
  collapsedCategories: EMPTY_COLLAPSED_CATEGORIES,
};
const DEFAULT_NODE_MODAL_WORKSPACE_PREFERENCES: NodeModalWorkspaceUIPreferences =
  {
    previewWidth: DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH,
  };

const EMPTY_HOME_SECTION_USES: Partial<Record<string, number>> = {};
const DEFAULT_HOME_DASHBOARD_PREFERENCES: HomeDashboardUIPreferences = {
  sectionUses: EMPTY_HOME_SECTION_USES,
};

export const selectProjectsPagePreferences = (state: RootState) =>
  selectUIPreferences(state).projectsPage;

export const selectNodeLibraryPreferences = (state: RootState) =>
  selectUIPreferences(state).nodeLibrary ?? DEFAULT_NODE_LIBRARY_PREFERENCES;

export const selectNodeModalWorkspacePreferences = (state: RootState) =>
  selectUIPreferences(state).nodeModalWorkspace ??
  DEFAULT_NODE_MODAL_WORKSPACE_PREFERENCES;

export const selectNodeModalWorkspacePreviewWidth = (state: RootState) =>
  selectNodeModalWorkspacePreferences(state).previewWidth ??
  DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH;

export const selectThemeMode = (state: RootState) =>
  selectUIPreferences(state).themeMode;

export const selectProjectsViewMode = (state: RootState) =>
  selectProjectsPagePreferences(state).viewMode;

export const selectPinnedNodeNames = (state: RootState) =>
  selectNodeLibraryPreferences(state).pinnedNodeNames ??
  EMPTY_PINNED_NODE_NAMES;

export const selectCollapsedNodeLibraryCategories = (state: RootState) =>
  selectNodeLibraryPreferences(state).collapsedCategories ??
  EMPTY_COLLAPSED_CATEGORIES;

export const selectIsNodePinned = (state: RootState, nodeName: string) =>
  selectPinnedNodeNames(state).includes(nodeName);

export const selectIsNodeLibraryCategoryCollapsed = (
  state: RootState,
  category: string
) => Boolean(selectCollapsedNodeLibraryCategories(state)[category]);

export const selectNodeFieldsViewerShowFullPath = (state: RootState) =>
  selectUIPreferences(state).nodeFieldsViewer?.showFullPath ?? false;

export const selectSkipHardStopConfirm = (state: RootState) =>
  selectUIPreferences(state).skipHardStopConfirm;

export const selectSuppressedPrompts = (state: RootState) =>
  selectUIPreferences(state).suppressedPrompts;

export const selectIsPromptSuppressed = (state: RootState, promptId: string) =>
  Boolean(selectSuppressedPrompts(state)[promptId]);

export const selectHomeDashboardPreferences = (state: RootState) =>
  selectUIPreferences(state).homeDashboard ??
  DEFAULT_HOME_DASHBOARD_PREFERENCES;

export const selectHomeSectionUses = (state: RootState) =>
  selectHomeDashboardPreferences(state).sectionUses ?? EMPTY_HOME_SECTION_USES;

export const selectHomeWidgetIds = (state: RootState) =>
  selectHomeDashboardPreferences(state).widgetIds;
