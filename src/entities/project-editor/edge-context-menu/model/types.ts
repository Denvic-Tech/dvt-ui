import type { Edge, XYPosition } from '@xyflow/react';

export interface EdgeContextMenuPosition {
  x: number;
  y: number;
}

export interface EdgeGeometrySnapshot {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}

export interface EdgeContextMenuOpenPayload {
  position: EdgeContextMenuPosition;
  flowPosition: XYPosition;
  edge: Edge;
  geometry?: EdgeGeometrySnapshot;
}

export interface EdgeContextMenuState {
  open: boolean;
  position: EdgeContextMenuPosition | null;
  flowPosition: XYPosition | null;
  edge: Edge | null;
  geometry: EdgeGeometrySnapshot | null;
}
