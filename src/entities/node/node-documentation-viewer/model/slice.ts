import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type {
  NodeDocumentationViewerPayload,
  NodeDocumentationViewerState,
} from './types';

const initialState: NodeDocumentationViewerState = {
  nodeName: null,
  nodeTitle: null,
  open: false,
};

const nodeDocumentationViewerSlice = createSlice({
  name: 'nodeDocumentationViewer',
  initialState,
  reducers: {
    close(state) {
      state.open = false;
    },
    reset(state) {
      state.open = false;
      state.nodeName = null;
      state.nodeTitle = null;
    },
    open(state, { payload }: PayloadAction<NodeDocumentationViewerPayload>) {
      state.open = true;
      state.nodeName = payload.nodeName;
      state.nodeTitle = payload.nodeTitle;
    },
  },
});

export const nodeDocumentationViewerActions =
  nodeDocumentationViewerSlice.actions;
export const nodeDocumentationViewerReducer =
  nodeDocumentationViewerSlice.reducer;
