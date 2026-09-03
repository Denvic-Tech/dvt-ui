import { memo, useMemo } from 'react';
import { BaseEdge, EdgeProps } from '@xyflow/react';

import {
  CUSTOM_EDGE_BASE_STROKE,
  getCustomEdgeUiGradient,
} from '../lib/gradient.ts';

const SELECTED_EDGE_STROKE_WIDTH = 11.5;
const DEFAULT_EDGE_STROKE_WIDTH = 10;

const CustomEdge_ = (props: EdgeProps) => {
  const {
    id: edgeID,
    interactionWidth,
    markerEnd,
    markerStart,
    sourceX,
    sourceY,
    source,
    style,
    target,
    targetX,
    targetY,
    selected,
  } = props;

  const uiGradient = getCustomEdgeUiGradient(props.data);

  const edgePath = useMemo(() => {
    const horizontalOffset = Math.abs(targetX - sourceX) * 0.3;

    const sourceControlX = sourceX + horizontalOffset;
    const targetControlX = targetX - horizontalOffset;

    return `
      M ${sourceX},${sourceY}
      C ${sourceControlX},${sourceY}
        ${targetControlX},${targetY}
        ${targetX},${targetY}
    `;
  }, [sourceX, sourceY, targetX, targetY]);

  const gradientId = useMemo(() => {
    if (!uiGradient?.sourceColor || !uiGradient?.targetColor) {
      return null;
    }

    return `custom-edge-gradient-${edgeID.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  }, [edgeID, uiGradient?.sourceColor, uiGradient?.targetColor]);

  const stroke = useMemo(() => {
    if (gradientId) {
      return `url(#${gradientId})`;
    }

    return (
      uiGradient?.sourceColor ??
      uiGradient?.targetColor ??
      CUSTOM_EDGE_BASE_STROKE
    );
  }, [gradientId, uiGradient?.sourceColor, uiGradient?.targetColor]);

  return (
    <>
      {gradientId ? (
        <defs>
          <linearGradient
            id={gradientId}
            gradientUnits='userSpaceOnUse'
            x1={sourceX}
            y1={sourceY}
            x2={targetX}
            y2={targetY}
          >
            <stop offset='0%' stopColor={uiGradient?.sourceColor} />
            <stop offset='100%' stopColor={uiGradient?.targetColor} />
          </linearGradient>
        </defs>
      ) : null}
      <g
        data-testid='widgets/project-editor/custom-edge/canvas-edge'
        data-edge-id={edgeID}
        data-source-node-id={source}
        data-target-node-id={target}
      >
        <BaseEdge
          id={edgeID}
          path={edgePath}
          {...(typeof interactionWidth === 'number'
            ? { interactionWidth }
            : {})}
          style={{
            ...(style || {}),
            strokeWidth: selected
              ? SELECTED_EDGE_STROKE_WIDTH
              : DEFAULT_EDGE_STROKE_WIDTH,
            stroke,
            opacity: selected ? 1 : 0.92,
          }}
        />
      </g>
    </>
  );
};

const arePropsEqual = (prevProps: EdgeProps, nextProps: EdgeProps) => {
  const threshold = 0.5;
  const prevGradient = getCustomEdgeUiGradient(prevProps.data);
  const nextGradient = getCustomEdgeUiGradient(nextProps.data);

  return (
    prevProps.id === nextProps.id &&
    Math.abs(prevProps.sourceX - nextProps.sourceX) < threshold &&
    Math.abs(prevProps.sourceY - nextProps.sourceY) < threshold &&
    Math.abs(prevProps.targetX - nextProps.targetX) < threshold &&
    Math.abs(prevProps.targetY - nextProps.targetY) < threshold &&
    prevProps.selected === nextProps.selected &&
    prevGradient?.sourceColor === nextGradient?.sourceColor &&
    prevGradient?.targetColor === nextGradient?.targetColor
  );
};

export const CustomEdge = memo(CustomEdge_, arePropsEqual);
