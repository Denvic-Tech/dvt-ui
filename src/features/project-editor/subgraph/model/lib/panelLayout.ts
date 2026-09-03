import type { XYPosition } from '@xyflow/react';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SizedNodePosition {
  id: string;
  position: XYPosition;
  width: number;
  height: number;
}

export interface SubgraphPanelLayout extends Rect {}

export interface BuildPanelLayoutOptions {
  paddingX?: number;
  paddingTop?: number;
  paddingBottom?: number;
  minWidth?: number;
  minHeight?: number;
}

const DEFAULT_PADDING_X = 80;
const DEFAULT_PADDING_TOP = 56;
const DEFAULT_PADDING_BOTTOM = 64;
const DEFAULT_MIN_WIDTH = 520;
const DEFAULT_MIN_HEIGHT = 340;
const PUSH_AWAY_GAP = 24;

const getNodeRect = (node: SizedNodePosition): Rect => ({
  x: node.position.x,
  y: node.position.y,
  width: Math.max(1, node.width),
  height: Math.max(1, node.height),
});

export const rectIntersects = (a: Rect, b: Rect): boolean => {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
};

export const pointInRect = (
  point: XYPosition,
  rect: Rect,
  margin = 0
): boolean => {
  return (
    point.x >= rect.x + margin &&
    point.x <= rect.x + rect.width - margin &&
    point.y >= rect.y + margin &&
    point.y <= rect.y + rect.height - margin
  );
};

export const buildPanelLayoutFromMembers = (
  members: SizedNodePosition[],
  options: BuildPanelLayoutOptions = {}
): SubgraphPanelLayout => {
  const {
    paddingX = DEFAULT_PADDING_X,
    paddingTop = DEFAULT_PADDING_TOP,
    paddingBottom = DEFAULT_PADDING_BOTTOM,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
  } = options;

  if (members.length === 0) {
    return {
      x: 0,
      y: 0,
      width: minWidth,
      height: minHeight,
    };
  }

  const rects = members.map(getNodeRect);
  const minX = Math.min(...rects.map(rect => rect.x));
  const minY = Math.min(...rects.map(rect => rect.y));
  const maxX = Math.max(...rects.map(rect => rect.x + rect.width));
  const maxY = Math.max(...rects.map(rect => rect.y + rect.height));

  const width = Math.max(maxX - minX + paddingX * 2, minWidth);
  const height = Math.max(maxY - minY + paddingTop + paddingBottom, minHeight);

  return {
    x: minX - paddingX,
    y: minY - paddingTop,
    width,
    height,
  };
};

export const expandPanelToFitNode = (
  panel: SubgraphPanelLayout,
  node: SizedNodePosition,
  options: {
    threshold?: number;
    padding?: number;
    minWidth?: number;
    minHeight?: number;
  } = {}
): SubgraphPanelLayout => {
  const {
    threshold = 40,
    padding = 72,
    minWidth = DEFAULT_MIN_WIDTH,
    minHeight = DEFAULT_MIN_HEIGHT,
  } = options;

  const nodeRect = getNodeRect(node);

  let nextX = panel.x;
  let nextY = panel.y;
  let nextRight = panel.x + panel.width;
  let nextBottom = panel.y + panel.height;

  if (nodeRect.x - panel.x < threshold) {
    nextX = nodeRect.x - padding;
  }

  if (panel.x + panel.width - (nodeRect.x + nodeRect.width) < threshold) {
    nextRight = nodeRect.x + nodeRect.width + padding;
  }

  if (nodeRect.y - panel.y < threshold) {
    nextY = nodeRect.y - padding;
  }

  if (panel.y + panel.height - (nodeRect.y + nodeRect.height) < threshold) {
    nextBottom = nodeRect.y + nodeRect.height + padding;
  }

  const width = Math.max(nextRight - nextX, minWidth);
  const height = Math.max(nextBottom - nextY, minHeight);

  return {
    x: nextX,
    y: nextY,
    width,
    height,
  };
};

export const computePushAwayNodePositions = (
  panel: SubgraphPanelLayout,
  nodes: SizedNodePosition[]
): Record<string, XYPosition> => {
  const result: Record<string, XYPosition> = {};
  const panelLeft = panel.x;
  const panelTop = panel.y;
  const panelRight = panel.x + panel.width;
  const panelBottom = panel.y + panel.height;
  const panelCenterX = panel.x + panel.width / 2;
  const panelCenterY = panel.y + panel.height / 2;

  for (const node of nodes) {
    const nodeRect = getNodeRect(node);
    if (!rectIntersects(panel, nodeRect)) {
      continue;
    }

    const nodeCenterX = nodeRect.x + nodeRect.width / 2;
    const nodeCenterY = nodeRect.y + nodeRect.height / 2;

    // Shift by the minimal distance required to place the node fully outside
    // the panel, preserving the direction relative to the panel center.
    const moveLeft =
      panelLeft - (nodeRect.x + nodeRect.width) - PUSH_AWAY_GAP;
    const moveRight = panelRight - nodeRect.x + PUSH_AWAY_GAP;
    const moveUp = panelTop - (nodeRect.y + nodeRect.height) - PUSH_AWAY_GAP;
    const moveDown = panelBottom - nodeRect.y + PUSH_AWAY_GAP;

    const horizontalDelta = nodeCenterX >= panelCenterX ? moveRight : moveLeft;
    const verticalDelta = nodeCenterY >= panelCenterY ? moveDown : moveUp;

    if (Math.abs(horizontalDelta) <= Math.abs(verticalDelta)) {
      result[node.id] = {
        x: node.position.x + horizontalDelta,
        y: node.position.y,
      };
      continue;
    }

    result[node.id] = {
      x: node.position.x,
      y: node.position.y + verticalDelta,
    };
  }

  return result;
};
