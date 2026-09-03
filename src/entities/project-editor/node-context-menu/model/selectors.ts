import { RootState } from '@/app/providers/store';

export const selectNodeContextMenuState = (state: RootState) =>
  state.nodeContextMenu;
