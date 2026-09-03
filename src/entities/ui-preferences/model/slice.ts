import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  NodeLibraryUIPreferences,
  NodeModalWorkspaceUIPreferences,
  ProjectsViewMode,
  SuppressiblePromptId,
  ThemeMode,
  UIPreferencesState,
} from './types';

export const DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH = 420;

const LEGACY_PROJECTS_VIEW_MODE_STORAGE_KEY = 'projects-view-mode';
const LEGACY_THEME_MODE_STORAGE_KEY = 'ui.theme';

const createInitialNodeLibraryPreferences = (): NodeLibraryUIPreferences => ({
  pinnedNodeNames: [],
  collapsedCategories: {},
});

const createInitialNodeModalWorkspacePreferences =
  (): NodeModalWorkspaceUIPreferences => ({
    previewWidth: DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH,
  });

const ensureNodeLibraryPreferences = (
  state: UIPreferencesState
): NodeLibraryUIPreferences => {
  if (!state.nodeLibrary) {
    state.nodeLibrary = createInitialNodeLibraryPreferences();
  }

  if (!Array.isArray(state.nodeLibrary.pinnedNodeNames)) {
    state.nodeLibrary.pinnedNodeNames = [];
  }

  if (!state.nodeLibrary.collapsedCategories) {
    state.nodeLibrary.collapsedCategories = {};
  }

  return state.nodeLibrary;
};

const ensureNodeModalWorkspacePreferences = (
  state: UIPreferencesState
): NodeModalWorkspaceUIPreferences => {
  if (!state.nodeModalWorkspace) {
    state.nodeModalWorkspace = createInitialNodeModalWorkspacePreferences();
  }

  if (!Number.isFinite(state.nodeModalWorkspace.previewWidth)) {
    state.nodeModalWorkspace.previewWidth =
      DEFAULT_NODE_MODAL_WORKSPACE_PREVIEW_WIDTH;
  }

  return state.nodeModalWorkspace;
};

const getInitialProjectsViewMode = (): ProjectsViewMode => {
  if (typeof window === 'undefined') {
    return 'grid';
  }

  try {
    const savedMode = window.localStorage.getItem(
      LEGACY_PROJECTS_VIEW_MODE_STORAGE_KEY
    );
    return savedMode === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
};

const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  try {
    const savedMode = window.localStorage.getItem(
      LEGACY_THEME_MODE_STORAGE_KEY
    );
    return savedMode === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const initialState: UIPreferencesState = {
  themeMode: getInitialThemeMode(),
  projectsPage: {
    viewMode: getInitialProjectsViewMode(),
  },
  nodeLibrary: createInitialNodeLibraryPreferences(),
  nodeModalWorkspace: createInitialNodeModalWorkspacePreferences(),
  skipHardStopConfirm: false,
  suppressedPrompts: {},
};

const uiPreferencesSlice = createSlice({
  name: 'uiPreferences',
  initialState,
  reducers: {
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
    },
    setProjectsViewMode(state, action: PayloadAction<ProjectsViewMode>) {
      state.projectsPage.viewMode = action.payload;
    },
    toggleNodeLibraryPinnedNode(state, action: PayloadAction<string>) {
      const nodeLibrary = ensureNodeLibraryPreferences(state);
      const nodeName = action.payload;
      const currentIndex = nodeLibrary.pinnedNodeNames.indexOf(nodeName);

      if (currentIndex >= 0) {
        nodeLibrary.pinnedNodeNames.splice(currentIndex, 1);
        return;
      }

      nodeLibrary.pinnedNodeNames.unshift(nodeName);
    },
    toggleNodeLibraryCategoryCollapsed(state, action: PayloadAction<string>) {
      const nodeLibrary = ensureNodeLibraryPreferences(state);
      const category = action.payload;

      if (nodeLibrary.collapsedCategories[category]) {
        delete nodeLibrary.collapsedCategories[category];
        return;
      }

      nodeLibrary.collapsedCategories[category] = true;
    },
    setNodeModalWorkspacePreviewWidth(state, action: PayloadAction<number>) {
      const workspace = ensureNodeModalWorkspacePreferences(state);
      workspace.previewWidth = action.payload;
    },
    setSkipHardStopConfirm(state, action: PayloadAction<boolean>) {
      state.skipHardStopConfirm = action.payload;
    },
    setPromptSuppressed(
      state,
      action: PayloadAction<{
        promptId: SuppressiblePromptId;
        suppressed: boolean;
      }>
    ) {
      const { promptId, suppressed } = action.payload;

      if (suppressed) {
        state.suppressedPrompts[promptId] = true;
        return;
      }

      delete state.suppressedPrompts[promptId];
    },
    clearSuppressedPrompts(state) {
      state.suppressedPrompts = {};
    },
  },
});

export const uiPreferencesActions = uiPreferencesSlice.actions;
export const uiPreferencesReducer = uiPreferencesSlice.reducer;
