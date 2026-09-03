import { createSelector } from '@reduxjs/toolkit';

import { RootState } from '@/app/providers/store';

export const selectCustomNodeState = (state: RootState) => state.selectNode;

export const selectSelectedNodeID = createSelector(
  selectCustomNodeState,
  state => state.selectedNodeID
);
