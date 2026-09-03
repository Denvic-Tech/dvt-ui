export interface MultiNodeContextMenuPosition {
  x: number;
  y: number;
}

export interface MultiNodeContextMenuOpenPayload {
  position: MultiNodeContextMenuPosition;
  nodeIDs: string[];
}

export interface MultiNodeContextMenuState {
  open: boolean;
  position: MultiNodeContextMenuPosition | null;
  nodeIDs: string[];
}
