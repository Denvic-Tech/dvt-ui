import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import CenterFocusStrongOutlinedIcon from '@mui/icons-material/CenterFocusStrongOutlined';
import RouteRoundedIcon from '@mui/icons-material/RouteRounded';
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined';
import ViewColumnOutlinedIcon from '@mui/icons-material/ViewColumnOutlined';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import { useTheme } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import {
  buildExplainTree,
  buildLineagePath,
  collectLineageChain,
  type ExplainStep,
  LINEAGE_OP_APPEARANCE,
  type LineageChain,
  type LineagePathRow,
  type LineageRef,
  type NodeField,
  useGetFieldExplanationQuery,
} from '@/entities/data/lineage';
import { selectNodeDefinitionsMap } from '@/entities/node/node-definition';
import {
  selectGraphEdgesRaw,
  selectNodeDataMap,
} from '@/entities/project-editor/graph';
import { getNodeCategoryColor } from '@/entities/project-editor/node-library';
import { useNodeFieldsViewerPreferences } from '@/entities/ui-preferences';

import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { NodeIcon } from '@/shared/ui/node-icon/NodeIcon';
import { Button, Tooltip } from '@/shared/ui/primitives';

import { useLineageRefLabel } from '../lib/useLineageRefLabel';

import { ColumnDescriptionEditor } from './ColumnDescriptionEditor';
import { DescriptionProvenance } from './DescriptionProvenance';
import { LineagePathSkeleton } from './NodeFieldsSkeletons';
import {
  AccentTile,
  ChainButton,
  Code,
  DetailFootnote,
  DetailPane,
  DetailSticky,
  GhostIconButton,
  InlineLink,
  LineColumnNote,
  LineName,
  LineNote,
  LineText,
  LineTitle,
  MutedText,
  NodeTile,
  PathFade,
  SegmentButton,
  Segmented,
  StepLine,
  Tile,
  viewerTokens,
} from './NodeFieldsViewer.styles';
import { TruncatedLineText } from './TruncatedLineText';

const GAP_REASON_LABEL: Record<string, string> = {
  deps_unknown: 'Часть источников колонки не определена',
  column_not_found: 'Колонка не найдена в lineage проекта',
};

const UpArrow = ({ dashed, branch }: { dashed: boolean; branch: number }) => {
  const color = viewerTokens(useTheme()).text4;

  return (
    <div
      aria-hidden='true'
      style={{
        display: 'flex',
        height: 24,
        justifyContent: 'center',
        marginLeft: branch * 22,
        width: 34,
      }}
    >
      <svg
        width='10'
        height='24'
        viewBox='0 0 10 24'
        style={{ display: 'block', overflow: 'visible' }}
      >
        {dashed ? (
          <>
            <path
              d='M5 24V6'
              fill='none'
              stroke={color}
              strokeWidth='1.25'
              strokeLinecap='round'
              strokeDasharray='1.5 3'
            />
            <path
              d='M5 6V3.5M1.75 6.75L5 3.5l3.25 3.25'
              fill='none'
              stroke={color}
              strokeWidth='1.25'
              strokeLinecap='round'
              strokeLinejoin='round'
            />
          </>
        ) : (
          <path
            d='M5 24V3.5M1.75 6.75L5 3.5l3.25 3.25'
            fill='none'
            stroke={color}
            strokeWidth='1.25'
            strokeLinecap='round'
            strokeLinejoin='round'
          />
        )}
      </svg>
    </div>
  );
};

const useStepNode = (step: ExplainStep) => {
  const nodeId = step.node_id ?? step.ref.node_id ?? null;
  const nodeData = useAppSelector(state =>
    nodeId ? selectNodeDataMap(state)[nodeId] : undefined
  );
  const definition = useAppSelector(state =>
    nodeData?.name ? selectNodeDefinitionsMap(state)[nodeData.name] : undefined
  );

  return {
    nodeId,
    name:
      nodeData?.displayName ||
      step.node_name ||
      definition?.display_name ||
      nodeData?.name ||
      'Нода',
    iconKey: definition?.icon_key ?? null,
    /** Название шаблона ноды (тип), а не пользовательское имя. */
    templateName: definition?.display_name || nodeData?.name || null,
    categoryColor: definition ? getNodeCategoryColor(definition) : null,
  };
};

const SourceTableText = ({ sourceRef }: { sourceRef: LineageRef }) => {
  const label = useLineageRefLabel(sourceRef);
  return (
    <>
      Из таблицы <Code>{label?.owner}</Code>
    </>
  );
};

interface StepTextProps {
  row: LineagePathRow;
  columnNames: ReadonlySet<string>;
  onJump: (name: string) => void;
}

const InputsList = ({
  inputs,
  columnNames,
  onJump,
}: {
  inputs: ExplainStep[];
  columnNames: ReadonlySet<string>;
  onJump: (name: string) => void;
}) => {
  const columns = Array.from(
    new Set(
      inputs
        .map(input => input.column ?? input.ref.column ?? null)
        .filter((column): column is string => Boolean(column))
    )
  );

  return (
    <>
      {columns.map((column, index) => (
        <Fragment key={column}>
          {index ? ', ' : ''}
          {columnNames.has(column) ? (
            <InlineLink type='button' onClick={() => onJump(column)}>
              {column}
            </InlineLink>
          ) : (
            <Code>{column}</Code>
          )}
        </Fragment>
      ))}
    </>
  );
};

const StepText = ({ row, columnNames, onJump }: StepTextProps) => {
  const { step, inputs, sourceRef } = row;
  const label = LINEAGE_OP_APPEARANCE[step.op].label;

  switch (step.op) {
    case 'source':
      return sourceRef ? (
        <SourceTableText sourceRef={sourceRef} />
      ) : (
        <>{step.text || 'Прочитана из источника'}</>
      );
    case 'rename': {
      const from = inputs[0]?.column;
      return from && step.column ? (
        <>
          <Code>{from}</Code> → <Code>{step.column}</Code>
        </>
      ) : (
        <>{label}</>
      );
    }
    case 'compute':
    case 'aggregate':
    case 'merge':
      return inputs.length ? (
        <>
          {label} из{' '}
          <InputsList
            inputs={inputs}
            columnNames={columnNames}
            onJump={onJump}
          />
        </>
      ) : (
        <>{step.text || label}</>
      );
    case 'unknown':
      return <>Происхождение не определено</>;
    default:
      return null;
  }
};

interface StepRowProps {
  row: LineagePathRow;
  currentNodeId: string;
  selectedColumn: string;
  columnNames: ReadonlySet<string>;
  onJump: (name: string) => void;
  onShowOnCanvas: (nodeId: string) => void;
}

const NodeStepRow = ({
  row,
  currentNodeId,
  selectedColumn,
  columnNames,
  onJump,
  onShowOnCanvas,
}: StepRowProps) => {
  const { step } = row;
  const node = useStepNode(step);
  const dim = row.isPassThrough;
  const isCurrent = node.nodeId === currentNodeId;
  const text = <StepText row={row} columnNames={columnNames} onJump={onJump} />;

  return (
    <StepLine branch={row.branch} data-testid='widgets/node-fields-viewer/step'>
      <Tooltip
        placement='top'
        title={node.templateName ?? ''}
        disableHoverListener={!node.templateName}
      >
        <NodeTile
          dim={dim}
          tint={node.categoryColor}
          aria-label={node.templateName ?? undefined}
        >
          <NodeIcon iconKey={node.iconKey} size={18} />
        </NodeTile>
      </Tooltip>
      <div style={{ flex: 1, minWidth: 0 }}>
        <LineTitle>
          <LineName dim={dim}>{node.name}</LineName>
          {isCurrent ? (
            <LineNote>эта нода</LineNote>
          ) : step.column && step.column !== selectedColumn ? (
            <LineColumnNote>{step.column}</LineColumnNote>
          ) : null}
        </LineTitle>
        {step.op === 'pass' ? (
          <LineText>
            <MutedText>Без изменений</MutedText>
          </LineText>
        ) : (
          <TruncatedLineText hint={step.text || null}>{text}</TruncatedLineText>
        )}
      </div>
      {node.nodeId && !isCurrent ? (
        <Tooltip placement='top' title='Показать на холсте'>
          <GhostIconButton
            type='button'
            className='step-action'
            aria-label={`Показать ноду «${node.name}» на холсте`}
            onClick={() => onShowOnCanvas(node.nodeId!)}
          >
            <CenterFocusStrongOutlinedIcon sx={{ fontSize: 16 }} />
          </GhostIconButton>
        </Tooltip>
      ) : null}
    </StepLine>
  );
};

const DatasetStepRow = ({ row }: { row: LineagePathRow }) => {
  const label = useLineageRefLabel(row.step.ref);

  return (
    <StepLine branch={row.branch} data-testid='widgets/node-fields-viewer/step'>
      <Tile>
        <TableChartOutlinedIcon sx={{ fontSize: 18 }} />
      </Tile>
      <div style={{ flex: 1, minWidth: 0 }}>
        <LineTitle>
          <LineName>{label?.owner}</LineName>
          <LineNote>источник</LineNote>
        </LineTitle>
        <LineText>
          Поле <Code>{label?.column ?? '—'}</Code>
        </LineText>
      </div>
    </StepLine>
  );
};

interface ColumnLineageProps {
  projectId: string;
  nodeId: string;
  port: string | null;
  field: NodeField;
  columnTypes: ReadonlyMap<string, string>;
  columnNames: ReadonlySet<string>;
  onJump: (name: string) => void;
  onShowOnCanvas: (nodeId: string) => void;
  onShowChainOnCanvas: (chain: LineageChain, column: string) => void;
}

const ColumnLineageComponent = ({
  projectId,
  nodeId,
  port,
  field,
  columnTypes,
  columnNames,
  onJump,
  onShowOnCanvas,
  onShowChainOnCanvas,
}: ColumnLineageProps) => {
  const graphEdges = useAppSelector(selectGraphEdgesRaw);
  const { showFullPath, setShowFullPath } = useNodeFieldsViewerPreferences();
  const { data, currentData, error, isFetching, refetch } =
    useGetFieldExplanationQuery({
      projectId,
      nodeId,
      port,
      column: field.name,
      direction: 'upstream',
    });

  // Путь новой колонки грузится: пока не истекла задержка скелетона,
  // панель целиком (шапка, счётчики, путь) остаётся в состоянии предыдущей
  // колонки и переключается на новую одним кадром — без промежуточной
  // смеси «новая шапка + старый путь».
  const isPathLoading = isFetching && !currentData;
  const showPathSkeleton = useDelayedLoading(isPathLoading);
  const staleData = isPathLoading && !showPathSkeleton ? data : undefined;
  const shownData = currentData ?? staleData;

  const [loadedField, setLoadedField] = useState(field);
  useEffect(() => {
    if (currentData) {
      setLoadedField(field);
    }
  }, [currentData, field]);
  const shownField = !currentData && staleData ? loadedField : field;
  const columnType = columnTypes.get(shownField.name);

  const tree = useMemo(
    () => (shownData ? buildExplainTree(shownData) : null),
    [shownData]
  );
  const path = useMemo(
    () => buildLineagePath(tree, showFullPath),
    [tree, showFullPath]
  );
  const hasHidden = path.totalCount > path.changesCount;
  // Пока путь грузится, переключатель держит сохранённый режим и не
  // блокируется — иначе подсветка прыгает между кнопками после ответа.
  const isPathLoaded = Boolean(shownData);
  const isFullPathActive = !isPathLoaded || hasHidden ? showFullPath : true;
  const gaps = shownData?.gaps ?? [];

  // Цепочку строим только по пути выбранной колонки, не по оставшемуся на
  // экране пути предыдущей.
  const canShowChain = Boolean(currentData) && !showPathSkeleton;
  const showChain = () => {
    if (!currentData) {
      return;
    }
    const chain = collectLineageChain(tree, graphEdges);
    if (chain.nodeIDs.length) {
      onShowChainOnCanvas(chain, field.name);
    }
  };

  const renderPath = () => {
    if (showPathSkeleton) {
      return <LineagePathSkeleton />;
    }

    if (!shownData) {
      if (isPathLoading) {
        return null;
      }
      return (
        <DetailFootnote>
          <span>
            {error && 'message' in error
              ? error.message
              : 'Не удалось загрузить путь колонки.'}
          </span>
          <Button size='xs' variant='outline' onClick={() => refetch()}>
            Повторить
          </Button>
        </DetailFootnote>
      );
    }

    if (!path.rows.length) {
      return <DetailFootnote>Путь колонки не определён.</DetailFootnote>;
    }

    return (
      <PathFade>
        {path.rows.map((row, index) => {
          const previous = path.rows[index - 1];
          const dashed =
            row.isPassThrough ||
            row.collapsedBefore > 0 ||
            Boolean(previous?.isPassThrough);

          return (
            <Fragment key={`${row.step.ref.key}:${index}`}>
              <UpArrow dashed={dashed} branch={row.branch} />
              {row.step.ref.kind === 'ds' ? (
                <DatasetStepRow row={row} />
              ) : (
                <NodeStepRow
                  row={row}
                  currentNodeId={nodeId}
                  selectedColumn={shownField.name}
                  columnNames={columnNames}
                  onJump={onJump}
                  onShowOnCanvas={onShowOnCanvas}
                />
              )}
            </Fragment>
          );
        })}
        {shownData.truncated ? (
          <DetailFootnote>
            Путь показан не до конца: достигнут предел глубины.
          </DetailFootnote>
        ) : null}
        {gaps.map(gap => (
          <DetailFootnote key={`${gap.ref.key}:${gap.reason}`}>
            <WarningAmberRoundedIcon
              sx={{ color: 'warning.main', fontSize: 15 }}
            />
            <span>
              {GAP_REASON_LABEL[gap.reason] ?? gap.detail ?? gap.reason}
              {gap.ref.column ? <> · {gap.ref.column}</> : null}
            </span>
          </DetailFootnote>
        ))}
      </PathFade>
    );
  };

  return (
    <DetailPane data-testid='widgets/node-fields-viewer/lineage'>
      <DetailSticky>
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            gap: 8,
            marginBottom: 16,
          }}
        >
          <Segmented role='tablist' aria-label='Режим пути' sx={{ flex: 1 }}>
            <SegmentButton
              type='button'
              role='tab'
              active={!isFullPathActive}
              aria-selected={!isFullPathActive}
              disabled={isPathLoaded && !hasHidden}
              onClick={() => setShowFullPath(false)}
            >
              Только изменения
              <i>{shownData ? path.changesCount : ''}</i>
            </SegmentButton>
            <SegmentButton
              type='button'
              role='tab'
              active={isFullPathActive}
              aria-selected={isFullPathActive}
              onClick={() => setShowFullPath(true)}
            >
              Весь путь
              <i>{shownData ? path.totalCount : ''}</i>
            </SegmentButton>
          </Segmented>
          <Tooltip
            placement='top'
            title='Подсветить на холсте все ноды и связи, через которые прошла колонка'
          >
            <span style={{ display: 'flex', flexShrink: 0 }}>
              <ChainButton
                type='button'
                disabled={!canShowChain}
                onClick={showChain}
              >
                <RouteRoundedIcon sx={{ fontSize: 16 }} />
                На холсте
              </ChainButton>
            </span>
          </Tooltip>
        </div>
        <StepLine>
          <AccentTile>
            <ViewColumnOutlinedIcon sx={{ fontSize: 17 }} />
          </AccentTile>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LineTitle>
              <LineName>{shownField.name}</LineName>
              {columnType ? <LineNote>{columnType}</LineNote> : null}
              <DescriptionProvenance field={shownField} />
            </LineTitle>
            <ColumnDescriptionEditor
              key={`${nodeId}:${port ?? ''}:${shownField.name}`}
              projectId={projectId}
              nodeId={nodeId}
              port={port}
              field={shownField}
              columnType={columnType ?? null}
            />
          </div>
        </StepLine>
      </DetailSticky>
      {renderPath()}
    </DetailPane>
  );
};

export const ColumnLineage = memo(ColumnLineageComponent);
