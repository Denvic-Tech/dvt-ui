import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { isSameGraphViewport } from '../lib/isSameGraphViewport.ts';

import { GraphViewport, UILayoutState } from './types.ts';

const DEFAULT_SIDEBAR_CATEGORIES_WIDTH = 60;
const DEFAULT_SIDEBAR_CATEGORY_CONTENT_WIDTH = 340;
const DEFAULT_CONSOLE_HEIGHT = 400;

const initialState: UILayoutState = {
  sidebar: {
    expanded: true,
    categoriesWidth: DEFAULT_SIDEBAR_CATEGORIES_WIDTH,
    categoriesContentWidth: DEFAULT_SIDEBAR_CATEGORY_CONTENT_WIDTH,
  },
  console: {
    open: false,
    height: DEFAULT_CONSOLE_HEIGHT,
  },
  nodeDataModal: {
    open: false,
  },
  graphViewports: {},
};

const uiLayoutSlice = createSlice({
  name: 'layout',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.sidebar.expanded = !state.sidebar.expanded;
    },
    setSidebarExpanded(state, { payload }: PayloadAction<boolean>) {
      state.sidebar.expanded = payload;
    },
    setSidebarCategoriesWidth(state, { payload }: PayloadAction<number>) {
      state.sidebar.categoriesWidth = payload;
    },
    setSidebarCategoriesContentWidth(
      state,
      { payload }: PayloadAction<number>
    ) {
      state.sidebar.categoriesContentWidth = payload;
    },

    toggleConsole(state) {
      state.console.open = !state.console.open;
    },
    setConsoleOpen(state, { payload }: PayloadAction<boolean>) {
      state.console.open = payload;
    },
    setConsoleHeight(state, { payload }: PayloadAction<number>) {
      state.console.height = payload;
    },

    toggleNodeDataModal(state) {
      state.nodeDataModal.open = !state.nodeDataModal.open;
    },
    setNodeDataModalOpen(state, { payload }: PayloadAction<boolean>) {
      state.nodeDataModal.open = payload;
    },
    setGraphViewport(
      state,
      { payload }: PayloadAction<{ projectId: string; viewport: GraphViewport }>
    ) {
      const { projectId, viewport } = payload;
      // Keep state identity when nothing changed: subscribers compare the
      // stored object by reference, and a fresh copy of equal numbers would
      // re-trigger viewport effects in the graph editor.
      if (isSameGraphViewport(state.graphViewports[projectId], viewport)) {
        return;
      }
      state.graphViewports[projectId] = viewport;
    },
  },
});

export const uiLayoutActions = uiLayoutSlice.actions;
export const uiLayoutReducer = uiLayoutSlice.reducer;
