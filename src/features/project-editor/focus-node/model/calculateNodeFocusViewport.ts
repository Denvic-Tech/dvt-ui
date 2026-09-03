export interface NodeFocusViewport {
  x: number;
  y: number;
  zoom: number;
}

interface CalculateNodeFocusViewportParams {
  nodePosition: {
    x: number;
    y: number;
  };
  nodeSize: {
    width: number;
    height: number;
  };
  viewportSize: {
    width: number;
    height: number;
  };
  zoom: number;
}

export const calculateNodeFocusViewport = ({
  nodePosition,
  nodeSize,
  viewportSize,
  zoom,
}: CalculateNodeFocusViewportParams): NodeFocusViewport => {
  const nodeCenterX = nodePosition.x + nodeSize.width / 2;
  const nodeCenterY = nodePosition.y + nodeSize.height / 2;

  return {
    x: viewportSize.width / 2 - nodeCenterX * zoom,
    y: viewportSize.height / 2 - nodeCenterY * zoom,
    zoom,
  };
};
