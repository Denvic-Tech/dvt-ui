import { RootState } from '@/app/providers/store';

export const selectEdgeContextMenuState = (state: RootState) =>
  state.edgeContextMenu;
