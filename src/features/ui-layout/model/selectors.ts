import { RootState } from '@/app/providers/store';
import { createSelector } from '@reduxjs/toolkit';

const selectUILayout = (state: RootState) => state.uiLayout;

export const selectSidebarUILayout = (s: RootState) =>
  selectUILayout(s).sidebar;
export const selectConsoleUILayout = (s: RootState) =>
  selectUILayout(s).console;
export const selectNodeDataModalUILayout = (s: RootState) =>
  selectUILayout(s).nodeDataModal;

export const selectGraphViewports = (s: RootState) =>
  selectUILayout(s).graphViewports;

export const selectGraphViewportByProjectId = (
  state: RootState,
  projectId: string | undefined
) => {
  if (!projectId) return undefined;
  return selectGraphViewports(state)[projectId];
};
