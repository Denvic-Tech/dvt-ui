import type { XYPosition } from '@xyflow/react';

import type {
  CustomEdgeType,
  CustomNodeType,
} from '@/entities/project-editor/graph';

export const NODE_DUPLICATE_CLIPBOARD_MIME = 'application/x-dvt-node';
export const NODE_DUPLICATE_CLIPBOARD_VERSION = 1;

const DEFAULT_PLACEMENT_GAP = 24;
const MAX_RING_RADIUS = 8;

const CANDIDATE_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

export interface DuplicateClipboardPayload {
  version: typeof NODE_DUPLICATE_CLIPBOARD_VERSION;
  node: CustomNodeType;
  incomingEdges: CustomEdgeType[];
}

export interface RectLike {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FindNearestFreePositionParams {
  sourcePosition: XYPosition;
  nodeSize: {
    width: number;
    height: number;
  };
  occupiedRects: RectLike[];
  blockedRects?: RectLike[];
  gap?: number;
}

const cloneValue = <T>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const rectsIntersect = (a: RectLike, b: RectLike): boolean =>
  !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );

const isPositiveNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

export const isDuplicateClipboardPayload = (
  value: unknown
): value is DuplicateClipboardPayload => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const payload = value as Partial<DuplicateClipboardPayload>;
  if (payload.version !== NODE_DUPLICATE_CLIPBOARD_VERSION) {
    return false;
  }

  if (
    !payload.node ||
    typeof payload.node !== 'object' ||
    typeof payload.node.id !== 'string' ||
    typeof payload.node.position?.x !== 'number' ||
    typeof payload.node.position?.y !== 'number' ||
    typeof payload.node.data?.name !== 'string' ||
    typeof payload.node.data?.displayName !== 'string'
  ) {
    return false;
  }

  if (!Array.isArray(payload.incomingEdges)) {
    return false;
  }

  return payload.incomingEdges.every(
    edge =>
      edge &&
      typeof edge === 'object' &&
      typeof edge.id === 'string' &&
      typeof edge.source === 'string' &&
      typeof edge.target === 'string'
  );
};

export const parseDuplicateClipboardPayload = (
  rawValue: string
): DuplicateClipboardPayload | null => {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as unknown;
    return isDuplicateClipboardPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const buildDuplicateClipboardPayload = (
  node: CustomNodeType,
  incomingEdges: CustomEdgeType[]
): DuplicateClipboardPayload => ({
  version: NODE_DUPLICATE_CLIPBOARD_VERSION,
  node: cloneValue(node),
  incomingEdges: cloneValue(incomingEdges),
});

export const resolveNodeSize = (
  node: Partial<Pick<CustomNodeType, 'width' | 'height' | 'style'>>,
  fallback: { width: number; height: number }
): { width: number; height: number } => {
  const style = node.style as
    | { width?: number | string; height?: number | string }
    | undefined;

  const parsedStyleWidth = Number(style?.width);
  const parsedStyleHeight = Number(style?.height);

  return {
    width:
      node.width ??
      (isPositiveNumber(parsedStyleWidth) ? parsedStyleWidth : fallback.width),
    height:
      node.height ??
      (isPositiveNumber(parsedStyleHeight)
        ? parsedStyleHeight
        : fallback.height),
  };
};

export const findNearestFreeNodePosition = ({
  sourcePosition,
  nodeSize,
  occupiedRects,
  blockedRects = [],
  gap = DEFAULT_PLACEMENT_GAP,
}: FindNearestFreePositionParams): XYPosition => {
  const stepX = nodeSize.width + gap;
  const stepY = nodeSize.height + gap;

  const intersectsAnything = (rect: RectLike) =>
    occupiedRects.some(occupied => rectsIntersect(rect, occupied)) ||
    blockedRects.some(blocked => rectsIntersect(rect, blocked));

  for (let ring = 1; ring <= MAX_RING_RADIUS; ring += 1) {
    for (const [dxUnit, dyUnit] of CANDIDATE_DIRECTIONS) {
      const candidateRect = {
        x: sourcePosition.x + dxUnit * stepX * ring,
        y: sourcePosition.y + dyUnit * stepY * ring,
        width: nodeSize.width,
        height: nodeSize.height,
      };

      if (!intersectsAnything(candidateRect)) {
        return {
          x: candidateRect.x,
          y: candidateRect.y,
        };
      }
    }
  }

  return {
    x: sourcePosition.x + stepX * (MAX_RING_RADIUS + 1),
    y: sourcePosition.y,
  };
};

export const cloneNodeForDuplicate = (
  node: CustomNodeType,
  nextId: string,
  nextPosition: XYPosition
): CustomNodeType => {
  const clonedNode = cloneValue(node);

  return {
    ...clonedNode,
    id: nextId,
    position: nextPosition,
    selected: false,
    dragging: false,
  };
};

export const cloneIncomingEdgesForDuplicate = (
  edges: CustomEdgeType[],
  nextTargetId: string,
  createEdgeId: () => string,
  resolveSubgraphId: (edge: CustomEdgeType) => string | null
): CustomEdgeType[] =>
  cloneValue(edges).map(edge => ({
    ...edge,
    id: createEdgeId(),
    target: nextTargetId,
    subgraphId: resolveSubgraphId(edge),
  }));
