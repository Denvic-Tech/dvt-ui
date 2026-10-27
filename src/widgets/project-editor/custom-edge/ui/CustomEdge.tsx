import { memo, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { BaseEdge, EdgeProps } from '@xyflow/react';

import { useLineageEdgeRole } from '@/entities/project-editor/lineage-highlight';

import {
  CUSTOM_EDGE_BASE_STROKE,
  getCustomEdgeUiGradient,
} from '../lib/gradient.ts';

const SELECTED_EDGE_STROKE_WIDTH = 11.5;
const DEFAULT_EDGE_STROKE_WIDTH = 10;
/**
 * «Поток» цепочки lineage: обводка — повторяющийся горизонтальный градиент,
 * в каждом периоде которого есть яркая полоса; градиент равномерно
 * сдвигается, и полосы бегут по связи от источника к потребителю.
 */
const LINEAGE_FLOW_PERIOD_PX = 220;
const LINEAGE_FLOW_DURATION = '2.2s';
const LINEAGE_FLOW_STOPS: Array<[offset: number, opacity: number]> = [
  [0, 0.35],
  [0.55, 0.35],
  [0.85, 1],
  [1, 0.35],
];

const getRealEdgeID = (data: EdgeProps['data']): string | null => {
  const value = data?.['realEdgeId'];
  return typeof value === 'string' ? value : null;
};

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

  const theme = useTheme();
  const uiGradient = getCustomEdgeUiGradient(props.data);
  const lineageRole = useLineageEdgeRole(edgeID, getRealEdgeID(props.data));
  const isLineageEdge = lineageRole === 'highlighted';

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

  const lineageFlowId = `lineage-flow-${edgeID.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  // Связь, идущая справа налево, получает поток в обратную сторону, чтобы
  // полосы всё равно двигались от источника к потребителю.
  const lineageFlowShift =
    targetX >= sourceX ? LINEAGE_FLOW_PERIOD_PX : -LINEAGE_FLOW_PERIOD_PX;

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
      {isLineageEdge ? (
        <defs>
          <linearGradient
            id={lineageFlowId}
            gradientUnits='userSpaceOnUse'
            spreadMethod='repeat'
            x1={sourceX}
            y1={0}
            x2={sourceX + LINEAGE_FLOW_PERIOD_PX}
            y2={0}
          >
            {LINEAGE_FLOW_STOPS.map(([offset, opacity]) => (
              <stop
                key={offset}
                offset={offset}
                stopColor={theme.palette.primary.main}
                stopOpacity={opacity}
              />
            ))}
            <animateTransform
              attributeName='gradientTransform'
              type='translate'
              from='0 0'
              to={`${lineageFlowShift} 0`}
              dur={LINEAGE_FLOW_DURATION}
              repeatCount='indefinite'
            />
          </linearGradient>
        </defs>
      ) : null}
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
            stroke: isLineageEdge ? `url(#${lineageFlowId})` : stroke,
            opacity:
              lineageRole === 'dimmed'
                ? 0.18
                : selected || isLineageEdge
                  ? 1
                  : 0.92,
            transition: 'opacity .25s ease, stroke .25s ease',
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
