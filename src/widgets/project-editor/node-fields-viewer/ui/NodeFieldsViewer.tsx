import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import Box from '@mui/material/Box';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { useNodeData } from '@/features/node/manage-node-data';
import { useRequestGraphNodeFocus } from '@/features/project-editor/focus-node';

import {
  filterNodeFields,
  isFieldChanged,
  lineageApi,
  type LineageChain,
  NODE_FIELDS_STATUS_APPEARANCE,
  type NodeField,
  useGetNodeFieldsQuery,
} from '@/entities/data/lineage';
import { useNodeFieldsViewer } from '@/entities/node/node-fields-viewer';
import { lineageHighlightActions } from '@/entities/project-editor/lineage-highlight';

import { useDelayedLoading } from '@/shared/lib/hooks/useDelayedLoading';
import { Button, Dialog, Tooltip } from '@/shared/ui/primitives';

import { getPortColumnTypes } from '../lib/columnTypes';

import { ColumnLineage } from './ColumnLineage';
import { type ColumnsGroup, ColumnsList } from './ColumnsList';
import {
  ColumnLineageSkeleton,
  ColumnsListSkeleton,
} from './NodeFieldsSkeletons';
import {
  CenteredState,
  GhostIconButton,
  HeaderSubtitle,
  HeaderTitle,
  SegmentButton,
  Segmented,
  SpinIcon,
  ViewerBody,
  ViewerHeader,
  ViewerRoot,
} from './NodeFieldsViewer.styles';

const plural = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1];
  }
  return forms[2];
};

const pickInitialColumn = (fields: NodeField[]) =>
  (fields.find(isFieldChanged) ?? fields[0])?.name ?? null;

export interface NodeFieldsPanelProps {
  nodeID: string;
  /**
   * Закрыть окно, в котором показана панель. Вызывается и при переходе на
   * холст («Показать на холсте», «На холсте»).
   */
  onClose: () => void;
  /**
   * Панель встроена в другое окно (каталог данных): без кнопки закрытия и
   * обработки Esc (её берёт на себя окно), высота — по контейнеру.
   */
  embedded?: boolean;
}

export const NodeFieldsPanel = ({
  nodeID,
  onClose,
  embedded = false,
}: NodeFieldsPanelProps) => {
  const projectId = useAppSelector(
    state => state.projects.selectedProject?.id ?? null
  );
  const nodeMetadata = useAppSelector(
    state => state.nodeMetadata.nodeMetadataByID[nodeID]
  );
  const { nodeData } = useNodeData(nodeID);
  const requestGraphNodeFocus = useRequestGraphNodeFocus();
  const dispatch = useAppDispatch();

  const [port, setPort] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { data, currentData, error, isError, isFetching, refetch } =
    useGetNodeFieldsQuery(
      projectId ? { projectId, nodeId: nodeID, port } : skipToken,
      { refetchOnMountOrArgChange: true }
    );

  // Первая загрузка: скелетон только если ответ дольше задержки. Смена
  // порта (данные прошлого порта уже есть) показывает скелетон сразу.
  const isInitialLoading = !data && isFetching;
  const showInitialSkeleton = useDelayedLoading(isInitialLoading);
  const isPortSwitching = Boolean(data) && !currentData && isFetching;

  // Перезапрос уже загруженных данных (кнопка «Обновить», фоновый запрос при
  // открытии): данные остаются на месте, крутится иконка обновления.
  const isRevalidating = useAppSelector(state =>
    Object.values(state.lineageApi.queries).some(
      query => query?.status === 'pending' && query.data !== undefined
    )
  );
  const isRefreshSpinning = useDelayedLoading(isRevalidating, {
    delay: 0,
    minDuration: 600,
  });

  const fields = useMemo(() => currentData?.fields ?? [], [currentData]);
  const columnNames = useMemo(
    () => new Set(fields.map(field => field.name)),
    [fields]
  );
  const columnTypes = useMemo(
    () => getPortColumnTypes(nodeMetadata, currentData?.port),
    [nodeMetadata, currentData?.port]
  );
  const changedCount = useMemo(
    () => fields.filter(isFieldChanged).length,
    [fields]
  );

  const groups = useMemo<ColumnsGroup[]>(() => {
    const matched = filterNodeFields(fields, query);
    return [
      {
        id: 'changed' as const,
        title: 'Изменены',
        items: matched.filter(isFieldChanged),
      },
      {
        id: 'same' as const,
        title: 'Без изменений',
        items: matched.filter(field => !isFieldChanged(field)),
      },
    ].filter(group => group.items.length);
  }, [fields, query]);
  const visibleFields = useMemo(
    () => groups.flatMap(group => group.items),
    [groups]
  );

  // Новый ответ (обновление, другой порт) может не содержать выбранную
  // колонку — тогда выбираем первую изменённую, как при открытии.
  const selectedField = fields.find(field => field.name === selected) ?? null;
  useEffect(() => {
    if (fields.length && !selectedField) {
      setSelected(pickInitialColumn(fields));
    }
  }, [fields, selectedField]);

  const scrollToColumn = useCallback((name: string) => {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector<HTMLElement>(`[data-col="${CSS.escape(name)}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    });
  }, []);

  const jumpToColumn = useCallback(
    (name: string) => {
      setQuery('');
      setSelected(name);
      scrollToColumn(name);
    },
    [scrollToColumn]
  );

  // Обновляем и состав колонок, и путь выбранной колонки: оба ответа
  // строятся по графу и устаревают одновременно.
  const refreshLineage = useCallback(() => {
    dispatch(
      lineageApi.util.invalidateTags(['NodeFields', 'FieldExplanation'])
    );
  }, [dispatch]);

  const showChainOnCanvas = useCallback(
    (chain: LineageChain, column: string) => {
      dispatch(
        lineageHighlightActions.show({
          ...chain,
          column,
          nodeName:
            nodeData?.displayName ||
            currentData?.node_name ||
            nodeData?.name ||
            'Нода',
        })
      );
      onClose();
    },
    [currentData?.node_name, dispatch, nodeData, onClose]
  );

  const showOnCanvas = useCallback(
    (targetNodeId: string) => {
      onClose();
      requestGraphNodeFocus(targetNodeId);
    },
    [onClose, requestGraphNodeFocus]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (embedded) {
          return;
        }
        event.preventDefault();
        if (query) {
          setQuery('');
        } else {
          onClose();
        }
        return;
      }

      const target = event.target as HTMLElement | null;
      const isTyping =
        target !== searchRef.current &&
        (target?.isContentEditable ||
          target?.tagName === 'INPUT' ||
          target?.tagName === 'TEXTAREA');
      if (isTyping) {
        return;
      }

      if (event.key === '/' && target !== searchRef.current) {
        event.preventDefault();
        searchRef.current?.focus();
        return;
      }

      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (!visibleFields.length) {
          return;
        }
        event.preventDefault();
        const index = visibleFields.findIndex(field => field.name === selected);
        const nextIndex = Math.max(
          0,
          Math.min(
            visibleFields.length - 1,
            index + (event.key === 'ArrowDown' ? 1 : -1)
          )
        );
        const next = visibleFields[nextIndex];
        setSelected(next.name);
        scrollToColumn(next.name);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [embedded, onClose, query, scrollToColumn, selected, visibleFields]);

  // Порты берём из последнего успешного ответа, чтобы переключатель не
  // пропадал, пока грузится ответ для другого порта.
  const availablePorts = data?.available_ports ?? [];
  const activePort = port ?? data?.port ?? null;
  const nodeName =
    nodeData?.displayName || currentData?.node_name || nodeData?.name || 'Нода';
  const statusAppearance =
    currentData && currentData.status !== 'resolved'
      ? NODE_FIELDS_STATUS_APPEARANCE[currentData.status]
      : null;

  const subtitle = currentData
    ? [
        nodeName,
        currentData.port,
        `${fields.length} ${plural(fields.length, ['колонка', 'колонки', 'колонок'])}${
          changedCount
            ? `, ${changedCount} ${plural(changedCount, ['изменена', 'изменены', 'изменено'])}`
            : ''
        }`,
      ].join(' · ')
    : nodeName;

  const renderBody = () => {
    if (!projectId) {
      return (
        <CenteredState>
          <strong>Проект не выбран</strong>
          <p>Откройте проект, чтобы посмотреть состав колонок ноды.</p>
        </CenteredState>
      );
    }

    if (showInitialSkeleton || isPortSwitching) {
      return (
        <ViewerBody aria-busy='true'>
          <ColumnsListSkeleton />
          <ColumnLineageSkeleton />
        </ViewerBody>
      );
    }

    if (isInitialLoading) {
      return <ViewerBody aria-busy='true' />;
    }

    if (isError || !currentData) {
      return (
        <CenteredState>
          <strong>Не удалось загрузить колонки</strong>
          {error && 'message' in error ? <p>{error.message}</p> : null}
          <Button size='sm' variant='outline' onClick={() => refetch()}>
            Повторить
          </Button>
        </CenteredState>
      );
    }

    if (!fields.length) {
      return (
        <CenteredState>
          <strong>Колонки не найдены</strong>
          <p>
            {currentData.status === 'resolved'
              ? 'На этом порту нет колонок.'
              : currentData.detail ||
                'Запустите проект до этой ноды или проверьте её настройки, чтобы восстановить состав колонок.'}
          </p>
        </CenteredState>
      );
    }

    return (
      <ViewerBody aria-busy={isRevalidating}>
        <ColumnsList
          groups={groups}
          query={query}
          selected={selectedField?.name ?? null}
          columnTypes={columnTypes}
          searchRef={searchRef}
          listRef={listRef}
          onQueryChange={setQuery}
          onSelect={setSelected}
        />
        {selectedField ? (
          <ColumnLineage
            projectId={projectId}
            nodeId={nodeID}
            port={currentData.port}
            field={selectedField}
            columnTypes={columnTypes}
            columnNames={columnNames}
            onJump={jumpToColumn}
            onShowOnCanvas={showOnCanvas}
            onShowChainOnCanvas={showChainOnCanvas}
          />
        ) : null}
      </ViewerBody>
    );
  };

  return (
    <ViewerRoot
      sx={embedded ? { height: '100%', maxHeight: 'none' } : {}}
      data-testid='widgets/node-fields-viewer/panel'
    >
      <ViewerHeader>
        <div style={{ flex: 1, minWidth: 0 }}>
          <HeaderTitle id='node-fields-viewer-title'>
            {currentData?.role === 'input'
              ? 'Колонки на входе'
              : 'Колонки на выходе'}
          </HeaderTitle>
          <HeaderSubtitle>
            {subtitle}
            {statusAppearance ? (
              <Tooltip
                placement='bottom-start'
                title={
                  currentData?.detail ||
                  currentData?.reason ||
                  statusAppearance.description
                }
              >
                <Box component='span' sx={{ color: 'warning.main' }}>
                  {` · ${statusAppearance.label}`}
                </Box>
              </Tooltip>
            ) : null}
          </HeaderSubtitle>
        </div>
        {availablePorts.length > 1 ? (
          <Segmented
            role='tablist'
            aria-label='Порт ноды'
            sx={{ flexShrink: 0, height: 30 }}
          >
            {availablePorts.map(portName => (
              <SegmentButton
                key={portName}
                type='button'
                role='tab'
                active={portName === activePort}
                aria-selected={portName === activePort}
                onClick={() => setPort(portName)}
              >
                {portName}
              </SegmentButton>
            ))}
          </Segmented>
        ) : null}
        <Tooltip placement='bottom' title='Обновить'>
          <span>
            <GhostIconButton
              type='button'
              aria-label='Обновить'
              aria-busy={isRefreshSpinning}
              disabled={!projectId}
              onClick={() => {
                if (!isRevalidating) {
                  refreshLineage();
                }
              }}
            >
              <SpinIcon active={isRefreshSpinning}>
                <RefreshRoundedIcon sx={{ fontSize: 17 }} />
              </SpinIcon>
            </GhostIconButton>
          </span>
        </Tooltip>
        {embedded ? null : (
          <GhostIconButton type='button' aria-label='Закрыть' onClick={onClose}>
            <CloseRoundedIcon sx={{ fontSize: 18 }} />
          </GhostIconButton>
        )}
      </ViewerHeader>
      {renderBody()}
    </ViewerRoot>
  );
};

const NodeFieldsViewerComponent = () => {
  const { open, nodeID, closeViewer } = useNodeFieldsViewer();

  if (!open || !nodeID) {
    return null;
  }

  return (
    <Dialog
      open
      maxWidth={false}
      disableEscapeKeyDown
      aria-labelledby='node-fields-viewer-title'
      data-testid='widgets/node-fields-viewer/dialog'
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(22, 24, 46, 0.3)',
          },
        },
        paper: {
          sx: {
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(22, 24, 46, 0.22)',
            maxWidth: 'calc(100% - 48px)',
            width: 920,
          },
        },
      }}
      onClose={closeViewer}
    >
      <NodeFieldsPanel key={nodeID} nodeID={nodeID} onClose={closeViewer} />
    </Dialog>
  );
};

export const NodeFieldsViewer = memo(NodeFieldsViewerComponent);
